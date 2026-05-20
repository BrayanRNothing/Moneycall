import { useState, useEffect } from 'react'
import {
  Shield, Users, UserPlus, Trash2, ChevronDown, ChevronRight,
  Eye, EyeOff, Building2, UserCheck, AlertTriangle, X, Check,
  Award, Phone
} from 'lucide-react'
import { getGerentes, createGerente, deleteGerente, createVendedorPorGerente, deleteVendedor } from '../api'

// ── Utility ──────────────────────────────────────────────────────────────────
const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const ROLES_CANAL = ['Moneycall', 'Mostrador', 'Inbound', 'TM', 'Gerencia']

// ── Formulario reutilizable ──────────────────────────────────────────────────
function UserForm({ fields, form, onChange, showPass, onTogglePass, rolCanal, onRolChange }) {
  return (
    <div className="space-y-4">
      {fields.map(f => (
        <div key={f.name} className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
          <input name={f.name} value={form[f.name]} onChange={onChange} placeholder={f.placeholder}
            className="neu-input w-full text-sm" required />
        </div>
      ))}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
        <div className="relative">
          <input name="password" value={form.password} onChange={onChange}
            type={showPass ? 'text' : 'password'} placeholder="Dejar vacío → 123456"
            className="neu-input w-full text-sm pr-10" />
          <button type="button" onClick={onTogglePass} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Canal / Rol</label>
        <select name="rolCanal" value={rolCanal} onChange={onRolChange} className="neu-input w-full text-sm">
          {ROLES_CANAL.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
    </div>
  )
}

// ── Modal base ───────────────────────────────────────────────────────────────
function Modal({ title, subtitle, iconBg, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(163,177,198,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="neu-card p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg, boxShadow: '3px 3px 8px rgba(0,0,0,0.2)' }}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

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
    try { onCreated(await createGerente(form)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="Crear Gerente" subtitle="Nivel 2 — Administrador de equipo"
      iconBg="linear-gradient(135deg,#1a1a1a,#3d3d3d)" icon={UserCheck} onClose={onClose}>
      {error && <p className="text-xs text-center p-2 rounded-xl font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <UserForm
          fields={[
            { label: 'Nombre completo', name: 'nombre', placeholder: 'Ej. Carlos López' },
            { label: 'Usuario (login)', name: 'username', placeholder: 'Ej. carlos.gerente' },
          ]}
          form={form} onChange={handle}
          showPass={showPass} onTogglePass={() => setShowPass(!showPass)}
          rolCanal={form.rolCanal} onRolChange={handle}
        />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="neu-btn flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="neu-btn-accent flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            {loading ? 'Creando...' : <><Check size={15} /> Crear</>}
          </button>
        </div>
      </form>
    </Modal>
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
    try { onCreated(await createVendedorPorGerente(gerente.id, form)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="Nuevo Vendedor" subtitle={`Equipo de ${gerente.nombre}`}
      iconBg="linear-gradient(135deg,#3b4fd8,#5a3fa0)" icon={UserPlus} onClose={onClose}>
      {error && <p className="text-xs text-center p-2 rounded-xl font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <UserForm
          fields={[
            { label: 'Nombre completo', name: 'nombre', placeholder: 'Ej. Ana García' },
            { label: 'Usuario (login)', name: 'username', placeholder: 'Ej. ana.garcia' },
          ]}
          form={form} onChange={handle}
          showPass={showPass} onTogglePass={() => setShowPass(!showPass)}
          rolCanal={form.rolCanal} onRolChange={handle}
        />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="neu-btn flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
            style={{ background: 'linear-gradient(135deg,#3b4fd8,#5a3fa0)', boxShadow: '3px 3px 10px rgba(59,79,216,0.3)' }}>
            {loading ? 'Creando...' : <><UserPlus size={15} /> Crear</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(163,177,198,0.35)', backdropFilter: 'blur(6px)' }}>
      <div className="neu-card p-6 w-full max-w-sm space-y-4 text-center">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto neu-inset">
          <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{message}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Esta acción no se puede deshacer.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="neu-btn flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--danger)', boxShadow: '3px 3px 8px rgba(239,68,68,0.3)' }}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

// ── Vendedor Row ──────────────────────────────────────────────────────────────
function VendedorRow({ v, onDelete }) {
  const cert = v.certificaciones || {}
  const aprobado = cert.aprobado && cert.roleplayScore >= 80
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{ background: 'rgba(163,177,198,0.07)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0"
        style={{ background: 'linear-gradient(135deg,#3b4fd8,#5a3fa0)', boxShadow: '2px 2px 6px rgba(59,79,216,0.25)' }}>
        {initials(v.nombre)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate leading-tight" style={{ color: 'var(--text)' }}>{v.nombre}</p>
        <p className="text-[9px] leading-tight" style={{ color: 'var(--text-muted)' }}>@{v.username} · {v.rolCanal}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
          style={aprobado
            ? { background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }
            : { background: 'rgba(163,177,198,0.15)', color: 'var(--text-muted)' }}>
          {aprobado ? '✓ Cert.' : 'Pendiente'}
        </span>
        <button onClick={() => onDelete(v)}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.08)' }}>
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  )
}

// ── Gerente Card ──────────────────────────────────────────────────────────────
function GerenteCard({ gerente, onDeleteGerente, onVendedorCreated, onDeleteVendedor }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddVendedor, setShowAddVendedor] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  const vendedores = gerente.vendedoresACargo || []
  const certCount = vendedores.filter(v => { const c = v.certificaciones || {}; return c.aprobado && c.roleplayScore >= 80 }).length
  const certPct = vendedores.length > 0 ? Math.round((certCount / vendedores.length) * 100) : 0

  return (
    <>
      {/* Card principal */}
      <div className="neu-card overflow-hidden">
        {/* Fila de cabecera: click para expandir */}
        <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#1a1a1a,#4a4a4a)', boxShadow: '3px 3px 8px rgba(0,0,0,0.2)' }}>
            {initials(gerente.nombre)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{gerente.nombre}</p>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md neu-inset"
                style={{ color: 'var(--text-muted)' }}>
                {gerente.rolCanal}
              </span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              @{gerente.username}
            </p>
          </div>

          {/* Contadores rápidos */}
          <div className="hidden sm:flex items-center gap-3 px-3 shrink-0">
            <div className="text-center">
              <p className="text-base font-extrabold leading-none" style={{ color: 'var(--text)' }}>{vendedores.length}</p>
              <p className="text-[8px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-muted)' }}>Equipo</p>
            </div>
            <div className="text-center">
              <p className="text-base font-extrabold leading-none" style={{ color: 'var(--success)' }}>{certCount}</p>
              <p className="text-[8px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-muted)' }}>Cert.</p>
            </div>
          </div>

          {/* Barra de certificación mini */}
          {vendedores.length > 0 && (
            <div className="hidden md:block w-16 shrink-0">
              <div className="neu-progress-track">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${certPct}%`, background: certPct >= 80 ? 'var(--success)' : certPct >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
              </div>
              <p className="text-[8px] text-center mt-1 font-bold" style={{ color: 'var(--text-muted)' }}>{certPct}% cert.</p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <button
              onClick={e => { e.stopPropagation(); setShowAddVendedor(true) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center neu-btn transition-all hover:scale-105"
              title="Agregar vendedor" style={{ color: 'var(--text-muted)' }}
            >
              <UserPlus size={12} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDel({ type: 'gerente', target: gerente }) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center neu-btn transition-all hover:scale-105"
              title="Eliminar gerente" style={{ color: 'var(--danger)' }}
            >
              <Trash2 size={12} />
            </button>
            <div className="w-5 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>
        </div>

        {/* Panel expandido: lista de vendedores */}
        {expanded && (
          <div className="px-4 pb-4 space-y-2"
            style={{ borderTop: '1px solid rgba(163,177,198,0.18)', paddingTop: '0.75rem' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Equipo de {gerente.nombre.split(' ')[0]} — {vendedores.length} miembro{vendedores.length !== 1 ? 's' : ''}
              </p>
              <button onClick={() => setShowAddVendedor(true)}
                className="text-[9px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg neu-btn"
                style={{ color: 'var(--text-muted)' }}>
                <UserPlus size={10} /> Agregar
              </button>
            </div>

            {vendedores.length === 0 ? (
              <div className="text-center py-5 neu-inset rounded-xl">
                <Users size={18} style={{ color: 'var(--text-muted)', margin: '0 auto 6px' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Sin vendedores asignados</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {vendedores.map(v => (
                  <VendedorRow key={v.id} v={v}
                    onDelete={target => setConfirmDel({ type: 'vendedor', target })} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {showAddVendedor && (
        <ModalCrearVendedor gerente={gerente} onClose={() => setShowAddVendedor(false)}
          onCreated={v => { onVendedorCreated(gerente.id, v); setShowAddVendedor(false) }} />
      )}
      {confirmDel?.type === 'gerente' && (
        <ConfirmDelete
          message={`¿Eliminar a ${confirmDel.target.nombre}? Sus vendedores quedarán sin gerente.`}
          onConfirm={() => { onDeleteGerente(gerente.id); setConfirmDel(null) }}
          onCancel={() => setConfirmDel(null)} />
      )}
      {confirmDel?.type === 'vendedor' && (
        <ConfirmDelete
          message={`¿Eliminar al vendedor "${confirmDel.target.nombre}"?`}
          onConfirm={async () => { await onDeleteVendedor(confirmDel.target.id); setConfirmDel(null) }}
          onCancel={() => setConfirmDel(null)} />
      )}
    </>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="neu-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 neu-inset">
        <Icon size={17} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none" style={{ color: 'var(--text)' }}>{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {sub && <p className="text-[9px] mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [gerentes, setGerentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCrearGerente, setShowCrearGerente] = useState(false)

  const load = async () => {
    try { setLoading(true); setGerentes(await getGerentes()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleDeleteGerente = async (id) => {
    try { await deleteGerente(id); setGerentes(g => g.filter(x => x.id !== id)) }
    catch (e) { setError(e.message) }
  }
  const handleVendedorCreated = (gerenteId, vendedor) => {
    setGerentes(gs => gs.map(g => g.id === gerenteId
      ? { ...g, vendedoresACargo: [...(g.vendedoresACargo || []), vendedor] } : g))
  }
  const handleDeleteVendedor = async (vendedorId) => {
    try {
      await deleteVendedor(vendedorId)
      setGerentes(gs => gs.map(g => ({ ...g, vendedoresACargo: (g.vendedoresACargo || []).filter(v => v.id !== vendedorId) })))
    } catch (e) { setError(e.message) }
  }

  const totalVendedores = gerentes.reduce((acc, g) => acc + (g.vendedoresACargo?.length || 0), 0)
  const totalCert = gerentes.reduce((acc, g) => {
    return acc + (g.vendedoresACargo || []).filter(v => { const c = v.certificaciones || {}; return c.aprobado && c.roleplayScore >= 80 }).length
  }, 0)
  const certGlobal = totalVendedores > 0 ? Math.round((totalCert / totalVendedores) * 100) : 0

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="neu-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#1a1a1a,#3d3d3d)', boxShadow: '4px 4px 12px rgba(0,0,0,0.25)' }}>
            <Shield size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Panel Admin</h1>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(26,26,26,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(163,177,198,0.3)' }}>
                SuperAdmin
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Gestión del árbol de equipos Moneycall
            </p>
          </div>
        </div>
        <button onClick={() => setShowCrearGerente(true)}
          className="neu-btn-accent px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0">
          <UserPlus size={15} /> Crear Gerente
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Gerentes" value={gerentes.length} icon={Building2} color="var(--accent)" />
        <KpiCard label="Vendedores" value={totalVendedores} icon={Users} color="#3b4fd8" />
        <KpiCard
          label="Certificados"
          value={totalCert}
          icon={Award}
          color="var(--success)"
          sub={totalVendedores > 0 ? `${certGlobal}% del equipo` : null}
        />
      </div>

      {/* Barra de certificación global */}
      {totalVendedores > 0 && (
        <div className="neu-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Progreso global de certificación
            </p>
            <p className="text-xs font-bold" style={{ color: certGlobal >= 80 ? 'var(--success)' : certGlobal >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
              {certGlobal}%
            </p>
          </div>
          <div className="neu-progress-track">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${certGlobal}%`, background: certGlobal >= 80 ? 'var(--success)' : certGlobal >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
          </div>
          <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            {totalCert} de {totalVendedores} vendedores certificados en roleplay
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="p-3 rounded-xl text-xs font-bold text-center"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* ── Lista de Gerentes ── */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>
          Equipos registrados — {gerentes.length} gerente{gerentes.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="neu-card p-10 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: 'var(--accent)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cargando equipos...</p>
          </div>
        ) : gerentes.length === 0 ? (
          <div className="neu-card p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto neu-inset">
              <Shield size={22} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Sin gerentes registrados</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Crea el primer gerente para estructurar tu equipo.
              </p>
            </div>
            <button onClick={() => setShowCrearGerente(true)}
              className="neu-btn-accent px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 mt-1">
              <UserPlus size={14} /> Crear Primer Gerente
            </button>
          </div>
        ) : (
          gerentes.map(g => (
            <GerenteCard key={g.id} gerente={g}
              onDeleteGerente={handleDeleteGerente}
              onVendedorCreated={handleVendedorCreated}
              onDeleteVendedor={handleDeleteVendedor} />
          ))
        )}
      </div>

      {showCrearGerente && (
        <ModalCrearGerente
          onClose={() => setShowCrearGerente(false)}
          onCreated={g => { setGerentes(prev => [...prev, { ...g, vendedoresACargo: [] }]); setShowCrearGerente(false) }}
        />
      )}
    </div>
  )
}
