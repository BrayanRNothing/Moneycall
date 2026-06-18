import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { getToken } from '../utils/authUtils';
import API_URL from '../config/api';

export default function NotificacionesBell() {
    const [notificaciones, setNotificaciones] = useState([]);
    const [open, setOpen] = useState(false);
    const token = getToken();

    const fetchNotificaciones = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/notificaciones`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setNotificaciones(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotificaciones();
        const interval = setInterval(fetchNotificaciones, 30000); // Polling cada 30 segundos
        return () => clearInterval(interval);
    }, [token]);

    const marcarLeida = async (id) => {
        try {
            await fetch(`${API_URL}/api/notificaciones/marcar-leida/${id}`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            setNotificaciones(notificaciones.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const marcarTodasLeidas = async () => {
        try {
            await fetch(`${API_URL}/api/notificaciones/marcar-todas-leidas/todo`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            setNotificaciones([]);
            setOpen(false);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setOpen(!open)} 
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell size={20} />
                {notificaciones.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-900 text-sm">Notificaciones</h3>
                        {notificaciones.length > 0 && (
                            <button 
                                onClick={marcarTodasLeidas}
                                className="text-xs text-(--theme-600) hover:text-(--theme-700) font-semibold flex items-center gap-1"
                            >
                                <CheckCircle2 size={14} /> Leer todas
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {notificaciones.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">
                                No tienes notificaciones nuevas
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notificaciones.map((notif) => (
                                    <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start cursor-pointer" onClick={() => marcarLeida(notif.id)}>
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-(--theme-500) shrink-0"></div>
                                        <div>
                                            <p className="text-sm text-gray-800">{notif.mensaje}</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                                                {new Date(notif.fecha).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
