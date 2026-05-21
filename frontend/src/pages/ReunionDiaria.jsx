import { useState, useEffect } from 'react'
import { TrendingUp, Users, CheckCircle2, AlertTriangle, Shuffle, Phone, ShieldAlert, FileText, Check, ArrowRight } from 'lucide-react'
import { getDailyMeeting, getClientes } from '../api'

export default function ReunionDiaria() {
  const [vendedoresData, setVendedoresData] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [randomCliente, setRandomCliente] = useState(null)
  const [auditando, setAuditando] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [vData, cData] = await Promise.all([
        getDailyMeeting(),
        getClientes()
      ])
      setVendedoresData(vData)
      setClientes(cData)
    } catch (e) {
      setError(e.message)
      // Fallback estático para gerentes
      setVendedoresData([
        {
          id: 1,
          nombre: 'Carlos López',
          rolCanal: 'Moneycall',
          cuentas: 45,
          ayer: { salientes: 24, entrantes: 4, total: 28, proactividad: 86, s1: 3, s2: 5, dc: 10, f1: 4, f2: 1, rc: 1, pt: 0 },
          cotizAyer: 5,
          closeRatios: { numRatio: 22, importRatio: 25, discrepancia: 3 },
          f1Pct: 100,
          metaCumplida: true,
          alertas: []
        },
        {
          id: 2,
          nombre: 'Ana Rodríguez',
          rolCanal: 'Mostrador / Inbound',
          cuentas: 60,
          ayer: { salientes: 12, entrantes: 18, total: 30, proactividad: 40, s1: 0, s2: 1, dc: 2, f1: 1, f2: 0, rc: 0, pt: 0 },
          cotizAyer: 2,
          closeRatios: { numRatio: 15, importRatio: 24, discrepancia: 9 },
          f1Pct: 50,
          metaCumplida: false,
          alertas: ['⚠ Proactividad 40% < 80%', '📞 Solo 12/30 llamadas salientes', '📊 Discrepancia close ratio: 9pp > 5pp', '🔴 F1 en solo 50% de cotizaciones']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const seleccionarClienteAleatorio = () => {
    if (clientes.length === 0) return
    setAuditando(true)
    const index = Math.floor(Math.random() * clientes.length)
    const selected = clientes[index]
    setRandomCliente(selected)
  }

  // Contar alertas totales
  const totalAlertas = vendedoresData.reduce((acc, v) => acc + (v.alertas?.length || 0), 0)
  const metaCumplidaCount = vendedoresData.filter(v => v.metaCumplida).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <TrendingUp size={22} style={{ color: 'var(--success)' }} />
            Reunión Diaria de 20 Minutos
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Métricas del día anterior del equipo para análisis gerencial rápido y control de calidad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="neu-card-sm px-4 py-2 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Duración Recomendada</span>
            <span className="text-sm font-extrabold text-red-500">⚡ Máx 20 min</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando métricas de equipo...</div>
      ) : error ? (
        <div className="neu-card p-6 bg-red-50 text-red-700 border border-red-200">
          <p className="text-sm font-bold flex items-center gap-2">
            <ShieldAlert size={16} /> Error de conexión: {error}
          </p>
          <p className="text-xs mt-1">Mostrando datos simulados para continuar con la metodología.</p>
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="neu-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '4px 4px 12px rgba(16,185,129,0.3)' }}>
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Ejecutivos de Cuenta</span>
            <span className="text-2xl font-extrabold text-slate-800">{vendedoresData.length} Vendedores</span>
          </div>
        </div>

        <div className="neu-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '4px 4px 12px rgba(245,158,11,0.3)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Meta Salientes Alcanzada</span>
            <span className="text-2xl font-extrabold text-slate-800">{metaCumplidaCount} de {vendedoresData.length}</span>
          </div>
        </div>

        <div className="neu-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: totalAlertas > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)', boxShadow: totalAlertas > 0 ? '4px 4px 12px rgba(239,68,68,0.3)' : '4px 4px 12px rgba(16,185,129,0.3)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Alertas de Desviación</span>
            <span className={`text-2xl font-extrabold ${totalAlertas > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{totalAlertas} Alertas</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Seller Table & QA Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="neu-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" />
              Desempeño Diario por Ejecutivo (Ayer)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200" style={{ color: 'var(--text-muted)' }}>
                    <th className="py-2.5 font-bold">Vendedor</th>
                    <th className="py-2.5 font-bold text-center">Salientes</th>
                    <th className="py-2.5 font-bold text-center">Proactividad</th>
                    <th className="py-2.5 font-bold text-center">F1 100%</th>
                    <th className="py-2.5 font-bold text-center">Disc. Ratio</th>
                    <th className="py-2.5 font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendedoresData.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <p className="font-extrabold text-slate-800">{v.nombre}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{v.rolCanal}</p>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded-md ${v.ayer.salientes >= 20 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                          {v.ayer.salientes}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-semibold ${v.ayer.proactividad >= 80 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {v.ayer.proactividad}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-semibold ${v.f1Pct === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {v.f1Pct}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-semibold ${v.closeRatios.discrepancia > 5 ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
                          {v.closeRatios.discrepancia}pp
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {v.metaCumplida ? (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-extrabold border border-emerald-100 uppercase tracking-wider">
                            <Check size={10} /> Meta Ok
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-extrabold border border-red-100 uppercase tracking-wider">
                            Desvío
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alert log */}
          {totalAlertas > 0 && (
            <div className="neu-card p-6 bg-red-50/20 border border-red-200/50 space-y-4">
              <h3 className="text-xs font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} /> Bitácora de Desviaciones a Corregir (Reunión 20 Min)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendedoresData.map(v => v.alertas?.length > 0 && (
                  <div key={v.id} className="neu-inset p-4 rounded-2xl bg-white/40 space-y-2">
                    <p className="text-xs font-extrabold text-slate-800 border-b pb-1 border-slate-100">{v.nombre}</p>
                    <ul className="space-y-1">
                      {v.alertas.map((a, i) => (
                        <li key={i} className="text-[11px] text-red-600 font-medium flex items-start gap-1.5">
                          <span className="block mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simple custom chart */}
          <div className="neu-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800">Llamadas Salientes vs Meta Mínima (20)</h3>
            <div className="space-y-3">
              {vendedoresData.map(v => (
                <div key={v.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{v.nombre}</span>
                    <span>{v.ayer.salientes} llamadas</span>
                  </div>
                  <div className="neu-progress-track relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((v.ayer.salientes / 30) * 100, 100)}%`,
                        background: v.ayer.salientes >= 20 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f87171)'
                      }}
                    ></div>
                    {/* Meta line indicator at 20 calls (66.6% of 30) */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-black/30 border-dashed border-l border-slate-400" style={{ left: '66.6%' }} title="Meta Mínima (20 llamadas)"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QA Random Audit Column */}
        <div className="space-y-6">
          <div className="neu-card p-6 flex flex-col justify-between min-h-[400px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Shuffle size={18} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800">Verificación Aleatoria CRM</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                La metodología Moneycall exige que el gerente llame a un cliente aleatorio todos los días para verificar la calidad de la última llamada/entrega (DC).
              </p>

              {randomCliente ? (
                <div className="neu-inset p-4 rounded-2xl bg-white/40 space-y-3 animate-fade-in">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-extrabold text-indigo-600 uppercase tracking-wide">Cliente Elegido</h4>
                      <p className="text-sm font-black text-slate-800 leading-tight mt-0.5">{randomCliente.nombreEmpresa}</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                      {randomCliente.segmentoPareto === 'Top 20%' ? '⭐ Pareto Top' : 'Pareto Marginal'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] pt-2 border-t border-slate-200/50">
                    <div>
                      <span className="text-slate-500 block">Contacto</span>
                      <span className="font-bold text-slate-700">{randomCliente.contactoPrincipal}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Preferencia</span>
                      <span className="font-bold text-slate-700 capitalize">{randomCliente.contactoPreferencia || 'No especificada'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Teléfono</span>
                      <a href={`tel:${randomCliente.telefono}`} className="font-extrabold text-slate-800 flex items-center gap-1 hover:underline text-xs">
                        <Phone size={11} className="text-indigo-500" /> {randomCliente.telefono}
                      </a>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl mt-2 text-[11px] leading-relaxed text-indigo-950 font-medium">
                    <p className="font-bold text-indigo-900 mb-1 flex items-center gap-1">
                      <Sparkles size={11} /> Guion de Auditoría Gerencial:
                    </p>
                    "Hola {randomCliente.contactoPrincipal.split(' ')[0]}, le habla el Gerente de Moneycall. Quería tomarme 60 segundos para validar si su última experiencia de entrega fue verdaderamente excepcional y si recibió todo a tiempo. ¿Hubo algo que pudimos hacer mejor?"
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center neu-inset rounded-2xl bg-slate-50/50">
                  <Shuffle size={32} className="text-slate-400 animate-pulse" />
                  <p className="text-xs text-slate-500 font-bold mt-2.5">No se ha seleccionado ningún cliente</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[180px]">Haz clic en el botón de abajo para elegir un cliente al azar.</p>
                </div>
              )}
            </div>

            <button
              onClick={seleccionarClienteAleatorio}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all bg-indigo-600 hover:bg-indigo-700 text-white mt-6 shadow-md hover:shadow-indigo-500/20"
            >
              <Shuffle size={14} />
              {randomCliente ? 'Elegir Otro Cliente' : 'Lanzar Auditoría Aleatoria'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
