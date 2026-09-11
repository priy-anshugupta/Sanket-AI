"""
SANKET · AI — Pydantic Schemas for Reports
Request/response validation for report endpoints.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ═══════════════════════════════════════════
# Request Schemas
# ═══════════════════════════════════════════

class ReportIngestRequest(BaseModel):
    """Single report ingestion request."""
    text: str = Field(..., min_length=3, max_length=10000, description="Raw report text")
    source: str = Field(default="text", description="Source: text, voice, csv")
    location: Optional[str] = None
    asset_id: Optional[str] = None
    activity_type: Optional[str] = None
    shift: Optional[str] = None


class ReportFeedbackRequest(BaseModel):
    """Human-in-the-loop feedback submission."""
    corrected_label: str = Field(..., pattern="^(HIGH|MEDIUM|LOW)$")
    action: str = Field(..., pattern="^(AGREE|UPGRADE|DOWNGRADE)$")
    reason: Optional[str] = None
    officer_id: Optional[str] = None


class ReportActionRequest(BaseModel):
    """CAPA action creation request."""
    action_type: str = Field(..., description="INVESTIGATION, REPAIR, SHUTDOWN, INSPECTION")
    priority: str = Field(default="HIGH", pattern="^(CRITICAL|HIGH|ROUTINE)$")
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════
# Response Schemas
# ═══════════════════════════════════════════

class EntityResponse(BaseModel):
    id: str
    entity_type: str
    entity_value: str
    confidence: float

    class Config:
        from_attributes = True


class LSRTagResponse(BaseModel):
    id: str
    rule_name: str
    rule_id: str
    similarity: float

    class Config:
        from_attributes = True


class ActionResponse(BaseModel):
    id: str
    action_type: str
    priority: str
    assigned_to: Optional[str]
    due_date: Optional[datetime]
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackResponse(BaseModel):
    id: str
    original_label: Optional[str]
    corrected_label: str
    action: str
    reason: Optional[str]
    officer_id: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    """Full report response with all Layer-1 data."""
    id: str
    raw_text: str
    preprocessed_text: Optional[str]
    language: Optional[str]
    sif_score: Optional[float]
    sif_label: Optional[str]
    is_sif_precursor: Optional[bool]
    matched_anchor_id: Optional[str]
    matched_anchor_text: Optional[str]
    iogp_rule: Optional[str]
    location: Optional[str]
    asset_id: Optional[str]
    activity_type: Optional[str]
    shift: Optional[str]
    explanation: Optional[str]
    status: str
    source: Optional[str]
    created_at: datetime
    entities: list[EntityResponse] = []
    lsr_tags: list[LSRTagResponse] = []
    actions: list[ActionResponse] = []

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    """Paginated report list for Triage Queue."""
    reports: list[ReportResponse]
    total: int
    page: int
    limit: int


class IngestResponse(BaseModel):
    """Response after ingestion."""
    job_id: str
    count: int
    status: str
    message: str
    sif_score: Optional[float] = None
    sif_label: Optional[str] = None
    is_sif_precursor: Optional[bool] = None
    iogp_rule: Optional[str] = None


class HeatmapCell(BaseModel):
    """Single cell in the SIF Density Heatmap."""
    site: str
    activity: str
    sif_count: int
    total_count: int
    density: float
    label: str  # HIGH, MEDIUM, LOW


class HeatmapResponse(BaseModel):
    """Full heatmap response."""
    sites: list[str]
    activities: list[str]
    cells: list[HeatmapCell]
    site_densities: dict[str, float]
