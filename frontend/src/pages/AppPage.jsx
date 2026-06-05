import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/ui/Navbar.jsx'

const TABS = [
  { id: 'tiktok', label: '🎵 TikTok Hooks', key: 'tiktok_hooks', isArray: true },
  { id: 'linkedin', label: '💼 LinkedIn', key: 'linkedin_post', isArray: false },
  { id: 'twitter', label: '🐦 Twitter Thread', key: 'twitter_thread', isArray: false },
  { id: 'newsletter', label: '📧 Newsletter', key: 'newsletter', isArray: false },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }
  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function AppPage() {
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('tiktok')
  const [isPro, setIsPro] = useState(false)
  const [usedToday, setUsedToday] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('cliply_email')
    if (stored) {
      setEmail(stored)
      fetch('/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: stored }),
      })
        .then(r => r.json())
        .then(d => setIsPro(d.pro))
        .catch(() => {})
    }
    const today = new Date().toDateString()
    const lastUsed = localStorage.getItem('cliply_last_used')
    setUsedToday(lastUsed === today)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), email }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 429) {
          setError('Daily free limit reached. Upgrade to Pro for unlimited repurposes.')
        } else {
          setError(data.detail || 'Something went wrong. Please try again.')
        }
        return
      }

      const data = await res.json()
      setResult(data)
      setActiveTab('tiktok')

      if (!isPro) {
        const today = new Date().toDateString()
        localStorage.setItem('cliply_last_used', today)
        setUsedToday(true)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTabContent = (tab) => {
    if (!result?.content) return null
    const content = result.content[tab.key]
    if (!content) return null
    if (tab.isArray) return Array.isArray(content) ? content : [content]
    return typeof content === 'string' ? [content] : [JSON.stringify(content)]
  }

  const activeTabDef = TABS.find(t => t.id === activeTab)

  return (
    <div className="app-page">
      <Navbar />

      <div className="app-header">
        <div className="container">
          <h1>Repurpose a Video</h1>
          <p>Paste a YouTube URL to get instant multi-platform content</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        {/* Input section */}
        <div className="app-input-section">
          {!isPro && usedToday && !result && (
            <div className="rate-limit-bar" style={{ marginBottom: 20 }}>
              <span>⚡</span>
              <span>
                You've used your free repurpose today.{' '}
                <Link to="/plans" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  Upgrade to Pro
                </Link>{' '}
                for unlimited access.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="app-input-wrapper">
              <input
                className="input"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading}
                required
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !url.trim()}
                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner" />
                    Processing...
                  </>
                ) : (
                  '✨ Repurpose'
                )}
              </button>
            </div>
          </form>

          {!isPro && email && (
            <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Signed in as {email} · <span style={{ color: 'var(--accent)' }}>Pro</span>
            </p>
          )}
          {!email && (
            <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              1 free repurpose per day ·{' '}
              <Link to="/plans" style={{ color: 'var(--accent)' }}>Upgrade for unlimited</Link>
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            maxWidth: 680, margin: '0 auto 24px',
            padding: '14px 18px',
            background: 'rgba(255,87,87,0.08)',
            border: '1px solid rgba(255,87,87,0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FF8080',
            fontSize: '0.9rem',
          }}>
            {error}
            {error.includes('limit') && (
              <span> <Link to="/plans" style={{ color: 'var(--accent)', fontWeight: 600 }}>Upgrade now →</Link></span>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="app-results">
            {result.title && (
              <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Video title
                </span>
                <p style={{ marginTop: 4, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{result.title}</p>
              </div>
            )}

            <div className="platform-tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`platform-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="result-content">
              <div className="result-title">
                {activeTabDef?.label}
              </div>
              {getTabContent(activeTabDef)?.map((item, i) => (
                <div key={i} className="result-item" style={{ whiteSpace: 'pre-wrap' }}>
                  {item}
                  <CopyButton text={item} />
                </div>
              ))}
              {!getTabContent(activeTabDef)?.length && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No content available for this tab.</p>
              )}
            </div>

            {!isPro && (
              <div style={{
                marginTop: 24,
                padding: '20px 24px',
                background: 'linear-gradient(135deg, rgba(255,87,87,0.08) 0%, rgba(255,87,87,0.03) 100%)',
                border: '1px solid rgba(255,87,87,0.25)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>Want unlimited repurposes?</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Upgrade to Pro for $19/mo and remove all daily limits.
                  </p>
                </div>
                <Link to="/plans" className="btn btn-primary" style={{ flexShrink: 0 }}>
                  Upgrade to Pro →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
