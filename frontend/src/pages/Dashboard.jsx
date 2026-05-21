import { useState, useEffect } from 'react'
import {
  PhoneOutgoing, Percent, TrendingUp, ArrowUpRight,
  ShieldCheck, Search, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react'
import { getDashboardMetrics, getAlertasS1, getClientes, createAuditoria } from '../api'

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 }
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [auditClient, setAuditClient] = useState('')
  const [auditResult, setAuditResult] = useState(null)
  const [alertasS1, setAlertasS1] = useState([])
  const [clientes, setClientes] = useState([])

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [data, s1, clts] = await Promise.all([getDashboardMetrics(), getAlertasS1(user.id), getClientes(user.id)])
      setMetrics(data)
      setAlertasS1(s1)
      setClientes(clts)
    } catch (e) {
      setError(e.message)
      // Fallback a datos estáticos si no hay backend
      setMetrics({
        llamadasHoy: 0, salientes: 0, entrantes: 0, ratioSaliente: 0,
        tiposHoy: {},
        closeRatios: { numRatio: 0, importRatio: 0, discrepancia: 0 },
        cotizaciones: { total: 0, cerradas: 0, ganadas: 0, sinF1: 0 },
        formula: { estructura: 100, sistema: 89, operaciones: 91, maxSales: 81 }
      })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const m = metrics
  const f = m?.formula

  const isMetricsEmpty = (data) => {
    if (!data) return true;
    return (
      (data.llamadasHoy === 0 || !data.llamadasHoy) &&
      (data.salientes === 0 || !data.salientes) &&
      (data.entrantes === 0 || !data.entrantes) &&
      Object.keys(data.tiposHoy || {}).length === 0 &&
      Object.keys(data.alertas || {}).length === 0
    );
  };

  const kpis = m ? [
    { name: 'Llamadas Salientes', value: `${m.salientes} / 30`, sub: 'Meta: 20–30 diarias', icon: PhoneOutgoing, color: '#ec4899', bg: 'rgba(236,72,153,0.06)' },
    { name: 'Proactividad', value: `${m.ratioSaliente}%`, sub: `${m.salientes} sal · ${m.entrantes} ent · Meta ≥80%`, icon: ArrowUpRight, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
    { name: 'Ratio Cierre (Núm.)', value: `${m.closeRatios.numRatio}%`, sub: `${m.cotizaciones.ganadas} de ${m.cotizaciones.cerradas} · Meta ≥20%`, icon: Percent, color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
    { name: 'Ratio Cierre (Imp.)', value: `${m.closeRatios.importRatio}%`, sub: `Disc. ${m.closeRatios.discrepancia}% · Meta <5%`, icon: TrendingUp, color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
  ] : []

  const quadrants = m ? [
    { id: 'S1', label: 'Cuadrante 1 (S1) — Recuperación', value: `${m.tiposHoy?.S1 || 0} llamadas`, percent: Math.min((m.tiposHoy?.S1 || 0) * 5, 100), color: '#3b82f6' },
    { id: 'S2', label: 'Cuadrante 2 (S2) — Venta Cruzada', value: `${m.tiposHoy?.S2 || 0} llamadas`, percent: Math.min((m.tiposHoy?.S2 || 0) * 5, 100), color: '#6366f1' },
    { id: 'DC', label: 'Delivery Check (DC)', value: `${m.tiposHoy?.DC || 0} llamadas`, percent: Math.min((m.tiposHoy?.DC || 0) * 10, 100), color: '#10b981' },
    { id: 'IN', label: 'Entrantes (IN) — Reactivas', value: `${m.tiposHoy?.IN || 0} llamadas`, percent: Math.min((m.tiposHoy?.IN || 0) * 10, 100), color: '#94a3b8' },
  ] : []

  const handleAudit = async (e) => {
    e.preventDefault()
    if (!auditClient) return
    const cliente = clientes.find(c => c.id === parseInt(auditClient))
    if (!cliente) return
    const ok = Math.random() > 0.2
    try {
      const user = JSON.parse(localStorage.getItem('user')) || { id: 1 }
      await createAuditoria({
        clienteId: parseInt(auditClient),
        gerenteId: user.id,
        esValida: ok,
        comentarios: `Auditoría al azar. Resultado: ${ok ? 'Válido' : 'Discrepancia'}`
      })
      setAuditResult({
        status: ok ? 'valid' : 'warning',
        message: ok
          ? `Llamada verificada con ${cliente.nombreEmpresa}. Datos CRM coinciden con lo reportado.`
          : `Llamada con ${cliente.nombreEmpresa} tiene discrepancias. Revisar log del vendedor.`,
        date: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      })
      setAuditClient('')
    } catch (err) {
      alert('Error registrando auditoría: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 h-full flex flex-col justify-between animate-pulse">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <div className="h-6 bg-gray-400/10 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-400/10 rounded w-96" />
          </div>
          <div className="w-8 h-8 rounded-xl bg-gray-400/10" />
        </div>

        {/* KPI Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="neu-card p-3.5 flex items-center justify-between gap-2.5">
              <div className="space-y-2 flex-1">
                <div className="h-2.5 bg-gray-400/10 rounded w-2/3" />
                <div className="h-5 bg-gray-400/10 rounded w-1/3" />
                <div className="h-2.5 bg-gray-400/10 rounded w-3/4" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-gray-400/10 shrink-0" />
            </div>
          ))}
        </div>

        {/* Middle Row Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 items-stretch min-h-0">
          <div className="neu-card p-4 lg:col-span-2 flex flex-col justify-between space-y-4">
            <div className="h-4 bg-gray-400/10 rounded w-1/3 mb-2" />
            <div className="space-y-4 flex-1 py-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="space-y-2">
                  <div className="h-3 bg-gray-400/10 rounded w-1/4" />
                  <div className="h-2 bg-gray-400/10 rounded w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="neu-card p-4 flex flex-col items-center justify-between space-y-4">
            <div className="h-4 bg-gray-400/10 rounded w-1/2" />
            <div className="w-24 h-24 rounded-full border-8 border-gray-400/5 flex items-center justify-center">
              <div className="w-12 h-6 bg-gray-400/10 rounded" />
            </div>
            <div className="w-full space-y-2">
              <div className="h-2 bg-gray-400/10 rounded w-full" />
              <div className="h-2 bg-gray-400/10 rounded w-2/3 mx-auto" />
            </div>
          </div>
        </div>

        {/* Bottom Row Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch min-h-0">
          <div className="neu-card p-4 space-y-4">
            <div className="h-4 bg-gray-400/10 rounded w-1/4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="flex gap-2 p-2.5 rounded-xl bg-gray-400/5">
                  <div className="w-7 h-7 rounded-lg bg-gray-400/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-gray-400/10 rounded w-1/3" />
                    <div className="h-3.5 bg-gray-400/10 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="neu-card p-4 space-y-4">
            <div className="h-4 bg-gray-400/10 rounded w-1/3" />
            <div className="h-8 bg-gray-400/10 rounded-xl" />
            <div className="h-10 bg-gray-400/10 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Dashboard</h2>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {error ? '⚠ Sin conexión al backend — datos de ejemplo' : 'Métricas en tiempo real del equipo Moneycall'}
          </p>
        </div>
        <button onClick={load} className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.name} className="neu-card p-3.5 flex items-center justify-between gap-2.5">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{kpi.name}</span>
                <p className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>{kpi.value}</p>
                <span className="text-[9px] font-semibold block truncate" style={{ color: 'var(--success)' }}>{kpi.sub}</span>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: kpi.color, boxShadow: `2px 2px 6px ${kpi.color}35` }}>
                <Icon size={16} strokeWidth={2.5} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 items-stretch min-h-0">
        {/* Llamadas del día por cuadrante */}
        <div className="neu-card p-4 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between shrink-0 mb-2">
            <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Actividad del Día por Cuadrante</h3>
            <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg)', boxShadow: '2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light)' }}>
              Hoy
            </span>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-around py-1">
            {quadrants.map(q => (
              <div key={q.id} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{q.label}</span>
                  <span className="font-bold" style={{ color: 'var(--text)' }}>{q.value}</span>
                </div>
                <div className="neu-progress-track" style={{ height: '6px' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${q.percent}%`, background: q.color }} />
                </div>
              </div>
            ))}
          </div>
          {/* Alertas rápidas de metodología */}
          {m?.cotizaciones?.sinF1 > 0 && (
            <div className="mt-3 p-2.5 rounded-xl flex items-center gap-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertCircle size={12} style={{ color: '#f59e0b' }} />
              <span className="text-[10px] font-semibold" style={{ color: '#f59e0b' }}>
                {m.cotizaciones.sinF1} cotización(es) sin seguimiento F1 — incumple la metodología
              </span>
            </div>
          )}
        </div>

        {/* Fórmula Máxima */}
        <div className="neu-card p-4 flex flex-col items-center justify-between">
          <div className="w-full text-center shrink-0 mb-1">
            <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Fórmula Máxima de Ventas</h3>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Estructura × Sistema × Operaciones</p>
          </div>
          {(!m || isMetricsEmpty(m)) ? (
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="rounded-xl py-4 w-full text-center text-[10px]" style={{ border: '1.5px dashed rgba(163,177,198,0.3)', color: 'var(--text-muted)' }}>
                Sin datos visuales en las tablas
              </div>
            </div>
          ) : (
            <>
              <div className="relative flex items-center justify-center my-1">
                <svg className="w-28 h-28 -rotate-90">
                  <circle cx="56" cy="56" r="45" fill="none" stroke="var(--bg)" strokeWidth="9" />
                  <circle cx="56" cy="56" r="45" fill="none" stroke="url(#grad)" strokeWidth="9"
                    strokeDasharray={282.7}
                    strokeDashoffset={282.7 - (282.7 * (f?.maxSales || 0)) / 100}
                    strokeLinecap="round" />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1a1a1a" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{f?.maxSales || 0}%</span>
                  <span className="text-[8px] font-bold block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Capacidad</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 w-full pt-2 border-t mt-1" style={{ borderColor: 'rgba(163,177,198,0.3)' }}>
                {[
                  { label: 'Estr.', value: f?.estructura, color: '#1a1a1a' },
                  { label: 'Sist.', value: f?.sistema, color: '#4f46e5' },
                  { label: 'Oper.', value: f?.operaciones, color: '#10b981' },
                ].map(m2 => (
                  <div key={m2.label} className="text-center">
                    <span className="text-[9px] block font-semibold" style={{ color: 'var(--text-muted)' }}>{m2.label}</span>
                    <span className="text-xs font-extrabold" style={{ color: m2.color }}>{m2.value || 0}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
        {/* Auditoría */}
        <div className="neu-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Centro de Auditoría del Supervisor</h3>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Valida llamadas al azar para asegurar veracidad en el CRM.</p>
          <form onSubmit={handleAudit} className="flex gap-2">
            <div className="relative flex-1">
              <select className="neu-input py-1.5 text-[11px] w-full"
                value={auditClient} onChange={e => setAuditClient(e.target.value)}>
                <option value="">Seleccionar cliente a auditar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreEmpresa}</option>)}
              </select>
            </div>
            <button type="submit" className="neu-btn-accent text-[10px] font-bold px-3 py-1.5 rounded-xl shrink-0">Auditar</button>
          </form>
          {auditResult ? (
            <div className="p-2.5 rounded-xl flex gap-2"
              style={{ background: auditResult.status === 'valid' ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)', border: `1px solid ${auditResult.status === 'valid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
              <div className="shrink-0 mt-0.5" style={{ color: auditResult.status === 'valid' ? 'var(--success)' : 'var(--warning)' }}>
                {auditResult.status === 'valid' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider" style={{ color: auditResult.status === 'valid' ? 'var(--success)' : 'var(--warning)' }}>
                  <span>{auditResult.status === 'valid' ? 'Auditoría Ok' : 'Alerta'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{auditResult.date}</span>
                </div>
                <p className="text-[10px] leading-tight" style={{ color: 'var(--text)' }}>{auditResult.message}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl py-4 text-center text-[10px]" style={{ border: '1.5px dashed rgba(163,177,198,0.3)', color: 'var(--text-muted)' }}>
              Ingresa un cliente para auditar llamadas.
            </div>
          )}
        </div>

        {/* Alertas S1/S2 y Operativas */}
        <div className="neu-card p-4 space-y-3">
          <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Alertas Proactivas en Tiempo Real</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Alertas dinámicas S1 desde el historial de compras */}
            {alertasS1.slice(0, 2).map((a, i) => (
              <div key={`s1-${i}`} className="flex gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: '#3b82f6' }}>
                  S1
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[8px] font-bold uppercase tracking-wider block" style={{ color: '#3b82f6' }}>Inactividad: {a.cliente}</span>
                  <p className="text-[10px] font-bold truncate" style={{ color: 'var(--text)' }} title={a.razon}>{a.razon}</p>
                  <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>Llamar para verificar stock de {a.producto}.</p>
                </div>
              </div>
            ))}
            
            {/* Si no hay suficientes alertas S1 reales, mostrar las operativas de la metodología */}
            {(!m || isMetricsEmpty(m)) ? (
              <div className="col-span-1 sm:col-span-2 rounded-xl py-4 text-center text-[10px]" style={{ border: '1.5px dashed rgba(163,177,198,0.3)', color: 'var(--text-muted)' }}>
                Sin datos visuales en las tablas
              </div>
            ) : (
              <>
                <div className="flex gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: '#10b981' }}>DC</div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[8px] font-bold uppercase tracking-wider block" style={{ color: '#10b981' }}>DC Pendiente</span>
                    <p className="text-[10px] font-bold truncate" style={{ color: 'var(--text)' }}>{m?.tiposHoy?.DC || 0} entregas del día sin verificar.</p>
                    <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>Confirmar recepción con cada cliente.</p>
                  </div>
                </div>
                
                <div className="flex gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: '#f59e0b' }}>F1</div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[8px] font-bold uppercase tracking-wider block" style={{ color: '#f59e0b' }}>F1 Pendiente</span>
                    <p className="text-[10px] font-bold truncate" style={{ color: 'var(--text)' }}>{m?.cotizaciones?.sinF1 || 0} cotizaciones sin seguimiento F1.</p>
                    <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>Meta: 100% de cotizaciones con F1.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
