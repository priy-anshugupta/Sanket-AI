"""
SANKET · AI — Voice Observation API Routes
"""

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.db.engine import get_db
from backend.services.report_service import report_service
from backend.workers.pipeline_worker import process_report
from ai.voice.whisper_service import voice_transcriber

router = APIRouter(prefix="/api/voice", tags=["Voice Observation"])


@router.post("/transcribe-and-ingest")
async def transcribe_and_ingest_audio(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    location: Optional[str] = Form(None),
    activity_type: Optional[str] = Form(None),
    shift: Optional[str] = Form("DAY"),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept audio blob (WAV/MP3/WebM), transcribe with Whisper,
    create PENDING safety report, and launch background AI pipeline.
    """
    content = await audio.read()
    transcription = voice_transcriber.transcribe_audio_file(content, audio.filename or "audio.wav")
    text = transcription.get("text", "")

    if not text or len(text.strip()) < 3:
        text = "Voice safety observation: Unspecified anomaly recorded by field worker."

    # Create report
    report = await report_service.create_report(
        db=db,
        raw_text=text,
        source="voice",
        location=location,
        activity_type=activity_type,
        shift=shift,
    )
    await db.commit()

    # Enqueue pipeline
    background_tasks.add_task(process_report, report.id)

    return {
        "job_id": report.id,
        "transcribed_text": text,
        "detected_language": transcription.get("language", "en"),
        "status": "PROCESSING",
        "message": "Audio transcribed and report queued for AI processing."
    }
