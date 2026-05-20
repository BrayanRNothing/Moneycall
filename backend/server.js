import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const app = express()
const PORT = process.env.PORT || 5000
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

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
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const vendedores = await prisma.vendedor.findMany({
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
    const filter = vendedorId ? { vendedorId: parseInt(vendedorId) } : {}
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const llamadas = await prisma.llamada.findMany({
      where: { fechaHora: { gte: today } },
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
  const { clienteId, tipoLlamada, direccion, satisfaccionDc, comentarios } = req.body
  try {
    const l = await prisma.llamada.create({
      data: {
        clienteId: parseInt(clienteId),
        tipoLlamada,
        direccion: direccion || (tipoLlamada === 'IN' ? 'Entrante' : 'Saliente'),
        satisfaccionDc: satisfaccionDc !== undefined ? satisfaccionDc : true,
        comentarios
      },
      include: { cliente: { select: { nombreEmpresa: true } } }
    })
    res.json(l)
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
    const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30)

    const clientes = await prisma.cliente.findMany({
      where: { vendedorId },
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
    const data = await prisma.cotizacion.findMany({
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
    const today = new Date(); today.setHours(0, 0, 0, 0)

    // Llamadas hoy
    const llamadasHoy = await prisma.llamada.findMany({ where: { fechaHora: { gte: today } } })
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
    const cotizaciones = await prisma.cotizacion.findMany()
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

    const gerenteScore = cfg.gerenteCalificado ? 100 : 50
    const vendScore = cfg.totalVendedores > 0
      ? Math.round((cfg.vendedoresCertificados / cfg.totalVendedores) * 100)
      : 0
    const estructura = Math.round(gerenteScore * 0.7 + vendScore * 0.3)
    const sistema = totalHoy > 0 ? Math.round(ratioSaliente * 0.4 + numRatio * 0.3 + importRatio * 0.3) : 89
    const operaciones = Math.round(cfg.otd * 0.9 + ((cfg.ar + (cfg.csr / 5 * 100) + cfg.idScore) / 3) * 0.1)
    const maxSales = Math.round((estructura * sistema * operaciones) / 10000)

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
        tareas.push({ prioridad: 1, tipo: 'F2', cliente: c.nombreEmpresa, clienteId: c.id, razon: `${f2Hoy.length} cotización(es) con fecha de decisión vencida. ¡Llamar ahora!`, cotizacionId: f2Hoy[0].id })
      }
      // Sin F1 — URGENTE
      if (sinF1.length > 0) {
        tareas.push({ prioridad: 1, tipo: 'F1', cliente: c.nombreEmpresa, clienteId: c.id, razon: `${sinF1.length} cotización(es) enviadas sin seguimiento F1. Meta: 100%.`, cotizacionId: sinF1[0].id })
      }
      // RC listo (10 DCs satisfactorias)
      if (dcsSatisfechas >= 10 && !c.llamadas.some(l => l.tipoLlamada === 'RC')) {
        tareas.push({ prioridad: 2, tipo: 'RC', cliente: c.nombreEmpresa, clienteId: c.id, razon: `¡${dcsSatisfechas} DCs perfectas! Pedir testimonio. Iniciar con Plan A.` })
      }
      // PT trimestral (más de 90 días sin PT)
      if (!ultimaPT || new Date(ultimaPT.fechaHora) < hace90) {
        const diasSinPT = ultimaPT ? Math.round((Date.now() - new Date(ultimaPT.fechaHora)) / 86400000) : 999
        tareas.push({ prioridad: 3, tipo: 'PT', cliente: c.nombreEmpresa, clienteId: c.id, razon: `${diasSinPT === 999 ? 'Nunca ha tenido' : `Hace ${diasSinPT} días`} una llamada personal. Meta: 1 PT/trimestre.` })
      }
      // S1 — sin llamada esta semana
      if (!ultimaLlamada || new Date(ultimaLlamada.fechaHora) < hace7) {
        const diasSin = ultimaLlamada ? Math.round((Date.now() - new Date(ultimaLlamada.fechaHora)) / 86400000) : 999
        tareas.push({ prioridad: 4, tipo: 'S1', cliente: c.nombreEmpresa, clienteId: c.id, razon: `Sin contacto hace ${diasSin === 999 ? 'siempre' : diasSin + ' días'}. Revisar historial de pedidos.` })
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

app.listen(PORT, () => console.log(`🚀 Moneycall CRM Backend running on port ${PORT}`))

