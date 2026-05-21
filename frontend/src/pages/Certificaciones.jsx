import { useState, useEffect } from 'react'
import { Settings, Save, AlertCircle, CheckCircle2, Info, Award, BookOpen, FileCheck, UserCheck, X, Search } from 'lucide-react'
import { getVendedores, habilitarExamen, certificarVendedor } from '../api'

const QUESTION_TITLES = {
  q1: '1. Proactividad & Volumen de Llamadas',
  q2: '2. Regla de Oro: Límite de Cartera',
  q3: '3. Cuadrantes de Joe Ellers (S1 y S2)',
  q4: '4. La Primera Llamada (Las 5 Preguntas Clave)',
  q5: '5. Proceso del Seguimiento de Cotizaciones (F1 y F2)'
}

const getRoleplayStatus = (vendedor) => {
  if (vendedor.isAdmin) return { label: 'Gerente / Admin', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', code: 'admin' }
  const cert = vendedor.certificaciones ? (typeof vendedor.certificaciones === 'string' ? JSON.parse(vendedor.certificaciones) : vendedor.certificaciones) : {}
  
  if (cert.aprobado && cert.roleplayScore >= 80) {
    return { label: `Certificado (${cert.roleplayScore}%)`, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', code: 'certificado', score: cert.roleplayScore, obs: cert.observaciones }
  }
  if (cert.examenEstado === 'respondido') {
    return { label: 'Examen por Calificar', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', code: 'respondido', resp: cert.examenRespuestas, date: cert.fechaEnvioExamen }
  }
  if (cert.examenEstado === 'habilitado') {
    return { label: 'Examen Habilitado', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', code: 'habilitado' }
  }
  return { label: 'No Certificado', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', code: 'no_certificado' }
}

export default function Certificaciones({ currentUser }) {
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals state
  const [selectedVendedor, setSelectedVendedor] = useState(null)
  const [directCertVendedor, setDirectCertVendedor] = useState(null)
  
  // Grading / certifying form states
  const [roleplayScore, setRoleplayScore] = useState(85)
  const [observaciones, setObservaciones] = useState('')
  const [gradingError, setGradingError] = useState(null)
  const [gradingSaving, setGradingSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getVendedores()
      // Filter out gerentes or show all depending on system design
      setVendedores(data)
    } catch (e) { 
      setError(e.message) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { 
    load() 
  }, [])

  const handleHabilitarExamen = async (id) => {
    try {
      await habilitarExamen(id)
      alert('Examen habilitado exitosamente para el vendedor.')
      await load()
    } catch (e) {
      alert('Error al habilitar examen: ' + e.message)
    }
  }

  const openGradingModal = (vendedor) => {
    const cert = vendedor.certificaciones ? (typeof vendedor.certificaciones === 'string' ? JSON.parse(vendedor.certificaciones) : vendedor.certificaciones) : {}
    setSelectedVendedor(vendedor)
    setRoleplayScore(cert.roleplayScore || 85)
    setObservaciones(cert.observaciones || '')
    setGradingError(null)
  }

  const openDirectCertModal = (vendedor) => {
    const cert = vendedor.certificaciones ? (typeof vendedor.certificaciones === 'string' ? JSON.parse(vendedor.certificaciones) : vendedor.certificaciones) : {}
    setDirectCertVendedor(vendedor)
    setRoleplayScore(cert.roleplayScore || 85)
    setObservaciones(cert.observaciones || '')
    setGradingError(null)
  }

  const handleGradeSubmit = async (e) => {
    e.preventDefault()
    setGradingSaving(true)
    setGradingError(null)
    try {
      const aprobado = roleplayScore >= 80
      await certificarVendedor(selectedVendedor.id, {
        roleplayScore: parseInt(roleplayScore),
        aprobado,
        observaciones
      })
      setSelectedVendedor(null)
      await load()
    } catch (err) {
      setGradingError(err.message || 'Error al guardar la calificación.')
    } finally {
      setGradingSaving(false)
    }
  }

  const handleDirectCertSubmit = async (e) => {
    e.preventDefault()
    setGradingSaving(true)
    setGradingError(null)
    try {
      const aprobado = roleplayScore >= 80
      await certificarVendedor(directCertVendedor.id, {
        roleplayScore: parseInt(roleplayScore),
        aprobado,
        observaciones
      })
      setDirectCertVendedor(null)
      await load()
    } catch (err) {
      setGradingError(err.message || 'Error al guardar la certificación.')
    } finally {
      setGradingSaving(false)
    }
  }

  const filteredVendedores = vendedores.filter(v => 
    v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isAuthorized = currentUser?.isAdmin || currentUser?.isSuperAdmin

  if (!isAuthorized) {
    return (
      <div className="neu-card p-8 text-center space-y-3 max-w-md mx-auto my-12">
        <AlertCircle size={32} className="mx-auto text-red-500" />
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Acceso Denegado</h3>
        <p className="text-xs text-slate-500">Solo los gerentes de cuenta pueden gestionar certificaciones.</p>
      </div>
    )
  }

  if (loading) return <div className="text-center py-12 text-slate-500">Cargando certificaciones...</div>

  return (
    <div className="space-y-6 w-full pb-24">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Award size={24} style={{ color: 'var(--accent)' }} />
          Certificaciones y Roleplay
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Habilita evaluaciones, califica las respuestas del equipo y valida la certificación metodológica de Joe Ellers.
        </p>
      </div>

      {error && (
        <div className="neu-card p-3 flex items-center gap-3 border border-red-500/20 bg-red-500/[0.02]">
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs text-red-500">Sin conexión al backend · {error}</p>
        </div>
      )}

      {/* Roster de Certificaciones */}
      <div className="neu-card p-5 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/10 pb-4 gap-4">
          <div className="flex items-center gap-2">
            <Award size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Estatus de Certificación</h3>
              <p className="text-[10px] text-slate-500">Lista oficial de vendedores y sus puntuaciones de roleplay.</p>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={13} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar vendedor..."
              className="neu-input pl-8 py-1.5"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Listado */}
        <div className="space-y-4">
          <div className="divide-y divide-slate-200/10 space-y-3.5">
            {filteredVendedores.length === 0 ? (
              <p className="text-xs text-center py-6 text-slate-500">
                {searchTerm ? 'No se encontraron vendedores para tu búsqueda.' : 'No hay vendedores registrados aún.'}
              </p>
            ) : (
              filteredVendedores.map((v, index) => {
                const status = getRoleplayStatus(v)
                return (
                  <div key={v.id} className={`${index > 0 ? 'pt-3.5' : ''} flex items-center justify-between gap-4 flex-wrap hover:bg-slate-300/[0.02] p-1.5 rounded-xl transition-all duration-150`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs uppercase shrink-0"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                        {v.nombre.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{v.nombre}</span>
                          <span className="text-[9px] font-semibold text-slate-500">@{v.username}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Rol Canal: <span className="font-bold text-indigo-500">{v.rolCanal || 'Moneycall'}</span> · Cartera: **{v._count?.clientes ?? 0}/{v.limiteCuentas || 100}**
                        </p>
                      </div>
                    </div>

                    {/* Estado y Acciones */}
                    <div className="flex items-center gap-3 ml-auto flex-wrap">
                      {/* Badge de Estado */}
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded border shrink-0"
                        style={{ color: status.color, background: status.bg, borderColor: status.border }}>
                        {status.label}
                      </span>

                      {/* Acciones */}
                      {!v.isAdmin && (
                        <div className="flex items-center gap-1.5">
                          {status.code === 'no_certificado' && (
                            <button
                              type="button"
                              onClick={() => handleHabilitarExamen(v.id)}
                              className="neu-btn text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:scale-105 transition-all text-indigo-500"
                            >
                              <BookOpen size={10} /> Habilitar Examen
                            </button>
                          )}

                          {status.code === 'habilitado' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 shrink-0 bg-amber-500/10 px-2 py-1 rounded">
                              Esperando Respuestas...
                            </span>
                          )}

                          {status.code === 'respondido' && (
                            <button
                              type="button"
                              onClick={() => openGradingModal(v)}
                              className="text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:scale-105 transition-all bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                            >
                              <FileCheck size={10} /> Calificar Examen
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openDirectCertModal(v)}
                            className="neu-btn text-[9px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:scale-105 transition-all text-slate-500"
                          >
                            <UserCheck size={10} /> Certificación Rápida
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Calificar Examen */}
      {selectedVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden my-8" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
              <div className="flex items-center gap-2">
                <FileCheck size={18} style={{ color: '#3b82f6' }} />
                <div>
                  <h3 className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>
                    Evaluar Examen Metodológico
                  </h3>
                  <span className="text-[10px] text-blue-500 font-semibold block">
                    Vendedor: {selectedVendedor.nombre}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedVendedor(null)} 
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {gradingError && (
                <div className="p-3 rounded-xl flex items-center gap-3 border text-xs" style={{ background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  <AlertCircle size={14} />
                  <span className="font-bold">{gradingError}</span>
                </div>
              )}

              {/* Answers Listing */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Respuestas de la Evaluación
                </h4>
                {(() => {
                  const cert = selectedVendedor.certificaciones ? (typeof selectedVendedor.certificaciones === 'string' ? JSON.parse(selectedVendedor.certificaciones) : selectedVendedor.certificaciones) : {}
                  const respuestas = cert.examenRespuestas || {}
                  
                  return Object.keys(QUESTION_TITLES).map(key => (
                    <div key={key} className="p-4 rounded-xl border space-y-2" style={{ borderColor: 'rgba(163,177,198,0.15)', background: 'rgba(163,177,198,0.03)' }}>
                      <h5 className="text-[11px] font-extrabold" style={{ color: 'var(--text)' }}>
                        {QUESTION_TITLES[key]}
                      </h5>
                      <p className="text-xs whitespace-pre-line leading-relaxed italic pl-3 border-l-2" 
                        style={{ color: 'var(--text-muted)', borderColor: 'var(--accent)' }}>
                        "{respuestas[key] || 'Sin respuesta.'}"
                      </p>
                    </div>
                  ))
                })()}
              </div>

              {/* Grading Form */}
              <form onSubmit={handleGradeSubmit} className="space-y-4 pt-4 border-t" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slider Score */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <label style={{ color: 'var(--text-muted)' }}>Nota de Roleplay / Examen</label>
                      <span className="text-sm font-extrabold" style={{ color: roleplayScore >= 80 ? '#10b981' : '#f59e0b' }}>
                        {roleplayScore}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="w-full accent-indigo-600 cursor-pointer"
                      value={roleplayScore} 
                      onChange={e => setRoleplayScore(e.target.value)} 
                    />
                    <div className="flex justify-between text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>
                      <span>0%</span>
                      <span className="text-emerald-500 font-extrabold">Aprobación ≥ 80%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Status Indicator Preview */}
                  <div className="neu-inset rounded-xl p-3.5 flex flex-col justify-center text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Estado Resultante
                    </span>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full mx-auto" 
                      style={roleplayScore >= 80 
                        ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' } 
                        : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                      {roleplayScore >= 80 ? '✓ Aprobado (Certificado)' : '⚠ Desaprobado'}
                    </span>
                  </div>
                </div>

                {/* Feedback Observaciones */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Observaciones y Feedback del Gerente
                  </label>
                  <textarea 
                    className="neu-input resize-none text-xs" 
                    rows={3} 
                    placeholder="Escribe comentarios de mejora o justificación de la nota..."
                    value={observaciones} 
                    onChange={e => setObservaciones(e.target.value)}
                    required
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedVendedor(null)} 
                    className="neu-btn text-xs font-bold px-4 py-2 rounded-xl text-slate-500"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={gradingSaving}
                    className="neu-btn-accent text-xs font-extrabold px-6 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: roleplayScore >= 80 ? '#10b981' : 'var(--accent)' }}
                  >
                    {gradingSaving ? 'Guardando...' : 'Registrar Calificación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Certificación Directa */}
      {directCertVendedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="w-full max-w-md rounded-2xl overflow-hidden my-8" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
              <div className="flex items-center gap-2">
                <UserCheck size={18} style={{ color: 'var(--accent)' }} />
                <div>
                  <h3 className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>
                    Certificación Directa
                  </h3>
                  <span className="text-[10px] font-semibold block text-indigo-500">
                    Vendedor: {directCertVendedor.nombre}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setDirectCertVendedor(null)} 
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleDirectCertSubmit} className="p-6 space-y-4">
              {gradingError && (
                <div className="p-3 rounded-xl flex items-center gap-3 border text-xs" style={{ background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  <AlertCircle size={14} />
                  <span className="font-bold">{gradingError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl text-[10px] leading-relaxed border"
                style={{ background: 'rgba(99,102,241,0.02)', borderColor: 'rgba(99,102,241,0.15)', color: 'var(--text-muted)' }}>
                La certificación directa permite otorgarle al vendedor la calificación de roleplay de manera inmediata, omitiendo la necesidad de contestar el examen interactivo.
              </div>

              {/* Slider Score */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <label style={{ color: 'var(--text-muted)' }}>Nota de Roleplay</label>
                  <span className="text-sm font-extrabold" style={{ color: roleplayScore >= 80 ? '#10b981' : '#f59e0b' }}>
                    {roleplayScore}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  className="w-full accent-indigo-600 cursor-pointer"
                  value={roleplayScore} 
                  onChange={e => setRoleplayScore(e.target.value)} 
                />
                <div className="flex justify-between text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>
                  <span>0%</span>
                  <span className="text-emerald-500 font-extrabold">Aprobación ≥ 80%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Feedback Observaciones */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Observaciones de la Evaluación
                </label>
                <textarea 
                  className="neu-input resize-none text-xs" 
                  rows={3} 
                  placeholder="Escribe el feedback del roleplay o justificación..."
                  value={observaciones} 
                  onChange={e => setObservaciones(e.target.value)}
                  required
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
                <button 
                  type="button" 
                  onClick={() => setDirectCertVendedor(null)} 
                  className="neu-btn text-xs font-bold px-4 py-2 rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={gradingSaving}
                  className="neu-btn-accent text-xs font-extrabold px-6 py-2 rounded-xl flex items-center gap-2"
                  style={{ background: roleplayScore >= 80 ? '#10b981' : 'var(--accent)' }}
                >
                  {gradingSaving ? 'Certificando...' : 'Certificar Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
