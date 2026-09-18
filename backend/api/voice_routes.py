"""
SANKET · AI — Voice & RoIP Radio Observation API Routes
Provides real-time audio transcription and RoIP dispatch stream processing.
"""

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.db.engine import get_db
from backend.services.report_service import report_service
from backend.workers.pipeline_worker import process_report
from ai.voice.whisper_service import voice_transcriber

router = APIRouter(prefix="/api/voice", tags=["Voice Observation"])


@router.post("/transcribe")
async def transcribe_audio_only(
    audio: UploadFile = File(...),
):
    """
    Accept audio blob (WAV/MP3/WebM/OGG) and return transcribed text
    for worker review / editing before final ingestion.
    """
    content = await audio.read()
    try:
        print(f"[Voice API] Received audio upload: '{audio.filename}', size={len(content)} bytes", flush=True)
    except Exception:
        pass

    if not content or len(content) < 50:
        return {"text": "", "status": "NO_AUDIO", "message": "Audio file too short or empty. Hold mic longer while speaking."}

    transcription = voice_transcriber.transcribe_audio_file(content, audio.filename or "recording.webm")
    text = transcription.get("text", "").strip()

    try:
        print(f"[Voice API] Whisper transcription result: '{text}' (lang={transcription.get('language')})", flush=True)
    except Exception:
        print(f"[Voice API] Whisper transcription completed (lang={transcription.get('language')})", flush=True)

    if not text:
        err_msg = transcription.get("error")
        return {
            "text": "",
            "language": "en",
            "confidence": 0.0,
            "duration_seconds": 0.0,
            "status": "NO_SPEECH_DETECTED",
            "message": err_msg or "No speech detected. Please speak closer to phone mic."
        }

    return {
        "text": text,
        "language": transcription.get("language", "en"),
        "confidence": transcription.get("confidence", 0.95),
        "duration_seconds": transcription.get("duration", 3.0),
        "status": "TRANSCRIBED",
    }


@router.post("/transcribe-and-ingest")
async def transcribe_and_ingest_audio(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    location: Optional[str] = Form(None),
    activity_type: Optional[str] = Form(None),
    shift: Optional[str] = Form("DAY"),
    channel: Optional[str] = Form("CH-01"),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept audio blob from RoIP radio gateway, transcribe with Whisper,
    create PENDING safety report, and launch background AI pipeline.
    """
    content = await audio.read()
    if not content or len(content) < 100:
        return {"text": "", "status": "NO_AUDIO", "message": "Audio file too short or empty"}
    transcription = voice_transcriber.transcribe_audio_file(content, audio.filename or "audio.wav")
    text = transcription.get("text", "")

    if not text or len(text.strip()) < 3:
        # Instead of fabricating an observation, explicitly fail and alert the client.
        return {
            "status": "NO_AUDIO", 
            "message": "Transcription failed or no speech detected. Please try again or enter manually."
        }

    # Create report
    report = await report_service.create_report(
        db=db,
        raw_text=text,
        source=f"roip_radio_{channel.lower()}",
        location=location or "Well Pad 7",
        activity_type=activity_type or "Drilling",
        shift=shift or "DAY",
    )
    await db.commit()

    # Enqueue pipeline
    background_tasks.add_task(process_report, report.id)

    return {
        "job_id": report.id,
        "transcribed_text": text,
        "detected_language": transcription.get("language", "en"),
        "status": "PROCESSING",
        "channel": channel,
        "message": "Audio transcribed and report queued for AI processing."
    }
