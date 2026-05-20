import { useState, useEffect } from 'react'
import {
  Shield, Users, UserPlus, Trash2, ChevronDown, ChevronRight,
  Eye, EyeOff, Building2, UserCheck, AlertTriangle, X, Check, Edit3
} from 'lucide-react'
import { getGerentes, createGerente, deleteGerente, createVendedorPorGerente, deleteVendedor } from '../api'

// ── Utility ──────────────────────────────────────────────────────────────────
const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const ROLES_CANAL = ['Moneycall', 'Mostrador', 'Inbound', 'TM', 'Gerencia']

// ── Modal: Crear Gerente ──────────────────────────────────────────────────────
function ModalCrearGerente({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', username: '', password: '', rolCanal: 'Gerencia' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.username) return setError('Nombre y usuario son requeridos')
    setLoading(true); setError('')
    try {
      const g = await createGerente(form)
      onCreated(g)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="neu-card p-6 w-full max-w-md space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1a1a1a,#3d3d3d)' }}>
              <UserCheck size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Crear Gerente</h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Nivel 2 — Administrador de equipo</p>
            </div>
          </div>
          <button onClick={onClose} className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>

        {error && <p className="text-xs text-center p-2 rounded-xl font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          {[
            { label: 'Nombre completo', name: 'nombre', placeholder: 'Ej. Carlos López' },
            { label: 'Usuario (login)', name: 'username', placeholder: 'Ej. carlos.gerente' },
          ].map(f => (
            <div key={f.name} className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
              <input name={f.name} value={form[f.name]} onChange={handle} placeholder={f.placeholder}
                className="neu-input w-full text-sm" required />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
            <div className="relative">
              <input name="password" value={form.password} onChange={handle}
                type={showPass ? 'text' : 'password'} placeholder="Dejar vacío para usar 123456"
                className="neu-input w-full text-sm pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Canal</label>
            <select name="rolCanal" value={form.rolCanal} onChange={handle} className="neu-input w-full text-sm">
              {ROLES_CANAL.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="neu-btn flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="neu-btn-accent flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              {loading ? 'Creando...' : <><Check size={15} /> Crear Gerente</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: Crear Vendedor ─────────────────────────────────────────────────────
function ModalCrearVendedor({ gerente, onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', username: '', password: '', rolCanal: 'Moneycall' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.username) return setError('Nombre y usuario son requeridos')
    setLoading(true); setError('')
    try {
      const v = await createVendedorPorGerente(gerente.id, form)
      onCreated(v)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="neu-card p-6 w-full max-w-md space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
              <UserPlus size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Nuevo Vendedor</h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Asignado a: <span className="font-bold">{gerente.nombre}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>

        {error && <p className="text-xs text-center p-2 rounded-xl font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          {[
            { label: 'Nombre completo', name: 'nombre', placeholder: 'Ej. Ana García' },
            { label: 'Usuario (login)', name: 'username', placeholder: 'Ej. ana.garcia' },
          ].map(f => (
            <div key={f.name} className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
              <input name={f.name} value={form[f.name]} onChange={handle} placeholder={f.placeholder}
                className="neu-input w-full text-sm" required />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
            <div className="relative">
              <input name="password" value={form.password} onChange={handle}
                type={showPass ? 'text' : 'password'} placeholder="Dejar vacío para usar 123456"
                className="neu-input w-full text-sm pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Canal / Rol</label>
            <select name="rolCanal" value={form.rolCanal} onChange={handle} className="neu-input w-full text-sm">
              {ROLES_CANAL.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="neu-btn flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
              style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
              {loading ? 'Creando...' : <><UserPlus size={15} /> Crear Vendedor</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="neu-card p-6 w-full max-w-sm space-y-4 animate-fade-in text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <AlertTriangle size={22} style={{ color: '#ef4444' }} />
        </div>
        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{message}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Esta acción no se puede deshacer.</p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="neu-btn flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#ef4444' }}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Gerente Card ──────────────────────────────────────────────────────────────
function GerenteCard({ gerente, onDeleteGerente, onVendedorCreated, onDeleteVendedor }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddVendedor, setShowAddVendedor] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null) // { type: 'gerente'|'vendedor', target }

  const vendedores = gerente.vendedoresACargo || []

  const certCount = vendedores.filter(v => {
    const c = v.certificaciones || {}
    return c.aprobado && c.roleplayScore >= 80
  }).length

  const handleDeleteVendedor = async (vendedor) => {
    await onDeleteVendedor(vendedor.id)
    setConfirmDel(null)
  }

  return (
    <>
      <div className="neu-card overflow-hidden">
        {/* Header del Gerente */}
        <div
          className="p-4 flex items-center gap-3 cursor-pointer select-none hover:opacity-90 transition-opacity"
          onClick={() => setExpanded(!expanded)}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#1a1a1a,#4a4a4a)' }}
          >
            {initials(gerente.nombre)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{gerente.nombre}</p>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(163,177,198,0.15)', color: 'var(--text-muted)' }}>
                {gerente.rolCanal}
              </span>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              @{gerente.username} · {vendedores.length} vendedor{vendedores.length !== 1 ? 'es' : ''} · {certCount} certificado{certCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); setShowAddVendedor(true) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              title="Agregar vendedor"
              style={{ background: 'rgba(102,126,234,0.12)', color: '#667eea', border: '1px solid rgba(102,126,234,0.25)' }}
            >
              <UserPlus size={12} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDel({ type: 'gerente', target: gerente }) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              title="Eliminar gerente"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <Trash2 size={12} />
            </button>
            {expanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
          </div>
        </div>

        {/* Vendedores Expandidos */}
        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: 'rgba(163,177,198,0.15)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Equipo de {gerente.nombre.split(' ')[0]}
            </p>

            {vendedores.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin vendedores asignados aún.</p>
                <button
                  onClick={() => setShowAddVendedor(true)}
                  className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ color: '#667eea', background: 'rgba(102,126,234,0.1)' }}
                >
                  + Agregar el primero
                </button>
              </div>
            ) : (
              vendedores.map(v => {
                const cert = v.certificaciones || {}
                const aprobado = cert.aprobado && cert.roleplayScore >= 80
                return (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(163,177,198,0.06)', border: '1px solid rgba(163,177,198,0.1)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
                    >
                      {initials(v.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{v.nombre}</p>
                      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>@{v.username} · {v.rolCanal}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {aprobado ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                          ✓ Cert.
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                          Pendiente
                        </span>
                      )}
                      <button
                        onClick={() => setConfirmDel({ type: 'vendedor', target: v })}
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        title="Eliminar vendedor"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {showAddVendedor && (
        <ModalCrearVendedor
          gerente={gerente}
          onClose={() => setShowAddVendedor(false)}
          onCreated={(v) => { onVendedorCreated(gerente.id, v); setShowAddVendedor(false) }}
        />
      )}

      {confirmDel?.type === 'gerente' && (
        <ConfirmDelete
          message={`¿Eliminar al gerente "${confirmDel.target.nombre}"? Sus vendedores quedarán sin gerente asignado.`}
          onConfirm={() => { onDeleteGerente(gerente.id); setConfirmDel(null) }}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {confirmDel?.type === 'vendedor' && (
        <ConfirmDelete
          message={`¿Eliminar al vendedor "${confirmDel.target.nombre}"?`}
          onConfirm={() => handleDeleteVendedor(confirmDel.target)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </>
  )
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [gerentes, setGerentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCrearGerente, setShowCrearGerente] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getGerentes()
      setGerentes(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDeleteGerente = async (id) => {
    try {
      await deleteGerente(id)
      setGerentes(g => g.filter(x => x.id !== id))
    } catch (e) { setError(e.message) }
  }

  const handleVendedorCreated = (gerenteId, vendedor) => {
    setGerentes(gs => gs.map(g =>
      g.id === gerenteId
        ? { ...g, vendedoresACargo: [...(g.vendedoresACargo || []), vendedor] }
        : g
    ))
  }

  const handleDeleteVendedor = async (vendedorId) => {
    try {
      await deleteVendedor(vendedorId)
      setGerentes(gs => gs.map(g => ({
        ...g,
        vendedoresACargo: (g.vendedoresACargo || []).filter(v => v.id !== vendedorId)
      })))
    } catch (e) { setError(e.message) }
  }

  const totalVendedores = gerentes.reduce((acc, g) => acc + (g.vendedoresACargo?.length || 0), 0)
  const totalCert = gerentes.reduce((acc, g) => {
    const cert = (g.vendedoresACargo || []).filter(v => {
      const c = v.certificaciones || {}
      return c.aprobado && c.roleplayScore >= 80
    }).length
    return acc + cert
  }, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#1a1a1a,#3d3d3d)', boxShadow: '4px 4px 12px rgba(0,0,0,0.3)' }}
          >
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
              Panel Superadmin
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Gestión del árbol de equipos Moneycall
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCrearGerente(true)}
          className="neu-btn-accent px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0"
        >
          <UserPlus size={15} /> Crear Gerente
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Gerentes', value: gerentes.length, icon: Building2, color: '#1a1a1a' },
          { label: 'Vendedores', value: totalVendedores, icon: Users, color: '#667eea' },
          { label: 'Certificados', value: totalCert, icon: UserCheck, color: '#10b981' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="neu-card p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: `${color}20` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl text-xs font-bold text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Lista de Gerentes */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>
          Gerentes del Sistema — {gerentes.length} registrado{gerentes.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cargando equipos...</p>
          </div>
        ) : gerentes.length === 0 ? (
          <div className="neu-card p-10 text-center space-y-3">
            <Shield size={32} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Sin gerentes registrados</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Crea el primer gerente para comenzar a estructurar tu equipo.</p>
            <button
              onClick={() => setShowCrearGerente(true)}
              className="neu-btn-accent px-4 py-2 rounded-xl text-sm font-bold mt-2 inline-flex items-center gap-2"
            >
              <UserPlus size={14} /> Crear Primer Gerente
            </button>
          </div>
        ) : (
          gerentes.map(g => (
            <GerenteCard
              key={g.id}
              gerente={g}
              onDeleteGerente={handleDeleteGerente}
              onVendedorCreated={handleVendedorCreated}
              onDeleteVendedor={handleDeleteVendedor}
            />
          ))
        )}
      </div>

      {/* Modales */}
      {showCrearGerente && (
        <ModalCrearGerente
          onClose={() => setShowCrearGerente(false)}
          onCreated={(g) => {
            setGerentes(prev => [...prev, { ...g, vendedoresACargo: [] }])
            setShowCrearGerente(false)
          }}
        />
      )}
    </div>
  )
}
