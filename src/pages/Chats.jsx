import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Send, Phone, User, MessageSquare, 
    Smile, Paperclip, MoreVertical, 
    Link, Sparkles, RefreshCw, LogOut, ArrowLeft,
    CheckCircle2, Filter, StickyNote, Mic, MicOff,
    Pin, Tag, Clock, Trash2, X, FileText, Check, AlertCircle, Calendar
} from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import API_URL from '../config/api';
import { getToken, getUser } from '../utils/authUtils';
import socket from '../config/socket';
import toast from 'react-hot-toast';
import axios from 'axios';
import PlantillasMensajesModal from '../components/PlantillasMensajesModal';
import TimeWheelPicker from '../components/TimeWheelPicker';
import { applyTemplate } from '../utils/templateUtils';

const EMOJIS = [
    '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😜', '😎', '🥳', 
    '🤔', '👍', '👎', '👌', '👏', '🙌', '🙏', '🤝', '👋', '💪', 
    '🔥', '✨', '⭐', '❤️', '💖', '💙', '💚', '💛', '💜', '🖤', 
    '🎉', '🎁', '🚀', '💡', '⏰', '📞', '📱', '💬', '📍', '💵'
];

const formatDateDivider = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer';
    } else {
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
};

const getAuthHeaders = () => ({ 'x-auth-token': getToken() || '' });

export default function Chats() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const targetClienteId = location.state?.clienteId || location.state?.cliente?.id || searchParams.get('clienteId');
    const [wsStatus, setWsStatus] = useState('desconectado');
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [qrCode, setQrCode] = useState(null);
    const [connectingWA, setConnectingWA] = useState(false);
    const [qrSecondsLeft, setQrSecondsLeft] = useState(60);
    const qrTimerRef = useRef(null);
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [chatFilter, setChatFilter] = useState('todos'); // todos | conMensajes | prospectos | clientes
    const [showCitaModal, setShowCitaModal] = useState(false);
    const [updatingEtapa, setUpdatingEtapa] = useState(false);
    
    // Estados para Notas Internas y Slash Commands
    const [isNoteMode, setIsNoteMode] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashQuery, setSlashQuery] = useState('');
    const [slashIndex, setSlashIndex] = useState(0);

    // 🎙️ Estados para Grabación de Nota de Voz
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // 📎 Estados para Adjuntar Archivos / Imágenes / PDFs
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileCaption, setFileCaption] = useState('');
    const fileInputRef = useRef(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // ⏰ Estados para Mensajes Programados
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [scheduledMessageText, setScheduledMessageText] = useState('');
    const [scheduledList, setScheduledList] = useState([]);
    const [showScheduledListModal, setShowScheduledListModal] = useState(false);

    // 📌 🏷️ 💬 Estados para Ajustes de Chat (Fijar, No Leído, Etiquetas)
    const [chatSettingsMap, setChatSettingsMap] = useState({});
    const [activeChatCardMenuId, setActiveChatCardMenuId] = useState(null);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const currentUser = getUser();

    // Cargar mapa de ajustes de chat (fijados, etiquetas, no leídos)
    const fetchChatSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/whatsapp/chats-settings`, { headers: getAuthHeaders() });
            setChatSettingsMap(res.data || {});
        } catch (err) {
            console.error('Error fetching chat settings:', err);
        }
    };

    // Cargar mensajes programados pendientes
    const fetchScheduledMessages = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/whatsapp/scheduled`, { headers: getAuthHeaders() });
            setScheduledList(res.data || []);
        } catch (err) {
            console.error('Error fetching scheduled messages:', err);
        }
    };

    useEffect(() => {
        fetchChatSettings();
        fetchScheduledMessages();
    }, []);

    // Actualizar ajuste de chat (Fijar / No Leído / Etiqueta)
    const handleUpdateChatSetting = async (clienteId, updates) => {
        try {
            await axios.post(`${API_URL}/api/whatsapp/chats/${clienteId}/settings`, updates, { headers: getAuthHeaders() });
            setChatSettingsMap(prev => ({
                ...prev,
                [clienteId]: { ...(prev[clienteId] || {}), ...updates }
            }));
            toast.success('Ajuste de chat actualizado');
        } catch (err) {
            toast.error('Error actualizando ajuste del chat');
        }
    };

    // Iniciar grabación de audio
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Determinar tipo MIME compatible con el navegador
            let mimeType = 'audio/webm;codecs=opus';
            if (typeof MediaRecorder !== 'undefined') {
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    mimeType = 'audio/webm;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                    mimeType = 'audio/ogg;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4';
                } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/webm';
                }
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            toast.error('No se pudo acceder al micrófono del navegador.');
        }
    };

    // Detener grabación de audio
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            try { mediaRecorderRef.current.stop(); } catch (_) {}
            try { mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop()); } catch (_) {}
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
        setIsRecording(false);
    };

    // Cancelar grabación
    const cancelRecording = () => {
        stopRecording();
        setAudioBlob(null);
        setRecordingTime(0);
    };

    // Enviar Nota de Voz grabada
    const handleSendAudioNote = async () => {
        if (!audioBlob || !activeChat) return;
        setUploadingMedia(true);
        const tid = toast.loading('Enviando nota de voz por WhatsApp...');
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, `audio_${Date.now()}.ogg`);
            formData.append('clienteId', activeChat.id);
            formData.append('mediaType', 'audio');

            await axios.post(`${API_URL}/api/whatsapp/send-media`, formData, {
                headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Nota de voz enviada', { id: tid });
            cancelRecording();
            fetchMessages(activeChat.id);
        } catch (err) {
            toast.error(err.response?.data?.mensaje || err.message, { id: tid });
        } finally {
            setUploadingMedia(false);
        }
    };

    // Enviar archivo adjunto
    const handleSendFile = async () => {
        if (!selectedFile || !activeChat) return;
        setUploadingMedia(true);
        const tid = toast.loading('Enviando archivo por WhatsApp...');
        try {
            const isImg = selectedFile.type.startsWith('image/');
            const mediaType = isImg ? 'image' : 'document';

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('clienteId', activeChat.id);
            formData.append('mediaType', mediaType);
            if (fileCaption) formData.append('caption', fileCaption);

            await axios.post(`${API_URL}/api/whatsapp/send-media`, formData, {
                headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Archivo enviado correctamente', { id: tid });
            setSelectedFile(null);
            setFileCaption('');
            fetchMessages(activeChat.id);
        } catch (err) {
            toast.error(err.response?.data?.mensaje || err.message, { id: tid });
        } finally {
            setUploadingMedia(false);
        }
    };

    // Programar mensaje
    const handleScheduleMessage = async (e) => {
        if (e) e.preventDefault();
        if (!activeChat || !scheduledMessageText.trim() || !scheduledDateTime) {
            return toast.error('Selecciona fecha, hora y escribe un mensaje');
        }

        const tid = toast.loading('Programando mensaje...');
        try {
            await axios.post(`${API_URL}/api/whatsapp/scheduled`, {
                clienteId: activeChat.id,
                mensaje: scheduledMessageText.trim(),
                scheduledAt: new Date(scheduledDateTime).toISOString()
            }, { headers: getAuthHeaders() });

            toast.success('Mensaje programado con éxito', { id: tid });
            setShowScheduleModal(false);
            setScheduledMessageText('');
            setScheduledDateTime('');
            fetchScheduledMessages();
        } catch (err) {
            toast.error(err.response?.data?.mensaje || err.message, { id: tid });
        }
    };

    // Cancelar mensaje programado
    const handleCancelScheduled = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/whatsapp/scheduled/${id}`, { headers: getAuthHeaders() });
            toast.success('Mensaje programado cancelado');
            fetchScheduledMessages();
        } catch (err) {
            toast.error('Error al cancelar mensaje');
        }
    };

    const renderBubbleContent = (text) => {
        const mediaMatch = text.match(/\[(IMAGE|VIDEO|AUDIO|DOCUMENT|STICKER)\]\(([^)]+)\)/i);
        if (mediaMatch) {
            const type = mediaMatch[1];
            let url = mediaMatch[2];
            
            if (url.startsWith('/')) {
                url = `${API_URL}${url}`;
            }
            
            const caption = text.replace(/\[(IMAGE|VIDEO|AUDIO|DOCUMENT|STICKER)\]\(([^)]+)\)\s*-?\s*/i, '');
            
            return (
                <div className="space-y-2 pb-3.5 pr-10">
                    {type === 'IMAGE' && (
                        <img 
                            src={url} 
                            alt="WhatsApp Media" 
                            className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-slate-100" 
                            onClick={() => window.open(url, '_blank')} 
                        />
                    )}
                    {type === 'STICKER' && (
                        <img 
                            src={url} 
                            alt="WhatsApp Sticker" 
                            className="w-32 h-32 object-contain cursor-pointer hover:scale-105 transition-transform" 
                            onClick={() => window.open(url, '_blank')} 
                        />
                    )}
                    {type === 'VIDEO' && (
                        <video src={url} controls className="rounded-lg max-w-full max-h-60 border border-slate-100" />
                    )}
                    {type === 'AUDIO' && (
                        <audio src={url} controls className="block w-[240px] max-w-full my-1.5 focus:outline-none" />
                    )}
                    {type === 'DOCUMENT' && (
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100/60 hover:bg-slate-200/60 border border-slate-200/60 transition-colors text-slate-700 font-semibold"
                        >
                            <Paperclip size={18} className="text-slate-500 shrink-0" />
                            <span className="truncate text-xs underline">Ver Documento Recibido</span>
                        </a>
                    )}
                    {caption && <p className="whitespace-pre-wrap break-all leading-relaxed">{caption}</p>}
                </div>
            );
        }
        return <p className="whitespace-pre-wrap break-all leading-relaxed pb-3.5 pr-10">{text}</p>;
    };

    // 1. Verificar estado de WhatsApp al cargar
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/api/whatsapp/status`, {
                    headers: { 'x-auth-token': getToken() }
                });
                if (res.ok) {
                    const data = await res.json();
                    setWsStatus(data.status);
                }
            } catch (err) {
                console.error('Error fetching WhatsApp status:', err);
            } finally {
                setLoadingStatus(false);
            }
        };
        fetchStatus();

        // Registrarse en el canal del usuario para recibir QR y estados en tiempo real
        if (currentUser) {
            socket.emit('join_user', { userId: currentUser.id || currentUser._id, token: getToken() });
        }

        // Escuchar actualizaciones de estado de conexión en tiempo real
        const handleStatus = (data) => {
            setWsStatus(data.status);
            if (data.status === 'conectado' || data.status === 'desconectado') {
                setQrCode(null);
                setConnectingWA(false);
                // Limpiar countdown
                if (qrTimerRef.current) clearInterval(qrTimerRef.current);
            }
        };
        const handleQr = (qrDataUrl) => {
            setWsStatus('generando_qr');
            setQrCode(qrDataUrl);
            setConnectingWA(false);
            // Reiniciar countdown a 60 segundos
            setQrSecondsLeft(60);
            if (qrTimerRef.current) clearInterval(qrTimerRef.current);
            qrTimerRef.current = setInterval(() => {
                setQrSecondsLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(qrTimerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        socket.on('whatsapp-status', handleStatus);
        socket.on('whatsapp-qr', handleQr);

        return () => {
            if (currentUser) {
                socket.emit('leave_user', currentUser.id || currentUser._id);
            }
            socket.off('whatsapp-status', handleStatus);
            socket.off('whatsapp-qr', handleQr);
        };
    }, []);

    // 2. Cargar lista de chats si está conectado
    const fetchChatsList = async (showLoading = false) => {
        if (showLoading) setLoadingChats(true);
        try {
            const res = await fetch(`${API_URL}/api/whatsapp/chats`, {
                headers: { 'x-auth-token': getToken() }
            });
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (err) {
            console.error('Error fetching chats list:', err);
        } finally {
            setLoadingChats(false);
        }
    };

    useEffect(() => {
        fetchChatsList(true);
    }, []);

    useEffect(() => {
        if (wsStatus === 'conectado' || wsStatus === 'sincronizando') {
            fetchChatsList(false);
        }
    }, [wsStatus]);

    // Seleccionar automáticamente el chat del prospecto o cliente cuando viene redirigido desde Seguimiento o Clientes
    useEffect(() => {
        if (targetClienteId) {
            const targetIdStr = String(targetClienteId);
            if (chats.length > 0) {
                const found = chats.find(c => String(c.id) === targetIdStr);
                if (found) {
                    setActiveChat(found);
                } else {
                    axios.get(`${API_URL}/api/clientes/${targetClienteId}`, { headers: getAuthHeaders() })
                        .then(res => {
                            if (res.data) {
                                const newChat = {
                                    id: res.data.id,
                                    nombres: res.data.nombres || 'Cliente',
                                    apellidoPaterno: res.data.apellidoPaterno || '',
                                    telefono: res.data.telefono || '',
                                    etapaEmbudo: res.data.etapaEmbudo || ''
                                };
                                setActiveChat(newChat);
                            }
                        })
                        .catch(() => {});
                }
            }
        }
    }, [targetClienteId, chats]);

    // 3. Cargar mensajes del chat activo
    const fetchMessages = async (clienteId) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`${API_URL}/api/whatsapp/chats/${clienteId}`, {
                headers: { 'x-auth-token': getToken() }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.id);
        }
    }, [activeChat]);

    // 4. Escuchar nuevos mensajes (WebSockets)
    useEffect(() => {
        const handleUpdate = () => {
            // Refrescar lista de chats de fondo
            fetchChatsList(false);
            // Refrescar chat activo si existe
            if (activeChat) {
                fetchMessages(activeChat.id);
            }
        };

        socket.on('prospectos_actualizados', handleUpdate);
        return () => {
            socket.off('prospectos_actualizados', handleUpdate);
        };
    }, [activeChat]);

    // 5. Scroll automático al fondo cuando cambian los mensajes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loadingMessages]);

    // 5.5 Cargar plantillas para Slash Commands
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/plantillas?scope=prospecto`, { headers: getAuthHeaders() });
                setTemplates(res.data);
            } catch (err) {
                console.error('Error loading templates:', err);
            }
        };
        loadTemplates();
    }, []);

    // 6. Enviar mensaje por WhatsApp (o Nota Interna)
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!messageText.trim() || !activeChat) return;

        const txt = messageText.trim();
        const wasNote = isNoteMode;
        
        // Limpiar el input inmediatamente para que el usuario pueda seguir escribiendo
        setMessageText('');
        setShowEmojiPicker(false); // Cerrar picker al enviar
        setShowSlashMenu(false);

        // Mensaje optimista: mostrarlo inmediatamente en la UI antes de confirmar
        const optimisticMsg = {
            id: `optimistic_${Date.now()}`,
            descripcion: wasNote ? txt : `Vendedor: ${txt}`,
            resultado: wasNote ? 'nota_interna' : 'enviado',
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        // Enviar al servidor en segundo plano
        fetch(`${API_URL}/api/whatsapp/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': getToken()
            },
            body: JSON.stringify({
                clienteId: activeChat.id,
                mensaje: txt,
                isInternalNote: wasNote
            })
        })
        .then(async (res) => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.mensaje || errorData.error || 'Error al enviar mensaje');
            }
            // Refrescar mensajes reales desde servidor de fondo
            fetchMessages(activeChat.id);
            fetchChatsList(false);
        })
        .catch((err) => {
            toast.error(`Error al enviar mensaje: "${txt.substring(0, 20)}...". ${err.message}`);
            // Revertir mensaje optimista y restaurar texto
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setMessageText(txt);
        });
    };

    // Manejar Shift+Enter para salto de línea, Enter solo para enviar
    const handleKeyDown = (e) => {
        if (showSlashMenu) {
            const filtered = templates.filter(t => t.nombre.toLowerCase().includes(slashQuery.toLowerCase()));
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSlashIndex(prev => (prev + 1) % filtered.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSlashIndex(prev => (prev - 1 + filtered.length) % filtered.length);
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered[slashIndex]) {
                    handleSelectSlashTemplate(filtered[slashIndex]);
                }
                return;
            }
            if (e.key === 'Escape') {
                setShowSlashMenu(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTextChange = (e) => {
        const val = e.target.value;
        setMessageText(val);

        // Detectar Slash Commands
        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

        if (lastSlashIndex !== -1) {
            const query = textBeforeCursor.slice(lastSlashIndex + 1);
            // Mostrar menú si no hay espacios en el query (es una sola palabra)
            if (!query.includes(' ')) {
                setSlashQuery(query);
                setShowSlashMenu(true);
                setSlashIndex(0);
                return;
            }
        }
        setShowSlashMenu(false);
    };

    const handleSelectSlashTemplate = (template) => {
        const txt = applyTemplate(template.contenido, activeChat);
        const lastSlashIndex = messageText.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            const beforeSlash = messageText.slice(0, lastSlashIndex);
            setMessageText(beforeSlash + txt + ' ');
        } else {
            setMessageText(txt);
        }
        setShowSlashMenu(false);
    };

    const handleUpdateEtapa = async (nuevaEtapa) => {
        if (!activeChat) return;
        setUpdatingEtapa(true);
        try {
            await axios.put(`${API_URL}/api/vendedor/prospectos/${activeChat.id}`, {
                etapaEmbudo: nuevaEtapa
            }, {
                headers: { 'x-auth-token': getToken() }
            });
            toast.success('Etapa actualizada');
            setActiveChat(prev => ({ ...prev, etapaEmbudo: nuevaEtapa }));
            fetchChatsList(false); // Refrescar lista de chats de fondo
        } catch (error) {
            toast.error(error?.response?.data?.msg || 'Error al actualizar etapa');
        } finally {
            setUpdatingEtapa(false);
        }
    };

    const handleAgendarCita = async (fechaCita) => {
        if (!activeChat) return;
        try {
            await axios.put(`${API_URL}/api/vendedor/prospectos/${activeChat.id}`, {
                proximaLlamada: fechaCita
            }, {
                headers: { 'x-auth-token': getToken() }
            });
            toast.success('Cita agendada correctamente');
            setShowCitaModal(false);
            setActiveChat(prev => ({ ...prev, proximaLlamada: fechaCita }));
        } catch (error) {
            toast.error(error?.response?.data?.msg || 'Error al agendar cita');
        }
    };

    // Redirección a Ajustes
    const goVincular = () => {
        localStorage.setItem('crm_active_settings_tab', 'whatsapp');
        navigate('/vendedor/ajustes');
    };

    // Conectar WhatsApp desde esta pantalla
    const connectWhatsApp = async () => {
        setConnectingWA(true);
        setQrCode(null);
        setWsStatus('generando_qr');
        try {
            const res = await fetch(`${API_URL}/api/whatsapp/connect`, {
                method: 'POST',
                headers: { 'x-auth-token': getToken() }
            });
            if (!res.ok) {
                toast.error('Error al iniciar la conexión de WhatsApp');
                setWsStatus('desconectado');
                setConnectingWA(false);
            }
        } catch (err) {
            toast.error('Error de conexión con el servidor');
            setWsStatus('desconectado');
            setConnectingWA(false);
        }
    };

    // Desconectar WhatsApp
    const disconnectWhatsApp = async () => {
        const tid = toast.loading('Cerrando sesión de WhatsApp...');
        try {
            const res = await fetch(`${API_URL}/api/whatsapp/disconnect`, {
                method: 'POST',
                headers: { 'x-auth-token': getToken() }
            });
            if (res.ok) {
                setWsStatus('desconectado');
                setQrCode(null);
                toast.success('Sesión cerrada', { id: tid });
            } else {
                toast.error('Error al cerrar sesión', { id: tid });
            }
        } catch (err) {
            toast.error('Error de conexión', { id: tid });
        }
    };

    // Formatear hora estilo WhatsApp (14:35)
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleToggleClientStatus = async () => {
        setShowMenu(false);
        if (!activeChat) return;
        try {
            const res = await fetch(`${API_URL}/api/whatsapp/chats/${activeChat.id}/toggle-client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken() || ''
                }
            });
            if (!res.ok) throw new Error('Error al actualizar el estado del contacto');
            const data = await res.json();
            toast.success(data.mensaje);
            
            // Actualizar localmente la etapa del chat activo
            setActiveChat(prev => prev ? { ...prev, etapaEmbudo: data.etapaEmbudo } : null);
            // Volver a cargar la lista
            fetchChatsList(false);
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Filtrar chats por búsqueda, etiquetas, no leídos y fijados
    const filteredChats = chats.filter(c => {
        const matchesSearch = `${c.nombres} ${c.apellidoPaterno}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.telefono?.includes(searchQuery);
        if (!matchesSearch) return false;

        const isCl = ['venta_ganada', 'cliente_activo'].includes(c.etapaEmbudo);
        const setting = chatSettingsMap[c.id] || {};

        if (chatFilter === 'fijados') return Boolean(setting.isPinned);
        if (chatFilter === 'sin_leer') return Boolean(setting.isUnread) || Boolean(c.unanswered);
        if (['Urgente', 'Cotización', 'En Negociación', 'Seguimiento', 'Pago Pendiente'].includes(chatFilter)) {
            return setting.label === chatFilter;
        }

        if (chatFilter === 'prospectos') return !isCl;
        if (chatFilter === 'clientes') return isCl;
        if (chatFilter === 'conMensajes') return !!c.lastMessageTime;
        return true;
    }).sort((a, b) => {
        const settingA = chatSettingsMap[a.id] || {};
        const settingB = chatSettingsMap[b.id] || {};

        if (settingA.isPinned && !settingB.isPinned) return -1;
        if (!settingA.isPinned && settingB.isPinned) return 1;

        const timeA = new Date(a.lastMessageTime || a.lastmessagetime || a.ultimaInteraccion || a.ultimainteraccion || a.createdAt || a.createdat || 0).getTime();
        const timeB = new Date(b.lastMessageTime || b.lastmessagetime || b.ultimaInteraccion || b.ultimainteraccion || b.createdAt || 0).getTime();
        return timeB - timeA;
    });

    if (loadingStatus) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-green-500 mx-auto" />
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Verificando WhatsApp...</p>
                </div>
            </div>
        );
    }

    // ─── PANTALLA: WhatsApp no conectado / generando QR ──────────────────────
    if (wsStatus !== 'conectado' && wsStatus !== 'sincronizando') {
        return (
            <div className="h-full flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 60%, #eff6ff 100%)' }}>
                <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
                    {/* Header verde */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                            <MessageSquare className="w-9 h-9 text-white" />
                        </div>
                        <h2 className="text-white font-black text-lg tracking-tight">CRM WhatsApp</h2>
                        <p className="text-green-100 text-[11px] mt-1 font-semibold">
                            {wsStatus === 'generando_qr' ? 'Escanea el código con tu teléfono' : 'Vincula tu WhatsApp para chatear'}
                        </p>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Estado: generando QR → mostrar imagen QR */}
                        {wsStatus === 'generando_qr' && (
                            <div className="text-center space-y-4">
                                {qrCode ? (
                                    <>
                                        {/* QR Image con borde animado según urgencia */}
                                        <div className="relative inline-block">
                                            <div className={`absolute inset-0 rounded-2xl blur-xl transition-colors duration-500 ${
                                                qrSecondsLeft <= 15 ? 'bg-red-400/20' : 'bg-green-400/10'
                                            }`} />
                                            <img
                                                src={qrCode}
                                                alt="WhatsApp QR"
                                                className={`relative w-52 h-52 mx-auto rounded-2xl border-4 shadow-xl object-contain transition-all duration-500 ${
                                                    qrSecondsLeft <= 15
                                                        ? 'border-red-200 opacity-80'
                                                        : 'border-green-100'
                                                }`}
                                            />
                                            {/* Badge de tiempo sobre el QR */}
                                            <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black shadow-md transition-colors duration-300 ${
                                                qrSecondsLeft <= 15
                                                    ? 'bg-red-500 text-white'
                                                    : qrSecondsLeft <= 30
                                                    ? 'bg-amber-400 text-amber-900'
                                                    : 'bg-green-500 text-white'
                                            }`}>
                                                {qrSecondsLeft}s
                                            </div>
                                        </div>

                                        {/* Barra de progreso countdown */}
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                                                    qrSecondsLeft <= 15 ? 'bg-red-500' :
                                                    qrSecondsLeft <= 30 ? 'bg-amber-400' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${(qrSecondsLeft / 60) * 100}%` }}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-slate-700">Abre WhatsApp en tu teléfono</p>
                                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                                Ve a <span className="font-black text-slate-600">Dispositivos vinculados</span> → <span className="font-black text-slate-600">Vincular dispositivo</span>
                                            </p>
                                            {qrSecondsLeft === 0 && (
                                                <p className="text-[10px] text-red-500 font-black uppercase tracking-wider animate-pulse">
                                                    ⚠️ Código expirado — generando uno nuevo...
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={connectWhatsApp}
                                            className="text-[11px] text-slate-400 hover:text-green-600 font-bold transition-colors underline"
                                        >
                                            Generar nuevo código
                                        </button>
                                    </>
                                ) : (
                                    <div className="py-8 space-y-3">
                                        <div className="w-52 h-52 mx-auto rounded-2xl border-2 border-dashed border-green-200 flex items-center justify-center bg-green-50/50">
                                            <div className="text-center space-y-3">
                                                <RefreshCw className="w-8 h-8 text-green-400 animate-spin mx-auto" />
                                                <p className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Generando QR...</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Estado: desconectado → botones de acción */}
                        {wsStatus === 'desconectado' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                        <span className="text-red-500 font-black text-sm">!</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-700">WhatsApp Desconectado</p>
                                        <p className="text-[11px] text-slate-400 font-semibold">Escanea el QR para vincular tu cuenta</p>
                                    </div>
                                </div>

                                <button
                                    onClick={connectWhatsApp}
                                    disabled={connectingWA}
                                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-black text-xs rounded-2xl shadow-lg shadow-green-500/25 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {connectingWA ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Iniciando...</>
                                    ) : (
                                        <><Link className="w-4 h-4" /> Conectar WhatsApp</>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Instrucciones paso a paso (siempre visibles) */}
                        {wsStatus !== 'generando_qr' && (
                            <div className="space-y-2">
                                {[
                                    { n: '1', t: 'Abre WhatsApp en tu teléfono' },
                                    { n: '2', t: 'Toca Menú (⋮) → Dispositivos vinculados' },
                                    { n: '3', t: 'Toca "Vincular dispositivo"' },
                                    { n: '4', t: 'Escanea el QR que aparece aquí' },
                                ].map(step => (
                                    <div key={step.n} className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 font-black flex items-center justify-center shrink-0 text-[10px]">{step.n}</span>
                                        {step.t}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex bg-slate-100/30 overflow-hidden relative">
            <style>{`
                .whatsapp-bg {
                    background-color: #efeae2;
                    background-image: url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png");
                    background-blend-mode: overlay;
                    opacity: 0.96;
                }
                .bubble-shadow {
                    box-shadow: 0 1px 0.5px rgba(11,20,26,.13);
                }
            `}</style>

            {/* COLUMNA IZQUIERDA: LISTADO DE CHATS */}
            <div className={`w-full md:w-[320px] lg:w-[380px] flex flex-col bg-white border-r border-slate-200/80 shrink-0 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                {/* Header Izquierdo */}
                <div className="p-3 bg-slate-50 border-b border-slate-200/60 flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-black shadow-md shadow-green-500/10 shrink-0">
                            {currentUser?.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-black text-slate-800 leading-tight truncate">Mis Conversaciones</h2>
                            {wsStatus === 'sincronizando' ? (
                                <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1" title="WhatsApp está conectando y descargando el historial de mensajes de tu teléfono. Esto puede tardar unos minutos.">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shrink-0" /> <span className="truncate">Sincronizando...</span>
                                </p>
                            ) : (
                                <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping shrink-0" /> <span className="truncate">Conectado</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowScheduledListModal(true)}
                            className="flex-1 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            title="Ver mensajes de WhatsApp programados"
                        >
                            <Clock size={11} className="shrink-0" />
                            <span className="truncate">Programados ({scheduledList.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/vendedor/ajustes')}
                            className="flex-1 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            title="Ver recomendaciones y reglas anti-spam de WhatsApp en Ajustes"
                        >
                            <span className="shrink-0">⚠️</span> <span className="truncate">Anti-Spam</span>
                        </button>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="p-3 bg-white border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar cliente por nombre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 placeholder-slate-400 outline-none focus:bg-white focus:border-green-500 transition-all font-semibold"
                        />
                    </div>
                </div>

                {/* Filtro de tipo (Todos / Fijados / Sin leer / Etiquetas / Prospectos / Clientes) */}
                <div className="px-3 pb-3 pt-2.5 flex gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-100 bg-white">
                    {[
                        { id: 'todos', label: 'Todos' },
                        { id: 'fijados', label: '📌 Fijados' },
                        { id: 'sin_leer', label: '💬 Sin Leer' },
                        { id: 'Urgente', label: '🔥 Urgente' },
                        { id: 'Cotización', label: '📄 Cotización' },
                        { id: 'En Negociación', label: '🤝 Negociación' },
                        { id: 'prospectos', label: 'Prospectos' },
                        { id: 'clientes', label: 'Clientes' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setChatFilter(tab.id)}
                            className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all shrink-0 ${
                                chatFilter === tab.id 
                                    ? 'bg-green-500 text-white shadow-sm shadow-green-500/20' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {loadingChats ? (
                        <div className="p-6 text-center text-slate-400 space-y-2">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-green-500" />
                            <p className="text-[10px] font-black uppercase tracking-wider">Cargando chats...</p>
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-semibold">No se encontraron chats con este filtro.</p>
                        </div>
                    ) : (
                        filteredChats.map((c) => {
                            const isActive = activeChat?.id === c.id;
                            const cleanLastMsg = c.lastMessage?.replace(/^(Vendedor:|Cliente:)\s*/, '') || 'Sin mensajes aún';
                            const setting = chatSettingsMap[c.id] || {};
                            const isPinned = Boolean(setting.isPinned);
                            const isUnread = Boolean(setting.isUnread);
                            const label = setting.label || '';
                            const isMenuOpen = activeChatCardMenuId === c.id;
                            
                            return (
                                <div
                                    key={c.id}
                                    className={`group relative w-full flex items-center transition-all ${
                                        isActive ? 'bg-green-50/60 border-l-4 border-green-500' : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveChat(c)}
                                        className="flex-1 p-3.5 flex gap-3 text-left min-w-0"
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-11 h-11 bg-linear-to-br from-green-400 to-green-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-sm">
                                                {c.nombres.charAt(0).toUpperCase()}
                                            </div>
                                            {isPinned && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center shadow-xs">
                                                    <Pin size={10} className="fill-amber-950" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                                                    <span>{c.nombres} {c.apellidoPaterno}</span>
                                                    {label && (
                                                        <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                                            {label}
                                                        </span>
                                                    )}
                                                </h4>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {(c.unanswered || isUnread) && (
                                                        <span className="relative flex h-2 w-2 mr-0.5" title="Mensaje no leído">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-sm"></span>
                                                        </span>
                                                    )}
                                                    {c.lastMessageTime && (
                                                        <span className="text-[9px] text-slate-400 font-bold">
                                                            {formatTime(c.lastMessageTime)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate font-semibold">
                                                {c.lastMessageFromMe && <span className="text-green-500 font-black">Tú: </span>}
                                                {cleanLastMsg}
                                            </p>
                                        </div>
                                    </button>

                                    {/* Botón Menú de opciones de chat (Fijar / No Leído / Etiquetas) */}
                                    <div className="relative pr-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveChatCardMenuId(isMenuOpen ? null : c.id);
                                            }}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                                            title="Opciones de chat"
                                        >
                                            <MoreVertical size={14} />
                                        </button>

                                        {isMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setActiveChatCardMenuId(null)} />
                                                <div className="absolute right-2 top-8 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100 text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveChatCardMenuId(null);
                                                            handleUpdateChatSetting(c.id, { isPinned: !isPinned });
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Pin size={13} className={isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                                                        {isPinned ? 'Desfijar chat' : 'Fijar chat al inicio'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveChatCardMenuId(null);
                                                            handleUpdateChatSetting(c.id, { isUnread: !isUnread });
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                                                    >
                                                        <MessageSquare size={13} className={isUnread ? 'text-emerald-500' : 'text-slate-400'} />
                                                        {isUnread ? 'Marcar como Leído' : 'Marcar como No Leído'}
                                                    </button>

                                                    <div className="px-3 pt-1.5 pb-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                                        Asignar Etiqueta:
                                                    </div>
                                                    {['Urgente', 'Cotización', 'En Negociación', 'Seguimiento', 'Pago Pendiente'].map((lbl) => (
                                                        <button
                                                            key={lbl}
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveChatCardMenuId(null);
                                                                handleUpdateChatSetting(c.id, { label: label === lbl ? '' : lbl });
                                                            }}
                                                            className={`w-full text-left px-3 py-1 text-[11px] font-bold flex items-center gap-2 transition-colors ${
                                                                label === lbl ? 'bg-amber-50 text-amber-900 font-black' : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <Tag size={12} className={label === lbl ? 'text-amber-600' : 'text-slate-400'} />
                                                            <span>{lbl}</span>
                                                            {label === lbl && <Check size={12} className="ml-auto text-amber-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* COLUMNA DERECHA: VENTANA DE CONVERSACIÓN */}
            <div className={`flex-1 flex flex-col bg-[#efeae2] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                    <>
                        {/* Header Chat */}
                        <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shadow-xs z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                {/* Botón Volver (Mobile Only) */}
                                <button 
                                    onClick={() => setActiveChat(null)} 
                                    className="md:hidden p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                
                                <div className="w-10 h-10 bg-linear-to-br from-green-400 to-green-600 text-white rounded-xl flex items-center justify-center font-black shadow-sm text-xs">
                                    {activeChat.nombres.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 leading-tight">
                                        {activeChat.nombres} {activeChat.apellidoPaterno}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                        {activeChat.telefono}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 relative">
                                <select
                                    value={activeChat.etapaEmbudo || 'prospecto_nuevo'}
                                    onChange={(e) => handleUpdateEtapa(e.target.value)}
                                    disabled={updatingEtapa}
                                    className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-1.5 px-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-(--theme-500) appearance-none hover:bg-slate-200 transition-colors hidden sm:block"
                                >
                                    <option value="prospecto_nuevo">Sin contacto</option>
                                    <option value="en_contacto">En contacto</option>
                                    <option value="reunion_agendada">Cita agendada</option>
                                    <option value="reunion_realizada">Cita realizada</option>
                                    <option value="en_negociacion">Negociación</option>
                                    <option value="venta_ganada">Venta ganada</option>
                                    <option value="perdido">Perdido</option>
                                </select>
                                
                                <button 
                                    onClick={() => setShowCitaModal(true)}
                                    className="hidden sm:flex items-center gap-1.5 text-xs bg-(--theme-50) text-(--theme-700) hover:bg-(--theme-100) font-bold py-1.5 px-3 rounded-lg transition-colors border border-(--theme-100)"
                                >
                                    <span>🗓</span> Agendar
                                </button>

                                <button 
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
                                    title="Opciones"
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {showMenu && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setShowMenu(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    navigate('/vendedor/prospectos', { state: { selectedId: activeChat.id } });
                                                }}
                                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-100"
                                            >
                                                <User size={14} className="text-slate-400" />
                                                Ver información
                                            </button>
                                            <button
                                                onClick={handleToggleClientStatus}
                                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                            >
                                                {['venta_ganada', 'cotizacion_realizada', 'contrato_firmado', 'esperando_pago', 'cliente_activo'].includes(activeChat.etapaEmbudo) ? (
                                                    <>
                                                        <User size={14} className="text-rose-500" />
                                                        Marcar como Prospecto
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                        Marcar como Cliente
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {wsStatus === 'sincronizando' && (
                            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center text-[11px] text-amber-700 font-extrabold flex items-center justify-center gap-2 select-none shrink-0">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                                <span>Descargando historial de mensajes... Por favor espera a que se complete para ver tus chats ordenados y actualizados.</span>
                            </div>
                        )}

                        {/* Historial de Mensajes (Estilo WhatsApp) */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 whatsapp-bg scrollbar-thin">
                            {loadingMessages ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="px-4 py-2 bg-white/90 backdrop-blur border border-slate-200/50 rounded-xl shadow-md text-[10px] uppercase font-black tracking-widest text-slate-400 animate-pulse">
                                        Cargando conversación...
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="px-4 py-2 bg-white/80 rounded-xl shadow-xs border border-slate-200/60 max-w-xs text-xs text-slate-500 font-semibold">
                                        No hay interacciones de WhatsApp guardadas con este cliente. Escribe abajo para iniciar el chat.
                                    </div>
                                </div>
                            ) : (() => {
                                let lastDate = null;
                                return messages.map((m) => {
                                    const isFromMe = m.resultado === 'enviado' || m.descripcion.startsWith('Vendedor:');
                                    const msgText = m.descripcion.replace(/^(Vendedor:|Cliente:)\s*/, '');
                                    const msgDate = new Date(m.createdAt || m.fecha).toDateString();
                                    const showDivider = msgDate !== lastDate;
                                    lastDate = msgDate;
                                    
                                    return (
                                        <React.Fragment key={m.id}>
                                            {showDivider && (
                                                <div className="flex justify-center my-4 select-none">
                                                    <span className="px-3.5 py-1 bg-white/90 backdrop-blur border border-slate-200/50 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-full shadow-xs">
                                                        {formatDateDivider(m.createdAt || m.fecha)}
                                                    </span>
                                                </div>
                                            )}
                                            <div
                                                className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} animate-in fade-in-50 duration-200`}
                                            >
                                                <div
                                                    className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl bubble-shadow text-slate-800 text-xs font-semibold relative break-words overflow-hidden ${
                                                        m.resultado === 'nota_interna'
                                                            ? 'bg-amber-100 border border-amber-300 rounded-tr-none text-amber-900 shadow-sm'
                                                            : isFromMe 
                                                                ? 'bg-[#d9fdd3] rounded-tr-none' 
                                                                : 'bg-white rounded-tl-none'
                                                    }`}
                                                >
                                                    {m.resultado === 'nota_interna' && (
                                                        <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-black tracking-wider text-amber-600/80">
                                                            <StickyNote size={12} />
                                                            <span>Nota Interna</span>
                                                        </div>
                                                    )}
                                                    {renderBubbleContent(msgText)}
                                                    <div className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[9px] text-slate-400 font-bold select-none">
                                                        <span>{formatTime(m.createdAt || m.fecha)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                });
                            })()}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Barra de Input WhatsApp */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center gap-3 shrink-0 relative">
                            {/* Slash Commands Menu */}
                            {showSlashMenu && templates.length > 0 && (
                                <div className="absolute bottom-[calc(100%+0.5rem)] left-0 w-80 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50 flex flex-col p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-100">
                                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                                        Plantillas (USA LAS FLECHAS Y ENTER)
                                    </div>
                                    {templates.filter(t => t.nombre.toLowerCase().includes(slashQuery.toLowerCase())).length === 0 ? (
                                        <div className="p-3 text-xs text-center text-slate-500 font-medium">No se encontraron plantillas.</div>
                                    ) : (
                                        templates.filter(t => t.nombre.toLowerCase().includes(slashQuery.toLowerCase())).map((t, idx) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => handleSelectSlashTemplate(t)}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex flex-col gap-0.5 ${idx === slashIndex ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <span className={`font-bold ${idx === slashIndex ? 'text-green-700' : 'text-slate-800'}`}>/{t.nombre}</span>
                                                <span className="text-[10px] text-slate-500 truncate">{t.contenido}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* File input oculto */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setSelectedFile(e.target.files[0]);
                                    }
                                }}
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                className="hidden"
                            />

                            {/* Barra flotante de vista previa de archivo seleccionado */}
                            {selectedFile && (
                                <div className="absolute bottom-[calc(100%+0.5rem)] left-3 right-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 truncate">
                                            <Paperclip size={16} className="text-green-600" />
                                            <span className="truncate">{selectedFile.name}</span>
                                            <span className="text-[10px] text-slate-400">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFile(null)}
                                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Agregar una leyenda opcional..."
                                            value={fileCaption}
                                            onChange={(e) => setFileCaption(e.target.value)}
                                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-green-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSendFile}
                                            disabled={uploadingMedia}
                                            className="px-4 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                                        >
                                            {uploadingMedia ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                                            <span>Enviar Archivo</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Barra flotante de Grabación de Nota de Voz */}
                            {(isRecording || audioBlob) && (
                                <div className="absolute bottom-[calc(100%+0.5rem)] left-3 right-3 bg-red-50 border border-red-200 rounded-2xl p-3 shadow-xl z-50 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                    <div className="flex items-center gap-2.5">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                        <div className="text-xs font-black text-red-900">
                                            {isRecording ? `Grabando Audio: ${Math.floor(recordingTime / 60).toString().padStart(2, '0')}:${(recordingTime % 60).toString().padStart(2, '0')}` : 'Nota de Voz lista'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isRecording ? (
                                            <button
                                                type="button"
                                                onClick={stopRecording}
                                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-black rounded-xl shadow-sm hover:bg-red-700"
                                            >
                                                Detener
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSendAudioNote}
                                                disabled={uploadingMedia}
                                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5"
                                            >
                                                {uploadingMedia ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                                                <span>Enviar Nota de Voz</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={cancelRecording}
                                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-100"
                                            title="Descartar nota de voz"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-1 relative">
                                <button 
                                    type="button" 
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-2 rounded-xl transition-colors ${showEmojiPicker ? 'bg-slate-200 text-green-600' : 'text-slate-500 hover:bg-slate-200'}`}
                                    title="Emojis"
                                >
                                    <Smile size={20} />
                                </button>

                                {showEmojiPicker && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setShowEmojiPicker(false)}
                                        />
                                        <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 w-64 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                            <div className="grid grid-cols-8 gap-2">
                                                {EMOJIS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => {
                                                            setMessageText(prev => prev + emoji);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                        className="text-lg hover:scale-125 transition-transform p-1.5 focus:outline-none"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Botón Adjuntar Archivo/PDF */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors"
                                    title="Adjuntar Imagen o Documento PDF"
                                >
                                    <Paperclip size={20} />
                                </button>

                                {/* Botón Grabador de Nota de Voz */}
                                <button
                                    type="button"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`p-2 rounded-xl transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-200'}`}
                                    title="Grabar Nota de Voz"
                                >
                                    <Mic size={20} />
                                </button>

                                {/* Botón Programar Mensaje Futuro */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setScheduledMessageText(messageText);
                                        setShowScheduleModal(true);
                                    }}
                                    className="p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                                    title="Programar envío de mensaje a fecha/hora futura"
                                >
                                    <Clock size={20} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsNoteMode(!isNoteMode)}
                                    className={`p-2 rounded-xl transition-colors ${isNoteMode ? 'bg-amber-100 text-amber-600' : 'text-slate-500 hover:bg-slate-200'}`}
                                    title={isNoteMode ? "Modo Nota Interna Activado" : "Escribir Nota Interna"}
                                >
                                    <StickyNote size={20} />
                                </button>
                            </div>

                            <PlantillasMensajesModal 
                                contacto={activeChat} 
                                onSelectTemplate={(texto) => {
                                    setMessageText((prev) => prev + (prev ? ' ' : '') + texto);
                                }}
                            />
                            
                            <textarea
                                rows={1}
                                placeholder={isNoteMode ? "Escribe una nota interna... (No será enviada)" : "Escribe un mensaje... (/ para plantillas)"}
                                value={messageText}
                                onChange={handleTextChange}
                                onKeyDown={handleKeyDown}
                                className={`flex-1 px-4 py-2.5 rounded-2xl border text-xs text-slate-700 placeholder-slate-400 outline-none transition-all font-semibold shadow-inner disabled:opacity-50 resize-none max-h-28 overflow-y-auto ${
                                    isNoteMode 
                                        ? 'bg-amber-50/50 border-amber-200 focus:border-amber-400' 
                                        : 'bg-white border-slate-200/80 focus:border-green-500'
                                }`}
                                style={{ minHeight: '40px' }}
                            />

                            <button
                                type="submit"
                                disabled={!messageText.trim()}
                                className="p-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-full shadow-lg shadow-green-500/20 active:scale-95 transition-all shrink-0"
                            >
                                <Send className="w-5 h-5 translate-x-[1px] -translate-y-[1px]" />
                            </button>
                        </form>
                    </>
                ) : (
                    /* Vista Vacía (WhatsApp Web Style) */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-green-100/50 blur-3xl rounded-full scale-125" />
                            <div className="relative w-28 h-28 bg-white border border-slate-200 rounded-3xl shadow-xl flex items-center justify-center">
                                <MessageSquare className="w-14 h-14 text-green-500" />
                            </div>
                        </div>
                        
                        <h2 className="text-xl font-black text-slate-800">CRM WhatsApp Web</h2>
                        <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed font-semibold">
                            Mantén el contacto con todos tus clientes y prospectos. Envía alertas de seguimiento y responde al instante sin salir del CRM.
                        </p>
                        
                        <div className="mt-8 pt-6 border-t border-slate-200/60 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 justify-center">
                            <span>🔒 Cifrado de extremo a extremo</span>
                            <span>•</span>
                            <span>⚡ Sincronización instantánea</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para agendar cita */}
            {showCitaModal && activeChat && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowCitaModal(false)} />
                    <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-(--theme-50) text-(--theme-600) flex items-center justify-center">
                                <span className="text-xl">🗓</span>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 tracking-tight leading-tight">Agendar cita</h3>
                                <p className="text-xs text-slate-500 font-medium">con {activeChat.nombres}</p>
                            </div>
                        </div>

                        <TimeWheelPicker
                            onSelect={handleAgendarCita}
                            onCancel={() => setShowCitaModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* Modal para Programar Mensaje Futuro */}
            {showScheduleModal && activeChat && (
                <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowScheduleModal(false)} />
                    <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">Programar Mensaje de WhatsApp</h3>
                                    <p className="text-[11px] text-slate-400 font-semibold">Para: {activeChat.nombres} {activeChat.apellidoPaterno}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowScheduleModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Fecha y Hora de Envío:</label>
                            <input
                                type="datetime-local"
                                value={scheduledDateTime}
                                onChange={(e) => setScheduledDateTime(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Mensaje a Enviar:</label>
                            <textarea
                                rows={4}
                                value={scheduledMessageText}
                                onChange={(e) => setScheduledMessageText(e.target.value)}
                                placeholder="Escribe el mensaje que se enviará automáticamente..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowScheduleModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleScheduleMessage}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5"
                            >
                                <Clock size={14} />
                                <span>Programar Envío</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Mensajes Programados Pendientes */}
            {showScheduledListModal && (
                <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowScheduledListModal(false)} />
                    <div className="relative bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 space-y-4 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">Mensajes Programados Pendientes</h3>
                                    <p className="text-[11px] text-slate-400 font-semibold">{scheduledList.length} envíos automáticos agendados</p>
                                </div>
                            </div>
                            <button onClick={() => setShowScheduledListModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {scheduledList.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 space-y-2">
                                    <Clock size={32} className="mx-auto text-slate-300" />
                                    <p className="text-xs font-semibold">No tienes mensajes programados pendientes.</p>
                                </div>
                            ) : (
                                scheduledList.map((item) => (
                                    <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start justify-between gap-3 text-xs">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-800">{item.nombres} {item.apellidoPaterno}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                                                    📅 {new Date(item.scheduled_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 font-medium break-words italic">"{item.mensaje}"</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCancelScheduled(item.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                                            title="Cancelar envío"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
