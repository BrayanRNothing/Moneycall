import { PhoneOutgoing, Clock, Truck, Star, PhoneIncoming, Heart, BookOpen, ChevronRight, X } from 'lucide-react'

const METODOLOGIA = [
  {
    title: 'S1 - Cuadrante de Recuperación',
    icon: PhoneOutgoing,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    desc: 'Clientes inactivos en ciertos productos por más de 45 días.',
    tip: 'Llama para averiguar por qué dejaron de comprar y recupera el negocio.'
  },
  {
    title: 'S2 - Venta Cruzada',
    icon: PhoneOutgoing,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    desc: 'Ofrecer productos complementarios basados en compras de clientes similares.',
    tip: 'Aumenta el ticket promedio con sugerencias relevantes al negocio del cliente.'
  },
  {
    title: 'F1 - Primer Seguimiento',
    icon: Clock,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    desc: 'Llamada obligatoria post-cotización (100% cobertura).',
    tip: 'No dejes cotizaciones sueltas. En esta llamada se fija la fecha F2 de decisión.'
  },
  {
    title: 'F2 - Segundo Seguimiento',
    icon: Clock,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.1)',
    desc: 'Llamada de cierre basada en la fecha acordada en F1.',
    tip: 'El 40% restante de las ventas se cierra aquí. ¡Llama puntual en la fecha acordada!'
  },
  {
    title: 'DC - Delivery Check',
    icon: Truck,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    desc: 'Confirmar satisfacción en la entrega del pedido.',
    tip: 'Asegura que el cliente recibió todo bien. Si acumulas 10 DCs perfectas, puedes pedir RC.'
  },
  {
    title: 'RC - Referencia / Testimonio',
    icon: Star,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    desc: 'Pedir testimonio en video, texto o un referido.',
    tip: 'Solo se pide después de 10 entregas perfectas. Inicia pidiendo video (Plan A).'
  },
  {
    title: 'PT - Contacto Personal',
    icon: Heart,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
    desc: 'Llamada de relación, sin intención de venta.',
    tip: 'Meta: 1 por cliente al trimestre. Mantén la relación cálida ("Solo quería saludarte").'
  },
  {
    title: 'IN - Entrante',
    icon: PhoneIncoming,
    color: '#64748b',
    bg: 'rgba(100,116,139,0.1)',
    desc: 'El cliente te llama a ti.',
    tip: 'Atiende su solicitud, pero antes de colgar ofrece venta cruzada (S2) o promociones.'
  }
]

export default function MetodologiaInfo({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in" style={{ background: 'var(--bg)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div className="px-6 py-5 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Metodología Moneycall</h2>
              <p className="text-xs font-medium text-blue-100">Guía rápida de nomenclatura y procesos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8 bg-slate-50/50">
          {/* Introducción */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-2">El Pipeline de Cotizaciones</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              En Moneycall, <strong>nunca se envía una cotización sin darle seguimiento</strong>. El proceso es:
            </p>
            <div className="mt-4 flex items-center flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">Cotización (Pendiente)</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="px-3 py-1.5 rounded-lg text-amber-700 border border-amber-200 bg-amber-50">F1 (1er Seguimiento)</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="px-3 py-1.5 rounded-lg text-pink-700 border border-pink-200 bg-pink-50">F2 (Cierre/Decisión)</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="px-3 py-1.5 rounded-lg text-emerald-700 border border-emerald-200 bg-emerald-50">Ganada / Perdida</span>
            </div>
          </div>

          {/* Tipos de Llamadas */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 px-1">Tipos de Llamadas (Nomenclatura)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {METODOLOGIA.map((m) => (
                <div key={m.title} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: m.bg, color: m.color }}>
                    <m.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: m.color }}>{m.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 mb-1.5 font-medium leading-relaxed">{m.desc}</p>
                    <p className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-lg leading-tight">💡 {m.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
