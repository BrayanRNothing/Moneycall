import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Search, RefreshCw, Calendar, Phone, MessageSquare, Video, FileText, CheckCircle2, Target, AlertTriangle, Users } from 'lucide-react';
import { getUser, getToken } from '../utils/authUtils';
import API_URL from '../config/api';

const getIcon = (tipo) => {
    switch (tipo) {
        case 'llamada': return <Phone size={16} />;
        case 'whatsapp': return <MessageSquare size={16} />;
        case 'reunion': return <Video size={16} />;
        case 'correo': return <FileText size={16} />;
        case 'nota': return <FileText size={16} />;
        case 'cambio_etapa': return <Target size={16} />;
        default: return <Activity size={16} />;
    }
};

const getTipoColor = (tipo) => {
    switch (tipo) {
        case 'llamada': return 'bg-blue-50 text-blue-600 border-blue-200';
        case 'whatsapp': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        case 'reunion': return 'bg-purple-50 text-purple-600 border-purple-200';
        case 'correo': return 'bg-amber-50 text-amber-600 border-amber-200';
        case 'nota': return 'bg-gray-50 text-gray-600 border-gray-200';
        case 'cambio_etapa': return 'bg-rose-50 text-rose-600 border-rose-200';
        default: return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    }
};

export default function Monitoreo() {
    const userAuth = getUser();
    const token = getToken();
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroMiembro, setFiltroMiembro] = useState('');

    const fetchActividades = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const url = `${API_URL}/api/equipos/monitoreo/actividades?limit=200${filtroMiembro ? `&miembro_id=${filtroMiembro}` : ''}`;
            const res = await fetch(url, {
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            });
            if (!res.ok) throw new Error((await res.json()).mensaje || 'Error al cargar actividades');
            const data = await res.json();
            setActividades(data.actividades || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [filtroMiembro, token]);

    useEffect(() => {
        fetchActividades();
    }, [fetchActividades]);

    // get unique members for filter from the currently fetched activities or a separate endpoint
    // since we might not have all members in the recent 200 activities, a full team fetch would be ideal, 
    // but extracting from activities is a decent fallback.
    const uniqueMembers = Array.from(new Set(actividades.map(a => a.vendedor?.id))).map(id => {
        return actividades.find(a => a.vendedor?.id === id)?.vendedor;
    }).filter(Boolean);

    if (!userAuth?.esOwner && userAuth?.rol !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-screen">
                <AlertTriangle size={64} className="text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
                <p className="text-gray-500">Solo el propietario del equipo puede acceder a esta sección.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen md:bg-slate-50 md:p-6 bg-white -m-4 md:m-0 p-4 pb-8 md:pb-6 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white md:rounded-2xl p-5 border border-slate-200 shadow-sm transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Activity size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-tight">Monitoreo del Equipo</h1>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Supervisa en tiempo real las acciones de tu equipo</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <select
                                className="flex-1 md:flex-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                value={filtroMiembro}
                                onChange={(e) => setFiltroMiembro(e.target.value)}
                            >
                                <option value="">Todos los miembros</option>
                                {uniqueMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                            <button
                                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all shadow-sm group"
                                onClick={fetchActividades}
                                title="Actualizar"
                            >
                                <RefreshCw size={18} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-semibold">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <RefreshCw size={48} className="animate-spin text-indigo-500 mb-4" />
                            <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Cargando actividades...</p>
                        </div>
                    ) : actividades.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-semibold">No hay actividades registradas en el equipo.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-4">
                            {actividades.map((act) => (
                                <div key={act.id} className="relative pl-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    {/* Line marker */}
                                    <div className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${getTipoColor(act.tipo).split(' ')[0]}`}>
                                        <div className="w-2 h-2 rounded-full bg-current"></div>
                                    </div>
                                    
                                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl border ${getTipoColor(act.tipo)}`}>
                                                    {getIcon(act.tipo)}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900 capitalize">{act.tipo}</h3>
                                                    <p className="text-xs text-gray-500 font-medium">Por: <span className="font-semibold text-indigo-600">{act.vendedor?.nombre}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                                    <Calendar size={12} />
                                                    {new Date(act.fecha || act.createdAt).toLocaleString(undefined, {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pl-1">
                                            {act.cliente && (
                                                <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Cliente Involucrado</p>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {act.cliente.nombres} {act.cliente.apellidoPaterno} 
                                                        {act.cliente.empresa && <span className="text-gray-500 font-normal ml-1">({act.cliente.empresa})</span>}
                                                    </p>
                                                </div>
                                            )}
                                            {act.descripcion && (
                                                <p className="text-sm text-gray-600 mb-3">{act.descripcion}</p>
                                            )}
                                            {act.notas && (
                                                <p className="text-sm text-gray-500 italic mb-3 border-l-2 border-gray-200 pl-3">{act.notas}</p>
                                            )}
                                            {act.resultado && (
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${act.resultado === 'exitoso' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                                    <CheckCircle2 size={12} className={act.resultado === 'exitoso' ? 'text-emerald-500' : 'text-gray-400'} />
                                                    {act.resultado}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
