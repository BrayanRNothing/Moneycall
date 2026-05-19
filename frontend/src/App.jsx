import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Award,
  PhoneCall,
  Phone,
  CalendarDays,
  Menu,
  Bell,
  Settings,
  LogOut,
  X
} from 'lucide-react'

import Dashboard from './pages/Dashboard'
import Portafolio from './pages/Portafolio'
import Quotes from './pages/Quotes'
import Testimonials from './pages/Testimonials'
import Llamadas from './pages/Llamadas'
import Configuracion from './pages/Configuracion'
import MiDia from './pages/MiDia'
import Login from './pages/Login'

function App() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLogin = (u, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (!user) return <Login onLogin={handleLogin} />

  const navigation = [
    { name: 'Mi Día', href: '/mi-dia', icon: CalendarDays },
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Portafolio', href: '/portafolio', icon: Users },
    { name: 'Llamadas', href: '/llamadas', icon: Phone },
    { name: 'Cotizaciones', href: '/quotes', icon: FileText },
    { name: 'Testimonios', href: '/testimonials', icon: Award },
  ]

  // Si no es admin, filtramos vistas (por ejemplo, el gerente ve todo, el vendedor no ve config)
  const navItems = user.isAdmin ? navigation : navigation.filter(n => n.name !== 'Dashboard' || true) // Dejamos todo por ahora, limitaremos la config.

  const isActive = (path) => location.pathname === path

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex md:w-64 flex-col shrink-0 p-4 gap-4" style={{ background: 'var(--bg)', borderRight: '1px solid rgba(163,177,198,0.2)' }}>
        {/* Logo */}
        <div className="neu-card p-4 flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #1a1a1a, #3d3d3d)', boxShadow: '4px 4px 10px rgba(0,0,0,0.25)' }}
          >
            <PhoneCall size={20} />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
              Moneycall
            </h1>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              CRM Proactivo
            </p>
          </div>
        </div>

        {/* Nav Label */}
        <p className="text-[10px] font-bold tracking-widest uppercase px-2" style={{ color: 'var(--text-muted)' }}>Menú</p>

        {/* Nav Items */}
        <nav className="flex flex-col gap-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-semibold text-sm"
                style={active
                  ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)' }
                  : { color: 'var(--text-muted)' }
                }
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-2">
          {user.isAdmin && (
            <>
              <p className="text-[10px] font-bold tracking-widest uppercase px-2 mb-2" style={{ color: 'var(--text-muted)' }}>Gerente</p>
              <Link
                to="/configuracion"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all"
                style={isActive('/configuracion')
                  ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)' }
                  : { color: 'var(--text-muted)' }
                }
              >
                <Settings size={18} strokeWidth={isActive('/configuracion') ? 2.5 : 1.8} />
                Configuración
              </Link>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="neu-card p-3 flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a1a1a, #3d3d3d)' }}
          >
            {user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold truncate leading-tight" style={{ color: 'var(--text)' }}>{user.nombre}</p>
            <p className="text-[9px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.rolCanal}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105 shrink-0"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header
        className="md:hidden px-5 py-4 flex items-center justify-between sticky top-0 z-50 animate-fade-in"
        style={{ background: 'var(--bg)', boxShadow: '0 4px 16px var(--shadow-dark)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a, #3d3d3d)' }}>
            <PhoneCall size={16} />
          </div>
          <span className="font-extrabold text-base" style={{ color: 'var(--text)' }}>Moneycall</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'var(--text-muted)' }}>
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] z-40 p-5 flex flex-col gap-3" style={{ background: 'var(--bg)' }}>
          <div className="flex-1 overflow-y-auto space-y-3">
            {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-sm transition-all"
                style={active
                  ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)' }
                  : { color: 'var(--text-muted)' }
                }
              >
                <Icon size={20} />
                {item.name}
              </Link>
            )
          })}
          </div>
          
          <div className="mt-auto space-y-3">
            {user.isAdmin && (
              <Link
                to="/configuracion"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-sm transition-all"
                style={isActive('/configuracion')
                  ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)' }
                  : { color: 'var(--text-muted)' }
                }
              >
                <Settings size={20} />
                Configuración
              </Link>
            )}
            <button onClick={handleLogout} className="flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-sm transition-all w-full text-left" style={{ color: '#ef4444' }}>
              <LogOut size={20} /> Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 gap-6 shrink-0" style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(163,177,198,0.2)' }}>
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              className="neu-input"
              placeholder="Buscar insights..."
              style={{ background: 'var(--bg)', paddingLeft: '2.5rem' }}
              readOnly
            />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Bell */}
            <button className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center relative" style={{ color: 'var(--text-muted)' }}>
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }}></span>
            </button>

            {/* KPI Badge */}
            <div className="neu-card-sm px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>$123,467 USD</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/ $100K meta</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-5 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/mi-dia" element={<MiDia />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/portafolio" element={<Portafolio />} />
            <Route path="/llamadas" element={<Llamadas />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
