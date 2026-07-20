import { useTranslation } from '../utils/translations';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
    Phone,
    MessageSquare,
    Mail,
    Calendar,
    Search,
    RefreshCw,
    Plus,
    UserPlus,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Star,
    ArrowLeft,
    Edit2,
    Filter,
    Bell,
    Send,
    Share2,
    Download,
    Upload,
    Video,
    X,
    Building2,
    MapPin,
    Globe,
    Trash2,
    AlertCircle,
    FileText
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getToken } from '../utils/authUtils';
import HistorialInteracciones from '../components/HistorialInteracciones';
import ProspectoDetalle from '../components/ProspectoDetalle';
import TimeWheelPicker from '../components/TimeWheelPicker';

import API_URL from '../config/api';
import socket from '../config/socket';
import SourcePicker from '../components/ui/SourcePicker';
import { useBotStore } from '../store/useBotStore';

// --- CSV helpers ---
const CSV_HEADERS = ['nombres', 'apellidoPaterno', 'apellidoMaterno', 'telefono', 'correo', 'empresa', 'sitioWeb', 'ubicacion', 'notas', 'fuente'];
const CSV_LABELS = ['Nombres', 'Apellido Paterno', 'Apellido Materno', 'Telefono', 'Correo', 'Empresa', 'Sitio Web', 'Ubicacion', 'Notas', 'Fuente'];

function prospectosToCsv(prospectos) {
    const escape = (val) => {
        if (val == null) return '';
        const s = String(val).replace(/"/g, '""');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    const rows = [CSV_LABELS.join(',')];
    for (const p of prospectos) rows.push(CSV_HEADERS.map(h => escape(p[h])).join(','));
    return rows.join('\n');
}

function parseCsvRow(row) {
    const cells = [];
    let cur = ''; let inQuote = false;
    for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') { if (inQuote && row[i + 1] === '"') { cur += '"'; i++; } else inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { cells.push(cur.trim()); cur = ''; }
        else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
}

function csvToProspectos(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { data: [], errors: ['El CSV está vacío o solo tiene encabezados.'] };
    const header = parseCsvRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));
    const colMap = {
        nombres: ['nombres', 'nombre'], apellidoPaterno: ['apellidopaterno', 'apellido'],
        apellidoMaterno: ['apellidomaterno'], telefono: ['telefono', 'tel', 'phone'],
        correo: ['correo', 'email', 'mail'], empresa: ['empresa', 'company'],
        notas: ['notas', 'nota', 'notes', 'comentarios'],
    };
    const colIndex = {};
    for (const [field, aliases] of Object.entries(colMap)) {
        for (const alias of aliases) { const idx = header.indexOf(alias); if (idx !== -1) { colIndex[field] = idx; break; } }
    }
    const errors = []; const data = [];
    for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvRow(lines[i]);
        const row = {};
        for (const [field, idx] of Object.entries(colIndex)) row[field] = cells[idx] || '';
        data.push(row);
    }
    return { data, errors };
}

const TIPOS_ACTIVIDAD = [
    { value: 'llamada', label: 'Llamada', icon: Phone, color: 'bg-(--theme-500)' },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-500' },
    { value: 'correo', label: 'Correo', icon: Mail, color: 'bg-purple-500' },
    { value: 'cita', label: 'Cita agendada', icon: Calendar, color: 'bg-(--theme-500)' }
];

const RESULTADOS = [
    { value: 'exitoso', label: 'Exitoso', icon: CheckCircle2 },
    { value: 'pendiente', label: 'Pendiente', icon: Clock },
    { value: 'fallido', label: 'No contestó', icon: XCircle }
];

const getTipoLabel = (tipo) => TIPOS_ACTIVIDAD.find(t => t.value === tipo)?.label || tipo;
const getTipoColor = (tipo) => TIPOS_ACTIVIDAD.find(t => t.value === tipo)?.color || 'bg-gray-500';
const getResultadoLabel = (r) => RESULTADOS.find(x => x.value === r)?.label || r;

const ETAPAS_EMBUDO = {
    'prospecto_nuevo': { label: 'Sin contacto', color: 'bg-red-100 text-red-600' },
    'en_contacto': { label: 'En contacto', color: 'bg-(--theme-100) text-(--theme-600)' },
    'reunion_agendada': { label: 'Cita agendada', color: 'bg-(--theme-100) text-(--theme-600)' },
    'reunion_realizada': { label: 'Cita realizada', color: 'bg-(--theme-100) text-(--theme-600)' },
    'en_negociacion': { label: 'Negociación', color: 'bg-amber-100 text-amber-600' },
    'venta_ganada': { label: 'Venta ganada', color: 'bg-(--theme-100) text-(--theme-600)' },
    'perdido': { label: 'Perdido', color: 'bg-rose-100 text-rose-600' }
};

const getEtapaLabel = (etapa) => ETAPAS_EMBUDO[etapa]?.label || etapa;
const getEtapaColor = (etapa) => ETAPAS_EMBUDO[etapa]?.color || 'bg-gray-100 text-gray-600';
const normalizeProspectoRecordatorio = (p) => ({
    ...p,
    proximaLlamada: p?.proximaLlamada || p?.proximallamada || p?.proximoRecordatorio || p?.proximorecordatorio || null
});

const buildReminderByClienteMap = (tareas = []) => {
    const map = new Map();
    for (const t of tareas) {
        if (t?.estado !== 'pendiente') continue;
        if (t?.titulo !== 'Recordatorio de llamada') continue;
        if (!t?.cliente || !t?.fechaLimite) continue;

        const clienteId = String(t.cliente);
        const actual = map.get(clienteId);
        if (!actual || new Date(t.fechaLimite) < new Date(actual)) {
            map.set(clienteId, t.fechaLimite);
        }
    }
    return map;
};

const Seguimiento = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const rolePath = 'vendedor';
    const [prospectos, setProspectos] = useState([]);
    const [loading, setLoading] = useState(true);
    // Paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    // Filtros
    const [busquedaProspecto, setBusquedaProspecto] = useState('');
    const [filtroEtapa, setFiltroEtapa] = useState('todos'); // 'todos', 'prospecto_nuevo', 'reunion_agendada', etc.
    const [filtroVisibilidad, setFiltroVisibilidad] = useState('mine'); // mine | shared | all
    const [filtroFecha, setFiltroFecha] = useState('todos'); // 'todos', 'hoy', 'ayer', 'semana', 'mes', 'personalizado'
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroRecordatorio, setFiltroRecordatorio] = useState(false);
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [loadingCrear, setLoadingCrear] = useState(false);
    const [formCrear, setFormCrear] = useState({
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        telefonos: [''],
        correos: [''],
        empresa: '',
        sitioWeb: '',
        ubicacion: '',
        notas: '',
        fuente: ''
    });

    // Estado para la edición de prospectos
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [prospectoAEditar, setProspectoAEditar] = useState({});
    const [loadingEditar, setLoadingEditar] = useState(false);

    // Estados para modales de conversión y descarte
    const [modalPasarClienteAbierto, setModalPasarClienteAbierto] = useState(false);
    const [modalDescartarAbierto, setModalDescartarAbierto] = useState(false);
    const [notaConversion, setNotaConversion] = useState('');
    const [notaDescarte, setNotaDescarte] = useState('');
    const [motivoPerdida, setMotivoPerdida] = useState('');
    const [loadingConversion, setLoadingConversion] = useState(false);

    // Estados para CSV y eliminar
    const [prospectoAEliminar, setProspectoAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [isImportModalAbierto, setIsImportModalAbierto] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState(null);
    const [importando, setImportando] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // Estado para el acordeón de acciones de cierre
        // Estado para editar etapa inline en la vista detallada
        

    const abrirModalEditar = (p) => {
        const tels = [p.telefono, p.telefono2].filter(Boolean);
        const ems = (p.correo || '').split(',').map(e => e.trim()).filter(Boolean);
        setProspectoAEditar({
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
            fuente: p.fuente || p.origen || '',
            etapaEmbudo: p.etapaEmbudo || 'prospecto_nuevo',
            proximaLlamada: p.proximaLlamada ? p.proximaLlamada.slice(0, 16) : '',
            interes: p.interes || 0
        });
        setModalEditarAbierto(true);
    };

    const handleEditarProspecto = async () => {
        setLoadingEditar(true);
        try {
            const telefonosLimpios = (prospectoAEditar.telefonos || []).filter(t => t.trim());
            const correosLimpios = (prospectoAEditar.correos || []).filter(e => e.trim());
            const payload = { 
                ...prospectoAEditar, 
                telefono: telefonosLimpios[0] || '', 
                telefono2: telefonosLimpios.slice(1).join(', ') || '', 
                correo: correosLimpios.join(', ') || '',
                interes: prospectoAEditar.interes || 0, 
                fuente: prospectoAEditar.fuente || '' 
            };
            delete payload.telefonos;
            delete payload.correos;
            await axios.put(`${API_URL}/api/${rolePath}/prospectos/${prospectoAEditar.id}/editar`, payload, {
                headers: getAuthHeaders()
            });
            toast.success('Prospecto actualizado');
            setModalEditarAbierto(false);
            // Recargar datos y actualizar el panel de detalle si está abierto
            const res = await axios.get(`${API_URL}/api/${rolePath}/prospectos`, { headers: getAuthHeaders() });
            const normalizados = (res.data || []).map(normalizeProspectoRecordatorio);
            setProspectos(normalizados);
            if (prospectoSeleccionado && (prospectoSeleccionado.id === prospectoAEditar.id || prospectoSeleccionado._id === prospectoAEditar.id)) {
                const updated = normalizados.find(p => p.id === prospectoAEditar.id || p._id === prospectoAEditar.id);
                if (updated) setProspectoSeleccionado(updated);
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al actualizar');
        } finally {
            setLoadingEditar(false);
        }
    };

    // Estados para la nueva vista detallada
    const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
        // Estado para el flujo de llamada inline
                    
    
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

    const cargarDatos = async (currentPage = page) => {
        setLoading(true);
        try {
            const paramsProspectos = {
                scope: filtroVisibilidad,
                etapa: filtroEtapa,
                busqueda: busquedaProspecto,
                page: currentPage,
                limit: 50
            };

            const [resProspectos, resTareas] = await Promise.all([
                axios.get(`${API_URL}/api/${rolePath}/prospectos`, {
                    headers: getAuthHeaders(),
                    params: paramsProspectos
                }),
                axios.get(`${API_URL}/api/tareas`, { headers: getAuthHeaders() })
            ]);

            const remindersByCliente = buildReminderByClienteMap(resTareas.data || []);
            const rawData = resProspectos.data.data ? resProspectos.data.data : resProspectos.data;
            const metaTotalPages = resProspectos.data.totalPages || 1;
            const metaTotalItems = resProspectos.data.total || rawData.length;

            const normalizados = (rawData || []).map((raw) => {
                const p = normalizeProspectoRecordatorio(raw);
                if (p.proximaLlamada) return p;

                const clienteId = String(p.id || p._id || '');
                const fechaTarea = remindersByCliente.get(clienteId) || null;
                return { ...p, proximaLlamada: fechaTarea };
            });

            setProspectos(normalizados);
            setTotalPages(metaTotalPages);
            setTotalItems(metaTotalItems);
            return normalizados; // Retornar datos para el init
        } catch (error) {
            console.error('Error al cargar:', error);
            setProspectos([]);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const data = await cargarDatos(page);
            // 1. Prioridad: Parámetro 'p' en la URL (para recargas F5 o enlaces directos)
            const urlId = searchParams.get('p');
            // 2. Fallback: location.state.selectedId (para navegación interna desde otra página)
            const selectedId = urlId || location.state?.selectedId;

            if (selectedId && data) {
                const found = data.find(p => (p.id || p._id) == selectedId);
                if (found) {
                    handleSeleccionarProspecto(found);
                }
            }
        };
        init();
        const interval = setInterval(() => cargarDatos(page), 5 * 60 * 1000);

        const handleSocketUpdate = (obj) => {
            console.log('socket: prospectos actualizados detectado', obj);
            cargarDatos(page);
        };
        socket.on('prospectos_actualizados', handleSocketUpdate);

        return () => {
            clearInterval(interval);
            socket.off('prospectos_actualizados', handleSocketUpdate);
        };
    }, [searchParams, filtroVisibilidad, filtroEtapa, busquedaProspecto, page]);

    const { currentStep } = useBotStore();

    const handleInputFocus = (stepId) => {
        const botState = useBotStore.getState();
        if (!botState.isOpen || !botState.currentStep) return;
        if (!botState.currentStep.id.startsWith('create_prospect')) return;
        if (botState.currentStep.id === stepId) return;
        
        const actions = botState.botActions;
        if (!actions) return;
        
        switch (stepId) {
            case 'create_prospect':
                actions.stepCreateProspect?.();
                break;
            case 'create_prospect_surnames':
                actions.stepCreateProspectSurnames?.();
                break;
            case 'create_prospect_surname_materno':
                actions.stepCreateProspectSurnameMaterno?.();
                break;
            case 'create_prospect_phone':
                actions.stepCreateProspectPhone?.();
                break;
            case 'create_prospect_emails':
                actions.stepCreateProspectEmails?.();
                break;
            case 'create_prospect_company':
                actions.stepCreateProspectCompany?.();
                break;
            case 'create_prospect_website':
                actions.stepCreateProspectWebsite?.();
                break;
            case 'create_prospect_location':
                actions.stepCreateProspectLocation?.();
                break;
            case 'create_prospect_notes':
                actions.stepCreateProspectNotes?.();
                break;
            case 'create_prospect_source':
                actions.stepCreateProspectSource?.();
                break;
            case 'create_prospect_confirm':
                actions.stepCreateProspectConfirm?.();
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        if (currentStep?.id === 'create_prospect') {
            setModalCrearAbierto(true);
        }
    }, [currentStep]);

    const handleToggleCompartido = async (prospecto, nuevoEstado) => {
        const id = prospecto.id || prospecto._id;
        const prev = prospectos;
        setProspectos((curr) => curr.map((p) => {
            const pid = p.id || p._id;
            return String(pid) === String(id) ? { ...p, compartido: nuevoEstado } : p;
        }));

        try {
            await axios.patch(
                `${API_URL}/api/${rolePath}/prospectos/${id}/compartir`,
                { compartido: nuevoEstado },
                { headers: getAuthHeaders() }
            );
            toast.success(nuevoEstado ? 'Prospecto compartido con tu equipo' : 'Prospecto marcado como privado');
        } catch (error) {
            setProspectos(prev);
            const status = error?.response?.status;
            const backendMsg = String(error?.response?.data?.msg || error?.response?.data?.mensaje || '');

            if (status === 404) {
                toast.error('Tu backend en Railway aun no tiene esta ruta de compartir. Falta desplegar backend.');
                return;
            }

            if (status >= 500 && /compartido|propietarioid|column|does not exist/i.test(backendMsg)) {
                toast.error('Falta ejecutar la migracion en Railway (columnas compartido/propietarioId).');
                return;
            }

            toast.error(error.response?.data?.msg || 'No se pudo actualizar la visibilidad');
        }
    };

    // Escuchar cambios en location.state para navegación interna
    useEffect(() => {
        if (location.state?.selectedId && prospectos.length > 0) {
            const found = prospectos.find(p => (p.id || p._id) == location.state.selectedId);
            if (found) {
                handleSeleccionarProspecto(found);
            }
        }
    }, [location.key, prospectos]);

    // Orden de prioridad de etapas (más avanzadas primero, perdido al fondo)
    const ORDEN_ETAPA = {
        'reunion_agendada': 1,
        'reunion_realizada': 2,
        'en_negociacion': 3,
        'en_contacto': 4,
        'prospecto_nuevo': 5,
        'venta_ganada': 6,
        'perdido': 99
    };
    // Filtro principal
    const prospectosFiltrados = useMemo(() => {
        let filtrados = prospectos;

        // Búsqueda...
        if (busquedaProspecto.trim()) {
            const termino = busquedaProspecto.toLowerCase();
            filtrados = filtrados.filter(p =>
                p.nombres?.toLowerCase().includes(termino) ||
                p.apellidoPaterno?.toLowerCase().includes(termino) ||
                p.empresa?.toLowerCase().includes(termino) ||
                p.correo?.toLowerCase().includes(termino) ||
                p.telefono?.includes(termino)
            );
        }

        // Etapa (filtros agrupados)...
        if (filtroEtapa === 'en_contacto') {
            // Respondió: etapa avanzó más allá de prospecto_nuevo
            filtrados = filtrados.filter(p => p.etapaEmbudo !== 'prospecto_nuevo');
        } else if (filtroEtapa === 'sin_respuesta') {
            // Intentaron contactar (hay actividades) pero sigue en prospecto_nuevo → no contestó
            filtrados = filtrados.filter(p => p.etapaEmbudo === 'prospecto_nuevo' && !!p.ultimaActTipo);
        } else if (filtroEtapa === 'no_contactado') {
            // Sin ninguna actividad registrada = nuevo prospecto sin interacción
            filtrados = filtrados.filter(p => p.etapaEmbudo === 'prospecto_nuevo' && !p.ultimaActTipo);
        } else if (filtroEtapa === 'con_cita') {
            // Tiene cita agendada o realizada
            filtrados = filtrados.filter(p => ['reunion_agendada', 'reunion_realizada'].includes(p.etapaEmbudo));
        }

        // Fecha...
        if (filtroFecha !== 'todos') {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            filtrados = filtrados.filter(p => {
                const fechaCreacion = new Date(p.createdAt || new Date());
                fechaCreacion.setHours(0, 0, 0, 0);

                if (filtroFecha === 'hoy') {
                    return fechaCreacion.getTime() === hoy.getTime();
                }
                if (filtroFecha === 'ayer') {
                    const ayer = new Date(hoy);
                    ayer.setDate(hoy.getDate() - 1);
                    return fechaCreacion.getTime() === ayer.getTime();
                }
                if (filtroFecha === 'semana') {
                    const semanaPasada = new Date(hoy);
                    semanaPasada.setDate(hoy.getDate() - 7);
                    return fechaCreacion >= semanaPasada && fechaCreacion <= hoy;
                }
                if (filtroFecha === 'mes') {
                    const mesPasado = new Date(hoy);
                    mesPasado.setDate(hoy.getDate() - 30);
                    return fechaCreacion >= mesPasado && fechaCreacion <= hoy;
                }
                if (filtroFecha === 'personalizado' && fechaDesde && fechaHasta) {
                    const dDesde = new Date(fechaDesde);
                    dDesde.setHours(0, 0, 0, 0);
                    // Aumentamos 1 día a la fechaHasta local para que sea inclusivo el día entero
                    const dHasta = new Date(fechaHasta);
                    dHasta.setHours(23, 59, 59, 999);
                    return fechaCreacion >= dDesde && fechaCreacion <= dHasta;
                }
                return true;
            });
        }

        // Recordatorio...
        if (filtroRecordatorio) {
            const ahora = new Date();
            filtrados = filtrados.filter(p => {
                if (!p.proximaLlamada) return false;
                // 'vencido': ya pasó la fecha. 'futuro': aún no. Ambos se muestran, vencidos primero.
                return true;
            });
        }

        // Visibilidad ('shared' -> solo compartidos; 'mine' y 'all' se gestionan por backend)
        if (filtroVisibilidad === 'shared') {
            filtrados = filtrados.filter(p => !!p.compartido);
        }

        return filtrados;
    }, [prospectos, busquedaProspecto, filtroVisibilidad, filtroEtapa, filtroFecha, fechaDesde, fechaHasta, filtroRecordatorio]).sort((a, b) => {
        // Perdidos siempre al fondo
        const esPerdidoA = a.etapaEmbudo === 'perdido';
        const esPerdidoB = b.etapaEmbudo === 'perdido';
        if (esPerdidoA !== esPerdidoB) return esPerdidoA ? 1 : -1;

        // Con próxima llamada urgente primero (vencidas aún antes que futuras)
        const tieneRecordA = !!a.proximaLlamada;
        const tieneRecordB = !!b.proximaLlamada;
        if (tieneRecordA !== tieneRecordB) return tieneRecordA ? -1 : 1;
        if (tieneRecordA && tieneRecordB) {
            const ahora = Date.now();
            const vencidaA = new Date(a.proximaLlamada).getTime() < ahora;
            const vencidaB = new Date(b.proximaLlamada).getTime() < ahora;
            if (vencidaA !== vencidaB) return vencidaA ? -1 : 1; // vencidas primero
            return new Date(a.proximaLlamada) - new Date(b.proximaLlamada);
        }

        // Mayor interés primero
        const interesA = a.interes || 0;
        const interesB = b.interes || 0;
        if (interesB !== interesA) return interesB - interesA;

        // Etapa más avanzada primero
        const orA = ORDEN_ETAPA[a.etapaEmbudo] ?? 10;
        const orB = ORDEN_ETAPA[b.etapaEmbudo] ?? 10;
        return orA - orB;
    });

    const handleExportCsv = () => {
        if (prospectos.length === 0) { toast.error('No hay prospectos para exportar.'); return; }
        const csv = prospectosToCsv(prospectos);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `prospectos_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success(`${prospectos.length} prospectos exportados.`);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        setCsvFile(file); setImportResult(null);
        const reader = new FileReader();
        reader.onload = (evt) => setCsvPreview(csvToProspectos(evt.target.result));
        reader.readAsText(file, 'UTF-8');
    };

    const handleImportCsv = async () => {
        if (!csvPreview || csvPreview.data.length === 0) { toast.error('No hay datos válidos para importar.'); return; }
        try {
            setImportando(true);
            const response = await axios.post(`${API_URL}/api/${rolePath}/importar-csv`, { prospectos: csvPreview.data }, { headers: getAuthHeaders() });
            setImportResult(response.data);
            cargarDatos();
            toast.success(`Importación completada: ${response.data.insertados} nuevos.`);
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al importar el CSV.');
        } finally { setImportando(false); }
    };

    const resetImportModal = () => {
        setCsvFile(null); setCsvPreview(null); setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsImportModalAbierto(false);
    };

    const handleEliminarProspecto = async () => {
        if (!prospectoAEliminar) return;
        try {
            setEliminando(true);
            await axios.delete(`${API_URL}/api/${rolePath}/prospectos/${prospectoAEliminar.id || prospectoAEliminar._id}`, { headers: getAuthHeaders() });
            toast.success('Prospecto eliminado correctamente');
            setProspectoAEliminar(null);
            cargarDatos();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al eliminar el prospecto');
        } finally { setEliminando(false); }
    };

    const handleCrearProspecto = async () => {
        setLoadingCrear(true);
        try {
            const telefonosLimpios = formCrear.telefonos.filter(t => t.trim());
            const correosLimpios = formCrear.correos.filter(e => e.trim());
            const payload = { ...formCrear, telefono: telefonosLimpios[0] || '', telefono2: telefonosLimpios.slice(1).join(', ') || '', correo: correosLimpios.join(', ') || '' };
            delete payload.telefonos;
            delete payload.correos;
            await axios.post(`${API_URL}/api/${rolePath}/crear-prospecto`, payload, {
                headers: getAuthHeaders()
            });
            toast.success('Prospecto creado');
            setModalCrearAbierto(false);
            setFormCrear({ nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefonos: [''], correos: [''], empresa: '', sitioWeb: '', ubicacion: '', notas: '', fuente: '' });
            cargarDatos();

            // Avanzar el bot automáticamente si está en el flujo de creación de prospecto
            const botState = useBotStore.getState();
            if (botState.currentStep && botState.currentStep.id.startsWith('create_prospect')) {
                if (botState.botActions?.stepSelectProspectAfterCreation) {
                    botState.botActions.stepSelectProspectAfterCreation();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al crear');
        } finally {
            setLoadingCrear(false);
        }
    };

    const handleSeleccionarProspecto = (p) => {
        setProspectoSeleccionado(p);
        if (p) {
            setSearchParams({ p: p.id || p._id });
            // Si el bot está activo y esperando que abramos el prospecto, avanzar al tour
            const botState = useBotStore.getState();
            if (botState.isOpen && (botState.currentStep?.id === 'select_created' || botState.currentStep?.id === 'select_prospect')) {
                if (botState.botActions?.stepTourDetailInteres) {
                    setTimeout(() => {
                        botState.botActions.stepTourDetailInteres();
                    }, 300);
                }
            }
        } else {
            setSearchParams({});
        }
    };

    
    
    const handlePasarACliente = async () => {
        if (!prospectoSeleccionado) return;
        const pid = prospectoSeleccionado.id || prospectoSeleccionado._id;
        setLoadingConversion(true);
        try {
            await axios.post(`${API_URL}/api/${rolePath}/pasar-a-cliente/${pid}`,
                { notas: notaConversion, fuente: prospectoSeleccionado.fuente || prospectoSeleccionado.origen || '' },
                { headers: getAuthHeaders() }
            );
            toast.success('¡Prospecto convertido a cliente exitosamente! 🎉');
            setModalPasarClienteAbierto(false);
            setNotaConversion('');
            setProspectoSeleccionado(null);
            cargarDatos();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al convertir a cliente');
        } finally {
            setLoadingConversion(false);
        }
    };

    const handleDescartar = async () => {
        if (!prospectoSeleccionado) return;
        const pid = prospectoSeleccionado.id || prospectoSeleccionado._id;
        setLoadingConversion(true);
        try {
            await axios.post(`${API_URL}/api/${rolePath}/descartar-prospecto/${pid}`,
                { 
                    notas: notaDescarte || 'Prospecto descartado',
                    motivoPerdida: motivoPerdida || 'Otro'
                },
                { headers: getAuthHeaders() }
            );
            toast('Prospecto descartado', { icon: '🗑️' });
            setModalDescartarAbierto(false);
            setNotaDescarte('');
            setProspectoSeleccionado(null);
            cargarDatos();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al descartar');
        } finally {
            setLoadingConversion(false);
        }
    };


    
    // Shared Modals Render Function
    const renderModales = () => (
        <>
            {/* Modal Crear Prospecto - Rediseño Premium */}
            {modalCrearAbierto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-300">
                        {/* Header Moderno con Gradiente */}
                        <div className="px-6 py-5 bg-linear-to-r from-(--theme-50) to-white border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-(--theme-100) rounded-2xl flex items-center justify-center shadow-inner">
                                    <UserPlus className="w-6 h-6 text-(--theme-600)" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Nuevo Prospecto</h2>
                                    <p className="text-xs text-slate-500 font-medium">Ingresa los datos para iniciar el seguimiento</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setModalCrearAbierto(false);
                                    setFormCrear({ nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefonos: [''], correos: [''], empresa: '', sitioWeb: '', ubicacion: '', notas: '', fuente: '' });
                                }} 
                                className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Contenido del Formulario */}
                        <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                
                                {/* Columna 1: Identidad */}
                                <div className="space-y-5">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-3 bg-(--theme-500) rounded-full"></div>{t("Identidad")}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Nombres *")}</label>
                                            <input
                                                id="crear-prospecto-nombres"
                                                type="text"
                                                value={formCrear.nombres}
                                                onChange={(e) => setFormCrear((f) => ({ ...f, nombres: e.target.value }))}
                                                onFocus={() => handleInputFocus('create_prospect')}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                placeholder="Juan"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Apellido Paterno")}</label>
                                                <input
                                                    id="crear-prospecto-apellido-paterno"
                                                    type="text"
                                                    value={formCrear.apellidoPaterno}
                                                    onChange={(e) => setFormCrear((f) => ({ ...f, apellidoPaterno: e.target.value }))}
                                                    onFocus={() => handleInputFocus('create_prospect_surnames')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                    placeholder="García"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Apellido Materno")}</label>
                                                <input
                                                    id="crear-prospecto-apellido-materno"
                                                    type="text"
                                                    value={formCrear.apellidoMaterno}
                                                    onChange={(e) => setFormCrear((f) => ({ ...f, apellidoMaterno: e.target.value }))}
                                                    onFocus={() => handleInputFocus('create_prospect_surname_materno')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                    placeholder="López"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna 2: Contacto */}
                                <div className="space-y-5">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>{t("Contacto")}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">{t("Teléfonos * (Incluye Lada ej: +52)")}</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormCrear((f) => ({ ...f, telefonos: [...f.telefonos, ''] }))}
                                                    className="text-[10px] text-(--theme-600) hover:text-(--theme-700) font-black uppercase tracking-tighter"
                                                >{t("+ Añadir otro")}
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {formCrear.telefonos.map((tel, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                        <input
                                                            id={`crear-prospecto-telefonos-${idx}`}
                                                            type="tel"
                                                            value={tel}
                                                            onChange={(e) => setFormCrear((f) => { const t = [...f.telefonos]; t[idx] = e.target.value; return { ...f, telefonos: t }; })}
                                                            onFocus={() => handleInputFocus('create_prospect_phone')}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                            placeholder="Ej: +52 81 1216 9211"
                                                        />
                                                        {formCrear.telefonos.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormCrear((f) => ({ ...f, telefonos: f.telefonos.filter((_, i) => i !== idx) }))}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">{t("Correos Electrónicos")}</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormCrear((f) => ({ ...f, correos: [...f.correos, ''] }))}
                                                    className="text-[10px] text-(--theme-600) hover:text-(--theme-700) font-black uppercase tracking-tighter"
                                                >{t("+ Añadir otro")}
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {formCrear.correos.map((cor, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                        <input
                                                            id={`crear-prospecto-correos-${idx}`}
                                                            type="email"
                                                            value={cor}
                                                            onChange={(e) => setFormCrear((f) => { const c = [...f.correos]; c[idx] = e.target.value; return { ...f, correos: c }; })}
                                                            onFocus={() => handleInputFocus('create_prospect_emails')}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                            placeholder="ejemplo@correo.com"
                                                        />
                                                        {formCrear.correos.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormCrear((f) => ({ ...f, correos: f.correos.filter((_, i) => i !== idx) }))}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-500 transition-colors"
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

                                {/* Columna 3: Empresa y Lugar */}
                                <div className="space-y-5">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>{t("Empresa & Sitio")}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Nombre de Empresa")}</label>
                                            <div className="relative group">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                <input
                                                    id="crear-prospecto-empresa"
                                                    type="text"
                                                    value={formCrear.empresa}
                                                    onChange={(e) => setFormCrear((f) => ({ ...f, empresa: e.target.value }))}
                                                    onFocus={() => handleInputFocus('create_prospect_company')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                    placeholder="Empresa S.A."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Sitio Web")}</label>
                                            <div className="relative group">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                <input
                                                    id="crear-prospecto-sitio-web"
                                                    type="url"
                                                    value={formCrear.sitioWeb}
                                                    onChange={(e) => setFormCrear((f) => ({ ...f, sitioWeb: e.target.value }))}
                                                    onFocus={() => handleInputFocus('create_prospect_website')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                    placeholder="https://google.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{t("Ubicación")}</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                <input
                                                    id="crear-prospecto-ubicacion"
                                                    type="text"
                                                    value={formCrear.ubicacion}
                                                    onChange={(e) => setFormCrear((f) => ({ ...f, ubicacion: e.target.value }))}
                                                    onFocus={() => handleInputFocus('create_prospect_location')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                    placeholder="CDMX, México"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-3 space-y-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                        Notas & Contexto Inicial
                                    </h3>
                                    <textarea
                                        id="crear-prospecto-notas"
                                        rows={2}
                                        value={formCrear.notas}
                                        onChange={(e) => setFormCrear((f) => ({ ...f, notas: e.target.value }))}
                                        onFocus={() => handleInputFocus('create_prospect_notes')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium resize-none mb-2"
                                        placeholder="Escribe aquí cualquier detalle relevante sobre el prospecto antes de crearlo..."
                                    />

                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 pt-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                        Fuente del Prospecto
                                    </h3>
                                    <div 
                                        id="crear-prospecto-fuente"
                                        onFocus={() => handleInputFocus('create_prospect_source')}
                                        onClick={() => handleInputFocus('create_prospect_source')}
                                    >
                                        <SourcePicker 
                                            selectedSource={formCrear.fuente} 
                                            onChange={(val) => setFormCrear(f => ({ ...f, fuente: val }))} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer con Botones Premium */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button
                                onClick={() => {
                                    setModalCrearAbierto(false);
                                    setFormCrear({ nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefonos: [''], correos: [''], empresa: '', sitioWeb: '', ubicacion: '', notas: '', fuente: '' });
                                }}
                                className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                id="crear-prospecto-confirmar"
                                onClick={handleCrearProspecto}
                                disabled={loadingCrear}
                                onFocus={() => handleInputFocus('create_prospect_confirm')}
                                className="flex-2 px-6 py-3.5 bg-linear-to-r from-(--theme-600) to-(--theme-700) text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-(--theme-500)/25"
                            >
                                {loadingCrear ? 'Procesando...' : 'Confirmar y Crear Prospecto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Editar Prospecto - Rediseño Moderno */}
            {modalEditarAbierto && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[82vh] overflow-hidden animate-fadeIn">
                        {/* Header */}
                        <div className="px-6 py-4 bg-linear-to-r from-(--theme-50) to-white border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-(--theme-100) rounded-xl flex items-center justify-center">
                                    <Edit2 className="w-5 h-5 text-(--theme-600)" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Editar Prospecto</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Actualiza la información de contacto</p>
                                </div>
                            </div>
                            <button onClick={() => setModalEditarAbierto(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide">
                            {/* Sección: Datos Personales */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-4 bg-(--theme-500) rounded-full"></div>{t("Información Personal")}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">{t("Nombres *")}</label>
                                        <input
                                            type="text"
                                            value={prospectoAEditar.nombres}
                                            onChange={(e) => setProspectoAEditar((f) => ({ ...f, nombres: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none hover:border-slate-300"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">{t("Apellido Paterno")}</label>
                                            <input
                                                type="text"
                                                value={prospectoAEditar.apellidoPaterno}
                                                onChange={(e) => setProspectoAEditar((f) => ({ ...f, apellidoPaterno: e.target.value }))}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none hover:border-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">{t("Apellido Materno")}</label>
                                            <input
                                                type="text"
                                                value={prospectoAEditar.apellidoMaterno}
                                                onChange={(e) => setProspectoAEditar((f) => ({ ...f, apellidoMaterno: e.target.value }))}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none hover:border-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Contacto */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-4 bg-(--theme-500) rounded-full"></div>{t("Contacto")}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Teléfonos *")}</label>
                                            <button
                                                type="button"
                                                onClick={() => setProspectoAEditar((f) => ({ ...f, telefonos: [...(f.telefonos || ['']), ''] }))}
                                                className="flex items-center gap-1.5 text-xs text-(--theme-600) hover:text-(--theme-700) font-bold hover:bg-(--theme-50) px-2.5 py-1.5 rounded-lg transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Agregar
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {(prospectoAEditar.telefonos || ['']).map((tel, idx) => (
                                                <div key={idx} className="flex gap-3 items-center bg-linear-to-r from-slate-50 to-white p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group">
                                                    <Phone className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                                                    <input
                                                        type="tel"
                                                        value={tel}
                                                        onChange={(e) => setProspectoAEditar((f) => { const t = [...(f.telefonos || [''])]; t[idx] = e.target.value; return { ...f, telefonos: t }; })}
                                                        className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-1 outline-none"
                                                        placeholder="Ej: +56 9 1234 5678"
                                                    />
                                                    {(prospectoAEditar.telefonos || ['']).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setProspectoAEditar((f) => ({ ...f, telefonos: (f.telefonos || ['']).filter((_, i) => i !== idx) }))}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
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
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Correos Electrónicos")}</label>
                                            <button
                                                type="button"
                                                onClick={() => setProspectoAEditar((f) => ({ ...f, correos: [...(f.correos || ['']), ''] }))}
                                                className="flex items-center gap-1.5 text-xs text-(--theme-600) hover:text-(--theme-700) font-bold hover:bg-(--theme-50) px-2.5 py-1.5 rounded-lg transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Agregar
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {(prospectoAEditar.correos || ['']).map((cor, idx) => (
                                                <div key={idx} className="flex gap-3 items-center bg-linear-to-r from-slate-50 to-white p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group">
                                                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                                                    <input
                                                        type="email"
                                                        value={cor}
                                                        onChange={(e) => setProspectoAEditar((f) => { const c = [...(f.correos || [''])]; c[idx] = e.target.value; return { ...f, correos: c }; })}
                                                        className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-1 outline-none"
                                                        placeholder="ejemplo@correo.com"
                                                    />
                                                    {(prospectoAEditar.correos || ['']).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setProspectoAEditar((f) => ({ ...f, correos: (f.correos || ['']).filter((_, i) => i !== idx) }))}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
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

                            {/* Sección: Empresa */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-4 bg-(--theme-500) rounded-full"></div>
                                    Detalles de Empresa
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">{t("Empresa")}</label>
                                        <input
                                            type="text"
                                            value={prospectoAEditar.empresa}
                                            onChange={(e) => setProspectoAEditar((f) => ({ ...f, empresa: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none hover:border-slate-300"
                                            placeholder="Nombre de la empresa"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">{t("Sitio Web")}</label>
                                        <input
                                            type="url"
                                            value={prospectoAEditar.sitioWeb || ''}
                                            onChange={(e) => setProspectoAEditar((f) => ({ ...f, sitioWeb: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none hover:border-slate-300"
                                            placeholder="https://ejemplo.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">{t("Ubicación")}</label>
                                    <input
                                        type="text"
                                        value={prospectoAEditar.ubicacion || ''}
                                        onChange={(e) => setProspectoAEditar((f) => ({ ...f, ubicacion: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none hover:border-slate-300"
                                        placeholder="Ciudad, Estado"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Etapa del Embudo</label>
                                    <select
                                        value={prospectoAEditar.etapaEmbudo}
                                        onChange={(e) => setProspectoAEditar((f) => ({ ...f, etapaEmbudo: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-(--theme-400) focus:border-transparent transition-all outline-none hover:border-slate-300"
                                    >
                                        {Object.entries(ETAPAS_EMBUDO).map(([key, value]) => (
                                            <option key={key} value={key}>{value.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Origen del Prospecto</label>
                                    <SourcePicker
                                        selectedSource={prospectoAEditar.fuente || ''}
                                        onChange={(val) => setProspectoAEditar((f) => ({ ...f, fuente: val }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50 justify-end">
                            <button
                                onClick={() => setModalEditarAbierto(false)}
                                className="px-6 py-3 border border-slate-300 text-gray-700 rounded-lg text-sm hover:bg-white font-bold transition-all hover:shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditarProspecto}
                                disabled={loadingEditar}
                                className="px-8 py-3 bg-(--theme-600) text-white rounded-lg text-sm hover:bg-(--theme-700) font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                            >
                                {loadingEditar ? '⏳ Guardando...' : '✓ Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pasar a Cliente */}
            {modalPasarClienteAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-sm w-full">
                        <div className="p-4 border-b border-slate-100 bg-(--theme-50)">
                            <h2 className="text-lg font-bold text-(--theme-900)">🏆 Pasar a cliente</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <p className="text-gray-600 text-sm">
                                ¿Confirmas que <span className="font-semibold">{prospectoSeleccionado?.nombres} {prospectoSeleccionado?.apellidoPaterno}</span> se convierte en cliente?
                            </p>
                            <textarea
                                rows={2}
                                value={notaConversion}
                                onChange={e => setNotaConversion(e.target.value)}
                                placeholder="Notas (opcional)..."
                                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-(--theme-400)"
                            />
                        </div>
                        <div className="flex gap-2 p-4 border-t border-slate-100">
                            <button
                                onClick={() => { setModalPasarClienteAbierto(false); setNotaConversion(''); }}
                                className="flex-1 px-3 py-2 border border-slate-200 text-gray-700 rounded text-sm hover:bg-slate-50 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePasarACliente}
                                disabled={loadingConversion}
                                className="flex-1 px-3 py-2 bg-(--theme-600) text-white rounded text-sm hover:bg-(--theme-700) font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingConversion ? 'Procesando...' : '✓ Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Descartar Prospecto - Rediseño Premium */}
            {modalDescartarAbierto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Trash2 className="w-8 h-8 text-rose-600" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 text-center mb-2">Descartar Prospecto</h2>
                        <p className="text-sm text-gray-500 text-center mb-8 font-medium italic">¿Por qué este prospecto no avanzó? Esta información mejorará nuestras métricas.</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Motivo de pérdida</label>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {[
                                        'Precio muy alto', 
                                        'Eligió a la competencia', 
                                        'No contestó', 
                                        'Sin interés real', 
                                        'Fuera de presupuesto', 
                                        'Proyecto pausado', 
                                        'Otro'
                                    ].map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMotivoPerdida(m)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                motivoPerdida === m
                                                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                                    : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Notas adicionales</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none"
                                    rows="3"
                                    placeholder="Comentarios opcionales..."
                                    value={notaDescarte}
                                    onChange={(e) => setNotaDescarte(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setModalDescartarAbierto(false);
                                        setMotivoPerdida('');
                                        setNotaDescarte('');
                                    }}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={loadingConversion || !motivoPerdida}
                                    onClick={handleDescartar}
                                    className="flex-1 px-6 py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loadingConversion ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Eliminar Prospecto */}
            {prospectoAEliminar && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-sm w-full">
                        <div className="p-4 border-b border-red-100 bg-red-50 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <h2 className="text-lg font-bold text-red-800">Eliminar prospecto</h2>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-600 text-sm">
                                ¿Estás seguro de eliminar a <strong>{prospectoAEliminar.nombres} {prospectoAEliminar.apellidoPaterno}</strong>?
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className="flex gap-2 p-4 border-t border-slate-100">
                            <button
                                onClick={() => setProspectoAEliminar(null)}
                                className="flex-1 px-3 py-2 border border-slate-200 text-gray-700 rounded text-sm hover:bg-slate-50 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEliminarProspecto}
                                disabled={eliminando}
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Importar CSV */}
            {isImportModalAbierto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Importar Prospectos desde CSV</h2>
                            <button onClick={resetImportModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                <p className="font-semibold mb-1">Formato esperado:</p>
                                <p className="font-mono bg-amber-100 rounded p-1 overflow-x-auto whitespace-nowrap">Nombres,Apellido Paterno,Apellido Materno,Telefono,Correo,Empresa,Notas</p>
                                <p className="mt-1">Todos los campos son opcionales.</p>
                            </div>
                            {!importResult ? (
                                <>
                                    <div
                                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-(--theme-400) hover:bg-(--theme-50)/30 transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileChange({ target: { files: [f] } }); }}
                                    >
                                        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        {csvFile ? (
                                            <p className="font-semibold text-slate-700 text-sm">{csvFile.name}</p>
                                        ) : (
                                            <p className="text-slate-500 text-sm">Arrastra un CSV aquí o haz clic para seleccionar</p>
                                        )}
                                    </div>
                                    {csvPreview && (
                                        <div className="text-sm">
                                            <p className="font-semibold text-slate-700">{csvPreview.data.length} prospectos listos para importar</p>
                                            {csvPreview.errors.length > 0 && (
                                                <ul className="mt-1 text-amber-700 text-xs list-disc pl-4">
                                                    {csvPreview.errors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={resetImportModal} className="flex-1 px-3 py-2 border border-slate-200 text-gray-700 rounded text-sm hover:bg-slate-50 font-medium">Cancelar</button>
                                        <button
                                            onClick={handleImportCsv}
                                            disabled={importando || !csvPreview || csvPreview.data.length === 0}
                                            className="flex-1 px-3 py-2 bg-(--theme-600) text-white rounded text-sm hover:bg-(--theme-700) font-medium disabled:opacity-50"
                                        >
                                            {importando ? 'Importando...' : `Importar ${csvPreview?.data.length || 0} prospectos`}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-(--theme-50) border border-(--theme-200) rounded-lg p-3 text-sm text-(--theme-800)">
                                        <p className="font-semibold">✓ Importación completada</p>
                                        <p>Insertados: {importResult.insertados} · Duplicados: {importResult.duplicados} · Errores: {importResult.errores}</p>
                                    </div>
                                    <button onClick={resetImportModal} className="w-full px-3 py-2 bg-(--theme-600) text-white rounded text-sm hover:bg-(--theme-700) font-medium">Cerrar</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    // VISTA DETALLADA DEL PROSPECTO
    if (prospectoSeleccionado) {
        return (
            <>
                <ProspectoDetalle
                    prospecto={prospectoSeleccionado}
                    rolePath={rolePath}
                    onVolver={() => handleSeleccionarProspecto(null)}
                    onActualizado={cargarDatos}
                    abrirModalEditar={abrirModalEditar}
                    setModalPasarClienteAbierto={setModalPasarClienteAbierto}
                    setModalDescartarAbierto={setModalDescartarAbierto}
                />
                {renderModales()}
            </>
        );
    }
    // VISTA PRINCIPAL (LISTA DE PROSPECTOS)
    return (
        <div className="h-full flex flex-col p-3 bg-gray-50/50 animate-in fade-in duration-500">
            <div className="max-w-full mx-auto flex-1 flex flex-col w-full min-h-0 gap-3">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0 px-1">
                    <div>
                        <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-none mb-1">Prospectos</h1>
                        <p className="text-sm font-medium text-gray-500">
                            Cartera de prospectos
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                        <button
                            id="btn-importar-csv"
                            onClick={() => setIsImportModalAbierto(true)}
                            disabled={importando}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-bold"
                            title="Importar prospectos desde CSV"
                        >
                            {importando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {importando ? 'Importando...' : 'Importar CSV'}
                        </button>
                        <button
                            id="btn-exportar-csv"
                            onClick={handleExportCsv}
                            disabled={loading || !prospectosFiltrados.length}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm font-bold"
                            title="Exportar lista actual a CSV"
                        >
                            <Download className="w-4 h-4" />
                            Exportar CSV
                        </button>
                        <button
                            id="btn-crear-prospecto"
                            onClick={() => setModalCrearAbierto(true)}
                            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
                        >
                            <UserPlus className="w-5 h-5" />{t("Crear prospecto")}
                        </button>
                    </div>
                </div>

                {/* Buscador + Filtros */}
                <div id="seccion-filtros-busqueda" className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm shrink-0">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Búsqueda */}
                        <div className="relative w-full md:w-[350px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar prospectos..."
                                value={busquedaProspecto}
                                onChange={(e) => setBusquedaProspecto(e.target.value)}
                                className="w-full pl-9 pr-12 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-(--theme-500) focus:border-(--theme-500) bg-white text-sm font-medium text-slate-700"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded-full">
                                {prospectosFiltrados.length}/{prospectos.length}
                            </div>
                        </div>
                        
                        {/* Filtros */}
                        <div className="flex items-center gap-3 w-full overflow-x-auto scrollbar-hide">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            
                            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
                                {[
                                    { value: 'mine', label: 'Mis prospectos' },
                                    { value: 'shared', label: 'Compartidos' },
                                    { value: 'all', label: 'Todos visibles' },
                                ].map(btn => (
                                    <button
                                        key={btn.value}
                                        onClick={() => setFiltroVisibilidad(btn.value)}
                                        className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${filtroVisibilidad === btn.value
                                            ? 'bg-slate-700 text-white shadow-sm'
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
                                className="bg-transparent border-0 text-[13px] font-bold text-slate-700 cursor-pointer focus:ring-0 p-0 pr-6 shrink-0"
                            >
                                <option value="todos">Todos los prospectos</option>
                                <option value="en_contacto">En contacto</option>
                                <option value="sin_respuesta">Sin contacto</option>
                                <option value="no_contactado">No contactado</option>
                                <option value="con_cita">Con cita</option>
                            </select>

                            {/* Recordatorio pendiente */}
                            <button
                                onClick={() => setFiltroRecordatorio(v => !v)}
                                className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border text-sm transition-all ml-auto ${filtroRecordatorio
                                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                title="Solo con recordatorio de llamada"
                            >
                                <Bell className="w-4 h-4" />
                            </button>
                            
                            {/* Reset filtros */}
                            {(filtroEtapa !== 'todos' || filtroRecordatorio || busquedaProspecto || filtroVisibilidad !== 'mine') && (
                                <button
                                    onClick={() => { setFiltroEtapa('todos'); setFiltroRecordatorio(false); setBusquedaProspecto(''); setFiltroVisibilidad('mine'); }}
                                    className="shrink-0 flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                                    title="Limpiar filtros"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lista de Prospectos (Tarjetas o Tabla simplificada) */}
                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
                            <h2 className="text-[13px] font-black text-slate-800 tracking-wider">MI LISTA (CARGANDO...)</h2>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest w-1/5"><div className="h-2.5 bg-slate-200/80 rounded-full w-20 animate-pulse"></div></th>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest"><div className="h-2.5 bg-slate-200/80 rounded-full w-24 animate-pulse"></div></th>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest w-1/5"><div className="h-2.5 bg-slate-200/80 rounded-full w-20 animate-pulse"></div></th>
                                        <th className="px-6 py-3 text-center font-bold text-[10px] tracking-widest"><div className="h-2.5 bg-slate-200/80 rounded-full w-16 mx-auto animate-pulse"></div></th>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest"><div className="h-2.5 bg-slate-200/80 rounded-full w-28 animate-pulse"></div></th>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest"><div className="h-2.5 bg-slate-200/80 rounded-full w-24 animate-pulse"></div></th>
                                        <th className="px-6 py-3 text-center font-bold text-[10px] tracking-widest"><div className="h-2.5 bg-slate-200/80 rounded-full w-14 mx-auto animate-pulse"></div></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[1, 2, 3, 4, 5].map((idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-5 font-medium">
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-slate-200/80 rounded-md w-32 animate-pulse"></div>
                                                    <div className="h-3 bg-slate-100 rounded-md w-24 animate-pulse"></div>
                                                    <div className="flex items-center gap-1 pt-1">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <div key={s} className="h-2.5 w-2.5 rounded-full bg-slate-100 animate-pulse"></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded-md w-8 animate-pulse"></div></td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5">
                                                    <div className="h-3.5 bg-slate-100 rounded-md w-28 animate-pulse"></div>
                                                    <div className="h-3.5 bg-slate-100 rounded-md w-32 animate-pulse"></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center"><div className="h-6 bg-slate-200/80 rounded-full w-24 mx-auto animate-pulse"></div></td>
                                            <td className="px-6 py-5"><div className="h-3.5 bg-slate-100 rounded-md w-24 animate-pulse"></div></td>
                                            <td className="px-6 py-5"><div className="h-3.5 bg-slate-100 rounded-md w-24 animate-pulse"></div></td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <div className="h-4 w-4 rounded-full bg-slate-100 animate-pulse"></div>
                                                    <div className="h-4 w-4 rounded-full bg-slate-100 animate-pulse"></div>
                                                    <div className="h-4 w-4 rounded-full bg-slate-100 animate-pulse"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : prospectosFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 flex-1 flex flex-col items-center justify-center text-center border border-slate-200 shadow-sm min-h-0">
                        <User className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-gray-500 font-bold">No se encontraron prospectos.</p>
                        <p className="text-gray-400 text-sm mt-1 font-medium">Intenta con otra busqueda o crea uno nuevo.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 flex flex-col min-h-0">
                        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
                            <h2 className="text-[13px] font-black text-slate-700 tracking-wider uppercase">
                                {filtroVisibilidad === 'mine'
                                    ? `MI LISTA (PRIVADOS) (${prospectosFiltrados.length})`
                                    : filtroVisibilidad === 'shared'
                                    ? `MI LISTA (COMPARTIDOS) (${prospectosFiltrados.length})`
                                    : `TODOS LOS VISIBLES (${prospectosFiltrados.length})`}
                            </h2>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table id="tabla-prospectos" className="min-w-full text-sm">
                                <thead className="bg-white sticky top-0 z-10 border-b border-slate-100 text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest w-1/5">Cliente</th>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest w-1/5">Contacto</th>
                                        <th className="px-6 py-3 text-center font-bold text-[10px] tracking-widest">Etapa</th>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest">Última interacción</th>
                                        <th className="px-6 py-3 text-left font-bold text-[10px] tracking-widest">Recordatorio</th>
                                        <th className="px-6 py-3 text-center font-bold text-[10px] tracking-widest">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {prospectosFiltrados.map((p) => (
                                        <tr key={p._id || p.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer" onClick={() => handleSeleccionarProspecto(p)}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-gray-900 leading-tight text-sm flex items-center gap-1.5 mb-0.5">
                                                        {p.nombres} {p.apellidoPaterno}
                                                        {p.whatsappPendiente && (
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
                                                        {p.empresa || '—'}
                                                    </p>
                                                    <div className="flex items-center gap-0.5 text-yellow-500 scale-75 origin-left">
                                                        {[1, 2, 3, 4, 5].map((value) => (
                                                            <Star key={value} className={`w-3.5 h-3.5 ${p.interes >= value ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1.5">
                                                    <p className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        {p.telefono || '—'}
                                                    </p>
                                                    <p className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        {p.correo ? p.correo.split(',')[0].trim() : '—'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {p.etapaEmbudo === 'prospecto_nuevo' && !p.ultimaActTipo ? (
                                                    <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600">
                                                        {t("SIN CONTACTO")}
                                                    </span>
                                                ) : (
                                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getEtapaColor(p.etapaEmbudo)}`}>
                                                        {getEtapaLabel(p.etapaEmbudo)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 max-w-[200px]">
                                                {p.ultimaActTipo ? (
                                                    <div className="flex items-start gap-1.5">
                                                        <div className="mt-0.5 shrink-0">
                                                            {p.ultimaActTipo === 'llamada' && <Phone className="w-3 h-3 text-(--theme-500)" />}
                                                            {p.ultimaActTipo === 'whatsapp' && <MessageSquare className="w-3 h-3 text-green-500" />}
                                                            {p.ultimaActTipo === 'correo' && <Mail className="w-3 h-3 text-purple-500" />}
                                                            {p.ultimaActTipo === 'cita' && <Calendar className="w-3 h-3 text-(--theme-500)" />}
                                                            {!['llamada', 'whatsapp', 'correo', 'cita'].includes(p.ultimaActTipo) && <Clock className="w-3 h-3 text-slate-400" />}
                                                        </div>
                                                        <p className="text-xs text-blue-600 leading-snug" title={p.ultimaActNotas || ''}>
                                                            {p.ultimaActNotas
                                                                ? (p.ultimaActNotas.length > 50 ? p.ultimaActNotas.slice(0, 50) + '…' : p.ultimaActNotas)
                                                                : <span className="italic text-slate-400">{getTipoLabel(p.ultimaActTipo)}</span>}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300 italic font-medium">Sin interacciones</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                 <div className="flex flex-col gap-1.5">
                                                     {/* Próxima Cita (Meeting) */}
                                                     {p.proximaCita && (() => {
                                                         const esVencido = new Date(p.proximaCita) < new Date();
                                                         return (
                                                             <div className={`flex items-center gap-1.5 ${esVencido ? 'text-red-600' : 'text-indigo-600'}`}>
                                                                 <Video className="w-3.5 h-3.5 shrink-0" />
                                                                 <span className="text-xs font-medium leading-tight tracking-tight">
                                                                     {new Date(p.proximaCita).toLocaleString('es-MX', {
                                                                         day: 'numeric',
                                                                         month: 'short',
                                                                         hour: '2-digit',
                                                                         minute: '2-digit'
                                                                     })}
                                                                     {esVencido && ' ⚠'}
                                                                 </span>
                                                             </div>
                                                         );
                                                     })()}

                                                     {/* Recordatorio de Llamada */}
                                                     {p.proximaLlamada && (() => {
                                                         const citaMismaFecha = p.proximaCita && (new Date(p.proximaLlamada).getTime() === new Date(p.proximaCita).getTime());
                                                         if (citaMismaFecha) return null;

                                                         const esVencido = new Date(p.proximaLlamada) < new Date();
                                                         return (
                                                             <div className={`flex items-center gap-1.5 ${esVencido ? 'text-red-600' : 'text-slate-600'}`}>
                                                                 <Phone className="w-3.5 h-3.5 shrink-0" />
                                                                 <span className="text-xs font-medium leading-tight tracking-tight">
                                                                     {new Date(p.proximaLlamada).toLocaleString('es-MX', {
                                                                         day: 'numeric',
                                                                         month: 'short',
                                                                         hour: '2-digit',
                                                                         minute: '2-digit'
                                                                     })}
                                                                     {esVencido && ' ⚠'}
                                                                 </span>
                                                             </div>
                                                         );
                                                     })()}

                                                     {!p.proximaLlamada && !p.proximaCita && (
                                                         <span className="text-xs text-slate-300 italic font-medium">Sin pendiente</span>
                                                     )}
                                                 </div>
                                             </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    {(p.esPropietario === true || isOwnerRecord(p)) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleCompartido(p, !p.compartido);
                                                            }}
                                                            className={`p-1.5 rounded-lg transition-all border ${
                                                                p.compartido
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs'
                                                                    : 'text-slate-300 hover:text-emerald-500 border-transparent hover:bg-slate-50'
                                                            }`}
                                                            title={p.compartido ? 'Compartido (clic para volver privado)' : 'Privado (clic para compartir)'}
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); abrirModalEditar(p); }}
                                                        className="text-slate-300 hover:text-(--theme-600) transition-colors p-1.5 rounded-md hover:bg-slate-50"
                                                        title="Editar Prospecto"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setProspectoAEliminar(p); }}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-slate-50"
                                                        title="Eliminar Prospecto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Paginación */}
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 bg-white rounded-b-xl gap-4">
                            <span className="text-sm text-slate-500 font-medium">Mostrando {prospectos.length} de {totalItems} prospectos</span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="px-3 py-1.5 border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50 font-medium text-slate-700"
                                >
                                    Anterior
                                </button>
                                <span className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-50 rounded border border-slate-100">
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="px-3 py-1.5 border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50 font-medium text-slate-700"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {renderModales()}
        </div>
    );
};

export default Seguimiento;
