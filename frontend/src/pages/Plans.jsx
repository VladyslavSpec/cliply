import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/ui/Navbar.jsx'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

const FAQ = [
  { q: 'Is there a free trial for Pro?', a: 'You can use Cliply free forever — 1 repurpose per day. Pro removes all limits. There\'s no separate trial, but you can test the product before upgrading.' },
  { q: 'What video lengths does it support?', a: 'Any YouTube video — from 1-minute shorts to 3-hour podcasts. Longer videos take slightly more processing time but give even more content.' },
  { q: 'Can I cancel my Pro subscription anytime?', a: 'Yes, cancel anytime from your Stripe billing portal. You\'ll keep Pro access until the end of the billing period.' },
  { q: 'Which AI model powers the content generation?', a: 'We use Anthropic\'s Claude Sonnet for content generation and OpenAI\'s Whisper for audio transcription — both leading models in their category.' },
  { q: 'Does it work with YouTube Shorts?', a: 'Yes! YouTube Shorts, regular videos, live stream recordings, and unlisted videos all work as long as they\'re publicly accessible.' },
]

const PIXEL = { fontFamily: "'Press Start 2P', monospace" }
const VT    = { fontFamily: "'VT323', monospace" }

// Pixel corner decorator
function PixelCorners({ color = 'var(--accent-2)' }) {
  const c = { position: 'absolute', width: 8, height: 8, background: color, opacity: 0.7 }
  return <>
    <div style={{ ...c, top: 0, left: 0 }} />
    <div style={{ ...c, top: 0, right: 0 }} />
    <div style={{ ...c, bottom: 0, left: 0 }} />
    <div style={{ ...c, bottom: 0, right: 0 }} />
  </>
}

function FeatureRow({ text, included = true }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <span style={{
        ...PIXEL,
        fontSize: '0.45rem',
        color: included ? '#06B6D4' : 'var(--text-muted)',
        flexShrink: 0,
        marginTop: 2,
        opacity: included ? 1 : 0.4,
      }}>
        {included ? '▶' : '✕'}
      </span>
      <span style={{
        ...VT,
        fontSize: '1.1rem',
        color: included ? 'var(--text-secondary)' : 'var(--text-muted)',
        opacity: included ? 1 : 0.45,
        lineHeight: 1.3,
      }}>
        {text}
      </span>
    </li>
  )
}

export default function Plans() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/create-checkout-session', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError('Failed to start checkout. Please try again.')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 80 }}>
      <Navbar />

      <div className="container">

        {/* Header */}
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          style={{ textAlign: 'center', padding: '60px 0 56px' }}
        >
          <motion.div variants={fadeUp}>
            <span className="section-label">💎 Pricing</span>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} style={{
            ...PIXEL,
            fontSize: 'clamp(1rem, 2.5vw, 1.8rem)',
            fontWeight: 400,
            lineHeight: 1.6,
            letterSpacing: '0.02em',
            marginTop: 16,
            color: 'var(--text-primary)',
          }}>
            Simple, honest pricing
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} style={{
            ...VT,
            fontSize: '1.3rem',
            color: 'var(--text-secondary)',
            marginTop: 16,
            lineHeight: 1.5,
          }}>
            Start free. Upgrade when you need more. No hidden fees.
          </motion.p>
        </motion.div>

        {error && (
          <div style={{
            maxWidth: 800, margin: '0 auto 24px', padding: '14px 18px',
            background: 'rgba(91,75,224,0.08)', border: '2px solid rgba(91,75,224,0.3)',
            borderRadius: 4, color: '#818CF8', ...VT, fontSize: '1.1rem', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Pricing cards */}
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, maxWidth: 820, margin: '0 auto' }}
        >
          {/* Free */}
          <motion.div variants={fadeUp} style={{
            position: 'relative',
            background: 'rgba(7,7,18,0.95)',
            border: '2px solid rgba(91,75,224,0.3)',
            borderRadius: 4,
            padding: '36px 32px 32px',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.7)',
          }}>
            <PixelCorners color="rgba(129,140,248,0.5)" />
            <div style={{ ...PIXEL, fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 20 }}>
              FREE
            </div>
            <div style={{ ...PIXEL, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
              $0
            </div>
            <div style={{ ...VT, fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: 28 }}>
              No credit card required
            </div>
            <ul style={{ listStyle: 'none', marginBottom: 32 }}>
              <FeatureRow text="1 repurpose per day" />
              <FeatureRow text="TikTok hooks (3 variations)" />
              <FeatureRow text="LinkedIn post" />
              <FeatureRow text="Twitter thread (5–7 tweets)" />
              <FeatureRow text="Newsletter section" />
              <FeatureRow text="Whisper AI transcription" />
              <FeatureRow text="Unlimited repurposes" included={false} />
              <FeatureRow text="Priority processing" included={false} />
            </ul>
            <Link to="/app" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              Get started free
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div variants={fadeUp} custom={1} style={{
            position: 'relative',
            background: 'rgba(10,8,28,0.97)',
            border: '2px solid rgba(91,75,224,0.6)',
            borderRadius: 4,
            padding: '36px 32px 32px',
            boxShadow: '4px 4px 0 rgba(91,75,224,0.35), 0 0 40px rgba(91,75,224,0.1)',
          }}>
            <PixelCorners color="var(--accent)" />
            {/* Popular badge */}
            <div style={{
              position: 'absolute', top: -2, right: 24,
              ...PIXEL, fontSize: '0.42rem',
              background: 'var(--accent)', color: '#fff',
              padding: '6px 10px', letterSpacing: '0.08em',
              borderRadius: '0 0 4px 4px',
            }}>
              POPULAR
            </div>
            <div style={{ ...PIXEL, fontSize: '0.55rem', color: 'var(--accent-2)', letterSpacing: '0.12em', marginBottom: 20 }}>
              PRO
            </div>
            <div style={{ ...PIXEL, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
              $19
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginLeft: 8 }}>/mo</span>
            </div>
            <div style={{ ...VT, fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: 28 }}>
              <span style={{ textDecoration: 'line-through', marginRight: 8 }}>$31.99</span>
              · Save 40%
            </div>
            <ul style={{ listStyle: 'none', marginBottom: 32 }}>
              <FeatureRow text="Unlimited repurposes" />
              <FeatureRow text="TikTok hooks (3 variations)" />
              <FeatureRow text="LinkedIn post" />
              <FeatureRow text="Twitter thread (5–7 tweets)" />
              <FeatureRow text="Newsletter section" />
              <FeatureRow text="Whisper AI transcription" />
              <FeatureRow text="Priority processing" />
              <FeatureRow text="Cancel anytime" />
            </ul>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading
                ? <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Redirecting...</>
                : 'Upgrade to Pro →'}
            </button>
            <p style={{ ...VT, marginTop: 12, fontSize: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Secure checkout via Stripe · Cancel anytime
            </p>
          </motion.div>
        </motion.div>

        {/* FAQ */}
        <div style={{ maxWidth: 680, margin: '72px auto 0' }}>
          <h2 style={{
            ...PIXEL,
            fontSize: 'clamp(0.75rem, 1.5vw, 1.1rem)',
            fontWeight: 400,
            textAlign: 'center',
            marginBottom: 36,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
          }}>
            FAQ
          </h2>
          {FAQ.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                borderBottom: '1px solid rgba(91,75,224,0.2)',
                padding: '20px 0',
              }}
            >
              <div style={{ ...VT, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                ▶ {item.q}
              </div>
              <div style={{ ...VT, fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.a}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(91,75,224,0.15)',
          marginTop: 80, padding: '40px 0',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
        }}>
          <Link to="/" className="navbar-logo" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>
            <div className="navbar-logo-icon" style={{ width: 26, height: 26, fontSize: '0.75rem' }}>C</div>
            Cliply
          </Link>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['Privacy', '/static/privacy.html'], ['Terms', '/static/terms.html'], ['Home', '/']].map(([label, href]) => (
              href.startsWith('/static')
                ? <a key={label} href={href} style={{ ...VT, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1.05rem' }}>{label}</a>
                : <Link key={label} to={href} style={{ ...VT, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1.05rem' }}>{label}</Link>
            ))}
          </div>
          <div style={{ ...VT, fontSize: '1rem', color: 'var(--text-muted)' }}>© 2026 Cliply.</div>
        </footer>
      </div>
    </div>
  )
}
