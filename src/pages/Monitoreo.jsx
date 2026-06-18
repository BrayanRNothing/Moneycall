import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Calendar, Phone, MessageSquare, Video, FileText, CheckCircle2, Target, AlertTriangle, ChevronLeft, UserCircle2 } from 'lucide-react';
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

const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function Monitoreo() {
    const userAuth = getUser();
    const token = getToken();
    const [miembros, setMiembros] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingActs, setLoadingActs] = useState(false);
    const [error, setError] = useState('');

    const fetchMiembros = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/equipos/mi-equipo`, {
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            });
            if (!res.ok) throw new Error((await res.json()).mensaje || 'Error al cargar miembros');
            const data = await res.json();
            // Filtrar al propio owner para que no se vea a sí mismo
            const filteredMembers = (data.miembros || []).filter(m => String(m.id) !== String(userAuth?.id));
            setMiembros(filteredMembers);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token, userAuth?.id]);

    const fetchActividades = useCallback(async (miembroId) => {
        setLoadingActs(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/equipos/monitoreo/actividades?limit=200&miembro_id=${miembroId}`, {
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            });
            if (!res.ok) throw new Error((await res.json()).mensaje || 'Error al cargar actividades');
            const data = await res.json();
            setActividades(data.actividades || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingActs(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMiembros();
    }, [fetchMiembros]);

    useEffect(() => {
        if (selectedMember) {
            fetchActividades(selectedMember.id);
        }
    }, [selectedMember, fetchActividades]);

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
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Cabecera Principal */}
                <div className="bg-white md:rounded-2xl p-5 border border-slate-200 shadow-sm transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {selectedMember ? (
                                <button 
                                    onClick={() => setSelectedMember(null)}
                                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all shadow-sm group"
                                >
                                    <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Activity size={28} className="text-white" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                                    {selectedMember ? `Monitoreo: ${selectedMember.nombre}` : 'Monitoreo del Equipo'}
                                </h1>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
                                    {selectedMember ? 'Línea de tiempo de acciones' : 'Supervisa en tiempo real a los miembros de tu equipo'}
                                </p>
                            </div>
                        </div>

                        {!selectedMember && (
                            <button
                                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all shadow-sm group"
                                onClick={fetchMiembros}
                                title="Actualizar"
                            >
                                <RefreshCw size={18} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            </button>
                        )}
                        {selectedMember && (
                            <button
                                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all shadow-sm group"
                                onClick={() => fetchActividades(selectedMember.id)}
                                title="Actualizar Timeline"
                            >
                                <RefreshCw size={18} className={`${loadingActs ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-semibold">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                {/* Vista de Tarjetas (Grid de Usuarios) */}
                {!selectedMember && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                        {loading ? (
                            <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center py-20">
                                <RefreshCw size={48} className="animate-spin text-indigo-500 mb-4" />
                                <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Cargando equipo...</p>
                            </div>
                        ) : miembros.length === 0 ? (
                            <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm p-6 text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-semibold">Tu equipo no tiene otros miembros además de ti.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {miembros.map(miembro => (
                                    <div 
                                        key={miembro.id} 
                                        onClick={() => setSelectedMember(miembro)}
                                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 cursor-pointer hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                                                {getInitials(miembro.nombre)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{miembro.nombre}</h3>
                                                <p className="text-xs text-gray-500 font-medium">@{miembro.usuario}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 border-t border-gray-100 pt-4">
                                            <span className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${miembro.activo ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                {miembro.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <span className="text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full group-hover:bg-indigo-100 transition-colors">
                                                Ver acciones
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Vista de Línea de Tiempo (Actividades del Usuario Seleccionado) */}
                {selectedMember && (
                    <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden min-h-[400px]">
                        {loadingActs ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <RefreshCw size={48} className="animate-spin text-indigo-500 mb-4" />
                                <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Cargando actividades...</p>
                            </div>
                        ) : actividades.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-semibold">Este usuario no tiene actividades registradas.</p>
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
                )}
            </div>
        </div>
    );
}
