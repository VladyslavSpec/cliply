import os
import re
import json
import tempfile
import urllib.request
import urllib.parse
import yt_dlp
import whisper
import anthropic
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled


def _extract_video_id(url: str) -> str:
    for p in [r"(?:v=|youtu\.be/|embed/|shorts/)([A-Za-z0-9_-]{11})"]:
        m = re.search(p, url)
        if m:
            return m.group(1)
    raise ValueError("Cannot extract video ID from URL")


def _get_title_oembed(url: str) -> str:
    """Fetch video title via YouTube oEmbed — no auth, no bot detection."""
    try:
        oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(url)}&format=json"
        with urllib.request.urlopen(oembed_url, timeout=5) as r:
            data = json.loads(r.read())
            return data.get("title", "Unknown")
    except Exception:
        return "Unknown"


def get_transcript_fast(url: str) -> tuple[str, str]:
    """YouTube captions + oEmbed title — fully bot-proof, no yt-dlp."""
    video_id = _extract_video_id(url)
    title = _get_title_oembed(url)
    transcript_list = YouTubeTranscriptApi.get_transcript(
        video_id, languages=["en", "en-US", "en-GB", "a.en"]
    )
    text = " ".join(chunk["text"] for chunk in transcript_list)
    return text, title


def download_audio(url: str, output_dir: str) -> tuple[str, str]:
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": os.path.join(output_dir, "%(id)s.%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_id = info["id"]
        title = info.get("title", "Unknown")
        return os.path.join(output_dir, f"{video_id}.mp3"), title


def transcribe(audio_path: str) -> str:
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    return result["text"]


def get_transcript(url: str) -> tuple[str, str]:
    """Return (transcript, title). Uses captions if available, else Whisper."""
    try:
        return get_transcript_fast(url)
    except (NoTranscriptFound, TranscriptsDisabled, Exception):
        with tempfile.TemporaryDirectory() as tmp:
            audio_path, title = download_audio(url, tmp)
            transcript = transcribe(audio_path)
            return transcript, title


def generate_content(transcript: str, api_key: str) -> dict:
    trimmed = transcript[:12000] if len(transcript) > 12000 else transcript

    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""You are a content repurposing expert. Based on this video transcript, create engaging repurposed content.

TRANSCRIPT:
{trimmed}

Generate the following content and return it as valid JSON with exactly these keys:
- "tiktok_hooks": array of 3 strings, each a TikTok hook idea with timestamp suggestion (e.g. "0:00-0:30 | Hook: ...")
- "linkedin_post": string, professional LinkedIn post (150-200 words)
- "twitter_thread": string, Twitter/X thread of 5-7 numbered tweets separated by newlines
- "newsletter": string, email newsletter section with subject line and body (200-250 words)

Return ONLY the JSON object. No extra text, no markdown code blocks."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)
