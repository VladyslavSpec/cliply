import os
import json
import tempfile
import yt_dlp
import whisper
import anthropic


def download_audio(url: str, output_dir: str) -> str:
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


def generate_content(transcript: str, api_key: str) -> dict:
    # Trim transcript to avoid token overflow (~12k chars ≈ 3k tokens)
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

    # Strip markdown code block if Claude wrapped it anyway
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)
