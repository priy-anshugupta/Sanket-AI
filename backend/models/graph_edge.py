"""Persistent snapshot of NetworkX safety-signal graph edges."""

from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.engine import Base


class GraphEdge(Base):
    __tablename__ = "graph_edges"
    __table_args__ = (Index("ix_graph_edges_source_target", "source_node", "target_node"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_node: Mapped[str] = mapped_column(String(255), nullable=False)
    target_node: Mapped[str] = mapped_column(String(255), nullable=False)
    edge_type: Mapped[str] = mapped_column(String(100), nullable=False)
    weight: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    report_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
