require('dotenv').config();
// Build trigger: 2026-04-23
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Inicializar base de datos
require('./config/database');

const app = express();

// ✅ HEALTHCHECK - FIRST PRIORITY (Railway require 200 fast)
app.get('/health', (req, res) => {
    const { db } = require('./config/database');
    res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        env: process.env.NODE_ENV,
        database: db ? 'connected' : 'disconnected',
        postgres: true
    });
});
console.log('✅ Healthcheck endpoint ready');

// ✅ CORS CONFIGURATION - MUST BE FIRST
app.use(cors({
    origin: '*', // Allows all origins. For production, you might want to restrict this later.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    exposedHeaders: ['x-auth-token'],
    credentials: true
}));

// ✅ Google Identity Services Popup Fix
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

// Preflight manually handles OPTIONS if needed, but cors middleware usually does it.
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// ✅ Servir archivos subidos (contratos PDF) antes de cualquier otra ruta
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/archivos', express.static(uploadsPath));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/actividades', require('./routes/actividades'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/tareas', require('./routes/tareas'));
app.use('/api/metricas', require('./routes/metricas'));
app.use('/api/embudo', require('./routes/embudo'));
// Rol único: vendedor
app.use('/api/vendedor', require('./routes/vendedor'));
app.use('/api/google', require('./routes/google'));
app.use('/api/equipos', require('./routes/equipos'));
app.use('/api/plantillas', require('./routes/plantillas'));
app.use('/api/documentos', require('./routes/documentos'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
console.log('🚀 Rutas registradas correctamente');


// Ruta de prueba API
app.get('/api', (req, res) => {
    res.json({
        mensaje: '🚀 API CRM Infiniguard SYS funcionando correctamente',
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Health check (Duplicate for safety, keep original location too)

// ✅ SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND (React compilado)
const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    // ✅ FALLBACK PARA SPA REACT - Solo si existe dist
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ mensaje: 'Ruta API no encontrada' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // Si no existe dist (entorno desacoplado como Railway + Vercel)
    // Manejador global para cualquier ruta no encontrada
    app.use((req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ mensaje: `Ruta API no encontrada: ${req.method} ${req.path}` });
        }
        res.json({
            mensaje: '🚀 API CRM Infiniguard SYS - Backend Activo',
            estado: 'El frontend se sirve por separado (Vercel)',
            endpoint_api: '/api'
        });
    });
}

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // Railway requiere escuchar en 0.0.0.0

const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en ${HOST}:${PORT}`);
    console.log(`📡 Modo: ${process.env.NODE_ENV || 'development'}`);
});

// ✅ INICIALIZAR SOCKET.IO
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*', // Permitir desde cualquier frontend
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['x-auth-token']
    }
});

// Guardar io en la app para usarlo en las rutas
app.set('io', io);

// Inicializar sesiones de WhatsApp guardadas
const { initSessions } = require('./services/whatsappManager');
initSessions(io);

io.on('connection', (socket) => {
    console.log(`⚡ Cliente conectado a WebSockets: ${socket.id}`);

    // Unirse a la sala del usuario para notificaciones individuales de WhatsApp
    // ✅ SEGURIDAD: Verificar token JWT antes de unirse a una sala de usuario
    socket.on('join_user', async (payload) => {
        try {
            // payload puede ser solo el userId (legado) o { userId, token }
            let userId, token;
            if (typeof payload === 'object' && payload !== null) {
                userId = payload.userId;
                token = payload.token;
            } else {
                // Modo legado: solo el ID — aceptar pero sin QR (no seguro para produccion)
                userId = payload;
                token = null;
            }

            if (!userId) return;

            // Si hay token, validarlo contra el userId
            if (token) {
                const jwt = require('jsonwebtoken');
                const { db } = require('./config/database');
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                    const row = await db.prepare('SELECT id, activo FROM usuarios WHERE id = ?').get(decoded.id);
                    if (!row || (row.activo === 0 || row.activo === false)) {
                        socket.emit('auth_error', { mensaje: 'Token inválido' });
                        return;
                    }
                    // Solo puede unirse a su propia sala
                    if (String(decoded.id) !== String(userId)) {
                        socket.emit('auth_error', { mensaje: 'No autorizado para unirse a esta sala' });
                        return;
                    }
                } catch (_) {
                    socket.emit('auth_error', { mensaje: 'Token inválido o expirado' });
                    return;
                }
            }

            socket.join(`user_${userId}`);
            console.log(`👤 Socket ${socket.id} unió al canal de usuario: user_${userId}`);
            const { getSessionStatus, getStoredQr } = require('./services/whatsappManager');
            const status = getSessionStatus(userId);
            socket.emit('whatsapp-status', { status });
            if (status === 'generando_qr') {
                const qrImage = getStoredQr(userId);
                if (qrImage) {
                    socket.emit('whatsapp-qr', qrImage);
                }
            }
        } catch (err) {
            console.error('Socket join_user error:', err.message);
        }
    });

    socket.on('leave_user', (userId) => {
        if (userId) {
            socket.leave(`user_${userId}`);
        }
    });

    // Unirse a la sala del equipo (con verificación de token de seguridad)
    socket.on('join_team', async (data) => {
        const equipoId = typeof data === 'object' ? data.equipoId : data;
        const token = typeof data === 'object' ? data.token : null;
        if (!equipoId) return;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                const { db } = require('./config/database');
                const user = await db.prepare('SELECT id, "equipo_id", activo FROM usuarios WHERE id = ?').get(decoded.id);
                if (!user || (user.activo === 0 || user.activo === false)) return;
                if (String(user.equipo_id) === String(equipoId)) {
                    socket.join(`team_${equipoId}`);
                    console.log(`👥 Socket ${socket.id} unió al equipo autenticado: team_${equipoId}`);
                } else {
                    socket.emit('auth_error', { mensaje: 'No pertenece a este equipo' });
                }
            } catch (_) {
                socket.emit('auth_error', { mensaje: 'Token inválido para equipo' });
            }
        } else {
            socket.join(`team_${equipoId}`);
        }
    });

    socket.on('leave_team', (equipoId) => {
        if (equipoId) {
            socket.leave(`team_${equipoId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Recibido SIGTERM, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📴 Recibido SIGINT, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
    });
});

// ✅ ANTI-CRASH: Atrapar cualquier promesa rechazada sin manejar para que el servidor NUNCA se caiga
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [unhandledRejection] Promesa rechazada no manejada:');
    console.error('  Reason:', reason?.message || reason);
    // No llamamos process.exit() – el servidor sigue en pie
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ [uncaughtException] Excepción no capturada:');
    console.error('  Error:', err.message);
    console.error('  Stack:', err.stack?.split('\n')[1]);
    // No llamamos process.exit() – el servidor sigue en pie
    // Si en el futuro quieres que algunos errores fatales sí maten el proceso, añade lógica aquí
});
