const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { db } = require('../config/database');
const { connectClient, disconnectClient, sendMessage, getSessionStatus } = require('../services/whatsappManager');

// POST /api/whatsapp/connect - Iniciar conexión
router.post('/connect', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    const io = req.app.get('io');
    try {
        connectClient(vendedorId, io);
        res.json({ mensaje: 'Conectando WhatsApp, escanee el código QR emitido' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/whatsapp/status - Obtener estado actual
router.get('/status', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    const status = getSessionStatus(vendedorId);
    res.json({ status });
});

// POST /api/whatsapp/disconnect - Cerrar sesión
router.post('/disconnect', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    try {
        await disconnectClient(vendedorId);
        res.json({ mensaje: 'Sesión de WhatsApp cerrada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/whatsapp/send - Enviar mensaje manual
router.post('/send', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    const { clienteId, mensaje } = req.body;

    if (!clienteId || !mensaje || !String(mensaje).trim()) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos: clienteId y mensaje' });
    }

    const textoFinal = String(mensaje).trim();

    try {
        const client = await db.prepare('SELECT id, nombres, "apellidoPaterno", telefono, "equipo_id", "etapaEmbudo", "historialEmbudo", "propietarioId" FROM clientes WHERE id = ?').get(clienteId);
        if (!client) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }
        if (!client.telefono) {
            return res.status(400).json({ mensaje: 'El cliente no tiene un número de teléfono registrado' });
        }

        // ✅ SEGURIDAD: Verificar que el vendedor tenga acceso a este cliente
        if (req.usuario.rol !== 'admin') {
            const propietario = client.propietarioId ?? client.prospectorAsignado ?? client.vendedorAsignado;
            const hasAccess = String(propietario) === String(vendedorId) ||
                              String(client.closerAsignado) === String(vendedorId);
            if (!hasAccess) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este cliente' });
            }
        }

        // ✅ PRIMERO enviar el mensaje. Si falla, no registramos nada en DB.
        await sendMessage(vendedorId, client.telefono, textoFinal);

        // ✅ Luego registrar en la base de datos (solo si el envío fue exitoso)
        await db.prepare('INSERT INTO actividades (tipo, vendedor, cliente, descripcion, resultado) VALUES (?, ?, ?, ?, ?)')
            .run('whatsapp', vendedorId, clienteId, `Vendedor: ${textoFinal}`, 'enviado');

        // Transición automática de etapa si estaba en Sin Contacto
        if (client.etapaEmbudo === 'prospecto_nuevo') {
            const nowTime = new Date().toISOString();
            const hist = client.historialEmbudo ? JSON.parse(client.historialEmbudo) : [];
            hist.push({
                etapa: 'en_contacto',
                fecha: nowTime,
                vendedor: vendedorId,
                descripcion: 'Cambio automático de etapa a En contacto al enviar primer mensaje de WhatsApp'
            });

            await db.prepare(`
                UPDATE clientes 
                SET "etapaEmbudo" = 'en_contacto', "fechaUltimaEtapa" = ?, "historialEmbudo" = ?, "ultimaInteraccion" = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(nowTime, JSON.stringify(hist), clienteId);
        } else {
            await db.prepare('UPDATE clientes SET "ultimaInteraccion" = CURRENT_TIMESTAMP WHERE id = ?').run(clienteId);
        }

        // Emitir actualizaciones
        const io = req.app.get('io');
        io.to(`user_${vendedorId}`).emit('prospectos_actualizados');
        if (client.equipo_id) {
            io.to(`team_${client.equipo_id}`).emit('prospectos_actualizados');
        }
        if (client.propietarioId && String(client.propietarioId) !== String(vendedorId)) {
            io.to(`user_${client.propietarioId}`).emit('prospectos_actualizados');
        }

        res.json({ success: true, mensaje: 'Mensaje enviado correctamente' });
    } catch (err) {
        console.error('[WhatsApp /send] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/whatsapp/chats - Listar chats con prospectos/clientes
router.get('/chats', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    const { rol } = req.usuario;
    try {
        // Obtener clientes con su último mensaje WhatsApp en una sola query con JOIN
        let sql;
        let params = [];

        const selectBase = `
            SELECT 
                c.id,
                c.nombres,
                c."apellidoPaterno",
                c.telefono,
                c."etapaEmbudo",
                c."ultimaInteraccion",
                c."propietarioId",
                c."prospectorAsignado",
                c."vendedorAsignado",
                c."closerAsignado",
                c.compartido,
                c."equipo_id",
                (
                    SELECT a.descripcion 
                    FROM actividades a 
                    WHERE a.cliente = c.id AND a.tipo = 'whatsapp' 
                    ORDER BY a.id DESC LIMIT 1
                ) AS "lastMessage",
                (
                    SELECT a."createdAt" 
                    FROM actividades a 
                    WHERE a.cliente = c.id AND a.tipo = 'whatsapp' 
                    ORDER BY a.id DESC LIMIT 1
                ) AS "lastMessageTime",
                (
                    SELECT a.resultado 
                    FROM actividades a 
                    WHERE a.cliente = c.id AND a.tipo = 'whatsapp' 
                    ORDER BY a.id DESC LIMIT 1
                ) AS "lastResult"
            FROM clientes c
        `;

        if (rol === 'admin') {
            sql = `
                WITH sub AS (${selectBase})
                SELECT 
                    id, 
                    nombres, 
                    "apellidoPaterno", 
                    telefono, 
                    "etapaEmbudo", 
                    "lastMessage", 
                    "lastMessageTime", 
                    "lastResult"
                FROM sub
                WHERE telefono IS NOT NULL AND telefono != '' AND "lastMessageTime" IS NOT NULL
                ORDER BY COALESCE(CAST("lastMessageTime" AS TEXT), CAST("ultimaInteraccion" AS TEXT)) DESC
            `;
        } else {
            // Incluir clientes donde el usuario es vendedor, closer o propietario
            sql = `
                WITH sub AS (${selectBase})
                SELECT 
                    id, 
                    nombres, 
                    "apellidoPaterno", 
                    telefono, 
                    "etapaEmbudo", 
                    "lastMessage", 
                    "lastMessageTime", 
                    "lastResult"
                FROM sub
                WHERE telefono IS NOT NULL AND telefono != '' AND "lastMessageTime" IS NOT NULL
                  AND (
                    COALESCE("propietarioId", "prospectorAsignado", "vendedorAsignado") = ?
                    OR "closerAsignado" = ?
                    OR (compartido = true AND "equipo_id" = (SELECT equipo_id FROM usuarios WHERE id = ?))
                  )
                ORDER BY COALESCE(CAST("lastMessageTime" AS TEXT), CAST("ultimaInteraccion" AS TEXT)) DESC
            `;
            params = [vendedorId, vendedorId, vendedorId];
        }

        const rows = await db.prepare(sql).all(...params);

        const chats = rows.map(r => ({
            id: r.id,
            nombres: r.nombres || 'Sin nombre',
            apellidoPaterno: r.apellidoPaterno || '',
            telefono: r.telefono,
            etapaEmbudo: r.etapaEmbudo || 'prospecto_nuevo',
            lastMessage: r.lastMessage || '',
            lastMessageTime: r.lastMessageTime || null,
            lastMessageFromMe: r.lastResult === 'enviado',
            unanswered: r.lastResult === 'recibido' || (r.lastMessage || '').startsWith('Cliente:')
        }));

        res.json(chats);
    } catch (err) {
        console.error('[WhatsApp /chats] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/whatsapp/chats/:clienteId - Obtener historial de mensajes con un cliente
router.get('/chats/:clienteId', auth, async (req, res) => {
    const { clienteId } = req.params;
    const vendedorId = req.usuario.id;
    const { rol } = req.usuario;
    try {
        // Verificar que el usuario tenga acceso a este cliente
        if (rol !== 'admin') {
            const client = await db.prepare(
                'SELECT "vendedorAsignado", "prospectorAsignado", "propietarioId", "closerAsignado", compartido, "equipo_id" FROM clientes WHERE id = ?'
            ).get(clienteId);

            if (!client) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

            const propietario = client.propietarioId ?? client.prospectorAsignado ?? client.vendedorAsignado;
            const hasAccess = String(propietario) === String(vendedorId) ||
                              String(client.closerAsignado) === String(vendedorId);

            if (!hasAccess) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este chat' });
            }
        }

        const activities = await db.prepare(
            'SELECT id, descripcion, resultado, "createdAt" FROM actividades WHERE cliente = ? AND tipo = ? ORDER BY id ASC'
        ).all(clienteId, 'whatsapp');
        
        res.json(activities);
    } catch (err) {
        console.error('[WhatsApp /chats/:id] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/whatsapp/chats/:id/toggle-client - Convertir entre prospecto y cliente
router.post('/chats/:id/toggle-client', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    const clienteId = parseInt(req.params.id, 10);
    try {
        const client = await db.prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
        if (!client) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }
        
        // Verificar que sea el vendedor asignado, closer asignado, propietario o admin
        const assignedSeller = client.vendedorAsignado ?? client.prospectorAsignado ?? client.propietarioId ?? null;
        const closerAsignado = client.closerAsignado ?? null;
        
        const isOwner = req.usuario.rol === 'admin' ||
                        (assignedSeller !== null && String(assignedSeller) === String(vendedorId)) ||
                        (closerAsignado !== null && String(closerAsignado) === String(vendedorId));

        if (!isOwner) {
            return res.status(403).json({ mensaje: 'No tienes permiso para modificar este prospecto' });
        }

        const isCurrentlyClient = ['venta_ganada', 'cotizacion_realizada', 'contrato_firmado', 'esperando_pago', 'cliente_activo'].includes(client.etapaEmbudo);
        
        let etapaNueva;
        let estado;
        if (isCurrentlyClient) {
            // Revertir a prospecto (en contacto)
            etapaNueva = 'en_contacto';
            estado = 'proceso';
        } else {
            // Marcar como cliente (venta ganada)
            etapaNueva = 'venta_ganada';
            estado = 'ganado';
        }

        const nowTime = new Date().toISOString();
        const hist = client.historialEmbudo ? JSON.parse(client.historialEmbudo) : [];
        hist.push({
            etapa: etapaNueva,
            fecha: nowTime,
            vendedor: vendedorId,
            descripcion: isCurrentlyClient 
                ? 'Convertido de vuelta a Prospecto desde el chat de WhatsApp' 
                : 'Marcado como Cliente desde el chat de WhatsApp'
        });

        await db.prepare(`
            UPDATE clientes 
            SET "etapaEmbudo" = ?, "estado" = ?, "fechaUltimaEtapa" = ?, "historialEmbudo" = ?, "ultimaInteraccion" = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(etapaNueva, estado, nowTime, JSON.stringify(hist), clienteId);

        // Registrar actividad
        await db.prepare('INSERT INTO actividades (tipo, vendedor, cliente, descripcion, resultado) VALUES (?, ?, ?, ?, ?)')
            .run('whatsapp', vendedorId, clienteId, isCurrentlyClient 
                ? 'Marcado como Prospecto en el chat' 
                : 'Marcado como Cliente en el chat', 'enviado');

        // Emitir actualizaciones
        const io = req.app.get('io');
        io.to(`user_${vendedorId}`).emit('prospectos_actualizados');
        if (client.equipo_id) {
            io.to(`team_${client.equipo_id}`).emit('prospectos_actualizados');
        }

        res.json({ success: true, etapaEmbudo: etapaNueva, mensaje: 'Estado actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
