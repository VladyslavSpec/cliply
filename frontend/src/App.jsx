import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Lenis from 'lenis'
import Landing from './pages/Landing.jsx'
import AppPage from './pages/AppPage.jsx'
import Plans from './pages/Plans.jsx'

// Lenis smooth scroll only on non-immersive pages
function SmoothScroll({ children }) {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  useEffect(() => {
    if (isLanding) return // Landing uses native scroll for camera
    const lenis = new Lenis({ duration: 1.1 })
    let rafId
    function raf(time) { lenis.raf(time); rafId = requestAnimationFrame(raf) }
    rafId = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(rafId); lenis.destroy() }
  }, [isLanding])

  return children
}

function AppRoutes() {
  return (
    <SmoothScroll>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/plans" element={<Plans />} />
      </Routes>
    </SmoothScroll>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
