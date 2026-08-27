"""
SANKET · AI — Near-Miss Multiplier / Temporal Cluster Detection
7-day rolling window cluster detection for systemic risk escalation.
"""

from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.models.entity import Entity
from backend.models.report import Report
from backend.models.alert import SystemicAlert
from backend.config.settings import settings
import uuid


class ClusterDetector:
    """
    Near-Miss Multiplier (F7): Detects >= 3 correlated events
    at the same equipment/location within a 7-day window.

    When triggered:
    - ALL connected reports are escalated to HIGH
    - A SystemicAlert record is created
    - Original sif_score is preserved for audit trail
    """

    async def check_clusters(
        self,
        db: AsyncSession,
        entity_type: str,
        entity_value: str,
        window_days: int = None,
        min_events: int = None,
    ) -> dict:
        """
        Check if an entity has reached the cluster threshold.

        Returns:
            {
                "cluster_alert": bool,
                "event_count": int,
                "report_ids": list[str],
                "escalated_sif_score": float (0.92 if triggered),
                "severity": str
            }
        """
        window = window_days or settings.CLUSTER_WINDOW_DAYS
        threshold = min_events or settings.CLUSTER_MIN_EVENTS

        cutoff = datetime.utcnow() - timedelta(days=window)

        # Query: count distinct reports mentioning this entity in the window
        result = await db.execute(
            select(Entity.report_id)
            .join(Report, Report.id == Entity.report_id)
            .where(Entity.entity_type == entity_type)
            .where(Entity.entity_value == entity_value)
            .where(Report.submitted_at >= cutoff)
            .distinct()
        )
        report_ids = [row[0] for row in result.all()]
        event_count = len(report_ids)

        if event_count >= threshold:
            return {
                "cluster_alert": True,
                "event_count": event_count,
                "report_ids": report_ids,
                "escalated_sif_score": 0.92,
                "severity": "CRITICAL_SYSTEMIC_PRECURSOR",
                "entity_type": entity_type,
                "entity_value": entity_value,
                "window_days": window,
            }

        return {
            "cluster_alert": False,
            "event_count": event_count,
            "report_ids": report_ids,
            "severity": "NORMAL",
        }

    async def escalate_cluster(
        self,
        db: AsyncSession,
        cluster_info: dict,
    ) -> SystemicAlert | None:
        """
        Escalate all reports in a cluster to HIGH and create alert.
        Preserves original sif_score for audit trail.
        """
        if not cluster_info.get("cluster_alert"):
            return None

        # Check if alert already exists for this entity
        existing = await db.execute(
            select(SystemicAlert)
            .where(SystemicAlert.cluster_node == cluster_info["entity_value"])
            .where(SystemicAlert.status == "ACTIVE")
        )
        if existing.scalar_one_or_none():
            return None  # Don't duplicate

        # Create systemic alert
        alert = SystemicAlert(
            id=str(uuid.uuid4()),
            cluster_node=cluster_info["entity_value"],
            cluster_type=cluster_info["entity_type"],
            report_ids=cluster_info["report_ids"],
            event_count=cluster_info["event_count"],
            window_days=cluster_info["window_days"],
            status="ACTIVE",
        )
        db.add(alert)

        # Escalate all connected reports
        for report_id in cluster_info["report_ids"]:
            result = await db.execute(
                select(Report).where(Report.id == report_id)
            )
            report = result.scalar_one_or_none()
            if report and report.sif_label != "HIGH":
                # Preserve original score
                report.original_sif_score = report.sif_score
                report.sif_label = "HIGH"
                report.is_sif_precursor = True
                report.escalated_by_cluster = alert.id

        await db.flush()
        print(f"[Multiplier] 🔴 CLUSTER ALERT: {cluster_info['entity_value']} — {cluster_info['event_count']} events in {cluster_info['window_days']}d → ALL escalated to HIGH")

        return alert


# Singleton
cluster_detector = ClusterDetector()
