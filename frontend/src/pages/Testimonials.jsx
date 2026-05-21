import { useState, useEffect } from 'react'
import { Award, Video, Mail, FileText, Star, BookOpen, Play, CheckCircle2, ChevronRight, Copy, Check, Users } from 'lucide-react'
import { getClientes, updatePlanTestimonio } from '../api'

export default function Testimonials() {
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 }
  const [activeTab, setActiveTab] = useState('planA')
  const [viewMode, setViewMode] = useState('pipeline') // pipeline or gallery
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  const loadClients = async () => {
    setLoading(true)
    try {
      const data = await getClientes(user.id)
      setClients(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleUpdatePlan = async (clientId, plan) => {
    try {
      await updatePlanTestimonio(clientId, plan)
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, planTestimonio: plan } : c))
    } catch (e) {
      alert('Error updating plan: ' + e.message)
    }
  }

  const copyScriptToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const testimonials = [
    { id: 1, client: 'Boca Cooling Solutions', contact: 'Carlos Rivera', rating: 5, plan: 'Plan B', planLabel: 'LinkedIn Video', content: 'La velocidad con la que nos atienden en Will Call es inigualable. Laura siempre está un paso adelante, avisándome sobre stock antes de que empiece mis obras.', initials: 'CR', color: '#3b82f6' },
    { id: 2, client: 'Jones Plumbing & HVAC', contact: 'David Jones', rating: 5, plan: 'Plan C', planLabel: 'Carta Firmada', content: 'Hemos trabajado con varias distribuidoras por 15 años y el servicio proactivo de Moneycall es incomparable. Nunca nos dejan con dudas en las cotizaciones.', initials: 'DJ', color: '#6366f1' },
    { id: 3, client: 'Delray Comfort Experts', contact: 'Mark Wilson', rating: 5, plan: 'Plan A', planLabel: 'Email Intro', content: 'Introducción por correo de Mark a Broward Heating Inc, recomendando a Laura por las 10 entregas perfectas que Delray recibió este trimestre.', initials: 'MW', color: '#10b981' },
    { id: 4, client: 'Acme Air Conditioning', contact: 'Thomas Jenkins', rating: 5, plan: 'Plan B', planLabel: 'LinkedIn Video', content: 'Video de 25 seg grabado por Thomas en el mostrador, agradeciendo a Laura por conseguir los compresores de 5 toneladas en tiempo récord para un hospital local.', initials: 'TJ', color: '#f59e0b' },
  ]

  const scripts = {
    planA: {
      title: 'Plan A: Introducción por Correo Electrónico',
      desc: 'Para clientes con 10 DCs perfectas y una relación sólida. Tasa de éxito ~30%.',
      text: '"[Nombre], ya que completamos nuestra décima entrega perfecta y estás encantado con el servicio Will Call, ¿te importaría hacer una breve introducción por correo a [Prospecto] de [Empresa]? Podría ofrecerle el mismo nivel de servicio personalizado."',
      icon: Mail, color: '#3b82f6'
    },
    planB: {
      title: 'Plan B: Video Testimonial (LinkedIn)',
      desc: 'Ideal cuando el cliente está en Will Call muy satisfecho. Tasa de éxito ~50%.',
      text: '"[Nombre], ¡qué bueno que llegó a tiempo! ¿Me harías un favor de 20 segundos? Grabemos un selfie video corto para LinkedIn. Solo di: \'Soy [Tu Nombre] de [Empresa] y me encanta trabajar con Laura de Moneycall porque siempre me salvan el día\'."',
      icon: Video, color: '#6366f1'
    },
    planC: {
      title: 'Plan C: Carta Pre-redactada (Contingencia)',
      desc: 'Plan definitivo si el cliente no tiene tiempo o rechaza A y B. Tasa de éxito ~95%.',
      text: '"Don [Nombre], sé que está muy ocupado. Para hacérselo ultra fácil, redacté un resumen de 3 oraciones de cómo le ahorramos $4,000 en mermas. ¿Le parece si se lo mando, lo revisa, y si está de acuerdo lo firmamos con su logo para LinkedIn?"',
      icon: FileText, color: '#10b981'
    }
  }

  const active = scripts[activeTab]
  const ActiveIcon = active.icon

  // Métricas del pipeline
  const cltsConDc = clients.filter(c => c.dcSatisfactoriasCount > 0)
  const countA = clients.filter(c => c.planTestimonio === 'A' && c.dcSatisfactoriasCount >= 10).length
  const countB = clients.filter(c => c.planTestimonio === 'B' && c.dcSatisfactoriasCount >= 10).length
  const countC = clients.filter(c => c.planTestimonio === 'C' && c.dcSatisfactoriasCount >= 10).length

  // Obtener el guión rellenado con datos del cliente
  const getPersonalizedScript = (client) => {
    const plan = client.planTestimonio || 'A'
    const name = client.contactoPrincipal ? client.contactoPrincipal.split(' ')[0] : 'Cliente'
    const scriptTemplate = scripts[`plan${plan}`]?.text || scripts.planA.text
    return scriptTemplate.replace('[Nombre]', name).replace('[Tu Nombre]', name)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Award size={22} style={{ color: 'var(--success)' }} />
            Referidos & Testimonios (RC)
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Gánate el derecho a pedir testimonios y referidos completando Delivery Calls (DC) satisfactorias consecutivas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl neu-inset shrink-0 max-w-[280px]">
          <button onClick={() => setViewMode('pipeline')}
            className="py-2 px-3 text-xs font-bold rounded-lg transition-all"
            style={viewMode === 'pipeline'
              ? { background: 'white', color: 'var(--text)', boxShadow: '3px 3px 8px var(--shadow-dark)' }
              : { color: 'var(--text-muted)' }
            }>
            Seguimiento
          </button>
          <button onClick={() => setViewMode('gallery')}
            className="py-2 px-3 text-xs font-bold rounded-lg transition-all"
            style={viewMode === 'gallery'
              ? { background: 'white', color: 'var(--text)', boxShadow: '3px 3px 8px var(--shadow-dark)' }
              : { color: 'var(--text-muted)' }
            }>
            Galería ({testimonials.length})
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Plan A Habilitados', value: countA, icon: Mail, color: '#3b82f6' },
          { label: 'Plan B Habilitados', value: countB, icon: Video, color: '#6366f1' },
          { label: 'Plan C Habilitados', value: countC, icon: FileText, color: '#10b981' },
        ].map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="neu-card p-4 flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0"
                style={{ background: m.color, boxShadow: `4px 4px 12px ${m.color}30` }}>
                <Icon size={18} />
              </div>
              <div>
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                <span className="text-xl md:text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{m.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table/Gallery Column */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'pipeline' ? (
            <div className="neu-card p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-indigo-500" />
                Clientes Elegibles para Testimonio (Meta: ≥10 DCs)
              </h3>

              {loading ? (
                <p className="text-xs text-center py-6">Cargando portafolio de clientes...</p>
              ) : clients.length === 0 ? (
                <div className="text-center py-10 neu-inset rounded-xl bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-500">No hay clientes asignados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200" style={{ color: 'var(--text-muted)' }}>
                        <th className="py-2 font-bold">Cliente / DCs</th>
                        <th className="py-2 font-bold text-center">Fórmula A/B/C</th>
                        <th className="py-2 font-bold">Guion Sugerido</th>
                        <th className="py-2 font-bold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map((c) => {
                        const count = c.dcSatisfactoriasCount || 0
                        const elegible = count >= 10
                        const colorPlan = c.planTestimonio === 'A' ? '#3b82f6' : c.planTestimonio === 'B' ? '#6366f1' : '#10b981'
                        const isCompleted = c.planTestimonio === 'completado'
                        
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-3 pr-2">
                              <p className="font-extrabold text-slate-800">{c.nombreEmpresa}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${elegible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                  {count} DCs perfectas
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              {isCompleted ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                  ✓ Completado
                                </span>
                              ) : elegible ? (
                                <select
                                  value={c.planTestimonio || 'A'}
                                  onChange={(e) => handleUpdatePlan(c.id, e.target.value)}
                                  className="text-[10px] font-bold py-1 px-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none cursor-pointer"
                                  style={{ color: colorPlan }}
                                >
                                  <option value="A" style={{ color: '#3b82f6' }}>Plan A (Email)</option>
                                  <option value="B" style={{ color: '#6366f1' }}>Plan B (Video)</option>
                                  <option value="C" style={{ color: '#10b981' }}>Plan C (Carta)</option>
                                  <option value="completado" style={{ color: '#64748b' }}>✓ Completado</option>
                                </select>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold block min-w-[90px]">
                                  {Math.round((count/10)*100)}% de meta
                                </span>
                              )}
                            </td>
                            <td className="py-3 max-w-[200px] truncate">
                              {elegible && !isCompleted ? (
                                <span className="text-[10.5px] italic text-slate-600 block truncate" title={getPersonalizedScript(c)}>
                                  {getPersonalizedScript(c)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Pendiente acumular DCs</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              {elegible && !isCompleted ? (
                                <button
                                  onClick={() => copyScriptToClipboard(getPersonalizedScript(c), c.id)}
                                  className="p-2 rounded-lg hover:bg-slate-200/50 text-indigo-500 transition-all active:scale-95"
                                  title="Copiar guion al portapapeles"
                                >
                                  {copiedId === c.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-300">-</span>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {testimonials.map((t) => (
                <div key={t.id} className="neu-card p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
                    {[...Array(t.rating)].map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                  </div>
                  <p className="text-xs leading-relaxed italic flex-1" style={{ color: 'var(--text)' }}>
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid rgba(163,177,198,0.3)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0"
                      style={{ background: t.color }}>
                      {t.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{t.client}</p>
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{t.contact}</span>
                        <span>·</span>
                        <span className="font-bold" style={{ color: t.color }}>{t.planLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Script Coach Panel */}
        <div className="neu-card p-6 space-y-5 flex flex-col">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} style={{ color: 'var(--success)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Clínica de Guiones</h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Selecciona el plan para ver el guion recomendado para pedir el testimonio:
          </p>

          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl neu-inset">
            {['planA', 'planB', 'planC'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="py-2 text-[11px] font-bold rounded-lg transition-all"
                style={activeTab === tab
                  ? { background: 'white', color: 'var(--success)', boxShadow: '3px 3px 8px var(--shadow-dark)' }
                  : { color: 'var(--text-muted)' }
                }>
                {tab === 'planA' ? 'Plan A' : tab === 'planB' ? 'Plan B' : 'Plan C'}
              </button>
            ))}
          </div>

          {/* Script Card */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: active.color }}>
                <ActiveIcon size={15} />
              </div>
              <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>{active.title}</h4>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{active.desc}</p>
            <div className="neu-inset p-4 rounded-xl">
              <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text)' }}>{active.text}</p>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all neu-btn" style={{ color: active.color }}>
              <Play size={12} fill="currentColor" /> Escuchar Clínica
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
