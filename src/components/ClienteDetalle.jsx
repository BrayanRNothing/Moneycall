import { useTranslation } from '../utils/translations';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Phone, MessageSquare, Mail, Calendar, CheckCircle2,
    XCircle, Clock, Star, ArrowLeft, RefreshCw, X, Building2, MapPin, Globe, Edit2, Bell, Send, Trash2, Eye, Copy, ExternalLink, DollarSign, Plus, FileText, ChevronDown, Save, History, TrendingUp,
    CreditCard, Package, FolderOpen, Upload, ArrowRightLeft, BadgeDollarSign, AlertTriangle, RotateCcw, FilePlus, Target, HelpCircle, List
} from 'lucide-react';

import { getToken, getUser } from '../utils/authUtils';
import API_URL from '../config/api';
import TimeWheelPicker from './TimeWheelPicker';
import HistorialInteracciones from './HistorialInteracciones';
import PlantillasMensajesModal from './PlantillasMensajesModal';
import ModulosCliente from './ModulosCliente';
import KpiRotativas from './KpiRotativas';
import GmailIcon from '../assets/google-gmail-svgrepo-com.svg';

const ETAPAS_EMBUDO = {
    'venta_ganada': { label: 'Cliente ganado', color: 'bg-green-100 text-green-700' },
    'cotizacion_realizada': { label: 'Cotización realizada', color: 'bg-blue-100 text-blue-700' },
    'contrato_firmado': { label: 'Contrato firmado', color: 'bg-indigo-100 text-indigo-700' },
    'esperando_pago': { label: 'Esperando pago', color: 'bg-amber-100 text-amber-700' },
    'cliente_activo': { label: 'Cliente activo', color: 'bg-emerald-100 text-emerald-700' },
    // Compatibilidad con etapas antiguas que podrían existir en datos ya guardados.
    'Cliente_nuevo': { label: 'Sin contacto', color: 'bg-red-100 text-red-600' },
    'en_contacto': { label: 'En contacto', color: 'bg-[var(--theme-100)] text-[var(--theme-600)]' },
    'reunion_agendada': { label: 'Cita agendada', color: 'bg-[var(--theme-100)] text-[var(--theme-600)]' },
    'reunion_realizada': { label: 'Cita realizada', color: 'bg-[var(--theme-100)] text-[var(--theme-600)]' },
    'en_negociacion': { label: 'Negociación', color: 'bg-amber-100 text-amber-600' },
    'perdido': { label: 'Perdido', color: 'bg-rose-100 text-rose-600' }
};

const getEtapaLabel = (etapa) => ETAPAS_EMBUDO[etapa]?.label || etapa;
const getEtapaColor = (etapa) => ETAPAS_EMBUDO[etapa]?.color || 'bg-gray-100 text-gray-600';

const getAuthHeaders = () => ({
    'x-auth-token': getToken() || ''
});

const getCalendarRolePath = () => {
    const { t } = useTranslation();
    const user = getUser();
    const role = String(user?.rol || '').toLowerCase();
    if (role === 'admin') return 'vendedor';
    return 'vendedor';
};

const formatHora = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const toLocalDateTimeInput = (value = new Date()) => {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';

    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toUtcIsoFromLocalInput = (localValue) => {
    if (!localValue) return null;
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
};

export default function ClienteDetalle({
    Cliente: initialCliente,
    rolePath,
    onVolver,
    onActualizado,
    abrirModalEditar
}) {
    const navigate = useNavigate();
    const calendarRolePath = getCalendarRolePath();

    const [ClienteSeleccionado, setClienteSeleccionado] = useState(initialCliente);
    const pid = ClienteSeleccionado?.id || ClienteSeleccionado?._id;

    const correosContacto = useMemo(() => {
        return (ClienteSeleccionado?.correo || '')
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean);
    }, [ClienteSeleccionado?.correo]);

    const tieneCorreo = correosContacto.length > 0;
    const correoPrincipal = correosContacto[0] || '';

    const [actividadesContext, setActividadesContext] = useState([]);
    const [loadingContext, setLoadingContext] = useState(false);

    const [notasRapidas, setNotasRapidas] = useState(initialCliente?.notas || '');
    const [loadingNotas, setLoadingNotas] = useState(false);

    const [muralTexto, setMuralTexto] = useState('');
    const [guardandoMural, setGuardandoMural] = useState(false);

    const [llamadaFlow, setLlamadaFlow] = useState(null);
    const [registrandoActividad, setRegistrandoActividad] = useState(false);
    const registrandoActividadRef = useRef(false);
    const registrandoActividadLockoutRef = useRef(0);
    const [registrandoActividadBlockedUntil, setRegistrandoActividadBlockedUntil] = useState(0);
    const [editandoEtapa, setEditandoEtapa] = useState(false);
    const [loadingEtapa, setLoadingEtapa] = useState(false);

    const [modalRecordatorioAbierto, setModalRecordatorioAbierto] = useState(false);
    const [recordatorio, setRecordatorio] = useState({ fechaProxima: '', notas: '', editandoId: null });
    const [guardandoRecordatorio, setGuardandoRecordatorio] = useState(false);
    const [recordatorioBlockedUntil, setRecordatorioBlockedUntil] = useState(0);
    const [modalAccionesCierreAbierto, setModalAccionesCierreAbierto] = useState(false);
    const [recordatoriosLlamada, setRecordatoriosLlamada] = useState([]);
    const [loadingCitaId, setLoadingCitaId] = useState(null);
    const [modalCita, setModalCita] = useState({ abierto: false, cita: null, editando: false });
    const [editDataCita, setEditDataCita] = useState({ fecha: '', notas: '' });
    const [monedaSeleccionada, setMonedaSeleccionada] = useState(initialCliente?.customMetricLabel || 'MXN');
    const [valorCliente, setValorCliente] = useState(initialCliente?.customMetricValue || '');
    const [guardandoMetrica, setGuardandoMetrica] = useState(false);
    // Toggle: mostrar botón de Venta o Llamada
    const [modoBotonPrincipal, setModoBotonPrincipal] = useState(() => {
        return localStorage.getItem('crm_modo_boton_principal') || 'llamada';
    });
    // Modal de registro de venta
    const [modalVenta, setModalVenta] = useState(false);
    const [ventaForm, setVentaForm] = useState({ descripcion: '', monto: '', tipo: 'venta', notas: '' });
    const [guardandoVenta, setGuardandoVenta] = useState(false);
    
    // Estados para Historial de Ventas y PDFs
    const [modalHistorialVentas, setModalHistorialVentas] = useState(false);
    const [ventasHistorial, setVentasHistorial] = useState([]);
    const [cargandoVentas, setCargandoVentas] = useState(false);
    const [pdfArchivo, setPdfArchivo] = useState(null);
    const [subiendoPdf, setSubiendoPdf] = useState(false);
    const [subiendoPdfVentaId, setSubiendoPdfVentaId] = useState(null);

    // ESTADOS PARA DIAGNÓSTICO MONEYCALL
    const [modalDiagnosticoAbierto, setModalDiagnosticoAbierto] = useState(false);
    const [formDiagnostico, setFormDiagnostico] = useState({ p1: '', p2: '', p3: '', p4: '', p5: '' });

    const [customSections, setCustomSections] = useState(() => {
        const val = initialCliente?.customSections;
        let parsed = [];
        if (Array.isArray(val)) {
            parsed = [...val];
        } else if (typeof val === 'string' && val.trim() !== '') {
            try {
                parsed = JSON.parse(val);
            } catch (e) {
                console.error("Error parsing customSections:", e);
                parsed = [];
            }
        }
        
        const hasContracts = parsed.some(s => s.tipo === 'contracts');
        const hasPayments = parsed.some(s => s.tipo === 'payments');
        
        if (!hasContracts) {
            parsed.push({
                id: `default_contracts_${Date.now()}`,
                tipo: 'contracts',
                titulo: 'Baúl de Contratos',
                contenido: []
            });
        }
        if (!hasPayments) {
            parsed.push({
                id: `default_payments_${Date.now()}`,
                tipo: 'payments',
                titulo: 'Estado de Pagos',
                contenido: []
            });
        }
        
        return parsed;
    });
    const [modalNuevaSeccion, setModalNuevaSeccion] = useState(false);
    const [drawerHistorialAbierto, setDrawerHistorialAbierto] = useState(false);
    const [mostrarNotasDefault, setMostrarNotasDefault] = useState(() => {
        const saved = localStorage.getItem('crm_mostrar_notas_default');
        return saved === null ? true : saved === 'true';
    });

    // Solo actualizar estado local al recibir nuevos datos
    useEffect(() => {
        if (initialCliente) {
            // Solo sobreescribir si no estamos en medio de una edición o si el ID cambió realmente
            const currentId = ClienteSeleccionado?.id || ClienteSeleccionado?._id;
            const newId = initialCliente.id || initialCliente._id;
            
            if (currentId !== newId) {
                setClienteSeleccionado(initialCliente);
                setNotasRapidas(initialCliente.notas || '');
                setMonedaSeleccionada(initialCliente.customMetricLabel || 'MXN');
                setValorCliente(initialCliente.customMetricValue || '');
                
                // Parsear customSections si viene como string
                let parsedSections = [];
                if (initialCliente.customSections) {
                    if (Array.isArray(initialCliente.customSections)) {
                        parsedSections = [...initialCliente.customSections];
                    } else {
                        try {
                            parsedSections = JSON.parse(initialCliente.customSections);
                        } catch (e) {
                            parsedSections = [];
                        }
                    }
                }
                
                const hasContracts = parsedSections.some(s => s.tipo === 'contracts');
                const hasPayments = parsedSections.some(s => s.tipo === 'payments');
                
                if (!hasContracts) {
                    parsedSections.push({
                        id: `default_contracts_${Date.now()}`,
                        tipo: 'contracts',
                        titulo: 'Baúl de Contratos',
                        contenido: []
                    });
                }
                if (!hasPayments) {
                    parsedSections.push({
                        id: `default_payments_${Date.now()}`,
                        tipo: 'payments',
                        titulo: 'Estado de Pagos',
                        contenido: []
                    });
                }
                
                setCustomSections(parsedSections);
            }
        }
    }, [initialCliente]);

    // Solo cargar el historial cuando cambie el ID del Cliente
    useEffect(() => {
        if (initialCliente && (initialCliente.id || initialCliente._id)) {
            handleSeleccionarClienteProp(initialCliente);
            cargarRecordatorios(initialCliente.id || initialCliente._id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCliente?.id, initialCliente?._id]);

    useEffect(() => {
        if (modalHistorialVentas && pid) {
            cargarVentasHistorial();
        }
    }, [modalHistorialVentas, pid]);

    const cargarRecordatorios = async (ClienteId) => {
        try {
            const res = await axios.get(`${API_URL}/api/${rolePath}/prospectos/${ClienteId}/recordatorios`, { headers: getAuthHeaders() });
            setRecordatoriosLlamada(res.data || []);
        } catch (err) {
            console.error('Error al cargar recordatorios:', err);
        }
    };

    const handleSeleccionarClienteProp = async (p) => {
        setLoadingContext(true);
        try {
            const endpoint = `${API_URL}/api/${rolePath}/prospecto/${p.id || p._id}/historial-completo`;
            const res = await axios.get(endpoint, { headers: getAuthHeaders() });

            if (res.data.timeline) {
                const actividades = res.data.timeline
                    .filter(item => item.tipo === 'actividad')
                    .map(act => ({
                        id: act.id,
                        tipo: act.tipoActividad,
                        fecha: act.fecha,
                        vendedor: act.vendedorId,
                        vendedorNombre: act.vendedorNombre,
                        vendedorRol: act.vendedorRol,
                        descripcion: act.descripcion,
                        resultado: act.resultado,
                        notas: act.notas,
                        googleMeetLink: act.googleMeetLink
                    }));
                setActividadesContext(actividades);
            } else {
                const fallbackRes = await axios.get(`${API_URL}/api/${rolePath}/prospectos/${p.id || p._id}/actividades`, { headers: getAuthHeaders() });
                setActividadesContext(fallbackRes.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar historial del Cliente');
            setActividadesContext([]);
        } finally {
            setLoadingContext(false);
        }
    };

    const handleSeleccionarCliente = () => {
        handleSeleccionarClienteProp(ClienteSeleccionado);
    };

    const handleDeleteActividadContext = async (actividadId) => {
        if (!window.confirm('¿Eliminar esta actividad? Esta acción no se puede deshacer.')) return;
        try {
            await axios.delete(`${API_URL}/api/actividades/${actividadId}`, { headers: getAuthHeaders() });
            setActividadesContext(prev => prev.filter(a => a.id !== actividadId));
            toast.success('Actividad eliminada');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar la actividad');
        }
    };

    const actualizarInteres = async (id, nuevoInteres) => {
        try {
            await axios.put(`${API_URL}/api/${rolePath}/prospectos/${id}`, { interes: nuevoInteres }, { headers: getAuthHeaders() });
            toast.success('Interés actualizado');
            setClienteSeleccionado({ ...ClienteSeleccionado, interes: nuevoInteres });
            if (onActualizado) onActualizado();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar interés');
        }
    };

    const handleGuardarNotasRapidas = async () => {
        if (!ClienteSeleccionado) return;
        setLoadingNotas(true);
        try {
            const pidLoc = ClienteSeleccionado.id || ClienteSeleccionado._id;
            await axios.put(`${API_URL}/api/${rolePath}/prospectos/${pidLoc}/editar`, {
                nombres: ClienteSeleccionado.nombres || '',
                apellidoPaterno: ClienteSeleccionado.apellidoPaterno || '',
                apellidoMaterno: ClienteSeleccionado.apellidoMaterno || '',
                telefono: ClienteSeleccionado.telefono || '',
                telefono2: ClienteSeleccionado.telefono2 || '',
                correo: ClienteSeleccionado.correo || '',
                empresa: ClienteSeleccionado.empresa || '',
                sitioWeb: ClienteSeleccionado.sitioWeb || '',
                ubicacion: ClienteSeleccionado.ubicacion || '',
                notas: notasRapidas
            }, { headers: getAuthHeaders() });

            toast.success('Notas guardadas');
            setClienteSeleccionado(prev => ({ ...prev, notas: notasRapidas }));
            if (onActualizado) onActualizado();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar notas');
        } finally {
            setLoadingNotas(false);
        }
    };

    const handleGuardarMetricaPersonalizada = async () => {
        if (!ClienteSeleccionado) return;
        setGuardandoMetrica(true);
        try {
            const pidLoc = ClienteSeleccionado.id || ClienteSeleccionado._id;
            await axios.put(`${API_URL}/api/${rolePath}/prospectos/${pidLoc}`, {
                customMetricLabel: monedaSeleccionada,
                customMetricValue: valorCliente
            }, { headers: getAuthHeaders() });
            setClienteSeleccionado(prev => ({ ...prev, customMetricLabel: monedaSeleccionada, customMetricValue: valorCliente }));
            if (onActualizado) onActualizado();
        } catch (error) {
            console.error('Error al guardar métrica personalizada:', error);
        } finally {
            setGuardandoMetrica(false);
        }
    };

    const handleGuardarSeccionesPersonalizadas = async (nuevasSecciones) => {
        if (!ClienteSeleccionado) return;
        try {
            const pidLoc = ClienteSeleccionado.id || ClienteSeleccionado._id;
            // Quitamos el /editar para que no sobrescriba los demás datos con vacíos
            const endpoint = `${API_URL}/api/${rolePath}/prospectos/${pidLoc}`;
            await axios.put(endpoint, {
                customSections: nuevasSecciones
            }, { headers: getAuthHeaders() });
            
            // Actualizar localmente para evitar parpadeos
            setClienteSeleccionado(prev => ({ ...prev, customSections: nuevasSecciones }));
            if (onActualizado) onActualizado();
        } catch (error) {
            console.error('Error al guardar secciones personalizadas:', error);
            toast.error('Error al guardar módulos');
        }
    };

    const addSeccion = (tipo, tituloSugerido) => {
        const titulo = tituloSugerido || (tipo === 'list' ? 'Nueva Lista' : 'Nuevas Notas');
        const nueva = { id: Date.now().toString(), tipo, titulo, contenido: tipo === 'list' ? [] : '' };
        const updated = [...customSections, nueva];
        setCustomSections(updated);
        handleGuardarSeccionesPersonalizadas(updated);
        setModalNuevaSeccion(false);
    };

    const updateSeccion = (id, campo, valor) => {
        setCustomSections(prev => prev.map(s => s.id === id ? { ...s, [campo]: valor } : s));
    };

    const commitSecciones = () => {
        setCustomSections(prev => {
            handleGuardarSeccionesPersonalizadas(prev);
            return prev;
        });
    };

    const deleteSeccion = (id) => {
        setCustomSections(prev => {
            const updated = prev.filter(s => s.id !== id);
            handleGuardarSeccionesPersonalizadas(updated);
            return updated;
        });
    };

    const toggleNotasDefault = () => {
        const newValue = !mostrarNotasDefault;
        setMostrarNotasDefault(newValue);
        localStorage.setItem('crm_mostrar_notas_default', newValue.toString());
    };

    const setClientes = () => {
        if (onActualizado) onActualizado();
    };

    // METODOLOGÍA MONEYCALL: LOGICA DE DIAGNÓSTICO Y COMPRAS
    const diagnosticoMoneycall = useMemo(() => {
        return customSections.find(s => s.tipo === 'moneycall_diagnostic');
    }, [customSections]);

    const seccionesDinamicas = useMemo(() => {
        return customSections.filter(s => s.tipo !== 'moneycall_diagnostic');
    }, [customSections]);

    const abrirDiagnostico = () => {
        if (diagnosticoMoneycall?.contenido) {
            setFormDiagnostico({
                p1: diagnosticoMoneycall.contenido.p1 || '',
                p2: diagnosticoMoneycall.contenido.p2 || '',
                p3: diagnosticoMoneycall.contenido.p3 || '',
                p4: diagnosticoMoneycall.contenido.p4 || '',
                p5: diagnosticoMoneycall.contenido.p5 || ''
            });
        } else {
            setFormDiagnostico({ p1: '', p2: '', p3: '', p4: '', p5: '' });
        }
        setModalDiagnosticoAbierto(true);
    };

    const guardarDiagnostico = async () => {
        const diagnosticSectionId = diagnosticoMoneycall?.id || `mc_${Date.now()}`;
        const nuevaSeccion = {
            id: diagnosticSectionId,
            tipo: 'moneycall_diagnostic',
            titulo: 'Diagnóstico Moneycall',
            contenido: formDiagnostico
        };

        let updated;
        if (diagnosticoMoneycall) {
            updated = customSections.map(s => s.tipo === 'moneycall_diagnostic' ? nuevaSeccion : s);
        } else {
            updated = [...customSections, nuevaSeccion];
        }

        setCustomSections(updated);
        await handleGuardarSeccionesPersonalizadas(updated);
        setModalDiagnosticoAbierto(false);
        toast.success('Diagnóstico guardado con éxito');
    };

    const comprasRegistradas = useMemo(() => {
        const list = [];
        // 1. De las actividades del historial
        actividadesContext.forEach(act => {
            if (act.tipo === 'venta') {
                list.push({
                    tipo: 'venta',
                    nombre: act.descripcion || 'Venta',
                    valor: act.notas || '',
                    fecha: act.fecha
                });
            }
        });
        // 2. De los módulos dinámicos
        customSections.forEach(s => {
            if (s.tipo === 'products' && Array.isArray(s.contenido)) {
                s.contenido.forEach(p => {
                    if (p.nombre) {
                        list.push({
                            tipo: 'producto',
                            nombre: p.nombre,
                            valor: p.precio ? `$${p.precio}` : '',
                            cantidad: p.cantidad
                        });
                    }
                });
            }
            if (s.tipo === 'sales' && Array.isArray(s.contenido)) {
                s.contenido.forEach(v => {
                    if (v.descripcion) {
                        list.push({
                            tipo: 'venta_modulo',
                            nombre: v.descripcion,
                            valor: v.monto ? `$${v.monto}` : '',
                            fecha: v.fecha
                        });
                    }
                });
            }
        });
        return list;
    }, [actividadesContext, customSections]);

    // Helpers para vista detallada
    const llamadasExitosas = actividadesContext.filter(a => a.tipo === 'llamada' && a.resultado === 'exitoso').length;
    const llamadasFallidas = actividadesContext.filter(a => a.tipo === 'llamada' && (a.resultado === 'fallido' || a.resultado === 'pendiente')).length;
    const getActIcon = (act) => {
        // Evaluamos primero notas para las opciones personalizables de llamadas
        if (act.tipo === 'llamada') {
            if (act.notas?.includes('WhatsApp')) return { icon: '💬', color: 'bg-green-500', label: 'WhatsApp / Correo' };
            if (act.notas?.includes('llamar después')) return { icon: '📅', color: 'bg-(--theme-500)', label: 'Llamar después' };
            if (act.notas?.toLowerCase().includes('sin interés')) return { icon: '👎', color: 'bg-gray-500', label: 'Sin interés' };
            if (act.notas?.includes('Agendó reunión')) return { icon: '🤝', color: 'bg-(--theme-500)', label: 'Cita Agendada' };

            if (act.resultado === 'exitoso') return { icon: '📞', color: 'bg-(--theme-500)', label: 'Llamada exitosa' };
            if (act.resultado === 'fallido') return { icon: '📵', color: 'bg-rose-500', label: 'Sin respuesta' };
        }

        if (act.tipo === 'cita') {
            const desc = act.descripcion || '';
            if (act.resultado === 'pendiente') return { icon: '📅', color: 'bg-(--theme-500)', label: 'Cita Agendada' };
            if (desc.includes('no asistió') || desc.includes('No asistió')) return { icon: '❌', color: 'bg-red-500', label: desc };
            if (desc.includes('Venta cerrada') || desc.includes('¡Venta')) return { icon: '🎉', color: 'bg-green-500', label: desc };
            if (desc.includes('cotización') || desc.includes('Cotización')) return { icon: '💰', color: 'bg-(--theme-600)', label: desc };
            if (desc.includes('otra reunión') || desc.includes('Otra reunión')) return { icon: '📅', color: 'bg-yellow-500', label: desc };
            if (desc.includes('No le interesó') || desc.includes('no le interesó')) return { icon: '😐', color: 'bg-gray-500', label: desc };
            return { icon: '📅', color: 'bg-(--theme-500)', label: desc || 'Reunión' };
        }
        if (act.tipo === 'whatsapp') return { icon: '💬', color: 'bg-green-500', label: 'WhatsApp' };
        if (act.tipo === 'cliente') return { icon: '🏆', color: 'bg-yellow-500', label: 'Convertido a cliente' };
        if (act.tipo === 'descartado') return { icon: '🗑️', color: 'bg-gray-400', label: 'Descartado' };
        if (act.tipo === 'venta') return { icon: '🛒', color: 'bg-emerald-500', label: act.descripcion || 'Venta registrada' };
        if (act.tipo === 'suscripcion') return { icon: '🔁', color: 'bg-violet-500', label: act.descripcion || 'Suscripción registrada' };
        return { icon: '📝', color: 'bg-slate-400', label: act.tipo || 'Interacción' };
    };
    const getResultadoTexto = (act) => {
        if (act.tipo === 'llamada' && act.resultado === 'exitoso') return 'Contestó ✔';
        if (act.tipo === 'llamada' && act.resultado === 'fallido') return 'No contestó ✗';
        if (act.tipo === 'cita') {
            if (act.resultado === 'pendiente') return 'Cita programada';
            if (act.descripcion) return act.descripcion;
            const mapa = { exitoso: 'Reunión realizada', fallido: 'No asistió / Cancelada', convertido: 'Venta cerrada' };
            return mapa[act.resultado] || act.resultado;
        }
        if (act.tipo === 'whatsapp') return 'Mensaje enviado';
        if (act.resultado) return act.resultado;
        return '';
    };

    // Citas pendientes futuras (puede haber múltiples)
    const citasPendientes = actividadesContext
        .filter(a => a.tipo === 'cita' && a.resultado === 'pendiente' && new Date(a.fechaCita || a.fecha) >= new Date())
        .sort((a, b) => new Date(a.fechaCita || a.fecha) - new Date(b.fechaCita || b.fecha));

    const alertasOrdenadas = useMemo(() => {
        const mapaPrioridad = {
            cita: 0,
            llamada: 1
        };

        const alertas = [
            ...citasPendientes.map((cita) => ({
                tipo: 'cita',
                id: cita.id || cita._id,
                fecha: new Date(cita.fechaCita || cita.fecha),
                data: cita
            })),
            ...recordatoriosLlamada.map((rec) => ({
                tipo: 'llamada',
                id: rec.id || rec._id,
                fecha: new Date(rec.fechaLimite),
                data: rec
            }))
        ];

        return alertas.sort((a, b) => {
            const prioridadA = mapaPrioridad[a.tipo] ?? 99;
            const prioridadB = mapaPrioridad[b.tipo] ?? 99;
            if (prioridadA !== prioridadB) return prioridadA - prioridadB;
            return a.fecha - b.fecha;
        });
    }, [citasPendientes, recordatoriosLlamada]);

    const totalAlertas = alertasOrdenadas.length;



    const registrarActividad = async (payload) => {
        // Guardia anti-doble envío: checkea tanto ref como lockout timer
        const now = Date.now();
        if (registrandoActividadRef.current || now - registrandoActividadLockoutRef.current < 1000) {
            return false;
        }

        registrandoActividadRef.current = true;
        registrandoActividadLockoutRef.current = now;
        setRegistrandoActividad(true);

        try {
            // Promover etapa automáticamente si corresponde
            const payloadFinal = { ...payload };
            if (
                payload.tipo === 'llamada' &&
                payload.resultado === 'exitoso' &&
                ClienteSeleccionado.etapaEmbudo === 'Cliente_nuevo'
            ) {
                payloadFinal.etapaEmbudo = 'en_contacto';
            }

            // Al registrar cualquier llamada, limpiar el seguimiento pendiente
            // (si se agenda nueva fecha, el flujo "Llamar después" la sobreescribe)
            if (payload.tipo === 'llamada' && ClienteSeleccionado.proximaLlamada) {
                await axios.put(`${API_URL}/api/${rolePath}/prospectos/${pid}`, {
                    proximaLlamada: null
                }, { headers: getAuthHeaders() });
            }

            await axios.post(`${API_URL}/api/${rolePath}/registrar-actividad`, { clienteId: pid, ...payloadFinal }, { headers: getAuthHeaders() });
            toast.success('Interacción registrada');

            // Recargar Cliente fresco desde el servidor (evitar estado obsoleto)
            const res = await axios.get(`${API_URL}/api/${rolePath}/prospectos`, { headers: getAuthHeaders() });
            const updated = res.data.find(p => p.id === pid || p._id === pid);
            if (updated) {
                setClienteSeleccionado(updated);
                setClientes(res.data);
            }
            // Recargar historial
            handleSeleccionarCliente(updated || ClienteSeleccionado);
            return true;
        } catch {
            toast.error('Error al registrar');
            return false;
        } finally {
            registrandoActividadRef.current = false;
            setRegistrandoActividad(false);
            // Bloquear por 3 segundos después de intentar (exitoso o error)
            const blockedUntil = Date.now() + 3000;
            setRegistrandoActividadBlockedUntil(blockedUntil);
        }
    };

    // Wrapper que valida el bloqueo de 3 segundos antes de permitir registro
    const registrarActividadConDelay = async (payload) => {
        const now = Date.now();
        if (now < registrandoActividadBlockedUntil) {
            return false;
        }
        return await registrarActividad(payload);
    };

    // Constante para verificar si está bloqueado (validando o en cooldown de 3s)
    const estaBloqueadoRegistro = Date.now() < registrandoActividadBlockedUntil || registrandoActividad || registrandoActividadRef.current;

    const registrarEnMural = async () => {
        const texto = muralTexto.trim();
        if (!texto) {
            toast.error('Escribe algo para registrar en el mural');
            return;
        }

        setGuardandoMural(true);
        try {
            await registrarActividad({
                tipo: 'mensaje',
                resultado: 'pendiente',
                descripcion: 'Nota rápida en mural',
                notas: texto
            });
            setMuralTexto('');
        } finally {
            setGuardandoMural(false);
        }
    };

    const abrirNuevoRecordatorio = () => {
        const fechaDefault = new Date();
        const isoDefault = toLocalDateTimeInput(fechaDefault);
        setRecordatorio({ fechaProxima: isoDefault, notas: '', editandoId: null });
        setModalRecordatorioAbierto(true);
    };

    const manejarRegistrarVenta = () => {
        setVentaForm({ descripcion: '', monto: '', tipo: 'venta', notas: '' });
        setModalVenta(true);
    };

    const cargarVentasHistorial = async () => {
        if (!pid) return;
        setCargandoVentas(true);
        try {
            const res = await axios.get(`${API_URL}/api/ventas/cliente/${pid}`, { headers: getAuthHeaders() });
            setVentasHistorial(res.data || []);
        } catch (err) {
            console.error('Error al cargar historial de ventas:', err);
            toast.error('No se pudo cargar el historial de ventas');
        } finally {
            setCargandoVentas(false);
        }
    };

    const handleSubirPdfVentaExistente = async (e, ventaId) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Solo se permiten archivos PDF');
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            toast.error('El archivo excede el límite de 15MB');
            return;
        }

        setSubiendoPdfVentaId(ventaId);
        const formData = new FormData();
        formData.append('archivo', file);

        try {
            const uploadRes = await axios.post(`${API_URL}/api/documentos/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': getToken()
                }
            });
            const pdf_url = uploadRes.data.url;

            await axios.put(`${API_URL}/api/ventas/${ventaId}/pdf`, { pdf_url }, { headers: getAuthHeaders() });
            toast.success('Comprobante PDF adjuntado con éxito');
            cargarVentasHistorial();
        } catch (err) {
            console.error('Error al subir PDF a venta:', err);
            toast.error('No se pudo adjuntar el PDF');
        } finally {
            setSubiendoPdfVentaId(null);
        }
    };

    const handleEliminarVenta = async (ventaId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta venta del historial? Esto también afectará el cálculo del ticket promedio.')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/api/ventas/${ventaId}`, { headers: getAuthHeaders() });
            toast.success('Venta eliminada con éxito');
            cargarVentasHistorial();
            handleSeleccionarCliente();
            if (onActualizado) await onActualizado();
        } catch (err) {
            console.error('Error al eliminar venta:', err);
            toast.error('No se pudo eliminar la venta');
        }
    };

    const handleGuardarVenta = async () => {
        if (!ventaForm.descripcion.trim()) return toast.error('Escribe una descripción para la venta');
        setGuardandoVenta(true);
        try {
            let uploadedPdfUrl = null;
            if (pdfArchivo) {
                setSubiendoPdf(true);
                const formData = new FormData();
                formData.append('archivo', pdfArchivo);
                try {
                    const uploadRes = await axios.post(`${API_URL}/api/documentos/upload`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'x-auth-token': getToken()
                        }
                    });
                    uploadedPdfUrl = uploadRes.data.url;
                } catch (uploadErr) {
                    console.error('Error al subir PDF:', uploadErr);
                    toast.error('No se pudo subir el archivo PDF. Registrando venta sin PDF.');
                } finally {
                    setSubiendoPdf(false);
                }
            }

            const desc = `${ventaForm.tipo === 'venta' ? '🛒 Venta' : '🔁 Suscripción'}: ${ventaForm.descripcion}${ventaForm.monto ? ` — $${ventaForm.monto}` : ''}${ventaForm.notas ? ` · ${ventaForm.notas}` : ''}`;
            await registrarActividad({
                tipo: ventaForm.tipo === 'suscripcion' ? 'suscripcion' : 'venta',
                resultado: 'exitoso',
                descripcion: desc,
                notas: ventaForm.notas,
                monto: ventaForm.monto,
                pdf_url: uploadedPdfUrl
            });
            setModalVenta(false);
            setPdfArchivo(null);
            toast.success('Venta registrada en el historial');
            
            if (modalHistorialVentas) {
                cargarVentasHistorial();
            }
            if (onActualizado) await onActualizado();
        } catch {
            toast.error('Error al registrar la venta');
        } finally {
            setGuardandoVenta(false);
        }
    };

    const handleEditarRecordatorio = (rec) => {
        setRecordatorio({
            fechaProxima: rec.fechaLimite ? toLocalDateTimeInput(rec.fechaLimite) : '',
            notas: rec.descripcion || '',
            editandoId: rec.id
        });
        setModalRecordatorioAbierto(true);
    };

    const syncRecordatorioFechaHora = (key, value) => {
        setRecordatorio((prev) => {
            const baseFecha = prev.fechaProxima || toLocalDateTimeInput();
            const [fechaActual = '', horaActual = '09:00'] = baseFecha.split('T');
            const siguienteFecha = key === 'fecha' ? value : (fechaActual || toLocalDateTimeInput().slice(0, 10));
            const siguienteHora = key === 'hora' ? value : (horaActual || '09:00');

            if (!siguienteFecha || !siguienteHora) {
                return { ...prev, fechaProxima: '' };
            }

            return { ...prev, fechaProxima: `${siguienteFecha}T${siguienteHora}` };
        });
    };

    const descartarRecordatorio = async (recId) => {
        try {
            await axios.delete(`${API_URL}/api/${rolePath}/recordatorios/${recId}`, { headers: getAuthHeaders() });
            setRecordatoriosLlamada(prev => prev.filter(r => r.id !== recId));
            if (onActualizado) await onActualizado();
            toast.success('Recordatorio eliminado');
        } catch (err) {
            console.error(err);
            toast.error('No se pudo eliminar el recordatorio');
        }
    };

    const handleDescartarCita = async (cita) => {
        if (!window.confirm('¿Descartar esta reunión? Se eliminará de la base de datos y se intentará quitar de Google Calendar.')) return;
        try {
            const id = cita.id || cita._id;
            // 1. Eliminar de Google Calendar (intento)
            try {
                await axios.delete(`${API_URL}/api/google/event-by-activity/${id}`, { headers: getAuthHeaders() });
            } catch (gErr) {
                console.warn('No se pudo eliminar de Google Calendar:', gErr.message);
            }
            // 2. Eliminar de la BD
            await axios.delete(`${API_URL}/api/actividades/${id}`, { headers: getAuthHeaders() });
            setActividadesContext(prev => prev.filter(a => (a.id || a._id) !== id));
            toast.success('Reunión descartada');
        } catch (error) {
            console.error(error);
            toast.error('Error al descartar la reunión');
        }
    };

    const handleActualizarCita = async () => {
        if (!editDataCita.fecha) return toast.error('La fecha es requerida');
        try {
            const id = modalCita.cita.id || modalCita.cita._id;
            // 1. Actualizar en la BD
            await axios.put(`${API_URL}/api/actividades/${id}`, {
                fecha: editDataCita.fecha,
                notas: editDataCita.notas
            }, { headers: getAuthHeaders() });

            // 2. Sincronizar con Google Calendar
            try {
                await axios.patch(`${API_URL}/api/google/event-by-activity/${id}`, {
                    startDateTime: new Date(editDataCita.fecha).toISOString(),
                    endDateTime: new Date(new Date(editDataCita.fecha).getTime() + 45 * 60000).toISOString(),
                    description: editDataCita.notas
                }, { headers: getAuthHeaders() });
            } catch (gErr) {
                console.warn('No se pudo sincronizar actualización con Google:', gErr.message);
            }

            // Actualizar contexto local
            setActividadesContext(prev => prev.map(a => 
                (a.id || a._id) === id 
                ? { ...a, fecha: editDataCita.fecha, notas: editDataCita.notas } 
                : a
            ));

            toast.success('Reunión actualizada');
            setModalCita({ abierto: false, cita: null, editando: false });
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar la reunión');
        }
    };

    const handleMarcarCitaRealizada = async (cita) => {
        if (!cita?.id) {
            toast.error('No se pudo identificar la cita');
            return;
        }
        setLoadingCitaId(cita.id);
        try {
            await axios.put(`${API_URL}/api/actividades/${cita.id}`, {
                resultado: 'exitoso',
                notas: cita.notas ? `${cita.notas}\n[Manual] Cita marcada como realizada` : '[Manual] Cita marcada como realizada'
            }, { headers: getAuthHeaders() });

            const quedanPendientes = citasPendientes.some((c) => c.id !== cita.id);
            if (!quedanPendientes && ClienteSeleccionado.etapaEmbudo === 'reunion_agendada') {
                await axios.put(`${API_URL}/api/${rolePath}/prospectos/${pid}/editar`, {
                    nombres: ClienteSeleccionado.nombres || '',
                    apellidoPaterno: ClienteSeleccionado.apellidoPaterno || '',
                    apellidoMaterno: ClienteSeleccionado.apellidoMaterno || '',
                    telefono: ClienteSeleccionado.telefono || '',
                    telefono2: ClienteSeleccionado.telefono2 || '',
                    correo: ClienteSeleccionado.correo || '',
                    empresa: ClienteSeleccionado.empresa || '',
                    sitioWeb: ClienteSeleccionado.sitioWeb || '',
                    ubicacion: ClienteSeleccionado.ubicacion || '',
                    notas: ClienteSeleccionado.notas || '',
                    etapaEmbudo: 'reunion_realizada'
                }, { headers: getAuthHeaders() });
                setClienteSeleccionado(prev => ({ ...prev, etapaEmbudo: 'reunion_realizada' }));
            }

            toast.success('Cita marcada como realizada');
            if (onActualizado) onActualizado();
            handleSeleccionarCliente(ClienteSeleccionado);
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar la cita');
        } finally {
            setLoadingCitaId(null);
        }
    };

    const handleCambiarEtapa = async (nuevaEtapa) => {
        setLoadingEtapa(true);
        try {
            await axios.put(`${API_URL}/api/${rolePath}/prospectos/${pid}/editar`, {
                nombres: ClienteSeleccionado.nombres || '',
                apellidoPaterno: ClienteSeleccionado.apellidoPaterno || '',
                apellidoMaterno: ClienteSeleccionado.apellidoMaterno || '',
                telefono: ClienteSeleccionado.telefono || '',
                telefono2: ClienteSeleccionado.telefono2 || '',
                correo: ClienteSeleccionado.correo || '',
                empresa: ClienteSeleccionado.empresa || '',
                sitioWeb: ClienteSeleccionado.sitioWeb || '',
                ubicacion: ClienteSeleccionado.ubicacion || '',
                notas: ClienteSeleccionado.notas || '',
                etapaEmbudo: nuevaEtapa
            }, { headers: getAuthHeaders() });
            toast.success(`Etapa actualizada: ${getEtapaLabel(nuevaEtapa)}`);
            setEditandoEtapa(false);
            const res = await axios.get(`${API_URL}/api/${rolePath}/prospectos`, { headers: getAuthHeaders() });
            const updated = res.data.find(p => p.id === pid || p._id === pid);
            if (updated) { setClienteSeleccionado(updated); }
            if (onActualizado) onActualizado();
        } catch (error) {
            console.error(error);
            toast.error('Error al cambiar la etapa');
        } finally {
            setLoadingEtapa(false);
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden p-4 sm:p-6 bg-slate-50 z-40">
            <style>{`
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            <div className="max-w-full mx-auto h-full flex flex-col gap-2">
                {/* Botón regresar */}
                <button
                    onClick={onVolver}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium mb-2 shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />{t("Regresar a la lista")}
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden">
                    {/* ===================== COLUMNA IZQUIERDA ===================== */}
                    <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto hide-scrollbar pr-1">

                        {/* Cabecera + Estrellas + Datos de contacto (Rediseño 3 - Más Compacto) */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:px-6 shadow-sm shrink-0 relative overflow-hidden">
                            <div className="flex flex-col gap-3">
                                {/* Fila Superior: Nombre, Editar, Etapa e Interés */}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                                {ClienteSeleccionado.nombres} {ClienteSeleccionado.apellidoPaterno}
                                            </h1>
                                            <button
                                                onClick={() => abrirModalEditar(ClienteSeleccionado)}
                                                className="p-1.5 text-slate-400 hover:text-(--theme-600) hover:bg-(--theme-50) rounded-full transition-all"
                                                title="Editar información del Cliente"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {editandoEtapa ? (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        autoFocus
                                                        defaultValue={ClienteSeleccionado.etapaEmbudo}
                                                        onChange={(e) => handleCambiarEtapa(e.target.value)}
                                                        disabled={loadingEtapa}
                                                        className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold bg-white focus:ring-2 focus:ring-(--theme-500) outline-none"
                                                    >
                                                        {Object.entries(ETAPAS_EMBUDO).map(([key, val]) => (
                                                            <option key={key} value={key}>{val.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => setEditandoEtapa(false)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                                        title="Cancelar"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getEtapaColor(ClienteSeleccionado.etapaEmbudo)}`}>
                                                        {getEtapaLabel(ClienteSeleccionado.etapaEmbudo)}
                                                    </span>
                                                    <button
                                                        onClick={() => setEditandoEtapa(true)}
                                                        className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
                                                        title="Cambiar etapa"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                            <div id="detalle-cliente-ganado" className="md:absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 px-3 py-1 bg-green-100/80 backdrop-blur-sm text-green-700 rounded-lg text-xs font-black uppercase tracking-widest border border-green-200 shadow-sm z-10">
                                                <Star className="w-4 h-4 fill-green-500 text-green-500" />
                                                Cliente Ganado
                                            </div>
                                            {ClienteSeleccionado.empresa && (
                                                <span className="text-gray-500 text-sm font-medium flex items-center gap-1.5 border-l border-slate-200 pl-3">
                                                    <Building2 className="w-4 h-4 text-slate-400" />
                                                    {ClienteSeleccionado.empresa}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Grid de Información de Contacto (Solo si hay datos) - Ahora más compacto */}
                                {(ClienteSeleccionado.telefono || ClienteSeleccionado.correo || ClienteSeleccionado.ubicacion || ClienteSeleccionado.sitioWeb) && (
                                    <div id="detalle-cliente-acciones-contacto" className="pt-3 border-t border-slate-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-stretch">
                                            {/* Teléfonos */}
                                            {(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2) && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 shrink-0">
                                                        <Phone className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 leading-none mb-0.5">{t("Teléfono")}</span>
                                                        <div className="flex flex-wrap text-xs font-bold text-slate-700 truncate">
                                                            {[ClienteSeleccionado.telefono, ClienteSeleccionado.telefono2].filter(Boolean).flatMap(t => t.split(',').map(s => s.trim())).filter(Boolean).slice(0, 1).map((tel, idx) => (
                                                                <span key={idx}>{tel}</span>
                                                            ))}
                                                            {[ClienteSeleccionado.telefono, ClienteSeleccionado.telefono2].filter(Boolean).flatMap(t => t.split(',').map(s => s.trim())).filter(Boolean).length > 1 && (
                                                                <span className="ml-1 text-slate-400 text-[10px]">...</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Correo */}
                                            {tieneCorreo && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 shrink-0">
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 leading-none mb-0.5">{t("Correo")}</span>
                                                        <div className="flex flex-wrap text-xs font-bold text-slate-700 truncate" title={correosContacto.join(', ')}>
                                                            {correosContacto.slice(0, 1).map((e, idx) => (
                                                                <span key={idx}>{e}</span>
                                                            ))}
                                                            {correosContacto.length > 1 && (
                                                                <span className="ml-1 text-slate-400 text-[10px]">...</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Ubicación */}
                                            {ClienteSeleccionado.ubicacion && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 shrink-0">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 leading-none mb-0.5">{t("Ubicación")}</span>
                                                        <span className="text-xs font-bold text-slate-700 truncate">
                                                            {ClienteSeleccionado.ubicacion}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sitio Web */}
                                            {ClienteSeleccionado.sitioWeb && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 shrink-0">
                                                        <Globe className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 leading-none mb-0.5">Web</span>
                                                            <a
                                                                href={ClienteSeleccionado.sitioWeb.startsWith('http') ? ClienteSeleccionado.sitioWeb : `https://${ClienteSeleccionado.sitioWeb}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs font-bold text-(--theme-600) hover:underline truncate"
                                                            >
                                                                {ClienteSeleccionado.sitioWeb.replace(/^https?:\/\//, '')}
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="col-start-1 sm:col-start-2 md:col-start-5 md:h-full flex items-center justify-end gap-2 ml-auto justify-self-end">
                                                <PlantillasMensajesModal contacto={ClienteSeleccionado} scope="cliente" />

                                                <a
                                                    href={(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2) ? `https://wa.me/${[ClienteSeleccionado.telefono, ClienteSeleccionado.telefono2].filter(Boolean).join(',').replace(/\D/g, '')}` : undefined}
                                                    target={(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2) ? '_blank' : undefined}
                                                    rel={(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2) ? 'noopener noreferrer' : undefined}
                                                    aria-disabled={!(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2)}
                                                    onClick={!(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2) ? (e) => e.preventDefault() : undefined}
                                                    className={`h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors shadow-xs border ${(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2) ? 'bg-green-50 hover:bg-green-100 border-green-100' : 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-60'}`}
                                                    title={(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2) ? 'Mensaje por WhatsApp' : 'No hay teléfono para WhatsApp'}
                                                >
                                                    <svg viewBox="0 0 24 24" className={`w-4.5 h-4.5 ${(ClienteSeleccionado.telefono || ClienteSeleccionado.telefono2) ? 'fill-green-600' : 'fill-slate-400'}`}>
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                </a>

                                                <a
                                                    href={tieneCorreo ? `mailto:${correoPrincipal}` : undefined}
                                                    aria-disabled={!tieneCorreo}
                                                    onClick={!tieneCorreo ? (e) => e.preventDefault() : undefined}
                                                    className={`h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors shadow-xs ring-1 ${tieneCorreo ? 'bg-slate-50 hover:bg-slate-100 ring-slate-200' : 'bg-slate-100 ring-slate-200 cursor-not-allowed opacity-60'}`}
                                                    title={tieneCorreo ? `Enviar correo por Gmail a ${correoPrincipal} (Total: ${correosContacto.length})` : 'No hay correo para Gmail'}
                                                >
                                                    <img src={GmailIcon} alt="Gmail" className={`w-4.5 h-4.5 object-contain ${tieneCorreo ? '' : 'grayscale opacity-60'}`} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ==================== KPIs ROTATIVAS ==================== */}
                        <KpiRotativas
                            ClienteSeleccionado={ClienteSeleccionado}
                            actividadesContext={actividadesContext}
                            llamadasExitosas={llamadasExitosas}
                            llamadasFallidas={llamadasFallidas}
                            valorCliente={valorCliente}
                            setValorCliente={setValorCliente}
                            monedaSeleccionada={monedaSeleccionada}
                            setMonedaSeleccionada={setMonedaSeleccionada}
                            guardandoMetrica={guardandoMetrica}
                            handleGuardarMetricaPersonalizada={handleGuardarMetricaPersonalizada}
                            customSections={customSections}
                        />


                        {/* ==================== ÁRBOL DE LLAMADA ==================== */}
                        <div className="space-y-3">
                            <div id="detalle-cliente-acciones-seguimiento" className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {/* Botón principal intercambiable: Registrar Venta / Registrar Llamada */}
                                <div className="relative group/main">
                                    <button
                                        onClick={modoBotonPrincipal === 'venta' ? manejarRegistrarVenta : () => setLlamadaFlow({ paso: 'tipo_llamada', tipoCall: '', contesto: null, fechaProxima: '', notas: '' })}
                                        className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl p-4 transition-all shadow-sm font-bold text-sm text-center leading-tight w-full h-full ${
                                            modoBotonPrincipal === 'venta'
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:border-emerald-500'
                                                : 'bg-white border-slate-200 hover:border-(--theme-500) text-gray-700 hover:text-(--theme-600)'
                                        }`}
                                    >
                                        {modoBotonPrincipal === 'venta'
                                            ? <><TrendingUp className="w-6 h-6 text-emerald-600" /> Registrar Venta</>
                                            : <><Phone className="w-6 h-6 text-(--theme-500)" /> Registrar Llamada</>
                                        }
                                    </button>
                                    {/* Botón pequeño para cambiar modo */}
                                    <button
                                        onClick={() => {
                                            const nuevo = modoBotonPrincipal === 'venta' ? 'llamada' : 'venta';
                                            setModoBotonPrincipal(nuevo);
                                            localStorage.setItem('crm_modo_boton_principal', nuevo);
                                        }}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-200 hover:bg-(--theme-500) hover:text-white text-slate-500 rounded-full text-[9px] flex items-center justify-center transition-all shadow-sm opacity-0 group-hover/main:opacity-100"
                                        title={`Cambiar a ${modoBotonPrincipal === 'venta' ? 'Registrar Llamada' : 'Registrar Venta'}`}
                                    >
                                        ⇄
                                    </button>
                                </div>
                                {/* Recordatorio de llamada */}
                                <button
                                    onClick={abrirNuevoRecordatorio}
                                    className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-(--theme-500) rounded-xl p-4 text-gray-700 hover:text-(--theme-600) transition-all shadow-sm font-bold text-sm"
                                >
                                    <Clock className="w-6 h-6 text-(--theme-500)" />
                                    Crear Recordatorio
                                </button>
                                {/* Agendar reunión */}
                                <button
                                    onClick={() => {
                                        if (!ClienteSeleccionado.correo) {
                                            toast.error("El cliente no tiene un correo electrónico registrado.");
                                            return;
                                        }
                                        navigate(`/${calendarRolePath}/calendario`, { 
                                            state: { 
                                                cliente: ClienteSeleccionado,
                                                activeTab: 'agendar',
                                                fromCall: true 
                                            } 
                                        });
                                    }}
                                    className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-(--theme-500) rounded-xl p-4 text-gray-700 hover:text-(--theme-600) transition-all shadow-sm font-bold text-sm text-center leading-tight"
                                >
                                    <Calendar className="w-6 h-6" />
                                    Agendar Reunión
                                </button>
                                {/* Historial de Ventas */}
                                <button
                                    onClick={() => setModalHistorialVentas(true)}
                                    className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-gray-700 hover:text-emerald-600 transition-all shadow-sm font-bold text-sm text-center leading-tight"
                                >
                                    <History className="w-6 h-6 text-emerald-500" />
                                    Historial Ventas
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                {/* Slot 1: Próximos Pasos (Alertas) */}
                                <div id="detalle-cliente-alertas" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-[240px] animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between shrink-0 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-(--theme-500)" />
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alertas y Pasos</p>
                                        </div>
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-(--theme-50) text-(--theme-700)">
                                            Próximos
                                        </span>
                                    </div>
                                    
                                    {alertasOrdenadas.length > 0 ? (
                                        <div className="relative flex-1 overflow-hidden flex flex-col">
                                            {/* Contenido con altura fija y scroll */}
                                                <div className="overflow-y-auto hide-scrollbar flex flex-col gap-2 shrink-0 h-[160px]">

                                                    {alertasOrdenadas.map((alerta) => {
                                                        if (alerta.tipo === 'cita') {
                                                            const cita = alerta.data;
                                                            const fechaCita = cita.fechaCita || cita.fecha;
                                                            return (
                                                                <div key={`cita-${alerta.id}`} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-1.5 shadow-sm">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                             <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                                                             <p className="text-xs font-semibold text-blue-900">Reunión agendada</p>
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-400 shrink-0">
                                                                            {new Date(fechaCita).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex gap-1.5">
                                                                        <button
                                                                            onClick={() => handleMarcarCitaRealizada(cita)}
                                                                            disabled={loadingCitaId === cita.id}
                                                                            title="Marcar como realizada"
                                                                            className="flex-1 flex items-center justify-center gap-1.5 bg-(--theme-600) hover:bg-(--theme-700) text-white rounded py-1.5 text-[10px] font-bold transition-colors disabled:opacity-50"
                                                                        >
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                            {loadingCitaId === cita.id ? '...' : 'Realizada'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setModalCita({ abierto: true, cita, editando: false })}
                                                                            className="flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded px-2 py-1.5 transition-colors shadow-sm"
                                                                            title={t("Ver")}
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditDataCita({ fecha: fechaCita, notas: cita.notas || '' });
                                                                                setModalCita({ abierto: true, cita, editando: true });
                                                                            }}
                                                                            className="flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded px-2 py-1.5 transition-colors shadow-sm"
                                                                            title={t("Editar")}
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDescartarCita(cita)}
                                                                            className="flex items-center justify-center bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded px-2 py-1.5 transition-colors shadow-sm"
                                                                            title="Descartar"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        const rec = alerta.data;
                                                        return (
                                                            <div key={`rec-${alerta.id}`} className="bg-(--theme-50) border border-(--theme-100) rounded-lg px-3 py-2 space-y-1.5 shadow-sm">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <p className="text-[10px] font-bold text-(--theme-700) bg-white/50 px-1.5 py-0.5 rounded border border-(--theme-100)">
                                                                        📌 {new Date(rec.fechaLimite).toLocaleDateString()} - {new Date(rec.fechaLimite).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                                {rec.descripcion && (
                                                                    <p className="text-[10px] text-slate-500 italic">{rec.descripcion}</p>
                                                                )}
                                                                <div className="flex gap-1.5">
                                                                    <button
                                                                        onClick={() => handleEditarRecordatorio(rec)}
                                                                        className="flex-1 flex items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded py-1.5 text-[10px] font-bold transition-colors"
                                                                    >
                                                                        <Edit2 className="w-3 h-3" />{t("Editar")}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => descartarRecordatorio(rec.id)}
                                                                        className="flex-1 flex items-center justify-center gap-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded py-1.5 text-[10px] font-bold transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />{t("Quitar")}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {citasPendientes.length === 0 && recordatoriosLlamada.length === 0 && (
                                                        <p className="text-[11px] text-slate-500 px-1 italic">{t("Sin alertas por ahora.")}</p>
                                                    )}
                                                </div>

                                                {/* Indicador de scroll discreto */}
                                                {(citasPendientes.length + recordatoriosLlamada.length > 2) && (
                                                    <div className="absolute left-0 right-0 flex justify-center pointer-events-none bottom-1">
                                                        <svg className="w-5 h-5 text-slate-400 animate-bounce" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M7 10l5 5 5-5z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-2 opacity-60">
                                                <Bell className="w-8 h-8 text-slate-300 mb-2" />
                                                <p className="text-[11px] text-slate-500 max-w-[180px]">No hay alertas pendientes.<br/>¡Todo al día!</p>
                                            </div>
                                        )}
                                    </div>

                                        {/* Slot 2: Diagnóstico Moneycall (5 Preguntas Clave) */}
                                        <div id="detalle-cliente-diagnostico" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-[240px] animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center justify-between shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-emerald-600" />
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnóstico Moneycall</p>
                                                </div>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                    diagnosticoMoneycall ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 animate-pulse'
                                                }`}>
                                                    {diagnosticoMoneycall ? 'Completado' : 'Pendiente S1'}
                                                </span>
                                            </div>

                                            <div className="flex-1 overflow-y-auto mt-3 space-y-2 text-xs text-slate-600 hide-scrollbar min-h-0">
                                                {diagnosticoMoneycall?.contenido ? (
                                                    <div className="space-y-1.5 font-medium pr-1">
                                                        <p className="truncate" title={diagnosticoMoneycall.contenido.p1}><strong className="text-slate-800">1. Gusto:</strong> {diagnosticoMoneycall.contenido.p1 || '-'}</p>
                                                        <p className="truncate" title={diagnosticoMoneycall.contenido.p2}><strong className="text-slate-800">2. Comp:</strong> {diagnosticoMoneycall.contenido.p2 || '-'}</p>
                                                        <p className="truncate" title={diagnosticoMoneycall.contenido.p3}><strong className="text-slate-800">3. Share:</strong> {diagnosticoMoneycall.contenido.p3 || '-'}</p>
                                                        <p className="truncate" title={diagnosticoMoneycall.contenido.p4}><strong className="text-slate-800">4. Dificultad:</strong> {diagnosticoMoneycall.contenido.p4 || '-'}</p>
                                                        <p className="truncate" title={diagnosticoMoneycall.contenido.p5}><strong className="text-slate-800">5. Crecer:</strong> {diagnosticoMoneycall.contenido.p5 || '-'}</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-center py-2">
                                                        <HelpCircle className="w-8 h-8 text-slate-300 mb-1.5" />
                                                        <p className="text-[11px] text-slate-400">Entrevista de diagnóstico inicial pendiente para recolectar información.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={abrirDiagnostico}
                                                className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                                            >
                                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                {diagnosticoMoneycall ? 'Ver respuestas / Editar' : 'Iniciar Entrevista S1'}
                                            </button>
                                        </div>

                                        {/* Slot 3: Historial & Cuadrantes B2B */}
                                        <div id="detalle-cliente-historial-compras" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-[240px] animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center justify-between shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Historial de Compras B2B</p>
                                                </div>
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-indigo-50 text-indigo-700">
                                                    Cuadrantes
                                                </span>
                                            </div>

                                            <div className="flex-1 overflow-y-auto mt-3 space-y-2 text-xs hide-scrollbar min-h-0">
                                                {comprasRegistradas.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                                            Productos / Ventas ({comprasRegistradas.length})
                                                        </p>
                                                        {comprasRegistradas.slice(0, 4).map((compra, index) => (
                                                            <div key={index} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                                <div className="overflow-hidden mr-2">
                                                                    <p className="font-bold text-slate-700 truncate text-[10px]">{compra.nombre}</p>
                                                                    {compra.cantidad && <p className="text-[8px] text-slate-400 leading-none">Cant: {compra.cantidad}</p>}
                                                                </div>
                                                                <span className="font-black text-slate-500 text-[10px] shrink-0">{compra.valor}</span>
                                                            </div>
                                                        ))}
                                                        {comprasRegistradas.length > 4 && (
                                                            <p className="text-[9px] text-slate-400 italic text-center mt-1">
                                                                + {comprasRegistradas.length - 4} compras más en el historial
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-400 text-[10px] italic flex-1 flex items-center justify-center text-center">
                                                        No hay historial de compras registrado.<br/>La actividad de ventas nutrirá este cuadrante.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 mt-3 shrink-0">
                                                <button
                                                    onClick={manejarRegistrarVenta}
                                                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                                    title="Registrar Compra/Venta"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Registrar
                                                </button>
                                                <button
                                                    onClick={() => setDrawerHistorialAbierto(true)}
                                                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                                    title="Abrir Historial Completo"
                                                >
                                                    <List className="w-3.5 h-3.5" />{t("Historial")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Módulos Opcionales */}
                                <ModulosCliente
                                    containerClassName="mt-0"
                                    customSections={seccionesDinamicas}
                                    updateSeccion={updateSeccion}
                                    commitSecciones={commitSecciones}
                                    deleteSeccion={deleteSeccion}
                                    onAgregar={() => setModalNuevaSeccion(true)}
                                    clienteId={pid}
                                    rolePath={rolePath}
                                    handleGuardarSeccionesPersonalizadas={commitSecciones}
                                />
                            </div>

                    {/* Overlay Backdrop (solo visible en mobile) */}
                    <div 
                        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${drawerHistorialAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                        onClick={() => setDrawerHistorialAbierto(false)} 
                    />

                    <div className={`fixed inset-x-0 bottom-0 z-50 lg:static lg:z-auto transition-transform duration-300 ease-out transform ${drawerHistorialAbierto ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'} lg:transform-none bg-white lg:bg-white border-t lg:border-t-0 lg:border lg:border-slate-200 rounded-t-2xl lg:rounded-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] lg:shadow-sm flex flex-col overflow-hidden h-[88vh] lg:h-full min-h-0`}>
                        {/* Pequeña barra tirador en móvil */}
                        <div className="w-full flex justify-center py-2 lg:hidden" onTouchMove={(e) => {
                                // Touch prevent o close on swipe (opcional, por ahora solo visual)
                            }}
                            onClick={() => setDrawerHistorialAbierto(false)}>
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                        </div>

                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 lg:rounded-t-xl flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">Historial de interacciones</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">↑ Más reciente arriba</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 font-semibold">{actividadesContext.length}</span>
                                <button className="lg:hidden p-1.5 bg-slate-200/50 rounded-full text-slate-500 hover:text-slate-800" onClick={() => setDrawerHistorialAbierto(false)}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div
                            className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar"
                            style={{ minHeight: 0 }}
                        >
                            {loadingContext ? (
                                <div className="flex justify-center items-center h-32">
                                    <RefreshCw className="w-8 h-8 text-(--theme-500) animate-spin" />
                                </div>
                            ) : actividadesContext.length === 0 ? (
                                <div className="text-center text-gray-400 mt-10">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Sin interacciones registradas aún.</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Línea vertical de tiempo */}
                                    <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-200" />

                                    <div className="space-y-0">
                                        {[...actividadesContext].reverse().map((act, index) => {
                                            const meta = getActIcon(act);
                                            const esElMasReciente = index === 0;

                                            const dotColor =
                                                act.tipo === 'whatsapp' ? 'bg-green-500' :
                                                    act.tipo === 'cita' ? 'bg-(--theme-500)' :
                                                        act.tipo === 'llamada' && act.resultado === 'fallido' ? 'bg-rose-400' :
                                                            act.tipo === 'llamada' ? 'bg-(--theme-500)' :
                                                                act.tipo === 'cliente' ? 'bg-yellow-500' :
                                                                    act.tipo === 'descartado' ? 'bg-gray-400' :
                                                                        'bg-slate-400';

                                            return (
                                                <div key={act.id || index} className="relative flex gap-3 pb-4">
                                                    {/* Punto de la línea de tiempo */}
                                                    <div className="relative z-10 shrink-0 mt-1.5">
                                                        <div className={`w-[11px] h-[11px] rounded-full border-2 border-white ${dotColor} shadow-sm`} />
                                                    </div>

                                                    {/* Tarjeta */}
                                                    <div className="flex-1 min-w-0">
                                                        {esElMasReciente && (
                                                            <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-white bg-(--theme-500) rounded px-1.5 py-0.5 mb-1">
                                                                Más reciente
                                                            </span>
                                                        )}
                                                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 hover:border-slate-200 transition-colors">
                                                            <div className="flex items-start justify-between gap-1">
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-gray-800 leading-tight">{meta.label}</p>
                                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                                        {new Date(act.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        {' · '}{formatHora(act.fecha)}
                                                                        {act.vendedorNombre && <> · <span className="text-slate-500">{act.vendedorNombre}</span></>}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteActividadContext(act.id)}
                                                                    title={t("Eliminar")}
                                                                    className="shrink-0 p-1 rounded text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all mt-0.5"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            {getResultadoTexto(act) && (
                                                                <p className="text-[10px] text-gray-500 mt-1 font-medium">{getResultadoTexto(act)}</p>
                                                            )}
                                                            {act.notas && (
                                                                <p className="text-[10px] text-gray-500 mt-1 italic truncate" title={act.notas}>"{act.notas}"</p>
                                                            )}
                                                            {act.fechaCita && (
                                                                <p className="text-[10px] text-(--theme-600) mt-1 font-semibold">
                                                                    📅 {new Date(act.fechaCita).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-(--theme-400)/20 focus-within:border-(--theme-400) transition-all">
                                <textarea
                                    value={muralTexto}
                                    onChange={(e) => setMuralTexto(e.target.value)}
                                    placeholder="Escribe una nota rápida en el mural..."
                                    className="flex-1 px-3 py-2.5 text-sm border-0 focus:ring-0 outline-none resize-none bg-transparent min-h-[44px] max-h-[120px] scrollbar-hide"
                                    rows={1}
                                    onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                />
                                <button
                                    onClick={registrarEnMural}
                                    disabled={guardandoMural || !muralTexto.trim()}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-(--theme-600) hover:bg-(--theme-700) text-white rounded-xl transition-all shadow-sm shadow-(--theme-500)/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Registrar en mural"
                                >
                                    {guardandoMural ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB Botón de Historial (Mobile Only) */}
            <button
                onClick={() => setDrawerHistorialAbierto(true)}
                className={`lg:hidden fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-30 transition-transform duration-300 flex items-center justify-center bg-(--theme-600) text-white hover:scale-105 active:scale-95 ${drawerHistorialAbierto ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
                title="Ver Historial"
            >
                <div className="relative">
                    <History className="w-6 h-6" />
                    {actividadesContext.length > 0 && (
                        <div className="absolute -top-3 -right-3 min-w-[20px] h-5 bg-rose-500 rounded-full flex items-center justify-center px-1 border-2 border-white text-white text-[9px] font-black shadow-sm">
                            {actividadesContext.length}
                        </div>
                    )}
                </div>
            </button>

            {/* MODAL RECORDATORIO DE LLAMADA */}
            {llamadaFlow !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-linear-to-r from-(--theme-50) to-white flex items-center justify-between gap-3">
                            <span className="font-bold text-(--theme-700) flex items-center gap-2"><Phone className="w-4 h-4" /> Registrando llamada...</span>
                            <button disabled={registrandoActividad} onClick={() => setLlamadaFlow(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed">✕ Cancelar</button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Paso 0: Selección de Tipo de Llamada B2B */}
                            {llamadaFlow.paso === 'tipo_llamada' && (
                                <div className="space-y-4">
                                    <p className="font-semibold text-gray-800 text-sm">Selecciona el tipo de llamada B2B (Moneycall):</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {[
                                            { code: 'S1', label: 'S1 - Recuperación (Cuadrante 1)', desc: 'Llamada proactiva sobre productos actuales' },
                                            { code: 'S2', label: 'S2 - Venta Cruzada (Cuadrante 2)', desc: 'Llamada proactiva de productos complementarios' },
                                            { code: 'F1', label: 'F1 - Seguimiento Caliente', desc: 'Para prospectos calificados en caliente' },
                                            { code: 'F2', label: 'F2 - Seguimiento Propuesta', desc: 'Para prospectos con propuesta enviada' },
                                            { code: 'DC', label: 'DC - Diagnóstico Continuo', desc: 'Llamadas periódicas de actualización' },
                                            { code: 'PT', label: 'PT - Proactiva Técnica / Cortesía', desc: 'Llamada técnica o de cortesía' },
                                            { code: 'IN', label: 'IN - Llamada Entrante', desc: 'Llamada reactiva recibida' },
                                            { code: 'RC', label: 'RC - Reclamo o Soporte', desc: 'Llamada reactiva de soporte o reclamo' }
                                        ].map((tipo) => (
                                            <button
                                                key={tipo.code}
                                                onClick={() => setLlamadaFlow(f => ({ ...f, paso: 'contesto', tipoCall: tipo.code }))}
                                                className="p-3 border border-slate-200 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex flex-col justify-between"
                                            >
                                                <span className="font-black text-indigo-600 text-xs">{tipo.label}</span>
                                                <span className="text-[10px] text-gray-400 font-bold leading-snug mt-1">{tipo.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Paso 1: ¿Contestó? */}
                            {llamadaFlow.paso === 'contesto' && (
                                <div className="space-y-3">
                                    <p className="font-semibold text-gray-800">¿Contestó la llamada?</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setLlamadaFlow(f => ({ ...f, paso: 'opciones_contesto', contesto: true }))}
                                            className="flex-1 py-2.5 bg-(--theme-500) text-white rounded-lg font-bold hover:bg-(--theme-600) transition-colors"
                                        >✓ Sí, contestó</button>
                                        <button
                                            onClick={async () => {
                                                // Registrar llamada fallida
                                                const prefix = llamadaFlow.tipoCall ? `[${llamadaFlow.tipoCall}] ` : '';
                                                const ok = await registrarActividadConDelay({ tipo: 'llamada', resultado: 'fallido', notas: `${prefix}No contestó` });
                                                if (ok) setLlamadaFlow(null);
                                            }}
                                            disabled={estaBloqueadoRegistro}
                                            className="flex-1 py-2.5 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >{estaBloqueadoRegistro ? '⏳ Validando...' : '✗ No contestó'}</button>
                                    </div>
                                </div>
                            )}

                            {/* Paso 2: Opciones al contestar */}
                            {llamadaFlow.paso === 'opciones_contesto' && (
                                <div className="space-y-3">
                                    <p className="font-semibold text-gray-800">¿Cuál fue el resultado de la llamada?</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={async () => {
                                                const prefix = llamadaFlow.tipoCall ? `[${llamadaFlow.tipoCall}] ` : '';
                                                const ok = await registrarActividadConDelay({ tipo: 'llamada', resultado: 'exitoso', notas: `${prefix}Agendó reunión` });
                                                if (!ok) return;
                                                setLlamadaFlow(null);
                                                navigate(`/${calendarRolePath}/calendario`, { state: { prospecto: ClienteSeleccionado, Cliente: ClienteSeleccionado, cliente: ClienteSeleccionado } });
                                            }}
                                            disabled={estaBloqueadoRegistro}
                                            className="py-2.5 bg-(--theme-500) text-white rounded-lg font-bold hover:bg-(--theme-600) transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                        >{estaBloqueadoRegistro ? '⏳ Validando...' : '📅 Agendó reunión'}</button>

                                        <button
                                            onClick={() => {
                                                const hoy = new Date();
                                                hoy.setDate(hoy.getDate() + 3);
                                                const defaultDate = toLocalDateTimeInput(hoy);
                                                setLlamadaFlow(f => ({ ...f, paso: 'llamarDespues', interesado: true, fechaProxima: defaultDate }));
                                            }}
                                            className="py-2.5 bg-(--theme-500) text-white rounded-lg font-bold hover:bg-(--theme-600) transition-colors text-sm"
                                        >📞 Llamar después</button>

                                        <button
                                            onClick={() => setLlamadaFlow(f => ({ ...f, paso: 'whatsapp' }))}
                                            className="py-2.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors text-sm"
                                        >💬 WhatsApp o Correo</button>

                                        <button
                                            onClick={() => setLlamadaFlow(f => ({ ...f, paso: 'sin_interes' }))}
                                            className="py-2.5 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition-colors text-sm"
                                        >✗ Sin interés</button>

                                        <button
                                            onClick={() => setLlamadaFlow(f => ({ ...f, paso: 'otro' }))}
                                            className="py-2.5 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors text-sm"
                                        >📝 Notas</button>

                                        <button
                                            onClick={() => setLlamadaFlow(null)}
                                            className="py-2.5 bg-slate-400 text-white rounded-lg font-bold hover:bg-slate-500 transition-colors text-sm"
                                        >⏭️ Omitir</button>
                                    </div>
                                </div>
                            )}
                            {/* 2b: No contestó — programar reintento */}
                            {llamadaFlow.paso === 'reintento' && (
                                <div className="space-y-3">
                                    <p className="font-semibold text-rose-700">📵 No contestó — ¿Cuándo reintentas?</p>
                                    <TimeWheelPicker
                                        value={llamadaFlow.fechaProxima}
                                        onChange={val => setLlamadaFlow(f => ({ ...f, fechaProxima: val }))}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setRegistrandoActividadBlockedUntil(Date.now() + 3000);
                                                    setRegistrandoActividad(true);
                                                    const pidLocal = ClienteSeleccionado.id || ClienteSeleccionado._id;
                                                    if (llamadaFlow.fechaProxima) {
                                                        await axios.put(`${API_URL}/api/${rolePath}/prospectos/${pidLocal}`, {
                                                            proximaLlamada: toUtcIsoFromLocalInput(llamadaFlow.fechaProxima)
                                                        }, { headers: getAuthHeaders() });
                                                    }
                                                    toast.success('Reintento programado');
                                                    setLlamadaFlow(null);
                                                    const res = await axios.get(`${API_URL}/api/${rolePath}/prospectos`, { headers: getAuthHeaders() });
                                                    const updated = res.data.find(p => p.id === pidLocal || p._id === pidLocal);
                                                    if (updated) { setClienteSeleccionado(updated); setClientes(res.data); }
                                                } catch { toast.error('Error al programar reintento'); }
                                                finally { setRegistrandoActividad(false); }
                                            }}
                                            disabled={estaBloqueadoRegistro}
                                            className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >{estaBloqueadoRegistro ? '⏳ Validando...' : '📅 Programar reintento'}</button>
                                        <button
                                            onClick={() => setLlamadaFlow(null)}
                                            className="px-4 py-2 border border-slate-200 text-gray-600 rounded-lg hover:bg-slate-50 text-sm"
                                        >Sin fecha</button>
                                    </div>
                                </div>
                            )}

                            {/* 3b: WhatsApp o Correo */}
                            {llamadaFlow.paso === 'whatsapp' && (
                                <div className="space-y-3">
                                    <p className="font-semibold text-green-700">💬 Añadir nota para WhatsApp/Correo</p>
                                    <textarea
                                        rows={2}
                                        value={llamadaFlow.notes || ''}
                                        onChange={e => setLlamadaFlow(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="Ej: Enviar brochure PDF..."
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400"
                                    />
                                    <button
                                        onClick={async () => {
                                            const prefix = llamadaFlow.tipoCall ? `[${llamadaFlow.tipoCall}] ` : '';
                                            const notaFinal = llamadaFlow.notes ? `${prefix}Prefiere atención por WhatsApp o correo - ${llamadaFlow.notes}` : `${prefix}Prefiere atención por WhatsApp o correo`;
                                            const ok = await registrarActividadConDelay({ tipo: 'llamada', resultado: 'exitoso', notas: notaFinal });
                                            if (!ok) return;
                                            setLlamadaFlow(null);
                                            toast('Registrado: Prefiere WhatsApp/Correo', { icon: '💬' });
                                        }}
                                        disabled={estaBloqueadoRegistro}
                                        className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >{estaBloqueadoRegistro ? '⏳ Validando...' : '✓ Guardar interacción'}</button>
                                </div>
                            )}

                            {/* 3c: Sin Interés */}
                            {llamadaFlow.paso === 'sin_interes' && (
                                <div className="space-y-3">
                                    <p className="font-semibold text-gray-700">✗ Motivo de falta de interés</p>
                                    <textarea
                                        rows={2}
                                        value={llamadaFlow.notas || ''}
                                        onChange={e => setLlamadaFlow(f => ({ ...f, notas: e.target.value }))}
                                        placeholder="Ej: Dice que es muy caro, ya tiene proveedor..."
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400"
                                    />
                                    <button
                                        onClick={async () => {
                                            const prefix = llamadaFlow.tipoCall ? `[${llamadaFlow.tipoCall}] ` : '';
                                            const notaFinal = llamadaFlow.notas ? `${prefix}Sin interés - ${llamadaFlow.notas}` : `${prefix}Contestó, sin interés`;
                                            const ok = await registrarActividadConDelay({ tipo: 'llamada', resultado: 'exitoso', notas: notaFinal });
                                            if (!ok) return;
                                            setLlamadaFlow(null);
                                            toast('Sin interés — considera descartarlo', { icon: '💡' });
                                        }}
                                        disabled={estaBloqueadoRegistro}
                                        className="w-full py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >{estaBloqueadoRegistro ? '⏳ Validando...' : '✓ Guardar y cerrar'}</button>
                                </div>
                            )}

                            {/* 3e: Notas */}
                            {llamadaFlow.paso === 'otro' && (
                                <div className="space-y-3">
                                    <p className="font-semibold text-blue-700">📝 Notas de la llamada</p>
                                    <textarea
                                        rows={2}
                                        value={llamadaFlow.notas || ''}
                                        onChange={e => setLlamadaFlow(f => ({ ...f, notas: e.target.value }))}
                                        placeholder="Escribe las notas de la llamada aquí..."
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button
                                        onClick={async () => {
                                            const prefix = llamadaFlow.tipoCall ? `[${llamadaFlow.tipoCall}] ` : '';
                                            const notaFinal = llamadaFlow.notas ? `${prefix}${llamadaFlow.notas}` : `${prefix}Notas de la llamada`;
                                            const ok = await registrarActividadConDelay({ tipo: 'llamada', resultado: 'exitoso', notas: notaFinal });
                                            if (!ok) return;
                                            setLlamadaFlow(null);
                                            toast('Notas guardadas', { icon: '📝' });
                                        }}
                                        disabled={estaBloqueadoRegistro}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >{estaBloqueadoRegistro ? '⏳ Validando...' : '✓ Guardar resultado'}</button>
                                </div>
                            )}

                            {/* 3d: Llamar después — marcar fecha */}
                            {llamadaFlow.paso === 'llamarDespues' && (
                                <div className="space-y-3">
                                    <p className="font-semibold text-(--theme-700)">📅 ¿Cuándo le llamamos?</p>
                                    <TimeWheelPicker
                                        value={llamadaFlow.fechaProxima}
                                        onChange={val => setLlamadaFlow(f => ({ ...f, fechaProxima: val }))}
                                    />
                                    <textarea
                                        rows={2}
                                        value={llamadaFlow.notas || ''}
                                        onChange={e => setLlamadaFlow(f => ({ ...f, notas: e.target.value }))}
                                        placeholder="Notas de la llamada..."
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-(--theme-400)"
                                    />
                                    <button
                                        onClick={async () => {
                                            try {
                                                const prefix = llamadaFlow.tipoCall ? `[${llamadaFlow.tipoCall}] ` : '';
                                                const notasFin = llamadaFlow.notas ? `${prefix}${llamadaFlow.notas}` : `${prefix}Interesado, llamar después`;
                                                const pidLocal = ClienteSeleccionado.id || ClienteSeleccionado._id;

                                                // 1. Registrar Actividad (usa el helper que auto-promueve la etapa)
                                                const ok = await registrarActividadConDelay({
                                                    tipo: 'llamada',
                                                    resultado: 'exitoso',
                                                    notes: notasFin
                                                });
                                                if (!ok) return;

                                                if (llamadaFlow.fechaProxima) {
                                                    // 2. Actualizar solo proximaLlamada (ruta simple, no requiere nombres/telefono)
                                                    await axios.put(`${API_URL}/api/${rolePath}/prospectos/${pidLocal}`, {
                                                        proximaLlamada: toUtcIsoFromLocalInput(llamadaFlow.fechaProxima)
                                                    }, { headers: getAuthHeaders() });
                                                }

                                                toast.success('Seguimiento guardado correctamente');
                                                setLlamadaFlow(null);
                                            } catch (err) {
                                                console.error(err);
                                                toast.error('Error al guardar el seguimiento completo');
                                            }
                                        }}
                                        disabled={estaBloqueadoRegistro}
                                        className="w-full py-2 bg-(--theme-600) text-white rounded-lg font-bold hover:bg-(--theme-700) disabled:opacity-60 disabled:cursor-not-allowed"
                                    >{estaBloqueadoRegistro ? '⏳ Validando...' : '✓ Guardar seguimiento'}</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL RECORDATORIO DE LLAMADA */}
            {modalRecordatorioAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-(--theme-50) to-white">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-5 h-5 text-(--theme-600)" />
                                        <h2 className="text-lg font-bold text-gray-900">{recordatorio.editandoId ? 'Editar recordatorio' : 'Crear recordatorio'}</h2>
                                    </div>
                                    <p className="text-sm text-slate-600">Configura una fecha rápida para volver a llamar a {ClienteSeleccionado.nombres}.</p>
                                </div>
                                <button
                                    onClick={() => { setModalRecordatorioAbierto(false); setRecordatorio({ fechaProxima: '', notas: '', editandoId: null }); }}
                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                                    aria-label="Cerrar modal"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Fecha</label>
                                    <input
                                        type="date"
                                        value={recordatorio.fechaProxima ? recordatorio.fechaProxima.slice(0, 10) : ''}
                                        onChange={(e) => syncRecordatorioFechaHora('fecha', e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-(--theme-300) focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Hora</label>
                                    <input
                                        type="time"
                                        step="300"
                                        value={recordatorio.fechaProxima ? recordatorio.fechaProxima.slice(11, 16) : ''}
                                        onChange={(e) => syncRecordatorioFechaHora('hora', e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-(--theme-300) focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Notas (opcional)</label>
                                <textarea
                                    rows={4}
                                    value={recordatorio.notas}
                                    onChange={(e) => setRecordatorio(r => ({ ...r, notas: e.target.value }))}
                                    placeholder="Ej: Confirmar presupuesto y validar disponibilidad"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-(--theme-300) focus:border-transparent outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/70">
                            <button
                                onClick={() => { setModalRecordatorioAbierto(false); setRecordatorio({ fechaProxima: '', notas: '', editandoId: null }); }}
                                className="sm:flex-1 px-4 py-2.5 border border-slate-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    const now = Date.now();
                                    if (now < recordatorioBlockedUntil) {
                                        return;
                                    }
                                    setGuardandoRecordatorio(true);
                                    setRecordatorioBlockedUntil(now + 3000);

                                    try {
                                        if (!recordatorio.fechaProxima) {
                                            toast.error('Selecciona una fecha');
                                            return;
                                        }
                                        const pid = ClienteSeleccionado.id || ClienteSeleccionado._id;

                                        if (recordatorio.editandoId) {
                                            // Editar recordatorio existente
                                            const fechaLimiteIso = toUtcIsoFromLocalInput(recordatorio.fechaProxima);
                                            const res = await axios.put(`${API_URL}/api/${rolePath}/recordatorios/${recordatorio.editandoId}`, {
                                                fechaLimite: fechaLimiteIso,
                                                descripcion: recordatorio.notas || ''
                                            }, { headers: getAuthHeaders() });
                                            const updated = res.data.recordatorio;
                                            setRecordatoriosLlamada(prev => prev.map(r => r.id === recordatorio.editandoId ? updated : r));
                                            toast.success('📞 Recordatorio actualizado');
                                        } else {
                                            // Crear nuevo recordatorio
                                            const fechaLimiteIso = toUtcIsoFromLocalInput(recordatorio.fechaProxima);
                                            const res = await axios.post(`${API_URL}/api/${rolePath}/prospectos/${pid}/recordatorios`, {
                                                fechaLimite: fechaLimiteIso,
                                                descripcion: recordatorio.notas || ''
                                            }, { headers: getAuthHeaders() });
                                            setRecordatoriosLlamada(prev => [...prev, res.data.recordatorio]);
                                            toast.success('📞 Recordatorio programado');
                                        }

                                        if (onActualizado) await onActualizado();

                                        setModalRecordatorioAbierto(false);
                                        setRecordatorio({ fechaProxima: '', notas: '', editandoId: null });
                                    } catch (err) {
                                        console.error(err);
                                        toast.error('Error al guardar el recordatorio');
                                    } finally {
                                        setGuardandoRecordatorio(false);
                                    }
                                }}
                                disabled={guardandoRecordatorio || Date.now() < recordatorioBlockedUntil}
                                className="sm:flex-1 px-4 py-2.5 bg-(--theme-600) text-white rounded-lg text-sm font-semibold hover:bg-(--theme-700) transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {guardandoRecordatorio || Date.now() < recordatorioBlockedUntil ? '⏳ Validando...' : '✓ Guardar recordatorio'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL DETALLE / EDICIÓN DE CITA */}
            {modalCita.abierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-(--theme-50) to-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-(--theme-600)" />
                                <h2 className="text-lg font-bold text-gray-900">
                                    {modalCita.editando ? 'Editar reunión agendada' : 'Detalles de la reunión'}
                                </h2>
                            </div>
                            <button
                                onClick={() => setModalCita({ abierto: false, cita: null, editando: false })}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {modalCita.editando ? (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora</label>
                                        <input
                                            type="datetime-local"
                                            value={editDataCita.fecha ? toLocalDateTimeInput(editDataCita.fecha) : ''}
                                            onChange={(e) => setEditDataCita({ ...editDataCita, fecha: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-(--theme-400) outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notas de la reunión</label>
                                        <textarea
                                            value={editDataCita.notas}
                                            onChange={(e) => setEditDataCita({ ...editDataCita, notas: e.target.value })}
                                            placeholder="Detalles o preparativos para la reunión..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-(--theme-400) outline-none transition-all min-h-[120px] resize-none"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Fecha</span>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {new Date(modalCita.cita.fechaCita || modalCita.cita.fecha).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Hora</span>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {new Date(modalCita.cita.fechaCita || modalCita.cita.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-slate-400 uppercase">{t("Notas")}</span>
                                            <p className="text-sm text-slate-600 leading-relaxed italic">
                                                {modalCita.cita.notas || 'Sin notas registradas.'}
                                            </p>
                                        </div>

                                        {modalCita.cita.googleMeetLink && (
                                            <div className="pt-2 border-t border-slate-200">
                                                <span className="text-xs font-bold text-(--theme-600) uppercase block mb-1.5">Enlace de Google Meet</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 truncate font-mono">
                                                        {modalCita.cita.googleMeetLink}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(modalCita.cita.googleMeetLink);
                                                            toast.success('Enlace copiado');
                                                        }}
                                                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-all"
                                                        title="Copiar enlace"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <a
                                                        href={modalCita.cita.googleMeetLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-(--theme-600) hover:bg-(--theme-700) text-white rounded-lg shadow-sm transition-all"
                                                        title="Unirse a la reunión"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 p-3 bg-(--theme-50) border border-(--theme-100) rounded-xl">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Star className="w-4 h-4 text-(--theme-500)" />
                                        </div>
                                        <div className="text-xs">
                                            <p className="font-bold text-(--theme-700)">Reunión con {ClienteSeleccionado.nombres}</p>
                                            <p className="text-(--theme-600)">Empresa: {ClienteSeleccionado.empresa || 'No especificada'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setModalCita({ abierto: false, cita: null, editando: false })}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cerrar
                            </button>
                            {modalCita.editando && (
                                <button
                                    onClick={handleActualizarCita}
                                    className="px-6 py-2 bg-(--theme-600) text-white rounded-lg text-sm font-bold hover:bg-(--theme-700) shadow-sm transition-colors"
                                >
                                    Guardar cambios
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* MODAL NUEVA SECCIÓN */}
            {modalNuevaSeccion && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Añadir Módulo al Cliente</h2>
                                <p className="text-[10px] text-slate-400 mt-0.5">Elige el tipo de información a registrar</p>
                            </div>
                            <button onClick={() => setModalNuevaSeccion(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-3">
                            {/* Módulos estructurados */}
                            <button
                                onClick={() => { addSeccion('payments', 'Estado de Pagos'); setModalNuevaSeccion(false); }}
                                className="flex flex-col items-center gap-2 p-4 border-2 border-green-100 hover:border-green-400 hover:bg-green-50 rounded-xl transition-all group"
                            >
                                <div className="p-2.5 bg-green-50 group-hover:bg-white rounded-xl text-green-600 transition-colors">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-800">Estado de Pagos</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Registro de cobros y abonos</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { addSeccion('contracts', 'Baúl de Contratos'); setModalNuevaSeccion(false); }}
                                className="flex flex-col items-center gap-2 p-4 border-2 border-purple-100 hover:border-purple-400 hover:bg-purple-50 rounded-xl transition-all group"
                            >
                                <div className="p-2.5 bg-purple-50 group-hover:bg-white rounded-xl text-purple-600 transition-colors">
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-800">Baúl de Contratos</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">PDFs y fechas de vencimiento</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { addSeccion('products', 'Historial de Productos'); setModalNuevaSeccion(false); }}
                                className="flex flex-col items-center gap-2 p-4 border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all group"
                            >
                                <div className="p-2.5 bg-blue-50 group-hover:bg-white rounded-xl text-blue-600 transition-colors">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-800">Productos Vendidos</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Historial de compras</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { addSeccion('sales', 'Historial de Ventas'); setModalNuevaSeccion(false); }}
                                className="flex flex-col items-center gap-2 p-4 border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl transition-all group"
                            >
                                <div className="p-2.5 bg-emerald-50 group-hover:bg-white rounded-xl text-emerald-600 transition-colors">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-800">Historial de Ventas</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Ventas cerradas y montos</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { addSeccion('subscriptions', 'Suscripciones'); setModalNuevaSeccion(false); }}
                                className="flex flex-col items-center gap-2 p-4 border-2 border-violet-100 hover:border-violet-400 hover:bg-violet-50 rounded-xl transition-all group"
                            >
                                <div className="p-2.5 bg-violet-50 group-hover:bg-white rounded-xl text-violet-600 transition-colors">
                                    <ArrowRightLeft className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-800">Suscripciones</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Servicios recurrentes</p>
                                </div>
                            </button>
                            {/* Módulos genéricos */}
                            <button
                                onClick={() => { addSeccion('note'); setModalNuevaSeccion(false); }}
                                className="flex flex-col items-center gap-2 p-4 border-2 border-slate-100 hover:border-(--theme-300) hover:bg-(--theme-50) rounded-xl transition-all group"
                            >
                                <div className="p-2.5 bg-slate-50 group-hover:bg-white rounded-xl text-slate-500 group-hover:text-(--theme-600) transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-800">Notas libres</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Texto personalizado</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { addSeccion('list'); setModalNuevaSeccion(false); }}
                                className="col-span-2 flex items-center justify-center gap-3 p-3 border-2 border-slate-100 hover:border-(--theme-300) hover:bg-(--theme-50) rounded-xl transition-all group"
                            >
                                <div className="p-2 bg-slate-50 group-hover:bg-white rounded-xl text-slate-500 group-hover:text-(--theme-600) transition-colors">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-800">Lista de verificación</p>
                                    <p className="text-[10px] text-slate-400">Checklist de tareas o ítems</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRO DE VENTA */}
            {modalVenta && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
                            <span className="font-bold text-emerald-700 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Registrar Venta
                            </span>
                            <button onClick={() => setModalVenta(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-white/60">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Tipo */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setVentaForm(f => ({ ...f, tipo: 'venta' }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                                        ventaForm.tipo === 'venta' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-500'
                                    }`}
                                >🛒 Venta</button>
                                <button
                                    onClick={() => setVentaForm(f => ({ ...f, tipo: 'suscripcion' }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                                        ventaForm.tipo === 'suscripcion' ? 'bg-violet-500 border-violet-500 text-white' : 'bg-white border-slate-200 text-slate-500'
                                    }`}
                                >🔁 Suscripción</button>
                            </div>
                            {/* Descripción */}
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Descripción *</label>
                                <input
                                    type="text"
                                    value={ventaForm.descripcion}
                                    onChange={(e) => setVentaForm(f => ({ ...f, descripcion: e.target.value }))}
                                    placeholder="Ej: Plan Premium anual"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none"
                                    autoFocus
                                />
                            </div>
                            {/* Monto */}
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Monto</label>
                                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-400/20 focus-within:border-emerald-400">
                                    <span className="text-slate-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        value={ventaForm.monto}
                                        onChange={(e) => setVentaForm(f => ({ ...f, monto: e.target.value }))}
                                        placeholder="0.00"
                                        className="flex-1 text-sm outline-none bg-transparent"
                                    />
                                </div>
                            </div>
                            {/* Comprobante PDF */}
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Comprobante (PDF)</label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-4 transition-all bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file && file.type !== 'application/pdf') {
                                                toast.error('Solo se permiten archivos PDF');
                                                e.target.value = '';
                                                return;
                                            }
                                            if (file && file.size > 15 * 1024 * 1024) {
                                                toast.error('El archivo excede el límite de 15MB');
                                                e.target.value = '';
                                                return;
                                            }
                                            setPdfArchivo(file);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <Upload className={`w-6 h-6 ${pdfArchivo ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'} transition-colors`} />
                                    <span className="text-xs font-bold text-slate-600 text-center truncate max-w-full">
                                        {pdfArchivo ? pdfArchivo.name : 'Seleccionar o arrastrar PDF'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Límite 15MB</span>
                                </div>
                                {pdfArchivo && (
                                    <div className="flex justify-end mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setPdfArchivo(null)}
                                            className="text-[10px] font-black text-rose-600 hover:underline px-1 py-0.5"
                                        >
                                            Quitar archivo
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Notas */}
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Notas adicionales</label>
                                <textarea
                                    rows={2}
                                    value={ventaForm.notes || ventaForm.notas}
                                    onChange={(e) => setVentaForm(f => ({ ...f, notas: e.target.value }))}
                                    placeholder="Ej: Pagó con tarjeta, incluye instalación..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none resize-none"
                                />
                            </div>
                            <button
                                onClick={handleGuardarVenta}
                                disabled={guardandoVenta || subiendoPdf || !ventaForm.descripcion.trim()}
                                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {guardandoVenta ? '⏳ Guardando...' : '✓ Registrar en historial'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL HISTORIAL DE VENTAS */}
            {modalHistorialVentas && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 leading-tight">Historial de Ventas</h2>
                                    <p className="text-[10px] text-slate-400 font-medium">Ventas reales y comprobantes registrados</p>
                                </div>
                            </div>
                            <button onClick={() => setModalHistorialVentas(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Contenido */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1 hide-scrollbar">
                            {cargandoVentas ? (
                                <div className="flex justify-center items-center py-12">
                                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                                </div>
                            ) : ventasHistorial.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
                                    <p className="text-sm font-bold">No hay ventas registradas en base de datos.</p>
                                    <p className="text-xs text-slate-400 mt-1">Usa el botón "Registrar Venta" para agregar una.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {ventasHistorial.map((venta) => (
                                        <div key={venta.id || venta._id} className="p-4 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${venta.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {venta.estado || 'completado'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {new Date(venta.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    {venta.vendedorNombre && (
                                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                                                            👤 {venta.vendedorNombre}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">{venta.notas || 'Venta registrada'}</p>
                                                {venta.pdf_url && (
                                                    <a
                                                        href={`${API_URL}${venta.pdf_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" /> Ver Comprobante PDF
                                                    </a>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                                <div className="text-right">
                                                    <span className="text-base font-black text-emerald-600 block">
                                                        ${parseFloat(venta.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                                                    {!venta.pdf_url && (
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                id={`upload-pdf-existente-${venta.id || venta._id}`}
                                                                accept=".pdf,application/pdf"
                                                                onChange={(e) => handleSubirPdfVentaExistente(e, venta.id || venta._id)}
                                                                className="hidden"
                                                            />
                                                            <label
                                                                htmlFor={`upload-pdf-existente-${venta.id || venta._id}`}
                                                                className={`p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg text-slate-500 hover:text-rose-600 transition-all cursor-pointer flex items-center justify-center ${subiendoPdfVentaId === (venta.id || venta._id) ? 'pointer-events-none opacity-50' : ''}`}
                                                                title="Subir Comprobante PDF"
                                                            >
                                                                {subiendoPdfVentaId === (venta.id || venta._id) ? (
                                                                    <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                                                                ) : (
                                                                    <Upload className="w-4 h-4 text-rose-500" />
                                                                )}
                                                            </label>
                                                        </div>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => handleEliminarVenta(venta.id || venta._id)}
                                                        className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
                                                        title="Eliminar del historial"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-rose-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                            <button
                                onClick={() => setModalHistorialVentas(false)}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-xs"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DIAGNÓSTICO MONEYCALL (LAS 5 PREGUNTAS CLAVE) */}
            {modalDiagnosticoAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header con gradiente elegante */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-linear-to-r from-emerald-50 to-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Target className="w-5 h-5 text-emerald-700" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 leading-tight">Diagnóstico Inicial (Llamada S1)</h2>
                                    <p className="text-[10px] text-slate-400 font-medium">Metodología Moneycall · Recolección de Información</p>
                                </div>
                            </div>
                            <button onClick={() => setModalDiagnosticoAbierto(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Contenido scrolleable */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 hide-scrollbar">
                            {/* Guión sugerido */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 shadow-xs">
                                <span className="font-extrabold text-slate-500 uppercase tracking-widest text-[9px] flex items-center gap-1">
                                    🗣️ Guión de Apertura Sugerido:
                                </span>
                                <p className="italic font-medium leading-relaxed">
                                    "Sr/Sra. <strong className="text-slate-800">{ClienteSeleccionado.nombres}</strong>, me han asignado su cuenta para brindarle un servicio más personalizado. ¿Podría darme 13-17 minutos para hacerle unas preguntas y entender cómo podemos servirle mejor?"
                                </p>
                            </div>

                            {/* Formulario con las 5 preguntas */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                        1. ¿Qué le gusta de hacer negocios con nosotros?
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formDiagnostico.p1}
                                        onChange={e => setFormDiagnostico(f => ({ ...f, p1: e.target.value }))}
                                        placeholder="Ej: La atención rápida, la calidad de la marca..."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none resize-none font-medium text-slate-700"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                        2. ¿Qué le gusta de hacer negocios con la competencia?
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formDiagnostico.p2}
                                        onChange={e => setFormDiagnostico(f => ({ ...f, p2: e.target.value }))}
                                        placeholder="Ej: Precios ligeramente más bajos, catálogo extendido..."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none resize-none font-medium text-slate-700"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                        3. ¿Qué porcentaje de lo que compra, nos lo compra a nosotros?
                                    </label>
                                    <input
                                        type="text"
                                        value={formDiagnostico.p3}
                                        onChange={e => setFormDiagnostico(f => ({ ...f, p3: e.target.value }))}
                                        placeholder="Ej: Compras estimadas en 40% (competencia tiene el otro 60%)..."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none font-medium text-slate-700"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                        4. ¿Qué productos o servicios se le hace difícil encontrar hoy en día?
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formDiagnostico.p4}
                                        onChange={e => setFormDiagnostico(f => ({ ...f, p4: e.target.value }))}
                                        placeholder="Ej: Equipamiento X, refacciones para línea Y..."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none resize-none font-medium text-slate-700"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                                        5. ¿En qué segmento de mercado le gustaría crecer y no ha podido?
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formDiagnostico.p5}
                                        onChange={e => setFormDiagnostico(f => ({ ...f, p5: e.target.value }))}
                                        placeholder="Ej: Clientes corporativos medianos, licitaciones de gobierno..."
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 outline-none resize-none font-medium text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer con botones de guardado */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setModalDiagnosticoAbierto(false)}
                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarDiagnostico}
                                className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10"
                            >
                                ✓ Guardar Diagnóstico
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );








}
