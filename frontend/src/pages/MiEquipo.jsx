import { useState, useEffect } from 'react'
import { Users, UserPlus, Pencil, Trash2, X, ShieldAlert, CheckCircle2, AlertCircle, Phone } from 'lucide-react'
import { getVendedores, updateVendedor, deleteVendedor, getVendedoresByGerente, createVendedorPorGerente } from '../api'

const ROL_CANAL_OPTIONS = [
  'Will Call',
  'Counter',
  'Llamadas',
  'WhatsApp',
  'Soporte'
]

const getRoleplayStatus = (vendedor) => {
  const cert = vendedor.certificaciones ? (typeof vendedor.certificaciones === 'string' ? JSON.parse(vendedor.certificaciones) : vendedor.certificaciones) : {}
  
  if (cert.aprobado && cert.roleplayScore >= 80) {
    return { label: `Certificado (${cert.roleplayScore}%)`, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' }
  }
  if (cert.examenEstado === 'respondido') {
    return { label: 'Examen Enviado', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' }
  }
  if (cert.examenEstado === 'habilitado') {
    return { label: 'Examen Habilitado', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' }
  }
  return { label: 'No Certificado', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' }
}

export default function MiEquipo({ currentUser }) {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingSeller, setEditingSeller] = useState(null)
  const [deletingSeller, setDeletingSeller] = useState(null)

  // Form states
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rolCanal, setRolCanal] = useState('Will Call')
  const [limiteCuentas, setLimiteCuentas] = useState(100)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const isGerente = currentUser?.isAdmin || currentUser?.isSuperAdmin

  const loadTeam = async () => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (isGerente) {
        try {
          data = await getVendedoresByGerente(currentUser.id)
        } catch (err) {
          console.warn('Fallback to getVendedores due to manager routing:', err)
          const all = await getVendedores()
          data = all.filter(v => v.gerenteId === currentUser.id && !v.isAdmin && !v.isSuperAdmin)
        }
      } else {
        // Read-only roster of all sellers for peer transparency
        const all = await getVendedores()
        data = all.filter(v => !v.isAdmin && !v.isSuperAdmin)
      }
      setTeam(data)
    } catch (e) {
      setError(e.message || 'Error al cargar el equipo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadTeam()
    }
  }, [currentUser])

  const openAddModal = () => {
    setNombre('')
    setUsername('')
    setPassword('')
    setRolCanal('Will Call')
    setLimiteCuentas(100)
    setFormError(null)
    setIsAddOpen(true)
  }

  const openEditModal = (vendedor) => {
    setEditingSeller(vendedor)
    setNombre(vendedor.nombre)
    setUsername(vendedor.username)
    setPassword('')
    setRolCanal(vendedor.rolCanal || 'Will Call')
    setLimiteCuentas(vendedor.limiteCuentas || 100)
    setFormError(null)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setFormSaving(true)
    setFormError(null)
    try {
      const payload = {
        nombre,
        username,
        password: password || '123456',
        rolCanal,
        limiteCuentas: parseInt(limiteCuentas)
      }
      await createVendedorPorGerente(currentUser.id, payload)
      setIsAddOpen(false)
      await loadTeam()
    } catch (err) {
      setFormError(err.message || 'Error al agregar vendedor')
    } finally {
      setFormSaving(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setFormSaving(true)
    setFormError(null)
    try {
      const payload = {
        nombre,
        username,
        rolCanal,
        limiteCuentas: parseInt(limiteCuentas)
      }
      if (password.trim()) {
        payload.password = password.trim()
      }
      await updateVendedor(editingSeller.id, payload)
      setEditingSeller(null)
      await loadTeam()
    } catch (err) {
      setFormError(err.message || 'Error al actualizar vendedor')
    } finally {
      setFormSaving(false)
    }
  }

  const handleDeleteSubmit = async () => {
    setFormSaving(true)
    try {
      await deleteVendedor(deletingSeller.id)
      setDeletingSeller(null)
      await loadTeam()
    } catch (err) {
      alert('Error al eliminar vendedor: ' + err.message)
    } finally {
      setFormSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-slate-500">Cargando datos del equipo...</div>

  return (
    <div className="space-y-6 w-full pb-24">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Users size={24} style={{ color: 'var(--accent)' }} />
            {isGerente ? 'Gestión de mi Equipo' : 'Directorio del Equipo'}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isGerente 
              ? 'Añade nuevos vendedores, edita sus perfiles y asignaciones de canal o límites de cuenta.'
              : 'Lista y especialización operativa de tus compañeros de equipo.'}
          </p>
        </div>

        {isGerente && (
          <button 
            onClick={openAddModal}
            className="neu-btn-accent text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), #4f46e5)', color: 'white', border: 'none' }}
          >
            <UserPlus size={14} />
            Agregar Vendedor
          </button>
        )}
      </div>

      {error && (
        <div className="neu-card p-3 flex items-center gap-3 border border-red-500/20 bg-red-500/[0.02]">
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {/* Grid de Vendedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {team.length === 0 ? (
          <div className="col-span-full neu-card p-12 text-center text-slate-500 text-xs">
            No hay vendedores asignados a tu gestión actualmente.
          </div>
        ) : (
          team.map((v) => {
            const status = getRoleplayStatus(v)
            return (
              <div key={v.id} className="neu-card p-5 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:scale-[1.01]">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-60" />
                
                {/* Top Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-sm uppercase shrink-0"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 10px rgba(79,70,229,0.15)' }}>
                      {v.nombre.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-extrabold truncate" style={{ color: 'var(--text)' }}>
                        {v.nombre}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                        @{v.username}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="neu-inset rounded-xl p-2.5 text-center">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase block leading-none">Canal / Rol</span>
                      <span className="text-[11px] font-black text-indigo-500 block mt-1">
                        {v.rolCanal || 'Will Call'}
                      </span>
                    </div>
                    <div className="neu-inset rounded-xl p-2.5 text-center">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase block leading-none">Límite Cartera</span>
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 block mt-1">
                        {v.limiteCuentas || 100}
                      </span>
                    </div>
                  </div>

                  {/* Certificacion Badge */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border text-[10px] font-bold"
                    style={{ color: status.color, background: status.bg, borderColor: status.border }}>
                    <span className="uppercase text-[8px] tracking-wider text-slate-400 dark:text-slate-500">Metodología</span>
                    <span className="font-extrabold shrink-0">{status.label}</span>
                  </div>
                </div>

                {/* Acciones */}
                {isGerente && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-200/10">
                    <button 
                      onClick={() => openEditModal(v)}
                      className="neu-btn p-2 rounded-lg text-slate-500 hover:text-indigo-500 transition-colors flex items-center gap-1 text-[9px] font-bold"
                      title="Editar Vendedor"
                    >
                      <Pencil size={10} />
                      Editar
                    </button>
                    <button 
                      onClick={() => setDeletingSeller(v)}
                      className="neu-btn p-2 rounded-lg text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[9px] font-bold"
                      title="Eliminar Vendedor"
                    >
                      <Trash2 size={10} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal Agregar Vendedor */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="w-full max-w-md rounded-2xl overflow-hidden my-8" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
              <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <UserPlus size={16} className="text-indigo-500" />
                Agregar Nuevo Vendedor
              </h3>
              <button onClick={() => setIsAddOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl border flex items-center gap-2 text-xs"
                  style={{ background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Nombre del Vendedor
                </label>
                <input 
                  type="text" 
                  className="neu-input text-xs" 
                  placeholder="Ej. Brayan Rodríguez"
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Nombre de Usuario (@username)
                </label>
                <input 
                  type="text" 
                  className="neu-input text-xs" 
                  placeholder="ej. brodriguez"
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Contraseña Inicial
                </label>
                <input 
                  type="password" 
                  className="neu-input text-xs" 
                  placeholder="Dejar vacío para usar por defecto '123456'"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Canal / Especialización
                  </label>
                  <select 
                    className="neu-input text-xs h-[38px] cursor-pointer"
                    value={rolCanal}
                    onChange={e => setRolCanal(e.target.value)}
                  >
                    {ROL_CANAL_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Límite de Cuentas (S2)
                  </label>
                  <input 
                    type="number" 
                    className="neu-input text-xs" 
                    value={limiteCuentas}
                    onChange={e => setLimiteCuentas(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)} 
                  className="neu-btn text-xs font-bold px-4 py-2 rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={formSaving}
                  className="neu-btn-accent text-xs font-extrabold px-6 py-2 rounded-xl flex items-center gap-2"
                >
                  {formSaving ? 'Agregando...' : 'Agregar Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Vendedor */}
      {editingSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="w-full max-w-md rounded-2xl overflow-hidden my-8" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
              <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Pencil size={16} className="text-indigo-500" />
                Editar Perfil de Vendedor
              </h3>
              <button onClick={() => setEditingSeller(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl border flex items-center gap-2 text-xs"
                  style={{ background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Nombre del Vendedor
                </label>
                <input 
                  type="text" 
                  className="neu-input text-xs" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Nombre de Usuario (@username)
                </label>
                <input 
                  type="text" 
                  className="neu-input text-xs" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Actualizar Contraseña
                </label>
                <input 
                  type="password" 
                  className="neu-input text-xs" 
                  placeholder="Dejar vacío para no modificarla"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Canal / Especialización
                  </label>
                  <select 
                    className="neu-input text-xs h-[38px] cursor-pointer"
                    value={rolCanal}
                    onChange={e => setRolCanal(e.target.value)}
                  >
                    {ROL_CANAL_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Límite de Cuentas (S2)
                  </label>
                  <input 
                    type="number" 
                    className="neu-input text-xs" 
                    value={limiteCuentas}
                    onChange={e => setLimiteCuentas(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingSeller(null)} 
                  className="neu-btn text-xs font-bold px-4 py-2 rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={formSaving}
                  className="neu-btn-accent text-xs font-extrabold px-6 py-2 rounded-xl flex items-center gap-2"
                >
                  {formSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {deletingSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden my-8" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            <div className="p-6 text-center space-y-4">
              <ShieldAlert size={40} className="mx-auto text-red-500 animate-bounce" />
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>
                  ¿Eliminar a {deletingSeller.nombre}?
                </h3>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Esta acción es irreversible y removerá permanentemente al vendedor @{deletingSeller.username} del CRM, incluyendo su vinculación con clientes y logs históricos.
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button 
                  type="button" 
                  onClick={() => setDeletingSeller(null)} 
                  className="neu-btn text-xs font-bold px-4 py-2 rounded-xl text-slate-500 flex-1"
                >
                  Descartar
                </button>
                <button 
                  onClick={handleDeleteSubmit}
                  disabled={formSaving}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 text-xs font-extrabold px-6 py-2 rounded-xl flex-1 active:scale-95 transition-all"
                >
                  {formSaving ? 'Eliminando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
