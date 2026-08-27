"""Hash-chained emergency action audit trail."""

from datetime import datetime
import hashlib
import uuid
from typing import Optional

from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.engine import Base


class AuditTrail(Base):
    __tablename__ = "audit_trail"
    __table_args__ = (Index("ix_audit_trail_report_created", "report_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    actor_id: Mapped[Optional[str]] = mapped_column(String(100))
    actor_role: Mapped[Optional[str]] = mapped_column(String(100))
    report_id: Mapped[Optional[str]] = mapped_column(String(36))
    details: Mapped[str] = mapped_column(Text, nullable=False)
    previous_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    entry_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    @staticmethod
    def compute_hash(event_type: str, timestamp: str, details: str, previous_hash: str) -> str:
        """Compute the stable SHA-256 hash used to chain audit entries."""
        payload = f"{event_type}|{timestamp}|{details}|{previous_hash}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()
