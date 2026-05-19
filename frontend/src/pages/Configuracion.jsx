import { useState, useEffect } from 'react'
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { getConfig, saveConfig } from '../api'

export default function Configuracion() {
  const [cfg, setCfg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getConfig()
      setCfg(data)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setSaved(false)
    try {
      await saveConfig(cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { alert('Error: ' + e.message) } finally { setSaving(false) }
  }

  const update = (key, value) => setCfg(prev => ({ ...prev, [key]: value }))

  // Calcular fórmula en tiempo real
  const calc = cfg ? (() => {
    const gerenteScore = cfg.gerenteCalificado ? 100 : 50
    const vendScore = cfg.totalVendedores > 0 ? Math.round((cfg.vendedoresCertificados / cfg.totalVendedores) * 100) : 0
    const estructura = Math.round(gerenteScore * 0.7 + vendScore * 0.3)
    const sistema = 89 // Viene del backend en dashboard real
    const operaciones = Math.round(cfg.otd * 0.9 + ((cfg.ar + (cfg.csr / 5 * 100) + cfg.id) / 3) * 0.1)
    const maxSales = Math.round((estructura * sistema * operaciones) / 10000)
    return { estructura, sistema, operaciones, maxSales }
  })() : null

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Cargando configuración...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Settings size={22} style={{ color: 'var(--accent)' }} />
          Configuración Operacional
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Panel del Gerente — Datos para la Fórmula Máxima de Ventas
        </p>
      </div>

      {error && (
        <div className="neu-card p-3 flex items-center gap-3" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <p className="text-xs" style={{ color: '#ef4444' }}>Sin conexión al backend · {error}</p>
        </div>
      )}

      {/* Preview fórmula en tiempo real */}
      {calc && (
        <div className="neu-card p-5">
          <h3 className="text-xs font-bold mb-4" style={{ color: 'var(--text)' }}>
            Preview — Fórmula Máxima de Ventas
          </h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Estructura', value: calc.estructura, color: '#1a1a1a', desc: 'Gerente × 0.7 + Vendedores × 0.3' },
              { label: 'Sistema', value: calc.sistema, color: '#4f46e5', desc: 'KPIs de actividad del mes' },
              { label: 'Operaciones', value: calc.operaciones, color: '#10b981', desc: 'OTD (90%) + AR+CSR+ID (10%)' },
              { label: 'MAX VENTAS', value: calc.maxSales, color: calc.maxSales >= 80 ? '#10b981' : '#f59e0b', desc: 'Capacidad total del sistema' },
            ].map((m, i) => (
              <div key={m.label} className="neu-inset rounded-2xl p-3 space-y-1">
                {i < 3 && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{i < 2 ? '×' : '='}</span>}
                <span className="text-3xl font-extrabold block" style={{ color: m.color }}>{m.value}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                <span className="text-[8px] block leading-tight" style={{ color: 'var(--text-muted)' }}>{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cfg && (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Estructura */}
          <div className="neu-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: '#1a1a1a' }} />
              <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Estructura</h3>
              <span className="text-[9px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                Gerente (70%) + Vendedores certificados (30%)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  ¿Gerente calificado?
                </label>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button" onClick={() => update('gerenteCalificado', v)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={cfg.gerenteCalificado === v
                        ? { background: v ? '#10b981' : '#ef4444', color: 'white' }
                        : { background: 'rgba(163,177,198,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(163,177,198,0.3)' }}>
                      {v ? 'Sí' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Vendedores certificados (≥80% roleplay)
                </label>
                <input type="number" min={0} max={cfg.totalVendedores} className="neu-input"
                  value={cfg.vendedoresCertificados}
                  onChange={e => update('vendedoresCertificados', parseInt(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  Total vendedores Moneycall
                </label>
                <input type="number" min={1} className="neu-input"
                  value={cfg.totalVendedores}
                  onChange={e => update('totalVendedores', parseInt(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Operaciones */}
          <div className="neu-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
              <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Operaciones</h3>
              <div className="flex items-center gap-1 text-[9px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                <Info size={10} /> OTD tiene peso del 90%, los demás comparten el 10%
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'otd', label: 'OTD — On-Time Delivery (%)', desc: 'Porcentaje de entregas a tiempo. Peso: 90%', min: 0, max: 100, unit: '%' },
                { key: 'ar', label: 'AR — Cuentas por cobrar (%)', desc: 'Dentro del estándar del sector', min: 0, max: 100, unit: '%' },
                { key: 'id', label: 'ID — Invoice Accuracy (%)', desc: '100 - % de discrepancias en facturas', min: 0, max: 100, unit: '%' },
                { key: 'csr', label: 'CSR — Servicio al Cliente (1-5)', desc: 'Promedio de encuestas de satisfacción', min: 1, max: 5, unit: '★', step: 0.1 },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    {f.label}
                  </label>
                  <div className="relative flex items-center gap-2">
                    <input type="number" min={f.min} max={f.max} step={f.step || 1} className="neu-input"
                      value={cfg[f.key]}
                      onChange={e => update(f.key, parseFloat(e.target.value))} />
                    <span className="shrink-0 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{f.unit}</span>
                  </div>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="neu-btn-accent text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2">
              <Save size={14} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#10b981' }}>
                <CheckCircle2 size={14} /> Guardado exitosamente
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
