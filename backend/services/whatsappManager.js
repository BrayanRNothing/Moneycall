const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState, delay, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Mapa en memoria de conexiones activas: { [vendedorId]: socket }
const connections = {};
// Mapa en memoria de estados de conexión: { [vendedorId]: 'conectado' | 'generando_qr' | 'desconectado' }
const connectionStatuses = {};
const contactNames = {}; // { [phone]: name }
const storedQrs = {}; // { [vendedorId]: qrImageDataUrl }

const SESSION_DIR_BASE = path.join(__dirname, '../sessions');

// Asegurar que exista la carpeta base de sesiones
if (!fs.existsSync(SESSION_DIR_BASE)) {
    fs.mkdirSync(SESSION_DIR_BASE, { recursive: true });
}

// Mapa de intentos de reconexión para backoff exponencial: { [vendedorId]: retryCount }
const retryCount = {};

// Tiempo máximo de espera para reconexión (5 minutos)
const MAX_RECONNECT_DELAY_MS = 5 * 60 * 1000;

function getReconnectDelay(vendedorId) {
    const attempts = retryCount[vendedorId] || 0;
    // Backoff exponencial: 5s, 10s, 20s, 40s, 80s... hasta MAX_RECONNECT_DELAY_MS
    const delay = Math.min(5000 * Math.pow(2, attempts), MAX_RECONNECT_DELAY_MS);
    retryCount[vendedorId] = attempts + 1;
    return delay;
}

function resetReconnectDelay(vendedorId) {
    retryCount[vendedorId] = 0;
}

// Resolver identificadores LID a números de teléfono reales utilizando el mapeo guardado por Baileys
function resolveLidToPhone(jid, sessionDir) {
    if (!jid || !jid.endsWith('@lid')) return jid;
    const lidNum = jid.split('@')[0];
    const mappingFile = path.join(sessionDir, `lid-mapping-${lidNum}_reverse.json`);
    if (fs.existsSync(mappingFile)) {
        try {
            const content = fs.readFileSync(mappingFile, 'utf8');
            const phoneNum = JSON.parse(content);
            if (phoneNum) {
                return `${phoneNum}@s.whatsapp.net`;
            }
        } catch (err) {
            console.error('Error al resolver LID de forma reversa:', err.message);
        }
    }
    return jid;
}

// Validar si un JID o teléfono corresponde a un grupo de WhatsApp, transmisión, LID o ID no individual
function isGroupOrNonPersonJid(jidOrPhone) {
    if (!jidOrPhone) return true;
    const str = String(jidOrPhone).toLowerCase().trim();
    
    if (
        str.includes('@g.us') || 
        str.includes('@broadcast') || 
        str.includes('@newsletter') || 
        str.includes('@call') ||
        str.includes('@lid')
    ) {
        return true;
    }

    const digitsOnly = str.replace(/\D/g, '');
    
    // LIDs de WhatsApp (14+ dígitos) y números de grupos o virtuales
    if (
        digitsOnly.length >= 14 || 
        digitsOnly.startsWith('120363') || 
        digitsOnly.startsWith('102') || 
        digitsOnly.startsWith('149') || 
        digitsOnly.startsWith('100') || 
        digitsOnly.startsWith('101') ||
        digitsOnly.startsWith('237')
    ) {
        return true;
    }

    if (digitsOnly.length < 10) {
        return true;
    }

    return false;
}

// Verificar si un contacto tiene un nombre real guardado en la agenda de contactos (no genérico ni número crudo ni de grupos)
function hasRealSavedName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return false;
    
    // Rechazar si es un número de teléfono puro o formateado (+..., 521...)
    if (trimmed.startsWith('+') || /^\+?\d[\d\s\-()]{6,}\d$/.test(trimmed)) return false;

    const lower = trimmed.toLowerCase();
    if (
        lower.startsWith('contacto whatsapp') ||
        lower.startsWith('prospecto whatsapp') ||
        lower.startsWith('contacto') ||
        lower.startsWith('prospecto') ||
        lower.startsWith('whatsapp') ||
        lower.includes('@g.us') ||
        lower.includes('@broadcast') ||
        lower.includes('@newsletter')
    ) {
        return false;
    }
    return true;
}

// Verificar si un mensaje de WhatsApp es más antiguo a 6 meses (180 días)
function isOlderThan6Months(msg) {
    if (!msg) return false;
    const rawTimestamp = msg.messageTimestamp?.low || msg.messageTimestamp || 0;
    if (!rawTimestamp) return false;

    const timestampInSeconds = rawTimestamp > 1000000000000 ? Math.floor(rawTimestamp / 1000) : Number(rawTimestamp);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const sixMonthsInSeconds = 180 * 24 * 60 * 60;
    const cutoffTimestamp = nowInSeconds - sixMonthsInSeconds;

    return timestampInSeconds < cutoffTimestamp;
}

// Actualizar automáticamente el nombre de un cliente si actualmente tiene un nombre genérico ("Prospecto", "WhatsApp (+521...)")
async function updateClientNameIfGeneric(vendedorId, phone, name, io) {
    if (!phone || !name) return;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) return;

    const trimmedName = String(name).trim();
    if (!trimmedName || trimmedName.toLowerCase().startsWith('prospecto whatsapp') || trimmedName.toLowerCase() === 'prospecto') return;

    const { db } = require('../config/database');
    try {
        const allClients = await db.prepare('SELECT id, nombres, "apellidoPaterno", telefono, telefono2, "equipo_id" FROM clientes').all();
        const matchingClients = allClients.filter(c => {
            const clean1 = String(c.telefono || '').replace(/\D/g, '').slice(-10);
            const clean2 = String(c.telefono2 || '').replace(/\D/g, '').slice(-10);
            return clean1 === cleanPhone || clean2 === cleanPhone;
        });

        for (const client of matchingClients) {
            const isGenericName = 
                !client.nombres || 
                client.nombres === 'Prospecto' || 
                client.nombres.toLowerCase().includes('prospecto') ||
                client.nombres.toLowerCase().includes('sin nombre') ||
                client.apellidoPaterno.toLowerCase().includes('whatsapp');

            if (isGenericName) {
                const parts = trimmedName.split(/\s+/);
                const newNombres = parts[0] || 'Prospecto';
                const newApellido = parts.slice(1).join(' ') || '';

                await db.prepare('UPDATE clientes SET nombres = ?, "apellidoPaterno" = ? WHERE id = ?')
                    .run(newNombres, newApellido, client.id);

                console.log(`[WhatsApp user_${vendedorId}] ✏️ Nombre actualizado para cliente #${client.id}: ${newNombres} ${newApellido}`);
                
                if (io) {
                    io.to(`user_${vendedorId}`).emit('prospectos_actualizados');
                    if (client.equipo_id) {
                        io.to(`team_${client.equipo_id}`).emit('prospectos_actualizados');
                    }
                }
            }
        }
    } catch (err) {
        console.error(`[WhatsApp user_${vendedorId}] Error al actualizar nombre genérico:`, err.message);
    }
}

// Asegurar que exista un prospecto para un teléfono/JID individual de WhatsApp recibido de chats o contactos
async function ensureProspectExists(vendedorId, phone, name = '', io) {
    if (!phone || isGroupOrNonPersonJid(phone)) return;
    // Omitir totalmente si no se especifica un nombre guardado real en la agenda
    if (!hasRealSavedName(name)) return;

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10 || isGroupOrNonPersonJid(cleanPhone)) return;

    const { db } = require('../config/database');
    try {
        const allClients = await db.prepare('SELECT id, nombres, "apellidoPaterno", telefono, telefono2, "equipo_id" FROM clientes').all();
        const exists = allClients.some(c => {
            const clean1 = String(c.telefono || '').replace(/\D/g, '').slice(-10);
            const clean2 = String(c.telefono2 || '').replace(/\D/g, '').slice(-10);
            return clean1 === cleanPhone || clean2 === cleanPhone;
        });

        if (!exists) {
            let equipoId = null;
            const vendedor = await db.prepare('SELECT equipo_id FROM usuarios WHERE id = ?').get(vendedorId);
            if (vendedor) equipoId = vendedor.equipo_id || null;

            const now = new Date().toISOString();
            const hist = JSON.stringify([{ etapa: 'prospecto_nuevo', fecha: now, vendedor: vendedorId }]);
            const cleanDigits = phone.split('@')[0].replace(/\D/g, '');
            const rawFormattedPhone = `+${cleanDigits}`;

            let nombres = 'Contacto';
            let apellidoPaterno = 'WhatsApp';

            const trimmedName = String(name || '').trim();
            if (trimmedName && !trimmedName.toLowerCase().startsWith('prospecto whatsapp')) {
                const parts = trimmedName.split(/\s+/);
                nombres = parts[0] || 'Contacto';
                apellidoPaterno = parts.slice(1).join(' ') || '';
            }

            await db.prepare(`
                INSERT INTO clientes (nombres, "apellidoPaterno", "apellidoMaterno", telefono, correo, empresa, estado, "etapaEmbudo", "historialEmbudo", "vendedorAsignado", "prospectorAsignado", "closerAsignado", "fechaUltimaEtapa", "equipo_id", "propietarioId", compartido, fuente)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                nombres,
                apellidoPaterno,
                '',
                rawFormattedPhone,
                '',
                'Contacto WhatsApp',
                'proceso',
                'prospecto_nuevo',
                hist,
                vendedorId,
                vendedorId,
                vendedorId,
                now,
                equipoId,
                vendedorId,
                0,
                'WhatsApp'
            );

            console.log(`[WhatsApp user_${vendedorId}] ➕ Prospecto asegurado/registrado: ${nombres} ${apellidoPaterno} (${rawFormattedPhone})`);
            if (io) {
                io.to(`user_${vendedorId}`).emit('prospectos_actualizados');
                if (equipoId) io.to(`team_${equipoId}`).emit('prospectos_actualizados');
            }
        } else if (name) {
            await updateClientNameIfGeneric(vendedorId, cleanPhone, name, io);
        }
    } catch (err) {
        console.error(`[WhatsApp user_${vendedorId}] Error al asegurar prospecto:`, err.message);
    }
}

// ==========================================
// DB SYNC HELPERS (PostgreSQL/SQLite safe)
// ==========================================

async function saveSessionToDb(vendedorId, sessionDir) {
    if (!fs.existsSync(sessionDir)) return;
    const { db } = require('../config/database');
    try {
        const files = await fs.promises.readdir(sessionDir);
        const sessionData = {};
        for (const file of files) {
            const filePath = path.join(sessionDir, file);
            try {
                const stats = await fs.promises.stat(filePath);
                if (stats.isFile()) {
                    // Leer como base64 de forma asíncrona para soportar archivos binarios y de texto
                    const rawBuffer = await fs.promises.readFile(filePath);
                    sessionData[file] = rawBuffer.toString('base64');
                }
            } catch (fileErr) {
                // Ignorar si el archivo fue eliminado por Baileys después de readdir
                if (fileErr.code !== 'ENOENT') {
                    console.warn(`[WhatsApp user_${vendedorId}] Advertencia al leer archivo de sesión ${file}:`, fileErr.message);
                }
            }
        }
        const dbData = JSON.stringify(sessionData);
        const existing = await db.prepare('SELECT id FROM whatsapp_sessions WHERE vendedor_id = ?').get(vendedorId);
        if (existing) {
            await db.prepare('UPDATE whatsapp_sessions SET session_data = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE vendedor_id = ?').run(dbData, vendedorId);
        } else {
            await db.prepare('INSERT INTO whatsapp_sessions (vendedor_id, session_data) VALUES (?, ?)').run(vendedorId, dbData);
        }
        console.log(`[WhatsApp user_${vendedorId}] Sesión guardada en DB (${Object.keys(sessionData).length} archivos).`);
    } catch (err) {
        console.error(`[WhatsApp user_${vendedorId}] Error saving session to DB:`, err.message);
    }
}

async function restoreSessionFromDb(vendedorId, sessionDir) {
    const { db } = require('../config/database');
    try {
        const row = await db.prepare('SELECT session_data FROM whatsapp_sessions WHERE vendedor_id = ?').get(vendedorId);
        if (!row || !row.session_data) return false;
        
        if (!fs.existsSync(sessionDir)) {
            await fs.promises.mkdir(sessionDir, { recursive: true });
        }
        
        const sessionData = JSON.parse(row.session_data);
        const writePromises = Object.entries(sessionData).map(async ([file, content]) => {
            const filePath = path.join(sessionDir, file);
            try {
                const buf = Buffer.from(content, 'base64');
                await fs.promises.writeFile(filePath, buf);
            } catch (_) {
                await fs.promises.writeFile(filePath, content, 'utf-8');
            }
        });
        await Promise.all(writePromises);
        console.log(`[WhatsApp user_${vendedorId}] Sesión restaurada desde DB (${Object.keys(sessionData).length} archivos).`);
        return true;
    } catch (err) {
        console.error(`[WhatsApp user_${vendedorId}] Error restoring session from DB:`, err.message);
        return false;
    }
}

async function deleteSessionFromDb(vendedorId) {
    const { db } = require('../config/database');
    try {
        await db.prepare('DELETE FROM whatsapp_sessions WHERE vendedor_id = ?').run(vendedorId);
    } catch (err) {
        console.error(`[WhatsApp user_${vendedorId}] Error deleting session from DB:`, err.message);
    }
}

function cleanSessionFolder(sessionDir) {
    fs.promises.rm(sessionDir, { recursive: true, force: true })
        .then(() => console.log(`🧹 Carpeta de sesión ${sessionDir} eliminada con éxito.`))
        .catch(err => console.error(`⚠️ Error al borrar carpeta de sesión ${sessionDir}:`, err.message));
}

// Debounce para evitar sobrecargar la base de datos en creds.update (incrementado a 15s)
const syncTimeouts = {};
function queueSessionSync(vendedorId, sessionDir) {
    if (syncTimeouts[vendedorId]) clearTimeout(syncTimeouts[vendedorId]);
    syncTimeouts[vendedorId] = setTimeout(() => {
        saveSessionToDb(vendedorId, sessionDir);
    }, 15000);
}

// Heartbeat: mapa de timers de verificación de conexión
const heartbeatTimers = {};

function startHeartbeat(vendedorId, io) {
    stopHeartbeat(vendedorId);
    // Cada 4 minutos verificar que la sesión siga viva
    heartbeatTimers[vendedorId] = setInterval(async () => {
        const sock = connections[vendedorId];
        if (!sock) {
            stopHeartbeat(vendedorId);
            return;
        }
        try {
            // Si el socket está en estado 'open' pero no hay actividad, ping implícito con readyState
            if (sock.ws && sock.ws.readyState !== 1 /* OPEN */) {
                console.warn(`[WhatsApp user_${vendedorId}] Heartbeat detectó conexión muerta (ws.readyState=${sock.ws?.readyState}). Reconectando...`);
                stopHeartbeat(vendedorId);
                delete connections[vendedorId];
                connectionStatuses[vendedorId] = 'desconectado';
                const delay = getReconnectDelay(vendedorId);
                setTimeout(() => connectClient(vendedorId, io), delay);
            }
        } catch (err) {
            console.error(`[WhatsApp user_${vendedorId}] Error en heartbeat:`, err.message);
        }
    }, 4 * 60 * 1000); // cada 4 minutos
}

function stopHeartbeat(vendedorId) {
    if (heartbeatTimers[vendedorId]) {
        clearInterval(heartbeatTimers[vendedorId]);
        delete heartbeatTimers[vendedorId];
    }
}

// ==========================================
// INCOMING MESSAGE HANDLER
// ==========================================

async function handleIncomingMessage(vendedorId, phone, text, io, pushName = '', msgKey = {}) {
    const { db } = require('../config/database');
    try {
        // Ignorar JIDs de grupos, broadcast, newsletters o participantes de grupos
        if (!phone || isGroupOrNonPersonJid(phone) || msgKey.remoteJid?.includes('@g.us') || msgKey.participant) return;

        // Normalizar número entrante: obtener últimos 10 dígitos numéricos
        const cleanIncoming = phone.replace(/\D/g, '').slice(-10);
        if (cleanIncoming.length < 10 || isGroupOrNonPersonJid(cleanIncoming)) return;

        // Obtener todos los clientes para poder compararlos limpiamente
        const allClients = await db.prepare('SELECT id, nombres, "apellidoPaterno", telefono, telefono2, "equipo_id" FROM clientes').all();

        let matchingClients = allClients.filter(c => {
            const clean1 = String(c.telefono || '').replace(/\D/g, '').slice(-10);
            const clean2 = String(c.telefono2 || '').replace(/\D/g, '').slice(-10);
            return clean1 === cleanIncoming || clean2 === cleanIncoming;
        });

        // Si el cliente no existe y es un mensaje 1 a 1 directo real:
        if (matchingClients.length === 0) {
            if (isGroupOrNonPersonJid(phone) || msgKey.participant || msgKey.remoteJid?.includes('@g.us')) return;
            
            // Buscar nombre del contacto en la agenda del celular o en el perfil de WhatsApp (pushName)
            const contactJid = phone.split('@')[0];
            const savedName = contactNames[contactJid] || contactNames[cleanIncoming] || pushName || '';

            console.log(`[WhatsApp user_${vendedorId}] Teléfono ${phone} (${savedName || 'Sin nombre'}) registrado via 1-a-1. Creando prospecto...`);
            
            let equipoId = null;
            const vendedor = await db.prepare('SELECT equipo_id FROM usuarios WHERE id = ?').get(vendedorId);
            if (vendedor) {
                equipoId = vendedor.equipo_id || null;
            }

            const now = new Date().toISOString();
            const hist = JSON.stringify([{ etapa: 'prospecto_nuevo', fecha: now, vendedor: vendedorId }]);
            const cleanDigits = phone.split('@')[0].replace(/\D/g, '');
            const rawFormattedPhone = `+${cleanDigits}`;

            let nombres = 'Cliente';
            let apellidoPaterno = `WhatsApp (${rawFormattedPhone})`;
            
            if (savedName && savedName.trim()) {
                const parts = savedName.trim().split(/\s+/);
                if (parts.length > 0) {
                    nombres = parts[0];
                    if (parts.length > 1) {
                        apellidoPaterno = parts.slice(1).join(' ');
                    } else {
                        apellidoPaterno = '';
                    }
                }
            }

            await db.prepare(`
                INSERT INTO clientes (nombres, "apellidoPaterno", "apellidoMaterno", telefono, correo, empresa, estado, "etapaEmbudo", "historialEmbudo", "vendedorAsignado", "prospectorAsignado", "closerAsignado", "fechaUltimaEtapa", "equipo_id", "propietarioId", compartido, fuente)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                nombres,
                apellidoPaterno,
                '',
                rawFormattedPhone,
                '',
                'Contacto WhatsApp',
                'proceso',
                'prospecto_nuevo',
                hist,
                vendedorId,
                vendedorId,
                vendedorId,
                now,
                equipoId,
                vendedorId,
                0,
                'WhatsApp'
            );

            // Recuperar el cliente recién insertado
            const newClient = await db.prepare('SELECT id, nombres, "apellidoPaterno", "equipo_id" FROM clientes ORDER BY id DESC LIMIT 1').get();
            if (newClient) {
                matchingClients = [newClient];
            }
        }

        if (matchingClients.length > 0) {
            const contactJid = phone.split('@')[0];
            const discoveredName = contactNames[contactJid] || contactNames[cleanIncoming] || pushName || '';
            if (discoveredName) {
                await updateClientNameIfGeneric(vendedorId, cleanIncoming, discoveredName, io);
            }
            for (const client of matchingClients) {
                // Registrar actividad en la base de datos
                await db.prepare('INSERT INTO actividades (tipo, vendedor, cliente, descripcion, resultado) VALUES (?, ?, ?, ?, ?)')
                    .run('whatsapp', vendedorId, client.id, `Cliente: ${text}`, 'recibido');

                // Actualizar última interacción
                await db.prepare('UPDATE clientes SET "ultimaInteraccion" = CURRENT_TIMESTAMP WHERE id = ?').run(client.id);

                console.log(`[WhatsApp user_${vendedorId}] Mensaje entrante registrado para cliente id ${client.id}`);

                // Emitir por WebSockets globalmente y por canal para recarga automática
                io.emit('prospectos_actualizados');
                io.to(`user_${vendedorId}`).emit('prospectos_actualizados');
                if (client.equipo_id) {
                    io.to(`team_${client.equipo_id}`).emit('prospectos_actualizados');
                }

                // Emitir evento de nuevo mensaje de WhatsApp para notificaciones globales
                io.emit('new-whatsapp-message', {
                    clientId: client.id,
                    nombres: client.nombres,
                    apellidoPaterno: client.apellidoPaterno,
                    telefono: client.telefono,
                    text: text
                });
                io.to(`user_${vendedorId}`).emit('new-whatsapp-message', {
                    clientId: client.id,
                    nombres: client.nombres,
                    apellidoPaterno: client.apellidoPaterno,
                    telefono: client.telefono,
                    text: text
                });
            }
        }
    } catch (err) {
        console.error(`[WhatsApp user_${vendedorId}] Error handling incoming message:`, err.message);
    }
}
async function handleOutgoingMessageFromOtherDevice(vendedorId, phone, text, io, msgKey = {}) {
    const { db } = require('../config/database');
    try {
        // Ignorar JIDs de grupos, broadcast, newsletters o participantes de grupos
        if (!phone || isGroupOrNonPersonJid(phone) || msgKey.remoteJid?.includes('@g.us') || msgKey.participant) return;

        const cleanIncoming = phone.replace(/\D/g, '').slice(-10);
        if (cleanIncoming.length < 10 || isGroupOrNonPersonJid(cleanIncoming)) return;

        const allClients = await db.prepare('SELECT id, nombres, "apellidoPaterno", telefono, telefono2, "equipo_id", "etapaEmbudo", "historialEmbudo" FROM clientes').all();
        const matchingClients = allClients.filter(c => {
            const clean1 = String(c.telefono || '').replace(/\D/g, '').slice(-10);
            const clean2 = String(c.telefono2 || '').replace(/\D/g, '').slice(-10);
            return clean1 === cleanIncoming || clean2 === cleanIncoming;
        });

        if (matchingClients.length === 0) {
            await ensureProspectExists(vendedorId, phone, '', io);
        } else {
            for (const client of matchingClients) {
                const desc = `Vendedor: ${text}`;
                
                // Buscar el último mensaje idéntico para evitar duplicados
                const duplicate = await db.prepare(
                    `SELECT id, "createdAt" FROM actividades 
                     WHERE cliente = ? AND tipo = 'whatsapp' AND descripcion = ? 
                     ORDER BY id DESC LIMIT 1`
                ).get(client.id, desc);

                let isDuplicate = false;
                if (duplicate) {
                    const diffMs = Math.abs(new Date() - new Date(duplicate.createdAt));
                    if (diffMs < 10000) {
                        isDuplicate = true;
                    }
                }

                if (!isDuplicate) {
                    await db.prepare('INSERT INTO actividades (tipo, vendedor, cliente, descripcion, resultado) VALUES (?, ?, ?, ?, ?)')
                        .run('whatsapp', vendedorId, client.id, desc, 'enviado');

                    if (client.etapaEmbudo === 'prospecto_nuevo') {
                        const nowTime = new Date().toISOString();
                        const hist = client.historialEmbudo ? JSON.parse(client.historialEmbudo) : [];
                        hist.push({
                            etapa: 'en_contacto',
                            fecha: nowTime,
                            vendedor: vendedorId,
                            descripcion: 'Cambio automático de etapa a En contacto al enviar primer mensaje de WhatsApp (externo)'
                        });

                        await db.prepare(`
                            UPDATE clientes 
                            SET "etapaEmbudo" = 'en_contacto', "fechaUltimaEtapa" = ?, "historialEmbudo" = ?, "ultimaInteraccion" = CURRENT_TIMESTAMP
                            WHERE id = ?
                        `).run(nowTime, JSON.stringify(hist), client.id);
                    } else {
                        await db.prepare('UPDATE clientes SET "ultimaInteraccion" = CURRENT_TIMESTAMP WHERE id = ?').run(client.id);
                    }

                    console.log(`[WhatsApp user_${vendedorId}] Mensaje saliente externo registrado para cliente id ${client.id}`);

                    io.emit('prospectos_actualizados');
                    io.to(`user_${vendedorId}`).emit('prospectos_actualizados');
                    if (client.equipo_id) {
                        io.to(`team_${client.equipo_id}`).emit('prospectos_actualizados');
                    }
                }
            }
        }
    } catch (err) {
        console.error(`[WhatsApp user_${vendedorId}] Error handling outgoing message from other device:`, err.message);
    }
}

// ==========================================
// CORE CONNECTION LOGIC
// ==========================================

async function connectClient(vendedorId, io) {
    if (connections[vendedorId]) {
        console.log(`[WhatsApp user_${vendedorId}] Connection already exists in memory.`);
        return;
    }

    const sessionDir = path.join(SESSION_DIR_BASE, `user_${vendedorId}`);
    
    // Restaurar archivos desde PostgreSQL si existen
    await restoreSessionFromDb(vendedorId, sessionDir);

    console.log(`[WhatsApp user_${vendedorId}] Starting Baileys session...`);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['CRMoneyCall', 'Chrome', '1.0.0'],
        shouldSyncHistoryMessage: () => true,   // Habilitar la descarga de chats y mensajes antiguos
        syncFullHistory: false,                 // NO sincronizar el historial largo en segundo plano (para máxima velocidad)
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        retryRequestDelayMs: 250,               // Reintentos rápidos
        maxMsgRetryCount: 3,                    // Permitir reintentos razonables para recuperar mensajes
        generateHighQualityLinkPreview: false   // Ahorrar tiempo en previews de links
    });

    connections[vendedorId] = sock;
    connectionStatuses[vendedorId] = 'generando_qr';

    sock.ev.on('creds.update', async () => {
        await saveCreds();
        queueSessionSync(vendedorId, sessionDir);
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log(`[WhatsApp user_${vendedorId}] QR code generated, converting to image URL`);
            connectionStatuses[vendedorId] = 'generando_qr';
            try {
                const qrImage = await QRCode.toDataURL(qr);
                storedQrs[vendedorId] = qrImage;
                io.to(`user_${vendedorId}`).emit('whatsapp-qr', qrImage);
            } catch (err) {
                console.error('Error generating QR code image:', err);
                io.to(`user_${vendedorId}`).emit('whatsapp-qr', null);
            }
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            // Solo borrar sesión si WhatsApp explícitamente desvinculó el dispositivo (401 loggedOut)
            // Errores temporales de red (408, 503, 500, undefined) deben reconectar SIN borrar sesión
            const isLoggedOut = statusCode === DisconnectReason.loggedOut ||
                                lastDisconnect?.error?.output?.payload?.message === 'Logged Out';
            
            console.log(`[WhatsApp user_${vendedorId}] Conexión cerrada. Código: ${statusCode}. ¿Desvinculado?: ${isLoggedOut}`);
            
            // Limpiar socket de memoria
            delete connections[vendedorId];
            delete storedQrs[vendedorId];
            stopHeartbeat(vendedorId);
            connectionStatuses[vendedorId] = 'desconectado';
            
            if (!isLoggedOut) {
                // Reconectar con backoff exponencial
                const reconnectDelay = getReconnectDelay(vendedorId);
                console.log(`[WhatsApp user_${vendedorId}] Reconectando en ${Math.round(reconnectDelay / 1000)}s...`);
                setTimeout(() => connectClient(vendedorId, io), reconnectDelay);
            } else {
                // Sesión cerrada voluntariamente por el usuario en su teléfono
                console.log(`[WhatsApp user_${vendedorId}] Dispositivo desvinculado. Eliminando sesión.`);
                cleanSessionFolder(sessionDir);
                await deleteSessionFromDb(vendedorId);
                io.to(`user_${vendedorId}`).emit('whatsapp-status', { status: 'desconectado' });
            }
        } else if (connection === 'open') {
            console.log(`[WhatsApp user_${vendedorId}] ¡Conexión exitosa!`);
            connectionStatuses[vendedorId] = 'conectado';
            resetReconnectDelay(vendedorId); // Reiniciar contador de reintentos
            delete storedQrs[vendedorId];
            await saveSessionToDb(vendedorId, sessionDir);
            io.to(`user_${vendedorId}`).emit('whatsapp-status', { status: 'conectado' });
            startHeartbeat(vendedorId, io); // Iniciar heartbeat de monitoreo
        }
    });

    sock.ev.on('messaging-history.set', async ({ chats, contacts, messages, isLatest }) => {
        console.log(`[WhatsApp user_${vendedorId}] Historial inicial recibido: ${chats?.length || 0} chats, ${contacts?.length || 0} contactos, ${messages?.length || 0} mensajes.`);
        
        if (contacts) {
            for (const contact of contacts) {
                if (contact.id && !isGroupOrNonPersonJid(contact.id)) {
                    const phone = contact.id.split('@')[0];
                    const name = contact.name || contact.verifiedName || contact.notify || '';
                    if (phone && name) {
                        contactNames[phone] = name;
                    }
                }
            }
        }

        if (chats) {
            for (const chat of chats) {
                if (chat.id && !isGroupOrNonPersonJid(chat.id)) {
                    const phone = chat.id.split('@')[0];
                    const name = contactNames[phone] || chat.name || '';
                    if (phone && name) {
                        contactNames[phone] = name;
                    }
                }
            }
        }

        // Importar mensajes de chats de forma asíncrona
        if (messages && messages.length > 0) {
            processHistoricalMessages(vendedorId, messages, io).catch(err => {
                console.error(`[WhatsApp user_${vendedorId}] Error al procesar historial:`, err.message);
            });
        }
    });

    sock.ev.on('contacts.set', async ({ contacts }) => {
        if (!contacts) return;
        for (const contact of contacts) {
            if (contact.id && !isGroupOrNonPersonJid(contact.id)) {
                const phone = contact.id.split('@')[0];
                const name = contact.name || contact.verifiedName || contact.notify || '';
                if (phone && name) {
                    contactNames[phone] = name;
                }
            }
        }
    });

    sock.ev.on('contacts.upsert', async (contacts) => {
        if (!contacts) return;
        for (const contact of contacts) {
            if (contact.id && !isGroupOrNonPersonJid(contact.id)) {
                const phone = contact.id.split('@')[0];
                const name = contact.name || contact.verifiedName || contact.notify || '';
                if (phone && name) {
                    contactNames[phone] = name;
                }
            }
        }
    });

    sock.ev.on('contacts.update', async (updates) => {
        if (!updates) return;
        for (const update of updates) {
            if (update.id && !isGroupOrNonPersonJid(update.id)) {
                const phone = update.id.split('@')[0];
                const name = update.name || update.verifiedName || update.notify || '';
                if (phone && name) {
                    contactNames[phone] = name;
                }
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify' || m.type === 'append') {
            for (const msg of m.messages) {
                if (!msg.message) continue;

                const remoteJid = msg.key?.remoteJid || '';
                const remoteJidAlt = msg.key?.remoteJidAlt || '';

                // Rechazar de inmediato cualquier mensaje de grupo o mayor a 6 meses
                if (
                    isOlderThan6Months(msg) ||
                    remoteJid.includes('@g.us') ||
                    remoteJidAlt.includes('@g.us') ||
                    msg.key?.participant ||
                    isGroupOrNonPersonJid(remoteJid) ||
                    isGroupOrNonPersonJid(remoteJidAlt)
                ) {
                    continue;
                }

                const rawJid = remoteJid.endsWith('@s.whatsapp.net') ? remoteJid : (remoteJidAlt.endsWith('@s.whatsapp.net') ? remoteJidAlt : (remoteJid || remoteJidAlt));
                const sessionDir = path.join(SESSION_DIR_BASE, `user_${vendedorId}`);
                const jid = resolveLidToPhone(rawJid, sessionDir);

                if (!jid || !jid.endsWith('@s.whatsapp.net') || isGroupOrNonPersonJid(jid)) {
                    continue;
                }

                const phone = jid.split('@')[0];
                if (isGroupOrNonPersonJid(phone)) continue;

                const isFromMe = msg.key.fromMe;
                
                // Identificar si contiene archivos multimedia
                const mediaKeys = ['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage', 'stickerMessage'];
                let isMedia = false;
                let mediaType = '';
                let mediaObj = null;

                for (const key of mediaKeys) {
                    if (msg.message[key]) {
                        isMedia = true;
                        mediaType = key.replace('Message', ''); // 'image', 'video', 'document', 'audio', 'sticker'
                        mediaObj = msg.message[key];
                        break;
                    }
                }

                if (isMedia && mediaObj) {
                    try {
                        const stream = await downloadContentFromMessage(mediaObj, mediaType);
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }

                        let ext = '';
                        if (mediaType === 'image') ext = '.jpg';
                        else if (mediaType === 'video') ext = '.mp4';
                        else if (mediaType === 'audio') ext = '.ogg';
                        else if (mediaType === 'sticker') ext = '.webp';
                        else if (mediaType === 'document') {
                            const originalName = mediaObj.fileName || 'documento';
                            ext = path.extname(originalName) || '.pdf';
                        }

                        const whatsappUploadsDir = path.join(__dirname, '../uploads/whatsapp');
                        if (!fs.existsSync(whatsappUploadsDir)) {
                            fs.mkdirSync(whatsappUploadsDir, { recursive: true });
                        }

                        const fileName = `${mediaType}_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
                        const filePath = path.join(whatsappUploadsDir, fileName);
                        fs.writeFileSync(filePath, buffer);

                        const publicUrl = `/archivos/whatsapp/${fileName}`;
                        let captionText = mediaObj.caption || '';
                        let desc = `[${mediaType.toUpperCase()}](${publicUrl})`;
                        if (captionText) {
                            desc += ` - ${captionText}`;
                        }

                        if (isFromMe) {
                            await handleOutgoingMessageFromOtherDevice(vendedorId, phone, desc, io, msg.key);
                        } else {
                            await handleIncomingMessage(vendedorId, phone, desc, io, msg.pushName, msg.key);
                        }
                    } catch (err) {
                        console.error(`[WhatsApp user_${vendedorId}] Error downloading media:`, err.message);
                    }
                } else {
                    // Procesar mensaje de texto estándar
                    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                    if (text) {
                        if (isFromMe) {
                            await handleOutgoingMessageFromOtherDevice(vendedorId, phone, text, io, msg.key);
                        } else {
                            await handleIncomingMessage(vendedorId, phone, text, io, msg.pushName, msg.key);
                        }
                    }
                }
            }
        }
    });
}

// Inicializar todas las sesiones guardadas en la base de datos al arrancar el servidor
async function initSessions(io) {
    const { db } = require('../config/database');
    try {
        // Esperar un poco para que la DB termine de inicializarse completamente
        await new Promise(r => setTimeout(r, 2000));
        
        const sessions = await db.prepare('SELECT vendedor_id FROM whatsapp_sessions').all();
        console.log(`🌱 [WhatsApp Manager] Inicializando ${sessions.length} sesiones guardadas...`);
        
        for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];
            // Escalonar el inicio de sesiones para no sobrecargar: 1.5s entre cada una
            await new Promise(r => setTimeout(r, i === 0 ? 0 : 1500));
            connectClient(session.vendedor_id, io);
        }
    } catch (err) {
        console.error('Error inicializando sesiones de WhatsApp:', err.message);
    }
}

// Enviar un mensaje usando la sesión del vendedor
async function sendMessage(vendedorId, numero, texto) {
    const sock = connections[vendedorId];
    if (!sock || connectionStatuses[vendedorId] !== 'conectado') {
        throw new Error('Tu sesión de WhatsApp no está conectada. Ve a Ajustes para vincular tu cuenta.');
    }

    // Formatear número de destino al formato de WhatsApp
    // Quitar cualquier carácter no numérico
    let cleanNumber = numero.replace(/\D/g, '');
    
    // Si tiene 10 dígitos (número mexicano estándar), agregar prefijo de país de celular 521
    if (cleanNumber.length === 10) {
        cleanNumber = '521' + cleanNumber;
    }
    
    // Si es mexicano con 11 dígitos y empieza con 1 (formato celular antiguo de contacto), reformatear a 521 + 10 dígitos
    if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
        cleanNumber = '521' + cleanNumber.substring(1);
    }
    
    // Si tiene 12 dígitos y empieza con 52 (México), pero no tiene el 1 intermedio, insertar el 1
    if (cleanNumber.length === 12 && cleanNumber.startsWith('52') && !cleanNumber.startsWith('521')) {
        cleanNumber = '521' + cleanNumber.substring(2);
    }

    const jid = `${cleanNumber}@s.whatsapp.net`;

    // Simular retraso humano (escritura) antes de disparar el mensaje para evitar bloqueos
    await delay(200);
    
    // Enviar mensaje
    await sock.sendMessage(jid, { text: texto });
    return true;
}

// Desconectar cliente manualmente (solo cuando el usuario lo pida desde la UI)
async function disconnectClient(vendedorId) {
    stopHeartbeat(vendedorId);
    resetReconnectDelay(vendedorId);
    const sock = connections[vendedorId];
    if (sock) {
        try {
            // Darle máximo 500ms al logout antes de forzar el cierre del socket
            await Promise.race([
                sock.logout(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
            ]);
        } catch (_) {
            try { sock.end(); } catch (__) {}
        }
        delete connections[vendedorId];
    }
    connectionStatuses[vendedorId] = 'desconectado';
    delete storedQrs[vendedorId];
    
    // Eliminar la sesión de la base de datos de inmediato
    await deleteSessionFromDb(vendedorId);

    // Limpiar la carpeta física de forma asíncrona en segundo plano para no bloquear al usuario
    const sessionDir = path.join(SESSION_DIR_BASE, `user_${vendedorId}`);
    cleanSessionFolder(sessionDir);
}

// Obtener estado actual de la sesión
function getSessionStatus(vendedorId) {
    return connectionStatuses[vendedorId] || 'desconectado';
}

// Obtener QR guardado de la sesión
function getStoredQr(vendedorId) {
    return storedQrs[vendedorId] || null;
}

// Procesar historial de mensajes y contactos de forma asíncrona e inteligente
async function processHistoricalMessages(vendedorId, messages, io) {
    const { db } = require('../config/database');
    try {
        const sessionDir = path.join(SESSION_DIR_BASE, `user_${vendedorId}`);
        // Filtrar mensajes: solo procesar chats individuales estándar (@s.whatsapp.net)
        // Esto evita procesar grupos, listas de difusión, newsletters y participantes de grupo
        const validMessages = messages.filter(msg => {
            if (!msg.message) return false;

            // RECHAZAR mensajes mayores a 6 meses (180 días)
            if (isOlderThan6Months(msg)) return false;

            const remoteJid = msg.key?.remoteJid || '';
            const remoteJidAlt = msg.key?.remoteJidAlt || '';

            if (
                remoteJid.includes('@g.us') ||
                remoteJidAlt.includes('@g.us') ||
                msg.key?.participant ||
                isGroupOrNonPersonJid(remoteJid) ||
                isGroupOrNonPersonJid(remoteJidAlt)
            ) {
                return false;
            }

            const rawJid = remoteJid.endsWith('@s.whatsapp.net') ? remoteJid : (remoteJidAlt.endsWith('@s.whatsapp.net') ? remoteJidAlt : (remoteJid || remoteJidAlt));
            const jid = resolveLidToPhone(rawJid, sessionDir);
            return jid && jid.endsWith('@s.whatsapp.net') && !isGroupOrNonPersonJid(jid);
        });

        if (validMessages.length === 0) return;

        console.log(`[WhatsApp user_${vendedorId}] Procesando historial: ${validMessages.length} mensajes válidos...`);

        // Obtener todos los clientes actuales
        const allClients = await db.prepare('SELECT id, nombres, "apellidoPaterno", telefono, telefono2 FROM clientes').all();

        // 1. Obtener todas las actividades de tipo 'whatsapp' de los clientes existentes en una sola consulta para evitar N consultas
        const existingClientIds = allClients.map(c => c.id).filter(Boolean);
        const existingActivities = existingClientIds.length > 0
            ? await db.prepare(`
                SELECT cliente, descripcion 
                FROM actividades 
                WHERE cliente IN (${existingClientIds.map(() => '?').join(',')}) 
                  AND tipo = 'whatsapp'
              `).all(...existingClientIds)
            : [];

        // Guardar las actividades existentes en un Set en memoria
        const existingSet = new Set();
        for (const act of existingActivities) {
            existingSet.add(`${act.cliente}_${act.descripcion}`);
        }

        // Agrupar mensajes por teléfono
        const messagesByPhone = {};
        for (const msg of validMessages) {
            const rawJid = msg.key.remoteJidAlt || msg.key.remoteJid || '';
            const jid = resolveLidToPhone(rawJid, sessionDir);
            const phone = jid.split('@')[0];
            if (!phone) continue;
            if (!messagesByPhone[phone]) {
                messagesByPhone[phone] = [];
            }
            messagesByPhone[phone].push(msg);
        }

        let totalCreated = 0;
        const newActivitiesToInsert = [];
        
        for (const [phone, msgs] of Object.entries(messagesByPhone)) {
            if (isGroupOrNonPersonJid(phone)) continue;
            const cleanPhone = phone.replace(/\D/g, '').slice(-10);
            if (cleanPhone.length < 10 || isGroupOrNonPersonJid(cleanPhone)) continue;
            
            // Buscar si el cliente ya existe
            let client = allClients.find(c => {
                const clean1 = String(c.telefono || '').replace(/\D/g, '').slice(-10);
                const clean2 = String(c.telefono2 || '').replace(/\D/g, '').slice(-10);
                return clean1 === cleanPhone || clean2 === cleanPhone;
            });

            let clientId = null;
            let isNew = false;

            if (!client) {
                // Crear prospecto para chats 1 a 1 reales con mensajes históricos
                const savedName = contactNames[phone] || '';
                const cleanDigits = phone.split('@')[0].replace(/\D/g, '');
                const rawFormattedPhone = `+${cleanDigits}`;

                let equipoId = null;
                const vendedor = await db.prepare('SELECT equipo_id FROM usuarios WHERE id = ?').get(vendedorId);
                if (vendedor) equipoId = vendedor.equipo_id || null;

                const now = new Date().toISOString();
                const hist = JSON.stringify([{ etapa: 'prospecto_nuevo', fecha: now, vendedor: vendedorId }]);

                let nombres = 'Contacto';
                let apellidoPaterno = `WhatsApp (${rawFormattedPhone})`;

                if (savedName && savedName.trim()) {
                    const parts = savedName.trim().split(/\s+/);
                    if (parts.length > 0) {
                        nombres = parts[0];
                        apellidoPaterno = parts.slice(1).join(' ') || '';
                    }
                }

                try {
                    await db.prepare(`
                        INSERT INTO clientes (nombres, "apellidoPaterno", "apellidoMaterno", telefono, correo, empresa, estado, "etapaEmbudo", "historialEmbudo", "vendedorAsignado", "prospectorAsignado", "closerAsignado", "fechaUltimaEtapa", "equipo_id", "propietarioId", compartido, fuente)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        nombres,
                        apellidoPaterno,
                        '',
                        rawFormattedPhone,
                        '',
                        'Contacto WhatsApp',
                        'proceso',
                        'prospecto_nuevo',
                        hist,
                        vendedorId,
                        vendedorId,
                        vendedorId,
                        now,
                        equipoId,
                        vendedorId,
                        0,
                        'WhatsApp'
                    );

                    const newlyCreated = await db.prepare('SELECT id FROM clientes ORDER BY id DESC LIMIT 1').get();
                    clientId = newlyCreated ? newlyCreated.id : null;
                    isNew = true;
                    if (clientId) {
                        allClients.push({ id: clientId, telefono: phone });
                    }
                } catch (err) {
                    console.error(`Error al crear prospecto para chat histórico 1-a-1 ${phone}:`, err.message);
                    continue;
                }
            } else {
                clientId = client.id;
            }

            if (!clientId) continue;

            // Ordenar mensajes cronológicamente
            const sorted = msgs.sort((a, b) => {
                const timeA = (a.messageTimestamp?.low || a.messageTimestamp || 0);
                const timeB = (b.messageTimestamp?.low || b.messageTimestamp || 0);
                return timeA - timeB;
            });

            // Recopilar mensajes para insertar en lote
            for (const msg of sorted) {
                if (isOlderThan6Months(msg)) continue;
                // Obtener texto (soportar texto simple y extended text)
                const text = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.imageMessage?.caption || 
                             msg.message?.videoMessage?.caption || '';
                
                if (!text) continue;

                const isFromMe = msg.key.fromMe;
                const desc = isFromMe ? `Vendedor: ${text}` : `Cliente: ${text}`;
                const resultado = isFromMe ? 'enviado' : 'recibido';
                
                const rawTimestamp = msg.messageTimestamp?.low || msg.messageTimestamp;
                const createdAt = rawTimestamp ? new Date(rawTimestamp * 1000).toISOString() : new Date().toISOString();

                // Verificar duplicados utilizando el Set en memoria (muy rápido)
                const key = `${clientId}_${desc}`;
                if (!existingSet.has(key)) {
                    newActivitiesToInsert.push({
                        clientId,
                        desc,
                        resultado,
                        createdAt
                    });
                    existingSet.add(key); // Evitar duplicar si hay mensajes repetidos en este mismo lote
                }
            }
        }

        // 2. Insertar las actividades acumuladas en lotes de 500
        const batchSize = 500;
        for (let i = 0; i < newActivitiesToInsert.length; i += batchSize) {
            const batch = newActivitiesToInsert.slice(i, i + batchSize);
            const insertVals = [];
            const valuePlaceholders = [];
            
            for (const item of batch) {
                valuePlaceholders.push('(?, ?, ?, ?, ?, ?)');
                insertVals.push(
                    'whatsapp',
                    vendedorId,
                    item.clientId,
                    item.desc,
                    item.resultado,
                    item.createdAt
                );
            }
            
            const bulkSql = `
                INSERT INTO actividades (tipo, vendedor, cliente, descripcion, resultado, "createdAt")
                VALUES ${valuePlaceholders.join(', ')}
            `;
            await db.prepare(bulkSql).run(...insertVals);
        }

        if (totalCreated > 0) {
            console.log(`[WhatsApp user_${vendedorId}] Creados ${totalCreated} nuevos prospectos desde historial de WhatsApp.`);
            io.to(`user_${vendedorId}`).emit('prospectos_actualizados');
        }
    } catch (err) {
        console.error(`[WhatsApp user_${vendedorId}] Error procesando mensajes del historial:`, err.message);
    }
}

module.exports = {
    initSessions,
    connectClient,
    disconnectClient,
    sendMessage,
    getSessionStatus,
    getStoredQr
};
