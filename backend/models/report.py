"""Canonical safety-report ORM model."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.engine import Base


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_status_sif_submitted", "status", "sif_label", "submitted_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    preprocessed_text: Mapped[Optional[str]] = mapped_column(Text)
    language: Mapped[Optional[str]] = mapped_column(String(10))
    sif_score: Mapped[Optional[float]] = mapped_column(Float)
    sif_label: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    is_sif_precursor: Mapped[Optional[bool]] = mapped_column(Boolean)
    original_sif_score: Mapped[Optional[float]] = mapped_column(Float)
    matched_anchor_id: Mapped[Optional[str]] = mapped_column(String(100))
    matched_anchor_text: Mapped[Optional[str]] = mapped_column(Text)
    iogp_rule: Mapped[Optional[str]] = mapped_column(String(255))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    asset_id: Mapped[Optional[str]] = mapped_column(String(255))
    activity_type: Mapped[Optional[str]] = mapped_column(String(255))
    shift: Mapped[Optional[str]] = mapped_column(String(50))
    explanation: Mapped[Optional[str]] = mapped_column(Text)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="PENDING", index=True)
    source: Mapped[Optional[str]] = mapped_column(String(50), default="text")
    ingestion_channel: Mapped[Optional[str]] = mapped_column(String(50), default="web")
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    model_version: Mapped[Optional[str]] = mapped_column(String(50), default="v1.0-calibrated")
    escalated_by_cluster: Mapped[Optional[str]] = mapped_column(String(36))
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    entities: Mapped[list["Entity"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    lsr_tags: Mapped[list["LSRTag"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    actions: Mapped[list["Action"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    feedback_logs: Mapped[list["FeedbackLog"]] = relationship(back_populates="report", cascade="all, delete-orphan")
