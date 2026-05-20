import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Award,
  Phone,
  CalendarDays,
  Menu,
  Bell,
  Settings,
  LogOut,
  X,
  Shield,
  Target,
  Pencil,
  Check
} from 'lucide-react'

import Dashboard from './pages/Dashboard'
import Portafolio from './pages/Portafolio'
import Quotes from './pages/Quotes'
import Testimonials from './pages/Testimonials'
import Llamadas from './pages/Llamadas'
import Configuracion from './pages/Configuracion'
import MiDia from './pages/MiDia'
import Login from './pages/Login'
import AdminPanel from './pages/AdminPanel'

const fmtUSD = (n) => n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `$${n.toLocaleString()}`

function App() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [metaUSD, setMetaUSD] = useState(() => Number(localStorage.getItem('metaUSD') || 0))
  const [editingMeta, setEditingMeta] = useState(false)
  const [metaDraft, setMetaDraft] = useState('')

  const saveMeta = () => {
    const num = parseFloat(metaDraft.replace(/[^0-9.]/g, '')) || 0
    setMetaUSD(num)
    localStorage.setItem('metaUSD', String(num))
    setEditingMeta(false)
  }

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
    { name: 'Mi Día', href: '/mi-dia', icon: CalendarDays, roles: ['gerente', 'vendedor'] },
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['gerente', 'vendedor'] },
    { name: 'Portafolio', href: '/portafolio', icon: Users, roles: ['gerente', 'vendedor'] },
    { name: 'Llamadas', href: '/llamadas', icon: Phone, roles: ['gerente', 'vendedor'] },
    { name: 'Cotizaciones', href: '/quotes', icon: FileText, roles: ['gerente', 'vendedor'] },
    { name: 'Testimonios', href: '/testimonials', icon: Award, roles: ['gerente', 'vendedor'] },
  ]

  // Determinar el rol del usuario
  const userRole = user.isSuperAdmin ? 'superadmin' : user.isAdmin ? 'gerente' : 'vendedor'

  // Filtrar nav según rol
  const navItems = userRole === 'superadmin'
    ? [] // SuperAdmin no tiene nav de trabajo diario, solo panel admin
    : navigation.filter(item => item.roles.includes(userRole))

  const isActive = (path) => location.pathname === path

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex md:w-64 flex-col shrink-0 p-4 gap-4" style={{ background: 'var(--bg)', borderRight: '1px solid rgba(163,177,198,0.2)' }}>

        {/* Perfil del usuario */}
        <div className="neu-card p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a1a1a, #3d3d3d)', boxShadow: '3px 3px 8px rgba(0,0,0,0.2)' }}
          >
            {user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-extrabold truncate leading-tight" style={{ color: 'var(--text)' }}>{user.nombre}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {user.isSuperAdmin ? '⚡ SuperAdmin' : user.isAdmin ? '👔 Gerente' : `🧑 ${user.rolCanal}`}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105 shrink-0"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <LogOut size={13} />
          </button>
        </div>

        {/* Nav Label — solo si hay items */}
        {navItems.length > 0 && (
          <p className="text-[10px] font-bold tracking-widest uppercase px-2" style={{ color: 'var(--text-muted)' }}>Menú</p>
        )}

        {/* Nav Items */}
        <nav className="flex flex-col gap-2">
          {/* SuperAdmin: Panel Admin como primer item de nav */}
          {user.isSuperAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-semibold text-sm"
              style={isActive('/admin')
                ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)' }
                : { color: 'var(--text-muted)' }
              }
            >
              <Shield size={18} strokeWidth={isActive('/admin') ? 2.5 : 1.8} />
              Panel Admin
            </Link>
          )}

          {/* Nav normal (gerente y vendedor) */}
          {navItems.map((item) => {
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

          {/* Gerente: Configuración inline con el resto del nav */}
          {user.isAdmin && !user.isSuperAdmin && (
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
          )}
        </nav>

        <div className="mt-auto" />
      </aside>

      {/* ── Mobile Header ── */}
      <header
        className="md:hidden px-5 py-4 flex items-center justify-between sticky top-0 z-50 animate-fade-in"
        style={{ background: 'var(--bg)', boxShadow: '0 4px 16px var(--shadow-dark)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a, #3d3d3d)' }}>
            <Phone size={16} />
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
          <div className="flex-1 overflow-y-auto space-y-2">
            {/* SuperAdmin: Panel Admin en top del mobile nav */}
            {user.isSuperAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-sm transition-all"
                style={isActive('/admin')
                  ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)' }
                  : { color: 'var(--text-muted)' }}>
                <Shield size={20} /> Panel Admin
              </Link>
            )}
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link key={item.name} to={item.href} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-sm transition-all"
                  style={active
                    ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)' }
                    : { color: 'var(--text-muted)' }}>
                  <Icon size={20} />
                  {item.name}
                </Link>
              )
            })}
            {/* Gerente: Configuración inline */}
            {user.isAdmin && !user.isSuperAdmin && (
              <Link to="/configuracion" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-sm transition-all"
                style={isActive('/configuracion')
                  ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)' }
                  : { color: 'var(--text-muted)' }}>
                <Settings size={20} /> Configuración
              </Link>
            )}
          </div>
          <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(163,177,198,0.2)' }}>
            <button onClick={handleLogout}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-sm transition-all w-full text-left"
              style={{ color: '#ef4444' }}>
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

            {/* KPI Badge — meta editable por gerente */}
            {(user.isAdmin || user.isSuperAdmin) ? (
              <div className="neu-card-sm px-3 py-1.5 flex items-center gap-1.5">
                <Target size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                {editingMeta ? (
                  <>
                    <input
                      autoFocus
                      value={metaDraft}
                      onChange={e => setMetaDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveMeta(); if (e.key === 'Escape') setEditingMeta(false) }}
                      className="w-24 text-xs font-bold bg-transparent outline-none border-b"
                      style={{ color: 'var(--text)', borderColor: 'var(--accent)' }}
                      placeholder="Ej: 100000"
                    />
                    <button onClick={saveMeta} className="w-5 h-5 rounded flex items-center justify-center" style={{ color: 'var(--success)' }}>
                      <Check size={11} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{fmtUSD(metaUSD)}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>meta</span>
                    <button
                      onClick={() => { setMetaDraft(String(metaUSD)); setEditingMeta(true) }}
                      className="w-5 h-5 rounded flex items-center justify-center opacity-40 hover:opacity-90 transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                      title="Editar meta de ventas"
                    >
                      <Pencil size={10} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="neu-card-sm px-3 py-1.5 flex items-center gap-1.5">
                <Target size={13} style={{ color: 'var(--success)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{fmtUSD(metaUSD)}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>meta</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-5 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/admin" element={<AdminPanel />} />
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
