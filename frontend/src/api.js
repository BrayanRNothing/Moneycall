// ── Moneycall CRM — API Utility ───────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || 'https://moneycall-production.up.railway.app/api'

async function req(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'API error')
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username, password) => req('/login', { method: 'POST', body: JSON.stringify({ username, password }) })

// ── Vendedores ────────────────────────────────────────────────────────────────
export const getVendedores = () => req('/vendedores')
export const createVendedor = (data) => req('/vendedores', { method: 'POST', body: JSON.stringify(data) })

// ── Clientes ──────────────────────────────────────────────────────────────────
export const getClientes = (vendedorId) =>
  req(`/clientes${vendedorId ? `?vendedorId=${vendedorId}` : ''}`)
export const createCliente = (data) => req('/clientes', { method: 'POST', body: JSON.stringify(data) })
export const updateCliente5Q = (id, respuestas5Q) =>
  req(`/clientes/${id}/questions`, { method: 'PUT', body: JSON.stringify({ respuestas5Q }) })
export const deleteCliente = (id) => req(`/clientes/${id}`, { method: 'DELETE' })
export const recalcularPareto = (vendedorId) => req(`/clientes/pareto/${vendedorId}`, { method: 'POST' })

// Nuevos endpoints de clientes — Metodología Moneycall
export const getCrossSell = (clienteId) => req(`/clientes/${clienteId}/cross-sell`)
export const updatePreferenciaContacto = (clienteId, contactoPreferencia) =>
  req(`/clientes/${clienteId}/preferencia`, { method: 'PUT', body: JSON.stringify({ contactoPreferencia }) })
export const updatePlanTestimonio = (clienteId, planTestimonio) =>
  req(`/clientes/${clienteId}/plan-testimonio`, { method: 'PUT', body: JSON.stringify({ planTestimonio }) })
export const getClientesTMUpgrade = (gerenteId) => req(`/clientes/tm-upgrade${gerenteId ? `?gerenteId=${gerenteId}` : ''}`)

// ── Pedidos (Historial de compras) ────────────────────────────────────────────
export const getPedidos = (clienteId) => req(`/pedidos?clienteId=${clienteId}`)
export const createPedido = (data) => req('/pedidos', { method: 'POST', body: JSON.stringify(data) })
export const deletePedido = (id) => req(`/pedidos/${id}`, { method: 'DELETE' })
export const getAlertasS1 = (vendedorId = 1) => req(`/pedidos/alertas/${vendedorId}`)

// ── Llamadas ──────────────────────────────────────────────────────────────────
export const getLlamadasHoy = (gerenteId) => req(`/llamadas/today${gerenteId ? `?gerenteId=${gerenteId}` : ''}`)
export const getLlamadasByCliente = (clienteId) => req(`/llamadas?clienteId=${clienteId}`)
export const createLlamada = (data) => req('/llamadas', { method: 'POST', body: JSON.stringify(data) })

// ── Cotizaciones ──────────────────────────────────────────────────────────────
export const getCotizaciones = (gerenteId) => req(`/cotizaciones${gerenteId ? `?gerenteId=${gerenteId}` : ''}`)
export const createCotizacion = (data) => req('/cotizaciones', { method: 'POST', body: JSON.stringify(data) })
export const logF1 = (id, fechaDecisionF1) =>
  req(`/cotizaciones/${id}/f1`, { method: 'PUT', body: JSON.stringify({ fechaDecisionF1 }) })
export const logF2 = (id) =>
  req(`/cotizaciones/${id}/f2`, { method: 'PUT' })
export const closeCotizacion = (id, estado) =>
  req(`/cotizaciones/${id}/close`, { method: 'PUT', body: JSON.stringify({ estado }) })
export const deleteCotizacion = (id) => req(`/cotizaciones/${id}`, { method: 'DELETE' })

// ── Dashboard Metrics ─────────────────────────────────────────────────────────
export const getDashboardMetrics = (gerenteId) => req(`/dashboard/metrics${gerenteId ? `?gerenteId=${gerenteId}` : ''}`)
export const getDashboardActivity = (gerenteId, range = 'all') =>
  req(`/dashboard/activity?gerenteId=${gerenteId}&range=${range}`)

export const getDailyMeeting = (gerenteId) => req(`/daily-meeting${gerenteId ? '?gerenteId=' + gerenteId : ''}`)

// ── Reunión Diaria de 20 minutos (Gerente) ────────────────────────────────────
// ── Ranking de vendedores (reunión diaria) ────────────────────────────────────
export const getRanking = () => req('/vendedores/ranking')

// ── Agenda del día (cola de tareas por vendedor) ──────────────────────────────
export const getAgenda = (vendedorId = 1) => req(`/agenda/${vendedorId}`)

// ── Configuración Operacional (Fórmula Máxima) ────────────────────────────────
export const getConfig = () => req('/config')
export const saveConfig = (data) => req('/config', { method: 'PUT', body: JSON.stringify(data) })

// ── Auditoría ─────────────────────────────────────────────────────────────────
export const getAuditorias = () => req('/auditoria')
export const createAuditoria = (data) => req('/auditoria', { method: 'POST', body: JSON.stringify(data) })

// ── Certificaciones de Roleplay & Exámenes ────────────────────────────────────
export const getVendedor = (id) => req(`/vendedores/${id}`)
export const habilitarExamen = (id) => req(`/vendedores/${id}/examen/habilitar`, { method: 'PUT' })
export const submitExamen = (id, respuestas) => req(`/vendedores/${id}/examen/submit`, { method: 'PUT', body: JSON.stringify({ respuestas }) })
export const certificarVendedor = (id, data) => req(`/vendedores/${id}/certificacion`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteVendedor = (id) => req(`/vendedores/${id}`, { method: 'DELETE' })
export const updateVendedor = (id, data) => req(`/vendedores/${id}`, { method: 'PUT', body: JSON.stringify(data) })

// ── SuperAdmin: Gestión de Gerentes ───────────────────────────────────────────
export const getGerentes = () => req('/admin/gerentes')
export const createGerente = (data) => req('/admin/gerentes', { method: 'POST', body: JSON.stringify(data) })
export const deleteGerente = (id) => req(`/admin/gerentes/${id}`, { method: 'DELETE' })
export const getVendedoresByGerente = (gerenteId) => req(`/admin/gerentes/${gerenteId}/vendedores`)
export const createVendedorPorGerente = (gerenteId, data) => req(`/admin/gerentes/${gerenteId}/vendedores`, { method: 'POST', body: JSON.stringify(data) })

