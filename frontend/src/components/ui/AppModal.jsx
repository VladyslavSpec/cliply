import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { id: 'tiktok',     label: '🎵 TikTok',    key: 'tiktok_hooks',   isArray: true  },
  { id: 'linkedin',   label: '💼 LinkedIn',   key: 'linkedin_post',  isArray: false },
  { id: 'twitter',    label: '🐦 Twitter',    key: 'twitter_thread', isArray: false },
  { id: 'newsletter', label: '📧 Newsletter', key: 'newsletter',     isArray: false },
]

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className={`copy-btn ${copied ? 'copied' : ''}`}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600) }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function AppModal({ onClose }) {
  const [url, setUrl]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [activeTab, setActiveTab] = useState('tiktok')

  const submit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const email = localStorage.getItem('cliply_email') || ''
      const res = await fetch('/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), email }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(res.status === 429
          ? 'Daily free limit reached. Upgrade to Pro for unlimited.'
          : d.detail || 'Something went wrong.')
        return
      }
      const d = await res.json()
      setResult(d); setActiveTab('tiktok')
      if (!email) { localStorage.setItem('cliply_last_used', new Date().toDateString()) }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const getContent = (tabId) => {
    if (!result?.content) return []
    const tab = TABS.find(t => t.id === tabId)
    const c = result.content[tab?.key]
    if (!c) return []
    return Array.isArray(c) ? c : [String(c)]
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 20px 20px',
      }}
    >
      {/* Backdrop — click to close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(4,4,13,0.55)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 660,
          maxHeight: 'calc(100vh - 110px)',
          overflowY: 'auto',
          background: 'rgba(7,7,18,0.94)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 24,
          padding: '36px 36px 30px',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 0 80px rgba(232,84,58,0.1), 0 30px 90px rgba(0,0,0,0.8)',
        }}
      >
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          opacity: 0.6,
        }} />

        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          width: 32, height: 32,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%',
          color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'var(--transition)',
          fontFamily: 'inherit',
        }}>✕</button>

        {/* Header */}
        <div style={{ marginBottom: 26 }}>
          <span className="section-label" style={{ display: 'inline-flex', marginBottom: 14 }}>
            ✦ AI Content Repurposing
          </span>
          <h2 style={{
            fontSize: '1.75rem', fontWeight: 900,
            letterSpacing: '-0.035em', color: 'var(--text-primary)',
            lineHeight: 1.15, marginBottom: 8,
          }}>
            Paste your YouTube link
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            We'll transcribe it and generate TikTok hooks, LinkedIn posts, Twitter threads and newsletters instantly.
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <input
            className="input"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={loading}
            required
            autoFocus
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !url.trim()}
            style={{ flexShrink: 0, padding: '12px 20px', fontSize: '0.9rem' }}
          >
            {loading
              ? <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> Processing</>
              : '✨ Repurpose'}
          </button>
        </form>

        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          1 free repurpose per day ·{' '}
          <Link to="/plans" style={{ color: 'var(--accent)', textDecoration: 'none' }} onClick={onClose}>
            Upgrade for unlimited →
          </Link>
        </p>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                padding: '12px 16px', marginBottom: 16, borderRadius: 10,
                background: 'rgba(232,84,58,0.08)', border: '1px solid rgba(232,84,58,0.25)',
                color: '#F97066', fontSize: '0.875rem',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {result.title && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 3 }}>Video</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{result.title}</div>
                </div>
              )}

              {/* Platform tabs */}
              <div className="platform-tabs" style={{ marginBottom: 14 }}>
                {TABS.map(tab => (
                  <button key={tab.id} className={`platform-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                {getContent(activeTab).map((item, i) => (
                  <div key={i} className="result-item" style={{ whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                    {item}
                    <CopyBtn text={item} />
                  </div>
                ))}
                {!getContent(activeTab).length && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No content for this tab.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
