import { useState } from 'react'
import { Award, Send, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import { submitExamen } from '../api'

const EXAM_QUESTIONS = [
  {
    id: 'q1',
    title: '1. Proactividad & Volumen de Llamadas',
    desc: '¿Cuál es la proporción mínima de llamadas salientes (proactivas) que debes mantener frente a las entrantes según la metodología, y cuál es tu meta diaria de llamadas?',
    placeholder: 'Ej. Se debe mantener un 80% de llamadas salientes y un 20% entrantes. La meta diaria es de 20 a 30 llamadas...'
  },
  {
    id: 'q2',
    title: '2. Regla de Oro: Límite de Cartera',
    desc: '¿Cuántos clientes debe tener asignados exactamente un vendedor Moneycall en su portafolio, cuál es la justificación de este límite y qué hace el CRM al intentar registrar uno adicional?',
    placeholder: 'Ej. Exactamente 100 clientes para asegurar una atención personalizada y de máxima calidad. El CRM bloquea de forma estricta cualquier cliente 101...'
  },
  {
    id: 'q3',
    title: '3. Cuadrantes de Joe Ellers (S1 y S2)',
    desc: '¿En qué cuadrantes de la matriz de Joe Ellers trabaja el vendedor de Moneycall y cuál es la diferencia conceptual y práctica entre una llamada S1 y una llamada S2?',
    placeholder: 'Ej. Trabajamos en los cuadrantes 1 y 2. S1 es proactivo para recuperar ventas de productos habituales; S2 es proactivo para venta cruzada (cross-selling) de nuevos productos...'
  },
  {
    id: 'q4',
    title: '4. La Primera Llamada (Las 5 Preguntas Clave)',
    desc: '¿Cuál es el objetivo principal de la primera llamada de diagnóstico y qué debes hacer cuando el cliente responde con términos genéricos como "buen servicio" o "buen precio"?',
    placeholder: 'Ej. El objetivo es escuchar y entender el negocio del cliente, NO vender. Ante respuestas genéricas, se debe pedir una definición exacta de qué es para ellos "buen servicio" y profundizar preguntando "¿qué más?"...'
  },
  {
    id: 'q5',
    title: '5. Proceso del Seguimiento de Cotizaciones (F1 y F2)',
    desc: '¿Cuándo se debe realizar obligatoriamente el primer seguimiento (F1) tras enviar una cotización, cuál es su meta de cumplimiento, y qué paso sigue si el cliente no cierra en esa llamada?',
    placeholder: 'Ej. El seguimiento F1 es obligatorio a las 24 horas con una meta del 100%. Si no cierra, se debe obtener una fecha de respuesta comprometida para agendar la llamada F2 en esa fecha exacta...'
  }
]

export default function ExamenRoleplay({ user, onSubmitted }) {
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', q4: '', q5: '' })
  const [activeStep, setActiveStep] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const handleTextChange = (id, text) => {
    setAnswers(prev => ({ ...prev, [id]: text }))
  }

  const answeredCount = Object.values(answers).filter(a => a.trim().length > 10).length
  const pct = Math.round((answeredCount / EXAM_QUESTIONS.length) * 100)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar que todas las preguntas estén contestadas con al menos 10 caracteres
    const emptyQs = EXAM_QUESTIONS.filter(q => answers[q.id].trim().length < 10)
    if (emptyQs.length > 0) {
      setError(`Por favor contesta con mayor detalle todas las preguntas antes de enviar (mínimo 10 caracteres).`)
      return
    }

    setSending(true)
    setError(null)
    try {
      await submitExamen(user.id, answers)
      if (onSubmitted) {
        await onSubmitted()
      }
    } catch (err) {
      setError(err.message || 'Error al enviar el examen. Reintente.')
    } finally {
      setSending(false)
    }
  }

  const currentQ = EXAM_QUESTIONS[activeStep]

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 animate-fade-in">
      {/* Header */}
      <div className="neu-card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0" 
          style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)', boxShadow: '0 8px 24px rgba(79,70,229,0.2)' }}>
          <Award size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Examen de Certificación Metodológica
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Demuestra tu dominio sobre las Reglas de Oro y Estrategias del libro Moneycall para habilitar tu cuenta.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="neu-card p-4 flex items-center gap-4">
        <span className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ color: 'var(--text-muted)' }}>
          Progreso del Examen
        </span>
        <div className="flex-1 neu-progress-track">
          <div className="h-full rounded-full transition-all duration-500" 
            style={{ width: `${pct}%`, background: 'var(--accent)' }} />
        </div>
        <span className="text-xs font-extrabold shrink-0" style={{ color: 'var(--text)' }}>
          {answeredCount} / 5 contestadas
        </span>
      </div>

      {error && (
        <div className="neu-card p-3.5 flex items-center gap-3" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.02)' }}>
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs font-bold leading-tight" style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {/* Examen Step-by-Step */}
      <div className="neu-card p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg" 
              style={{ color: 'var(--accent)', background: 'var(--bg)', boxShadow: '2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light)' }}>
              Pregunta {activeStep + 1} de 5
            </span>
            {answers[currentQ.id].trim().length >= 10 && (
              <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={10} /> Lista para enviar
              </span>
            )}
          </div>
          <h3 className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>{currentQ.title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{currentQ.desc}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
            Escribe tu respuesta
          </label>
          <textarea
            required
            className="neu-input resize-none p-4"
            rows={6}
            placeholder={currentQ.placeholder}
            value={answers[currentQ.id]}
            onChange={e => handleTextChange(currentQ.id, e.target.value)}
          />
          <div className="flex justify-between text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>
            <span>Mínimo 10 caracteres</span>
            <span>{answers[currentQ.id].length} caracteres</span>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
          <button
            type="button"
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
            className="neu-btn text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          {activeStep < 4 ? (
            <button
              type="button"
              onClick={() => setActiveStep(prev => prev + 1)}
              className="neu-btn-accent text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={sending}
              onClick={handleSubmit}
              className="neu-btn-accent text-xs font-bold px-6 py-2 rounded-xl flex items-center gap-2"
              style={{ background: pct === 100 ? '#10b981' : 'var(--accent)' }}
            >
              <Send size={14} /> {sending ? 'Enviando...' : 'Enviar Examen'}
            </button>
          )}
        </div>
      </div>

      {/* Rapid Jump Indicators */}
      <div className="flex justify-center gap-2">
        {EXAM_QUESTIONS.map((q, idx) => {
          const isDone = answers[q.id].trim().length >= 10
          return (
            <button
              key={q.id}
              onClick={() => setActiveStep(idx)}
              className="w-8 h-8 rounded-xl font-bold text-xs transition-all flex items-center justify-center"
              style={idx === activeStep
                ? { background: 'var(--bg)', color: 'var(--accent)', boxShadow: 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)' }
                : isDone
                ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                : { background: 'rgba(163,177,198,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(163,177,198,0.2)' }
              }
            >
              {idx + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
