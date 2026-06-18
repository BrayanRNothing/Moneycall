import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Calendar, Phone, MessageSquare, Video, FileText, CheckCircle2, Target, AlertTriangle, ChevronLeft, UserCircle2, Briefcase, Search, Users } from 'lucide-react';

const getEtapaColor = (etapa) => {
    switch (etapa) {
        case 'prospecto_nuevo': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'en_contacto': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'reunion_agendada': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'reunion_realizada': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'negociacion': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'venta_ganada': case 'cliente_activo': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'perdido': return 'bg-rose-50 text-rose-700 border-rose-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

const formatEtapa = (etapa) => {
    if (!etapa) return 'Sin Etapa';
    return etapa.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
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
    const [prospectos, setProspectos] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [filtroHistorial, setFiltroHistorial] = useState('hoy');
    const [tabCartera, setTabCartera] = useState('prospectos');
    const [loading, setLoading] = useState(true);
    const [loadingActs, setLoadingActs] = useState(false);
    const [loadingProps, setLoadingProps] = useState(false);
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

    const fetchProspectos = useCallback(async (miembroId) => {
        setLoadingProps(true);
        try {
            const res = await fetch(`${API_URL}/api/equipos/miembro/${miembroId}/prospectos`, {
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setProspectos(data.prospectos || []);
            }
        } catch (e) {
            console.error('Error fetching prospectos:', e);
        } finally {
            setLoadingProps(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMiembros();
    }, [fetchMiembros]);

    useEffect(() => {
        if (selectedMember) {
            setFiltroHistorial('hoy');
            setTabCartera('prospectos');
            fetchActividades(selectedMember.id);
            fetchProspectos(selectedMember.id);
        }
    }, [selectedMember, fetchActividades, fetchProspectos]);

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
        <div className="min-h-[100%] flex flex-col md:bg-slate-50 md:p-6 bg-white -m-4 md:m-0 p-4 pb-8 md:pb-6 h-full animate-in fade-in duration-500">
            <div className="max-w-full mx-auto space-y-6 flex-1 flex flex-col w-full min-h-0">
                
                {/* Cabecera Principal */}
                <div className="bg-white md:rounded-2xl p-5 border border-slate-200 shadow-sm md:shadow-md transition-all shrink-0">
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
                                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-(--theme-500) to-(--theme-600) flex items-center justify-center shadow-lg shadow-(--theme-500)/20">
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

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] md:text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                                onClick={selectedMember ? () => { fetchActividades(selectedMember.id); fetchProspectos(selectedMember.id); } : fetchMiembros}
                            >
                                <RefreshCw size={14} className={(selectedMember ? (loadingActs || loadingProps) : loading) ? 'animate-spin' : ''} />
                                ACTUALIZAR
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

                {/* Vista de Tarjetas (Grid de Usuarios) */}
                {!selectedMember && (
                    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-white md:rounded-2xl p-5 border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">Miembros Disponibles</h2>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-widest mt-1">Selecciona un miembro para monitorear</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 flex-1">
                                    <RefreshCw size={48} className="animate-spin text-(--theme-500) mb-4" />
                                    <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Cargando equipo...</p>
                                </div>
                            ) : miembros.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex-1 flex flex-col items-center justify-center min-h-0">
                                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-semibold">Tu equipo no tiene otros miembros además de ti.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-2 flex-1 content-start min-h-0">
                                    {miembros.map(miembro => (
                                        <div 
                                            key={miembro.id} 
                                            onClick={() => setSelectedMember(miembro)}
                                            className={`group relative p-5 bg-white border border-gray-200 rounded-2xl transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 cursor-pointer ${!miembro.activo ? 'grayscale opacity-70' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-(--theme-50) to-(--theme-100) text-(--theme-600) flex items-center justify-center font-bold text-lg border border-(--theme-100)">
                                                        {getInitials(miembro.nombre)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 group-hover:text-(--theme-600) transition-colors truncate max-w-[120px]">{miembro.nombre}</h3>
                                                        <p className="text-xs text-gray-400 font-semibold">@{miembro.usuario}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${miembro.activo ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    {miembro.activo ? 'ACTIVO' : 'INACTIVO'}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 mb-6 text-xs text-gray-500 font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        miembro.last_seen && (Date.now() - new Date(miembro.last_seen.endsWith('Z') || miembro.last_seen.includes('+') ? miembro.last_seen : miembro.last_seen.replace(' ', 'T') + 'Z').getTime() < 5 * 60 * 1000) 
                                                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' 
                                                        : 'bg-gray-300'
                                                    }`}></div>
                                                    <span className="uppercase tracking-widest">{miembro.last_seen && (Date.now() - new Date(miembro.last_seen.endsWith('Z') || miembro.last_seen.includes('+') ? miembro.last_seen : miembro.last_seen.replace(' ', 'T') + 'Z').getTime() < 5 * 60 * 1000) ? 'En línea' : 'Desconectado'}</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-50 flex justify-center">
                                                <span className="text-[10px] font-bold text-(--theme-600) bg-(--theme-50) px-4 py-1.5 rounded-xl border border-(--theme-100) group-hover:bg-(--theme-100) transition-colors uppercase tracking-widest">
                                                    MONITOREAR
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Detalles del Usuario Seleccionado (Layout de dos columnas) */}
                {selectedMember && (() => {
                    const esHoy = (fecha) => {
                        const today = new Date();
                        const date = new Date(fecha);
                        return date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear();
                    };

                    const actividadesFiltradas = actividades.filter(act => {
                        if (filtroHistorial === 'hoy') return esHoy(act.fecha || act.createdAt);
                        return true;
                    });

                    const clientesLista = prospectos.filter(p => p.etapaEmbudo === 'cliente_activo' || p.etapaEmbudo === 'venta_ganada');
                    const prospectosLista = prospectos.filter(p => p.etapaEmbudo !== 'cliente_activo' && p.etapaEmbudo !== 'venta_ganada');
                    const carteraActiva = tabCartera === 'prospectos' ? prospectosLista : clientesLista;

                    return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            
                            {/* Columna Historial de Interacción */}
                            <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0">
                                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-(--theme-50) rounded-lg">
                                            <Activity size={18} className="text-(--theme-600)" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 leading-tight">Historial</h2>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">Actividades del usuario</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                        <button 
                                            onClick={() => setFiltroHistorial('hoy')}
                                            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${filtroHistorial === 'hoy' ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            Hoy
                                        </button>
                                        <button 
                                            onClick={() => setFiltroHistorial('global')}
                                            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${filtroHistorial === 'global' ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            Global
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 sm:p-5 flex-1 overflow-y-auto content-start min-h-0 custom-scrollbar pr-2">
                                    {loadingActs ? (
                                        <div className="flex flex-col items-center justify-center py-20 flex-1">
                                            <RefreshCw size={32} className="animate-spin text-(--theme-500) mb-4" />
                                        </div>
                                    ) : actividadesFiltradas.length === 0 ? (
                                        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                                            <Activity size={32} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-gray-500 text-sm font-semibold">No hay interacciones {filtroHistorial === 'hoy' ? 'para hoy' : 'registradas'}.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {actividadesFiltradas.map((act) => (
                                                <div key={act.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-(--theme-100) transition-all flex flex-col gap-3 group">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2.5 rounded-xl border shrink-0 group-hover:scale-105 transition-transform ${getTipoColor(act.tipo)}`}>
                                                            {getIcon(act.tipo)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="text-sm font-bold text-gray-900 capitalize">{act.tipo}</h3>
                                                                    {act.resultado && (
                                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${act.resultado === 'exitoso' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                                                            {act.resultado}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] font-semibold text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                                    {new Date(act.fecha || act.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                </div>
                                                            </div>
                                                            {act.cliente && (
                                                                <p className="text-[11px] font-medium text-gray-600 truncate mt-1">
                                                                    Con: <span className="font-bold text-gray-800">{act.cliente.nombres} {act.cliente.apellidoPaterno}</span>
                                                                </p>
                                                            )}
                                                            {act.descripcion && (
                                                                <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">{act.descripcion}</p>
                                                            )}
                                                            {act.notas && (
                                                                <p className="text-xs text-gray-500 italic mt-2 border-l-2 border-(--theme-300) pl-2">
                                                                    "{act.notas}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Columna Cartera */}
                            <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0">
                                <div className="p-4 sm:p-5 border-b border-gray-100 shrink-0">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-(--theme-50) rounded-lg">
                                            <Briefcase size={18} className="text-(--theme-600)" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 leading-tight">Cartera</h2>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">Contactos asignados</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                        <button 
                                            onClick={() => setTabCartera('prospectos')}
                                            className={`flex-1 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tabCartera === 'prospectos' ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            Prospectos <span className={`px-2 py-0.5 rounded-full text-[9px] ${tabCartera === 'prospectos' ? 'bg-(--theme-50) text-(--theme-600)' : 'bg-gray-200 text-gray-500'}`}>{prospectosLista.length}</span>
                                        </button>
                                        <button 
                                            onClick={() => setTabCartera('clientes')}
                                            className={`flex-1 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tabCartera === 'clientes' ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            Clientes <span className={`px-2 py-0.5 rounded-full text-[9px] ${tabCartera === 'clientes' ? 'bg-(--theme-50) text-(--theme-600)' : 'bg-gray-200 text-gray-500'}`}>{clientesLista.length}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-5 flex-1 overflow-y-auto content-start min-h-0 custom-scrollbar pr-2">
                                    {loadingProps ? (
                                        <div className="flex flex-col items-center justify-center py-20 flex-1">
                                            <RefreshCw size={32} className="animate-spin text-(--theme-500) mb-4" />
                                        </div>
                                    ) : carteraActiva.length === 0 ? (
                                        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                                            <Briefcase size={32} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-gray-500 text-sm font-semibold">No hay {tabCartera} asignados.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {carteraActiva.map((p) => (
                                                <div key={p.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-(--theme-100) transition-all group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm group-hover:text-(--theme-600) transition-colors">{p.nombres} {p.apellidoPaterno}</div>
                                                            <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-1">
                                                                <Briefcase size={10} className="text-gray-400" /> {p.empresa || 'Sin empresa'}
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-bold tracking-tighter uppercase border ${getEtapaColor(p.etapaEmbudo)}`}>
                                                            {formatEtapa(p.etapaEmbudo)}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-gray-50">
                                                        {p.telefono && (
                                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                                <Phone size={10} className="text-gray-400" /> {p.telefono}
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                            <Calendar size={10} className="text-gray-400" />
                                                            {p.ultimaInteraccion ? new Date(p.ultimaInteraccion).toLocaleDateString() : 'Nunca'}
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
                })()}
            </div>
        </div>
    );
}
