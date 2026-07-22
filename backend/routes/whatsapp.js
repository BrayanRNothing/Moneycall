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
    const { clienteId, mensaje, isInternalNote } = req.body;

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

        if (isInternalNote) {
            // ✅ Es nota interna: Solo guardar en base de datos, NO enviar a Baileys
            await db.prepare('INSERT INTO actividades (tipo, vendedor, cliente, descripcion, resultado) VALUES (?, ?, ?, ?, ?)')
                .run('whatsapp', vendedorId, clienteId, textoFinal, 'nota_interna');
        } else {
            // ✅ PRIMERO enviar el mensaje. Si falla, no registramos nada en DB.
            await sendMessage(vendedorId, client.telefono, textoFinal);

            // ✅ Luego registrar en la base de datos (solo si el envío fue exitoso)
            await db.prepare('INSERT INTO actividades (tipo, vendedor, cliente, descripcion, resultado) VALUES (?, ?, ?, ?, ?)')
                .run('whatsapp', vendedorId, clienteId, `Vendedor: ${textoFinal}`, 'enviado');
        }

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

        // Emitir actualizaciones globalmente y a la sala
        const io = req.app.get('io');
        io.emit('prospectos_actualizados');
        io.to(`user_${vendedorId}`).emit('prospectos_actualizados');

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
        let rows = [];
        if (rol === 'admin') {
            rows = await db.prepare(`
                SELECT 
                    c.id,
                    c.nombres,
                    c."apellidoPaterno",
                    c.telefono,
                    c."etapaEmbudo",
                    c."ultimaInteraccion",
                    c."fechaRegistro",
                    c.fuente,
                    (
                        SELECT a.descripcion 
                        FROM actividades a 
                        WHERE a.cliente = c.id AND a.tipo = 'whatsapp' AND (a.resultado IS NULL OR a.resultado != 'nota_interna')
                        ORDER BY COALESCE(a."createdAt", a.fecha) DESC LIMIT 1
                    ) AS "lastMessage",
                    (
                        SELECT COALESCE(a."createdAt", a.fecha)
                        FROM actividades a 
                        WHERE a.cliente = c.id AND a.tipo = 'whatsapp' AND (a.resultado IS NULL OR a.resultado != 'nota_interna')
                        ORDER BY COALESCE(a."createdAt", a.fecha) DESC LIMIT 1
                    ) AS "lastMessageTime",
                    (
                        SELECT a.resultado 
                        FROM actividades a 
                        WHERE a.cliente = c.id AND a.tipo = 'whatsapp' AND (a.resultado IS NULL OR a.resultado != 'nota_interna')
                        ORDER BY COALESCE(a."createdAt", a.fecha) DESC LIMIT 1
                    ) AS "lastResult"
                FROM clientes c
                WHERE c.telefono IS NOT NULL AND c.telefono != ''
                ORDER BY COALESCE(
                    (
                        SELECT COALESCE(a."createdAt", a.fecha)
                        FROM actividades a 
                        WHERE a.cliente = c.id AND a.tipo = 'whatsapp' AND (a.resultado IS NULL OR a.resultado != 'nota_interna')
                        ORDER BY COALESCE(a."createdAt", a.fecha) DESC LIMIT 1
                    ),
                    c."ultimaInteraccion",
                    c."fechaRegistro"
                ) DESC
            `).all();
        } else {
            rows = await db.prepare(`
                SELECT 
                    c.id,
                    c.nombres,
                    c."apellidoPaterno",
                    c.telefono,
                    c."etapaEmbudo",
                    c."ultimaInteraccion",
                    c."fechaRegistro",
                    c.fuente,
                    (
                        SELECT a.descripcion 
                        FROM actividades a 
                        WHERE a.cliente = c.id AND a.tipo = 'whatsapp' AND (a.resultado IS NULL OR a.resultado != 'nota_interna')
                        ORDER BY COALESCE(a."createdAt", a.fecha) DESC LIMIT 1
                    ) AS "lastMessage",
                    (
                        SELECT COALESCE(a."createdAt", a.fecha)
                        FROM actividades a 
                        WHERE a.cliente = c.id AND a.tipo = 'whatsapp' AND (a.resultado IS NULL OR a.resultado != 'nota_interna')
                        ORDER BY COALESCE(a."createdAt", a.fecha) DESC LIMIT 1
                    ) AS "lastMessageTime",
                    (
                        SELECT a.resultado 
                        FROM actividades a 
                        WHERE a.cliente = c.id AND a.tipo = 'whatsapp' AND (a.resultado IS NULL OR a.resultado != 'nota_interna')
                        ORDER BY COALESCE(a."createdAt", a.fecha) DESC LIMIT 1
                    ) AS "lastResult"
                FROM clientes c
                WHERE c.telefono IS NOT NULL AND c.telefono != ''
                  AND (
                    c."vendedorAsignado" = ?
                    OR c."prospectorAsignado" = ?
                    OR c."propietarioId" = ?
                    OR c."closerAsignado" = ?
                    OR EXISTS (
                        SELECT 1 FROM actividades act 
                        WHERE act.cliente = c.id AND act.tipo = 'whatsapp' AND act.vendedor = ?
                    )
                  )
                ORDER BY COALESCE(
                    (
                        SELECT COALESCE(a."createdAt", a.fecha)
                        FROM actividades a 
                        WHERE a.cliente = c.id AND a.tipo = 'whatsapp' AND (a.resultado IS NULL OR a.resultado != 'nota_interna')
                        ORDER BY COALESCE(a."createdAt", a.fecha) DESC LIMIT 1
                    ),
                    c."ultimaInteraccion",
                    c."fechaRegistro"
                ) DESC
            `).all(vendedorId, vendedorId, vendedorId, vendedorId, vendedorId);
        }

        const chats = (rows || []).map(r => ({
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
        console.error('[WhatsApp /chats] Error:', err);
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

            const hasAccess = String(client.vendedorAsignado) === String(vendedorId) ||
                              String(client.prospectorAsignado) === String(vendedorId) ||
                              String(client.propietarioId) === String(vendedorId) ||
                              String(client.closerAsignado) === String(vendedorId) ||
                              (await db.prepare('SELECT 1 FROM actividades WHERE cliente = ? AND tipo = ? AND vendedor = ? LIMIT 1').get(clienteId, 'whatsapp', vendedorId)) !== undefined;

            if (!hasAccess) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este chat' });
            }
        }

        const activities = await db.prepare(
            'SELECT id, descripcion, resultado, "createdAt", "fecha" FROM actividades WHERE cliente = ? AND tipo = ? ORDER BY COALESCE("createdAt", "fecha") ASC, id ASC'
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

        // Emitir actualizaciones globalmente y a la sala
        const io = req.app.get('io');
        io.emit('prospectos_actualizados');
        io.to(`user_${vendedorId}`).emit('prospectos_actualizados');

        res.json({ success: true, etapaEmbudo: etapaNueva, mensaje: 'Estado actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Configurar multer para envíos multimedia de WhatsApp (imágenes, PDFs, audios)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const WA_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'whatsapp');
if (!fs.existsSync(WA_UPLOADS_DIR)) {
    fs.mkdirSync(WA_UPLOADS_DIR, { recursive: true });
}

const waStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, WA_UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || (file.mimetype.includes('audio') ? '.ogg' : '.bin');
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40);
        cb(null, `${Date.now()}_${base}${ext}`);
    }
});

const waUpload = multer({
    storage: waStorage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// POST /api/whatsapp/send-media - Enviar imágenes, PDFs o notas de voz
router.post('/send-media', auth, waUpload.single('file'), async (req, res) => {
    const vendedorId = req.usuario.id;
    const { clienteId, mediaType, caption } = req.body;
    const file = req.file;

    if (!clienteId || !file) {
        return res.status(400).json({ mensaje: 'Falta clienteId o archivo' });
    }

    try {
        const client = await db.prepare('SELECT id, nombres, "apellidoPaterno", telefono, "equipo_id" FROM clientes WHERE id = ?').get(clienteId);
        if (!client || !client.telefono) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado o sin teléfono' });
        }

        const relativeUrl = `/uploads/whatsapp/${file.filename}`;
        const fileBuffer = fs.readFileSync(file.path);
        const fileName = file.originalname || file.filename;
        const mimeType = file.mimetype;

        const { sendMediaMessage } = require('../services/whatsappManager');
        await sendMediaMessage(vendedorId, client.telefono, mediaType, fileBuffer, fileName, caption, mimeType);

        let descTag = '';
        if (mediaType === 'audio') {
            descTag = `[AUDIO](${relativeUrl})`;
        } else if (mediaType === 'image') {
            descTag = `[IMAGE](${relativeUrl})${caption ? ' - ' + caption : ''}`;
        } else {
            descTag = `[DOCUMENT](${relativeUrl})${caption ? ' - ' + caption : ''}`;
        }

        await db.prepare('INSERT INTO actividades (tipo, vendedor, cliente, descripcion, resultado) VALUES (?, ?, ?, ?, ?)')
            .run('whatsapp', vendedorId, clienteId, `Vendedor: ${descTag}`, 'enviado');

        await db.prepare('UPDATE clientes SET "ultimaInteraccion" = CURRENT_TIMESTAMP WHERE id = ?').run(clienteId);

        const io = req.app.get('io');
        if (io) {
            io.emit('prospectos_actualizados');
            io.to(`user_${vendedorId}`).emit('prospectos_actualizados');
        }

        res.json({ mensaje: 'Archivo enviado correctamente', url: relativeUrl });
    } catch (err) {
        console.error('Error enviando media WhatsApp:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/whatsapp/scheduled - Programar un mensaje futuro
router.post('/scheduled', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    const { clienteId, mensaje, scheduledAt } = req.body;

    if (!clienteId || !mensaje || !scheduledAt) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    try {
        await db.prepare(
            `INSERT INTO whatsapp_scheduled (vendedor_id, cliente_id, mensaje, scheduled_at, status) VALUES (?, ?, ?, ?, 'pending')`
        ).run(vendedorId, clienteId, String(mensaje).trim(), scheduledAt);

        res.json({ mensaje: 'Mensaje programado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/whatsapp/scheduled - Obtener lista de mensajes programados pendientes
router.get('/scheduled', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    try {
        const rows = await db.prepare(
            `SELECT s.*, c.nombres, c."apellidoPaterno", c.telefono 
             FROM whatsapp_scheduled s
             JOIN clientes c ON s.cliente_id = c.id
             WHERE s.vendedor_id = ? AND s.status = 'pending'
             ORDER BY s.scheduled_at ASC`
        ).all(vendedorId);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/whatsapp/scheduled/:id - Cancelar mensaje programado
router.delete('/scheduled/:id', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    const { id } = req.params;
    try {
        await db.prepare(
            `UPDATE whatsapp_scheduled SET status = 'cancelled' WHERE id = ? AND vendedor_id = ?`
        ).run(id, vendedorId);

        res.json({ mensaje: 'Mensaje programado cancelado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/whatsapp/chats/:clienteId/settings - Actualizar ajustes de chat (Fijar, No leído, Etiqueta)
router.post('/chats/:clienteId/settings', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    const { clienteId } = req.params;
    const { isPinned, isUnread, label } = req.body;

    try {
        const existing = await db.prepare(
            `SELECT * FROM whatsapp_chat_settings WHERE vendedor_id = ? AND cliente_id = ?`
        ).get(vendedorId, clienteId);

        if (existing) {
            await db.prepare(
                `UPDATE whatsapp_chat_settings 
                 SET is_pinned = COALESCE(?, is_pinned), 
                     is_unread = COALESCE(?, is_unread), 
                     label = COALESCE(?, label),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE vendedor_id = ? AND cliente_id = ?`
            ).run(
                isPinned !== undefined ? (isPinned ? 1 : 0) : null,
                isUnread !== undefined ? (isUnread ? 1 : 0) : null,
                label !== undefined ? label : null,
                vendedorId, clienteId
            );
        } else {
            await db.prepare(
                `INSERT INTO whatsapp_chat_settings (vendedor_id, cliente_id, is_pinned, is_unread, label)
                 VALUES (?, ?, ?, ?, ?)`
            ).run(
                vendedorId, clienteId,
                isPinned ? 1 : 0,
                isUnread ? 1 : 0,
                label || ''
            );
        }

        res.json({ mensaje: 'Ajustes de chat actualizados' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/whatsapp/chats-settings - Obtener mapa de configuraciones de chat del vendedor
router.get('/chats-settings', auth, async (req, res) => {
    const vendedorId = req.usuario.id;
    try {
        const rows = await db.prepare(
            `SELECT cliente_id, is_pinned, is_unread, label FROM whatsapp_chat_settings WHERE vendedor_id = ?`
        ).all(vendedorId);

        const map = {};
        for (const r of rows) {
            map[r.cliente_id] = {
                isPinned: Boolean(r.is_pinned),
                isUnread: Boolean(r.is_unread),
                label: r.label || ''
            };
        }
        res.json(map);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
