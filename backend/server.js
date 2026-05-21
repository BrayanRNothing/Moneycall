// Moneycall CRM Backend — v1.1.1
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const app = express()
const PORT = process.env.PORT || 5000
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Bootstrap: crear usuario admin por defecto si la tabla de vendedores está vacía
async function ensureAdminUser() {
  try {
    const total = await prisma.vendedor.count()
    if (total === 0) {
      const user = process.env.ADMIN_USER || 'admin'
      const pass = process.env.ADMIN_PASS || '123456'
      const v = await prisma.vendedor.create({
        data: { nombre: 'Administrador', username: user, password: pass, isSuperAdmin: true, isAdmin: true }
      })
      console.log('Bootstrap admin creado:', user)
    }
  } catch (e) {
    console.error('Error al asegurar admin:', e.message)
  }
}

ensureAdminUser()

async function resolveVendorScope({ vendedorId, gerenteId } = {}) {
  const rawId = gerenteId ?? vendedorId
  const rootId = rawId ? parseInt(rawId) : null
  if (!Number.isFinite(rootId)) return null

  const root = await prisma.vendedor.findUnique({
    where: { id: rootId },
    select: { id: true, isAdmin: true, isSuperAdmin: true }
  })

  if (!root) return []

  if (root.isSuperAdmin) return null

  const shouldScopeToTeam = gerenteId !== undefined || (root.isAdmin && !root.isSuperAdmin)
  if (!shouldScopeToTeam) return [rootId]

  const team = await prisma.vendedor.findMany({
    where: { OR: [{ id: rootId }, { gerenteId: rootId }] },
    select: { id: true }
  })

  return team.map(v => v.id)
}
// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Moneycall CRM API running' })
})

// ── 1. VENDEDORES ─────────────────────────────────────────────────────────────
app.get('/api/vendedores', async (req, res) => {
  try {
    const data = await prisma.vendedor.findMany({ include: { _count: { select: { clientes: true } } } })
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/vendedores', async (req, res) => {
  const { nombre, username, password, isAdmin, rolCanal } = req.body
  try {
    const v = await prisma.vendedor.create({ 
      data: { 
        nombre, 
        username, 
        password: password || '123456',
        isAdmin: isAdmin || false,
        rolCanal: rolCanal || 'Moneycall' 
      } 
    })
    res.json(v)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const v = await prisma.vendedor.findUnique({ where: { username } })
    if (!v || v.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }
    // Return user without password
    const { password: _, ...user } = v
    res.json({ token: 'fake-jwt-token-123', user })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 7. RANKING DE VENDEDORES (Reunión diaria 20 min) ─────────────────────────
app.get('/api/vendedores/ranking', async (req, res) => {
  try {
    const { gerenteId } = req.query
    const scopeIds = await resolveVendorScope({ gerenteId })
    const teamWhere = Array.isArray(scopeIds)
      ? { id: { in: scopeIds.length ? scopeIds : [-1] } }
      : {}

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const vendedores = await prisma.vendedor.findMany({
      where: teamWhere,
      include: {
        clientes: {
          include: {
            llamadas: true,
            cotizaciones: true
          }
        }
      }
    })

    const ranking = vendedores.map(v => {
      const llamadasHoy = v.clientes.flatMap(c => c.llamadas).filter(l => new Date(l.fechaHora) >= today)
      const todasLlamadas = v.clientes.flatMap(c => c.llamadas)
      const todasCotiz = v.clientes.flatMap(c => c.cotizaciones)

      const salHoy = llamadasHoy.filter(l => l.direccion === 'Saliente').length
      const entHoy = llamadasHoy.filter(l => l.direccion === 'Entrante').length
      const s1Hoy = llamadasHoy.filter(l => l.tipoLlamada === 'S1').length
      const s2Hoy = llamadasHoy.filter(l => l.tipoLlamada === 'S2').length
      const dcHoy = llamadasHoy.filter(l => l.tipoLlamada === 'DC').length
      const f1Hoy = llamadasHoy.filter(l => l.tipoLlamada === 'F1').length

      const cerradas = todasCotiz.filter(c => c.estado !== 'Pendiente')
      const ganadas = todasCotiz.filter(c => c.estado === 'Ganada')
      const ratioNum = cerradas.length > 0 ? Math.round((ganadas.length / cerradas.length) * 100) : 0

      const f1Pct = todasCotiz.length > 0 ? Math.round((todasCotiz.filter(c => c.seguimientoF1).length / todasCotiz.length) * 100) : 0

      return {
        id: v.id,
        nombre: v.nombre,
        rolCanal: v.rolCanal,
        cuentas: v.clientes.length,
        hoy: { salientes: salHoy, entrantes: entHoy, s1: s1Hoy, s2: s2Hoy, dc: dcHoy, f1: f1Hoy, total: llamadasHoy.length },
        ratioNum,
        f1Pct,
        cotizaciones: todasCotiz.length,
        ganadas: ganadas.length,
        score: salHoy * 3 + ratioNum + f1Pct // score para ordenar ranking
      }
    }).sort((a, b) => b.score - a.score)

    res.json(ranking)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/vendedores/:id', async (req, res) => {
  const { id } = req.params
  try {
    const v = await prisma.vendedor.findUnique({ where: { id: parseInt(id) } })
    if (!v) return res.status(404).json({ error: 'Vendedor no encontrado' })
    const { password: _, ...user } = v
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/vendedores/:id/examen/habilitar', async (req, res) => {
  const { id } = req.params
  try {
    const current = await prisma.vendedor.findUnique({ where: { id: parseInt(id) } })
    if (!current) return res.status(404).json({ error: 'Vendedor no encontrado' })
    const cert = current.certificaciones ? (typeof current.certificaciones === 'string' ? JSON.parse(current.certificaciones) : current.certificaciones) : {}
    
    const v = await prisma.vendedor.update({
      where: { id: parseInt(id) },
      data: {
        certificaciones: {
          ...cert,
          examenEstado: 'habilitado',
          examenHabilitado: true,
          examenRespuestas: null
        }
      }
    })
    const { password: _, ...user } = v
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/vendedores/:id/examen/submit', async (req, res) => {
  const { id } = req.params
  const { respuestas } = req.body
  try {
    const current = await prisma.vendedor.findUnique({ where: { id: parseInt(id) } })
    if (!current) return res.status(404).json({ error: 'Vendedor no encontrado' })
    const cert = current.certificaciones ? (typeof current.certificaciones === 'string' ? JSON.parse(current.certificaciones) : current.certificaciones) : {}
    
    const v = await prisma.vendedor.update({
      where: { id: parseInt(id) },
      data: {
        certificaciones: {
          ...cert,
          examenEstado: 'respondido',
          examenRespuestas: respuestas,
          fechaEnvioExamen: new Date().toISOString()
        }
      }
    })
    const { password: _, ...user } = v
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/vendedores/:id/certificacion', async (req, res) => {
  const { id } = req.params
  const { roleplayScore, aprobado, observaciones } = req.body
  try {
    const current = await prisma.vendedor.findUnique({ where: { id: parseInt(id) } })
    if (!current) return res.status(404).json({ error: 'Vendedor no encontrado' })
    const cert = current.certificaciones ? (typeof current.certificaciones === 'string' ? JSON.parse(current.certificaciones) : current.certificaciones) : {}

    const v = await prisma.vendedor.update({
      where: { id: parseInt(id) },
      data: { 
        certificaciones: { 
          ...cert,
          roleplayScore, 
          aprobado, 
          observaciones, 
          examenEstado: 'calificado',
          fecha: new Date().toISOString() 
        } 
      }
    })

    // Auto-Sync: Recalcular contadores globales en la tabla de configuración
    const totalVendedores = await prisma.vendedor.count()
    const vendedoresList = await prisma.vendedor.findMany()
    const vendedoresCertificados = vendedoresList.filter(x => {
      const certObj = x.certificaciones ? (typeof x.certificaciones === 'string' ? JSON.parse(x.certificaciones) : x.certificaciones) : {}
      return certObj.aprobado && certObj.roleplayScore >= 80
    }).length

    await prisma.configuracion.upsert({
      where: { id: 1 },
      update: { totalVendedores, vendedoresCertificados },
      create: { id: 1, totalVendedores, vendedoresCertificados }
    })

    const { password: _, ...user } = v
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── SUPERADMIN: Gestión de Gerentes ───────────────────────────────────────────

// Listar todos los gerentes (con conteo de vendedores a cargo)
app.get('/api/admin/gerentes', async (req, res) => {
  try {
    const gerentes = await prisma.vendedor.findMany({
      where: { isAdmin: true },
      include: {
        vendedoresACargo: {
          select: { id: true, nombre: true, rolCanal: true, username: true, certificaciones: true }
        },
        _count: { select: { clientes: true } }
      }
    })
    const result = gerentes.map(({ password: _, ...g }) => g)
    res.json(result)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Crear nuevo gerente
app.post('/api/admin/gerentes', async (req, res) => {
  const { nombre, username, password, rolCanal } = req.body
  try {
    const v = await prisma.vendedor.create({
      data: {
        nombre,
        username,
        password: password || '123456',
        isAdmin: true,
        isSuperAdmin: false,
        rolCanal: rolCanal || 'Gerencia'
      }
    })
    const { password: _, ...user } = v
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Eliminar gerente (y desasociar sus vendedores, no los elimina)
app.delete('/api/admin/gerentes/:id', async (req, res) => {
  const { id } = req.params
  try {
    // Desasociar vendedores que apuntaban a este gerente
    await prisma.vendedor.updateMany({
      where: { gerenteId: parseInt(id) },
      data: { gerenteId: null }
    })
    await prisma.vendedor.delete({ where: { id: parseInt(id) } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Ver vendedores de un gerente específico
app.get('/api/admin/gerentes/:id/vendedores', async (req, res) => {
  const { id } = req.params
  try {
    const vendedores = await prisma.vendedor.findMany({
      where: { gerenteId: parseInt(id), isAdmin: false, isSuperAdmin: false }
    })
    const result = vendedores.map(({ password: _, ...v }) => v)
    res.json(result)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Crear vendedor bajo un gerente
app.post('/api/admin/gerentes/:id/vendedores', async (req, res) => {
  const { id } = req.params
  const { nombre, username, password, rolCanal } = req.body
  try {
    const v = await prisma.vendedor.create({
      data: {
        nombre,
        username,
        password: password || '123456',
        isAdmin: false,
        isSuperAdmin: false,
        rolCanal: rolCanal || 'Moneycall',
        gerenteId: parseInt(id)
      }
    })
    const { password: _, ...user } = v
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Eliminar vendedor
app.delete('/api/vendedores/:id', async (req, res) => {
  const { id } = req.params
  try {
    await prisma.vendedor.delete({ where: { id: parseInt(id) } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Editar vendedor (nombre, username, password, rolCanal, isSuperAdmin, isAdmin)
app.put('/api/vendedores/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, username, password, rolCanal, gerenteId, isSuperAdmin, isAdmin } = req.body
  try {
    const data = {}
    if (nombre !== undefined) data.nombre = nombre
    if (username !== undefined) data.username = username
    if (password !== undefined) data.password = password
    if (rolCanal !== undefined) data.rolCanal = rolCanal
    if (gerenteId !== undefined) data.gerenteId = gerenteId ? parseInt(gerenteId) : null
    if (isSuperAdmin !== undefined) data.isSuperAdmin = isSuperAdmin
    if (isAdmin !== undefined) data.isAdmin = isAdmin
    const v = await prisma.vendedor.update({ where: { id: parseInt(id) }, data })
    const { password: _, ...user } = v
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 2. CLIENTES ───────────────────────────────────────────────────────────────

app.get('/api/clientes', async (req, res) => {
  try {
    const { vendedorId } = req.query
    const scopeIds = await resolveVendorScope({ vendedorId })
    const filter = Array.isArray(scopeIds)
      ? { vendedorId: { in: scopeIds.length ? scopeIds : [-1] } }
      : {}
    const clientes = await prisma.cliente.findMany({
      where: filter,
      include: {
        _count: { select: { llamadas: true, cotizaciones: true } },
        llamadas: { select: { tipoLlamada: true, satisfaccionDc: true }, orderBy: { fechaHora: 'desc' } },
        cotizaciones: { select: { estado: true, monto: true } }
      },
      orderBy: { nombreEmpresa: 'asc' }
    })
    // Enriquecer con conteos por tipo y satisfacciones DC
    const enriched = clientes.map(c => ({
      ...c,
      callCounts: c.llamadas.reduce((acc, l) => {
        acc[l.tipoLlamada] = (acc[l.tipoLlamada] || 0) + 1
        return acc
      }, {}),
      satisfiedDcs: c.llamadas.filter(l => l.tipoLlamada === 'DC' && l.satisfaccionDc).length,
      totalCompras: c.cotizaciones.filter(q => q.estado === 'Ganada').reduce((s, q) => s + q.monto, 0)
    }))
    res.json(enriched)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/clientes', async (req, res) => {
  const { vendedorId, nombreEmpresa, contactoPrincipal, telefono, segmentoPareto } = req.body
  try {
    const vId = parseInt(vendedorId)
    // Validar límite de clientes (Regla de oro: 100 por vendedor Moneycall)
    const count = await prisma.cliente.count({ where: { vendedorId: vId } })
    const vendedor = await prisma.vendedor.findUnique({ where: { id: vId } })
    if (count >= (vendedor?.limiteCuentas || 100)) {
      return res.status(400).json({ error: `El vendedor ha alcanzado su límite estricto de ${vendedor.limiteCuentas} clientes.` })
    }

    const c = await prisma.cliente.create({
      data: { vendedorId: vId, nombreEmpresa, contactoPrincipal, telefono, segmentoPareto: segmentoPareto || 'Marginal 80%' }
    })
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// 5 Preguntas Clave
app.put('/api/clientes/:id/questions', async (req, res) => {
  const { respuestas5Q } = req.body
  try {
    const c = await prisma.cliente.update({
      where: { id: parseInt(req.params.id) },
      data: { respuestas5Q }
    })
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Recalcular Pareto 80/20 para un vendedor dado
app.post('/api/clientes/pareto/:vendedorId', async (req, res) => {
  const vendedorId = parseInt(req.params.vendedorId)
  try {
    const clientes = await prisma.cliente.findMany({
      where: { vendedorId },
      include: { cotizaciones: { where: { estado: 'Ganada' }, select: { monto: true } } }
    })
    // Ordenar por total de compras desc
    const sorted = clientes
      .map(c => ({ id: c.id, total: c.cotizaciones.reduce((s, q) => s + q.monto, 0) }))
      .sort((a, b) => b.total - a.total)

    const totalGlobal = sorted.reduce((s, c) => s + c.total, 0)
    let acum = 0
    for (const c of sorted) {
      acum += c.total
      const segmento = acum / totalGlobal <= 0.8 ? 'Top 20%' : 'Marginal 80%'
      await prisma.cliente.update({ where: { id: c.id }, data: { segmentoPareto: segmento } })
    }
    res.json({ ok: true, updated: sorted.length })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 3. LLAMADAS ───────────────────────────────────────────────────────────────
// Llamadas de hoy (para el logger del día)
app.get('/api/llamadas/today', async (req, res) => {
  try {
    const { gerenteId } = req.query
    const scopeIds = await resolveVendorScope({ gerenteId })
    const teamWhere = Array.isArray(scopeIds)
      ? { cliente: { vendedorId: { in: scopeIds.length ? scopeIds : [-1] } } }
      : {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const llamadas = await prisma.llamada.findMany({
      where: { fechaHora: { gte: today }, ...teamWhere },
      include: { cliente: { select: { nombreEmpresa: true } } },
      orderBy: { fechaHora: 'desc' }
    })
    res.json(llamadas)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/llamadas', async (req, res) => {
  try {
    const { clienteId } = req.query
    const filter = clienteId ? { clienteId: parseInt(clienteId) } : {}
    const data = await prisma.llamada.findMany({
      where: filter,
      include: { cliente: { select: { nombreEmpresa: true } } },
      orderBy: { fechaHora: 'desc' }
    })
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/llamadas', async (req, res) => {
  const { clienteId, tipoLlamada, direccion, satisfaccionDc, comentarios, respuestas5Q, proximaAccion, proximaFecha } = req.body
  try {
    const l = await prisma.llamada.create({
      data: {
        clienteId: parseInt(clienteId),
        tipoLlamada,
        direccion: direccion || (tipoLlamada === 'IN' ? 'Entrante' : 'Saliente'),
        satisfaccionDc: satisfaccionDc !== undefined ? satisfaccionDc : true,
        comentarios,
        proximaAccion: proximaAccion || null,
        proximaFecha: proximaFecha ? new Date(proximaFecha) : null
      },
      include: { cliente: { select: { nombreEmpresa: true } } }
    })

    // Si la llamada incluye respuestas a las 5/6 preguntas, guardarlas en el cliente
    if (respuestas5Q) {
      try {
        const updateData = { respuestas5Q }
        // Si Q3 tiene valor numérico, guardar cuota de mercado
        if (respuestas5Q.q3) {
          const match = String(respuestas5Q.q3).match(/(\d+)/)
          if (match) updateData.cuotaMercado = parseInt(match[1])
        }
        await prisma.cliente.update({ where: { id: parseInt(clienteId) }, data: updateData })
      } catch (err) {
        console.warn('No se pudo actualizar respuestas5Q en cliente:', err.message)
      }
    }

    // Si es una llamada DC, actualizar contador de DCs satisfactorias y plan de testimonios
    if (tipoLlamada === 'DC') {
      try {
        const cliente = await prisma.cliente.findUnique({ where: { id: parseInt(clienteId) } })
        if (cliente) {
          const esSatisfactoria = satisfaccionDc !== undefined ? satisfaccionDc : true
          let nuevoCont = esSatisfactoria ? cliente.dcSatisfactoriasCount + 1 : 0 // reset si no satisfactoria
          
          // Actualizar plan de testimonios según reglas del libro
          let nuevoPlan = cliente.planTestimonio
          if (esSatisfactoria) {
            if (nuevoCont >= 10 && cliente.planTestimonio === 'A') nuevoPlan = 'A' // mantiene A, agenda RC
            if (nuevoCont >= 15 && cliente.planTestimonio === 'B') nuevoPlan = 'C'
          }

          // Recalcular ventas anuales
          const hace365 = new Date(); hace365.setDate(hace365.getDate() - 365)
          const cotGanadas = await prisma.cotizacion.findMany({
            where: { clienteId: parseInt(clienteId), estado: 'Ganada', fechaCreacion: { gte: hace365 } }
          })
          const ventasAnuales = cotGanadas.reduce((s, c) => s + c.monto, 0)

          await prisma.cliente.update({
            where: { id: parseInt(clienteId) },
            data: { dcSatisfactoriasCount: nuevoCont, planTestimonio: nuevoPlan, ventasAnuales }
          })
        }
      } catch (err) {
        console.warn('No se pudo actualizar DC count:', err.message)
      }
    }
    res.json(l)
  } catch (e) { res.status(500).json({ error: e.message }) }
})



// Pareto global: devuelve clientes ordenados por total de compras (desc)
app.get('/api/clientes/pareto_global', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({ include: { cotizaciones: true, vendedor: true } })
    const sorted = clientes
      .map(c => ({ id: c.id, nombreEmpresa: c.nombreEmpresa, vendedorId: c.vendedorId, total: c.cotizaciones.filter(q => q.estado === 'Ganada').reduce((s, q) => s + q.monto, 0) }))
      .sort((a, b) => b.total - a.total)
    res.json(sorted)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Asignar batch de clientes a un vendedor (respeta limite de cuentas)
app.post('/api/clientes/assign/:vendedorId', async (req, res) => {
  const { vendedorId } = req.params
  const { clientIds } = req.body // array de ids
  try {
    const vId = parseInt(vendedorId)
    const vendedor = await prisma.vendedor.findUnique({ where: { id: vId } })
    if (!vendedor) return res.status(404).json({ error: 'Vendedor no encontrado' })

    const currentCount = await prisma.cliente.count({ where: { vendedorId: vId } })
    const remaining = (vendedor.limiteCuentas || 100) - currentCount
    if (clientIds.length > remaining) return res.status(400).json({ error: `El vendedor sólo puede recibir ${remaining} clientes más` })

    const updated = []
    for (const cid of clientIds) {
      const c = await prisma.cliente.update({ where: { id: parseInt(cid) }, data: { vendedorId: vId } })
      updated.push(c)
    }
    res.json({ ok: true, assigned: updated.length, clientes: updated.map(x => ({ id: x.id, nombreEmpresa: x.nombreEmpresa })) })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 4. PEDIDOS (Historial de Compras — base de alertas S1) ───────────────────
app.get('/api/pedidos', async (req, res) => {
  try {
    const { clienteId } = req.query
    const filter = clienteId ? { clienteId: parseInt(clienteId) } : {}
    const data = await prisma.pedido.findMany({
      where: filter,
      include: { cliente: { select: { nombreEmpresa: true } } },
      orderBy: { fechaPedido: 'desc' }
    })
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/pedidos', async (req, res) => {
  const { clienteId, producto, categoria, cantidad, unidad, monto, notas } = req.body
  try {
    const p = await prisma.pedido.create({
      data: {
        clienteId: parseInt(clienteId),
        producto,
        categoria: categoria || 'General',
        cantidad: parseFloat(cantidad),
        unidad: unidad || 'unidad',
        monto: parseFloat(monto),
        notas
      },
      include: { cliente: { select: { nombreEmpresa: true } } }
    })
    res.json(p)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    await prisma.pedido.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Análisis S1 real: productos con inactividad por cliente
app.get('/api/pedidos/alertas/:vendedorId', async (req, res) => {
  try {
    const vendedorId = parseInt(req.params.vendedorId)
    const scopeIds = await resolveVendorScope({ vendedorId })
    const teamWhere = Array.isArray(scopeIds)
      ? { vendedorId: { in: scopeIds.length ? scopeIds : [-1] } }
      : { vendedorId }

    const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30)

    const clientes = await prisma.cliente.findMany({
      where: teamWhere,
      include: {
        pedidos: { orderBy: { fechaPedido: 'desc' } }
      }
    })

    const alertas = []

    for (const c of clientes) {
      if (c.pedidos.length === 0) continue

      // Agrupar por producto y detectar inactividad
      const productoMap = {}
      for (const p of c.pedidos) {
        if (!productoMap[p.producto]) productoMap[p.producto] = []
        productoMap[p.producto].push(p)
      }

      for (const [producto, historial] of Object.entries(productoMap)) {
        if (historial.length < 2) continue // necesita historial para detectar patrón

        const ultimo = historial[0]
        const diasDesdeUltimo = Math.round((Date.now() - new Date(ultimo.fechaPedido)) / 86400000)

        // Calcular frecuencia promedio
        const fechas = historial.map(p => new Date(p.fechaPedido)).sort((a,b) => b-a)
        let sumDias = 0
        for (let i = 0; i < fechas.length - 1; i++) {
          sumDias += (fechas[i] - fechas[i+1]) / 86400000
        }
        const frecuenciaPromedio = Math.round(sumDias / (fechas.length - 1))

        // Alerta si lleva más del 150% del tiempo normal sin comprar
        if (diasDesdeUltimo > frecuenciaPromedio * 1.5 && frecuenciaPromedio > 0) {
          alertas.push({
            tipo: 'S1',
            cliente: c.nombreEmpresa,
            clienteId: c.id,
            producto,
            diasDesdeUltimo,
            frecuenciaPromedio,
            ultimaCantidad: ultimo.cantidad,
            ultimaUnidad: ultimo.unidad,
            razon: `Solía comprar "${producto}" cada ${frecuenciaPromedio} días. Lleva ${diasDesdeUltimo} días sin comprar.`
          })
        }
      }
    }

    res.json(alertas.sort((a, b) => b.diasDesdeUltimo - a.diasDesdeUltimo))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 5. COTIZACIONES ───────────────────────────────────────────────────────────
app.get('/api/cotizaciones', async (req, res) => {
  try {
    const { gerenteId } = req.query
    const scopeIds = await resolveVendorScope({ gerenteId })
    const teamWhere = Array.isArray(scopeIds)
      ? { cliente: { vendedorId: { in: scopeIds.length ? scopeIds : [-1] } } }
      : {}
    const data = await prisma.cotizacion.findMany({
      where: teamWhere,
      include: { cliente: { select: { nombreEmpresa: true, vendedorId: true } } },
      orderBy: { fechaCreacion: 'desc' }
    })
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/cotizaciones', async (req, res) => {
  const { clienteId, monto } = req.body
  try {
    const c = await prisma.cotizacion.create({
      data: { clienteId: parseInt(clienteId), monto: parseFloat(monto) },
      include: { cliente: { select: { nombreEmpresa: true } } }
    })

    // Automatizar creación de seguimiento F1 programado (por defecto 3 días)
    try {
      const fechaF1 = new Date(); fechaF1.setDate(fechaF1.getDate() + 3)
      await prisma.llamada.create({
        data: {
          clienteId: parseInt(clienteId),
          tipoLlamada: 'F1',
          direccion: 'Saliente',
          comentarios: `Seguimiento automático F1 para cotización ${c.id}`,
          proximaAccion: 'F1',
          proximaFecha: fechaF1
        }
      })
    } catch (err) {
      console.warn('No se pudo crear seguimiento F1 automático:', err.message)
    }
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/cotizaciones/:id/f1', async (req, res) => {
  const { fechaDecisionF1 } = req.body
  try {
    const c = await prisma.cotizacion.update({
      where: { id: parseInt(req.params.id) },
      data: { seguimientoF1: true, fechaDecisionF1: new Date(fechaDecisionF1) }
    })
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/cotizaciones/:id/close', async (req, res) => {
  const { estado } = req.body // 'Ganada' | 'Perdida'
  try {
    const c = await prisma.cotizacion.update({
      where: { id: parseInt(req.params.id) },
      data: { seguimientoF2: true, estado }
    })
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/cotizaciones/:id', async (req, res) => {
  try {
    await prisma.cotizacion.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 5. CONFIGURACIÓN OPERACIONAL (Fórmula Máxima) ────────────────────────────
app.get('/api/config', async (req, res) => {
  try {
    let cfg = await prisma.configuracion.findUnique({ where: { id: 1 } })
    if (!cfg) cfg = await prisma.configuracion.create({ data: { id: 1 } })
    res.json(cfg)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/config', async (req, res) => {
  try {
    const data = req.body
    delete data.id // Evitar modificar el ID
    const cfg = await prisma.configuracion.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data }
    })
    res.json(cfg)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 6. DASHBOARD METRICS ──────────────────────────────────────────────────────
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const { gerenteId } = req.query
    const scopeIds = await resolveVendorScope({ gerenteId })
    const teamWhere = Array.isArray(scopeIds)
      ? { cliente: { vendedorId: { in: scopeIds.length ? scopeIds : [-1] } } }
      : {}

    const today = new Date(); today.setHours(0, 0, 0, 0)

    // Llamadas hoy
    const llamadasHoy = await prisma.llamada.findMany({ 
      where: { fechaHora: { gte: today }, ...teamWhere } 
    })
    const totalHoy = llamadasHoy.length
    const salientes = llamadasHoy.filter(l => l.direccion === 'Saliente').length
    const entrantes = llamadasHoy.filter(l => l.direccion === 'Entrante').length
    const ratioSaliente = totalHoy > 0 ? Math.round((salientes / totalHoy) * 100) : 0

    // Conteo por tipo hoy
    const tiposCounts = llamadasHoy.reduce((acc, l) => {
      acc[l.tipoLlamada] = (acc[l.tipoLlamada] || 0) + 1
      return acc
    }, {})

    // Ratios de cierre
    const cotizaciones = await prisma.cotizacion.findMany({ where: teamWhere })
    const cerradas = cotizaciones.filter(c => c.estado !== 'Pendiente')
    const ganadas = cotizaciones.filter(c => c.estado === 'Ganada')
    const numRatio = cerradas.length > 0 ? Math.round((ganadas.length / cerradas.length) * 100) : 0
    const totalAmt = cerradas.reduce((s, c) => s + c.monto, 0)
    const wonAmt = ganadas.reduce((s, c) => s + c.monto, 0)
    const importRatio = totalAmt > 0 ? Math.round((wonAmt / totalAmt) * 100) : 0

    // Cotizaciones pendientes sin F1 (alertas)
    const sinF1 = cotizaciones.filter(c => c.estado === 'Pendiente' && !c.seguimientoF1)

    // Fórmula Máxima
    let cfg = await prisma.configuracion.findUnique({ where: { id: 1 } })
    if (!cfg) cfg = await prisma.configuracion.create({ data: { id: 1 } })

    let totalVendedores = cfg.totalVendedores
    let vendedoresCertificados = cfg.vendedoresCertificados
    let gerenteCalificado = cfg.gerenteCalificado

    if (gerenteId) {
      const rootId = parseInt(gerenteId)
      totalVendedores = await prisma.vendedor.count({
        where: { gerenteId: rootId }
      })
      const teamVendedors = await prisma.vendedor.findMany({
        where: { gerenteId: rootId },
        select: { certificaciones: true }
      })
      vendedoresCertificados = teamVendedors.filter(v => {
        if (!v.certificaciones) return false
        try {
          const cert = typeof v.certificaciones === 'string' ? JSON.parse(v.certificaciones) : v.certificaciones
          return cert && cert.aprobado === true
        } catch {
          return false
        }
      }).length

      const gerenteUser = await prisma.vendedor.findUnique({
        where: { id: rootId },
        select: { certificaciones: true }
      })
      if (gerenteUser && gerenteUser.certificaciones) {
        try {
          const cert = typeof gerenteUser.certificaciones === 'string' ? JSON.parse(gerenteUser.certificaciones) : gerenteUser.certificaciones
          gerenteCalificado = cert && cert.aprobado === true
        } catch {
          gerenteCalificado = false
        }
      } else {
        gerenteCalificado = false
      }
    }

    let estructura = 0
    let sistema = 0
    let operaciones = 0
    let maxSales = 0

    if (totalVendedores > 0) {
      const gerenteScore = gerenteCalificado ? 100 : 50
      const vendScore = Math.round((vendedoresCertificados / totalVendedores) * 100)
      estructura = Math.round(gerenteScore * 0.7 + vendScore * 0.3)
      sistema = totalHoy > 0 ? Math.round(ratioSaliente * 0.4 + numRatio * 0.3 + importRatio * 0.3) : 0
      operaciones = Math.round(cfg.otd * 0.9 + ((cfg.ar + (cfg.csr / 5 * 100) + cfg.idScore) / 3) * 0.1)
      maxSales = Math.round((estructura + sistema + operaciones) / 3)
    }

    res.json({
      llamadasHoy: totalHoy,
      salientes, entrantes, ratioSaliente,
      tiposHoy: tiposCounts,
      closeRatios: { numRatio, importRatio, discrepancia: Math.abs(numRatio - importRatio) },
      cotizaciones: { total: cotizaciones.length, cerradas: cerradas.length, ganadas: ganadas.length, sinF1: sinF1.length },
      formula: { estructura, sistema, operaciones, maxSales, cfg }
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})



// ── 8. AGENDA DEL DÍA (Cola de tareas por vendedor) ──────────────────────────
app.get('/api/agenda/:vendedorId', async (req, res) => {
  try {
    const vendedorId = parseInt(req.params.vendedorId)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const hace90 = new Date(); hace90.setDate(hace90.getDate() - 90)
    const hace7 = new Date(); hace7.setDate(hace7.getDate() - 7)

    const clientes = await prisma.cliente.findMany({
      where: { vendedorId },
      include: {
        llamadas: { orderBy: { fechaHora: 'desc' } },
        cotizaciones: { orderBy: { fechaCreacion: 'desc' } }
      }
    })

    const tareas = []

    for (const c of clientes) {
      const ultimaLlamada = c.llamadas[0]
      const ultimaPT = c.llamadas.filter(l => l.tipoLlamada === 'PT').sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora))[0]
      const dcsSatisfechas = c.llamadas.filter(l => l.tipoLlamada === 'DC' && l.satisfaccionDc).length
      const cotizPendientes = c.cotizaciones.filter(q => q.estado === 'Pendiente')
      const sinF1 = cotizPendientes.filter(q => !q.seguimientoF1)
      const f2Hoy = cotizPendientes.filter(q => q.seguimientoF1 && !q.seguimientoF2 && q.fechaDecisionF1 && new Date(q.fechaDecisionF1) <= new Date())

      // F2 vencido — URGENTE
      if (f2Hoy.length > 0) {
        tareas.push({ prioridad: 1, tipo: 'F2', cliente: c.nombreEmpresa, clienteId: c.id, razon: `${f2Hoy.length} cotización(es) con fecha de decisión vencida. ¡Llamar ahora!`, cotizacionId: f2Hoy[0].id, contactoPreferencia: c.contactoPreferencia, contactoPrincipal: c.contactoPrincipal, planTestimonio: c.planTestimonio, dcSatisfactoriasCount: c.dcSatisfactoriasCount })
      }
      // Sin F1 — URGENTE
      if (sinF1.length > 0) {
        tareas.push({ prioridad: 1, tipo: 'F1', cliente: c.nombreEmpresa, clienteId: c.id, razon: `${sinF1.length} cotización(es) enviadas sin seguimiento F1. Meta: 100%.`, cotizacionId: sinF1[0].id, contactoPreferencia: c.contactoPreferencia, contactoPrincipal: c.contactoPrincipal, planTestimonio: c.planTestimonio, dcSatisfactoriasCount: c.dcSatisfactoriasCount })
      }
      // RC listo (10 DCs satisfactorias)
      if (dcsSatisfechas >= 10 && !c.llamadas.some(l => l.tipoLlamada === 'RC')) {
        tareas.push({ prioridad: 2, tipo: 'RC', cliente: c.nombreEmpresa, clienteId: c.id, razon: `¡${dcsSatisfechas} DCs perfectas! Pedir testimonio. Iniciar con Plan A.`, contactoPreferencia: c.contactoPreferencia, contactoPrincipal: c.contactoPrincipal, planTestimonio: c.planTestimonio, dcSatisfactoriasCount: c.dcSatisfactoriasCount })
      }
      // PT trimestral (más de 90 días sin PT)
      if (!ultimaPT || new Date(ultimaPT.fechaHora) < hace90) {
        const diasSinPT = ultimaPT ? Math.round((Date.now() - new Date(ultimaPT.fechaHora)) / 86400000) : 999
        tareas.push({ prioridad: 3, tipo: 'PT', cliente: c.nombreEmpresa, clienteId: c.id, razon: `${diasSinPT === 999 ? 'Nunca ha tenido' : `Hace ${diasSinPT} días`} una llamada personal. Meta: 1 PT/trimestre.`, contactoPreferencia: c.contactoPreferencia, contactoPrincipal: c.contactoPrincipal, planTestimonio: c.planTestimonio, dcSatisfactoriasCount: c.dcSatisfactoriasCount })
      }
      // S1 — sin llamada esta semana
      if (!ultimaLlamada || new Date(ultimaLlamada.fechaHora) < hace7) {
        const diasSin = ultimaLlamada ? Math.round((Date.now() - new Date(ultimaLlamada.fechaHora)) / 86400000) : 999
        tareas.push({ prioridad: 4, tipo: 'S1', cliente: c.nombreEmpresa, clienteId: c.id, razon: `Sin contacto hace ${diasSin === 999 ? 'siempre' : diasSin + ' días'}. Revisar historial de pedidos.`, contactoPreferencia: c.contactoPreferencia, contactoPrincipal: c.contactoPrincipal, planTestimonio: c.planTestimonio, dcSatisfactoriasCount: c.dcSatisfactoriasCount })
      }
    }

    // Ordenar por prioridad y limitar a 20
    const agenda = tareas.sort((a, b) => a.prioridad - b.prioridad).slice(0, 20)
    res.json(agenda)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── 9. AUDITORÍA DEL SUPERVISOR ──────────────────────────────────────────────
app.post('/api/auditoria', async (req, res) => {
  const { llamadaId, clienteId, gerenteId, esValida, comentarios } = req.body
  try {
    const a = await prisma.auditoria.create({
      data: {
        llamadaId: llamadaId ? parseInt(llamadaId) : null,
        clienteId: parseInt(clienteId),
        gerenteId: parseInt(gerenteId),
        esValida,
        comentarios
      }
    })
    res.json(a)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── AUTOMATIZACIONES: Procesar follow-ups (F1 vencidas → crear F2) ─────────
app.post('/api/automations/process-followups', async (req, res) => {
  try {
    const now = new Date()

    // 1) Cotizaciones con F1 programada ya (seguimientoF1=true) y fechaDecisionF1 pasada, sin F2 programada
    const vencidasF1 = await prisma.cotizacion.findMany({
      where: {
        estado: 'Pendiente',
        seguimientoF1: true,
        fechaDecisionF1: { lte: now },
        f2Programada: false
      },
      include: { cliente: true }
    })

    // 2) Cotizaciones sin F1 marcada pero antiguas (por ejemplo > 7 días) — opción conservadora
    const hace7 = new Date(); hace7.setDate(hace7.getDate() - 7)
    const antiguas = await prisma.cotizacion.findMany({
      where: {
        estado: 'Pendiente',
        seguimientoF1: false,
        fechaCreacion: { lte: hace7 },
        f2Programada: false
      },
      include: { cliente: true }
    })

    const todos = [...vencidasF1, ...antiguas]
    const created = []

    for (const cot of todos) {
      // Crear llamada F2 programada inmediatamente
      const l = await prisma.llamada.create({
        data: {
          clienteId: cot.clienteId,
          tipoLlamada: 'F2',
          direccion: 'Saliente',
          comentarios: `F2 automática para cotización ${cot.id}`
        }
      })

      // Marcar cotizacion como F2 programada para evitar duplicados
      await prisma.cotizacion.update({ where: { id: cot.id }, data: { f2Programada: true } })
      created.push({ cotizacionId: cot.id, clienteId: cot.clienteId, monto: cot.monto, llamadaId: l.id })

      // Regla de escalado: notificar gerente si monto > 10000
      if (cot.monto > 10000) {
        // Intentar crear una auditoría de notificación (si hay gerentes configurados, se deja en log)
        await prisma.auditoria.create({
          data: {
            clienteId: cot.clienteId,
            gerenteId: cot.cliente?.vendedorId || 1,
            esValida: false,
            comentarios: `Escalado automático: cotización ${cot.id} de $${cot.monto} requiere atención de gerente.`
          }
        })
      }
    }

    res.json({ ok: true, processed: created.length, details: created })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/auditoria', async (req, res) => {
  try {
    const data = await prisma.auditoria.findMany({
      include: { cliente: { select: { nombreEmpresa: true } }, gerente: { select: { nombre: true } } },
      orderBy: { fechaAuditoria: 'desc' },
      take: 50
    })
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})


// ── NUEVOS ENDPOINTS METODOLOGÍA MONEYCALL ────────────────────────────────────

// Reunión Diaria de 20 min: métricas del día ANTERIOR por vendedor (para gerente)
app.get('/api/daily-meeting', async (req, res) => {
  try {
    const { gerenteId } = req.query
    const scopeIds = await resolveVendorScope({ gerenteId })
    const teamWhere = Array.isArray(scopeIds)
      ? { id: { in: scopeIds.length ? scopeIds : [-1] } }
      : {}

    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1); ayer.setHours(0, 0, 0, 0)
    const finAyer = new Date(); finAyer.setHours(0, 0, 0, 0)

    const vendedores = await prisma.vendedor.findMany({
      where: { isAdmin: false, isSuperAdmin: false, ...teamWhere },
      include: {
        clientes: {
          include: {
            llamadas: { where: { fechaHora: { gte: ayer, lt: finAyer } } },
            cotizaciones: true
          }
        }
      }
    })

    const result = vendedores.map(v => {
      const llamadasAyer = v.clientes.flatMap(c => c.llamadas)
      const todasCotiz = v.clientes.flatMap(c => c.cotizaciones)

      const salientes = llamadasAyer.filter(l => l.direccion === 'Saliente').length
      const entrantes = llamadasAyer.filter(l => l.direccion === 'Entrante').length
      const s1 = llamadasAyer.filter(l => l.tipoLlamada === 'S1').length
      const s2 = llamadasAyer.filter(l => l.tipoLlamada === 'S2').length
      const dc = llamadasAyer.filter(l => l.tipoLlamada === 'DC').length
      const f1 = llamadasAyer.filter(l => l.tipoLlamada === 'F1').length
      const f2 = llamadasAyer.filter(l => l.tipoLlamada === 'F2').length
      const rc = llamadasAyer.filter(l => l.tipoLlamada === 'RC').length
      const pt = llamadasAyer.filter(l => l.tipoLlamada === 'PT').length

      const total = salientes + entrantes
      const proactividad = total > 0 ? Math.round((salientes / total) * 100) : 0

      const cotizAyer = v.clientes.flatMap(c =>
        c.cotizaciones.filter(q => { const f = new Date(q.fechaCreacion); return f >= ayer && f < finAyer })
      )

      const cerradas = todasCotiz.filter(c => c.estado !== 'Pendiente')
      const ganadas = todasCotiz.filter(c => c.estado === 'Ganada')
      const numRatio = cerradas.length > 0 ? Math.round((ganadas.length / cerradas.length) * 100) : 0
      const totalAmt = cerradas.reduce((s, c) => s + c.monto, 0)
      const wonAmt = ganadas.reduce((s, c) => s + c.monto, 0)
      const importRatio = totalAmt > 0 ? Math.round((wonAmt / totalAmt) * 100) : 0
      const discrepancia = Math.abs(numRatio - importRatio)

      const f1Pct = todasCotiz.length > 0
        ? Math.round((todasCotiz.filter(c => c.seguimientoF1).length / todasCotiz.length) * 100)
        : 0

      // Score de actividad: llamadas salientes ayer vs meta 20-30
      const metaCumplida = salientes >= 20
      const alertas = []
      if (proactividad < 80) alertas.push(`⚠ Proactividad ${proactividad}% < 80%`)
      if (salientes < 20) alertas.push(`📞 Solo ${salientes}/30 llamadas salientes`)
      if (discrepancia > 5) alertas.push(`📊 Discrepancia close ratio: ${discrepancia}pp > 5pp`)
      if (f1Pct < 100) alertas.push(`🔴 F1 en solo ${f1Pct}% de cotizaciones`)

      return {
        id: v.id,
        nombre: v.nombre,
        rolCanal: v.rolCanal,
        cuentas: v.clientes.length,
        ayer: { salientes, entrantes, s1, s2, dc, f1, f2, rc, pt, total, proactividad },
        cotizAyer: cotizAyer.length,
        closeRatios: { numRatio, importRatio, discrepancia },
        f1Pct,
        metaCumplida,
        alertas
      }
    }).sort((a, b) => b.ayer.salientes - a.ayer.salientes)

    res.json(result)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Sugerencias S1/S2 por cliente (cross-sell basado en historial de pedidos)
app.get('/api/clientes/:id/cross-sell', async (req, res) => {
  try {
    const clienteId = parseInt(req.params.id)
    const hace60 = new Date(); hace60.setDate(hace60.getDate() - 60)

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        pedidos: { orderBy: { fechaPedido: 'desc' } },
        vendedor: { include: { clientes: { include: { pedidos: true } } } }
      }
    })

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' })

    const pedidosCliente = cliente.pedidos
    const productosActivos = new Set(pedidosCliente.filter(p => new Date(p.fechaPedido) >= hace60).map(p => p.producto))
    const productosHistoricos = new Set(pedidosCliente.map(p => p.producto))

    // S1: productos que solía comprar pero no ha comprado en los últimos 60 días
    const sugerenciasS1 = []
    const productoMap = {}
    for (const p of pedidosCliente) {
      if (!productoMap[p.producto]) productoMap[p.producto] = []
      productoMap[p.producto].push(p)
    }
    for (const [prod, hist] of Object.entries(productoMap)) {
      const ultimo = hist[0]
      const diasDesde = Math.round((Date.now() - new Date(ultimo.fechaPedido)) / 86400000)
      if (diasDesde > 45) {
        sugerenciasS1.push({
          producto: prod,
          diasDesde,
          ultimaCantidad: ultimo.cantidad,
          guion: `Sr. cliente, solía comprarnos "${prod}" regularmente. Han pasado ${diasDesde} días desde su último pedido. ¿Necesita reabastecerse?`
        })
      }
    }

    // S2: productos que compran otros clientes del mismo vendedor junto con los del cliente actual
    const todosLosPedidos = cliente.vendedor.clientes
      .filter(c => c.id !== clienteId)
      .flatMap(c => c.pedidos)

    const coOcurrencias = {}
    // Encontrar qué productos suelen acompañar a los productos activos del cliente
    for (const prodActivo of productosActivos) {
      // Clientes que también compran este producto
      const clientesCoProd = cliente.vendedor.clientes.filter(c =>
        c.id !== clienteId && c.pedidos.some(p => p.producto === prodActivo)
      )
      // Qué otros productos compraron esos clientes
      const otrosProductos = clientesCoProd.flatMap(c => c.pedidos.map(p => p.producto))
        .filter(p => !productosHistoricos.has(p))
      for (const otroProd of otrosProductos) {
        coOcurrencias[otroProd] = (coOcurrencias[otroProd] || 0) + 1
      }
    }

    const sugerenciasS2 = Object.entries(coOcurrencias)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([producto, frecuencia]) => ({
        producto,
        frecuencia,
        guion: `Veo que usted compra [producto relacionado]. Muchos de nuestros clientes también llevan "${producto}" junto con ese pedido. ¿Alguna vez lo ha probado?`
      }))

    res.json({ s1: sugerenciasS1.slice(0, 5), s2: sugerenciasS2 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Actualizar preferencia de contacto de un cliente
app.put('/api/clientes/:id/preferencia', async (req, res) => {
  const { contactoPreferencia } = req.body
  try {
    const c = await prisma.cliente.update({
      where: { id: parseInt(req.params.id) },
      data: { contactoPreferencia }
    })
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Actualizar plan de testimonios de un cliente
app.put('/api/clientes/:id/plan-testimonio', async (req, res) => {
  const { planTestimonio } = req.body
  try {
    const c = await prisma.cliente.update({
      where: { id: parseInt(req.params.id) },
      data: { planTestimonio }
    })
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Clientes listos para upgrade a TM (ventas anuales > $60,000)
app.get('/api/clientes/tm-upgrade', async (req, res) => {
  try {
    const { gerenteId } = req.query
    const scopeIds = await resolveVendorScope({ gerenteId })
    const teamWhere = Array.isArray(scopeIds)
      ? { vendedorId: { in: scopeIds.length ? scopeIds : [-1] } }
      : {}

    const hace365 = new Date(); hace365.setDate(hace365.getDate() - 365)
    const clientes = await prisma.cliente.findMany({
      where: teamWhere,
      include: {
        cotizaciones: { where: { estado: 'Ganada', fechaCreacion: { gte: hace365 } } },
        vendedor: { select: { nombre: true } }
      }
    })

    const resultado = clientes
      .map(c => ({
        ...c,
        ventasAnuales: c.cotizaciones.reduce((s, q) => s + q.monto, 0)
      }))
      .filter(c => c.ventasAnuales >= 60000)
      .sort((a, b) => b.ventasAnuales - a.ventasAnuales)
      .map(c => ({
        id: c.id,
        nombreEmpresa: c.nombreEmpresa,
        contactoPrincipal: c.contactoPrincipal,
        ventasAnuales: c.ventasAnuales,
        vendedor: c.vendedor.nombre,
        segmentoPareto: c.segmentoPareto
      }))

    res.json(resultado)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.listen(PORT, () => console.log(`🚀 Moneycall CRM Backend running on port ${PORT}`))




