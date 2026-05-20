import { useState, useEffect } from 'react'
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle2, Info, Award, BookOpen, FileCheck, UserCheck, X, Sparkles, Sliders, Database, Users, Star, Search, Check } from 'lucide-react'
import { getConfig, saveConfig, getVendedores, habilitarExamen, certificarVendedor } from '../api'

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

export default function Configuracion() {
  const [cfg, setCfg] = useState(null)
  const [initialCfg, setInitialCfg] = useState(null)
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  
  // Navigation & Search Tabs
  const [activeTab, setActiveTab] = useState('formula') // 'formula' or 'equipo'
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
      const [configData, vendedoresData] = await Promise.all([getConfig(), getVendedores()])
      setCfg(configData)
      setInitialCfg(JSON.parse(JSON.stringify(configData)))
      setVendedores(vendedoresData)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true); setSaved(false)
    try {
      await saveConfig(cfg)
      setInitialCfg(JSON.parse(JSON.stringify(cfg)))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { alert('Error: ' + e.message) } finally { setSaving(false) }
  }

  const handleReset = () => {
    if (initialCfg) {
      setCfg(JSON.parse(JSON.stringify(initialCfg)))
    }
  }

  const update = (key, value) => setCfg(prev => ({ ...prev, [key]: value }))

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

  // Calcular fórmula en tiempo real
  const calc = cfg ? (() => {
    const gerenteScore = cfg.gerenteCalificado ? 100 : 50
    const vendScore = cfg.totalVendedores > 0 ? Math.round((cfg.vendedoresCertificados / cfg.totalVendedores) * 100) : 0
    const estructura = Math.round(gerenteScore * 0.7 + vendScore * 0.3)
    const sistema = 89 // Viene del backend en dashboard real
    const operaciones = Math.round(cfg.otd * 0.9 + ((cfg.ar + (cfg.csr / 5 * 100) + cfg.idScore) / 3) * 0.1)
    const maxSales = Math.round((estructura * sistema * operaciones) / 10000)
    return { estructura, sistema, operaciones, maxSales, gerenteScore, vendScore }
  })() : null

  const isDirty = cfg && initialCfg && JSON.stringify(cfg) !== JSON.stringify(initialCfg)

  const filteredVendedores = vendedores.filter(v => 
    v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="text-center py-12 text-slate-500">Cargando configuración...</div>

  return (
    <div className="space-y-6 max-w-4xl relative pb-24">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Settings size={22} style={{ color: 'var(--accent)' }} />
            Ajustes y Centro de Control
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Configura y simula el impacto de los KPIs y la certificación metodológica de tu equipo.
          </p>
        </div>

        {/* Selector de Pestañas Neumórfico */}
        <div className="flex p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/40 border border-slate-300/10 shadow-inner w-full sm:w-auto shrink-0 max-w-xs self-start sm:self-center">
          <button 
            type="button"
            onClick={() => setActiveTab('formula')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'formula' 
                ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sliders size={13} />
            Fórmula Máxima
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('equipo')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'equipo' 
                ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users size={13} />
            Certificaciones
          </button>
        </div>
      </div>

      {error && (
        <div className="neu-card p-3 flex items-center gap-3 border border-red-500/20 bg-red-500/[0.02]">
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs text-red-500">Sin conexión al backend · {error}</p>
        </div>
      )}

      {/* ─── PESTAÑA: FÓRMULA MÁXIMA ─── */}
      {activeTab === 'formula' && cfg && calc && (
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
                        {cfg.totalVendedores}
                      </span>
                      <span className="text-[8px] text-slate-500 mt-1">Registrados en CRM</span>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-300/10 bg-indigo-500/[0.01] flex flex-col justify-center border-indigo-500/5">
                      <span className="text-[8px] font-bold text-indigo-400 uppercase">Certificados</span>
                      <span className="text-lg font-black text-indigo-500 mt-0.5 leading-none">
                        {cfg.vendedoresCertificados}
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

      {/* ─── PESTAÑA: EQUIPO Y CERTIFICACIONES ─── */}
      {activeTab === 'equipo' && cfg && (
        <div className="neu-card p-5 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/10 pb-4 gap-4">
            <div className="flex items-center gap-2">
              <Database size={18} style={{ color: 'var(--accent)' }} />
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Estructura del Equipo Moneycall</h3>
                <p className="text-[10px] text-slate-500">Maneja las evaluaciones de roleplay, bloqueos operativos y exámenes metodológicos.</p>
              </div>
            </div>

            {/* Buscador de Asesores */}
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

          {/* Listado y Evaluaciones */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pt-2">
              <BookOpen size={14} className="text-slate-500" />
              <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Exámenes de Certificación (Joe Ellers / Quadrants)
              </h4>
            </div>

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
      )}

      {/* ─── BARRA FLOTANTE DE CAMBIOS SIN GUARDAR (STICKY SAVE BAR) ─── */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-5 shadow-2xl border border-indigo-500/20 animate-fade-in w-[90%] max-w-lg">
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

      {/* MODALES EXISTENTES EXACTAMENTE IGUALES PERO OPTIMIZADOS VISUALMENTE */}
      
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

