import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/ui/Navbar.jsx'
import AppModal from '../components/ui/AppModal.jsx'

const ImmersiveScene = lazy(() => import('../components/scene/ImmersiveScene.jsx'))

// ─── Section content ─────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'hero',
    label: '✦ AI-Powered Content Repurposing',
    title: <>One Video.<br /><span style={{ background: 'linear-gradient(135deg,#818CF8,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Every Platform.</span></>,
    subtitle: 'Paste any YouTube URL. Get TikTok hooks, LinkedIn posts, Twitter threads and newsletters — powered by Claude AI.',
    cta: 'hero',
    note: 'Free to start · No credit card required',
  },
  {
    id: 'how',
    label: '⚡ Simple Process',
    title: <>Three steps.<br />Unlimited content.</>,
    subtitle: null,
    items: [
      { num: '01', icon: '🔗', title: 'Paste YouTube URL', desc: 'Any video — tutorials, podcasts, vlogs. Any length.' },
      { num: '02', icon: '🤖', title: 'AI transcribes & analyzes', desc: 'Whisper transcribes audio, Claude extracts key ideas.' },
      { num: '03', icon: '✨', title: 'Get platform content', desc: '4 formats ready to post — no editing needed.' },
    ],
    cta: 'open',
  },
  {
    id: 'platforms',
    label: '📦 What You Get',
    title: <>Four formats.<br />Zero extra work.</>,
    subtitle: null,
    platforms: [
      { icon: '🎵', name: 'TikTok Hooks',    color: 'var(--tiktok)',      desc: '3 viral hooks for the FYP algorithm', detail: 'Each under 15 sec · Tested formats' },
      { icon: '💼', name: 'LinkedIn Post',   color: 'var(--linkedin)',    desc: '150–200 word professional post', detail: 'Proper formatting · CTA included' },
      { icon: '🐦', name: 'Twitter Thread',  color: 'var(--twitter)',     desc: '5–7 tweets, thread-ready format', detail: 'Numbered · Hook + insight + CTA' },
      { icon: '📧', name: 'Newsletter',      color: 'var(--newsletter)',  desc: 'Full email section with subject', detail: 'Subject line · Hook · Takeaways' },
    ],
    cta: 'open',
  },
  {
    id: 'cta',
    label: '🚀 Ready?',
    title: <>Your next viral post<br />is one video away.</>,
    subtitle: 'Stop spending hours writing content from scratch. One URL is all you need.',
    cta: 'open',
    note: '1 free repurpose per day forever · No signup required',
  },
]

const NUM_SECTIONS = SECTIONS.length

// ─── Scroll dot indicator ─────────────────────────────────────────
function ScrollDots({ current }) {
  return (
    <div className="scroll-dots-mobile-hide" style={{
      position: 'fixed', right: 28, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 10, zIndex: 100,
    }}>
      {SECTIONS.map((s, i) => (
        <div key={s.id} style={{
          width: i === current ? 8 : 5,
          height: i === current ? 8 : 5,
          borderRadius: '50%',
          background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.25)',
          transition: 'all 0.3s ease',
          boxShadow: i === current ? '0 0 8px var(--accent)' : 'none',
        }} />
      ))}
    </div>
  )
}

// ─── Section text overlay ─────────────────────────────────────────
const LAYOUTS = {
  hero:      { justify: 'flex-start', align: 'center',    pl: '8%',  pr: '52%', pb: '0',   pt: 80,  maxW: 480, ta: 'left'   },
  how:       { justify: 'center',     align: 'flex-end',  pl: '5%',  pr: '5%',  pb: '4%',  pt: 80,  maxW: 720, ta: 'center' },
  platforms: { justify: 'center',     align: 'flex-end',  pl: '5%',  pr: '5%',  pb: '4%',  pt: 80,  maxW: 620, ta: 'center' },
  cta:       { justify: 'center',     align: 'center',    pl: '5%',  pr: '5%',  pb: '0',   pt: 80,  maxW: 640, ta: 'center' },
}

function SectionOverlay({ section, onOpen, isMobile }) {
  const s = SECTIONS[section]
  if (!s) return null
  const base = LAYOUTS[s.id] || LAYOUTS.cta
  const L = isMobile
    ? { justify: 'center', align: 'center', pl: '5%', pr: '5%', pb: '0', pt: 80, maxW: '95%', ta: 'center' }
    : base

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={s.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: L.align,
          justifyContent: L.justify,
          paddingLeft: L.pl,
          paddingRight: L.pr,
          paddingBottom: L.pb,
          paddingTop: L.pt,
          pointerEvents: 'none',
        }}
      >
        <div style={{ textAlign: L.ta, maxWidth: L.maxW, width: '100%' }}>

          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.28 }}
            style={{ marginBottom: 20 }}
          >
            <span className="section-label">{s.label}</span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.35 }}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: s.id === 'hero' ? 'clamp(1.4rem,3.5vw,2.8rem)' : 'clamp(1rem,2.5vw,1.9rem)',
              fontWeight: 400,
              lineHeight: 1.5,
              letterSpacing: '0.01em',
              marginBottom: 24,
              color: 'var(--text-primary)',
            }}
          >
            {s.title}
          </motion.h2>

          {/* Subtitle */}
          {s.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              style={{
                fontFamily: "'VT323', monospace",
                fontSize: '1.4rem',
                color: 'var(--text-secondary)',
                maxWidth: 520,
                margin: L.ta === 'center' ? '0 auto 36px' : '0 0 28px',
                lineHeight: 1.5,
              }}
            >
              {s.subtitle}
            </motion.p>
          )}

          {/* How it works — 3 items */}
          {s.items && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              style={{ display: 'flex', gap: 16, justifyContent: L.ta === 'center' ? 'center' : 'flex-start', marginBottom: 36, flexWrap: 'wrap' }}
            >
              {s.items.map((item, i) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.5 }}
                  style={{
                    background: 'rgba(7,7,18,0.92)',
                    border: '2px solid rgba(91,75,224,0.45)',
                    borderRadius: 4,
                    padding: '22px 18px 18px',
                    textAlign: 'center',
                    width: 190,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.6), 0 0 20px rgba(91,75,224,0.12)',
                    pointerEvents: 'auto',
                    position: 'relative',
                  }}
                >
                  {/* pixel corner accents */}
                  <div style={{ position:'absolute', top:0, left:0, width:8, height:8, background:'var(--accent-2)', opacity:0.7 }} />
                  <div style={{ position:'absolute', top:0, right:0, width:8, height:8, background:'var(--accent-2)', opacity:0.7 }} />
                  <div style={{ position:'absolute', bottom:0, left:0, width:8, height:8, background:'var(--accent-2)', opacity:0.7 }} />
                  <div style={{ position:'absolute', bottom:0, right:0, width:8, height:8, background:'var(--accent-2)', opacity:0.7 }} />
                  <div style={{ fontFamily:"'Press Start 2P',monospace", fontSize: '1.5rem', color: '#818CF8', marginBottom: 12, lineHeight: 1, textShadow:'0 0 12px rgba(129,140,248,0.6)' }}>{item.num}</div>
                  <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontFamily:"'Press Start 2P',monospace", fontWeight: 400, fontSize: '0.52rem', marginBottom: 8, color: 'var(--text-primary)', lineHeight: 1.7, letterSpacing:'0.02em' }}>{item.title}</div>
                  <div style={{ fontFamily:"'VT323',monospace", fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Platform cards grid */}
          {s.platforms && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                maxWidth: 580,
                margin: '0 auto 36px',
              }}
            >
              {s.platforms.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.32, ease: [0.22,1,0.36,1] }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  style={{
                    background: 'rgba(7,7,18,0.94)',
                    border: `2px solid ${p.color}50`,
                    borderRadius: 4,
                    padding: '20px 18px 16px',
                    textAlign: 'left',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    cursor: 'default',
                    pointerEvents: 'auto',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `4px 4px 0 rgba(0,0,0,0.7), 0 0 16px ${p.color}15`,
                  }}
                >
                  {/* Corner glow */}
                  <div style={{
                    position: 'absolute', top: -16, right: -16,
                    width: 56, height: 56, borderRadius: '50%',
                    background: p.color, opacity: 0.1, filter: 'blur(18px)',
                    pointerEvents: 'none',
                  }} />
                  <div style={{ fontSize: '1.3rem', marginBottom: 10 }}>{p.icon}</div>
                  <div style={{ fontFamily:"'Press Start 2P',monospace", fontWeight: 400, fontSize: '0.5rem', color: p.color, marginBottom: 8, letterSpacing:'0.02em', textShadow:`0 0 8px ${p.color}80` }}>
                    {p.name}
                  </div>
                  <div style={{ fontFamily:"'VT323',monospace", fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.4 }}>
                    {p.desc}
                  </div>
                  <div style={{ fontFamily:"'VT323',monospace", fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {p.detail}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* CTA buttons */}
          {s.cta && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.3 }}
              style={{ display: 'flex', gap: 14, justifyContent: L.ta === 'center' ? 'center' : 'flex-start', flexWrap: 'wrap', pointerEvents: 'auto' }}
            >
              {s.cta === 'hero' ? (
                <>
                  <button className="btn btn-primary" onClick={onOpen} style={{ fontSize: '1rem', padding: '16px 36px' }}>
                    Start Repurposing Free →
                  </button>
                  <Link to="/plans" className="btn btn-ghost" style={{ fontSize: '1rem', padding: '16px 28px' }}>
                    See pricing
                  </Link>
                </>
              ) : s.cta === 'open' ? (
                <button className="btn btn-primary" onClick={onOpen} style={{ fontSize: '1rem', padding: '16px 32px' }}>
                  Try it free →
                </button>
              ) : s.cta}
            </motion.div>
          )}

          {/* Note */}
          {s.note && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              {s.note}
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Scroll hint ──────────────────────────────────────────────────
function ScrollHint({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          style={{
            position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <span>Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            style={{ width: 20, height: 32, border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', justifyContent: 'center', paddingTop: 6 }}
          >
            <div style={{ width: 3, height: 6, background: 'var(--accent)', borderRadius: 2 }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── MAIN LANDING ─────────────────────────────────────────────────
export default function Landing() {
  const scrollProgress = useRef(0)
  const appModeRef = useRef(false)
  const [section, setSection] = useState(0)
  const [appOpen, setAppOpen] = useState(false)
  const scrollContainerRef = useRef(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const openApp = () => {
    appModeRef.current = true
    setAppOpen(true)
    // Push state so browser back button closes modal
    window.history.pushState({ cliplyModal: true }, '')
  }

  const closeApp = () => {
    appModeRef.current = false
    setAppOpen(false)
  }

  // Browser back button closes modal
  useEffect(() => {
    const onPop = () => { if (appModeRef.current) closeApp() }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      if (total <= 0) return
      const p = el.scrollTop / total
      scrollProgress.current = p

      // Determine current section (0-3)
      const s = Math.min(Math.floor(p * NUM_SECTIONS + 0.18), NUM_SECTIONS - 1)
      setSection(prev => prev !== s ? s : prev)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* ── Tall scroll container (drives scroll events) */}
      <div ref={scrollContainerRef} style={{ height: isMobile ? `${NUM_SECTIONS * 90}vh` : `${NUM_SECTIONS * 120}vh` }} />

      {/* ── Fixed viewport: everything lives here */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden',
        background: '#060610',
      }}>
        {/* Three.js canvas — full background */}
        <Suspense fallback={
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 50%, rgba(255,87,87,0.08) 0%, transparent 60%)' }} />
        }>
          <Canvas
            camera={{ position: [0, 0, 7], fov: isMobile ? 70 : 55 }}
            gl={{ antialias: false, powerPreference: 'high-performance' }}
            dpr={isMobile ? 0.45 : 0.65}
            style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
          >
            <ImmersiveScene progress={scrollProgress} appMode={appModeRef} />
          </Canvas>
        </Suspense>

        {/* Soft vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,6,16,0.7) 100%)',
        }} />

        {/* Navbar */}
        <Navbar onCreateClick={openApp} />

        {/* Section text */}
        <SectionOverlay section={section} onOpen={openApp} isMobile={isMobile} />

        {/* Scroll hint (only on first section) */}
        <ScrollHint visible={section === 0} />

        {/* Section dots */}
        <ScrollDots current={section} />

        {/* App modal overlay */}
        <AnimatePresence>
          {appOpen && <AppModal onClose={closeApp} />}
        </AnimatePresence>

        {/* Footer links (always visible at bottom) */}
        <div style={{
          position: 'absolute', bottom: 24, left: 24,
          display: 'flex', gap: 20, zIndex: 100,
        }}>
          {[
            { label: 'Privacy', href: '/static/privacy.html' },
            { label: 'Terms', href: '/static/terms.html' },
          ].map(l => (
            <a key={l.label} href={l.href} style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
