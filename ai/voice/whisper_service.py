"""
SANKET · AI — Whisper Voice Audio Transcriber
Offline speech-to-text service for local voice safety observations.
Supports multilingual transcription (Assamese, Hindi, Bengali, English).
"""

import os
import tempfile


class VoiceTranscriber:
    """
    Local Whisper STT service with offline multilingual speech processing.
    """

    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self._model = None
        self._initialized = False

    def initialize(self):
        """Lazy load OpenAI Whisper model."""
        if self._initialized:
            return
        try:
            import whisper
            print(f"[VoiceTranscriber] Loading Whisper model: {self.model_size}...")
            self._model = whisper.load_model(self.model_size)
            self._initialized = True
            print("[VoiceTranscriber] Whisper model loaded successfully.")
        except Exception as e:
            print(f"[VoiceTranscriber] Whisper load warning: {e}")

    def transcribe_audio_file(self, file_bytes: bytes, filename: str = "audio.wav") -> dict:
        """
        Transcribe audio bytes using local Whisper.
        Returns dict with detected language, text, and segments.
        """
        if not self._initialized:
            self.initialize()

        if self._model is None:
            # Fallback mock for environments without audio drivers or GPU/CPU setup
            return {
                "text": "Oil seepage detected near Pump-04 flange joint during routine rounds.",
                "language": "en",
                "duration": 4.5,
                "mocked": True,
            }

        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(filename)[1] or ".wav", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            result = self._model.transcribe(tmp_path, fp16=False)
            return {
                "text": result.get("text", "").strip(),
                "language": result.get("language", "en"),
                "segments": result.get("segments", []),
                "mocked": False,
            }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


# Singleton
voice_transcriber = VoiceTranscriber()
