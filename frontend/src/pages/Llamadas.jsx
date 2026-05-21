import { useState, useEffect } from 'react'
import {
  Phone, PhoneOutgoing, PhoneIncoming, Truck,
  Star, Heart, Clock, Plus, ChevronDown,
  CheckCircle2, AlertCircle, Zap, BarChart3,
  MessageSquare, X, Info, RefreshCw, Copy, Check
} from 'lucide-react'
import { getLlamadasHoy, createLlamada, getClientes, getVendedor, getCrossSell } from '../api'
import ExamenRoleplay from '../components/ExamenRoleplay'

const CALL_TYPES = [
  { code: 'S1', label: 'Cuadrante 1', sublabel: 'Recuperación de producto', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: PhoneOutgoing, direction: 'Saliente', tip: 'Revisar historial — ¿qué producto dejaron de comprar? Preguntar la razón.' },
  { code: 'S2', label: 'Cuadrante 2', sublabel: 'Venta cruzada', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: PhoneOutgoing, direction: 'Saliente', tip: 'Identificar productos complementarios que el cliente nunca ha pedido.' },
  { code: 'F1', label: 'Seguimiento F1', sublabel: '1er seguimiento cotización', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: Clock, direction: 'Saliente', tip: 'Meta: 100% de cotizaciones tienen F1. Obtener fecha de decisión del cliente.' },
  { code: 'F2', label: 'Seguimiento F2', sublabel: '2do seguimiento — cierre', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)', icon: Clock, direction: 'Saliente', tip: 'Meta: ≥50% de F1 → F2. El 60% de ventas se cierra en F1, el resto en F2.' },
  { code: 'DC', label: 'Delivery Check', sublabel: 'Confirmar entrega', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: Truck, direction: 'Saliente', tip: '10 DCs perfectas = derecho a pedir testimonio RC.' },
  { code: 'RC', label: 'Referencia / RC', sublabel: 'Pedir referido o testimonio', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: Star, direction: 'Saliente', tip: 'Solo después de 10 DCs perfectas. Iniciar con Plan A → B → C.' },
  { code: 'PT', label: 'Contacto Personal', sublabel: 'Llamada de relación', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', icon: Heart, direction: 'Saliente', tip: '"Solo quería saludarte..." — Meta: 1 PT por cliente cada trimestre.' },
  { code: 'IN', label: 'Entrante', sublabel: 'Llamada del cliente', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', icon: PhoneIncoming, direction: 'Entrante', tip: 'Registrar siempre. Terminar con la "pregunta McDonald\'s".' },
]

const META_MIN = 20, META_MAX = 30

export default function Llamadas() {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user')) || { id: 1 })
  const [log, setLog] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [note, setNote] = useState('')
  const [dcSatisfied, setDcSatisfied] = useState(true)
  const [doInterview, setDoInterview] = useState(false)
  const [resp5Q, setResp5Q] = useState({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '' })
  const [schedule, setSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [tooltip, setTooltip] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [crossSellData, setCrossSellData] = useState(null)
  const [loadingCrossSell, setLoadingCrossSell] = useState(false)
  const [selectedS1Product, setSelectedS1Product] = useState('')
  const [selectedS2Product, setSelectedS2Product] = useState('')
  const [copyState, setCopyState] = useState({ script: false, sms: false })

  useEffect(() => {
    if (selectedClientId) {
      setLoadingCrossSell(true)
      getCrossSell(selectedClientId)
        .then(res => {
          setCrossSellData(res)
          if (res?.s1?.length > 0) {
            setSelectedS1Product(res.s1[0].producto)
          } else {
            setSelectedS1Product('')
          }
          if (res?.s2?.length > 0) {
            setSelectedS2Product(res.s2[0].producto)
          } else {
            setSelectedS2Product('')
          }
        })
        .catch(err => {
          console.error("Error fetching cross sell:", err)
          setCrossSellData(null)
        })
        .finally(() => setLoadingCrossSell(false))
    } else {
      setCrossSellData(null)
      setSelectedS1Product('')
      setSelectedS2Product('')
    }
  }, [selectedClientId])

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopyState(prev => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setCopyState(prev => ({ ...prev, [key]: false }))
    }, 1500)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [llamadas, clts] = await Promise.all([getLlamadasHoy(), getClientes(currentUser.id)])
      setLog(llamadas)
      setClientes(clts)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
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

  // Métricas del día
  const activeCliente = clientes.find(c => c.id === parseInt(selectedClientId))

  const getSuggestedScript = () => {
    if (!selectedType) return ''
    const cName = activeCliente?.contactoPrincipal || 'Sr. Cliente'
    const vName = currentUser?.nombre || 'su asesor'
    
    switch (selectedType.code) {
      case 'S1':
        return `"${cName}, le habla ${vName} de Moneycall. Revisando nuestro sistema veo que solía comprarnos '${selectedS1Product || 'sus productos habituales'}' con frecuencia, pero hace más de 45 días que no registramos un pedido. ¿Cómo ha estado la demanda? Quería asegurarme de que todo marche bien y ver si requiere reposición hoy."`
      case 'S2':
        return `"${cName}, le habla ${vName} de Moneycall. Espero que esté teniendo un gran día. Le llamo porque notamos que adquiere regularmente sus productos estándar, y muchos de nuestros clientes con perfiles similares suelen complementar sus pedidos con '${selectedS2Product || 'nuestros accesorios o insumos cruzados'}' para optimizar costos y tiempos. ¿Cómo maneja esa parte actualmente? ¿Le gustaría recibir una muestra o cotización rápida?"`
      case 'F1':
        return `"${cName}, le habla ${vName} de Moneycall. Le llamo para dar el primer seguimiento formal a la cotización que le enviamos. ¿Pudo revisar los costos y partidas con su equipo técnico? Quería saber si tiene algún comentario inicial y qué fecha estimada de decisión están considerando para planificar el stock."`
      case 'F2':
        return `"${cName}, le habla ${vName} de Moneycall. Le doy seguimiento a la cotización pendiente. Sé que su tiempo es valioso, y como estamos cerrando lotes esta semana, me gustaría confirmar si procedemos con la orden. ¿Qué día de esta semana prefiere recibir el material para no retrasar su obra/operación?"`
      case 'DC':
        return `"${cName}, le habla ${vName} de Moneycall. Veo en mi sistema que su pedido fue entregado hace un momento. Mi llamada es rápida, solo para confirmar: ¿el material llegó completo y en perfectas condiciones? ¿El chofer le brindó la atención adecuada? En Moneycall su total satisfacción en la entrega es nuestra prioridad."`
      case 'RC':
        const plan = activeCliente?.planTestimonio || 'A'
        const scriptsPlan = {
          A: `"Estupendo. Como hemos tenido ${activeCliente?.dcSatisfactoriasCount || 0} entregas perfectas consecutivas, nos enorgullece nuestro servicio. ¿Le importaría si grabamos un video testimonio corto de 30 segundos sobre cómo le hemos ayudado a eficientar su operación?"`,
          B: `"Entiendo que el video sea complicado. ¿Nos permitiría redactar un testimonio escrito en su nombre de 2 líneas basado en su excelente experiencia para colocarlo en nuestra web junto a su logo?"`,
          C: `"Totalmente respetable. ¿Habrá alguna otra empresa o colega en su sector a quien estime que nuestro servicio de entrega garantizada y Moneycall le pueda aportar el mismo valor que a usted? Estaríamos muy agradecidos de su parte."`
        }
        return `"${cName}, le habla ${vName} de Moneycall. Primero que nada, quiero agradecerle su lealtad. En nuestro afán de mantener un servicio excelente, notamos que ya lleva ${activeCliente?.dcSatisfactoriasCount || 0} entregas perfectas consecutivas. Quería hacerle una consulta rápida:\n\n[Enfoque: Plan ${plan}]\n${scriptsPlan[plan] || scriptsPlan.A}"`
      case 'PT':
        return `"${cName}, le habla ${vName} de Moneycall. Espero que esté teniendo una excelente semana. Mi llamada es 100% de relación, solo quería saludarle, saber cómo marcha su negocio y agradecerle la confianza en nosotros. No le quito más que un minuto, ¿hay algo específico en lo que yo le pueda apoyar o facilitar desde aquí?"`
      case 'IN':
        return `"¡Hola ${cName}! Qué gusto saludarle, bienvenido a Moneycall. Claro que sí, con mucho gusto le ayudo con su solicitud. [Atender la solicitud del cliente]... Y por cierto, antes de despedirnos, ¿sabía que también contamos con la línea de ${selectedS2Product || 'nuestros equipos adicionales'} que podría servirle para su pedido actual? Se lo comento por si quiere que lo agreguemos de una vez."`
      default:
        return ''
    }
  }

  const getSmsTemplate = () => {
    if (!selectedType) return ''
    const cName = activeCliente?.contactoPrincipal || 'cliente'
    const eName = activeCliente?.nombreEmpresa || 'su empresa'
    
    switch (selectedType.code) {
      case 'S1':
        return `Hola ${cName} de ${eName}, le saludamos de Moneycall. Intentamos comunicarnos para informarle sobre stock y promociones especiales del producto '${selectedS1Product || 'que solía comprarnos'}'. Avísenos si desea reabastecerse. ¡Saludos!`
      case 'S2':
        return `Hola ${cName}, le saludamos de Moneycall. Le contactamos para comentarle sobre '${selectedS2Product || 'nuestros productos complementarios'}', ideal para acompañar su compra habitual. Quedamos a sus órdenes si requiere detalles o cotización.`
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
      case 'IN':
        return `Hola ${cName}, de Moneycall. Le confirmamos que hemos registrado y atendido su solicitud. Cualquier consulta adicional, estamos a solo un mensaje de distancia. ¡Que tenga un excelente día!`
      default:
        return ''
    }
  }

  const salientes = log.filter(l => l.direccion === 'Saliente').length
  const entrantes = log.filter(l => l.direccion === 'Entrante').length
  const total = salientes + entrantes
  const ratioSal = total > 0 ? Math.round((salientes / total) * 100) : 0
  const metaOk = salientes >= META_MIN
  const countByType = CALL_TYPES.reduce((acc, t) => {
    acc[t.code] = log.filter(l => l.tipoLlamada === t.code).length
    return acc
  }, {})

  const handleLog = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const cliente = clientes.find(c => c.id === parseInt(selectedClientId))
      const payload = {
        clienteId: parseInt(selectedClientId),
        tipoLlamada: selectedType.code,
        direccion: selectedType.direction,
        satisfaccionDc: selectedType.code === 'DC' ? dcSatisfied : true,
        comentarios: note
      }
      if (doInterview) payload.respuestas5Q = resp5Q
      if (schedule && scheduledAt) {
        payload.proximaAccion = selectedType.code
        payload.proximaFecha = new Date(scheduledAt).toISOString()
      }
      await createLlamada(payload)
      await load()
      setShowForm(false); setSelectedType(null)
      setSelectedClientId(''); setNote(''); setDcSatisfied(true)
      setDoInterview(false); setResp5Q({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '' })
      setSchedule(false); setScheduledAt('')
      setCrossSellData(null); setSelectedS1Product(''); setSelectedS2Product('')
    } catch (e) { alert('Error: ' + e.message) } finally { setSaving(false) }
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

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
            Tu calificación de Roleplay ({cert.roleplayScore || 0}%) no alcanza el mínimo requerido (80%) por la metodología para registrar llamadas.
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
            <Phone size={22} style={{ color: 'var(--accent)' }} />
            Registro de Llamadas
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Logger diario Moneycall — Meta: {META_MIN}–{META_MAX} salientes/día
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowForm(true)} className="neu-btn-accent text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Plus size={15} /> Registrar Llamada
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="neu-card p-3 flex items-center gap-3" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs" style={{ color: '#ef4444' }}>Sin conexión al backend — mostrando datos locales · {error}</p>
          <button onClick={load} className="ml-auto neu-btn text-xs px-3 py-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>Reintentar</button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="neu-card p-4 flex flex-col gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Salientes Hoy</span>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-extrabold" style={{ color: metaOk ? '#10b981' : 'var(--text)' }}>{salientes}</span>
            <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>/ {META_MAX}</span>
          </div>
          <div className="neu-progress-track">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(Math.round(salientes/META_MAX*100),100)}%`, background: metaOk ? '#10b981' : '#3b82f6' }} />
          </div>
          <span className="text-[9px]" style={{ color: metaOk ? '#10b981' : 'var(--text-muted)' }}>
            {metaOk ? '✓ Meta mínima alcanzada' : `Faltan ${META_MIN - salientes} para meta mín.`}
          </span>
        </div>

        <div className="neu-card p-4 flex flex-col gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Proactividad</span>
          <span className="text-3xl font-extrabold" style={{ color: ratioSal >= 80 ? '#10b981' : '#f59e0b' }}>{ratioSal}%</span>
          <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>{salientes} sal · {entrantes} ent · Meta ≥80%</span>
          <div className="neu-progress-track">
            <div className="h-full rounded-full" style={{ width: `${ratioSal}%`, background: ratioSal >= 80 ? '#10b981' : '#f59e0b' }} />
          </div>
        </div>

        <div className="neu-card p-4 flex flex-col gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Hoy</span>
          <span className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>{total}</span>
          <div className="grid grid-cols-4 gap-1">
            {['S1','S2','DC','IN'].map(c => (
              <div key={c} className="text-center">
                <span className="text-base font-extrabold block" style={{ color: CALL_TYPES.find(t=>t.code===c)?.color }}>{countByType[c]}</span>
                <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="neu-card p-4 flex flex-col justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Reunión 20 min</span>
          <div className="space-y-1">
            {[{ l:'S1+S2', v:(countByType.S1||0)+(countByType.S2||0), c:'#3b82f6' },
              { l:'F1', v:countByType.F1||0, c:'#f59e0b' },
              { l:'DC', v:countByType.DC||0, c:'#10b981' }].map(r => (
              <div key={r.l} className="flex justify-between text-[10px]">
                <span style={{ color: 'var(--text-muted)' }}>{r.l}</span>
                <span className="font-bold" style={{ color: r.c }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: metaOk ? '#10b981' : '#f59e0b' }}>
            {metaOk ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
            {metaOk ? 'Ritmo óptimo' : 'Por debajo del ritmo'}
          </div>
        </div>
      </div>

      {/* Logger rápido */}
      <div className="neu-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color: 'var(--accent)' }} />
          <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Logger Rápido — Tipos de Llamada</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {CALL_TYPES.map(t => {
            const Icon = t.icon
            return (
              <button key={t.code} onClick={() => { setSelectedType(t); setShowForm(true) }}
                onMouseEnter={() => setTooltip(t.code)} onMouseLeave={() => setTooltip(null)}
                className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: t.bg, border: `1.5px solid ${t.border}` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: t.color }}>
                  <Icon size={15} />
                </div>
                <span className="text-[10px] font-extrabold" style={{ color: t.color }}>{t.code}</span>
                <span className="text-[8px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>{t.sublabel}</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: t.color }}>
                  {countByType[t.code] || 0}
                </span>
                {tooltip === t.code && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-52 rounded-xl p-2.5 text-[10px] leading-relaxed text-left pointer-events-none"
                    style={{ background: 'var(--text)', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    {t.tip}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal de registro */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,41,59,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-5xl rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
              <div className="flex items-center gap-2">
                {selectedType && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: selectedType.color }}>
                    <selectedType.icon size={13} />
                  </div>
                )}
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {selectedType ? `Registrar ${selectedType.label}` : 'Nueva Llamada'}
                </span>
              </div>
              <button onClick={() => { setShowForm(false); setSelectedType(null) }} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
              {/* Columna Izquierda: Formulario de Registro */}
              <form onSubmit={handleLog} className="lg:col-span-5 p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Selector de tipo si no viene del logger rápido */}
                {!selectedType && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Tipo</label>
                    <div className="relative">
                      <select className="neu-input appearance-none pr-8" onChange={e => setSelectedType(CALL_TYPES.find(t => t.code === e.target.value))} defaultValue="" required>
                        <option value="" disabled>Seleccionar tipo...</option>
                        {CALL_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                )}

                {selectedType && (
                  <div className="p-3 rounded-xl text-[10px] leading-relaxed"
                    style={{ background: selectedType.bg, border: `1px solid ${selectedType.border}`, color: 'var(--text)' }}>
                    <Info size={10} className="inline mr-1" style={{ color: selectedType.color }} />
                    {selectedType.tip}
                  </div>
                )}

                {/* Cliente */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Cliente</label>
                  <div className="relative">
                    <select className="neu-input appearance-none pr-8" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required>
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreEmpresa}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>

                {/* DC satisfecho */}
                {selectedType?.code === 'DC' && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>¿Entrega conforme?</span>
                    <button type="button" onClick={() => setDcSatisfied(!dcSatisfied)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={dcSatisfied
                        ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                        : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                      {dcSatisfied ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {dcSatisfied ? 'Sí — satisfecho' : 'No — problema'}
                    </button>
                  </div>
                )}

                {/* Opcional: entrevista 6 preguntas */}
                {(selectedType?.code === 'S1' || selectedType?.code === 'S2') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Entrevista (Preguntas Clave 6Q)</label>
                    <div className="flex items-center gap-3">
                      <input id="doInterview" type="checkbox" checked={doInterview} onChange={e => setDoInterview(e.target.checked)} />
                      <label htmlFor="doInterview" className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Realizar las 6 preguntas clave y guardar respuestas</label>
                    </div>
                    {doInterview && (
                      <div className="grid grid-cols-1 gap-2">
                        <input className="neu-input" placeholder="1) ¿Qué le gusta de hacer negocios con nosotros?" value={resp5Q.q1} onChange={e => setResp5Q({ ...resp5Q, q1: e.target.value })} />
                        <input className="neu-input" placeholder="2) ¿Qué le gusta de hacer negocios con la competencia?" value={resp5Q.q2} onChange={e => setResp5Q({ ...resp5Q, q2: e.target.value })} />
                        <input className="neu-input" placeholder="3) ¿Qué % de su compra total proviene de nosotros? (Cuota de Mercado)" value={resp5Q.q3} onChange={e => setResp5Q({ ...resp5Q, q3: e.target.value })} />
                        <input className="neu-input" placeholder="4) ¿Qué le cuesta encontrar últimamente?" value={resp5Q.q4} onChange={e => setResp5Q({ ...resp5Q, q4: e.target.value })} />
                        <input className="neu-input" placeholder="5) ¿En qué mercado quiere crecer y aún no ha podido?" value={resp5Q.q5} onChange={e => setResp5Q({ ...resp5Q, q5: e.target.value })} />
                        <input className="neu-input" placeholder="6) ¿Qué condiciones/compromisos asumir para ganar el 100% de su cuota?" value={resp5Q.q6} onChange={e => setResp5Q({ ...resp5Q, q6: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}

                {/* Programar llamada */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Programar llamada</label>
                  <div className="flex items-center gap-3">
                    <input id="doSchedule" type="checkbox" checked={schedule} onChange={e => setSchedule(e.target.checked)} />
                    <label htmlFor="doSchedule" className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Programar para otra fecha/hora</label>
                  </div>
                  {schedule && (
                    <input type="datetime-local" className="neu-input" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Nota para el CRM</label>
                  <textarea className="neu-input resize-none" rows={3}
                    placeholder="Qué se habló, qué solicitó, próxima acción..."
                    value={note} onChange={e => setNote(e.target.value)} />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setSelectedType(null) }}
                    className="neu-btn text-xs font-semibold px-4 py-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
                  <button type="submit" disabled={saving} className="neu-btn-accent text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5">
                    <Phone size={13} /> {saving ? 'Guardando...' : 'Registrar'}
                  </button>
                </div>
              </form>

              {/* Columna Derecha: Guías de Apertura, S1/S2 y SMS de Respaldo */}
              <div className="lg:col-span-7 p-6 space-y-5 max-h-[75vh] overflow-y-auto" style={{ background: 'rgba(163,177,198,0.06)' }}>
                {!selectedClientId ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" 
                      style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)', boxShadow: '0 8px 24px rgba(99,102,241,0.2)' }}>
                      <Zap size={22} />
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Guía Metodológica Moneycall</h4>
                      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Seleccione un cliente a la izquierda para desplegar recomendaciones automáticas del cuadrante S1 (productos inactivos) y S2 (venta cruzada co-ocurrente), además de guiones de apertura sugeridos y plantillas de contacto.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Header de Cliente Seleccionado */}
                    <div className="neu-card p-4 space-y-3">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>{activeCliente?.nombreEmpresa}</h4>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Contacto Principal: <span className="font-bold">{activeCliente?.contactoPrincipal || '—'}</span></p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" 
                            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                            📞 {activeCliente?.contactoPreferencia || 'Texto/WhatsApp'}
                          </span>
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" 
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                            Testimonio: Plan {activeCliente?.planTestimonio || 'A'}
                          </span>
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" 
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            DCs: {activeCliente?.dcSatisfactoriasCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recomendaciones Cross-Sell S1/S2 */}
                    <div className="neu-card p-4 space-y-4">
                      <div className="flex items-center gap-1.5">
                        <Zap size={14} style={{ color: 'var(--accent)' }} />
                        <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Sugerencias Cross-Sell S1 & S2</h4>
                      </div>

                      {loadingCrossSell ? (
                        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>Cargando recomendaciones...</p>
                      ) : (
                        <div className="space-y-4">
                          {/* S1: Recuperación */}
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'rgba(59,130,246,1)' }}>
                              S1: Recuperación de Productos (Inactividad &gt; 45 días)
                            </span>
                            {crossSellData?.s1?.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {crossSellData.s1.map(item => (
                                  <button key={item.producto} type="button" onClick={() => setSelectedS1Product(item.producto)}
                                    className="text-[9px] font-bold px-2.5 py-1.5 rounded-xl border transition-all"
                                    style={selectedS1Product === item.producto
                                      ? { background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderColor: '#3b82f6' }
                                      : { background: 'var(--bg)', color: 'var(--text-muted)', borderColor: 'rgba(163,177,198,0.2)' }}>
                                    📦 {item.producto} ({item.diasDesde} días sin comprar)
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[9px] italic" style={{ color: 'var(--text-muted)' }}>
                                ✓ Sin alertas de inactividad S1 (comprador activo en todas sus líneas en los últimos 60 días).
                              </p>
                            )}
                          </div>

                          {/* S2: Venta Cruzada */}
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'rgba(99,102,241,1)' }}>
                              S2: Venta Cruzada Recomendada (Co-ocurrencia con otros clientes)
                            </span>
                            {crossSellData?.s2?.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {crossSellData.s2.map(item => (
                                  <button key={item.producto} type="button" onClick={() => setSelectedS2Product(item.producto)}
                                    className="text-[9px] font-bold px-2.5 py-1.5 rounded-xl border transition-all"
                                    style={selectedS2Product === item.producto
                                      ? { background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderColor: '#6366f1' }
                                      : { background: 'var(--bg)', color: 'var(--text-muted)', borderColor: 'rgba(163,177,198,0.2)' }}>
                                    ✨ {item.producto} (Frecuencia: {item.frecuencia})
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[9px] italic" style={{ color: 'var(--text-muted)' }}>
                                No se encontraron patrones de co-ocurrencia S2 para este cliente en el historial actual.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Guión de Apertura */}
                    {selectedType && (
                      <div className="neu-card p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            Guión de Apertura Recomendado ({selectedType.code})
                          </span>
                          <button type="button" onClick={() => handleCopy(getSuggestedScript(), 'script')}
                            className="neu-btn text-[9px] font-bold px-2.5 py-1 transition-colors"
                            style={copyState.script ? { color: '#10b981' } : { color: 'var(--text-muted)' }}>
                            {copyState.script ? '¡Guión Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <div className="p-3 rounded-xl text-[10px] leading-relaxed italic border animate-fade-in"
                          style={{ background: 'var(--bg)', borderColor: 'rgba(163,177,198,0.15)', color: 'var(--text)' }}>
                          {getSuggestedScript()}
                        </div>
                      </div>
                    )}

                    {/* SMS / Mensaje de Respaldo */}
                    {selectedType && (
                      <div className="neu-card p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            SMS / WhatsApp de Respaldo (Si no contesta)
                          </span>
                          <button type="button" onClick={() => handleCopy(getSmsTemplate(), 'sms')}
                            className="neu-btn text-[9px] font-bold px-2.5 py-1 transition-colors"
                            style={copyState.sms ? { color: '#10b981' } : { color: 'var(--text-muted)' }}>
                            {copyState.sms ? '¡Mensaje Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <div className="p-3 rounded-xl text-[10px] leading-relaxed italic border animate-fade-in"
                          style={{ background: 'var(--bg)', borderColor: 'rgba(163,177,198,0.15)', color: 'var(--text)' }}>
                          {getSmsTemplate()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log del día */}
      <div className="neu-card overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(163,177,198,0.2)' }}>
          <BarChart3 size={15} style={{ color: 'var(--accent)' }} />
          <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Log del Día</h3>
          <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
            {log.length} registros
          </span>
        </div>
        {loading ? (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>Cargando...</div>
        ) : log.length === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>No hay llamadas registradas hoy. ¡Empieza a llamar!</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(163,177,198,0.15)' }}>
            {log.map((entry) => {
              const t = CALL_TYPES.find(c => c.code === entry.tipoLlamada)
              const Icon = t?.icon || Phone
              return (
                <div key={entry.id} className="flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-white/30">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>{formatTime(entry.fechaHora)}</span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: t?.color || '#64748b' }}>
                      <Icon size={13} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{ background: t?.bg, color: t?.color, border: `1px solid ${t?.border}` }}>
                        {entry.tipoLlamada}
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                        {entry.cliente?.nombreEmpresa || '—'}
                      </span>
                      {entry.tipoLlamada === 'DC' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={entry.satisfaccionDc
                            ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
                            : { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                          {entry.satisfaccionDc ? '✓ Conforme' : '⚠ Problema'}
                        </span>
                      )}
                    </div>
                    {entry.comentarios && (
                      <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        <MessageSquare size={9} className="inline mr-1" />{entry.comentarios}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
