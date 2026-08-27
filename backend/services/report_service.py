"""
SANKET · AI — Report Service
Core business logic for report CRUD and pipeline triggering.
"""

import uuid
import csv
import io
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case
from sqlalchemy.orm import selectinload

from backend.models.report import Report
from backend.models.entity import Entity
from backend.models.feedback import FeedbackLog


class ReportService:
    """
    Business logic for report management.
    All routes and workers funnel through here.
    """

    async def create_report(
        self,
        db: AsyncSession,
        raw_text: str,
        source: str = "text",
        location: Optional[str] = None,
        asset_id: Optional[str] = None,
        activity_type: Optional[str] = None,
        shift: Optional[str] = None,
    ) -> Report:
        """Create a new report record with PENDING status."""
        report = Report(
            id=str(uuid.uuid4()),
            raw_text=raw_text,
            source=source,
            location=location,
            asset_id=asset_id,
            activity_type=activity_type,
            shift=shift,
            status="PENDING",
            created_at=datetime.utcnow(),
            submitted_at=datetime.utcnow(),
        )
        db.add(report)
        await db.flush()
        return report

    async def create_reports_from_csv(
        self, db: AsyncSession, csv_content: str
    ) -> list[Report]:
        """Parse CSV content and create report records."""
        reports = []
        reader = csv.DictReader(io.StringIO(csv_content))

        for row in reader:
            text = row.get("text", row.get("description", row.get("narrative", "")))
            if not text or len(text.strip()) < 3:
                continue

            report = await self.create_report(
                db=db,
                raw_text=text.strip(),
                source="csv",
                location=row.get("location"),
                asset_id=row.get("asset_id", row.get("equipment")),
                activity_type=row.get("activity_type", row.get("activity")),
                shift=row.get("shift"),
            )
            reports.append(report)

            if len(reports) >= 500:  # PRD max batch size
                break

        return reports

    async def get_report(self, db: AsyncSession, report_id: str) -> Report | None:
        """Get a single report with all related data."""
        result = await db.execute(
            select(Report)
            .options(
                selectinload(Report.entities),
                selectinload(Report.lsr_tags),
                selectinload(Report.actions),
                selectinload(Report.feedback_logs),
            )
            .where(Report.id == report_id)
        )
        return result.scalar_one_or_none()

    async def list_reports(
        self,
        db: AsyncSession,
        page: int = 1,
        limit: int = 50,
        sif_label: Optional[str] = None,
        status: Optional[str] = None,
        location: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Report], int]:
        """
        Paginated, filterable report listing for Triage Queue.
        Default sort: SIF score descending (highest risk first).
        """
        query = select(Report).options(
            selectinload(Report.entities),
            selectinload(Report.lsr_tags),
            selectinload(Report.actions),
            selectinload(Report.feedback_logs),
        )

        # Apply filters
        if sif_label:
            query = query.where(Report.sif_label == sif_label)
        if status:
            query = query.where(Report.status == status)
        if location:
            query = query.where(Report.location.ilike(f"%{location}%"))
        if search:
            query = query.where(Report.raw_text.ilike(f"%{search}%"))

        # Count total
        count_query = select(func.count(Report.id))
        if sif_label:
            count_query = count_query.where(Report.sif_label == sif_label)
        if status:
            count_query = count_query.where(Report.status == status)
        if location:
            count_query = count_query.where(Report.location.ilike(f"%{location}%"))

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Sort by SIF score descending, then by creation date
        query = query.order_by(desc(Report.sif_score), desc(Report.created_at))
        query = query.offset((page - 1) * limit).limit(limit)

        result = await db.execute(query)
        reports = result.scalars().unique().all()

        return list(reports), total

    async def update_report_classification(
        self,
        db: AsyncSession,
        report_id: str,
        sif_score: float,
        sif_label: str,
        is_sif_precursor: bool,
        matched_anchor_id: str = None,
        matched_anchor_text: str = None,
        preprocessed_text: str = None,
        language: str = None,
    ) -> Report | None:
        """Update a report with classification results from the pipeline."""
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            return None

        report.sif_score = sif_score
        report.sif_label = sif_label
        report.is_sif_precursor = is_sif_precursor
        report.matched_anchor_id = matched_anchor_id
        report.matched_anchor_text = matched_anchor_text
        report.preprocessed_text = preprocessed_text
        report.language = language
        report.status = "PROCESSING"
        report.updated_at = datetime.utcnow()

        await db.flush()
        return report

    async def complete_report(
        self, db: AsyncSession, report_id: str,
        explanation: str = None, iogp_rule: str = None,
    ) -> Report | None:
        """Mark report as COMPLETED after full pipeline processing."""
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            return None

        report.status = "COMPLETED"
        report.explanation = explanation
        report.iogp_rule = iogp_rule
        report.updated_at = datetime.utcnow()

        await db.flush()
        return report

    async def fail_report(
        self, db: AsyncSession, report_id: str, error_message: str
    ) -> None:
        """Mark report as FAILED with error details."""
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if report:
            report.status = "FAILED"
            report.error_message = error_message
            report.updated_at = datetime.utcnow()
            await db.flush()

    async def add_feedback(
        self,
        db: AsyncSession,
        report_id: str,
        corrected_label: str,
        action: str,
        reason: str = None,
        officer_id: str = None,
    ) -> FeedbackLog:
        """Record human-in-the-loop feedback."""
        report = await self.get_report(db, report_id)
        if not report:
            raise ValueError(f"Report {report_id} not found")

        feedback = FeedbackLog(
            id=str(uuid.uuid4()),
            report_id=report_id,
            original_score=report.sif_score,
            original_label=report.sif_label,
            corrected_label=corrected_label,
            action=action,
            reason=reason,
            officer_id=officer_id,
        )
        db.add(feedback)

        # Update displayed label (preserving original in audit trail)
        report.sif_label = corrected_label
        report.updated_at = datetime.utcnow()

        await db.flush()
        return feedback

    async def get_analytics_summary(self, db: AsyncSession) -> dict:
        """Get analytics summary for dashboard."""
        total = await db.execute(select(func.count(Report.id)))
        high = await db.execute(
            select(func.count(Report.id)).where(Report.sif_label == "HIGH")
        )
        medium = await db.execute(
            select(func.count(Report.id)).where(Report.sif_label == "MEDIUM")
        )
        low = await db.execute(
            select(func.count(Report.id)).where(Report.sif_label == "LOW")
        )
        pending = await db.execute(
            select(func.count(Report.id)).where(Report.status == "PENDING")
        )

        return {
            "total_reports": total.scalar() or 0,
            "high_count": high.scalar() or 0,
            "medium_count": medium.scalar() or 0,
            "low_count": low.scalar() or 0,
            "pending_count": pending.scalar() or 0,
        }

    async def get_heatmap_data(self, db: AsyncSession) -> dict:
        """
        Generate SIF-Precursor Density Heatmap data.
        D_SIF = (Confirmed SIFp Reports / Total Reports) × 100
        """
        result = await db.execute(
            select(
                Report.location,
                Report.activity_type,
                func.count(Report.id).label("total"),
                func.sum(
                    case(
                        (Report.sif_label == "HIGH", 1),
                        (Report.sif_score >= 0.75, 1),
                        else_=0
                    )
                ).label("sif_count"),
            )
            .where(Report.location.isnot(None))
            .where(Report.activity_type.isnot(None))
            .group_by(Report.location, Report.activity_type)
        )
        rows = result.all()

        cells = []
        sites = set()
        activities = set()
        site_totals = {}

        for row in rows:
            location = row[0] or "Unknown"
            activity = row[1] or "Unknown"
            total = row[2] or 0
            sif_count = int(row[3] or 0)
            density = (sif_count / total * 100) if total > 0 else 0.0

            sites.add(location)
            activities.add(activity)

            if location not in site_totals:
                site_totals[location] = {"sif": 0, "total": 0}
            site_totals[location]["sif"] += sif_count
            site_totals[location]["total"] += total

            if density >= 25:
                label = "HIGH"
            elif density >= 10:
                label = "MEDIUM"
            else:
                label = "LOW"

            cells.append({
                "site": location,
                "activity": activity,
                "sif_count": sif_count,
                "total_count": total,
                "density": round(density, 1),
                "label": label,
            })

        site_densities = {}
        for site, data in site_totals.items():
            d = (data["sif"] / data["total"] * 100) if data["total"] > 0 else 0.0
            site_densities[site] = round(d, 1)

        return {
            "sites": sorted(sites),
            "activities": sorted(activities),
            "cells": cells,
            "site_densities": site_densities,
        }


# Singleton
report_service = ReportService()
