import { useState, useEffect } from 'react'
import { 
  ArrowLeft, Phone, FileText, ShoppingBag, CheckCircle2, AlertCircle, 
  Clock, Plus, Trash2, Zap, PhoneOutgoing, PhoneIncoming, Heart, Truck, Star, ChevronDown, Info, BarChart3, Target, TrendingUp
} from 'lucide-react'
import { 
  getLlamadasByCliente, createLlamada, getCotizaciones, createCotizacion, 
  logF1, closeCotizacion, deleteCotizacion, getPedidos, createPedido, 
  deletePedido, getCrossSell, updateCliente5Q 
} from '../api'

const CALL_TYPES = [
  { code: 'S1', label: 'Cuadrante 1', sublabel: 'Recuperación', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: PhoneOutgoing, direction: 'Saliente' },
  { code: 'S2', label: 'Cuadrante 2', sublabel: 'Cross-Sell', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: PhoneOutgoing, direction: 'Saliente' },
  { code: 'F1', label: 'Seguimiento F1', sublabel: 'Primer toque', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: Clock, direction: 'Saliente' },
  { code: 'F2', label: 'Seguimiento F2', sublabel: 'Cierre', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)', icon: Clock, direction: 'Saliente' },
  { code: 'DC', label: 'Delivery Check', sublabel: 'Calidad', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: Truck, direction: 'Saliente' },
  { code: 'RC', label: 'Referencia/RC', sublabel: 'Testimonio', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: Star, direction: 'Saliente' },
  { code: 'PT', label: 'Contacto Personal', sublabel: 'Relación', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', icon: Heart, direction: 'Saliente' },
  { code: 'IN', label: 'Entrante', sublabel: 'Inbound', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', icon: PhoneIncoming, direction: 'Entrante' }
]

const QUESTIONS = [
  { key: 'q1', label: '1. ¿Qué le gusta de hacer negocios con nosotros?' },
  { key: 'q2', label: '2. ¿Qué le gusta de la competencia?' },
  { key: 'q3', label: '3. ¿Qué % de compras totales nos hace a nosotros?' },
  { key: 'q4', label: '4. ¿Qué le ha costado encontrar últimamente?' },
  { key: 'q5', label: '5. ¿En qué mercado quiere crecer y cómo podemos ayudar?' },
  { key: 'q6', label: '6. ¿Qué le gusta de hacer negocios conmigo?' }
]

export default function ClienteDetalle({ cliente, onBack, onUpdate }) {
  const [activeTab, setActiveTab] = useState('resumen')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [llamadas, setLlamadas] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [crossSellData, setCrossSellData] = useState(null)
  const [resp5Q, setResp5Q] = useState(cliente.respuestas5Q || {})
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [l, c, p, xs] = await Promise.all([
        getLlamadasByCliente(cliente.id),
        getCotizaciones(), // Fetches all, we filter below
        getPedidos(cliente.id),
        getCrossSell(cliente.id).catch(() => null)
      ])
      setLlamadas(l)
      setCotizaciones(c.filter(cot => cot.clienteId === cliente.id))
      setPedidos(p)
      setCrossSellData(xs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [cliente.id])

  // --- Handlers for 5 Questions ---
  const [saving5Q, setSaving5Q] = useState(false)
  const handleSave5Q = async () => {
    setSaving5Q(true)
    try {
      await updateCliente5Q(cliente.id, resp5Q)
      alert('Perfil 5Q guardado')
      onUpdate() // trigger reload in parent
    } catch(e) { alert(e.message) } finally { setSaving5Q(false) }
  }

  // --- Form States for Llamadas ---
  const [selectedType, setSelectedType] = useState(null)
  const [note, setNote] = useState('')
  const [dcSatisfied, setDcSatisfied] = useState(true)
  const [savingLlamada, setSavingLlamada] = useState(false)

  const getSuggestedScript = () => {
    if (!selectedType) return ''
    const cName = cliente.contactoPrincipal || 'Sr. Cliente'
    const s1Prod = crossSellData?.s1?.[0]?.producto || 'sus productos habituales'
    const s2Prod = crossSellData?.s2?.[0]?.producto || 'nuestros productos complementarios'
    
    switch (selectedType.code) {
      case 'S1': return `"${cName}, le hablo de Moneycall. Revisando veo que solía comprarnos '${s1Prod}' pero hace tiempo no registra pedido. ¿Cómo ha estado la demanda?"`
      case 'S2': return `"${cName}, le hablo de Moneycall. Notamos que adquiere productos estándar, y muchos clientes similares complementan con '${s2Prod}'. ¿Le gustaría cotizarlo?"`
      case 'F1': return `"${cName}, le llamo para dar seguimiento a la cotización enviada. ¿Pudo revisarla con su equipo? ¿Qué fecha estimada de decisión consideran?"`
      case 'F2': return `"${cName}, le doy seguimiento a la cotización pendiente. Como cerramos lotes esta semana, me gustaría confirmar si procedemos con la orden."`
      case 'DC': return `"${cName}, veo que su pedido fue entregado. Solo para confirmar: ¿el material llegó completo y en perfectas condiciones?"`
      case 'RC': return `"${cName}, gracias por su lealtad. Ya llevamos ${cliente.dcSatisfactoriasCount||0} entregas perfectas. ¿Nos permitiría redactar un breve testimonio en su nombre para nuestra web?"`
      case 'PT': return `"${cName}, espero que tenga excelente semana. Mi llamada es solo para saludarle y saber cómo marcha su negocio. No le quito más tiempo."`
      case 'IN': return `"¡Hola ${cName}! Bienvenido a Moneycall. Claro que le ayudo... Y por cierto, ¿sabía que también tenemos '${s2Prod}'?"`
      default: return ''
    }
  }

  const handleLogLlamada = async (e) => {
    e.preventDefault()
    if(!selectedType) return
    setSavingLlamada(true)
    try {
      await createLlamada({
        clienteId: cliente.id,
        tipoLlamada: selectedType.code,
        direccion: selectedType.direction,
        satisfaccionDc: selectedType.code === 'DC' ? dcSatisfied : true,
        comentarios: note
      })
      await loadData()
      setSelectedType(null); setNote(''); setDcSatisfied(true)
      onUpdate()
    } catch (e) { alert(e.message) } finally { setSavingLlamada(false) }
  }

  // --- Form States for Cotizaciones ---
  const [newAmount, setNewAmount] = useState('')
  const [savingCot, setSavingCot] = useState(false)
  const [f1Modal, setF1Modal] = useState(null)
  const [f1Date, setF1Date] = useState('')

  const handleAddCot = async (e) => {
    e.preventDefault(); if (!newAmount) return
    setSavingCot(true)
    try {
      await createCotizacion({ clienteId: cliente.id, monto: parseFloat(newAmount) })
      await loadData(); setNewAmount(''); onUpdate()
    } catch(e) { alert(e.message) } finally { setSavingCot(false) }
  }
  const handleF1 = async (e) => {
    e.preventDefault(); if (!f1Date) return
    setSavingCot(true)
    try { await logF1(f1Modal, f1Date); await loadData(); setF1Modal(null); setF1Date('') } 
    catch(e) { alert(e.message) } finally { setSavingCot(false) }
  }
  const handleCloseCot = async (id, estado) => {
    try { await closeCotizacion(id, estado); await loadData(); onUpdate() } catch(e) { alert(e.message) }
  }
  const handleDeleteCot = async (id) => {
    if(!confirm('¿Seguro que deseas eliminar esta cotización?')) return
    try { await deleteCotizacion(id); await loadData(); onUpdate() } catch(e) { alert(e.message) }
  }

  // --- Form States for Pedidos ---
  const [newPedidos, setNewPedidos] = useState([{ producto: '', cantidad: 1, monto: '' }])
  const [savingPed, setSavingPed] = useState(false)
  
  const handleAddPedido = async (e) => {
    e.preventDefault()
    const validItems = newPedidos.filter(p => p.producto && p.monto)
    if(validItems.length === 0) return
    setSavingPed(true)
    try { 
      const payload = validItems.map(p => ({ ...p, clienteId: cliente.id }))
      await createPedido(payload)
      await loadData()
      setNewPedidos([{ producto: '', cantidad: 1, monto: '' }])
      onUpdate()
    } catch(e) { alert(e.message) } finally { setSavingPed(false) }
  }
  const handleDeletePed = async (id) => {
    if(!confirm('¿Eliminar pedido?')) return
    try { await deletePedido(id); await loadData(); onUpdate() } catch(e) { alert(e.message) }
  }

  // KPIs
  const totalLlamadas = llamadas.length
  const totalCompras = pedidos.reduce((sum, p) => sum + p.monto, 0)
  const cotsGanadas = cotizaciones.filter(c => c.estado === 'Ganada').length
  const winRate = cotizaciones.length > 0 ? Math.round((cotsGanadas / cotizaciones.length) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ── Header Toolbar ── */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="neu-btn text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <ArrowLeft size={16} /> Volver al Portafolio
        </button>
        <div className="flex items-center gap-2">
          {cliente.ventasAnuales >= 60000 && (
            <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Star size={12} /> TM-Ready
            </span>
          )}
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid rgba(163,177,198,0.3)' }}>
            Segmento: {cliente.segmentoPareto || 'Marginal'}
          </span>
        </div>
      </div>

      {/* ── Dashboard Header (Profile) ── */}
      <div className="neu-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>{cliente.nombreEmpresa}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            <span className="font-bold text-lg">{cliente.contactoPrincipal}</span> · {cliente.telefono}
          </p>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid rgba(163,177,198,0.2)' }}>
            <Phone size={16} style={{ color: 'var(--accent)' }} className="mb-1" />
            <span className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>{totalLlamadas}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Llamadas</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid rgba(163,177,198,0.2)' }}>
            <ShoppingBag size={16} className="mb-1 text-emerald-500" />
            <span className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>${totalCompras.toLocaleString()}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Compras</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid rgba(163,177,198,0.2)' }}>
            <Target size={16} className="mb-1 text-pink-500" />
            <span className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>{winRate}%</span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Win Rate</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid rgba(163,177,198,0.2)' }}>
            <Truck size={16} className="mb-1 text-amber-500" />
            <span className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>{cliente.dcSatisfactoriasCount || 0}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>DCs Perfectas</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[
          { id: 'resumen', label: 'Resumen & 5Q', icon: BarChart3 },
          { id: 'llamadas', label: 'CRM de Llamadas', icon: Phone },
          { id: 'cotizaciones', label: 'Pipeline de Cotizaciones', icon: FileText },
          { id: 'pedidos', label: 'Historial de Compras', icon: ShoppingBag },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === t.id ? 'neu-btn-accent' : 'neu-btn'
            }`}
            style={activeTab !== t.id ? { color: 'var(--text-muted)' } : {}}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="neu-card p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sincronizando información del cliente...</div>
      ) : (
        <div className="animate-fade-in-up">
          
          {/* TAB RESUMEN & 5Q */}
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Oportunidades (Cross-Sell) */}
              <div className="lg:col-span-1 space-y-4">
                <div className="neu-card p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap size={18} style={{ color: 'var(--accent)' }} />
                    <h3 className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>Oportunidades IA</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <span className="text-[10px] font-bold uppercase block mb-2" style={{ color: '#3b82f6' }}>S1: Riesgo de Churn</span>
                      {crossSellData?.s1?.length > 0 ? crossSellData.s1.map(i => (
                        <p key={i.producto} className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          📦 {i.producto} <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>({i.diasDesde} días sin comprar)</span>
                        </p>
                      )) : <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No hay alertas de inactividad S1.</p>}
                    </div>
                    
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <span className="text-[10px] font-bold uppercase block mb-2" style={{ color: '#6366f1' }}>S2: Venta Cruzada (Co-ocurrencia)</span>
                      {crossSellData?.s2?.length > 0 ? crossSellData.s2.map(i => (
                        <p key={i.producto} className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          ✨ {i.producto} <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>(Frec: {i.frecuencia})</span>
                        </p>
                      )) : <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No hay sugerencias S2 suficientes.</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Perfil 5Q */}
              <div className="lg:col-span-2">
                <div className="neu-card p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                      <Info size={18} style={{ color: 'var(--accent)' }} /> Entrevista de Perfilación (6Q)
                    </h3>
                    <button onClick={handleSave5Q} disabled={saving5Q} className="neu-btn-accent text-xs font-bold px-4 py-2 rounded-xl">
                      {saving5Q ? 'Guardando...' : 'Guardar Perfil'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {QUESTIONS.map(q => (
                      <div key={q.key} className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{q.label}</label>
                        <input className="neu-input w-full" value={resp5Q[q.key] || ''} onChange={e=>setResp5Q({...resp5Q, [q.key]: e.target.value})} placeholder="..." />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB LLAMADAS */}
          {activeTab === 'llamadas' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulario */}
              <div className="lg:col-span-5 space-y-4">
                <div className="neu-card p-6 space-y-4">
                  <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Plus size={18} style={{ color: 'var(--accent)' }} /> Registrar Interacción
                  </h3>
                  <form onSubmit={handleLogLlamada} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Tipo de Llamada</label>
                      <div className="relative">
                        <select className="neu-input w-full appearance-none pr-8" value={selectedType?.code || ''} onChange={e => setSelectedType(CALL_TYPES.find(t=>t.code===e.target.value))} required>
                          <option value="">Selecciona cuadrante...</option>
                          {CALL_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} - {t.sublabel}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>

                    {selectedType?.code === 'DC' && (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>¿Entrega conforme?</span>
                        <button type="button" onClick={() => setDcSatisfied(!dcSatisfied)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={dcSatisfied
                            ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                            : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          {dcSatisfied ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          {dcSatisfied ? 'Sí' : 'No'}
                        </button>
                      </div>
                    )}

                    {selectedType && (
                      <div className="p-4 rounded-xl border animate-fade-in" style={{ background: selectedType.bg, borderColor: selectedType.border }}>
                        <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: selectedType.color }}>Guión Sugerido</span>
                        <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--text)' }}>{getSuggestedScript()}</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Notas CRM</label>
                      <textarea className="neu-input w-full resize-none" rows={3} value={note} onChange={e=>setNote(e.target.value)} required placeholder="Resultados de la llamada..."></textarea>
                    </div>

                    <button type="submit" disabled={savingLlamada} className="neu-btn-accent w-full text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                      <Phone size={14} /> {savingLlamada ? 'Guardando...' : 'Guardar Llamada en CRM'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Timeline */}
              <div className="lg:col-span-7">
                <div className="neu-card p-6 h-full">
                  <h3 className="text-sm font-extrabold mb-4" style={{ color: 'var(--text)' }}>Historial de Comunicaciones</h3>
                  <div className="space-y-4 pr-2 max-h-[600px] overflow-y-auto">
                    {llamadas.length === 0 ? (
                      <p className="text-xs text-center py-10" style={{ color: 'var(--text-muted)' }}>Sin historial de llamadas registradas.</p>
                    ) : llamadas.map(l => {
                      const t = CALL_TYPES.find(c=>c.code===l.tipoLlamada) || CALL_TYPES[0]
                      const Icon = t.icon
                      return (
                        <div key={l.id} className="relative flex gap-4 p-4 rounded-2xl border" style={{ background: 'var(--bg)', borderColor: 'rgba(163,177,198,0.2)' }}>
                          <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white" style={{ background: t.color }}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-extrabold" style={{ color: t.color }}>{t.code} - {t.sublabel}</span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(163,177,198,0.1)', color: 'var(--text-muted)' }}>
                                {new Date(l.fechaHora).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{l.comentarios}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB COTIZACIONES */}
          {activeTab === 'cotizaciones' && (
            <div className="space-y-6">
              <div className="neu-card p-5">
                <form onSubmit={handleAddCot} className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Nuevo Proceso de Cotización (Monto USD)</label>
                    <input type="number" required className="neu-input w-full" value={newAmount} onChange={e=>setNewAmount(e.target.value)} placeholder="Ej. 12500" />
                  </div>
                  <button type="submit" disabled={savingCot} className="neu-btn-accent w-full sm:w-auto text-xs font-bold px-6 py-2.5 rounded-xl flex justify-center items-center gap-2 h-[42px]">
                    <Plus size={14} /> Iniciar Proceso
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                {cotizaciones.length === 0 ? (
                  <p className="text-xs text-center py-10" style={{ color: 'var(--text-muted)' }}>El cliente no tiene procesos de cotización activos ni pasados.</p>
                ) : cotizaciones.map(q => (
                  <div key={q.id} className="neu-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>${q.monto.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(q.fechaCreacion).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={
                          q.estado === 'Ganada' ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' } :
                          q.estado === 'Perdida' ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' } :
                          { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
                        }>{q.estado}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {q.estado === 'Pendiente' && !q.seguimientoF1 && (
                        <button onClick={() => setF1Modal(q.id)} className="neu-btn text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2" style={{ color: '#f59e0b' }}>
                          <Clock size={14} /> Registrar F1
                        </button>
                      )}
                      {q.estado === 'Pendiente' && q.seguimientoF1 && (
                        <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-2xl border" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
                          <span className="text-[10px] font-bold px-3 py-1 text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={12}/> F1 OK <span className="font-normal opacity-70">(Decisión: {new Date(q.fechaDecisionF1).toLocaleDateString()})</span>
                          </span>
                          <div className="h-6 w-px" style={{ background: 'rgba(163,177,198,0.3)' }} />
                          <button onClick={()=>handleCloseCot(q.id, 'Ganada')} className="text-xs font-bold px-4 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">Ganar</button>
                          <button onClick={()=>handleCloseCot(q.id, 'Perdida')} className="text-xs font-bold px-4 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">Perder</button>
                        </div>
                      )}
                      <button onClick={()=>handleDeleteCot(q.id)} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-red-500 ml-auto" title="Eliminar cotización">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal F1 */}
              {f1Modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,41,59,0.3)', backdropFilter: 'blur(4px)' }}>
                  <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark)' }}>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Agendar Cierre (F2)</h3>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Fecha de Decisión Acordada en el F1</label>
                      <input type="date" required className="neu-input w-full" value={f1Date} onChange={e=>setF1Date(e.target.value)} />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button onClick={()=>setF1Modal(null)} className="neu-btn text-xs font-semibold px-4 py-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
                      <button onClick={handleF1} disabled={savingCot || !f1Date} className="neu-btn-accent text-xs font-bold px-5 py-2 rounded-xl">Guardar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div className="space-y-6">
              <div className="neu-card p-5">
                <form onSubmit={handleAddPedido} className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Registrar Nueva Compra (Múltiples Items)</label>
                    <button type="button" onClick={() => setNewPedidos([...newPedidos, { producto: '', cantidad: 1, monto: '' }])} className="neu-btn text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <Plus size={12}/> Agregar Fila
                    </button>
                  </div>
                  
                  {newPedidos.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-3 rounded-xl border border-slate-100 relative">
                      <div className="md:col-span-5 space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Producto</label>
                        <input required className="neu-input w-full" value={item.producto} onChange={e=>{
                          const arr = [...newPedidos]; arr[idx].producto = e.target.value; setNewPedidos(arr)
                        }} placeholder="Ej. Equipo XYZ" />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Cant.</label>
                        <input required type="number" min="0.01" step="any" className="neu-input w-full" value={item.cantidad} onChange={e=>{
                          const arr = [...newPedidos]; arr[idx].cantidad = e.target.value; setNewPedidos(arr)
                        }} placeholder="1" />
                      </div>
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Monto Total USD</label>
                        <input required type="number" step="any" className="neu-input w-full" value={item.monto} onChange={e=>{
                          const arr = [...newPedidos]; arr[idx].monto = e.target.value; setNewPedidos(arr)
                        }} placeholder="5000" />
                      </div>
                      <div className="md:col-span-2">
                        {newPedidos.length > 1 && (
                          <button type="button" onClick={() => setNewPedidos(newPedidos.filter((_, i) => i !== idx))} className="neu-btn text-red-500 w-full flex items-center justify-center py-2.5 rounded-xl h-[42px]" title="Eliminar fila">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={savingPed} className="neu-btn-accent text-xs font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2">
                      <ShoppingBag size={14} /> Registrar {newPedidos.length > 1 ? 'Compra Múltiple' : 'Compra'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="neu-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead style={{ borderBottom: '1px solid rgba(163,177,198,0.2)' }}>
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Producto</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Cant.</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Monto</th>
                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(163,177,198,0.1)' }}>
                    {pedidos.length===0 && <tr><td colSpan="5" className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No hay compras registradas.</td></tr>}
                    {pedidos.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>{new Date(p.fechaPedido).toLocaleDateString()}</td>
                        <td className="px-5 py-4 font-extrabold" style={{ color: 'var(--text)' }}>{p.producto}</td>
                        <td className="px-5 py-4 font-medium" style={{ color: 'var(--text-muted)' }}>{p.cantidad} {p.unidad}</td>
                        <td className="px-5 py-4 font-bold text-emerald-500">${p.monto.toLocaleString()}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={()=>handleDeletePed(p.id)} className="neu-btn w-8 h-8 rounded-lg inline-flex items-center justify-center text-red-500">
                            <Trash2 size={13}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
