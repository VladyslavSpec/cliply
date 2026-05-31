import os
import re
import json
import tempfile
import urllib.request
import urllib.parse
import anthropic


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


def get_transcript(url: str) -> tuple[str, str]:
    """Fetch transcript via Supadata API + title via oEmbed."""
    api_key = os.environ.get("SUPADATA_API_KEY", "")
    if not api_key:
        raise ValueError("SUPADATA_API_KEY not configured")

    # Get title
    title = _get_title_oembed(url)

    # Get transcript
    req_url = f"https://api.supadata.ai/v1/youtube/transcript?url={urllib.parse.quote(url)}&text=true"
    request = urllib.request.Request(req_url, headers={
        "x-api-key": api_key,
        "Authorization": f"Bearer {api_key}",
    })
    try:
        with urllib.request.urlopen(request, timeout=30) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise ValueError(f"Supadata error {e.code}: {body}")

    content = data.get("content", "") or data.get("transcript", "") or data.get("text", "")
    if not content:
        raise ValueError(f"No transcript returned. Response: {data}")

    return content, title


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
