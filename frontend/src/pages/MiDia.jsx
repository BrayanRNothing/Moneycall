import { useState, useEffect } from 'react'
import {
  CalendarDays, Clock, CheckCircle2, AlertCircle, Star,
  Heart, Phone, RefreshCw, Trophy, ChevronRight,
  PhoneOutgoing, Truck, ArrowRight, Zap
} from 'lucide-react'
import { getAgenda, getRanking, createLlamada, getClientes, getVendedor } from '../api'
import ExamenRoleplay from '../components/ExamenRoleplay'

// ── Colores y config por tipo de tarea ───────────────────────────────────────
const TIPO_CONFIG = {
  F2: { color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)', label: 'Seguimiento F2', icon: Clock,         badge: '🔴 URGENTE', prioLabel: 'Prioridad 1' },
  F1: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  label: 'Seguimiento F1', icon: Clock,         badge: '🟠 URGENTE', prioLabel: 'Prioridad 1' },
  RC: { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  label: 'Pedir Referido', icon: Star,          badge: '🏆 RC LISTO', prioLabel: 'Prioridad 2' },
  PT: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', label: 'Contacto Personal', icon: Heart,      badge: '💬 PT',       prioLabel: 'Prioridad 3' },
  S1: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  label: 'Llamada S1',     icon: PhoneOutgoing, badge: '📞 S1',       prioLabel: 'Prioridad 4' },
  DC: { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  label: 'Delivery Check', icon: Truck,         badge: '🚚 DC',       prioLabel: 'Prioridad 4' },
}

const META_SAL = 30

export default function MiDia() {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user')) || { id: 1 })
  const [agenda, setAgenda] = useState([])
  const [ranking, setRanking] = useState([])
  const [completadas, setCompletadas] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [logModal, setLogModal] = useState(null) // { tarea }
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [ag, rk] = await Promise.all([getAgenda(currentUser.id), getRanking()])
      setAgenda(ag)
      setRanking(rk)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const syncUser = async () => {
    try {
      const updated = await getVendedor(currentUser.id)
      setCurrentUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
    } catch (e) {
      console.error('Error syncing user certifications:', e)
    }
  }

  useEffect(() => {
    syncUser()
    load()
  }, [])

  const handleComplete = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await createLlamada({
        clienteId: logModal.clienteId,
        tipoLlamada: logModal.tipo,
        direccion: logModal.tipo === 'IN' ? 'Entrante' : 'Saliente',
        satisfaccionDc: true,
        comentarios: nota || `Tarea completada desde Mi Día: ${logModal.tipo}`
      })
      setCompletadas(prev => new Set([...prev, `${logModal.clienteId}-${logModal.tipo}`]))
      setLogModal(null); setNota('')
      await load()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const tareasDone = completadas.size
  const tareasTotal = agenda.length
  const pct = tareasTotal > 0 ? Math.round((tareasDone / tareasTotal) * 100) : 0

  const yo = ranking.find(v => v.id === currentUser.id) || ranking[0]
  const meHoy = yo?.hoy

  const grupoPrioridad = (p) => agenda.filter(t => t.prioridad === p && !completadas.has(`${t.clienteId}-${t.tipo}`))

  const cert = currentUser.certificaciones || {}
  const isCertified = cert.aprobado && cert.roleplayScore >= 80
  const canCall = currentUser.isAdmin || isCertified

  if (!canCall) {
    if (cert.examenEstado === 'habilitado') {
      return (
        <ExamenRoleplay 
          user={currentUser} 
          onSubmitted={async () => {
            await syncUser()
          }} 
        />
      )
    }

    if (cert.examenEstado === 'respondido') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 mt-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" 
            style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}>
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Examen en Revisión</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Tus respuestas del examen de certificación metodológica han sido enviadas con éxito.
            </p>
            <p className="text-xs font-semibold p-3.5 rounded-xl border" 
              style={{ background: 'rgba(16,185,129,0.02)', borderColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
              Tu gerente está evaluando tu examen. Tan pronto sea calificado con un puntaje mayor o igual a 80%, tu cuenta será desbloqueada automáticamente. ¡Mucho éxito!
            </p>
          </div>
          <button onClick={syncUser} className="neu-btn text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <RefreshCw size={14} /> Verificar Estado
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 mt-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)', boxShadow: '0 8px 32px rgba(239,68,68,0.3)' }}>
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Certificación Pendiente</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Tu calificación de Roleplay ({cert.roleplayScore || 0}%) no alcanza el mínimo requerido (80%) por la metodología para atender la agenda.
          </p>
          <div className="p-4 rounded-xl border text-xs" style={{ background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.15)', color: 'var(--text-muted)' }}>
            Solicita a tu gerente que habilite tu **Examen de Certificación Metodológica** desde el panel de control o que califique tu roleplay directamente.
          </div>
        </div>
        <button onClick={syncUser} className="neu-btn text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <RefreshCw size={14} /> Verificar Estado
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <CalendarDays size={22} style={{ color: 'var(--accent)' }} />
            Mi Día
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Cola de tareas proactivas — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={load} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="neu-card p-3 flex items-center gap-3" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs" style={{ color: '#ef4444' }}>Sin conexión al backend · {error}</p>
          <button onClick={load} className="ml-auto neu-btn text-xs px-3 py-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>Reintentar</button>
        </div>
      )}

      {/* ── Progreso del día ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progreso agenda */}
        <div className="neu-card p-5 md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>Progreso de la Agenda</span>
            <span className="text-xs font-extrabold" style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : 'var(--text)' }}>
              {tareasDone} / {tareasTotal} tareas
            </span>
          </div>
          <div className="neu-progress-track" style={{ height: '10px' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#3b82f6' }} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'F1+F2 Urgentes', count: grupoPrioridad(1).length, color: '#ec4899' },
              { label: 'RC Listos',       count: grupoPrioridad(2).length, color: '#10b981' },
              { label: 'PT Pendientes',   count: grupoPrioridad(3).length, color: '#94a3b8' },
              { label: 'S1 Esta semana',  count: grupoPrioridad(4).length, color: '#3b82f6' },
            ].map(g => (
              <div key={g.label} className="text-center neu-inset rounded-xl py-2">
                <span className="text-xl font-extrabold block" style={{ color: g.color }}>{g.count}</span>
                <span className="text-[8px] font-semibold" style={{ color: 'var(--text-muted)' }}>{g.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mis llamadas hoy */}
        <div className="neu-card p-5 space-y-3">
          <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>Mis Llamadas Hoy</span>
          <div className="space-y-2">
            {[
              { label: 'Salientes', value: meHoy?.salientes || 0, meta: META_SAL, color: '#3b82f6' },
              { label: 'S1 + S2',   value: (meHoy?.s1||0)+(meHoy?.s2||0), meta: 20, color: '#6366f1' },
              { label: 'DC',        value: meHoy?.dc || 0, meta: null, color: '#10b981' },
              { label: 'F1',        value: meHoy?.f1 || 0, meta: null, color: '#f59e0b' },
            ].map(r => (
              <div key={r.label} className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                  <span className="font-bold" style={{ color: r.color }}>{r.value}{r.meta ? ` / ${r.meta}` : ''}</span>
                </div>
                {r.meta && (
                  <div className="neu-progress-track" style={{ height: '4px' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(r.value/r.meta*100,100)}%`, background: r.color }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cola de Tareas (Agenda) ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Cola de Tareas del Día</h3>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            Ordenadas por prioridad metodológica
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="neu-card p-4 flex items-center gap-4 animate-pulse" style={{ border: '1px solid rgba(163,177,198,0.1)' }}>
                <div className="w-10 h-10 rounded-xl bg-gray-400/10 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3 bg-gray-400/10 rounded w-1/4" />
                  <div className="h-2 bg-gray-400/10 rounded w-2/3" />
                </div>
                <div className="w-16 h-8 rounded-xl bg-gray-400/10 shrink-0" />
              </div>
            ))}
          </div>
        ) : agenda.length === 0 ? (
          <div className="neu-card p-8 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto" style={{ color: '#10b981' }} />
            <p className="font-bold" style={{ color: '#10b981' }}>¡Agenda completa!</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Todos tus clientes están al día. Excelente trabajo.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {agenda.map((tarea, i) => {
              const cfg = TIPO_CONFIG[tarea.tipo] || TIPO_CONFIG.S1
              const Icon = cfg.icon
              const key = `${tarea.clienteId}-${tarea.tipo}`
              const done = completadas.has(key)
              return (
                <div key={i} className="neu-card p-4 flex items-center gap-4 transition-all"
                  style={done ? { opacity: 0.4 } : { border: `1px solid ${cfg.border}` }}>
                  {/* Tipo badge */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: cfg.color }}>
                    <Icon size={16} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.badge}
                      </span>
                      <span className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{tarea.cliente}</span>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{tarea.razon}</p>
                  </div>
                  {/* Acción */}
                  {!done ? (
                    <button onClick={() => setLogModal(tarea)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      <Phone size={12} /> Llamar
                    </button>
                  ) : (
                    <CheckCircle2 size={20} style={{ color: '#10b981' }} className="shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Ranking — Reunión Diaria de 20 min ── */}
      <div className="neu-card overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(163,177,198,0.2)' }}>
          <Trophy size={15} style={{ color: '#f59e0b' }} />
          <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Ranking del Equipo — Reunión Diaria 20 min</h3>
        </div>
        {ranking.length === 0 ? (
          <div className="p-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Sin vendedores registrados aún. Crea vendedores en Configuración.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
                  {['#', 'Vendedor', 'Cuentas', 'S1', 'S2', 'DC', 'F1', 'Sal. Hoy', '% Cierre', '% F1', 'Cotiz.'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((v, i) => (
                  <tr key={v.id} style={{ borderBottom: i < ranking.length - 1 ? '1px solid rgba(163,177,198,0.12)' : 'none' }}
                    className="hover:bg-white/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-extrabold text-sm"
                        style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--text-muted)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--text)' }}>{v.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: v.cuentas >= 100 ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: v.cuentas >= 100 ? '#ef4444' : '#3b82f6' }}>
                        {v.cuentas}/100
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: '#3b82f6' }}>{v.hoy.s1}</td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: '#6366f1' }}>{v.hoy.s2}</td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: '#10b981' }}>{v.hoy.dc}</td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: '#f59e0b' }}>{v.hoy.f1}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-extrabold" style={{ color: v.hoy.salientes >= 20 ? '#10b981' : v.hoy.salientes >= 10 ? '#f59e0b' : '#ef4444' }}>
                        {v.hoy.salientes}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}> /{META_SAL}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold" style={{ color: v.ratioNum >= 20 ? '#10b981' : '#f59e0b' }}>{v.ratioNum}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold" style={{ color: v.f1Pct >= 100 ? '#10b981' : v.f1Pct >= 80 ? '#f59e0b' : '#ef4444' }}>{v.f1Pct}%</span>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-muted)' }}>{v.cotizaciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Registrar llamada desde agenda ── */}
      {logModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,41,59,0.3)', backdropFilter: 'blur(4px)' }}>
          {(() => {
            const cfg = TIPO_CONFIG[logModal.tipo] || TIPO_CONFIG.S1
            const Icon = cfg.icon
            return (
              <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(163,177,198,0.3)', background: cfg.bg }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: cfg.color }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <span className="text-sm font-bold block" style={{ color: 'var(--text)' }}>Registrar {cfg.label}</span>
                      <span className="text-[10px]" style={{ color: cfg.color }}>{logModal.cliente}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Guía contextual del libro */}
                  <div className="p-3 rounded-xl text-[10px] leading-relaxed space-y-1"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: 'var(--text)' }}>
                    <p className="font-bold" style={{ color: cfg.color }}>📖 Guía del libro Moneycall</p>
                    {logModal.tipo === 'F2' && <p>Llama para cerrar. Pregunta: "¿Pudiste revisar la cotización? ¿Tienes alguna duda antes de proceder?"</p>}
                    {logModal.tipo === 'F1' && <p>Confirma recepción: "¿Pudiste ver la cotización? ¿Para cuándo crees que puedas darme una respuesta?"</p>}
                    {logModal.tipo === 'RC' && <p>Plan A: "Ya que completamos 10 entregas perfectas, ¿me presentarías a alguien que también se beneficie de nuestro servicio?"</p>}
                    {logModal.tipo === 'PT' && <p>"Hola [nombre], solo llamo para saludarte y ver cómo van las cosas. ¿Hay algo en lo que te podamos ayudar?"</p>}
                    {logModal.tipo === 'S1' && <p>Revisa el historial del cliente. Pregunta: "¿Qué más te resulta difícil encontrar?" (pregunta McDonald's al final).</p>}
                    <p className="text-[9px] mt-1 font-semibold" style={{ color: 'var(--text-muted)' }}>{logModal.razon}</p>
                  </div>

                  <form onSubmit={handleComplete} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        Nota de la llamada (guardar en CRM)
                      </label>
                      <textarea className="neu-input resize-none" rows={3}
                        placeholder="Resumen de lo que se habló, próxima acción..."
                        value={nota} onChange={e => setNota(e.target.value)} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => { setLogModal(null); setNota('') }}
                        className="neu-btn text-xs font-semibold px-4 py-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
                        Cancelar
                      </button>
                      <button type="submit" disabled={saving}
                        className="neu-btn-accent text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5">
                        <Phone size={13} /> {saving ? 'Guardando...' : 'Marcar completada'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
