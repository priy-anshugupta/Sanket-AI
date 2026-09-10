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
        Transcribe audio bytes using OpenAI Whisper API (if online) or local Whisper.
        Returns dict with detected language, text, and segments.
        """
        from backend.config.settings import settings
        
        # 1. Try OpenAI Whisper API using official SDK if key is available
        if settings.OPENAI_API_KEY and settings.AI_MODE == "online":
            try:
                import openai
                import io
                
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                ext = os.path.splitext(filename)[1].lower() if filename else ".m4a"
                safe_name = f"voice_input{ext if ext in ['.m4a', '.mp3', '.wav', '.webm', '.ogg', '.3gp', '.mp4', '.aac'] else '.m4a'}"
                
                audio_file = io.BytesIO(file_bytes)
                audio_file.name = safe_name

                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    prompt="Oil India Limited (Upper Assam Basin - Duliajan, Baghjan, Moran, Digboi) frontline safety observation in Assamese (অসমীয়া), Hindi (हिंदी), Hinglish, or English. Keywords: গেছ লিক, পাইপলাইন ফাটিছে, বিঅ'পি, জুই, চেল্টাৰ পিট, ভাল্ভ বেয়া, চাপ বাঢ়িছে, gas leak, pressure kick, BOP valve weeping, crude oil spill, H2S gas odor, scaffolding fall hazard, high voltage 33kV, pipe burst, aag, blast, valve kharab, LOTO isolation.",
                )

                text = getattr(transcription, "text", "").strip()
                if text:
                    print(f"[Whisper SDK] Transcribed ({safe_name}): {text}")
                    # Detect Indic script vs Latin
                    lang = "hi" if any('\u0900' <= c <= '\u097F' for c in text) else "as" if any('\u0980' <= c <= '\u09FF' for c in text) else "en"
                    return {
                        "text": text,
                        "language": lang,
                        "duration": 3.0,
                        "mocked": False,
                    }
            except Exception as err:
                print(f"[Whisper SDK] OpenAI Whisper SDK error: {err}")

        # 2. Local Whisper fallback
        if not self._initialized:
            self.initialize()

        if self._model is None:
            return {
                "text": "",
                "language": "en",
                "duration": 0.0,
                "mocked": False,
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
        except Exception as e:
            print(f"[VoiceTranscriber] Local Whisper error: {e}")
            return {
                "text": "",
                "error": str(e)
            }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


# Singleton
voice_transcriber = VoiceTranscriber()
