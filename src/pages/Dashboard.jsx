 import { useTranslation } from '../utils/translations';
import React, { useState, useEffect } from 'react';
import { Phone, UserPlus, Calendar, TrendingUp, RefreshCw, Clock, CheckCircle2, Target, MessageSquare, ExternalLink, Users, Award, DollarSign, AlertTriangle, TrendingDown, Zap, Bell, ArrowRightLeft, PercentCircle, BarChart3, Search, FileText, Video, Globe, XCircle, Plus, Pencil, Trash2, Activity, ChevronRight, LogIn, LogOut, History, MousePointer2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FunnelVisual from '../components/FunnelVisual';

import API_URL from '../config/api';
import socket from '../config/socket';
import StatCard from '../components/ui/StatCard';

import MetricKPICard from '../components/ui/MetricKPICard';
import NotificacionesBell from '../components/NotificacionesBell';
import toast from 'react-hot-toast';
import useConfirmStore from '../store/confirmStore';

const PERIODOS = [
    { key: 'dia', label: 'Hoy', suffix: 'hoy' },
    { key: 'semana', label: 'Semana', suffix: 'esta semana' },
    { key: 'mes', label: 'Mes', suffix: 'este mes' },
    { key: 'total', label: 'Total', suffix: 'en total' },
];

const EMPTY_PERIODO = { llamadas: 0, mensajes: 0, prospectos: 0, reuniones: 0 };
const INITIAL_VENDEDOR_DATA = {
    embudo: { prospecto_nuevo: 0, en_contacto: 0, reunion_agendada: 0, transferidos: 0, total: 0 },
    tasasConversion: { contacto: 0, agendamiento: 0 },
    periodos: { dia: EMPTY_PERIODO, semana: EMPTY_PERIODO, mes: EMPTY_PERIODO, total: EMPTY_PERIODO }
};

const INITIAL_CLOSER_DATA = {
    embudo: { reunion_agendada: 0, reunion_realizada: 0, propuesta_enviada: 0, venta_ganada: 0 },
    metricas: {
        reuniones: { hoy: 0, pendientes: 0, realizadas: 0, realizadasHoy: 0, propuestasHoy: 0 },
        ventas: { mes: 0, montoMes: 0, totales: 0, montoTotal: 0, ventasHoy: 0 },
    },
    tasasConversion: { asistencia: 0, interes: 0, cierre: 0 },
    analisisPerdidas: { no_asistio: 0, no_interesado: 0 },
    analisisPerdidasPremium: {},
    analisisFuentes: {},
    eficiencia: { cicloVentaDias: 0, responseTimeHoras: 0, leadsEstancados: 0 },
    periodos: {
        dia: { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 },
        semana: { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 },
        mes: { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 },
        total: { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 }
    }
};

const GOAL_LABELS = {
    ventas_monto: 'Meta ventas $',
    ventas_cantidad: 'Meta ventas #',
    clientes: 'Meta clientes',
    actividades: 'Meta actividades'
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const clampPercent = (value) => Math.max(0, Math.min(100, toNumber(value)));
const formatPercent = (value) => `${clampPercent(value).toFixed(1)}%`;

const sanitizeVendedorData = (rawData) => {
    const getNumero = (val) => {
        const num = parseFloat(val);
        return Number.isFinite(num) ? num : 0;
    };

    const fallbackDia = {
        llamadas: getNumero(rawData?.metricas?.llamadas?.hoy),
        mensajes: getNumero(rawData?.metricas?.correosEnviados),
        prospectos: getNumero(rawData?.metricas?.prospectosHoy),
        reuniones: getNumero(rawData?.metricas?.reunionesAgendadas?.hoy)
    };

    const fallbackTotal = {
        llamadas: getNumero(rawData?.metricas?.llamadas?.totales),
        mensajes: 0,
        prospectos: getNumero(rawData?.embudo?.total),
        reuniones: getNumero(rawData?.metricas?.reunionesAgendadas?.totales)
    };

    return {
        embudo: {
            total: getNumero(rawData?.embudo?.total),
            prospecto_nuevo: getNumero(rawData?.embudo?.prospecto_nuevo),
            en_contacto: getNumero(rawData?.embudo?.en_contacto),
            reunion_agendada: getNumero(rawData?.embudo?.reunion_agendada),
            transferidos: getNumero(rawData?.embudo?.transferidos)
        },
        tasasConversion: {
            contacto: getNumero(rawData?.tasasConversion?.contacto),
            agendamiento: getNumero(rawData?.tasasConversion?.agendamiento)
        },
        periodos: {
            dia: {
                llamadas: getNumero(rawData?.periodos?.dia?.llamadas ?? fallbackDia.llamadas),
                mensajes: getNumero(rawData?.periodos?.dia?.mensajes ?? fallbackDia.mensajes),
                prospectos: getNumero(rawData?.periodos?.dia?.prospectos ?? fallbackDia.prospectos),
                reuniones: getNumero(rawData?.periodos?.dia?.reuniones ?? fallbackDia.reuniones)
            },
            semana: {
                llamadas: getNumero(rawData?.periodos?.semana?.llamadas),
                mensajes: getNumero(rawData?.periodos?.semana?.mensajes),
                prospectos: getNumero(rawData?.periodos?.semana?.prospectos),
                reuniones: getNumero(rawData?.periodos?.semana?.reuniones)
            },
            mes: {
                llamadas: getNumero(rawData?.periodos?.mes?.llamadas),
                mensajes: getNumero(rawData?.periodos?.mes?.mensajes),
                prospectos: getNumero(rawData?.periodos?.mes?.prospectos),
                reuniones: getNumero(rawData?.periodos?.mes?.reuniones)
            },
            total: {
                llamadas: getNumero(rawData?.periodos?.total?.llamadas ?? fallbackTotal.llamadas),
                mensajes: getNumero(rawData?.periodos?.total?.mensajes ?? fallbackTotal.mensajes),
                prospectos: getNumero(rawData?.periodos?.total?.prospectos ?? fallbackTotal.prospectos),
                reuniones: getNumero(rawData?.periodos?.total?.reuniones ?? fallbackTotal.reuniones)
            }
        },
        analisisFuentes: rawData?.analisisFuentes || {}
    };
};

import { getToken } from '../utils/authUtils';
import useWindowSize from '../hooks/useWindowSize';
import DashboardMobile from './DashboardMobile';

const getAuthHeaders = () => ({ 'x-auth-token': getToken() || '' });

const ProactiveRatioDoughnut = ({ proactiveCount, reactiveCount }) => {
    const total = proactiveCount + reactiveCount;
    const pctProactive = total > 0 ? (proactiveCount / total) * 100 : 0;
    const pctReactive = total > 0 ? (reactiveCount / total) * 100 : 0;

    const size = 150;
    const strokeWidth = 14;
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    
    const strokeDashoffsetProactive = total > 0 
        ? circumference - (pctProactive / 100) * circumference 
        : circumference;

    const strokeDashoffsetReactive = total > 0 ? 0 : circumference;
    const bgCircleClass = "stroke-gray-100";

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                    <defs>
                        <linearGradient id="proactiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="reactiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                    </defs>
                    {/* Background circle */}
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        fill="transparent"
                        className={bgCircleClass}
                        strokeWidth={strokeWidth}
                    />
                    {/* Reactive (Inbound) circle */}
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        fill="transparent"
                        stroke="url(#reactiveGrad)"
                        className="transition-all duration-1000 ease-out"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffsetReactive}
                    />
                    {/* Proactive (Outbound) circle */}
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        fill="transparent"
                        stroke="url(#proactiveGrad)"
                        className="transition-all duration-1000 ease-out"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffsetProactive}
                        strokeLinecap="round"
                    />
                </svg>
                
                {/* Central Value */}
                <div className="absolute flex flex-col items-center justify-center z-20">
                    <span className="text-3xl font-black text-gray-800 tracking-tighter">
                        {pctProactive.toFixed(0)}<span className="text-xl text-gray-400">%</span>
                    </span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        {total > 0 ? "PROACTIVO" : "SIN DATOS"}
                    </span>
                </div>
            </div>
            
            <div className="flex justify-center w-full mt-4 gap-6 pt-4 border-t border-gray-100/80">
                {/* Proactiva Legend */}
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 shadow-xs"></div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Saliente</span>
                        <span className="text-emerald-600 font-black text-xs leading-none">{pctProactive.toFixed(1)}%</span>
                    </div>
                </div>
                
                <div className="w-px h-5 bg-gray-200 rounded-full"></div>

                {/* Reactiva Legend */}
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-linear-to-br from-amber-400 to-amber-600 shadow-xs"></div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Entrante</span>
                        <span className="text-amber-500 font-black text-xs leading-none">{pctReactive.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { t } = useTranslation();
    const { width } = useWindowSize();
    const [loading, setLoading] = useState(true);

    const [vendedorData, setVendedorData] = useState(null);
    const [closerData, setCloserData] = useState(null);
    const [recordatorios, setRecordatorios] = useState([]);
    const [reuniones, setReuniones] = useState([]);
    const [sidebarTab, setSidebarTab] = useState('recordatorios');

    const [loadingReuniones, setLoadingReuniones] = useState(true);
    const [periodo, setPeriodo] = useState('dia');
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let y = 2024; y <= currentYear + 1; y++) {
        yearsList.push(y);
    }

    const [healthTab, setHealthTab] = useState('resumen');
    const [actividades, setActividades] = useState([]);
    const [loadingActividades, setLoadingActividades] = useState(false);

    const fetchActividades = async () => {
        try {
            setLoadingActividades(true);
            const res = await axios.get(`${API_URL}/api/actividades`, {
                headers: getAuthHeaders()
            });
            const data = Array.isArray(res.data) ? res.data : [];
            setActividades(data);
        } catch (error) {
            console.error('Error al cargar actividades:', error);
            setActividades([]);
        } finally {
            setLoadingActividades(false);
        }
    };

    useEffect(() => {
        if (healthTab === 'acciones' || healthTab === 'moneycall') {
            fetchActividades();
        }
    }, [healthTab]);
    const [metasEquipo, setMetasEquipo] = useState([]);
    const [teamTasks, setTeamTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [newTask, setNewTask] = useState({ titulo: '', descripcion: '', prioridad: 'media' });
    const navigate = useNavigate();

    const handleReunionClick = (reunion) => {
        const isClient = reunion.cliente?.esCliente || ['venta_ganada', 'cliente_activo', 'cotizacion_realizada', 'contrato_firmado', 'esperando_pago'].includes(reunion.cliente?.etapaEmbudo);
        const targetPath = isClient ? '/vendedor/clientes' : '/vendedor/prospectos';
        const clientVal = reunion.clienteId || reunion.cliente?.id || reunion.cliente?._id;
        if (clientVal) {
            navigate(targetPath, { state: { selectedId: clientVal }, replace: true });
        }
    };

    const sanitizeCloserData = (rawData) => {
        if (!rawData) return INITIAL_CLOSER_DATA;
        const getNumero = (val) => { const num = parseFloat(val); return isNaN(num) || num === null ? 0 : num; };
        return {
            ...rawData,
            embudo: {
                reunion_agendada: getNumero(rawData?.embudo?.reunion_agendada),
                reunion_realizada: getNumero(rawData?.embudo?.reunion_realizada),
                propuesta_enviada: getNumero(rawData?.embudo?.propuesta_enviada),
                venta_ganada: getNumero(rawData?.embudo?.venta_ganada)
            },
            metricas: {
                reuniones: {
                    hoy: getNumero(rawData?.metricas?.reuniones?.hoy),
                    pendientes: getNumero(rawData?.metricas?.reuniones?.pendientes),
                    realizadas: getNumero(rawData?.metricas?.reuniones?.realizadas),
                    realizadasHoy: getNumero(rawData?.metricas?.reuniones?.realizadasHoy),
                    propuestasHoy: getNumero(rawData?.metricas?.reuniones?.propuestasHoy)
                },
                ventas: {
                    mes: getNumero(rawData?.metricas?.ventas?.mes),
                    montoMes: getNumero(rawData?.metricas?.ventas?.montoMes),
                    totales: getNumero(rawData?.metricas?.ventas?.totales),
                    montoTotal: getNumero(rawData?.metricas?.ventas?.montoTotal),
                    ventasHoy: getNumero(rawData?.metricas?.ventas?.ventasHoy)
                }
            },
            tasasConversion: {
                asistencia: getNumero(rawData?.tasasConversion?.asistencia),
                asistenciaDetalle: rawData?.tasasConversion?.asistenciaDetalle || '',
                interes: getNumero(rawData?.tasasConversion?.interes),
                cierre: getNumero(rawData?.tasasConversion?.cierre)
            },
            periodos: rawData?.periodos || {
                dia: { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 },
                semana: { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 },
                mes: { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 },
                total: { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 }
            },
            analisisPerdidas: {
                no_asistio: getNumero(rawData?.analisisPerdidas?.no_asistio),
                no_interesado: getNumero(rawData?.analisisPerdidas?.no_interesado)
            },
            analisisPerdidasPremium: rawData?.analisisPerdidasPremium || {},
            analisisFuentes: rawData?.analisisFuentes || {},
            eficiencia: rawData?.eficiencia || { cicloVentaDias: 0, responseTimeHoras: 0, leadsEstancados: 0 }
        };
    };

    const cargarMetasEquipo = async () => {
        try {
            const periodoMeta = new Date().toISOString().slice(0, 7);
            const res = await axios.get(`${API_URL}/api/equipos/mi-equipo/metricas`, {
                headers: getAuthHeaders(),
                params: { periodo: periodoMeta }
            });

            const metricas = Array.isArray(res.data?.metricas) ? res.data.metricas : [];
            const acumuladas = new Map();

            for (const m of metricas) {
                const goals = Array.isArray(m.goals) ? m.goals : [];
                for (const g of goals) {
                    const tipo = String(g.tipo || '');
                    if (!tipo) continue;
                    const curr = acumuladas.get(tipo) || { tipo, objetivo: 0, actual: 0 };
                    curr.objetivo += toNumber(g.objetivo);
                    curr.actual += toNumber(g.actual);
                    acumuladas.set(tipo, curr);
                }
            }

            const resumen = Array.from(acumuladas.values())
                .map((g) => ({
                    ...g,
                    progreso: g.objetivo > 0 ? clampPercent((g.actual / g.objetivo) * 100) : 0
                }))
                .sort((a, b) => b.progreso - a.progreso);

            setMetasEquipo(resumen);
        } catch (error) {
            setMetasEquipo([]);
        }
    };

    const cargarDatos = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            try {
                const resP = await axios.get(`${API_URL}/api/vendedor/dashboard`, {
                    headers: getAuthHeaders(),
                    params: { mes: selectedMonth, anio: selectedYear }
                });
                setVendedorData(sanitizeVendedorData(resP.data));
            } catch (e) {
                console.error('Error prospector data:', e);
                setVendedorData(INITIAL_VENDEDOR_DATA);
            }

            try {
                const resC = await axios.get(`${API_URL}/api/vendedor/dashboard-closer`, {
                    headers: getAuthHeaders(),
                    params: { mes: selectedMonth, anio: selectedYear }
                });
                setCloserData(sanitizeCloserData(resC.data));
            } catch (e) {
                console.error('Error closer data:', e);
                setCloserData(INITIAL_CLOSER_DATA);
            }

        } catch (error) {
            console.error('Error cargando dashboard unificado', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const cargarListas = async (silent = false) => {
        if (!silent) {
            setLoadingReuniones(true);
        }
        try {
            const getItemKey = (item, fallbackFields = []) => {
                const directId = item?.id || item?._id;
                if (directId !== null && directId !== undefined && directId !== '') {
                    return String(directId);
                }

                return fallbackFields
                    .map((field) => {
                        const value = item?.[field];
                        if (value === null || value === undefined) return '';
                        if (field === 'fecha' || field === 'proximaLlamada') {
                            const dateValue = new Date(value);
                            return Number.isNaN(dateValue.getTime()) ? String(value) : dateValue.toISOString();
                        }
                        return String(value);
                    })
                    .join('|');
            };

            try {
                const resR = await axios.get(`${API_URL}/api/vendedor/calendario`, { headers: getAuthHeaders() });
                const ahora = new Date();
                const proximas = resR.data.filter(r => {
                    const fecha = new Date(r.fecha);
                    const esPendiente = r.resultado === 'pendiente' || !r.resultado;
                    return fecha >= ahora && esPendiente;
                });
                const reunionesUnicas = [];
                const reunionesVistas = new Set();

                proximas
                    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                    .forEach((reunion) => {
                        const key = getItemKey(reunion, ['fecha', 'clienteId', 'resultado']);
                        if (!reunionesVistas.has(key)) {
                            reunionesVistas.add(key);
                            reunionesUnicas.push(reunion);
                        }
                    });

                setReuniones(reunionesUnicas.slice(0, 3));
            } catch (e) {
                console.error('Error calendario data:', e);
            }
            if (!silent) setLoadingReuniones(false);

            try {
                // 1. Obtener prospectos con recordatorio, clientes ganados, y recordatorios de la base de tareas
                const [resProspectos, resClientes, resTareas] = await Promise.allSettled([
                    axios.get(`${API_URL}/api/vendedor/prospectos`, { headers: getAuthHeaders() }),
                    axios.get(`${API_URL}/api/vendedor/clientes-ganados`, { headers: getAuthHeaders() }),
                    axios.get(`${API_URL}/api/tareas`, { headers: getAuthHeaders() })
                ]);

                const todosLosPendientes = [];
                const pendientesVistos = new Set();

                if (resProspectos.status === 'fulfilled') {
                    const prospectosData = resProspectos.value.data.data ? resProspectos.value.data.data : resProspectos.value.data;
                    const leads = (prospectosData || []).filter(p => !!p.proximaLlamada && (p.nombres || p.nombre));
                    leads.forEach((lead) => {
                        const key = getItemKey(lead, ['proximaLlamada', 'nombres', 'apellidoPaterno', 'telefono']);
                        if (!pendientesVistos.has(key)) {
                            pendientesVistos.add(key);
                            todosLosPendientes.push(lead);
                        }
                    });
                }

                if (resClientes.status === 'fulfilled') {
                    const clientesConRec = (resClientes.value.data || []).filter(c => !!c.proximaLlamada && (c.nombres || c.nombre));
                    // Marcamos que son clientes ganados para identificarlos
                    clientesConRec.forEach(c => {
                        const key = getItemKey(c, ['proximaLlamada', 'nombres', 'apellidoPaterno', 'telefono']);
                        if (!pendientesVistos.has(key)) {
                            pendientesVistos.add(key);
                            todosLosPendientes.push({ ...c, esCliente: true });
                        }
                    });
                }

                // Cargar también las "Tareas" que son "Recordatorio de llamada"
                if (resTareas.status === 'fulfilled') {
                    // Solo consideramos tareas huérfanas si aún tienen el nombre del cliente (clienteNombre válido). Si clienteNombre es null, el cliente fue borrado
                    const tareasRecordatorios = (resTareas.value.data || []).filter(t => t.titulo === 'Recordatorio de llamada' && t.estado === 'pendiente' && t.clienteNombre);

                    tareasRecordatorios.forEach(t => {
                        // Verificamos si ese cliente ya tiene un recordatorio cargado en la lista (para no duplicar)
                        const key = getItemKey(t, ['cliente', 'fechaLimite', 'titulo']);
                        if (!pendientesVistos.has(key) && !todosLosPendientes.find(existing => (existing.id || existing._id) === t.cliente)) {
                            pendientesVistos.add(key);
                            // Construir un objeto simulando ser un prospecto/cliente para unificar formato
                            todosLosPendientes.push({
                                id: t.cliente,
                                nombres: t.clienteNombre,
                                apellidoPaterno: t.clienteApellido || '',
                                proximaLlamada: t.fechaLimite,
                                esTarea: true
                            });
                        }
                    });
                }

                const manualTasks = (resTareas.status === 'fulfilled' ? (resTareas.value.data || []) : [])
                    .filter(t => t.titulo !== 'Recordatorio de llamada');
                setTeamTasks(manualTasks);

                const recordatoriosUnicos = [];
                const recordatoriosVistos = new Set();

                todosLosPendientes
                    .sort((a, b) => new Date(a.proximaLlamada) - new Date(b.proximaLlamada))
                    .forEach((recordatorio) => {
                        const key = getItemKey(recordatorio, ['proximaLlamada', 'nombres', 'apellidoPaterno', 'telefono']);
                        if (!recordatoriosVistos.has(key)) {
                            recordatoriosVistos.add(key);
                            recordatoriosUnicos.push(recordatorio);
                        }
                    });

                setRecordatorios(recordatoriosUnicos.slice(0, 15));

            } catch (e) {
                console.error('Error general en recordatorios:', e);
            }

        } catch (error) {
            console.error('Error al cargar listas:', error);
            setLoadingReuniones(false);
        }
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        setLoadingTasks(true);
        try {
            if (editingTask) {
                await axios.put(`${API_URL}/api/tareas/${editingTask.id || editingTask._id}`, newTask, { headers: getAuthHeaders() });
            } else {
                await axios.post(`${API_URL}/api/tareas`, newTask, { headers: getAuthHeaders() });
            }
            setShowTaskModal(false);
            setEditingTask(null);
            setNewTask({ titulo: '', descripcion: '', prioridad: 'media' });
            cargarListas(true);
            socket.emit('prospectos_actualizados'); // Notificar cambios al equipo
        } catch (error) {
            console.error('Error al guardar tarea:', error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const confirmModal = useConfirmStore((state) => state.confirmModal);

    const handleDeleteTask = (id) => {
        confirmModal({
            title: '¿Eliminar tarea?',
            message: 'Esta acción eliminará la tarea del sistema.',
            confirmText: 'Eliminar',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_URL}/api/tareas/${id}`, { headers: getAuthHeaders() });
                    cargarListas(true);
                    socket.emit('prospectos_actualizados');
                    toast.success('Tarea eliminada');
                } catch (error) {
                    console.error('Error al eliminar tarea:', error);
                    toast.error('No se pudo eliminar la tarea');
                }
            }
        });
    };

    const toggleTaskStatus = async (task) => {
        try {
            const nuevoEstado = task.estado === 'completada' ? 'pendiente' : 'completada';
            await axios.put(`${API_URL}/api/tareas/${task.id || task._id}`, { estado: nuevoEstado }, { headers: getAuthHeaders() });
            cargarListas(true);
            socket.emit('prospectos_actualizados');
        } catch (error) {
            console.error('Error al cambiar estado de tarea:', error);
        }
    };

    useEffect(() => {
        cargarDatos();
        cargarListas();
        cargarMetasEquipo();
        fetchActividades();

        const interval = setInterval(() => {
            cargarDatos(true);
            cargarListas(true);
            cargarMetasEquipo();
            fetchActividades();
        }, 5 * 60 * 1000);

        const handleSocketUpdate = () => {
            cargarDatos(true);
            cargarListas(true);
            cargarMetasEquipo();
            fetchActividades();
        };
        socket.on('prospectos_actualizados', handleSocketUpdate);

        return () => {
            clearInterval(interval);
            socket.off('prospectos_actualizados', handleSocketUpdate);
        };
    }, [selectedMonth, selectedYear]);

    if (loading || !vendedorData || !closerData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-(--theme-500) animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Cargando dashboard unificado...</p>
                </div>
            </div>
        );
    }

    if (width < 1024) {
        return (
            <DashboardMobile
                vendedorData={vendedorData}
                closerData={closerData}
                recordatorios={recordatorios}
                reuniones={reuniones}
                teamTasks={teamTasks}
                periodo={periodo}
                setPeriodo={setPeriodo}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
            />
        );
    }


    // Moneycall calculations
    const clasificarActividad = (act) => {
        const tipo = String(act.tipo || '').toUpperCase();
        const desc = String(act.descripcion || '').toUpperCase();
        const notas = String(act.notas || '').toUpperCase();
        
        const isOutbound = ['S1', 'S2', 'F1', 'F2', 'DC', 'PT'].some(code => 
            tipo === code || 
            desc.includes(`[${code}]`) || 
            desc.includes(`${code}:`) ||
            notas.includes(`[${code}]`) ||
            notas.includes(`${code}:`) ||
            (code === 'S1' && (desc.includes('DIAGNÓSTICO') || desc.includes('S1'))) ||
            (code === 'S2' && (desc.includes('VENTA CRUZADA') || desc.includes('S2')))
        ) || (tipo === 'LLAMADA' && !desc.includes('ENTRANTE') && !desc.includes('REACTIVA') && !desc.includes('[IN]') && !notas.includes('[IN]'));
        
        const isInbound = ['IN', 'RC'].some(code => 
            tipo === code || 
            desc.includes(`[${code}]`) || 
            desc.includes(`${code}:`) ||
            notas.includes(`[${code}]`) ||
            notas.includes(`${code}:`) ||
            desc.includes('ENTRANTE') || 
            desc.includes('REACTIVA') ||
            notas.includes('ENTRANTE') || 
            notas.includes('REACTIVA')
        );
        
        return { isOutbound, isInbound };
    };

    const esHoy = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const hoy = new Date();
        return d.getDate() === hoy.getDate() &&
               d.getMonth() === hoy.getMonth() &&
               d.getFullYear() === hoy.getFullYear();
    };

    const actividadesHoy = actividades.filter(a => esHoy(a.fecha || a.createdAt));
    const llamadasSalientesHoy = actividadesHoy.filter(a => {
        const { isOutbound } = clasificarActividad(a);
        return isOutbound && (a.tipo === 'llamada' || a.tipo === 'S1' || a.tipo === 'S2' || a.tipo === 'F1' || a.tipo === 'F2' || a.tipo === 'DC' || a.tipo === 'PT');
    }).length;

    const llamadasDeHoyFinal = Math.max(vendedorData?.periodos?.dia?.llamadas || 0, llamadasSalientesHoy);

    const llamadasProactivas = actividades.filter(a => clasificarActividad(a).isOutbound).length;
    const llamadasReactivas = actividades.filter(a => clasificarActividad(a).isInbound).length;
    const totalLlamadasClasificadas = llamadasProactivas + llamadasReactivas;
    const pctProactive = totalLlamadasClasificadas > 0 ? (llamadasProactivas / totalLlamadasClasificadas) * 100 : 0;
    const pctReactive = totalLlamadasClasificadas > 0 ? (llamadasReactivas / totalLlamadasClasificadas) * 100 : 0;


    const mP = vendedorData.periodos?.[periodo] || EMPTY_PERIODO;
    const cP = closerData.periodos?.[periodo] || { ventasCount: 0, ventasMonto: 0, reunionesRealizadas: 0 };
    const periodoSuffix = PERIODOS.find(p => p.key === periodo)?.suffix || 'hoy';
    const formatMoney = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
    const formatNumber = new Intl.NumberFormat('es-MX');

    const isTotal = periodo === 'total';
    // Always show real embudo total as the main "Prospectos activos" number
    const totalEntrada = vendedorData.embudo.total || 0;
    const prospectosNuevosPeriodo = mP.prospectos || 0;
    const enContacto = vendedorData.embudo.en_contacto || 0;
    const sinContactar = Math.max(0, totalEntrada - enContacto);
    const negociacion = isTotal ? ((vendedorData.embudo.reunion_agendada || 0) + (closerData.embudo.reunion_realizada || 0) + (closerData.embudo.propuesta_enviada || 0)) : (mP.reuniones || 0);
    const ganadas = isTotal ? (closerData.embudo.venta_ganada || 0) : (cP.ventasCount || 0);
    const totalLeadsHistoricos = totalEntrada + (closerData.embudo.venta_ganada || 0) + (closerData.embudo.perdido || 0);
    
    const tasaGlobal = totalLeadsHistoricos > 0 ? clampPercent((ganadas / totalLeadsHistoricos) * 100) : 0;

    const tasaContacto = totalEntrada > 0
        ? clampPercent((enContacto / totalEntrada) * 100)
        : clampPercent(vendedorData.tasasConversion.contacto || 0);

    const tasaAgendamiento = enContacto > 0
        ? clampPercent((negociacion / enContacto) * 100)
        : 0;

    const tasaCierre = negociacion > 0 ? clampPercent((ganadas / negociacion) * 100) : 0;
    const etapasDebiles = [
        { etapa: 'Contacto Inicial → Llamadas', tasa: tasaContacto },
        { etapa: 'Llamadas → Citas', tasa: tasaAgendamiento },
        { etapa: 'Negociación → Venta', tasa: tasaCierre }
    ].filter(item => item.tasa < 30);

    const analisisFuentesCombinado = {};
    const mergeFuentes = (fuentesData) => {
        if (!fuentesData) return;
        Object.entries(fuentesData).forEach(([fuente, data]) => {
            const count = typeof data === 'object' ? (data.count || 0) : data;
            const revenue = typeof data === 'object' ? (data.revenue || 0) : 0;
            if (!analisisFuentesCombinado[fuente]) {
                analisisFuentesCombinado[fuente] = { count: 0, revenue: 0 };
            }
            analisisFuentesCombinado[fuente].count += count;
            analisisFuentesCombinado[fuente].revenue += revenue;
        });
    };
    mergeFuentes(vendedorData?.analisisFuentes);
    mergeFuentes(closerData?.analisisFuentes);

    const cardsResumen = [
        { title: 'Prospectos activos', value: formatNumber.format(totalEntrada), icon: '👥', color: 'blue', subtext: `${prospectosNuevosPeriodo} nuevos ${periodoSuffix}` },
        { title: 'En contacto', value: formatNumber.format(enContacto), icon: '📞', color: 'green', subtext: `${sinContactar} todavía sin tocar` },
        { title: 'En negociación', value: formatNumber.format(negociacion), icon: '🤝', color: 'purple', subtext: `${cP.reunionesRealizadas || 0} citas realizadas ${periodoSuffix}` },
        { title: 'Ventas ganadas', value: formatNumber.format(ganadas), icon: '🏆', color: 'yellow', subtext: `${formatPercent(tasaGlobal)} conv. global (${cP.ventasCount || 0} en periodo)` }
    ];

    const labelPeriodo = periodo === 'dia' ? 'hoy' : periodo === 'semana' ? 'semana' : periodo === 'mes' ? 'mes' : 'total';
    const labelMensajes = periodo === 'dia' ? 'Mensajes hoy' : periodo === 'semana' ? 'Mensajes esta semana' : periodo === 'mes' ? 'Mensajes este mes' : 'Mensajes totales';
    const labelLlamadas = periodo === 'dia' ? 'Llamadas hoy' : periodo === 'semana' ? 'Llamadas esta semana' : periodo === 'mes' ? 'Llamadas este mes' : 'Llamadas totales';
    const labelReuniones = periodo === 'dia' ? 'Reuniones hoy' : periodo === 'semana' ? 'Reuniones esta semana' : periodo === 'mes' ? 'Reuniones este mes' : 'Reuniones totales';
    const labelVentas = periodo === 'dia' ? 'Ventas hoy' : periodo === 'semana' ? 'Ventas esta semana' : periodo === 'mes' ? 'Ventas este mes' : 'Ventas totales';

    const panelesActividad = [
        { label: labelLlamadas, value: mP.llamadas || 0, detail: `+${mP.llamadas || 0} esfuerzos ${periodoSuffix}` },
        { label: labelMensajes, value: mP.mensajes || 0, detail: 'Seguimientos, WhatsApp o correos enviados' },
        { label: labelReuniones, value: cP.reunionesRealizadas || 0, detail: `Citas agendadas en periodo: ${mP.reuniones || 0}` },
        { label: labelVentas, value: formatMoney.format(cP.ventasMonto || 0), detail: `${cP.ventasCount || 0} cierres ${periodoSuffix}` }
    ];

    return (
        <div className="h-full flex flex-col gap-3 p-3 xl:overflow-hidden bg-gray-50/50 scrollbar-hide">

            <div className="shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-1.5 px-1">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-(--theme-600)" />
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">{t("Conversión de Prospectos")}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div id="dashboard-period-selector" className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                            {PERIODOS.map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => setPeriodo(p.key)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${periodo === p.key
                                        ? 'bg-(--theme-50) text-(--theme-600) shadow-sm border border-(--theme-100)'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {periodo === 'mes' && (
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm animate-fadeIn">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-transparent border-0 px-2 py-0.5 text-[10px] font-bold text-gray-700 focus:outline-none cursor-pointer"
                                >
                                    <option value={1}>Enero</option>
                                    <option value={2}>Febrero</option>
                                    <option value={3}>Marzo</option>
                                    <option value={4}>Abril</option>
                                    <option value={5}>Mayo</option>
                                    <option value={6}>Junio</option>
                                    <option value={7}>Julio</option>
                                    <option value={8}>Agosto</option>
                                    <option value={9}>Septiembre</option>
                                    <option value={10}>Octubre</option>
                                    <option value={11}>Noviembre</option>
                                    <option value={12}>Diciembre</option>
                                </select>
                                <div className="w-px h-3 bg-gray-200"></div>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-transparent border-0 px-2 py-0.5 text-[10px] font-bold text-gray-700 focus:outline-none cursor-pointer"
                                >
                                    {yearsList.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div id="dashboard-funnel-container" className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm w-full">
                    <FunnelVisual
                        stages={[
                            {
                                etapa: 'Entrada',
                                cantidad: totalEntrada,
                                color: 'bg-(--theme-500)',
                                contadorHoy: prospectosNuevosPeriodo,
                                labelContador: `nuevos ${periodoSuffix}`,
                                cantidadExito: enContacto,
                                cantidadPerdida: sinContactar,
                                porcentajeExito: formatPercent(tasaContacto),
                                porcentajePerdida: formatPercent(100 - tasaContacto),
                                labelExito: 'A Contacto',
                                labelPerdida: 'Sin Tocar'
                            },
                            {
                                etapa: 'Contacto',
                                cantidad: enContacto,
                                color: 'bg-slate-500',
                                contadorHoy: vendedorData.periodos?.[periodo]?.llamadas ?? 0,
                                labelContador: `esfuerzos ${periodoSuffix}`,
                                cantidadExito: negociacion,
                                cantidadPerdida: Math.max(0, enContacto - negociacion),
                                porcentajeExito: formatPercent(tasaAgendamiento),
                                porcentajePerdida: formatPercent(100 - tasaAgendamiento),
                                labelExito: 'A Cita',
                                labelPerdida: 'Estancados'
                            },
                            {
                                etapa: 'Negociación',
                                cantidad: negociacion,
                                color: 'bg-slate-600',
                                contadorHoy: cP.reunionesRealizadas || 0,
                                labelContador: `realizadas ${periodoSuffix}`,
                                cantidadExito: ganadas,
                                cantidadPerdida: Math.max(0, negociacion - ganadas),
                                porcentajeExito: formatPercent(tasaCierre),
                                labelExito: 'A Venta',
                                labelPerdida: 'Pausados'
                            },
                            {
                                etapa: 'Cierre',
                                cantidad: ganadas,
                                color: 'bg-green-500',
                                contadorHoy: cP.ventasCount || 0,
                                labelContador: `ganadas ${periodoSuffix}`,
                                cantidadExito: ganadas,
                                porcentajeExito: 100,
                                labelExito: 'Éxito'
                            }
                        ]}
                        type="vendedor"
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0 overflow-y-auto xl:overflow-hidden pr-0.5 scrollbar-hide">

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 min-h-0 relative z-10 bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col">
                        <div className="flex-1 min-h-0 overflow-y-auto xl:pr-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                            <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
                                    {/* SECCIÓN 1: ATAJOS RÁPIDOS Y KPIs */}
                                    <div className="h-full flex flex-col lg:flex-row gap-4 p-1">
                                        {/* COLUMNA IZQUIERDA: ATAJOS RÁPIDOS */}
                                        <div className="lg:w-1/2 flex flex-col bg-white border border-gray-200 rounded-lg p-6 shadow-xs overflow-hidden">
                                            <div className="mb-4 shrink-0 flex items-center gap-2">
                                                <button
                                                    onClick={() => setHealthTab('resumen')}
                                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center gap-1.5 ${healthTab === 'resumen'
                                                        ? 'bg-(--theme-50) text-(--theme-600)'
                                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    Atajos Rpidos
                                                </button>
                                                <button
                                                    onClick={() => setHealthTab('tareas')}
                                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center gap-1.5 ${healthTab === 'tareas'
                                                        ? 'bg-(--theme-50) text-(--theme-600)'
                                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <Bell className="w-3.5 h-3.5" />
                                                    Tareas
                                                </button>
                                            </div>
                                            {healthTab === 'resumen' ? (
                                                <div className="grid grid-cols-2 gap-3 flex-1">
                                                    <button 
                                                        onClick={() => navigate('/vendedor/prospectos')}
                                                        className="flex flex-col items-center justify-center p-4 bg-gray-50/30 border border-gray-100 rounded-lg hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all group"
                                                    >
                                                        <UserPlus className="w-7 h-7 text-gray-400 mb-2 group-hover:text-gray-600 transition-colors stroke-[1.5]" />
                                                        <span className="text-[10px] font-black text-gray-500 group-hover:text-gray-700 uppercase tracking-widest text-center transition-colors">Crear Prospecto</span>
                                                    </button>

                                                    <button 
                                                        onClick={() => navigate('/vendedor/clientes')}
                                                        className="flex flex-col items-center justify-center p-4 bg-gray-50/30 border border-gray-100 rounded-lg hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all group"
                                                    >
                                                        <Users className="w-7 h-7 text-gray-400 mb-2 group-hover:text-gray-600 transition-colors stroke-[1.5]" />
                                                        <span className="text-[10px] font-black text-gray-500 group-hover:text-gray-700 uppercase tracking-widest text-center transition-colors">Registrar Cliente</span>
                                                    </button>

                                                    <button 
                                                        onClick={() => {
                                                            setEditingTask(null);
                                                            setNewTask({ titulo: '', descripcion: '', prioridad: 'media' });
                                                            setShowTaskModal(true);
                                                        }}
                                                        className="flex flex-col items-center justify-center p-4 bg-gray-50/30 border border-gray-100 rounded-lg hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all group"
                                                    >
                                                        <Bell className="w-7 h-7 text-gray-400 mb-2 group-hover:text-gray-600 transition-colors stroke-[1.5]" />
                                                        <span className="text-[10px] font-black text-gray-500 group-hover:text-gray-700 uppercase tracking-widest text-center transition-colors">Nueva Tarea</span>
                                                    </button>

                                                    <button 
                                                        onClick={() => navigate('/vendedor/calendario')}
                                                        className="flex flex-col items-center justify-center p-4 bg-gray-50/30 border border-gray-100 rounded-lg hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all group"
                                                    >
                                                        <Calendar className="w-7 h-7 text-gray-400 mb-2 group-hover:text-gray-600 transition-colors stroke-[1.5]" />
                                                        <span className="text-[10px] font-black text-gray-500 group-hover:text-gray-700 uppercase tracking-widest text-center transition-colors">Calendario</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                                    <div className="flex items-center justify-between mb-3 px-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-(--theme-50) rounded-xl flex items-center justify-center text-(--theme-600) shadow-xs">
                                                                <Bell className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-800">Tareas de Equipo</h3>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setEditingTask(null);
                                                                setNewTask({ titulo: '', descripcion: '', prioridad: 'media' });
                                                                setShowTaskModal(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-(--theme-600) hover:bg-(--theme-700) text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            NUEVA
                                                        </button>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                                                        {teamTasks.map((t) => (
                                                            <div key={t.id || t._id} className={`group relative p-3 rounded-xl border transition-all ${t.estado === 'completada' ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-(--theme-200) hover:shadow-sm'}`}>
                                                                <div className="flex items-start gap-3">
                                                                    <button
                                                                        onClick={() => toggleTaskStatus(t)}
                                                                        className={`mt-0.5 w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors ${t.estado === 'completada' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-(--theme-500)'}`}
                                                                    >
                                                                        {t.estado === 'completada' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                                    </button>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className={`text-xs font-bold truncate ${t.estado === 'completada' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.titulo}</h4>
                                                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border ${t.prioridad === 'alta' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                                t.prioridad === 'media' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                                                }`}>
                                                                                {t.prioridad}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 mt-1.5">
                                                                            <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md">
                                                                                <Users className="w-2.5 h-2.5 text-gray-400" />
                                                                                <span className="text-gray-600 truncate max-w-[60px]">{t.vendedorNombre || '...'}</span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={() => { setEditingTask(t); setNewTask({ titulo: t.titulo, descripcion: t.descripcion, prioridad: t.prioridad, fechaLimite: t.fechaLimite }); setShowTaskModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-(--theme-600)"><Pencil className="w-3 h-3" /></button>
                                                                        <button onClick={() => handleDeleteTask(t.id || t._id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {teamTasks.length === 0 && (
                                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                                <Bell className="w-6 h-6 text-gray-200 mb-2" />
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Sin tareas</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* COLUMNA DERECHA: DESGLOSE DETALLADO */}
                                        <div className="lg:w-1/2 flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow-xs overflow-hidden">
                                            <div className="mb-3 shrink-0">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">DESGLOSE DETALLADO</h3>
                                                <p className="text-[9px] text-gray-400 font-bold mt-0.5">Vista general de tu pipeline</p>
                                            </div>
                                            
                                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                                {/* Embudo desglosado */}
                                                <div className="space-y-1.5">
                                                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pipeline por etapa</h4>
                                                    {[
                                                        { label: 'Prospectos nuevos', count: vendedorData.embudo.prospecto_nuevo || 0, color: 'bg-blue-500', textColor: 'text-blue-600' },
                                                        { label: 'En contacto', count: vendedorData.embudo.en_contacto || 0, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                                                        { label: 'Reunión agendada', count: vendedorData.embudo.reunion_agendada || 0, color: 'bg-violet-500', textColor: 'text-violet-600' },
                                                        { label: 'En negociación', count: closerData.embudo.en_negociacion || 0, color: 'bg-amber-500', textColor: 'text-amber-600' },
                                                        { label: 'Venta ganada', count: closerData.embudo.venta_ganada || 0, color: 'bg-green-500', textColor: 'text-green-600' },
                                                        { label: 'Perdidos', count: closerData.embudo.perdido || 0, color: 'bg-rose-400', textColor: 'text-rose-500' },
                                                    ].map((stage, i) => {
                                                        const maxCount = Math.max(totalEntrada, 1);
                                                        const pct = Math.min((stage.count / maxCount) * 100, 100);
                                                        return (
                                                            <div key={i} className="flex items-center gap-2 group">
                                                                <span className="text-[10px] font-bold text-gray-500 w-28 truncate shrink-0">{stage.label}</span>
                                                                <div className="flex-1 h-4 bg-gray-50 rounded-full overflow-hidden relative">
                                                                    <div className={`h-full ${stage.color} rounded-full transition-all duration-700`} style={{ width: `${Math.max(pct, stage.count > 0 ? 4 : 0)}%` }} />
                                                                </div>
                                                                <span className={`text-xs font-black ${stage.textColor} w-8 text-right tabular-nums`}>{stage.count}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Separador */}
                                                <div className="border-t border-gray-100" />

                                                {/* Métricas del periodo */}
                                                <div className="space-y-1.5">
                                                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Actividad {periodoSuffix}</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-blue-50/50 border border-blue-100/50 rounded-lg px-3 py-2">
                                                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">Nuevos</span>
                                                            <span className="text-lg font-black text-blue-600 tabular-nums">{prospectosNuevosPeriodo}</span>
                                                        </div>
                                                        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-lg px-3 py-2">
                                                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Llamadas</span>
                                                            <span className="text-lg font-black text-emerald-600 tabular-nums">{mP.llamadas || 0}</span>
                                                        </div>
                                                        <div className="bg-violet-50/50 border border-violet-100/50 rounded-lg px-3 py-2">
                                                            <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider block">Mensajes</span>
                                                            <span className="text-lg font-black text-violet-600 tabular-nums">{mP.mensajes || 0}</span>
                                                        </div>
                                                        <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg px-3 py-2">
                                                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Reuniones</span>
                                                            <span className="text-lg font-black text-amber-600 tabular-nums">{mP.reuniones || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Separador */}
                                                <div className="border-t border-gray-100" />

                                                {/* Ingresos desglose */}
                                                <div className="space-y-1.5">
                                                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ingresos</h4>
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase block">Este periodo</span>
                                                            <span className="text-xl font-black text-gray-800">{formatMoney.format(cP.ventasMonto || 0)}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase block">Cierres</span>
                                                            <span className="text-xl font-black text-green-600">{cP.ventasCount || 0}</span>
                                                        </div>
                                                    </div>
                                                    {(cP.ventasCount || 0) > 0 && (
                                                        <div className="mt-1 bg-green-50/50 border border-green-100/50 rounded-lg px-3 py-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[9px] font-bold text-green-500 uppercase">Ticket promedio</span>
                                                                <span className="text-sm font-black text-green-600">{formatMoney.format(cP.ventasMonto / cP.ventasCount)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Total acumulado */}
                                                    <div className="mt-1 bg-gray-50/80 border border-gray-100 rounded-lg px-3 py-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Total acumulado</span>
                                                            <span className="text-sm font-black text-gray-600">{formatMoney.format(closerData.metricas?.ventas?.montoTotal || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-0.5">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">Ventas totales</span>
                                                            <span className="text-sm font-black text-gray-600">{closerData.metricas?.ventas?.totales || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tasas de conversión */}
                                                <div className="border-t border-gray-100" />
                                                <div className="space-y-1.5">
                                                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tasas de conversión</h4>
                                                    {[
                                                        { label: 'Contacto', value: tasaContacto, desc: `${enContacto} de ${totalEntrada}` },
                                                        { label: 'Agendamiento', value: tasaAgendamiento, desc: `${negociacion} de ${enContacto}` },
                                                        { label: 'Cierre', value: tasaCierre, desc: `${ganadas} de ${negociacion}` },
                                                        { label: 'Global', value: tasaGlobal, desc: `${ganadas} de ${totalLeadsHistoricos}` },
                                                    ].map((rate, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-gray-500 w-24 shrink-0">{rate.label}</span>
                                                            <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                                        rate.value >= 30 ? 'bg-green-500' : rate.value >= 15 ? 'bg-amber-500' : 'bg-rose-400'
                                                                    }`} 
                                                                    style={{ width: `${Math.min(rate.value, 100)}%` }} 
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-black text-gray-600 w-10 text-right tabular-nums">{formatPercent(rate.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            {healthTab === 'kpis' && (
                                <div className="flex flex-col gap-4 h-full min-h-0">
                                    {/* Fila 1: KPIs de Alto Impacto */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                                        <MetricKPICard
                                            title="Tasa de Show-up"
                                            value={closerData?.tasasConversion?.asistencia || 0}
                                            format="percent"
                                            icon={<Video className="w-5 h-5" />}
                                            detail={closerData?.tasasConversion?.asistenciaDetalle || "Show-up en citas agendadas"}
                                            thresholds={{ good: 70, okay: 45 }}
                                        />
                                        <MetricKPICard
                                            title={t("Ticket Promedio")}
                                            value={cP.ventasCount > 0 ? cP.ventasMonto / cP.ventasCount : 0}
                                            format="money"
                                            icon={<DollarSign className="w-5 h-5" />}
                                            detail={`Promedio en el período (${cP.ventasCount} ventas)`}
                                            color="emerald"
                                        />
                                        <MetricKPICard
                                            title="Conversión Global"
                                            value={tasaGlobal}
                                            format="percent"
                                            icon={<Target className="w-5 h-5" />}
                                            detail="De prospecto nuevo a venta ganada"
                                            thresholds={{ good: 15, okay: 8 }}
                                        />
                                    </div>

                                    {/* Fila 2: Métricas de Eficiencia (Velocidad) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                                        <MetricKPICard
                                            title="Tiempo de Respuesta"
                                            value={closerData?.eficiencia?.responseTimeHoras || 0}
                                            format="number"
                                            icon={<Clock className="w-5 h-5" />}
                                            detail="Horas promedio hasta el 1er contacto"
                                            thresholds={{ good: 2, okay: 6 }}
                                            reverse={true}
                                        />
                                        <MetricKPICard
                                            title={t("Ciclo de Cierre")}
                                            value={closerData?.eficiencia?.cicloVentaDias || 0}
                                            format="number"
                                            icon={<ArrowRightLeft className="w-5 h-5" />}
                                            detail="Días promedio desde entrada a cierre"
                                            thresholds={{ good: 5, okay: 12 }}
                                            reverse={true}
                                        />
                                        <MetricKPICard
                                            title="Leads Estancados"
                                            value={closerData?.eficiencia?.leadsEstancados || 0}
                                            format="number"
                                            icon={<AlertTriangle className="w-5 h-5" />}
                                            detail="Prospectos con >7 días sin actividad"
                                            color="rose"
                                        />
                                    </div>



                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0 mt-auto">
                                        {/* Distribución por Fuente */}
                                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full min-h-0">
                                            <div className="flex items-center gap-2 mb-6 shrink-0">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-xs">
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Distribución por Fuente</h3>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Análisis de Origen</p>
                                                </div>
                                            </div>

                                            {Object.keys(analisisFuentesCombinado).length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-40">
                                                    <p className="text-[9px] uppercase font-black tracking-widest">Sin datos de origen</p>
                                                </div>
                                            ) : (
                                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                                    {Object.entries(analisisFuentesCombinado)
                                                        .sort((a, b) => b[1].revenue - a[1].revenue)
                                                        .map(([fuente, data]) => {
                                                            const count = data.count;
                                                            const revenue = data.revenue;
                                                            return (
                                                                <div key={fuente} className="space-y-1.5">
                                                                    <div className="flex justify-between text-[11px] items-end">
                                                                        <div>
                                                                            <span className="font-black text-gray-700 block">{fuente}</span>
                                                                            <span className="text-[9px] text-gray-400 font-bold">{count} leads</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="text-indigo-600 font-black block">{formatMoney.format(revenue)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-indigo-500 rounded-full"
                                                                            style={{ width: `${Math.min((count / (closerData.embudo.total || 1) * 100), 100).toFixed(0)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        {/* Análisis de Pérdidas (Motivos) */}
                                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full min-h-0">
                                            <div className="flex items-center gap-2 mb-6 shrink-0">
                                                <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-xs">
                                                    <XCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Motivos de Pérdida</h3>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Motivos de Descarte</p>
                                                </div>
                                            </div>

                                            {Object.keys(closerData.analisisPerdidasPremium).length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-40">
                                                    <p className="text-[9px] uppercase font-black tracking-widest">Sin datos de descarte</p>
                                                </div>
                                            ) : (
                                                <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                                                    {Object.entries(closerData.analisisPerdidasPremium)
                                                        .sort((a, b) => b[1] - a[1])
                                                        .map(([motivo, count]) => {
                                                            const percent = (count / (closerData.embudo.perdido || 1)) * 100;
                                                            return (
                                                                <div key={motivo} className="flex items-center gap-4">
                                                                    <span className="text-xs font-black text-rose-600 bg-rose-50 w-8 h-8 flex items-center justify-center rounded-xl border border-rose-100 shrink-0">{count}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-center mb-1.5">
                                                                            <p className="text-[11px] font-black text-gray-700 truncate">{motivo}</p>
                                                                            <p className="text-[10px] font-black text-gray-400">{percent.toFixed(0)}%</p>
                                                                        </div>
                                                                        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-rose-400" style={{ width: `${percent}%` }} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        {/* Espacio para Métricas en Desarrollo (Simplificada y Centrada) */}
                                        {/* Espacio para Métricas en Desarrollo */}
                                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full min-h-0 items-center justify-center text-center opacity-70 group transition-all">
                                            <div className="max-w-[220px]">
                                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] leading-tight mb-2">Métricas en Desarrollo</h3>
                                                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                                                    Nuevos análisis y predicciones inteligentes próximamente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {healthTab === 'moneycall' && (
                                <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div>
                                            <h2 className="text-lg font-black text-gray-800 tracking-tight">Proactividad y Esfuerzo</h2>
                                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Monitoreo de la metodología 80/20 y ritmo de llamadas</p>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2">
                                            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-xs">
                                                <div className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Métricas en Vivo</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {/* Termómetro de Llamadas */}
                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-xs border border-emerald-100 shrink-0">
                                                        <Phone className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Termómetro</h3>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Llamadas Salientes Hoy</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Ritmo Actual</div>
                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border transition-colors ${
                                                        llamadasDeHoyFinal < 10 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                        llamadasDeHoyFinal < 20 ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                        llamadasDeHoyFinal < 30 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                        'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                                    }`}>
                                                        {llamadasDeHoyFinal < 10 ? 'Bajo' :
                                                         llamadasDeHoyFinal < 20 ? 'Buen Ritmo' :
                                                         llamadasDeHoyFinal < 30 ? 'Óptimo' : '¡Máximo!'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col justify-center items-center py-4">
                                                <div className="flex items-baseline gap-2 mb-8">
                                                    <span className="text-6xl font-black text-gray-800 tracking-tighter leading-none">{llamadasDeHoyFinal}</span>
                                                    <span className="text-2xl font-black text-gray-300">/ 30</span>
                                                </div>
                                                
                                                <div className="w-full space-y-3 px-2">
                                                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200/80 shadow-inner">
                                                        {/* Marcadores de meta */}
                                                        <div className="absolute left-[66.6%] top-0 bottom-0 w-0.5 bg-white z-20 mix-blend-overlay"></div>
                                                        <div className="absolute left-[100%] top-0 bottom-0 w-0.5 bg-white z-20 mix-blend-overlay"></div>

                                                        {/* Barra de progreso */}
                                                        <div 
                                                            className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-1000 ease-out bg-linear-to-r ${
                                                                llamadasDeHoyFinal < 10 ? 'from-amber-400 to-amber-500' :
                                                                llamadasDeHoyFinal < 20 ? 'from-blue-400 to-blue-500' :
                                                                'from-emerald-400 to-emerald-500'
                                                            }`}
                                                            style={{ width: `${Math.min((llamadasDeHoyFinal / 30) * 100, 100)}%` }}
                                                        >
                                                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full"></div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                                        <span>Inicio (0)</span>
                                                        <span className="relative left-2">Meta (20)</span>
                                                        <span>Óptimo (30)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Ratio Proactivo Doughnut */}
                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs border border-indigo-100 shrink-0">
                                                        <Target className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Ratio 80/20</h3>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Metodología Moneycall</p>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50 text-gray-400 shrink-0">
                                                    <PercentCircle className="w-5 h-5" />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col items-center justify-center py-2 relative z-10">
                                                <ProactiveRatioDoughnut proactiveCount={llamadasProactivas} reactiveCount={llamadasReactivas} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Footer Insight Card - Light Theme */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-[10px] bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                <Zap className="w-5 h-5 fill-current" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-blue-800">Insight del Día</h4>
                                                <p className="text-[11px] text-blue-700/80 font-medium leading-relaxed">
                                                    {llamadasDeHoyFinal >= 20 ? 
                                                        '¡Excelente ritmo de prospección! Tu embudo está sano y tu probabilidad de cierre ha aumentado. Sigue así.' : 
                                                        'Un alto volumen de llamadas salientes (mínimo 20) es la clave de la metodología. ¡Toma el teléfono y llena tu embudo!'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>

                    <div className="bg-(--theme-50)/40 border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col flex-1 min-h-0">
                        <div className="flex items-center gap-1 mb-4 shrink-0 bg-black/5 rounded-lg p-1">
                            <button
                                onClick={() => setSidebarTab('recordatorios')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wide min-w-0 ${
                                    sidebarTab === 'recordatorios'
                                        ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
                                }`}
                            >
                                <Phone className={`w-3 h-3 shrink-0 ${sidebarTab === 'recordatorios' ? 'text-rose-500' : ''}`} />
                                <span className="whitespace-nowrap truncate">Recordatorios</span>
                            </button>
                            <button
                                onClick={() => setSidebarTab('citas')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wide min-w-0 ${
                                    sidebarTab === 'citas'
                                        ? 'bg-white text-(--theme-600) shadow-sm border border-gray-200/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
                                }`}
                            >
                                <Calendar className={`w-3 h-3 shrink-0 ${sidebarTab === 'citas' ? 'text-(--theme-500)' : ''}`} />
                                <span className="whitespace-nowrap truncate">Próximas Citas</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'none' }}>
                            {sidebarTab === 'recordatorios' && (
                                recordatorios.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-3">Sin recordatorios hoy.</p>
                                ) : (
                                    recordatorios.map((p, idx) => {
                                        const esVencido = new Date(p.proximaLlamada) < new Date();
                                        return (
                                            <div
                                                key={p.id || p._id || `rec-${idx}`}
                                                className={`relative overflow-hidden group ${esVencido ? 'bg-linear-to-br from-rose-500 to-rose-600' : 'bg-linear-to-br from-(--theme-500) to-(--theme-600)'} rounded-lg p-2 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                                                onClick={() => {
                                                    if (p.esCliente) {
                                                        navigate('/vendedor/clientes', { state: { selectedId: p.id || p._id } });
                                                    } else {
                                                        navigate('/vendedor/prospectos', { state: { selectedId: p.id || p._id } });
                                                    }
                                                }}
                                            >
                                                {/* Fondo decorativo */}
                                                <div className="absolute right-0 top-0 h-full w-1/4 bg-white/10 skew-x-12 transform origin-top-right transition-transform duration-500"></div>

                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between gap-1 overflow-hidden">
                                                        <div className="text-[11px] font-bold text-white truncate max-w-[70%]">
                                                            {p.nombre || `${p.nombres || ''} ${p.apellidoPaterno || ''}`.trim()}
                                                        </div>
                                                        {p.esCliente && (
                                                            <span className="text-[7px] font-black bg-white/20 text-white px-1 py-0.5 rounded backdrop-blur-sm uppercase tracking-tighter border border-white/10">Cliente</span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between mt-1 gap-1">
                                                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 bg-white/20 text-white backdrop-blur-sm border border-white/10 shrink-0`}>
                                                            <Clock className="w-2 h-2" />
                                                            {new Date(p.proximaLlamada).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            {esVencido && <span className="ml-0.5 font-black opacity-80">⚠</span>}
                                                        </div>
                                                        {p.telefono && (
                                                            <div className="flex items-center gap-0.5 text-[9px] text-white/80 font-medium truncate">
                                                                <Phone className="w-2 h-2" />
                                                                {p.telefono}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                            
                            {sidebarTab === 'citas' && (
                                loadingReuniones ? (
                                    <div className="flex justify-center p-4"><RefreshCw className="animate-spin text-gray-400 w-4 h-4" /></div>
                                ) : reuniones.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-3">Libre de reuniones.</p>
                                ) : (
                                    reuniones.map(r => {
                                        const rFecha = new Date(r.fecha);
                                        const esHoy = rFecha.toDateString() === new Date().toDateString();

                                        return (
                                            <div
                                                key={r.id || r._id}
                                                className={`relative overflow-hidden group ${esHoy ? 'bg-linear-to-br from-emerald-500 to-emerald-600' : 'bg-linear-to-br from-indigo-600 to-indigo-700'} rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                                                onClick={() => handleReunionClick(r)}
                                            >
                                                {/* Fondo decorativo */}
                                                <div className="absolute right-0 top-0 h-full w-1/4 bg-white/10 skew-x-12 transform origin-top-right transition-transform duration-500 group-hover:w-1/3"></div>

                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between gap-1 overflow-hidden mb-1.5">
                                                        <div className="text-[11px] font-bold text-white truncate flex items-center gap-1.5">
                                                            <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                                                                <Video className="w-3 h-3 text-white" />
                                                            </div>
                                                            {r.cliente?.nombres} {r.cliente?.apellidoPaterno}
                                                        </div>
                                                        {esHoy && (
                                                            <span className="text-[7px] font-black bg-white/30 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm uppercase tracking-tighter border border-white/10 whitespace-nowrap animate-pulse">{t("Hoy")}</span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-center gap-1">
                                                            <div className="text-[9px] font-bold text-white bg-white/20 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                                <Clock className="w-2 h-2" />
                                                                {rFecha.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            {r.cliente?.telefono && (
                                                                <div className="text-[9px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
                                                                    <Phone className="w-2 h-2" />
                                                                    {r.cliente.telefono}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {r.googleMeetLink && (
                                                            <a
                                                                href={r.googleMeetLink.startsWith('http') ? r.googleMeetLink : `https://${r.googleMeetLink}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white text-indigo-700 rounded-lg text-[9px] font-black hover:bg-indigo-50 transition-colors shadow-sm active:scale-95"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Video className="w-2.5 h-2.5" />
                                                                UNIRSE A GOOGLE MEET
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </div>

                </div>
            </div>
            {/* Modal de Tarea - Movido al final para evitar problemas de stacking context */}
            {showTaskModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
                        <div className="p-6">
                            <h3 className="text-lg font-black text-gray-800 mb-1 uppercase tracking-tight">
                                {editingTask ? 'Editar Tarea' : 'Nueva Tarea de Equipo'}
                            </h3>
                            <p className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-widest">Colaboración en tiempo real</p>

                            <form onSubmit={handleSaveTask} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Título</label>
                                    <input
                                        required
                                        type="text"
                                        value={newTask.titulo}
                                        onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })}
                                        placeholder="¿Qué hay que hacer?"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500)/20 focus:border-(--theme-500) transition-all outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Descripción (opcional)</label>
                                    <textarea
                                        rows="3"
                                        value={newTask.descripcion}
                                        onChange={(e) => setNewTask({ ...newTask, descripcion: e.target.value })}
                                        placeholder="Detalles adicionales..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500)/20 focus:border-(--theme-500) transition-all outline-hidden resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Prioridad</label>
                                        <select
                                            value={newTask.prioridad}
                                            onChange={(e) => setNewTask({ ...newTask, prioridad: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500)/20 focus:border-(--theme-500) transition-all outline-hidden appearance-none"
                                        >
                                            <option value="baja">{t("Baja")}</option>
                                            <option value="media">{t("Media")}</option>
                                            <option value="alta">{t("Alta")}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Fecha Límite</label>
                                        <input
                                            type="date"
                                            value={newTask.fechaLimite ? newTask.fechaLimite.split('T')[0] : ''}
                                            onChange={(e) => setNewTask({ ...newTask, fechaLimite: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500)/20 focus:border-(--theme-500) transition-all outline-hidden"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowTaskModal(false)}
                                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-500 font-black text-[11px] rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loadingTasks}
                                        className="flex-3 px-6 py-3 bg-(--theme-600) text-white font-black text-[11px] rounded-xl hover:bg-(--theme-700) transition-all uppercase tracking-widest shadow-lg shadow-(--theme-500)/20 flex items-center justify-center gap-2"
                                    >
                                        {loadingTasks ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : editingTask ? 'Actualizar Tarea' : 'Crear Tarea'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
