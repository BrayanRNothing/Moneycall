import { useState } from 'react'
import { Award, Video, Mail, FileText, Star, BookOpen, Play } from 'lucide-react'

function Testimonials() {
  const [activeTab, setActiveTab] = useState('planA')

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
      desc: 'Plan definitivo si el cliente no tiene tiempo. Tasa de éxito ~95%.',
      text: '"Don [Nombre], sé que está muy ocupado. Para hacérselo ultra fácil, redacté un resumen de 3 oraciones de cómo le ahorramos $4,000 en mermas. ¿Le parece si se lo mando, lo revisa, y si está de acuerdo lo firmamos con su logo para LinkedIn?"',
      icon: FileText, color: '#10b981'
    }
  }

  const active = scripts[activeTab]
  const ActiveIcon = active.icon

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Award size={22} style={{ color: 'var(--accent)' }} />
          Referidos & Testimonios (RC)
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Se gana el derecho a pedir referidos con 10 Delivery Calls (DC) perfectas consecutivas.</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Plan A (Emails)', value: '1', icon: Mail, color: '#3b82f6' },
          { label: 'Plan B (Videos)', value: '2', icon: Video, color: '#6366f1' },
          { label: 'Plan C (Cartas)', value: '1', icon: FileText, color: '#10b981' },
        ].map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="neu-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                style={{ background: m.color, boxShadow: `4px 4px 12px ${m.color}40` }}>
                <Icon size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                <span className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{m.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Testimonials Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
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

        {/* Script Coach Panel */}
        <div className="neu-card p-6 space-y-5 flex flex-col">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} style={{ color: 'var(--accent)' }} />
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
                  ? { background: 'white', color: 'var(--accent)', boxShadow: '3px 3px 8px var(--shadow-dark), -3px -3px 8px var(--shadow-light)' }
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
              <Play size={12} fill="currentColor" /> Escuchar Clínica de Guy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Testimonials
