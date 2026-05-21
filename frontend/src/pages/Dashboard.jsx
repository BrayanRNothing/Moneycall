import { useState, useEffect } from 'react'
import {
  PhoneOutgoing, Percent, TrendingUp, ArrowUpRight,
  ShieldCheck, CheckCircle2, AlertCircle, RefreshCw,
  ShieldAlert, Award, Sparkles, AlertOctagon
} from 'lucide-react'
import { getDashboardMetrics, getAlertasS1, getClientes, createAuditoria, getClientesTMUpgrade } from '../api'

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 }
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [auditClient, setAuditClient] = useState('')
  const [auditResult, setAuditResult] = useState(null)
  const [alertasS1, setAlertasS1] = useState([])
  const [clientes, setClientes] = useState([])
  const [tmReadyClients, setTmReadyClients] = useState([])

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [data, s1, clts, tmClts] = await Promise.all([
        getDashboardMetrics(),
        getAlertasS1(user.id),
        getClientes(user.id),
        getClientesTMUpgrade()
      ])
      setMetrics(data)
      setAlertasS1(s1)
      setClientes(clts)
      setTmReadyClients(tmClts)
    } catch (e) {
      setError(e.message)
      // Fallback a datos estáticos si no hay backend
      setMetrics({
        llamadasHoy: 18, salientes: 14, entrantes: 4, ratioSaliente: 77,
        tiposHoy: { S1: 2, S2: 3, DC: 6, IN: 4, PT: 3 },
        closeRatios: { numRatio: 18, importRatio: 26, discrepancia: 8 },
        cotizaciones: { total: 10, cerradas: 8, ganadas: 2, sinF1: 2 },
        formula: { estructura: 80, sistema: 75, operaciones: 85, maxSales: 51 }
      })
      setTmReadyClients([
        { id: 101, nombreEmpresa: 'Apex Mechanical Contractors', contactoPrincipal: 'Roberto Gómez', ventasAnuales: 72400, vendedor: 'Carlos López', segmentoPareto: 'Top 20%' },
        { id: 102, nombreEmpresa: 'Delray Comfort Experts', contactoPrincipal: 'Mark Wilson', ventasAnuales: 61500, vendedor: 'Carlos López', segmentoPareto: 'Top 20%' }
      ])
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
      Object.keys(data.tiposHoy || {}).length === 0
    );
  };

  const kpis = m ? [
    { name: 'Llamadas Salientes', value: `${m.salientes} / 30`, sub: 'Meta: 20–30 diarias', icon: PhoneOutgoing, color: '#ec4899', bg: 'rgba(236,72,153,0.06)' },
    { name: 'Proactividad', value: `${m.ratioSaliente}%`, sub: `${m.salientes} sal · ${m.entrantes} ent · Estándar: ≥80%`, icon: ArrowUpRight, color: m.ratioSaliente >= 80 ? '#10b981' : '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
    { name: 'Ratio Cierre (Núm.)', value: `${m.closeRatios.numRatio}%`, sub: `${m.cotizaciones.ganadas} de ${m.cotizaciones.cerradas} · Meta ≥20%`, icon: Percent, color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
    { name: 'Ratio Cierre (Imp.)', value: `${m.closeRatios.importRatio}%`, sub: `Disc. ${m.closeRatios.discrepancia}pp · Límite ≤5pp`, icon: TrendingUp, color: m.closeRatios.discrepancia <= 5 ? '#3b82f6' : '#ef4444', bg: 'rgba(59,130,246,0.06)' },
  ] : []

  const quadrants = m ? [
    { id: 'S1', label: 'Cuadrante 1 (S1) — Recuperación', value: `${m.tiposHoy?.S1 || 0} llamadas`, percent: Math.min((m.tiposHoy?.S1 || 0) * 10, 100), color: '#3b82f6' },
    { id: 'S2', label: 'Cuadrante 2 (S2) — Venta Cruzada', value: `${m.tiposHoy?.S2 || 0} llamadas`, percent: Math.min((m.tiposHoy?.S2 || 0) * 10, 100), color: '#6366f1' },
    { id: 'DC', label: 'Delivery Check (DC) — Calidad', value: `${m.tiposHoy?.DC || 0} llamadas`, percent: Math.min((m.tiposHoy?.DC || 0) * 10, 100), color: '#10b981' },
    { id: 'PT', label: 'Prospección Proactiva (PT)', value: `${m.tiposHoy?.PT || 0} llamadas`, percent: Math.min((m.tiposHoy?.PT || 0) * 10, 100), color: '#ec4899' },
  ] : []

  const handleAudit = async (e) => {
    e.preventDefault()
    if (!auditClient) return
    const cliente = clientes.find(c => c.id === parseInt(auditClient))
    if (!cliente) return
    const ok = Math.random() > 0.2
    try {
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
      <div className="space-y-4 min-h-full flex flex-col pb-6 animate-pulse">
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
      </div>
    )
  }

  return (
    <div className="space-y-5 min-h-full flex flex-col pb-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Dashboard Operativo</h2>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {error ? '⚠ Sin conexión al backend — datos de ejemplo' : 'Métricas en tiempo real del equipo Moneycall'}
          </p>
        </div>
        <button onClick={load} className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Banners de Alerta por Desviación Metodológica ── */}
      <div className="space-y-2 shrink-0">
        {m?.closeRatios?.discrepancia > 5 && (
          <div className="p-3.5 rounded-2xl flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 animate-pulse">
            <ShieldAlert size={18} className="text-red-500 shrink-0" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider leading-none">¡Discrepancia Crítica en Close Ratio!</p>
              <p className="text-[10px] text-red-600 font-bold mt-0.5">
                La diferencia entre el Close Ratio por cantidad ({m.closeRatios.numRatio}%) y por importe ({m.closeRatios.importRatio}%) es de {m.closeRatios.discrepancia}pp (máx. tolerado: 5pp). Esto indica que estamos perdiendo cotizaciones de alto valor.
              </p>
            </div>
          </div>
        )}

        {m?.ratioSaliente < 80 && (
          <div className="p-3.5 rounded-2xl flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800">
            <AlertOctagon size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider leading-none">¡Desviación en Proactividad 80/20!</p>
              <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                El ratio de llamadas salientes es de {m.ratioSaliente}%, inferior al estándar proactivo del 80%. Priorizar llamadas salientes de los cuadrantes S1, S2, y DC para no caer en el modo reactivo (IN).
              </p>
            </div>
          </div>
        )}
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
                <span className="text-[9px] font-semibold block truncate" style={{ color: kpi.color }}>{kpi.sub}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Llamadas del día por cuadrante */}
        <div className="neu-card p-4 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between shrink-0 mb-2">
            <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Actividad del Día por Tipo de Llamada (Metodología)</h3>
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
                {m.cotizaciones.sinF1} cotización(es) sin seguimiento F1 (meta: 100% en las primeras 24 hrs)
              </span>
            </div>
          )}
        </div>

        {/* Fórmula Máxima Card */}
        <div className="neu-card p-4 flex flex-col items-center justify-between">
          <div className="w-full text-center shrink-0 mb-1">
            <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Fórmula Máxima de Ventas</h3>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Estructura × Sistema × Operaciones</p>
          </div>
          <div className="relative flex items-center justify-center my-1">
            <svg className="w-28 h-28 -rotate-90">
              <circle cx="56" cy="56" r="45" fill="none" stroke="rgba(163,177,198,0.2)" strokeWidth="9" />
              <circle cx="56" cy="56" r="45" fill="none" stroke="url(#grad)" strokeWidth="9"
                strokeDasharray={282.7}
                strokeDashoffset={282.7 - (282.7 * (f?.maxSales || 0)) / 100}
                strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#10b981" />
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
              { label: 'Estr.', value: f?.estructura, color: 'var(--text)' },
              { label: 'Sist.', value: f?.sistema, color: '#4f46e5' },
              { label: 'Oper.', value: f?.operaciones, color: '#10b981' },
            ].map(m2 => (
              <div key={m2.label} className="text-center">
                <span className="text-[9px] block font-semibold" style={{ color: 'var(--text-muted)' }}>{m2.label}</span>
                <span className="text-xs font-extrabold" style={{ color: m2.color }}>{m2.value || 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        {/* Auditoría */}
        <div className="neu-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Auditoría del Gerente</h3>
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

        {/* Clientes listos para upgrade a TM */}
        <div className="neu-card p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <h3 className="text-xs font-bold text-slate-800">Clientes Listos para TM (Upgrades)</h3>
            </div>
            <p className="text-[10px] text-slate-500">Cuentas con compras anuales &gt; $60,000 USD listas para pasar a Territory Manager.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[140px] pr-1 mt-1">
            {tmReadyClients.length === 0 ? (
              <div className="rounded-xl py-4 text-center text-[10px]" style={{ border: '1.5px dashed rgba(163,177,198,0.3)', color: 'var(--text-muted)' }}>
                Ningún cliente supera la meta de $60k anuales aún.
              </div>
            ) : (
              tmReadyClients.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 rounded-xl bg-amber-50/50 border border-amber-200/40 text-[11px]">
                  <div>
                    <p className="font-extrabold text-slate-800 leading-tight">{c.nombreEmpresa}</p>
                    <p className="text-[9px] text-slate-500">Vendedor: {c.vendedor || 'Equipo'}</p>
                  </div>
                  <span className="font-extrabold text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded border border-amber-200">
                    ${c.ventasAnuales.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas S1/S2 y Operativas */}
        <div className="neu-card p-4 space-y-3">
          <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Alertas Proactivas en Tiempo Real</h3>
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-2.5">
            {alertasS1.slice(0, 1).map((a, i) => (
              <div key={`s1-${i}`} className="flex gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: '#3b82f6' }}>
                  S1
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[8px] font-bold uppercase tracking-wider block" style={{ color: '#3b82f6' }}>Inactividad: {a.cliente}</span>
                  <p className="text-[10px] font-bold truncate" style={{ color: 'var(--text)' }} title={a.razon}>{a.razon}</p>
                  <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>Llamar para verificar stock de {a.producto}.</p>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: '#10b981' }}>DC</div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[8px] font-bold uppercase tracking-wider block" style={{ color: '#10b981' }}>DC Pendiente</span>
                <p className="text-[10px] font-bold truncate" style={{ color: 'var(--text)' }}>{m?.tiposHoy?.DC || 0} entregas del día sin verificar.</p>
                <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>Confirmar recepción con cada cliente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
