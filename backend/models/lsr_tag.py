"""IOGP Life-Saving Rule tags linked to safety reports."""

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.engine import Base


class LSRTag(Base):
    __tablename__ = "lsr_tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rule_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    similarity: Mapped[float] = mapped_column(Float, nullable=False)

    report: Mapped["Report"] = relationship(back_populates="lsr_tags")
