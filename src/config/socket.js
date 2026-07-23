import { io } from 'socket.io-client';
import API_URL from './api';

// Inicializar conexión con el servidor (con autoConnect: false por seguridad)
export const socket = io(API_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
});

// Emitir join_team y join_user al conectar/reconectar para recibir eventos en tiempo real con token de seguridad
const joinRooms = () => {
    try {
        const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (rawUser && token) {
            const user = JSON.parse(rawUser);
            
            // 1. Unirse a la sala de equipo
            if (user?.equipo_id) {
                socket.emit('join_team', { equipoId: user.equipo_id, token });
                console.log(`👥 Unido a sala WebSocket: team_${user.equipo_id}`);
            }
            
            // 2. Unirse a la sala de usuario (para notificaciones individuales)
            const userId = user?.id || user?._id;
            if (userId) {
                socket.emit('join_user', { userId, token });
                console.log(`👤 Unido a sala WebSocket: user_${userId}`);
            }
        }
    } catch (e) {
        console.error('Error al unirse a salas WebSocket:', e);
    }
};

// Eventos básicos de depuración
socket.on('connect', () => {
    console.log('✅ Conectado a WebSockets', socket.id);
    joinRooms();
});

socket.on('reconnect', () => {
    console.log('🔄 Reconectado a WebSockets');
    joinRooms();
});

socket.on('disconnect', () => {
    console.log('❌ Desconectado de WebSockets');
});

// ✅ SEGURIDAD: Iniciar conexión una vez que todos los listeners estén registrados y la variable 'socket' esté inicializada
socket.connect();

export default socket;
