import { useState, useEffect } from 'react'
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle2, Sparkles, Sliders, Database, User, Lock } from 'lucide-react'
import { getConfig, saveConfig, updateVendedor, getDashboardMetrics } from '../api'

const getColorByValue = (val) => {
  if (val < 70) return '#ef4444' // Red
  if (val < 85) return '#f59e0b' // Orange
  return '#10b981' // Green
}

const getColorByCSR = (val) => {
  if (val < 3.5) return '#ef4444'
  if (val < 4.2) return '#f59e0b'
  return '#10b981'
}

export default function Configuracion({ currentUser, onUserUpdate }) {
  const [cfg, setCfg] = useState(null)
  const [initialCfg, setInitialCfg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [realMetrics, setRealMetrics] = useState(null)
  
  // Navigation & Tabs
  const showFormula = currentUser?.isAdmin || currentUser?.isSuperAdmin
  const [activeTab, setActiveTab] = useState(showFormula ? 'formula' : 'perfil')

  // Profile Form States
  const [nombre, setNombre] = useState(currentUser?.nombre || '')
  const [username, setUsername] = useState(currentUser?.username || '')
  const [password, setPassword] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // Sync profile state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setNombre(currentUser.nombre || '')
      setUsername(currentUser.username || '')
    }
  }, [currentUser])

  const load = async () => {
    if (!showFormula) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [configData, metricsData] = await Promise.all([
        getConfig(),
        getDashboardMetrics(currentUser?.id).catch(() => null)
      ])
      setCfg(configData)
      setInitialCfg(JSON.parse(JSON.stringify(configData)))
      if (metricsData) {
        setRealMetrics(metricsData)
      }
    } catch (e) { 
      setError(e.message) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { 
    load() 
  }, [showFormula])

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true)
    try {
      await saveConfig(cfg)
      setInitialCfg(JSON.parse(JSON.stringify(cfg)))
      const toast = document.getElementById('toast-save')
      if (toast) {
        toast.classList.remove('opacity-0')
        setTimeout(() => toast.classList.add('opacity-0'), 3000)
      }
    } catch (e) { 
      alert('Error: ' + e.message) 
    } finally { 
      setSaving(false) 
    }
  }

  const handleReset = () => {
    if (initialCfg) {
      setCfg(JSON.parse(JSON.stringify(initialCfg)))
    }
  }

  const update = (key, value) => setCfg(prev => ({ ...prev, [key]: value }))

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileSaved(false)
    try {
      const payload = { nombre, username }
      if (password.trim()) {
        payload.password = password.trim()
      }
      const updated = await updateVendedor(currentUser.id, payload)
      if (onUserUpdate) {
        onUserUpdate(updated)
      }
      setProfileSaved(true)
      setPassword('')
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      setProfileError(err.message || 'Error al actualizar el perfil')
    } finally {
      setProfileSaving(false)
    }
  }

  // Calcular fórmula en tiempo real
  const calc = cfg ? (() => {
    const totalVends = realMetrics?.formula?.cfg?.totalVendedores ?? cfg.totalVendedores
    const certVends = realMetrics?.formula?.cfg?.vendedoresCertificados ?? cfg.vendedoresCertificados
    const isGerCalificado = realMetrics?.formula?.cfg?.gerenteCalificado ?? cfg.gerenteCalificado

    const gerenteScore = isGerCalificado ? 100 : 50
    const vendScore = totalVends > 0 ? Math.round((certVends / totalVends) * 100) : 0
    const estructura = Math.round(gerenteScore * 0.7 + vendScore * 0.3)
    
    // Sistema dinámico del backend de este gerente, si no hay, por defecto 0
    const sistema = realMetrics?.formula?.sistema ?? 0
    
    const operaciones = Math.round(cfg.otd * 0.9 + ((cfg.ar + (cfg.csr / 5 * 100) + cfg.idScore) / 3) * 0.1)
    const maxSales = Math.round((estructura * sistema * operaciones) / 10000)
    return { estructura, sistema, operaciones, maxSales, gerenteScore, vendScore, totalVends, certVends }
  })() : null

  const isDirty = cfg && initialCfg && JSON.stringify(cfg) !== JSON.stringify(initialCfg)

  if (loading) return <div className="text-center py-12 text-slate-500">Cargando configuración...</div>

  return (
    <div className="space-y-6 w-full relative pb-24">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Settings size={22} style={{ color: 'var(--accent)' }} />
            Ajustes
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {showFormula 
              ? 'Configura la fórmula máxima de ventas de Joe Ellers y edita tu perfil personal.'
              : 'Edita tu información personal y actualiza tus credenciales de acceso.'}
          </p>
        </div>

        {/* Selector de Pestañas Neumórfico (solo si el rol tiene acceso a la fórmula) */}
        {showFormula && (
          <div className="flex p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/40 border border-slate-300/10 shadow-inner w-full sm:w-auto shrink-0 max-w-xs self-start sm:self-center">
            <button 
              type="button"
              onClick={() => setActiveTab('formula')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'formula' 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sliders size={13} />
              Fórmula Máxima
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('perfil')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'perfil' 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <User size={13} />
              Editar Perfil
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="neu-card p-3 flex items-center gap-3 border border-red-500/20 bg-red-500/[0.02]">
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs text-red-500">Sin conexión al backend · {error}</p>
        </div>
      )}

      {/* ─── PESTAÑA: FÓRMULA MÁXIMA ─── */}
      {showFormula && activeTab === 'formula' && cfg && calc && (
        <div className="space-y-6 animate-fade-in">
          {/* Preview fórmula en tiempo real */}
          <div className="neu-card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-200/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                  Simulador de Capacidad de Ventas en Tiempo Real
                </h3>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                Fórmula de Joe Ellers
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Estructura', value: calc.estructura, color: '#6366f1', desc: 'Gerente (70%) + Equipo (30%)' },
                { label: 'Sistema', value: calc.sistema, color: '#4f46e5', desc: 'Procesos y Conversión CRM' },
                { label: 'Operaciones', value: calc.operaciones, color: '#10b981', desc: 'OTD (90%) + Soporte (10%)' },
                { label: 'CAPACIDAD MÁXIMA', value: calc.maxSales, color: calc.maxSales >= 80 ? '#10b981' : '#f59e0b', desc: 'Desempeño Potencial Global', isResult: true },
              ].map((m, i) => (
                <div key={m.label} className={`neu-inset rounded-2xl p-4 space-y-1 relative transition-all duration-300 hover:scale-[1.03] ${m.isResult ? 'border border-indigo-500/10 shadow-lg' : ''}`}>
                  {i < 3 && (
                    <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      {i === 2 ? '=' : '×'}
                    </span>
                  )}
                  <span className="text-3xl font-black block" style={{ color: m.color }}>{m.value}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text)' }}>{m.label}</span>
                  <span className="text-[8px] block leading-tight mt-0.5 text-slate-500">{m.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COMPONENTE A: ESTRUCTURA (30%) */}
            <div className="neu-card p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/10 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">1. Componente Estructura</h4>
                      <p className="text-[9px] text-slate-500">Peso en fórmula: 30% · Mide capacitación del equipo.</p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="space-y-4 mt-3">
                  {/* Gerente Calificado Selector */}
                  <div className="space-y-1.5 p-3 rounded-xl border border-slate-300/10 bg-slate-300/[0.02]">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">Estatus de Gerente</span>
                        <p className="text-[8px] text-slate-500 leading-none mt-0.5">¿Cuenta con certificación de roleplay vigente?</p>
                      </div>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${cfg.gerenteCalificado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {cfg.gerenteCalificado ? '100% Score' : '50% Score'}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button 
                        type="button" 
                        onClick={() => update('gerenteCalificado', true)}
                        className={`flex-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                          cfg.gerenteCalificado 
                            ? 'bg-emerald-500 text-white shadow-md' 
                            : 'bg-slate-300/10 text-slate-500 border border-slate-300/20'
                        }`}
                      >
                        ✓ Calificado
                      </button>
                      <button 
                        type="button" 
                        onClick={() => update('gerenteCalificado', false)}
                        className={`flex-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                          !cfg.gerenteCalificado 
                            ? 'bg-red-500 text-white shadow-md' 
                            : 'bg-slate-300/10 text-slate-500 border border-slate-300/20'
                        }`}
                      >
                        ✗ No Calificado
                      </button>
                    </div>
                  </div>

                  {/* Asesores Stats Sync */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-300/10 bg-slate-300/[0.01] flex flex-col justify-center">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Total Vendedores</span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5 leading-none">
                        {calc.totalVends}
                      </span>
                      <span className="text-[8px] text-slate-500 mt-1">Registrados en CRM</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-300/10 bg-indigo-500/[0.01] flex flex-col justify-center border-indigo-500/5">
                      <span className="text-[8px] font-bold text-indigo-400 uppercase">Certificados</span>
                      <span className="text-lg font-black text-indigo-500 mt-0.5 leading-none">
                        {calc.certVends}
                      </span>
                      <span className="text-[8px] text-slate-500 mt-1">Roleplay ≥ 80%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Score Estructura Progreso */}
              <div className="pt-3 border-t border-slate-200/10 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                  <span>Sub-Score Estructura</span>
                  <span className="font-extrabold text-indigo-500">{calc.estructura}%</span>
                </div>
                <div className="neu-progress-track">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${calc.estructura}%` }} />
                </div>
              </div>
            </div>

            {/* COMPONENTE B: SISTEMA (PROCESOS) */}
            <div className="neu-card p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/10 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="text-indigo-500 animate-spin-slow" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">2. Componente Sistema</h4>
                      <p className="text-[9px] text-slate-500">Mide efectividad del proceso de ventas y llamadas.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-3">
                  <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/[0.01] space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Sincronización Automática
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      El componente **Sistema** se calcula de forma dinámica en base al flujo operativo diario de tus vendedores:
                    </p>
                    <ul className="text-[9px] text-slate-500 space-y-1 pl-1">
                      <li>• **40%:** Ratio de llamadas proactivas del día.</li>
                      <li>• **30%:** Conversión numérica de cotizaciones (Cerradas/Ganadas).</li>
                      <li>• **30%:** Conversión de valor de cartera ($ Ganado vs $ Ofrecido).</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sub-Score Sistema Progreso */}
              <div className="pt-3 border-t border-slate-200/10 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                  <span>Sub-Score Sistema (Fijo/Desarrollo)</span>
                  <span className="font-extrabold text-indigo-500">{calc.sistema}%</span>
                </div>
                <div className="neu-progress-track">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-300" style={{ width: `${calc.sistema}%` }} />
                </div>
              </div>
            </div>

          </div>

          {/* COMPONENTE C: OPERACIONES (DISTRIBUCIÓN Y SERVICIO) */}
          <div className="neu-card p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-emerald-500" />
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">3. Componente Operaciones (Servicio y Logística)</h3>
                  <p className="text-[9px] text-slate-500">
                    Mide el servicio al cliente y logística. **Fórmula:** OTD × 90% + [AR + ID + (CSR/5×100)] / 3 × 10%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* OTD: EL KPI PRINCIPAL (90% del peso) */}
              <div className="space-y-4 justify-between flex flex-col p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01]">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="text-slate-700 dark:text-slate-300">OTD — On-Time Delivery (Almacén)</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded" style={{ color: 'white', background: getColorByValue(cfg.otd) }}>
                      {cfg.otd}%
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">
                    Porcentaje de entregas a tiempo al cliente. Representa el **90%** de la calificación operativa total.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none"
                    value={cfg.otd || 0} 
                    onChange={e => update('otd', parseFloat(e.target.value))} 
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-500">
                    <span>Malo (&lt;70%)</span>
                    <span>Regular (70-85%)</span>
                    <span>Excelente (&ge;85%)</span>
                  </div>
                </div>
              </div>

              {/* SLIDERS SECUNDARIOS (10% acumulado) */}
              <div className="space-y-4">
                {/* CSR Slider */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-300/10 bg-slate-300/[0.02]">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="text-slate-600 dark:text-slate-400">CSR — Satisfacción (1.0 - 5.0)</span>
                    <span className="text-xs font-black flex items-center gap-0.5" style={{ color: getColorByCSR(cfg.csr) }}>
                      ★ {cfg.csr?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="0.1"
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none"
                    value={cfg.csr || 1} 
                    onChange={e => update('csr', parseFloat(e.target.value))} 
                  />
                  <p className="text-[8px] text-slate-500 leading-none">
                    Promedio de encuestas. Equivale a **{Math.round((cfg.csr / 5) * 100)}%** de soporte operativo.
                  </p>
                </div>

                {/* AR Slider */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-300/10 bg-slate-300/[0.02]">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="text-slate-600 dark:text-slate-400">AR — Plazo de Cobranza (%)</span>
                    <span className="text-xs font-black" style={{ color: getColorByValue(cfg.ar) }}>
                      {cfg.ar}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none"
                    value={cfg.ar || 0} 
                    onChange={e => update('ar', parseFloat(e.target.value))} 
                  />
                </div>

                {/* ID Score (Invoice Accuracy) Slider */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-300/10 bg-slate-300/[0.02]">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="text-slate-600 dark:text-slate-400">ID — Facturación Correcta (%)</span>
                    <span className="text-xs font-black" style={{ color: getColorByValue(cfg.idScore) }}>
                      {cfg.idScore}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none"
                    value={cfg.idScore || 0} 
                    onChange={e => update('idScore', parseFloat(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            {/* Sub-Score Operaciones Progreso */}
            <div className="pt-3 border-t border-slate-200/10">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                <span>Sub-Score Operaciones</span>
                <span className="font-extrabold text-emerald-500">{calc.operaciones}%</span>
              </div>
              <div className="neu-progress-track">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300" style={{ width: `${calc.operaciones}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PESTAÑA: EDITAR PERFIL ─── */}
      {activeTab === 'perfil' && (
        <div className="neu-card p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
          <div className="border-b border-slate-200/10 pb-4">
            <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <User size={18} style={{ color: 'var(--accent)' }} />
              Editar Información de Perfil
            </h3>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Actualiza tus datos públicos del CRM y cambia tu contraseña de acceso si lo deseas.
            </p>
          </div>

          {profileError && (
            <div className="p-3.5 rounded-xl border flex items-center gap-2 text-xs"
              style={{ background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              <AlertCircle size={14} className="shrink-0" />
              <span className="font-semibold">{profileError}</span>
            </div>
          )}

          {profileSaved && (
            <div className="p-3.5 rounded-xl border flex items-center gap-2 text-xs"
              style={{ background: 'rgba(16,185,129,0.02)', borderColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
              <CheckCircle2 size={14} className="shrink-0" />
              <span className="font-extrabold">¡Perfil actualizado correctamente!</span>
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Input Nombre */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Nombre Completo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={14} />
                </span>
                <input 
                  type="text" 
                  className="neu-input pl-9"
                  placeholder="Ej. Brayan R."
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Nombre de Usuario (@username)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">
                  @
                </span>
                <input 
                  type="text" 
                  className="neu-input pl-8"
                  placeholder="ejemplo"
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Nueva Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={14} />
                </span>
                <input 
                  type="password" 
                  className="neu-input pl-9"
                  placeholder="Dejar en blanco para conservar la actual"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <p className="text-[8.5px]" style={{ color: 'var(--text-muted)' }}>
                Por seguridad, la contraseña debe ser robusta si decides cambiarla.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={profileSaving}
                className="neu-btn-accent w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 hover:scale-[1.01] transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <Save size={14} />
                {profileSaving ? 'Guardando Perfil...' : 'Guardar Información'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── BARRA FLOTANTE DE SIMULADOR (STICKY SAVE BAR) ─── */}
      {showFormula && activeTab === 'formula' && isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-5 shadow-2xl border border-indigo-500/20 animate-fade-in w-[90%] max-w-lg">
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <AlertCircle size={10} />
              Ajustes modificados
            </span>
            <span className="text-[9px] text-slate-400">
              Has ajustado valores operativos en el simulador.
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              type="button" 
              onClick={handleReset} 
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
            >
              Descartar
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={saving} 
              className="px-4 py-1.5 rounded-xl text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
            >
              <Save size={11} /> 
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      {/* Toast Save Alert */}
      <div 
        id="toast-save"
        className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 border border-indigo-500/20 shadow-2xl opacity-0 transition-opacity duration-300 pointer-events-none z-50 text-xs font-bold"
      >
        <CheckCircle2 size={14} className="text-emerald-500 animate-bounce" />
        Configuración guardada en base de datos.
      </div>
    </div>
  )
}
