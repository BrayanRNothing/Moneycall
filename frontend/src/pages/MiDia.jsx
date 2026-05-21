import { useState, useEffect } from 'react'
import {
  CalendarDays, Clock, CheckCircle2, AlertCircle, Star,
  Heart, Phone, RefreshCw, Trophy, ChevronRight,
  PhoneOutgoing, Truck, ArrowRight, Zap, ChevronDown, ChevronUp, Video
} from 'lucide-react'
import { getAgenda, getRanking, createLlamada, getClientes, getVendedor, getVendedoresByGerente } from '../api'
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
  const [copyState, setCopyState] = useState({ script: false, sms: false })
  const [expandedClients, setExpandedClients] = useState(new Set())

  const toggleClientExpand = (id) => {
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopyState(prev => ({ ...prev, [type]: true }))
    setTimeout(() => {
      setCopyState(prev => ({ ...prev, [type]: false }))
    }, 2000)
  }

  const getSuggestedScript = () => {
    if (!logModal) return ''
    const cName = logModal.contactoPrincipal || 'Sr. Cliente'
    const vName = currentUser?.nombre || 'su asesor'
    
    switch (logModal.tipo) {
      case 'S1':
        return `"${cName}, le habla ${vName} de Moneycall. Veo que solía comprarnos sus productos habituales con frecuencia, pero hace más de 45 días que no registramos un pedido. ¿Cómo ha estado la demanda? Quería asegurarme de que todo marche bien y ver si requiere reposición hoy."`
      case 'S2':
        return `"${cName}, le habla ${vName} de Moneycall. Espero que esté teniendo un gran día. Le llamo porque notamos que adquiere regularmente sus productos estándar, y muchos de nuestros clientes con perfiles similares suelen complementar sus pedidos con otros accesorios o insumos cruzados para optimizar costos y tiempos. ¿Cómo maneja esa parte actualmente? ¿Le gustaría recibir una muestra o cotización rápida?"`
      case 'F1':
        return `"${cName}, le habla ${vName} de Moneycall. Le llamo para dar el primer seguimiento formal a la cotización que le enviamos. ¿Pudo revisar los costos y partidas con su equipo técnico? Quería saber si tiene algún comentario inicial y qué fecha estimada de decisión están considerando para planificar el stock."`
      case 'F2':
        return `"${cName}, le habla ${vName} de Moneycall. Le doy seguimiento a la cotización pendiente. Sé que su tiempo es valioso, y como estamos cerrando lotes esta semana, me gustaría confirmar si procedemos con la orden. ¿Qué día de esta semana prefiere recibir el material para no retrasar su obra/operación?"`
      case 'DC':
        return `"${cName}, le habla ${vName} de Moneycall. Veo en mi sistema que su pedido fue entregado hace un momento. Mi llamada es rápida, solo para confirmar: ¿el material llegó completo y en perfectas condiciones? ¿El chofer le brindó la atención adecuada? En Moneycall su total satisfacción en la entrega es nuestra prioridad."`
      case 'RC':
        const plan = logModal.planTestimonio || 'A'
        const scriptsPlan = {
          A: `"Estupendo. Como hemos tenido ${logModal.dcSatisfactoriasCount || 0} entregas perfectas consecutivas, nos enorgullece nuestro servicio. ¿Le importaría si grabamos un video testimonio corto de 30 segundos sobre cómo le hemos ayudado a eficientar su operación?"`,
          B: `"Entiendo que el video sea complicado. ¿Nos permitiría redactar un testimonio escrito en su nombre de 2 líneas basado en su excelente experiencia para colocarlo en nuestra web junto a su logo?"`,
          C: `"Totalmente respetable. ¿Habrá alguna otra empresa o colega en su sector a quien estime que nuestro servicio de entrega garantizada y Moneycall le pueda aportar el mismo valor que a usted? Estaríamos muy agradecidos de su parte."`
        }
        return `"${cName}, le habla ${vName} de Moneycall. Primero que nada, quiero agradecerle su lealtad. En nuestro afán de mantener un servicio excelente, notamos que ya lleva ${logModal.dcSatisfactoriasCount || 0} entregas perfectas consecutivas. Quería hacerle una consulta rápida:\n\n[Enfoque: Plan ${plan}]\n${scriptsPlan[plan] || scriptsPlan.A}"`
      case 'PT':
        return `"${cName}, le habla ${vName} de Moneycall. Espero que esté teniendo una excelente semana. Mi llamada es 100% de relación, solo quería saludarle, saber cómo marcha su negocio y agradecerle la confianza en nosotros. No le quito más que un minuto, ¿hay algo específico en lo que yo le pueda apoyar o facilitar desde aquí?"`
      default:
        return `"${cName}, le habla ${vName} de Moneycall. Espero que se encuentre excelente. Le llamo para dar seguimiento a sus requerimientos y ver cómo le podemos asistir hoy."`
    }
  }

  const getSmsTemplate = () => {
    if (!logModal) return ''
    const cName = logModal.contactoPrincipal || 'cliente'
    const eName = logModal.cliente || 'su empresa'
    
    switch (logModal.tipo) {
      case 'S1':
        return `Hola ${cName} de ${eName}, le saludamos de Moneycall. Intentamos comunicarnos para informarle sobre stock y promociones especiales de sus productos habituales. Avísenos si desea reabastecerse. ¡Saludos!`
      case 'S2':
        return `Hola ${cName}, le saludamos de Moneycall. Le contactamos para comentarle sobre nuestros productos complementarios, ideal para acompañar su compra habitual. Quedamos a sus órdenes si requiere detalles o cotización.`
      case 'F1':
        return `Hola ${cName}, de Moneycall le enviamos un atento saludo. Le escribimos para dar seguimiento a la cotización pendiente. Cualquier ajuste que requiera o si desea proceder, no dude en escribirnos por aquí o llamarnos.`
      case 'F2':
        return `Hola ${cName}, de Moneycall. Le informamos que estamos cerrando programaciones de despacho para esta semana. Si desea asegurar sus materiales y congelar el precio cotizado, avísenos para procesar su orden a la brevedad.`
      case 'DC':
        return `Hola ${cName}, confirmamos que su pedido ya fue entregado. ¿Llegó todo conforme? Su opinión es sumamente valiosa para mantener nuestro estándar. Si tiene cualquier observación, por favor háganosla saber. ¡Gracias!`
      case 'RC':
        return `Hola ${cName}, le saluda de Moneycall. Nos alegra saber que sus últimas entregas han sido excelentes. Nos encantaría contar con su breve testimonio o recomendación para seguir creciendo juntos. ¿Le vendría bien una llamada corta mañana?`
      case 'PT':
        return `Hola ${cName}, le saludamos de Moneycall. Esperamos que tenga una excelente semana y que su negocio marche viento en popa. Agradecemos enormemente su lealtad y quedamos a su entera disposición.`
      default:
        return `Hola ${cName}, de Moneycall. Intentamos llamarle hace un momento. Quedamos a su entera disposición para cualquier requerimiento de cotizaciones o entregas. ¡Excelente día!`
    }
  }

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [ag, rk] = await Promise.all([getAgenda(currentUser.id), getRanking()])
      setAgenda(ag)
      // Si soy gerente, mostrar solo mi equipo + yo
      if (currentUser.isAdmin && !currentUser.isSuperAdmin) {
        try {
          const team = await getVendedoresByGerente(currentUser.id)
          const teamIds = new Set(team.map(t => t.id))
          const filtered = rk.filter(v => v.id === currentUser.id || teamIds.has(v.id))
          setRanking(filtered)
        } catch (e) {
          // fallback al ranking completo si falla la llamada
          setRanking(rk)
        }
      } else {
        setRanking(rk)
      }
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

  // Agrupar tareas por cliente
  const agendaPorCliente = agenda.reduce((acc, tarea) => {
    const key = tarea.clienteId
    if (!acc[key]) {
      acc[key] = {
        clienteId: tarea.clienteId,
        cliente: tarea.cliente,
        contactoPreferencia: tarea.contactoPreferencia,
        contactoPrincipal: tarea.contactoPrincipal,
        dcSatisfactoriasCount: tarea.dcSatisfactoriasCount,
        planTestimonio: tarea.planTestimonio,
        tareas: []
      }
    }
    acc[key].tareas.push(tarea)
    return acc
  }, {})

  const clientesConTareas = Object.values(agendaPorCliente)

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

      {/* ── Ranking — Reunión Diaria de 20 min ── */}
      <div className="neu-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(163,177,198,0.2)' }}>
          <div className="flex items-center gap-2">
            <Trophy size={15} style={{ color: '#f59e0b' }} />
            <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Ranking del Equipo — Reunión Diaria 20 min</h3>
          </div>
          <button onClick={() => window.open('https://meet.google.com/new', '_blank')} className="neu-btn-accent text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shrink-0" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>
            <Video size={12} />
            Unirse a Meet
          </button>
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

      {/* ── Cola de Tareas (Agenda) ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Cola de Tareas del Día</h3>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            Agrupadas por cliente — Ahorro de espacio interactivo
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
        ) : clientesConTareas.length === 0 ? (
          <div className="neu-card p-8 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto" style={{ color: '#10b981' }} />
            <p className="font-bold" style={{ color: '#10b981' }}>¡Agenda completa!</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Todos tus clientes están al día. Excelente trabajo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientesConTareas.map((clienteObj) => {
              const isExpanded = expandedClients.has(clienteObj.clienteId)
              const pendingCount = clienteObj.tareas.filter(t => !completadas.has(`${t.clienteId}-${t.tipo}`)).length
              
              return (
                <div key={clienteObj.clienteId} className="neu-card overflow-hidden transition-all duration-300">
                  {/* Acordeón Header */}
                  <div 
                    onClick={() => toggleClientExpand(clienteObj.clienteId)}
                    className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all select-none"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>
                        {clienteObj.cliente}
                      </span>
                      {clienteObj.contactoPreferencia && (
                        <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                          💬 {clienteObj.contactoPreferencia}
                        </span>
                      )}
                      {pendingCount > 0 ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/45 text-red-500 border border-red-200 dark:border-red-900/50">
                          {pendingCount} pendientes
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/45 text-emerald-500 border border-emerald-200 dark:border-emerald-900/50">
                          Completado
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Acordeón Body */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 space-y-2.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/10">
                      {clienteObj.tareas.map((tarea, index) => {
                        const cfg = TIPO_CONFIG[tarea.tipo] || TIPO_CONFIG.S1
                        const Icon = cfg.icon
                        const key = `${tarea.clienteId}-${tarea.tipo}`
                        const done = completadas.has(key)
                        
                        return (
                          <div 
                            key={index} 
                            className="neu-card-sm p-3.5 flex items-center gap-3.5 transition-all"
                            style={done ? { opacity: 0.4 } : { borderLeft: `4px solid ${cfg.color}` }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: cfg.color }}>
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full"
                                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                  {cfg.badge}
                                </span>
                                <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                                  {cfg.label}
                                </span>
                              </div>
                              <p className="text-[10px] mt-0.5 leading-normal" style={{ color: 'var(--text-muted)' }}>
                                {tarea.razon}
                              </p>
                            </div>
                            {!done ? (
                              <button onClick={() => setLogModal(tarea)}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all hover:scale-105"
                                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                <Phone size={10} /> Llamar
                              </button>
                            ) : (
                              <CheckCircle2 size={16} style={{ color: '#10b981' }} className="shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
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
              <div className="w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] md:h-[620px]" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
                {/* Columna Izquierda: Formulario (40% de ancho) */}
                <div className="w-full md:w-5/12 flex flex-col justify-between p-6 border-r border-slate-200 dark:border-slate-800">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg" style={{ background: cfg.color }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Registrar {cfg.label}</span>
                        <span className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>{logModal.cliente}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

                    {/* Info Mini Card */}
                    <div className="neu-inset p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-400">Contacto:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{logModal.contactoPrincipal || 'No registrado'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-400">Preferencia:</span>
                        <span className="font-extrabold text-indigo-500 capitalize">{logModal.contactoPreferencia || 'Texto/Llamada'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-400">Entrega DC:</span>
                        <span className="font-bold text-emerald-500">{logModal.dcSatisfactoriasCount || 0} perfectas</span>
                      </div>
                      {logModal.tipo === 'RC' && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-400">Testimonio:</span>
                          <span className="font-extrabold text-amber-500">Plan {logModal.planTestimonio || 'A'}</span>
                        </div>
                      )}
                    </div>

                    {/* Nota del CRM */}
                    <form onSubmit={handleComplete} className="space-y-4" id="log-task-form">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                          Nota de la llamada (guardar en CRM)
                        </label>
                        <textarea className="neu-input resize-none w-full text-xs p-3 rounded-xl" rows={6}
                          placeholder="Escriba los comentarios de la llamada, acuerdos y compromisos..."
                          value={nota} onChange={e => setNota(e.target.value)} />
                      </div>
                    </form>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => { setLogModal(null); setNota('') }}
                      className="neu-btn text-xs font-semibold px-4 py-2.5 rounded-xl transition-all" style={{ color: 'var(--text-muted)' }}>
                      Cancelar
                    </button>
                    <button type="submit" form="log-task-form" disabled={saving}
                      className="neu-btn-accent text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all hover:scale-105">
                      <Phone size={13} /> {saving ? 'Guardando...' : 'Marcar Completada'}
                    </button>
                  </div>
                </div>

                {/* Columna Derecha: Guías y Mensajes (60% de ancho) */}
                <div className="w-full md:w-7/12 flex flex-col p-6 overflow-y-auto space-y-4" style={{ background: 'rgba(163,177,198,0.06)' }}>
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: cfg.color }}>📖 Guía del Libro Moneycall</h4>
                    <p className="text-[11px] font-medium leading-relaxed mt-1" style={{ color: 'var(--text)' }}>
                      {logModal.razon}
                    </p>
                  </div>

                  {/* Guión de Apertura Recomendado */}
                  <div className="neu-card p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Guión de Apertura Sugerido ({logModal.tipo})
                      </span>
                      <button type="button" onClick={() => handleCopy(getSuggestedScript(), 'script')}
                        className="neu-btn text-[9px] font-bold px-2.5 py-1 transition-all"
                        style={copyState.script ? { color: '#10b981' } : { color: 'var(--text-muted)' }}>
                        {copyState.script ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl text-xs leading-relaxed italic border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
                      style={{ color: 'var(--text)' }}>
                      {getSuggestedScript()}
                    </div>
                  </div>

                  {/* SMS / WhatsApp de Respaldo */}
                  <div className="neu-card p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        WhatsApp / SMS de Respaldo (Si no responde)
                      </span>
                      <button type="button" onClick={() => handleCopy(getSmsTemplate(), 'sms')}
                        className="neu-btn text-[9px] font-bold px-2.5 py-1 transition-all"
                        style={copyState.sms ? { color: '#10b981' } : { color: 'var(--text-muted)' }}>
                        {copyState.sms ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl text-xs leading-relaxed italic border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
                      style={{ color: 'var(--text)' }}>
                      {getSmsTemplate()}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
