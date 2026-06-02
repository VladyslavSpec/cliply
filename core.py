import os
import re
import json
import urllib.request
import urllib.parse
import anthropic
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
from youtube_transcript_api.proxies import WebshareProxyConfig, GenericProxyConfig


def _build_ytt():
    webshare_user = os.environ.get("WEBSHARE_USERNAME", "")
    webshare_pass = os.environ.get("WEBSHARE_PASSWORD", "")

    # Clear any system proxy vars to avoid conflicts
    for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
        os.environ.pop(key, None)

    if webshare_user and webshare_pass:
        proxy_url = f"http://{webshare_user}:{webshare_pass}@p.webshare.io:80"
        return YouTubeTranscriptApi(proxy_config=GenericProxyConfig(
            http_url=proxy_url,
            https_url=proxy_url,
        ))

    return YouTubeTranscriptApi()


def _extract_video_id(url: str) -> str:
    for p in [r"(?:v=|youtu\.be/|embed/|shorts/)([A-Za-z0-9_-]{11})"]:
        m = re.search(p, url)
        if m:
            return m.group(1)
    raise ValueError("Cannot extract video ID from URL")


def _get_title_oembed(url: str) -> str:
    try:
        oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(url)}&format=json"
        with urllib.request.urlopen(oembed_url, timeout=5) as r:
            data = json.loads(r.read())
            return data.get("title", "Unknown")
    except Exception:
        return "Unknown"


def get_transcript(url: str) -> tuple[str, str]:
    video_id = _extract_video_id(url)
    title = _get_title_oembed(url)
    ytt = _build_ytt()

    try:
        transcript_list = ytt.fetch(video_id, languages=["en", "en-US", "en-GB", "a.en"])
    except (NoTranscriptFound, TranscriptsDisabled):
        all_transcripts = ytt.list(video_id)
        transcript_obj = next(iter(all_transcripts), None)
        if transcript_obj is None:
            raise ValueError("This video has no subtitles. Please try a video with auto-generated captions.")
        transcript_list = transcript_obj.fetch()

    text = " ".join(
        chunk.text if hasattr(chunk, "text") else chunk["text"]
        for chunk in transcript_list
    )
    return text, title


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
