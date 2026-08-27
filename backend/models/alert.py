"""Near-Miss Multiplier systemic-risk alerts."""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Index, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.engine import Base


class SystemicAlert(Base):
    __tablename__ = "systemic_alerts"
    __table_args__ = (Index("ix_alerts_cluster_node_status", "cluster_node", "status"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    cluster_node: Mapped[str] = mapped_column(String(255), nullable=False)
    cluster_type: Mapped[str] = mapped_column(String(50), nullable=False)
    report_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    event_count: Mapped[int] = mapped_column(Integer, nullable=False)
    window_days: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ACTIVE")
    detected_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
