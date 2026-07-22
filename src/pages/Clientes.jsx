import { useTranslation } from '../utils/translations';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    Search, RefreshCw, ChevronRight, ArrowLeft, User, History, Trash2, Download, 
    Upload, Plus, X, Phone, MessageCircle, Calendar, Filter, Star, Mail, 
    MessageSquare, Clock, Share2, Edit2, Bell, Building2, UserCheck, ShieldCheck, 
    CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getToken } from '../utils/authUtils';
import { HistorialInteracciones } from '../components/HistorialInteracciones';
import TimeWheelPicker from '../components/TimeWheelPicker';
import ClienteDetalle from '../components/ClienteDetalle';
import SourcePicker from '../components/ui/SourcePicker';
import { useBotStore } from '../store/useBotStore';

import API_URL from '../config/api';

const normalizeClienteRecordatorio = (cliente) => ({
    ...cliente,
    proximaLlamada:
        cliente?.proximaLlamada ||
        cliente?.proximallamada ||
        cliente?.proximoRecordatorio ||
        cliente?.proximorecordatorio ||
        null
});

const buildReminderByClienteMap = (tareas = []) => {
    const map = new Map();
    for (const tarea of tareas) {
        if (tarea?.estado !== 'pendiente') continue;
        if (tarea?.titulo !== 'Recordatorio de llamada') continue;
        if (!tarea?.cliente || !tarea?.fechaLimite) continue;

        const clienteId = String(tarea.cliente);
        const actual = map.get(clienteId);
        if (!actual || new Date(tarea.fechaLimite) < new Date(actual)) {
            map.set(clienteId, tarea.fechaLimite);
        }
    }
    return map;
};

const ETAPA_META = {
    venta_ganada: { label: 'Venta ganada', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cotizacion_realizada: { label: 'Cotización realizada', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    contrato_firmado: { label: 'Contrato firmado', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    esperando_pago: { label: 'Esperando pago', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    cliente_activo: { label: 'Cliente activo', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
};

const getEtapaMeta = (etapa) => ETAPA_META[etapa] || { label: 'Cliente Activo', className: 'bg-slate-100 text-slate-700 border-slate-200' };

const formatInteraccionNotas = (text) => {
    if (!text) return '';
    let clean = text.replace(/^(Vendedor:|Cliente:)\s*/i, '');
    const mediaMatch = clean.match(/\[(IMAGE|VIDEO|AUDIO|DOCUMENT|STICKER)\]\(([^)]+)\)/i);
    if (mediaMatch) {
        const type = mediaMatch[1].toUpperCase();
        const caption = clean.replace(/\[(IMAGE|VIDEO|AUDIO|DOCUMENT|STICKER)\]\(([^)]+)\)\s*-?\s*/i, '');
        const typeLabels = {
            IMAGE: '📷 Imagen',
            VIDEO: '🎥 Video',
            AUDIO: '🎙️ Nota de voz',
            DOCUMENT: '📄 Documento',
            STICKER: '🎨 Sticker'
        };
        return (typeLabels[type] || type) + (caption ? ` - ${caption}` : '');
    }
    return clean;
};

const Clientes = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const esMenuSeguimiento = location.pathname.endsWith('/clientes/seguimiento');
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [clienteAEliminar, setClienteAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [importando, setImportando] = useState(false);
    const [filtro, setFiltro] = useState('todos');
    const [filtroEtapa, setFiltroEtapa] = useState('todas');
    const [filtroVisibilidad, setFiltroVisibilidad] = useState('mine'); // mine | shared | all
    const fileInputRef = useRef(null);
    const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
    const [creandoCliente, setCreandoCliente] = useState(false);
    const [formCliente, setFormCliente] = useState({
        nombreCompleto: '',
        telefono: '',
        correos: [''],
        empresa: '',
        fuente: '',
        lada: '+52'
    });

    // Estados para la vista detallada
    const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [guardandoSeguimiento, setGuardandoSeguimiento] = useState(false);
    const [llamadaFlow, setLlamadaFlow] = useState(null);

    // Estados para la edición de clientes
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [clienteAEditar, setClienteAEditar] = useState({});
    const [loadingEditar, setLoadingEditar] = useState(false);

    const getAuthHeaders = () => ({
        'x-auth-token': getToken() || ''
    });

    const getCurrentUserId = () => {
        try {
            const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (!raw) return null;
            const user = JSON.parse(raw);
            return user?.id ?? user?._id ?? null;
        } catch (error) {
            return null;
        }
    };

    const currentUserId = getCurrentUserId();

    const isOwnerRecord = (record) => {
        const ownerId = record?.propietarioId ?? record?.prospectorAsignado ?? record?.vendedorAsignado ?? null;
        if (ownerId == null || currentUserId == null) return false;
        return String(ownerId) === String(currentUserId);
    };

    const getRole = () => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.rol?.toLowerCase() || 'prospector';
            } catch (e) {
                return 'prospector';
            }
        }
        return 'prospector';
    };

    const getRolePath = () => {
        const rol = getRole();
        if (rol === 'vendedor') return 'closer';
        return rol;
    };

    const cargarClientes = async () => {
        setLoading(true);
        try {
            const rol = 'vendedor';
            const [resClientes, resTareas] = await Promise.all([
                axios.get(`${API_URL}/api/${rol}/clientes-ganados`, {
                    headers: getAuthHeaders(),
                    params: { scope: filtroVisibilidad }
                }),
                axios.get(`${API_URL}/api/tareas`, { headers: getAuthHeaders() })
            ]);

            const remindersByCliente = buildReminderByClienteMap(resTareas.data || []);
            const data = (resClientes.data || []).map((raw) => {
                const cliente = normalizeClienteRecordatorio(raw);
                if (cliente.proximaLlamada) return cliente;

                const clienteId = String(cliente.id || cliente._id || '');
                const fechaTarea = remindersByCliente.get(clienteId) || null;
                return { ...cliente, proximaLlamada: fechaTarea };
            });

            setClientes(data);
            return data;
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            setClientes([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarClientes();
        const interval = setInterval(cargarClientes, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [filtroVisibilidad]);

    useEffect(() => {
        if (location.state?.selectedId && clientes.length > 0) {
            const found = clientes.find(c => String(c.id || c._id) === String(location.state.selectedId));
            if (found) {
                handleVerDetalles(found);
            }
        }
    }, [location.state?.selectedId, clientes]);

    const handleToggleCompartido = async (cliente, nuevoEstado) => {
        const id = cliente.id || cliente._id;
        const prev = clientes;
        setClientes((curr) => curr.map((c) => {
            const cid = c.id || c._id;
            return String(cid) === String(id) ? { ...c, compartido: nuevoEstado } : c;
        }));

        try {
            await axios.patch(
                `${API_URL}/api/vendedor/prospectos/${id}/compartir`,
                { compartido: nuevoEstado },
                { headers: getAuthHeaders() }
            );
            toast.success(nuevoEstado ? 'Cliente compartido con tu equipo' : 'Cliente marcado como privado');
        } catch (error) {
            setClientes(prev);
            const status = error?.response?.status;
            const backendMsg = String(error?.response?.data?.msg || error?.response?.data?.mensaje || '');

            if (status === 404) {
                toast.error('Tu backend aun no tiene esta ruta de compartir.');
                return;
            }

            if (status >= 500 && /compartido|propietarioid|column|does not exist/i.test(backendMsg)) {
                toast.error('Falta ejecutar la migracion en Railway (columnas compartido/propietarioId).');
                return;
            }

            toast.error(error.response?.data?.msg || 'No se pudo actualizar la visibilidad');
        }
    };

    const cargarTimelineCliente = async (cliente) => {
        setLoadingTimeline(true);
        try {
            const rol = 'vendedor';
            const res = await axios.get(
                `${API_URL}/api/${rol}/prospecto/${cliente.id || cliente._id}/historial-completo`,
                { headers: getAuthHeaders() }
            );
            setTimeline(res.data.timeline || []);
        } catch (error) {
            console.error('Error al cargar historial:', error);
            setTimeline([]);
        } finally {
            setLoadingTimeline(false);
        }
    };

    const handleVerDetalles = async (cliente) => {
        setProspectoSeleccionado(cliente);
        setLlamadaFlow(null);
        if (!cliente) {
            setTimeline([]);
            setLoadingTimeline(false);
            return;
        }
        await cargarTimelineCliente(cliente);

        const botState = useBotStore.getState();
        if (botState.isOpen && botState.currentStep?.id === 'select_cliente') {
            if (botState.botActions?.stepTourDetailClienteEtapa) {
                setTimeout(() => {
                    botState.botActions.stepTourDetailClienteEtapa();
                }, 300);
            }
        }
    };

    const abrirModalEditar = (p) => {
        const tels = [p.telefono, p.telefono2].filter(Boolean);
        const ems = (p.correo || '').split(',').map(e => e.trim()).filter(Boolean);
        setClienteAEditar({
            id: p._id || p.id,
            nombres: p.nombres || '',
            apellidoPaterno: p.apellidoPaterno || '',
            apellidoMaterno: p.apellidoMaterno || '',
            telefonos: tels.length > 0 ? tels : [''],
            correos: ems.length > 0 ? ems : [''],
            empresa: p.empresa || '',
            sitioWeb: p.sitioWeb || '',
            ubicacion: p.ubicacion || '',
            notas: p.notas || '',
            etapaEmbudo: p.etapaEmbudo || 'venta_ganada',
            interes: p.interes || 5
        });
        setModalEditarAbierto(true);
    };

    const handleEditarCliente = async () => {
        setLoadingEditar(true);
        try {
            const rolePath = 'vendedor';
            const id = clienteAEditar.id;
            const telefonosLimpios = (clienteAEditar.telefonos || []).filter(tel => tel.trim());
            const correosLimpios = (clienteAEditar.correos || []).filter(e => e.trim());
            const payload = { 
                ...clienteAEditar, 
                telefono: telefonosLimpios[0] || '', 
                telefono2: telefonosLimpios.slice(1).join(', ') || '',
                correo: correosLimpios.join(', ') || ''
            };
            delete payload.telefonos;
            delete payload.correos;

            await axios.put(`${API_URL}/api/${rolePath}/prospectos/${id}/editar`, payload, {
                headers: getAuthHeaders()
            });

            toast.success('Cliente actualizado correctamente');
            setModalEditarAbierto(false);

            const lista = await cargarClientes();
            if (prospectoSeleccionado && (prospectoSeleccionado.id === id || prospectoSeleccionado._id === id)) {
                const updated = lista.find(c => (c.id || c._id) === id);
                if (updated) setProspectoSeleccionado(updated);
            }
        } catch (error) {
            console.error('Error al editar:', error);
            toast.error(error.response?.data?.msg || 'Error al actualizar cliente');
        } finally {
            setLoadingEditar(false);
        }
    };

    const handleEliminarCliente = async () => {
        if (!clienteAEliminar) return;
        setEliminando(true);
        try {
            await axios.delete(
                `${API_URL}/api/clientes/${clienteAEliminar.id || clienteAEliminar._id}`,
                { headers: getAuthHeaders() }
            );
            toast.success('Cliente eliminado');
            setClientes(prev => prev.filter(c => (c.id || c._id) !== (clienteAEliminar.id || clienteAEliminar._id)));
            setClienteAEliminar(null);
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            toast.error(error.response?.data?.mensaje || 'No se pudo eliminar el cliente.');
        } finally {
            setEliminando(false);
        }
    };

    const handleCrearCliente = async () => {
        if (!formCliente.nombreCompleto || !formCliente.telefono || !formCliente.correos || !formCliente.correos.filter(c => c.trim()).length) {
            toast.error('Completa los campos requeridos: nombre completo, teléfono y al menos un correo.');
            return;
        }

        const partesNombre = formCliente.nombreCompleto.trim().split(/\s+/).filter(Boolean);
        const nombres = partesNombre[0] || '';
        const restoApellidos = partesNombre.slice(1);
        const apellidoPaterno = restoApellidos[0] || '';
        const apellidoMaterno = restoApellidos.slice(1).join(' ');

        setCreandoCliente(true);
        try {
            const correosLimpios = formCliente.correos.filter(e => e.trim());
            const ladaLimpia = formCliente.lada || '+52';
            const telSinLada = formCliente.telefono.replace(/\D/g, '');
            const telefonoCompleto = telSinLada.startsWith(ladaLimpia.replace('+', ''))
                ? `+${telSinLada}`
                : `${ladaLimpia}${telSinLada}`;

            await axios.post(
                `${API_URL}/api/clientes`,
                {
                    nombres,
                    apellidoPaterno,
                    apellidoMaterno,
                    telefono: telefonoCompleto,
                    correo: correosLimpios.join(', '),
                    empresa: formCliente.empresa,
                    estado: 'ganado',
                    etapaEmbudo: 'venta_ganada',
                    fuente: formCliente.fuente,
                    origen: formCliente.fuente
                },
                { headers: getAuthHeaders() }
            );
            await cargarClientes();
            setMostrarModalCrear(false);
            setFormCliente({
                nombreCompleto: '',
                telefono: '',
                correos: [''],
                empresa: '',
                fuente: '',
                lada: '+52'
            });
            toast.success('Cliente creado exitosamente.');
        } catch (error) {
            console.error('Error al crear cliente:', error);
            toast.error(error.response?.data?.mensaje || 'No se pudo crear el cliente.');
        } finally {
            setCreandoCliente(false);
        }
    };

    const escapeCsv = (value) => {
        const safe = String(value ?? '').replace(/"/g, '""');
        return `"${safe}"`;
    };

    const parseCsvLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i += 1) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);

        return values.map((item) => item.trim());
    };

    const exportarClientesCsv = () => {
        if (!clientesFiltrados.length) {
            toast.error('No hay clientes para exportar.');
            return;
        }

        const headers = [
            'nombres',
            'apellidoPaterno',
            'apellidoMaterno',
            'telefono',
            'correo',
            'empresa',
            'estado',
            'etapaEmbudo',
            'fechaUltimaEtapa'
        ];

        const rows = clientesFiltrados.map((cliente) => ([
            cliente.nombres,
            cliente.apellidoPaterno,
            cliente.apellidoMaterno,
            cliente.telefono,
            cliente.correo,
            cliente.empresa,
            cliente.estado,
            cliente.etapaEmbudo,
            cliente.fechaUltimaEtapa
        ].map(escapeCsv).join(',')));

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStamp = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.setAttribute('download', `clientes_${dateStamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportarClientes = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;

        setImportando(true);
        try {
            const text = await file.text();
            const lines = text
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);

            if (lines.length < 2) {
                toast.error('El archivo CSV no tiene filas de datos.');
                return;
            }

            const headers = parseCsvLine(lines[0]);
            const requiredHeaders = ['nombres', 'apellidoPaterno', 'telefono', 'correo'];
            const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
            if (missingHeaders.length) {
                toast.error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
                return;
            }

            const toPayload = (rowLine) => {
                const values = parseCsvLine(rowLine);
                const row = headers.reduce((acc, key, index) => {
                    acc[key] = values[index] ?? '';
                    return acc;
                }, {});

                return {
                    nombres: row.nombres,
                    apellidoPaterno: row.apellidoPaterno,
                    apellidoMaterno: row.apellidoMaterno || '',
                    telefono: row.telefono,
                    correo: row.correo,
                    empresa: row.empresa || '',
                    estado: row.estado || 'ganado',
                    etapaEmbudo: row.etapaEmbudo || 'venta_ganada'
                };
            };

            const payloads = lines.slice(1).map(toPayload).filter((row) => (
                row.nombres && row.apellidoPaterno && row.telefono && row.correo
            ));

            if (!payloads.length) {
                toast.error('No se encontraron filas válidas para importar.');
                return;
            }

            const results = await Promise.allSettled(
                payloads.map((payload) => axios.post(`${API_URL}/api/clientes`, payload, { headers: getAuthHeaders() }))
            );

            const creados = results.filter((r) => r.status === 'fulfilled').length;
            const fallidos = results.length - creados;

            await cargarClientes();
            toast.success(`Importación finalizada. Creados: ${creados}. Fallidos: ${fallidos}.`);
        } catch (error) {
            console.error('Error al importar clientes:', error);
            toast.error(error.response?.data?.mensaje || 'No se pudo importar el archivo CSV.');
        } finally {
            setImportando(false);
        }
    };

    const clientesFiltrados = useMemo(() => {
        return clientes.filter((cliente) => {
            const matchBusqueda =
                busqueda === '' ||
                (cliente.nombres || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                (cliente.apellidoPaterno || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                (cliente.empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                (cliente.correo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                (cliente.telefono || '').includes(busqueda);
            
            let matchVisibilidad = true;
            if (filtroVisibilidad === 'shared') {
                matchVisibilidad = !!cliente.compartido;
            }

            let matchFiltro = true;
            if (filtro === 'con_recordatorio') {
                matchFiltro = !!cliente.proximaLlamada;
            } else if (filtro === 'sin_recordatorio') {
                matchFiltro = !cliente.proximaLlamada;
            }

            let matchEtapa = true;
            if (filtroEtapa !== 'todas') {
                matchEtapa = (cliente.etapaEmbudo || 'venta_ganada') === filtroEtapa;
            }

            return matchBusqueda && matchVisibilidad && matchFiltro && matchEtapa;
        }).sort((a, b) => {
            const timeA = new Date(a.ultimaInteraccion || a.ultimainteraccion || a.lastMessageTime || a.lastmessagetime || a.fechaUltimaEtapa || a.fechaultimaetapa || a.createdAt || a.createdat || 0).getTime();
            const timeB = new Date(b.ultimaInteraccion || b.ultimainteraccion || b.lastMessageTime || b.lastmessagetime || b.fechaUltimaEtapa || b.fechaultimaetapa || b.createdAt || b.createdat || 0).getTime();
            return timeB - timeA;
        });
    }, [clientes, busqueda, filtroVisibilidad, filtro, filtroEtapa]);

    // Estadísticas para tarjetas rápidas KPI
    const kpis = useMemo(() => {
        const total = clientes.length;
        const conRecordatorio = clientes.filter(c => !!c.proximaLlamada).length;
        const compartidos = clientes.filter(c => c.compartido).length;
        const activos = clientes.filter(c => (c.etapaEmbudo || 'venta_ganada') === 'cliente_activo' || c.etapaEmbudo === 'venta_ganada').length;

        return { total, conRecordatorio, compartidos, activos };
    }, [clientes]);

    const renderModales = () => (
        <>
            {/* Modal Editar Cliente - Estilo Premium Rediseñado */}
            {modalEditarAbierto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-300">
                        {/* Header Modal */}
                        <div className="px-8 py-5 bg-linear-to-r from-(--theme-50) via-white to-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 bg-linear-to-br from-(--theme-500) to-(--theme-700) rounded-2xl flex items-center justify-center shadow-md shadow-(--theme-200)">
                                    <Edit2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Editar Cliente</h2>
                                    <p className="text-xs text-slate-500 font-medium">Actualiza y mantiene al día los datos de tu cliente</p>
                                </div>
                            </div>
                            <button onClick={() => setModalEditarAbierto(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Modal */}
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            {/* Sección: Datos Personales */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-(--theme-500) rounded-full"></div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Información Personal</h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nombres *</label>
                                        <input
                                            type="text"
                                            value={clienteAEditar.nombres || ''}
                                            onChange={(e) => setClienteAEditar((f) => ({ ...f, nombres: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Apellido Paterno</label>
                                            <input
                                                type="text"
                                                value={clienteAEditar.apellidoPaterno || ''}
                                                onChange={(e) => setClienteAEditar((f) => ({ ...f, apellidoPaterno: e.target.value }))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Apellido Materno</label>
                                            <input
                                                type="text"
                                                value={clienteAEditar.apellidoMaterno || ''}
                                                onChange={(e) => setClienteAEditar((f) => ({ ...f, apellidoMaterno: e.target.value }))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Contactos */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-(--theme-500) rounded-full"></div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contacto Directo</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Teléfonos *</label>
                                            <button
                                                type="button"
                                                onClick={() => setClienteAEditar((f) => ({ ...f, telefonos: [...(f.telefonos || ['']), ''] }))}
                                                className="flex items-center gap-1.5 text-xs text-(--theme-600) hover:text-(--theme-700) font-bold bg-(--theme-50) px-3 py-1 rounded-lg transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Agregar teléfono
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {(clienteAEditar.telefonos || ['']).map((tel, idx) => (
                                                <div key={idx} className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                                                    <Phone className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                                                    <input
                                                        type="tel"
                                                        value={tel}
                                                        onChange={(e) => setClienteAEditar((f) => { const tels = [...(f.telefonos || [''])]; tels[idx] = e.target.value; return { ...f, telefonos: tels }; })}
                                                        className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium outline-none"
                                                        placeholder="Ej: +52 81 1234 5678"
                                                    />
                                                    {(clienteAEditar.telefonos || ['']).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setClienteAEditar((f) => ({ ...f, telefonos: (f.telefonos || ['']).filter((_, i) => i !== idx) }))}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Correos Electrónicos</label>
                                            <button
                                                type="button"
                                                onClick={() => setClienteAEditar((f) => ({ ...f, correos: [...(f.correos || ['']), ''] }))}
                                                className="flex items-center gap-1.5 text-xs text-(--theme-600) hover:text-(--theme-700) font-bold bg-(--theme-50) px-3 py-1 rounded-lg transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Agregar correo
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {(clienteAEditar.correos || ['']).map((cor, idx) => (
                                                <div key={idx} className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                                                    <Mail className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                                                    <input
                                                        type="email"
                                                        value={cor}
                                                        onChange={(e) => setClienteAEditar((f) => { const c = [...(f.correos || [''])]; c[idx] = e.target.value; return { ...f, correos: c }; })}
                                                        className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-medium outline-none"
                                                        placeholder="ejemplo@empresa.com"
                                                    />
                                                    {(clienteAEditar.correos || ['']).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setClienteAEditar((f) => ({ ...f, correos: (f.correos || ['']).filter((_, i) => i !== idx) }))}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Detalles de Empresa y Estado */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-(--theme-500) rounded-full"></div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Empresa & Etapa Posventa</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Empresa</label>
                                        <input
                                            type="text"
                                            value={clienteAEditar.empresa || ''}
                                            onChange={(e) => setClienteAEditar((f) => ({ ...f, empresa: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-(--theme-400) transition-all outline-none"
                                            placeholder="Nombre de la empresa"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Etapa del Cliente</label>
                                        <select
                                            value={clienteAEditar.etapaEmbudo || 'venta_ganada'}
                                            onChange={(e) => setClienteAEditar((f) => ({ ...f, etapaEmbudo: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-(--theme-400) transition-all outline-none"
                                        >
                                            <option value="venta_ganada">🟢 Venta ganada</option>
                                            <option value="cotizacion_realizada">🔵 Cotización realizada</option>
                                            <option value="contrato_firmado">🟣 Contrato firmado</option>
                                            <option value="esperando_pago">🟡 Esperando pago</option>
                                            <option value="cliente_activo">🩵 Cliente activo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50 justify-end">
                            <button
                                onClick={() => setModalEditarAbierto(false)}
                                className="px-6 py-3 border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-white transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditarCliente}
                                disabled={loadingEditar}
                                className="px-8 py-3 bg-linear-to-r from-(--theme-600) to-(--theme-700) text-white rounded-2xl text-xs font-black uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-(--theme-200) hover:brightness-110 transition-all"
                            >
                                {loadingEditar ? 'Guardando...' : '✓ Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Crear Cliente - Rediseño Moderno */}
            {mostrarModalCrear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-xl w-full border border-slate-100 animate-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-linear-to-br from-(--theme-500) to-(--theme-700) rounded-2xl flex items-center justify-center shadow-md shadow-(--theme-200)">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Crear Nuevo Cliente</h2>
                                    <p className="text-xs text-slate-500 font-medium">Agrega un cliente cerrado a tu cartera</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMostrarModalCrear(false)}
                                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nombre completo *</label>
                                <input
                                    type="text"
                                    value={formCliente.nombreCompleto}
                                    onChange={(e) => setFormCliente({ ...formCliente, nombreCompleto: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--theme-500) text-sm font-medium transition-all"
                                    placeholder="Juan Pérez López"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Teléfono *</label>
                                <div className="flex gap-2">
                                    <select
                                        value={formCliente.lada || '+52'}
                                        onChange={(e) => setFormCliente({ ...formCliente, lada: e.target.value })}
                                        className="w-auto min-w-[110px] shrink-0 px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--theme-500) text-xs font-bold"
                                    >
                                        <option value="+52">MX (+52)</option>
                                        <option value="+1">US (+1)</option>
                                        <option value="+34">ES (+34)</option>
                                        <option value="+57">CO (+57)</option>
                                        <option value="+54">AR (+54)</option>
                                        <option value="+56">CL (+56)</option>
                                        <option value="+51">PE (+51)</option>
                                    </select>
                                    <input
                                        type="tel"
                                        value={formCliente.telefono}
                                        onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                                        className="flex-1 min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--theme-500) text-sm font-medium transition-all"
                                        placeholder="8136458366"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Empresa</label>
                                <input
                                    type="text"
                                    value={formCliente.empresa}
                                    onChange={(e) => setFormCliente({ ...formCliente, empresa: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--theme-500) text-sm font-medium transition-all"
                                    placeholder="Nombre de empresa"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Correo Electrónico *</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormCliente((f) => ({ ...f, correos: [...f.correos, ''] }))}
                                        className="text-xs text-(--theme-600) hover:text-(--theme-700) font-bold bg-(--theme-50) px-2.5 py-1 rounded-lg"
                                    >
                                        + Añadir otro
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {formCliente.correos.map((cor, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="email"
                                                value={cor}
                                                onChange={(e) => setFormCliente((f) => { const c = [...f.correos]; c[idx] = e.target.value; return { ...f, correos: c }; })}
                                                className="flex-1 min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--theme-500) text-sm font-medium transition-all"
                                                placeholder="juan@empresa.com"
                                            />
                                            {formCliente.correos.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormCliente((f) => ({ ...f, correos: f.correos.filter((_, i) => i !== idx) }))}
                                                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Origen / Fuente</label>
                                <SourcePicker
                                    selectedSource={formCliente.fuente}
                                    onChange={(val) => setFormCliente({ ...formCliente, fuente: val })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => setMostrarModalCrear(false)}
                                disabled={creandoCliente}
                                className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCrearCliente}
                                disabled={creandoCliente}
                                className="px-8 py-3 rounded-2xl bg-linear-to-r from-(--theme-600) to-(--theme-700) text-white font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-(--theme-200) disabled:opacity-50 flex items-center gap-2"
                            >
                                {creandoCliente ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Crear Cliente
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmación Eliminar */}
            {clienteAEliminar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full border border-rose-100 animate-in zoom-in duration-300 text-center">
                        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                            <Trash2 className="w-8 h-8 text-rose-600" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">Eliminar cliente</h2>
                        <p className="text-sm text-slate-500 mb-8 font-medium">
                            ¿Estás seguro de eliminar a <strong className="text-slate-800">{clienteAEliminar.nombres} {clienteAEliminar.apellidoPaterno}</strong>? Esta acción borrará permanentemente sus datos y su historial.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setClienteAEliminar(null)}
                                disabled={eliminando}
                                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEliminarCliente}
                                disabled={eliminando}
                                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {eliminando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    // VISTA DETALLADA PREMIUM (Post-Venta)
    if (prospectoSeleccionado) {
        return (
            <>
                <ClienteDetalle 
                    Cliente={prospectoSeleccionado}
                    rolePath={'vendedor'}
                    onVolver={() => handleVerDetalles(null)}
                    onActualizado={async () => {
                        const lista = await cargarClientes();
                        const actualizado = lista.find(c => String(c.id || c._id) === String(prospectoSeleccionado.id || prospectoSeleccionado._id));
                        if (actualizado) setProspectoSeleccionado(actualizado);
                    }}
                    abrirModalEditar={abrirModalEditar}
                />
                {renderModales()}
            </>
        );
    }

    return (
        <div className="h-full flex flex-col p-3 bg-gray-50/50 animate-in fade-in duration-500">
            <div className="max-w-full mx-auto flex-1 flex flex-col w-full min-h-0 gap-3">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0 px-1">
                    <div>
                        <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-none mb-1">
                            {esMenuSeguimiento ? 'Seguimiento de Clientes' : 'Clientes'}
                        </h1>
                        <p className="text-sm font-medium text-gray-500">
                            {esMenuSeguimiento
                                ? 'Gestiona el ciclo de vida post-venta, renovaciones y relaciones de tu cartera de clientes.'
                                : 'Cartera de clientes'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={handleImportarClientes}
                        />
                        <button
                            id="btn-importar-csv-clientes"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importando}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-bold"
                            title="Importar clientes desde CSV"
                        >
                            {importando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {importando ? 'Importando...' : 'Importar CSV'}
                        </button>
                        <button
                            id="btn-exportar-csv-clientes"
                            onClick={exportarClientesCsv}
                            disabled={loading || !clientesFiltrados.length}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm font-bold"
                            title="Exportar lista actual a CSV"
                        >
                            <Download className="w-4 h-4" />
                            Exportar CSV
                        </button>
                        <button
                            id="btn-crear-cliente"
                            onClick={() => setMostrarModalCrear(true)}
                            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-xs"
                        >
                            <Plus className="w-5 h-5" />
                            Crear cliente
                        </button>
                    </div>
                </div>

                {/* Sección de Filtros y Búsqueda */}
                <div id="seccion-filtros-busqueda-clientes" className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs shrink-0">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Búsqueda */}
                        <div className="relative w-full md:w-[350px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar clientes..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-9 pr-12 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--theme-500) focus:border-(--theme-500) bg-white text-sm font-medium text-slate-700 outline-none"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded-full">
                                {clientesFiltrados.length}/{clientes.length}
                            </div>
                        </div>
                        
                        {/* Filtros */}
                        <div className="flex items-center gap-3 w-full overflow-x-auto scrollbar-hide">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            
                            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
                                {[
                                    { value: 'mine', label: 'Mis clientes' },
                                    { value: 'shared', label: 'Compartidos' },
                                    { value: 'all', label: 'Todos visibles' },
                                ].map(btn => (
                                    <button
                                        key={btn.value}
                                        onClick={() => setFiltroVisibilidad(btn.value)}
                                        className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${filtroVisibilidad === btn.value
                                            ? 'bg-slate-700 text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                                            }`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="w-px h-6 bg-slate-200 shrink-0"></div>
                            
                            <select 
                                value={filtroEtapa} 
                                onChange={(e) => setFiltroEtapa(e.target.value)}
                                className="bg-transparent border-0 text-[13px] font-bold text-slate-700 cursor-pointer focus:ring-0 p-0 pr-6 shrink-0 outline-none"
                            >
                                <option value="todas">Todos los clientes</option>
                                <option value="venta_ganada">Venta ganada</option>
                                <option value="cotizacion_realizada">Cotización realizada</option>
                                <option value="contrato_firmado">Contrato firmado</option>
                                <option value="esperando_pago">Esperando pago</option>
                                <option value="cliente_activo">Cliente activo</option>
                            </select>

                            {/* Recordatorio pendiente */}
                            <button
                                onClick={() => setFiltro(f => f === 'con_recordatorio' ? 'todos' : 'con_recordatorio')}
                                className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border text-sm transition-all ml-auto ${filtro === 'con_recordatorio'
                                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                title="Solo con recordatorio de llamada"
                            >
                                <Bell className="w-4 h-4" />
                            </button>
                            
                            {/* Reset filtros */}
                            {(filtroEtapa !== 'todas' || filtro !== 'todos' || busqueda || filtroVisibilidad !== 'mine') && (
                                <button
                                    onClick={() => { setFiltroEtapa('todas'); setFiltro('todos'); setBusqueda(''); setFiltroVisibilidad('mine'); }}
                                    className="shrink-0 flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                                    title="Limpiar filtros"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla de Clientes */}
                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                        <RefreshCw className="w-8 h-8 text-(--theme-500) animate-spin mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-600">Cargando clientes...</p>
                    </div>
                ) : clientesFiltrados.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
                            <User className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No se encontraron clientes</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            Intenta ajustar los términos de búsqueda o cambiar los filtros.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex-1 flex flex-col min-h-0">
                        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
                            <h2 className="text-[13px] font-black text-slate-700 tracking-wider uppercase">
                                {filtroVisibilidad === 'mine'
                                    ? `MI LISTA (PRIVADOS) (${clientesFiltrados.length})`
                                    : filtroVisibilidad === 'shared'
                                    ? `MI LISTA (COMPARTIDOS) (${clientesFiltrados.length})`
                                    : `TODOS LOS VISIBLES (${clientesFiltrados.length})`}
                            </h2>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table id="tabla-clientes" className="min-w-full text-sm">
                                <thead className="bg-white sticky top-0 z-10 border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-widest">
                                    <tr>
                                        <th className="px-6 py-3 text-left w-1/5">Cliente</th>
                                        <th className="px-6 py-3 text-left w-1/5">Contacto</th>
                                        <th className="px-6 py-3 text-center">Etapa</th>
                                        <th className="px-6 py-3 text-left">Última interacción</th>
                                        <th className="px-6 py-3 text-left">Recordatorio</th>
                                        <th className="px-6 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {clientesFiltrados.map((cliente) => {
                                        const etapa = getEtapaMeta(cliente.etapaEmbudo);
                                        const esMio = cliente.esPropietario === true || isOwnerRecord(cliente);
                                        const nombreCalculado = [cliente.nombres, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(' ');
                                        const nombreCompleto = nombreCalculado || cliente.nombreCompleto || cliente.nombre || 'Sin nombre';

                                        return (
                                            <tr
                                                key={cliente._id || cliente.id}
                                                onClick={() => handleVerDetalles(cliente)}
                                                className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                                            >
                                                {/* Cliente sin avatar, nombre completo + subtexto + estrellas */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <p className="font-bold text-gray-900 leading-tight text-sm flex items-center gap-1.5 mb-0.5">
                                                            {nombreCompleto}
                                                            {cliente.whatsappPendiente && (
                                                                <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs" title="Mensaje de WhatsApp pendiente de responder">
                                                                    <span className="relative flex h-1.5 w-1.5">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                                                    </span>
                                                                    Wpp
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 max-w-[180px] truncate mb-1">
                                                            {cliente.empresa || cliente.fuente || 'Contacto WhatsApp'}
                                                        </p>
                                                        <div className="flex items-center gap-0.5 text-yellow-500 scale-75 origin-left">
                                                            {[1, 2, 3, 4, 5].map((val) => (
                                                                <Star key={val} className={`w-3.5 h-3.5 ${ (cliente.interes || 5) >= val ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contacto */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-1.5">
                                                        <p className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            {cliente.telefono || '—'}
                                                        </p>
                                                        <p className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            {cliente.correo ? cliente.correo.split(',')[0].trim() : '—'}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Etapa en formato Badge Pill */}
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${etapa.className}`}>
                                                        {etapa.label}
                                                    </span>
                                                </td>

                                                {/* Última interacción */}
                                                <td className="px-6 py-4 max-w-[200px]">
                                                    {cliente.ultimaActTipo ? (
                                                        <div className="flex items-start gap-1.5">
                                                            <div className="mt-0.5 shrink-0">
                                                                {cliente.ultimaActTipo === 'llamada' && <Phone className="w-3 h-3 text-(--theme-500)" />}
                                                                {cliente.ultimaActTipo === 'whatsapp' && <MessageSquare className="w-3 h-3 text-green-500" />}
                                                                {cliente.ultimaActTipo === 'correo' && <Mail className="w-3 h-3 text-purple-500" />}
                                                                {cliente.ultimaActTipo === 'cita' && <Calendar className="w-3 h-3 text-blue-500" />}
                                                            </div>
                                                            <p className="text-xs text-blue-600 leading-snug truncate max-w-[150px]" title={formatInteraccionNotas(cliente.ultimaActNotas)}>
                                                                {cliente.ultimaActNotas
                                                                    ? (formatInteraccionNotas(cliente.ultimaActNotas).length > 30 ? formatInteraccionNotas(cliente.ultimaActNotas).slice(0, 30) + '…' : formatInteraccionNotas(cliente.ultimaActNotas))
                                                                    : <span className="italic text-slate-400">{cliente.ultimaActTipo}</span>}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-300 italic font-medium">Sin interacciones</span>
                                                    )}
                                                </td>

                                                {/* Recordatorio */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {cliente.proximaLlamada ? (() => {
                                                        const esVencido = new Date(cliente.proximaLlamada) < new Date();
                                                        return (
                                                            <div className={`flex items-center gap-1.5 ${esVencido ? 'text-red-600' : 'text-slate-600'}`}>
                                                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="text-xs font-medium leading-tight tracking-tight">
                                                                    {new Date(cliente.proximaLlamada).toLocaleString('es-MX', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                    {esVencido && ' ⚠'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })() : (
                                                        <span className="text-xs text-slate-300 italic font-medium">Sin pendiente</span>
                                                    )}
                                                </td>

                                                {/* Acciones (iconos limpios) */}
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {esMio && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleCompartido(cliente, !cliente.compartido);
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-all border ${
                                                                    cliente.compartido
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs'
                                                                        : 'text-slate-300 hover:text-emerald-500 border-transparent hover:bg-slate-50'
                                                                }`}
                                                                title={cliente.compartido ? 'Compartido (clic para volver privado)' : 'Privado (clic para compartir)'}
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate('/vendedor/chats', { state: { clienteId: cliente.id || cliente._id } });
                                                            }}
                                                            className="text-slate-300 hover:text-emerald-600 transition-colors p-1.5 rounded-md hover:bg-emerald-50"
                                                            title="Abrir Chat WhatsApp"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleVerDetalles(cliente); }}
                                                            className="text-slate-300 hover:text-blue-500 transition-colors p-1.5 rounded-md hover:bg-slate-50"
                                                            title="Ver Historial"
                                                        >
                                                            <History className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); abrirModalEditar(cliente); }}
                                                            className="text-slate-300 hover:text-blue-500 transition-colors p-1.5 rounded-md hover:bg-slate-50"
                                                            title="Editar Cliente"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setClienteAEliminar(cliente); }}
                                                            className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-slate-50"
                                                            title="Eliminar Cliente"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Footer de Paginación */}
                        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                            <span className="text-sm font-medium text-slate-500">
                                Mostrando {clientesFiltrados.length} de {clientes.length} clientes
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={true}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                <span className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
                                    Página 1 de 1
                                </span>
                                <button
                                    disabled={true}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 cursor-not-allowed"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {renderModales()}
            </div>
        </div>
    );
};

export default Clientes;

