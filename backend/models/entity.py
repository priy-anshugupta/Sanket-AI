"""Extracted industrial entities linked to safety reports."""

from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.engine import Base


class Entity(Base):
    __tablename__ = "entities"
    __table_args__ = (Index("ix_entities_type_value", "entity_type", "entity_value"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_value: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    report: Mapped["Report"] = relationship(back_populates="entities")
