"""Human-in-the-loop classification feedback audit records."""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.engine import Base


class FeedbackLog(Base):
    __tablename__ = "feedback_log"
    __table_args__ = (Index("ix_feedback_officer_timestamp", "officer_id", "timestamp"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    original_score: Mapped[Optional[float]] = mapped_column(Float)
    original_label: Mapped[Optional[str]] = mapped_column(String(20))
    corrected_label: Mapped[str] = mapped_column(String(20), nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text)
    officer_id: Mapped[Optional[str]] = mapped_column(String(36))
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    report: Mapped["Report"] = relationship(back_populates="feedback_logs")
