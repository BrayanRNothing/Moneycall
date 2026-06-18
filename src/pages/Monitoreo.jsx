import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Activity, RefreshCw, Calendar, Phone, MessageSquare, Video, FileText, 
    CheckCircle2, Target, AlertTriangle, ChevronLeft, UserCircle2, 
    Briefcase, Search, Users, DollarSign, Award, Percent, TrendingUp 
} from 'lucide-react';
import { getUser, getToken } from '../utils/authUtils';
import API_URL from '../config/api';
import { useTranslation } from '../utils/translations';

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

const esHoy = (fecha) => {
    const today = new Date();
    const date = new Date(fecha);
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

export default function Monitoreo() {
    const { t } = useTranslation();
    const userAuth = getUser();
    const token = getToken();
    
    const [miembros, setMiembros] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [prospectos, setProspectos] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [filtroHistorial, setFiltroHistorial] = useState('hoy');
    const [selectedActivityType, setSelectedActivityType] = useState('all');
    const [tabCartera, setTabCartera] = useState('prospectos');
    const [loading, setLoading] = useState(true);
    const [loadingActs, setLoadingActs] = useState(false);
    const [loadingProps, setLoadingProps] = useState(false);
    const [error, setError] = useState('');

    const fetchMiembrosConDatos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/equipos/mi-equipo`, {
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            });
            if (!res.ok) throw new Error((await res.json()).mensaje || 'Error al cargar miembros');
            const data = await res.json();
            const filteredMembers = (data.miembros || []).filter(m => String(m.id) !== String(userAuth?.id));
            
            // Cargar prospectos y actividades de cada miembro en paralelo para calcular métricas
            const membersWithData = await Promise.all(filteredMembers.map(async (m) => {
                let memberProps = [];
                let memberActs = [];
                try {
                    const propsRes = await fetch(`${API_URL}/api/equipos/miembro/${m.id}/prospectos`, {
                        headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
                    });
                    if (propsRes.ok) {
                        const propsData = await propsRes.json();
                        memberProps = propsData.prospectos || [];
                    }
                } catch (e) {
                    console.error('Error fetching prospects for member', m.id, e);
                }

                try {
                    const actsRes = await fetch(`${API_URL}/api/equipos/monitoreo/actividades?limit=200&miembro_id=${m.id}`, {
                        headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
                    });
                    if (actsRes.ok) {
                        const actsData = await actsRes.json();
                        memberActs = actsData.actividades || [];
                    }
                } catch (e) {
                    console.error('Error fetching activities for member', m.id, e);
                }

                return {
                    ...m,
                    prospectos: memberProps,
                    actividades: memberActs
                };
            }));

            setMiembros(membersWithData);
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
        fetchMiembrosConDatos();
    }, [fetchMiembrosConDatos]);

    useEffect(() => {
        if (selectedMember) {
            setFiltroHistorial('hoy');
            setSelectedActivityType('all');
            setTabCartera('prospectos');
            fetchActividades(selectedMember.id);
            fetchProspectos(selectedMember.id);
        }
    }, [selectedMember, fetchActividades, fetchProspectos]);

    // Calcular KPIs agregados del equipo
    const teamKpis = useMemo(() => {
        let totalLeads = 0;
        let totalPipelineValue = 0;
        let totalTodayActs = 0;
        let totalReuniones = 0;
        let reunionesRealizadas = 0;

        miembros.forEach(m => {
            const props = m.prospectos || [];
            const acts = m.actividades || [];

            totalLeads += props.length;

            const activeProps = props.filter(p => p.etapaEmbudo !== 'venta_ganada' && p.etapaEmbudo !== 'perdido' && p.etapaEmbudo !== 'cliente_activo');
            totalPipelineValue += activeProps.reduce((sum, p) => sum + (parseFloat(p.monto || p.valor) || 0), 0);

            totalTodayActs += acts.filter(act => esHoy(act.fecha || act.createdAt)).length;

            const memberReuniones = acts.filter(act => act.tipo === 'reunion' || act.tipo === 'cita');
            totalReuniones += memberReuniones.length;
            reunionesRealizadas += memberReuniones.filter(act => act.resultado === 'exitoso').length;
        });

        const showUpRate = totalReuniones > 0 ? (reunionesRealizadas / totalReuniones) * 100 : 0;

        return {
            totalLeads,
            totalPipelineValue,
            totalTodayActs,
            showUpRate
        };
    }, [miembros]);

    // Calcular estadísticas individuales de miembros para el Leaderboard
    const miembrosStats = useMemo(() => {
        return miembros.map(m => {
            const props = m.prospectos || [];
            const acts = m.actividades || [];

            const activeProps = props.filter(p => p.etapaEmbudo !== 'venta_ganada' && p.etapaEmbudo !== 'perdido' && p.etapaEmbudo !== 'cliente_activo');
            const activeClients = props.filter(p => p.etapaEmbudo === 'venta_ganada' || p.etapaEmbudo === 'cliente_activo');
            const pipelineValue = activeProps.reduce((sum, p) => sum + (parseFloat(p.monto || p.valor) || 0), 0);

            const todayActs = acts.filter(act => esHoy(act.fecha || act.createdAt)).length;

            const memberReuniones = acts.filter(act => act.tipo === 'reunion' || act.tipo === 'cita');
            const realizadas = memberReuniones.filter(act => act.resultado === 'exitoso').length;
            const showUpRate = memberReuniones.length > 0 ? (realizadas / memberReuniones.length) * 100 : 0;

            const isOnline = m.last_seen && (Date.now() - new Date(m.last_seen.endsWith('Z') || m.last_seen.includes('+') ? m.last_seen : m.last_seen.replace(' ', 'T') + 'Z').getTime() < 5 * 60 * 1000);

            return {
                id: m.id,
                nombre: m.nombre,
                usuario: m.usuario,
                activo: m.activo,
                isOnline,
                activePropsCount: activeProps.length,
                activeClientsCount: activeClients.length,
                pipelineValue,
                todayActsCount: todayActs,
                showUpRate,
                rawMiembro: m
            };
        });
    }, [miembros]);

    if (!userAuth?.esOwner && userAuth?.rol !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-screen">
                <AlertTriangle size={64} className="text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">{t('Acceso Denegado')}</h2>
                <p className="text-gray-500">{t('Solo el propietario del equipo puede acceder a esta sección.')}</p>
            </div>
        );
    }

    const formatMoney = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

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
                                    {selectedMember ? `${t('Monitoreo: ')}${selectedMember.nombre}` : t('Monitoreo del Equipo')}
                                </h1>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
                                    {selectedMember ? t('Línea de tiempo de acciones') : t('Supervisa en tiempo real a los miembros de tu equipo')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] md:text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                                onClick={selectedMember ? () => { fetchActividades(selectedMember.id); fetchProspectos(selectedMember.id); } : fetchMiembrosConDatos}
                            >
                                <RefreshCw size={14} className={(selectedMember ? (loadingActs || loadingProps) : loading) ? 'animate-spin' : ''} />
                                {t('ACTUALIZAR')}
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

                {/* Vista Principal de Monitoreo (Leaderboard + KPIs) */}
                {!selectedMember && (
                    <div className="flex-1 flex flex-col gap-6 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* KPIs Agregados del Equipo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{t('Miembros Disponibles')}</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{miembros.length}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{t('Contactos asignados')}</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{teamKpis.totalLeads}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{t('Pipeline Activo')}</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{formatMoney(teamKpis.totalPipelineValue)}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{t('Interacciones Hoy')}</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{teamKpis.totalTodayActs}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard / Tabla de Rendimiento */}
                        <div className="bg-white md:rounded-2xl p-5 border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{t('Miembros Disponibles')}</h2>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-widest mt-1">{t('Selecciona un miembro para monitorear')}</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 flex-1">
                                    <RefreshCw size={48} className="animate-spin text-(--theme-500) mb-4" />
                                    <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">{t('Cargando equipo...')}</p>
                                </div>
                            ) : miembros.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex-1 flex flex-col items-center justify-center min-h-0">
                                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-semibold">{t('Tu equipo no tiene otros miembros además de ti.')}</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-x-auto min-h-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                                <th className="pb-3 pl-4">{t('Nombre')}</th>
                                                <th className="pb-3 text-center">{t('Estado de Cuenta')}</th>
                                                <th className="pb-3 text-center">{t('Prospectos ')}</th>
                                                <th className="pb-3 text-center">{t('Clientes ')}</th>
                                                <th className="pb-3 text-center">{t('Interacciones Hoy')}</th>
                                                <th className="pb-3 text-center">{t('Pipeline Activo')}</th>
                                                <th className="pb-3 text-center">{t('Tasa de Asistencia de Citas')}</th>
                                                <th className="pb-3 pr-4 text-right">{t('Acciones')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-sm">
                                            {miembrosStats.map(m => (
                                                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors group">
                                                    <td className="py-4 pl-4 font-semibold text-gray-900">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-(--theme-50) to-(--theme-100) text-(--theme-600) flex items-center justify-center font-bold text-sm border border-(--theme-100)">
                                                                    {getInitials(m.nombre)}
                                                                </div>
                                                                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${m.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{m.nombre}</p>
                                                                <p className="text-xs text-gray-400">@{m.usuario}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${m.activo ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                            {m.activo ? t('En línea').toUpperCase() : t('Desconectado').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-center font-bold text-slate-700">{m.activePropsCount}</td>
                                                    <td className="py-4 text-center font-bold text-slate-700">{m.activeClientsCount}</td>
                                                    <td className="py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="font-black text-indigo-600">{m.todayActsCount}</span>
                                                            <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                                <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (m.todayActsCount / 10) * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-center font-black text-gray-900">{formatMoney(m.pipelineValue)}</td>
                                                    <td className="py-4 text-center">
                                                        <span className={`font-black ${m.showUpRate >= 75 ? 'text-emerald-600' : m.showUpRate >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                            {m.showUpRate.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td className="py-4 pr-4 text-right">
                                                        <button 
                                                            onClick={() => setSelectedMember(m.rawMiembro)}
                                                            className="px-3.5 py-1.5 bg-(--theme-50) text-(--theme-600) font-bold text-xs rounded-xl border border-(--theme-100) hover:bg-(--theme-600) hover:text-white transition-all duration-300 uppercase tracking-wider"
                                                        >
                                                            {t('MONITOREAR')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Detalles del Miembro Seleccionado */}
                {selectedMember && (() => {
                    const clientesLista = prospectos.filter(p => p.etapaEmbudo === 'cliente_activo' || p.etapaEmbudo === 'venta_ganada');
                    const prospectosLista = prospectos.filter(p => p.etapaEmbudo !== 'cliente_activo' && p.etapaEmbudo !== 'venta_ganada');
                    const carteraActiva = tabCartera === 'prospectos' ? prospectosLista : clientesLista;

                    // Filtrado avanzado de historial
                    const actividadesFiltradas = actividades.filter(act => {
                        const matchesTime = filtroHistorial === 'hoy' ? esHoy(act.fecha || act.createdAt) : true;
                        if (!matchesTime) return false;
                        if (selectedActivityType === 'all') return true;
                        return act.tipo === selectedActivityType;
                    });

                    return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            
                            {/* Columna Historial de Interacción */}
                            <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0">
                                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col gap-4 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-(--theme-50) rounded-lg">
                                                <Activity size={18} className="text-(--theme-600)" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-gray-900 leading-tight">{t('Historial')}</h2>
                                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">{t('Actividades del usuario')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                            <button 
                                                onClick={() => setFiltroHistorial('hoy')}
                                                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${filtroHistorial === 'hoy' ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                {t('Hoy')}
                                            </button>
                                            <button 
                                                onClick={() => setFiltroHistorial('global')}
                                                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${filtroHistorial === 'global' ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                {t('Global')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filtros avanzados de tipo de actividad */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { key: 'all', label: 'Todos' },
                                            { key: 'llamada', label: 'Llamadas' },
                                            { key: 'whatsapp', label: 'WhatsApp' },
                                            { key: 'reunion', label: 'Citas' },
                                            { key: 'correo', label: 'Correos' },
                                            { key: 'cambio_etapa', label: 'Etapa' }
                                        ].map(opt => (
                                            <button
                                                key={opt.key}
                                                onClick={() => setSelectedActivityType(opt.key)}
                                                className={`px-2.5 py-1 text-[9px] uppercase tracking-wider font-extrabold rounded-lg border transition-all ${selectedActivityType === opt.key ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                {t(opt.label)}
                                            </button>
                                        ))}
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
                                            <p className="text-gray-500 text-sm font-semibold">{t('No hay interacciones')} {filtroHistorial === 'hoy' ? t('para hoy') : t('registradas')}.</p>
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
                                                                    <h3 className="text-sm font-bold text-gray-900 capitalize">{t(act.tipo)}</h3>
                                                                    {act.resultado && (
                                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${act.resultado === 'exitoso' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                                                            {t(act.resultado)}
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
                                            <h2 className="text-base font-bold text-gray-900 leading-tight">{t('Cartera')}</h2>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">{t('Contactos asignados')}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                        <button 
                                            onClick={() => setTabCartera('prospectos')}
                                            className={`flex-1 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tabCartera === 'prospectos' ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {t('Prospectos ')} <span className={`px-2 py-0.5 rounded-full text-[9px] ${tabCartera === 'prospectos' ? 'bg-(--theme-50) text-(--theme-600)' : 'bg-gray-200 text-gray-500'}`}>{prospectosLista.length}</span>
                                        </button>
                                        <button 
                                            onClick={() => setTabCartera('clientes')}
                                            className={`flex-1 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tabCartera === 'clientes' ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {t('Clientes ')} <span className={`px-2 py-0.5 rounded-full text-[9px] ${tabCartera === 'clientes' ? 'bg-(--theme-50) text-(--theme-600)' : 'bg-gray-200 text-gray-500'}`}>{clientesLista.length}</span>
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
                                            <p className="text-gray-500 text-sm font-semibold">{t('No hay ')}{t(tabCartera)} {t('asignados.')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {carteraActiva.map((p) => (
                                                <div key={p.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-(--theme-100) transition-all group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm group-hover:text-(--theme-600) transition-colors">{p.nombres} {p.apellidoPaterno}</div>
                                                            <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-1">
                                                                <Briefcase size={10} className="text-gray-400" /> {p.empresa || t('Sin empresa')}
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-bold tracking-tighter uppercase border ${getEtapaColor(p.etapaEmbudo)}`}>
                                                            {t(p.etapaEmbudo)}
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
                                                            {p.ultimaInteraccion ? new Date(p.ultimaInteraccion).toLocaleDateString() : t('Nunca')}
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
