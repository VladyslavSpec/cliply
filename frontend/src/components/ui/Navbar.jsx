import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ onCreateClick }) {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleCreate = (e) => {
    if (onCreateClick) { e.preventDefault(); onCreateClick() }
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-inner">
          {/* Logo — left */}
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">C</div>
            Cliply
          </Link>

          {/* Center links */}
          <ul className="navbar-nav">
            <li>
              <a href={location.pathname === '/' ? '#how-it-works' : '/#how-it-works'}>
                How it works
              </a>
            </li>
            <li>
              <a href="/app" onClick={handleCreate}>Create</a>
            </li>
            <li>
              <Link to="/plans">Pricing</Link>
            </li>
          </ul>

          {/* Right — single CTA */}
          <div className="navbar-actions">
            <a
              href="/app"
              className="btn btn-primary"
              onClick={handleCreate}
            >
              Start Free →
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
