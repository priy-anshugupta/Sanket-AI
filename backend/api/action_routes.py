"""
SANKET · AI — CAPA Actions API Routes
Manage corrective & preventive actions, SLA deadlines, and dispatch work orders.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from typing import Optional
import uuid

from backend.db.engine import get_db
from backend.models.action import Action
from backend.models.report import Report

router = APIRouter(prefix="/api/actions", tags=["CAPA Actions"])


class CreateActionRequest(BaseModel):
    report_id: str
    action_type: str = Field(..., description="INVESTIGATION, REPAIR, SHUTDOWN, INSPECTION")
    priority: str = Field(default="HIGH", pattern="^(CRITICAL|HIGH|ROUTINE)$")
    assigned_to: Optional[str] = "Field Safety Lead"
    notes: Optional[str] = None


class UpdateActionStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(OPEN|IN_PROGRESS|PENDING_VERIFICATION|CLOSED)$")
    verification_notes: Optional[str] = None


@router.post("")
async def create_action(req: CreateActionRequest, db: AsyncSession = Depends(get_db)):
    """
    Create and dispatch a new CAPA Work Order linked to a report.
    Sets SLA due date automatically based on priority:
    - CRITICAL: 24 Hours
    - HIGH: 48 Hours
    - ROUTINE: 7 Days
    """
    report_res = await db.execute(select(Report).where(Report.id == req.report_id))
    report = report_res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Referenced report not found")

    # Calculate SLA due date
    now = datetime.utcnow()
    if req.priority == "CRITICAL":
        due = now + timedelta(hours=24)
    elif req.priority == "HIGH":
        due = now + timedelta(hours=48)
    else:
        due = now + timedelta(days=7)

    action = Action(
        id=str(uuid.uuid4()),
        report_id=req.report_id,
        action_type=req.action_type,
        priority=req.priority,
        assigned_to=req.assigned_to,
        due_date=due,
        notes=req.notes,
        status="OPEN",
        created_at=now,
    )
    report.status = "ACTION_DISPATCHED"
    db.add(action)
    await db.commit()

    return {
        "id": action.id,
        "report_id": action.report_id,
        "action_type": action.action_type,
        "priority": action.priority,
        "status": action.status,
        "due_date": action.due_date.isoformat(),
        "message": "CAPA Work Order successfully generated and assigned."
    }


@router.get("")
async def list_actions(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """List all CAPA actions sorted by due date and creation time."""
    query = select(Action)
    if status:
        query = query.where(Action.status == status)
    query = query.order_by(Action.due_date.asc(), desc(Action.created_at))

    result = await db.execute(query)
    actions = result.scalars().all()

    return {
        "actions": [
            {
                "id": a.id,
                "report_id": a.report_id,
                "action_type": a.action_type,
                "priority": a.priority,
                "assigned_to": a.assigned_to,
                "status": a.status,
                "notes": a.notes,
                "due_date": a.due_date.isoformat() if a.due_date else None,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in actions
        ]
    }


@router.patch("/{action_id}/status")
async def update_action_status(
    action_id: str,
    req: UpdateActionStatusRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update lifecycle status of a CAPA action (e.g. IN_PROGRESS -> CLOSED)."""
    result = await db.execute(select(Action).where(Action.id == action_id))
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.status = req.status
    if req.verification_notes:
        action.notes = (action.notes or "") + f"\n[Verification]: {req.verification_notes}"
    action.updated_at = datetime.utcnow()

    await db.commit()
    return {"id": action.id, "status": action.status, "message": "Action status updated."}
