import os
import tempfile
import streamlit as st
from core import download_audio, transcribe, generate_content

st.set_page_config(
    page_title="VideoRepurpose AI",
    page_icon="🎬",
    layout="wide",
)

# ── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.title("⚙️ Settings")
    api_key = st.text_input(
        "Anthropic API Key",
        type="password",
        value=os.environ.get("ANTHROPIC_API_KEY", ""),
        placeholder="sk-ant-...",
    )
    st.caption("Get yours at [console.anthropic.com](https://console.anthropic.com)")
    st.markdown("---")
    st.markdown("**How it works:**")
    st.markdown("1. Paste a YouTube URL\n2. We download & transcribe the audio\n3. Claude AI writes all the content")

# ── Main ─────────────────────────────────────────────────────────────────────
st.title("🎬 VideoRepurpose AI")
st.subheader("Turn any YouTube video into TikTok hooks, LinkedIn posts, Twitter threads & newsletters")
st.markdown("---")

url = st.text_input(
    "YouTube URL",
    placeholder="https://www.youtube.com/watch?v=...",
    label_visibility="collapsed",
)

ready = bool(url and api_key)
btn = st.button("🚀 Repurpose This Video", type="primary", disabled=not ready)

if url and not api_key:
    st.warning("Enter your Anthropic API key in the sidebar to continue.")

if btn and ready:
    with tempfile.TemporaryDirectory() as tmp_dir:

        # Step 1 — Download
        with st.status("⬇️ Downloading audio from YouTube...", expanded=True) as s:
            try:
                audio_path, video_title = download_audio(url, tmp_dir)
                s.update(label=f"✅ Downloaded: **{video_title}**", state="complete", expanded=False)
            except Exception as e:
                s.update(label="❌ Download failed", state="error")
                st.error(str(e))
                st.stop()

        # Step 2 — Transcribe
        with st.status("🎙️ Transcribing audio (Whisper)...", expanded=True) as s:
            try:
                transcript = transcribe(audio_path)
                s.update(label="✅ Transcription complete", state="complete", expanded=False)
            except Exception as e:
                s.update(label="❌ Transcription failed", state="error")
                st.error(str(e))
                st.stop()

        # Step 3 — Generate
        with st.status("🤖 Generating content with Claude AI...", expanded=True) as s:
            try:
                content = generate_content(transcript, api_key)
                s.update(label="✅ Content ready!", state="complete", expanded=False)
            except Exception as e:
                s.update(label="❌ Generation failed", state="error")
                st.error(str(e))
                st.stop()

    # ── Results ──────────────────────────────────────────────────────────────
    st.success("✅ Done! Your repurposed content is ready below.")

    with st.expander("📄 View full transcript"):
        st.text_area("Transcript", transcript, height=200, label_visibility="collapsed")

    tab1, tab2, tab3, tab4 = st.tabs(["🎵 TikTok Hooks", "💼 LinkedIn", "🐦 Twitter / X", "📧 Newsletter"])

    with tab1:
        st.markdown("### 3 TikTok Hook Ideas")
        for i, hook in enumerate(content.get("tiktok_hooks", []), 1):
            st.info(f"**Hook {i}:** {hook}")

    with tab2:
        st.markdown("### LinkedIn Post")
        st.text_area("", content.get("linkedin_post", ""), height=220, label_visibility="collapsed")

    with tab3:
        st.markdown("### Twitter / X Thread")
        st.text_area("", content.get("twitter_thread", ""), height=300, label_visibility="collapsed")

    with tab4:
        st.markdown("### Email Newsletter Section")
        st.text_area("", content.get("newsletter", ""), height=300, label_visibility="collapsed")
