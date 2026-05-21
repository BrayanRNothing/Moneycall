import { useState, useEffect } from 'react'
import { FileText, Plus, CheckCircle2, XCircle, Clock, X, RefreshCw, AlertCircle } from 'lucide-react'
import { getCotizaciones, createCotizacion, logF1, closeCotizacion, getClientes } from '../api'

export default function Quotes() {
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 }
  const [quotes, setQuotes] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [f1Modal, setF1Modal] = useState(null)
  const [f1Date, setF1Date] = useState('')
  const [newClientId, setNewClientId] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [qs, clts] = await Promise.all([getCotizaciones(), getClientes(user.id)])
      setQuotes(qs)
      setClientes(clts)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault(); if (!newClientId || !newAmount) return
    setSaving(true)
    try {
      await createCotizacion({ clienteId: newClientId, monto: parseFloat(newAmount) })
      await load()
      setNewClientId(''); setNewAmount(''); setShowAdd(false)
    } catch (e) { alert('Error: ' + e.message) } finally { setSaving(false) }
  }

  const handleF1 = async (e) => {
    e.preventDefault(); if (!f1Date) return
    setSaving(true)
    try {
      await logF1(f1Modal, f1Date)
      await load()
      setF1Modal(null); setF1Date('')
    } catch (e) { alert('Error: ' + e.message) } finally { setSaving(false) }
  }

  const handleClose = async (id, estado) => {
    try { await closeCotizacion(id, estado); await load() }
    catch (e) { alert('Error: ' + e.message) }
  }

  // Métricas
  const closed = quotes.filter(q => q.estado !== 'Pendiente')
  const won = quotes.filter(q => q.estado === 'Ganada')
  const numRate = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0
  const totalAmt = closed.reduce((s, q) => s + q.monto, 0)
  const wonAmt = won.reduce((s, q) => s + q.monto, 0)
  const finRate = totalAmt > 0 ? Math.round((wonAmt / totalAmt) * 100) : 0
  const disc = Math.abs(numRate - finRate)

  // Alertas: cotizaciones pendientes sin F1 (incumplimiento de la metodología)
  const sinF1 = quotes.filter(q => q.estado === 'Pendiente' && !q.seguimientoF1)
  const f2Urgentes = quotes.filter(q => q.estado === 'Pendiente' && q.seguimientoF1 && !q.seguimientoF2 && q.fechaDecisionF1 && new Date(q.fechaDecisionF1) <= new Date())

  const statusStyle = s => ({
    Ganada: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    Perdida: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    Pendiente: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  }[s])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <FileText size={22} style={{ color: 'var(--accent)' }} />
            Cotizaciones & F1/F2
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Seguimiento al 100% — nunca cotizar y olvidar.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}><RefreshCw size={14} /></button>
          <button onClick={() => setShowAdd(!showAdd)} className="neu-btn-accent text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Plus size={15} /> Nueva Cotización
          </button>
        </div>
      </div>

      {error && (
        <div className="neu-card p-3 flex items-center gap-3" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs" style={{ color: '#ef4444' }}>Sin conexión al backend · {error}</p>
          <button onClick={load} className="ml-auto neu-btn text-xs px-3 py-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>Reintentar</button>
        </div>
      )}

      {/* Alertas de metodología */}
      {(sinF1.length > 0 || f2Urgentes.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sinF1.length > 0 && (
            <div className="neu-card p-4 flex items-center gap-3" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
              <AlertCircle size={18} style={{ color: '#f59e0b' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: '#f59e0b' }}>⚠ {sinF1.length} cotización(es) sin F1</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>La metodología exige F1 al 100% de cotizaciones.</p>
              </div>
            </div>
          )}
          {f2Urgentes.length > 0 && (
            <div className="neu-card p-4 flex items-center gap-3" style={{ border: '1px solid rgba(236,72,153,0.3)' }}>
              <AlertCircle size={18} style={{ color: '#ec4899' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: '#ec4899' }}>🔔 {f2Urgentes.length} F2 vencido(s) hoy</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Fecha de decisión del cliente ya pasó. ¡Llamar ahora!</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Ratio Cierre Numérico', value: `${numRate}%`, sub: `${won.length} de ${closed.length} ganadas`, color: '#3b82f6', bar: numRate },
          { label: 'Ratio Cierre por Importe', value: `${finRate}%`, sub: `$${wonAmt.toLocaleString()} de $${totalAmt.toLocaleString()}`, color: '#6366f1', bar: finRate },
          { label: 'Discrepancia de Ratios', value: `${disc}%`, sub: disc < 5 ? '✓ Dentro del estándar (<5%)' : '⚠ Revisar descuentos aplicados', color: disc < 5 ? '#10b981' : '#f59e0b', bar: null },
        ].map(m => (
          <div key={m.label} className="neu-card p-5 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
            <p className="text-3xl font-extrabold" style={{ color: m.color }}>{m.value}</p>
            <span className="text-[11px] font-semibold block" style={{ color: 'var(--text-muted)' }}>{m.sub}</span>
            {m.bar !== null && (
              <div className="neu-progress-track">
                <div className="h-full rounded-full" style={{ width: `${m.bar}%`, background: m.color }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form añadir */}
      {showAdd && (
        <form onSubmit={handleAdd} className="neu-card p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Cliente</label>
            <div className="relative">
              <select className="neu-input appearance-none pr-8" value={newClientId} onChange={e => setNewClientId(e.target.value)} required>
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreEmpresa}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>▾</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Monto (USD)</label>
            <input className="neu-input" type="number" placeholder="Ej. 15000" required value={newAmount} onChange={e => setNewAmount(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 neu-btn-accent text-xs font-bold py-2.5 rounded-xl">{saving ? '...' : 'Registrar'}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="neu-btn text-xs font-semibold px-3 py-2.5 rounded-xl" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
        </form>
      )}

      {/* Modal F1 */}
      {f1Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,41,59,0.25)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Log Seguimiento F1</span>
              <button onClick={() => setF1Modal(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Confirma recepción y registra la fecha de decisión acordada con el cliente para agendar F2.</p>
            <form onSubmit={handleF1} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Fecha de decisión</label>
                <input type="date" required className="neu-input" value={f1Date} onChange={e => setF1Date(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setF1Modal(null)} className="neu-btn text-xs font-semibold px-4 py-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="neu-btn-accent text-xs font-bold px-4 py-2 rounded-xl">{saving ? '...' : 'Registrar F1'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="neu-card overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
                  {['Cliente', 'Monto', 'Fecha', 'F1', 'F2 / Decisión', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map((q, i) => {
                  const today = new Date().toISOString().split('T')[0]
                  const decDate = q.fechaDecisionF1 ? new Date(q.fechaDecisionF1).toISOString().split('T')[0] : ''
                  const isToday = decDate === today
                  const ss = statusStyle(q.estado)
                  return (
                    <tr key={q.id} style={{ borderBottom: i < quotes.length - 1 ? '1px solid rgba(163,177,198,0.15)' : 'none' }} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text)' }}>{q.cliente?.nombreEmpresa || '—'}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text)' }}>${q.monto.toLocaleString()}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>{new Date(q.fechaCreacion).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        {q.seguimientoF1 ? (
                          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#10b981' }}>
                            <CheckCircle2 size={13} /> {decDate}
                          </div>
                        ) : (
                          <button onClick={() => setF1Modal(q.id)}
                            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <Clock size={11} /> Log F1
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {!q.seguimientoF1 ? <span style={{ color: 'var(--text-muted)' }}>Esperando F1</span>
                          : q.seguimientoF2 ? <span className="flex items-center gap-1 font-semibold" style={{ color: '#10b981' }}><CheckCircle2 size={13} /> Completado</span>
                          : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={isToday ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' } : { background: 'rgba(163,177,198,0.15)', color: 'var(--text-muted)' }}>
                              {isToday ? '🔔 HOY' : 'Pendiente'}
                            </span>
                        }
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: ss.bg, color: ss.color }}>{q.estado}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {q.estado === 'Pendiente' && q.seguimientoF1 && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleClose(q.id, 'Ganada')} className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: '#10b981' }}><CheckCircle2 size={13} /></button>
                            <button onClick={() => handleClose(q.id, 'Perdida')} className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: '#ef4444' }}><XCircle size={13} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
