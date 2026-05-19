import { useState, useEffect } from 'react'
import { Users, HelpCircle, Check, Award, X, Plus, Trash2, RefreshCw, AlertCircle, ShoppingBag, BarChart3 } from 'lucide-react'
import { getClientes, createCliente, updateCliente5Q, deleteCliente, recalcularPareto, getPedidos, createPedido, deletePedido } from '../api'

const CALL_COLORS = { S1: '#3b82f6', S2: '#6366f1', DC: '#10b981', PT: '#94a3b8', F1: '#f59e0b', RC: '#f59e0b', IN: '#64748b' }

const questions = [
  { key: 'q1', label: '1. ¿Qué le gusta de hacer negocios con nosotros?', placeholder: 'Ej. La rapidez en el despacho.' },
  { key: 'q2', label: '2. ¿Qué le gusta de la competencia?', placeholder: 'Ej. El crédito más flexible.' },
  { key: 'q3', label: '3. ¿Qué % de compras totales nos hace a nosotros?', placeholder: 'Ej. 40% con nosotros.' },
  { key: 'q4', label: '4. ¿Qué le ha costado encontrar últimamente?', placeholder: 'Ej. Motores monofásicos 1.5 HP.' },
  { key: 'q5', label: '5. ¿En qué mercado quiere crecer y cómo podemos ayudar?', placeholder: 'Ej. VRF comercial en Broward.' },
]

export default function Portafolio() {
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 }
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showQModal, setShowQModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({})
  const [newClient, setNewClient] = useState({ nombreEmpresa: '', contactoPrincipal: '', telefono: '', vendedorId: user.id })
  const [saving, setSaving] = useState(false)
  const [recalcPending, setRecalcPending] = useState(false)
  // Historial de pedidos por cliente
  const [pedidosModal, setPedidosModal] = useState(null) // cliente seleccionado
  const [pedidos, setPedidos] = useState([])
  const [loadingPedidos, setLoadingPedidos] = useState(false)
  const [newPedido, setNewPedido] = useState({ producto: '', categoria: '', cantidad: 1, unidad: 'unidad', monto: '' })
  const [showPedidoForm, setShowPedidoForm] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await getClientes(user.id)
      setClients(data)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = clients.filter(c =>
    c.nombreEmpresa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactoPrincipal?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openQModal = (client) => {
    setSelectedClient(client)
    setFormData(client.respuestas5Q || {})
    setShowQModal(true)
  }

  const handleSave5Q = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await updateCliente5Q(selectedClient.id, formData)
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, respuestas5Q: formData } : c))
      setShowQModal(false)
    } catch (e) { alert('Error: ' + e.message) } finally { setSaving(false) }
  }

  const handleAddClient = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await createCliente(newClient)
      await load()
      setShowAddModal(false)
      setNewClient({ nombreEmpresa: '', contactoPrincipal: '', telefono: '', vendedorId: user.id })
    } catch (e) { alert('Error: ' + e.message) } finally { setSaving(false) }
  }

  const handlePareto = async () => {
    setRecalcPending(true)
    try { await recalcularPareto(user.id); await load(); alert('Análisis 80/20 actualizado.') }
    catch (e) { alert('Error: ' + e.message) } finally { setRecalcPending(false) }
  }

  const openPedidos = async (client) => {
    setPedidosModal(client); setLoadingPedidos(true); setPedidos([])
    try { setPedidos(await getPedidos(client.id)) }
    catch (e) { alert('Error: ' + e.message) } finally { setLoadingPedidos(false) }
  }

  const handleAddPedido = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await createPedido({ ...newPedido, clienteId: pedidosModal.id })
      setPedidos(await getPedidos(pedidosModal.id))
      setNewPedido({ producto: '', categoria: '', cantidad: 1, unidad: 'unidad', monto: '' })
      setShowPedidoForm(false)
    } catch (e) { alert('Error: ' + e.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente del portafolio?')) return
    try { await deleteCliente(id); setClients(prev => prev.filter(c => c.id !== id)) }
    catch (e) { alert('Error: ' + e.message) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Users size={22} style={{ color: 'var(--accent)' }} /> Mi Portafolio
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {clients.length} / 100 cuentas asignadas · Moneycall
          </p>
        </div>
        <div className="flex gap-2">
          <input className="neu-input max-w-xs" placeholder="Buscar cliente..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <button onClick={load} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={handlePareto} disabled={recalcPending}
            className="neu-btn text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5"
            style={{ color: '#3b82f6' }} title="Recalcular segmento 80/20 por ventas reales">
            <BarChart3 size={13} /> {recalcPending ? '...' : 'Pareto 80/20'}
          </button>
          <button onClick={() => setShowAddModal(true)} className="neu-btn-accent text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Plus size={15} /> Agregar
          </button>
        </div>
      </div>

      {/* Barra de progreso 100 cuentas */}
      <div className="neu-card p-4 flex items-center gap-4">
        <span className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ color: 'var(--text-muted)' }}>
          Ocupación de Cartera
        </span>
        <div className="flex-1 neu-progress-track">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(clients.length, 100)}%`, background: clients.length >= 100 ? '#ef4444' : '#3b82f6' }} />
        </div>
        <span className="text-xs font-extrabold shrink-0" style={{ color: clients.length >= 100 ? '#ef4444' : 'var(--text)' }}>
          {clients.length} / 100
        </span>
      </div>

      {/* Estados */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="neu-card p-5 flex flex-col gap-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-gray-400/10 rounded w-2/3" />
                  <div className="h-2 bg-gray-400/10 rounded w-1/2" />
                </div>
                <div className="h-5 bg-gray-400/10 rounded w-16" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(x => (
                  <div key={x} className="flex-1 h-10 bg-gray-400/10 rounded-lg" />
                ))}
              </div>
              <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid rgba(163,177,198,0.1)' }}>
                <div className="h-3 bg-gray-400/10 rounded w-1/3" />
                <div className="h-3 bg-gray-400/10 rounded w-1/3 ml-auto" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-8 flex-1 bg-gray-400/10 rounded-xl" />
                <div className="h-8 flex-1 bg-gray-400/10 rounded-xl" />
                <div className="h-8 w-8 bg-gray-400/10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="neu-card p-4 flex items-center gap-3" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={16} style={{ color: '#ef4444' }} />
          <div>
            <p className="text-xs font-bold" style={{ color: '#ef4444' }}>Sin conexión al backend</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Asegúrate de que el servidor corre en :5000 · {error}</p>
          </div>
          <button onClick={load} className="ml-auto neu-btn text-xs px-3 py-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>Reintentar</button>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((client) => {
            const calls = client.callCounts || {}
            const rcReady = (client.satisfiedDcs || 0) >= 10
            const hasAnswers = client.respuestas5Q && Object.keys(client.respuestas5Q).length > 0
            return (
              <div key={client.id} className="neu-card p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{client.nombreEmpresa}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {client.contactoPrincipal} · {client.telefono}
                    </p>
                    {client.totalCompras > 0 && (
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#10b981' }}>
                        ${client.totalCompras.toLocaleString()} USD en compras
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {rcReady && (
                      <span title="¡10 DCs! Pedir RC." className="w-6 h-6 rounded-full flex items-center justify-center text-white animate-bounce" style={{ background: '#10b981' }}>
                        <Award size={12} />
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: client.segmentoPareto === 'Top 20%' ? 'rgba(59,130,246,0.1)' : 'rgba(99,102,241,0.1)', color: client.segmentoPareto === 'Top 20%' ? '#3b82f6' : '#6366f1' }}>
                      {client.segmentoPareto || 'Marginal 80%'}
                    </span>
                  </div>
                </div>

                {/* Call Counters */}
                <div className="flex gap-2">
                  {['S1','S2','DC','PT'].map(type => (
                    <div key={type} className="flex-1 text-center">
                      <div className="neu-inset rounded-lg py-1.5">
                        <span className="text-sm font-extrabold block" style={{ color: CALL_COLORS[type] }}>{calls[type] || 0}</span>
                        <span className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>{type}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DC Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span className="font-semibold">DCs Satisfactorias</span>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>{Math.min(client.satisfiedDcs || 0, 10)} / 10</span>
                  </div>
                  <div className="neu-progress-track">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(client.satisfiedDcs || 0, 10) * 10}%`, background: rcReady ? '#10b981' : '#3b82f6' }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => openQModal(client)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all"
                    style={hasAnswers
                      ? { background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                      : { background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }
                    }>
                    {hasAnswers ? <Check size={13} strokeWidth={3} /> : <HelpCircle size={13} />}
                    <span className="hidden sm:inline">{hasAnswers ? 'Ver 5 Preguntas' : '5 Preguntas'}</span>
                  </button>
                  <button onClick={() => openPedidos(client)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all"
                    style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <ShoppingBag size={13} />
                    <span className="hidden sm:inline">Historial</span>
                  </button>
                  <button onClick={() => handleDelete(client.id)}
                    className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal 5 Preguntas ── */}
      {showQModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,41,59,0.25)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>5 Preguntas Clave</h3>
                <p className="text-[10px]" style={{ color: 'var(--accent)' }}>{selectedClient.nombreEmpresa}</p>
              </div>
              <button onClick={() => setShowQModal(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave5Q} className="p-6 overflow-y-auto space-y-4">
              {questions.map(q => (
                <div key={q.key} className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{q.label}</label>
                  <input required className="neu-input" placeholder={q.placeholder}
                    value={formData[q.key] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [q.key]: e.target.value }))} />
                </div>
              ))}
              <div className="flex gap-2 justify-end pt-4" style={{ borderTop: '1px solid rgba(163,177,198,0.3)' }}>
                <button type="button" onClick={() => setShowQModal(false)} className="neu-btn text-xs font-semibold px-4 py-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="neu-btn-accent text-xs font-bold px-4 py-2 rounded-xl">
                  {saving ? 'Guardando...' : 'Guardar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Agregar Cliente ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,41,59,0.25)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Agregar Cliente al Portafolio</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              {[
                { key: 'nombreEmpresa', label: 'Nombre de la Empresa', placeholder: 'Ej. Miami Cooling Inc.' },
                { key: 'contactoPrincipal', label: 'Contacto Principal', placeholder: 'Ej. Carlos Rodríguez' },
                { key: 'telefono', label: 'Teléfono', placeholder: 'Ej. +1 305-555-0100' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <input required className="neu-input" placeholder={f.placeholder}
                    value={newClient[f.key] || ''}
                    onChange={e => setNewClient(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="flex gap-2 justify-end pt-2" style={{ borderTop: '1px solid rgba(163,177,198,0.3)' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="neu-btn text-xs font-semibold px-4 py-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
                <button type="submit" disabled={saving || clients.length >= 100} className="neu-btn-accent text-xs font-bold px-4 py-2 rounded-xl">
                  {saving ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Modal Historial de Pedidos ── */}
      {pedidosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,41,59,0.25)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark), -16px -16px 40px var(--shadow-light)' }}>
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <ShoppingBag size={16} style={{ color: '#3b82f6' }} /> Historial de Compras
                </h3>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{pedidosModal.nombreEmpresa}</p>
              </div>
              <button onClick={() => setPedidosModal(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Formulario nuevo pedido */}
              <div className="neu-card p-4">
                <button onClick={() => setShowPedidoForm(!showPedidoForm)} className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  {showPedidoForm ? <X size={14} /> : <Plus size={14} />} {showPedidoForm ? 'Cancelar' : 'Registrar Compra Histórica'}
                </button>
                
                {showPedidoForm && (
                  <form onSubmit={handleAddPedido} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Producto / Línea</label>
                      <input required className="neu-input" placeholder="Ej. Minisplits 12K BTU" value={newPedido.producto} onChange={e => setNewPedido(prev => ({ ...prev, producto: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Monto Total (USD)</label>
                      <input required type="number" className="neu-input" placeholder="Ej. 1500" value={newPedido.monto} onChange={e => setNewPedido(prev => ({ ...prev, monto: e.target.value }))} />
                    </div>
                    <div className="flex gap-2 justify-end sm:col-span-2 pt-2">
                      <button type="submit" disabled={saving} className="neu-btn-accent text-xs font-bold px-4 py-2 rounded-xl">
                        {saving ? 'Guardando...' : 'Guardar Pedido'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Lista de pedidos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Compras registradas ({pedidos.length})</h4>
                {loadingPedidos ? (
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cargando historial...</p>
                ) : pedidos.length === 0 ? (
                  <div className="neu-inset p-4 text-center rounded-xl">
                    <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Sin compras registradas.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto neu-inset rounded-xl p-2">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr>
                          <th className="p-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                          <th className="p-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Producto</th>
                          <th className="p-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Monto</th>
                          <th className="p-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidos.map(p => (
                          <tr key={p.id} className="border-t border-gray-100/10 hover:bg-white/5">
                            <td className="p-2 font-semibold" style={{ color: 'var(--text-muted)' }}>{new Date(p.fechaPedido).toLocaleDateString()}</td>
                            <td className="p-2 font-bold" style={{ color: 'var(--text)' }}>{p.producto}</td>
                            <td className="p-2 font-semibold" style={{ color: '#10b981' }}>${p.monto.toLocaleString()}</td>
                            <td className="p-2 text-right">
                              <button onClick={async () => {
                                if(!confirm('¿Eliminar pedido?')) return;
                                try { await deletePedido(p.id); setPedidos(prev => prev.filter(x => x.id !== p.id)); } catch(e) { alert(e.message); }
                              }} className="p-1 rounded-lg hover:bg-red-500/10 text-red-400">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
