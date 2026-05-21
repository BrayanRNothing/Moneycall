import { useState, useEffect } from 'react'
import { Users, Plus, RefreshCw, AlertCircle, BookOpen, ChevronRight, BarChart3, Search } from 'lucide-react'
import { getClientes, createCliente, deleteCliente, recalcularPareto } from '../api'
import ClienteDetalle from '../components/ClienteDetalle'
import MetodologiaInfo from '../components/MetodologiaInfo'

export default function Portafolio() {
  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 }
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMetodologia, setShowMetodologia] = useState(false)
  
  // Detalle Cliente Modal
  const [selectedClient, setSelectedClient] = useState(null)
  
  const [newClient, setNewClient] = useState({ nombreEmpresa: '', contactoPrincipal: '', telefono: '', vendedorId: user.id })
  const [saving, setSaving] = useState(false)
  const [recalcPending, setRecalcPending] = useState(false)

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

  if (selectedClient) {
    return (
      <ClienteDetalle 
        cliente={selectedClient} 
        onBack={() => setSelectedClient(null)} 
        onUpdate={load} 
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Users size={24} style={{ color: 'var(--accent)' }} /> Mi Portafolio
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {clients.length} / 100 cuentas asignadas · Haz clic en un cliente para gestionar.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMetodologia(true)} className="neu-btn text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <BookOpen size={14} /> Metodología
          </button>
          <button onClick={load} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={handlePareto} disabled={recalcPending}
            className="neu-btn text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5" style={{ color: 'var(--accent)' }} title="Recalcular segmento 80/20 por ventas reales">
            <BarChart3 size={13} /> {recalcPending ? '...' : 'Pareto 80/20'}
          </button>
          <button onClick={() => setShowAddModal(true)} className="neu-btn-accent text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Plus size={15} /> Agregar Cliente
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 border border-red-100">
          <AlertCircle size={16} className="text-red-500" />
          <div>
            <p className="text-xs font-bold text-red-600">Sin conexión al backend</p>
            <p className="text-[10px] text-red-400">{error}</p>
          </div>
          <button onClick={load} className="ml-auto bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">Reintentar</button>
        </div>
      )}

      {/* Toolbar y Buscador */}
      <div className="neu-card p-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="neu-input w-full py-2 pl-9 pr-4 text-xs" 
            placeholder="Buscar por empresa o contacto..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        {/* Barra de progreso */}
        <div className="hidden md:flex items-center gap-3 w-64 shrink-0">
          <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Cartera</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(163,177,198,0.2)' }}>
            <div className="h-full transition-all" style={{ width: `${Math.min(clients.length, 100)}%`, background: 'var(--accent)' }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>{clients.length}/100</span>
        </div>
      </div>

      {/* Lista de Clientes (Tabla Moderna) */}
      <div className="neu-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Cargando portafolio...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No se encontraron clientes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ borderBottom: '1px solid rgba(163,177,198,0.2)' }}>
                <tr>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Empresa</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contacto</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Llamadas Mes</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Compras Total</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Segmento</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(163,177,198,0.1)' }}>
                {filtered.map(client => {
                  const calls = client.callCounts || {}
                  const totalCalls = Object.values(calls).reduce((a, b) => a + b, 0)
                  return (
                    <tr key={client.id} 
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-slate-50/10 transition-colors cursor-pointer group">
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-sm transition-colors" style={{ color: 'var(--text)' }}>{client.nombreEmpresa}</p>
                        {client.ventasAnuales >= 60000 && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border mt-1 inline-block" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}>⭐ TM-Ready</span>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold" style={{ color: 'var(--text)' }}>{client.contactoPrincipal}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{client.telefono}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold px-2.5 py-1 rounded-lg border" style={{ color: 'var(--text)', background: 'var(--bg)', borderColor: 'rgba(163,177,198,0.2)' }}>{totalCalls}</span>
                      </td>
                      <td className="px-5 py-4">
                        {client.totalCompras > 0 ? (
                          <span className="font-bold text-emerald-500">${client.totalCompras.toLocaleString()}</span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border" style={
                          client.segmentoPareto === 'Top 20%' 
                            ? { color: 'var(--accent)', background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }
                            : { color: 'var(--text-muted)', background: 'var(--bg)', borderColor: 'rgba(163,177,198,0.2)' }
                        }>
                          {client.segmentoPareto || 'Marginal'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="neu-btn p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}>
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Metodología */}
      {showMetodologia && <MetodologiaInfo onClose={() => setShowMetodologia(false)} />}

      {/* ── Modal Agregar Cliente ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,41,59,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg)', boxShadow: '16px 16px 40px var(--shadow-dark)' }}>
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'rgba(163,177,198,0.2)' }}>
              <h3 className="text-sm font-extrabold" style={{ color: 'var(--text)' }}>Agregar Cliente</h3>
              <button onClick={() => setShowAddModal(false)} className="neu-btn w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4 pt-2">
              {[
                { key: 'nombreEmpresa', label: 'Nombre de la Empresa', placeholder: 'Ej. Miami Cooling Inc.' },
                { key: 'contactoPrincipal', label: 'Contacto Principal', placeholder: 'Ej. Carlos Rodríguez' },
                { key: 'telefono', label: 'Teléfono', placeholder: 'Ej. +1 305-555-0100' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <input required className="neu-input w-full py-2.5 px-3 text-xs" 
                    placeholder={f.placeholder}
                    value={newClient[f.key] || ''}
                    onChange={e => setNewClient(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="neu-btn text-xs font-semibold px-4 py-2.5 rounded-xl" style={{ color: 'var(--text-muted)' }}>Cancelar</button>
                <button type="submit" disabled={saving || clients.length >= 100} className="neu-btn-accent text-xs font-bold px-6 py-2.5 rounded-xl">
                  {saving ? 'Guardando...' : 'Agregar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
