import React, { useState, useEffect } from 'react';
import {
    User, Lock, Shield, Monitor, LogOut,
    Link2, Link2Off, CheckCircle2, Mail, Phone,
    AlertCircle, Bell, Save, KeyRound, Palette, Camera,
    Award, Globe, MessageSquare
} from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { useLanguageStore } from '../store/useLanguageStore';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import API_URL from '../config/api';
import { getUser, saveUser, getToken } from '../utils/authUtils';
import useThemeStore, { THEMES } from '../store/themeStore.js';
import socket from '../config/socket';

const GoogleIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const Toggle = ({ value, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${value ? 'bg-linear-to-r from-(--theme-500) to-(--theme-400) shadow-lg shadow-(--theme-500)/30' : 'bg-slate-200'}`}
    >
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${value ? 'translate-x-6' : ''}`} />
    </button>
);

export default function VendedorAjustes() {
    const { t, language } = useTranslation();
    const setLanguage = useLanguageStore((state) => state.setLanguage);
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState({ nombre: 'Usuario', usuario: 'usuario', email: '', telefono: '', rol: 'vendedor', id: null });
    const [notifs, setNotifs] = useState({ email: true, tasks: true, updates: false });
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleUser, setGoogleUser] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPass, setSavingPass] = useState(false);
    const [profileForm, setProfileForm] = useState({ nombre: '', email: '', telefono: '' });
    const [passForm, setPassForm] = useState({ next: '', confirm: '' });
    const [activeTab, setActiveTab] = useState(() => {
        const persisted = localStorage.getItem('crm_active_settings_tab');
        return persisted || location.state?.activeTab || 'perfil';
    });
    const [googleAccountInfo, setGoogleAccountInfo] = useState(null);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    // Moneycall states (saved in localStorage for premium persistence)
    const [estructuraScore, setEstructuraScore] = useState(() => Number(localStorage.getItem('crm_estructura_score') || 85));
    const [sistemaScore, setSistemaScore] = useState(() => Number(localStorage.getItem('crm_sistema_score') || 75));
    const [operacionesScore, setOperacionesScore] = useState(() => Number(localStorage.getItem('crm_operaciones_score') || 90));

    // WhatsApp States & Logic
    const [wsStatus, setWsStatus] = useState('desconectado');
    const [qrCode, setQrCode] = useState(null);

    useEffect(() => {
        const storedUser = getUser();
        if (!storedUser) return;

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
            }
        };
        fetchStatus();

        // Unirse a la sala de Socket.io del usuario
        socket.emit('join_user', { userId: storedUser.id || storedUser._id, token: getToken() });

        const handleStatus = (data) => {
            console.log('WS: whatsapp status updated:', data);
            setWsStatus(data.status);
            if (data.status === 'conectado' || data.status === 'desconectado') {
                setQrCode(null);
            }
        };

        const handleQr = (qrDataUrl) => {
            console.log('WS: new whatsapp QR received');
            setWsStatus('generando_qr');
            setQrCode(qrDataUrl);
        };

        socket.on('whatsapp-status', handleStatus);
        socket.on('whatsapp-qr', handleQr);

        return () => {
            socket.emit('leave_user', storedUser.id || storedUser._id);
            socket.off('whatsapp-status', handleStatus);
            socket.off('whatsapp-qr', handleQr);
        };
    }, []);

    const connectWhatsApp = async () => {
        setWsStatus('generando_qr');
        setQrCode(null);
        try {
            const res = await fetch(`${API_URL}/api/whatsapp/connect`, {
                method: 'POST',
                headers: { 'x-auth-token': getToken() }
            });
            if (!res.ok) {
                toast.error('Error al iniciar la conexión de WhatsApp');
                setWsStatus('desconectado');
            }
        } catch (err) {
            toast.error('Error de conexión con el servidor');
            setWsStatus('desconectado');
        }
    };

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
                toast.success('Sesión de WhatsApp cerrada', { id: tid });
            } else {
                toast.error('Error al cerrar sesión', { id: tid });
            }
        } catch (err) {
            toast.error('Error de conexión', { id: tid });
        }
    };

    useEffect(() => {
        localStorage.setItem('crm_estructura_score', estructuraScore);
    }, [estructuraScore]);

    useEffect(() => {
        localStorage.setItem('crm_sistema_score', sistemaScore);
    }, [sistemaScore]);

    useEffect(() => {
        localStorage.setItem('crm_operaciones_score', operacionesScore);
    }, [operacionesScore]);

    const maxSalesCoef = (estructuraScore / 100) * (sistemaScore / 100) * (operacionesScore / 100) * 100;
    const minScore = Math.min(estructuraScore, sistemaScore, operacionesScore);
    let minScoreFactor = 'perfect';
    if (minScore < 100) {
        if (minScore === estructuraScore) minScoreFactor = 'estructura';
        else if (minScore === sistemaScore) minScoreFactor = 'sistema';
        else minScoreFactor = 'operaciones';
    }

    // Theme Global State
    const { currentThemeId, setTheme } = useThemeStore();

    useEffect(() => {
        const storedUser = getUser();
        if (storedUser) {
            setUser(storedUser);
            setProfileForm({ nombre: storedUser.nombre || '', email: storedUser.email || '', telefono: storedUser.telefono || '' });
        }
        const gLinked = localStorage.getItem('google_linked');
        if (gLinked === 'true') {
            setGoogleConnected(true);
            fetchGoogleInfo();
        } else {
            // Check session just in case
            fetchGoogleInfo();
        }
    }, []);

    const fetchGoogleInfo = async () => {
        setLoadingGoogle(true);
        try {
            const res = await fetch(`${API_URL}/api/google/account-info`, {
                headers: { 'x-auth-token': getToken() }
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.notLinked || data?.connected === false) {
                    setGoogleConnected(false);
                    localStorage.removeItem('google_linked');
                    setGoogleAccountInfo(null);
                } else {
                    setGoogleAccountInfo(data);
                    setGoogleConnected(true);
                    localStorage.setItem('google_linked', 'true');
                }
            } else if (res.status === 401 || res.status === 404) {
                setGoogleConnected(false);
                localStorage.removeItem('google_linked');
                setGoogleAccountInfo(null);
            }
        } catch (err) {
            console.error('Error fetching google info:', err);
        } finally {
            setLoadingGoogle(false);
        }
    };

    const loginGoogle = useGoogleLogin({
        flow: 'auth-code',
        scope: 'openid profile email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: false,
        onSuccess: async (codeResponse) => {
            console.log('📦 Google Code Response:', codeResponse);
            const tid = toast.loading('Vinculando cuenta de Google...');
            try {
                const res = await fetch(`${API_URL}/api/google/save-tokens`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': getToken() },
                    body: JSON.stringify({ code: codeResponse.code })
                });

                const data = await res.json();

                if (res.ok) {
                    setGoogleConnected(true);
                    localStorage.setItem('google_linked', 'true');
                    toast.success('¡Google vinculado correctamente!', { id: tid });
                    fetchGoogleInfo();
                } else {
                    console.error('❌ Error vinculando Google:', data);
                    const errorMsg = data.error || data.msg || 'Error desconocido';
                    toast.error(`Error: ${errorMsg}`, { id: tid, duration: 6000 });
                }
            } catch (err) {
                console.error('❌ Error de red vinculando Google:', err);
                toast.error('Error de red al conectar con el servidor', { id: tid });
            }
        },
        onError: () => toast.error('Error al conectar Google'),
    });

    const handleDisconnectGoogle = async () => {
        const tid = toast.loading('Desvinculando Google...');
        try {
            const res = await fetch(`${API_URL}/api/google/disconnect`, {
                method: 'POST',
                headers: { 'x-auth-token': getToken() }
            });
            if (res.ok) {
                localStorage.removeItem('google_linked');
                setGoogleConnected(false);
                setGoogleAccountInfo(null);
                toast.success('Cuenta Google desvinculada', { id: tid });
            } else {
                toast.error('Error al desvincular en el servidor', { id: tid });
            }
        } catch (err) {
            toast.error('Error de red', { id: tid });
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const userId = user?.id || user?._id;
        if (!userId) return toast.error('No se pudo identificar el usuario');
        setSavingProfile(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/usuarios/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ nombre: profileForm.nombre, email: profileForm.email, telefono: profileForm.telefono })
            });
            if (res.ok) {
                const updated = { ...user, ...profileForm };
                saveUser(updated, !!localStorage.getItem('user'));
                setUser(updated);
                toast.success('✅ Perfil actualizado');
            } else toast.error('Error al guardar');
        } catch { toast.error('Error de conexión'); }
        finally { setSavingProfile(false); }
    };

    const handleSavePass = async (e) => {
        e.preventDefault();
        if (passForm.next !== passForm.confirm) return toast.error('Las contraseñas no coinciden');
        if (passForm.next.length < 6) return toast.error('Mínimo 6 caracteres');
        const userId = user?.id || user?._id;
        if (!userId) return toast.error('No se pudo identificar el usuario');
        setSavingPass(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/usuarios/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ contraseña: passForm.next })
            });
            if (res.ok) { setPassForm({ next: '', confirm: '' }); toast.success('🔒 Contraseña actualizada'); }
            else toast.error('Error al actualizar');
        } catch { toast.error('Error de conexión'); }
        finally { setSavingPass(false); }
    };

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/');
    };

    const roleBg = 'from-(--theme-500) to-(--theme-600)';

    const inp = "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-(--theme-500)/30 focus:border-(--theme-500) outline-none transition-all text-sm shadow-sm";

    const tabs = [
        { id: 'perfil', label: t('Perfil'), icon: User },
        { id: 'seguridad', label: t('Seguridad'), icon: KeyRound },
        { id: 'integraciones', label: t('Google'), icon: Link2 },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        { id: 'colores', label: t('Colores del Sistema'), icon: Palette },
        { id: 'formula', label: t('Fórmula de Ventas'), icon: Award },
        { id: 'notificaciones', label: t('Notificaciones'), icon: Bell },
        { id: 'idioma', label: t('Idioma / Language'), icon: Globe },
    ];

    return (
        <div className="min-h-screen md:h-full md:min-h-0 bg-white md:bg-(--theme-50)/20 -m-4 md:m-0 md:overflow-hidden">
            <div className="md:h-full md:min-h-0">
                <div className="max-w-(--breakpoint-2xl) mx-auto md:px-10 py-6 md:py-4 pb-16 md:pb-0 md:h-full md:min-h-0 md:flex md:flex-col md:overflow-hidden">

                    {/* ═══ HERO HEADER ═══ */}
                    <div className="relative md:rounded-3xl overflow-hidden mb-6 md:mb-8 md:shadow-xl border-b md:border border-(--theme-200)/50">
                        {/* Gradient Banner */}
                        <div className={`h-32 sm:h-40 bg-linear-to-br ${roleBg} relative`} />

                        {/* Content below banner */}
                        <div className="bg-white px-5 sm:px-8 pb-5">
                            {/* Avatar overlapping banner */}
                            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-8 sm:-mt-10">
                                <div className="relative w-fit">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-white flex items-center justify-center">
                                        <div className={`w-full h-full rounded-2xl bg-linear-to-br ${roleBg} flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-sm`}>
                                            {String(user?.nombre || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    {googleConnected && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                            <CheckCircle2 className="text-green-500" size={16} fill="currentColor" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 pb-0">
                                    <h1 className="text-xl sm:text-2xl font-black text-(--theme-900) leading-tight">{user?.nombre || t('Usuario')}</h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <span className="text-(--theme-500) text-sm font-medium">@{user?.usuario || 'usuario'}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-linear-to-r ${roleBg}`}>
                                            {t(user?.rol) || t('Rol')}
                                        </span>
                                        {googleConnected && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-(--theme-50) text-(--theme-600) border border-(--theme-200)">
                                                <GoogleIcon size={11} /> {t('Vinculado')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="self-start sm:self-end flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-all mt-3 md:mt-0"
                                >
                                    <LogOut size={15} />
                                    <span>{t('Salir')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ═══ GRID CONTENT ═══ */}
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 md:gap-8 items-start lg:items-stretch md:flex-1 md:min-h-0">

                        {/* ═══ TABS SIDEBAR (Hybrid) ═══ */}
                        <div className="z-10 px-3 md:px-0 lg:flex lg:flex-col">
                            <div className="flex lg:flex-col gap-2 bg-white/80 backdrop-blur-md p-1.5 lg:p-2 md:rounded-2xl lg:shadow-sm md:border border-(--theme-200) border-b overflow-x-auto no-scrollbar lg:overflow-visible lg:min-h-[250px]">
                                {tabs.map(({ id, label, icon: Icon }) => {
                                    const isActive = activeTab === id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => {
                                                setActiveTab(id);
                                                localStorage.setItem('crm_active_settings_tab', id);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 lg:flex-none
                                                ${isActive
                                                    ? `bg-linear-to-r ${roleBg} text-white shadow-lg shadow-(--theme-500)/20`
                                                    : 'text-(--theme-500) hover:text-(--theme-700) hover:bg-(--theme-50)'}`}
                                        >
                                            <Icon size={18} className={isActive ? 'text-white' : 'text-(--theme-400)'} />
                                            <span>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Info Card desktop only */}
                            <div className="hidden lg:flex mt-6 p-5 bg-linear-to-br from-(--theme-50) to-white rounded-3xl border border-(--theme-200) shadow-sm overflow-hidden relative group flex-col">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${roleBg} opacity-5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-700`} />
                                <h3 className="text-xs font-black text-(--theme-400) uppercase tracking-widest mb-2">{t('Estado de Cuenta')}</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-(--theme-600)">{t('Plan')}</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white bg-linear-to-r ${roleBg}`}>PREMIUM</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-(--theme-600)">{t('Sesión')}</span>
                                        <span className="text-xs font-medium text-(--theme-500)">{t('Activa')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ MAIN CONTENT ═══ */}
                        <div className="space-y-6">

                            {/* ═══ TAB: PERFIL ═══ */}
                            {activeTab === 'perfil' && (
                                <form onSubmit={handleSaveProfile}>
                                    <div className="bg-white md:rounded-3xl md:shadow-xl border-b md:border border-(--theme-200) overflow-y-auto max-h-[70vh] md:max-h-[58vh] lg:max-h-[62vh] xl:max-h-[66vh] min-h-[400px]">
                                        <div className="" />
                                        <div className="p-6 sm:p-8 h-full flex flex-col">
                                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2.5">
                                                <div className={`p-2 rounded-xl bg-linear-to-br ${roleBg}`}>
                                                    <User className="text-white" size={16} />
                                                </div>
                                                {t('Información Personal')}
                                            </h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1 content-start">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('Nombre Completo')}</label>
                                                    <div className="relative">
                                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                                        <input type="text" value={profileForm.nombre}
                                                            onChange={e => setProfileForm(p => ({ ...p, nombre: e.target.value }))}
                                                            className={`${inp} pl-10`} placeholder={t('Tu nombre completo')} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('Email')}</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                                        <input type="email" value={profileForm.email}
                                                            onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                                                            className={`${inp} pl-10`} placeholder="correo@ejemplo.com" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('Teléfono')}</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                                        <input type="tel" value={profileForm.telefono}
                                                            onChange={e => setProfileForm(p => ({ ...p, telefono: e.target.value }))}
                                                            className={`${inp} pl-10`} placeholder="+52 000 000 0000" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-8 flex justify-end">
                                                <button type="submit" disabled={savingProfile}
                                                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold text-sm shadow-lg bg-linear-to-r ${roleBg} hover:opacity-90 active:scale-95 transition-all disabled:opacity-50`}>
                                                    <Save size={16} />
                                                    {savingProfile ? t('Guardando...') : t('Guardar Cambios')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* ═══ TAB: SEGURIDAD ═══ */}
                            {activeTab === 'seguridad' && (
                                <form onSubmit={handleSavePass}>
                                    <div className="bg-white md:rounded-3xl md:shadow-xl border-b md:border border-(--theme-200) overflow-y-auto max-h-[70vh] md:max-h-[58vh] lg:max-h-[62vh] xl:max-h-[66vh] min-h-[400px]">
                                        <div className="" />
                                        <div className="p-6 sm:p-8 h-full flex flex-col">
                                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2.5">
                                                <div className={`p-2 rounded-xl bg-linear-to-br ${roleBg}`}>
                                                    <Shield className="text-white" size={16} />
                                                </div>
                                                {t('Cambiar Contraseña')}
                                            </h2>
                                            <div className="w-full space-y-5 flex-1">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('Nueva Contraseña')}</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                                        <input type="password" value={passForm.next}
                                                            onChange={e => setPassForm(p => ({ ...p, next: e.target.value }))}
                                                            className={`${inp} pl-10`} placeholder="Mínimo 6 caracteres" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('Confirmar Contraseña')}</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                                        <input type="password" value={passForm.confirm}
                                                            onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))}
                                                            className={`${inp} pl-10 ${passForm.confirm && passForm.confirm !== passForm.next ? 'border-red-400 ring-2 ring-red-400/20' : ''}`}
                                                            placeholder={t('Repite la contraseña')} />
                                                    </div>
                                                    {passForm.confirm && passForm.confirm !== passForm.next && (
                                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                            <AlertCircle size={12} /> {t('Las contraseñas no coinciden')}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Password strength indicator */}
                                                {passForm.next && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1.5">{t('Fortaleza')}</p>
                                                        <div className="flex gap-1">
                                                            {[6, 10, 14].map((len, i) => (
                                                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${passForm.next.length >= len ? ['bg-red-400', 'bg-yellow-400', 'bg-green-500'][i] : 'bg-slate-100'}`} />
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {passForm.next.length < 6 ? t('Muy corta') : passForm.next.length < 10 ? t('Débil') : passForm.next.length < 14 ? t('Buena') : t('Excelente')}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="mt-auto pt-8">
                                                    <button type="submit" disabled={savingPass}
                                                        className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold text-sm shadow-lg bg-linear-to-r ${roleBg} hover:opacity-90 active:scale-95 transition-all disabled:opacity-50`}>
                                                        <KeyRound size={16} />
                                                        {savingPass ? t('Actualizando...') : t('Actualizar Contraseña')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'integraciones' && (
                                <div className="bg-white md:rounded-3xl md:shadow-xl border-b md:border border-(--theme-200) overflow-y-auto max-h-[70vh] md:max-h-[58vh] lg:max-h-[62vh] xl:max-h-[66vh] min-h-[400px]">
                                    <div className="p-4 sm:p-6 h-full flex flex-col">
                                        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                                                <GoogleIcon size={14} />
                                            </div>
                                            {t('Cuenta Google')}
                                        </h2>

                                        {googleConnected ? (
                                            <div className="space-y-4 w-full flex-1 flex flex-col">
                                                <div className="relative p-4 bg-linear-to-br from-(--theme-50) to-white border border-(--theme-100) rounded-2xl overflow-hidden shadow-xs">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-(--theme-200)/20 rounded-full -translate-y-8 translate-x-8" />

                                                    <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                                                        {googleAccountInfo?.picture ? (
                                                            <img src={googleAccountInfo.picture} alt="Google Profile" className="w-14 h-14 rounded-xl shadow-md ring-2 ring-white" />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-md ring-2 ring-white">
                                                                <GoogleIcon size={24} />
                                                            </div>
                                                        )}

                                                        <div className="flex-1 text-center sm:text-left">
                                                            <h3 className="text-base font-black text-(--theme-900) leading-tight">{googleAccountInfo?.name || 'Vínculo Activo'}</h3>
                                                            <p className="text-(--theme-700) text-xs font-medium flex items-center justify-center sm:justify-start gap-1">
                                                                <Mail size={12} />
                                                                {googleAccountInfo?.email || 'Cargando información...'}
                                                            </p>
                                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                                                                <span className="px-1.5 py-0.5 rounded-md bg-white/60 text-[9px] font-bold text-(--theme-700) uppercase tracking-wider backdrop-blur-sm border border-(--theme-200)">
                                                                    Calendar
                                                                </span>
                                                                <span className="px-1.5 py-0.5 rounded-md bg-(--theme-100)/80 text-[9px] font-bold text-(--theme-700) uppercase tracking-wider border border-(--theme-200)">
                                                                    ONLINE
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-xs border border-(--theme-200)">
                                                            <CheckCircle2 className="text-(--theme-500)" size={18} fill="currentColor" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="p-4 bg-(--theme-50)/50 border border-(--theme-100) rounded-xl">
                                                        <h4 className="text-[10px] font-black text-(--theme-400) uppercase tracking-widest mb-2 flex items-center gap-2">
                                                            <Shield size={12} /> {t('Permisos')}
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {['Calendario', 'Eventos', 'Perfil'].map((p, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-(--theme-600)">
                                                                    <div className="w-1 h-1 rounded-full bg-(--theme-500)" />
                                                                    {t(p)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-(--theme-50)/50 border border-(--theme-100) rounded-xl">
                                                        <h4 className="text-[10px] font-black text-(--theme-400) uppercase tracking-widest mb-2 flex items-center gap-2">
                                                            <Monitor size={12} /> {t('Estado')}
                                                        </h4>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-[11px] font-semibold">
                                                                <span className="text-(--theme-500)">{t('Sesión')}:</span>
                                                                <span className="text-(--theme-600) uppercase">{t('Activa')}</span>
                                                            </div>
                                                            <div className="flex justify-between text-[11px] font-semibold">
                                                                <span className="text-(--theme-500)">ID:</span>
                                                                <span className="text-(--theme-400) font-mono italic">{googleAccountInfo?.id?.slice(0, 6)}...</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] text-amber-700 font-medium">
                                                    <AlertCircle size={16} className="shrink-0" />
                                                    <span>{t('Para cambiar de cuenta, desvincula la actual primero. Esto detendrá la sincronización.')}</span>
                                                </div>

                                                <button onClick={handleDisconnectGoogle}
                                                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-6 bg-white border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all text-xs shadow-xs mt-auto">
                                                    <Link2Off size={14} />
                                                    {t('Desvincular Google')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full text-center py-8 px-5 bg-(--theme-50)/40 rounded-2xl border border-dashed border-(--theme-300) flex-1">
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center relative">
                                                    <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-red-50 rounded-full animate-pulse opacity-50" />
                                                    <GoogleIcon size={32} />
                                                </div>
                                                <h3 className="font-black text-slate-800 text-lg mb-1">{t('Conecta con Google')}</h3>
                                                <p className="text-slate-500 text-xs mb-5 leading-snug">
                                                    {t('Sincroniza agenda y tareas para gestionar tu tiempo desde el CRM.')}
                                                </p>
                                                <button onClick={() => loginGoogle()}
                                                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-xl hover:border-(--theme-400) hover:shadow-xl hover:shadow-(--theme-500)/10 active:scale-95 transition-all text-xs group">
                                                    <div className="group-hover:rotate-12 transition-transform">
                                                        <GoogleIcon size={18} />
                                                    </div>
                                                    {t('Vincular ahora')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'colores' && (
                                <section className="bg-white md:rounded-3xl md:shadow-xl border-b md:border border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-[58vh] lg:max-h-[62vh] xl:max-h-[66vh] min-h-[400px]">
                                    <div className="p-4 sm:p-6 bg-(--theme-50)/30 shadow-inner h-full flex flex-col">
                                        <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                                            <div className="p-2 rounded-xl bg-(--theme-100) text-(--theme-600)">
                                                <Palette size={15} />
                                            </div>
                                            {t('Colores del Sistema')}
                                        </h2>
                                        <p className="text-sm text-slate-500 mb-6 font-medium">
                                            {t('Personaliza el color de acento principal del CRM en tu dispositivo.')}
                                        </p>

                                        <div className="flex flex-wrap gap-4">
                                            {THEMES.map((theme) => {
                                                const isActive = currentThemeId === theme.id;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={theme.id}
                                                        onClick={() => setTheme(theme.id)}
                                                        className={`group relative flex items-center gap-3 p-3 pr-5 rounded-2xl border-2 transition-all ${isActive ? 'bg-white border-(--theme-300) shadow-sm' : 'border-transparent hover:bg-white/50'}`}
                                                    >
                                                        {theme.swatch === 'gradient' ? (
                                                            <div
                                                                className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-transform ${isActive ? 'scale-110 ring-2 ring-offset-2 ring-cyan-300' : 'group-hover:scale-110'}`}
                                                                style={{ backgroundImage: theme.swatchGradient || 'linear-gradient(135deg, #34d399 0%, #22d3ee 50%, #4f46e5 100%)' }}
                                                            >
                                                                {isActive && <CheckCircle2 size={16} className="text-white" />}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-transform ${isActive ? 'scale-110 ring-2 ring-offset-2' : 'group-hover:scale-110'}`}
                                                                style={{ backgroundColor: theme.color, ringColor: theme.color }}
                                                            >
                                                                {isActive && <CheckCircle2 size={16} className="text-white" />}
                                                            </div>
                                                        )}
                                                        <span className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                                                            {t(theme.label)}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'formula' && (
                                <section className="bg-white md:rounded-3xl md:shadow-xl border-b md:border border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-[58vh] lg:max-h-[62vh] xl:max-h-[66vh] min-h-[400px]">
                                    <div className="p-6 sm:p-8 h-full flex flex-col justify-between">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2 rounded-xl bg-linear-to-br ${roleBg} text-white shadow-sm`}>
                                                        <Award size={15} />
                                                    </div>
                                                    <div>
                                                        <span className="font-black">{t('Fórmula de Ventas Máximas')}</span>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{t('Estructura × Sistema × Operaciones')}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-indigo-600 text-white rounded-xl px-4 py-1 text-center shadow-md">
                                                    <div className="text-sm font-black">{maxSalesCoef.toFixed(1)}%</div>
                                                    <div className="text-[6px] font-bold uppercase tracking-widest leading-none">{t('Efectividad')}</div>
                                                </div>
                                            </h2>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                                                <div className="lg:col-span-2 space-y-6 flex flex-col justify-around">
                                                    {/* Factor 1: Estructura */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-black text-gray-700 uppercase tracking-wider">{t('1. Estructura (Gente/Vendedores):')} {estructuraScore}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="10"
                                                            max="100"
                                                            value={estructuraScore}
                                                            onChange={(e) => setEstructuraScore(Number(e.target.value))}
                                                            className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <p className="text-[9.5px] text-gray-400 font-bold uppercase leading-tight">
                                                            {t('Capacitación del equipo, cobertura del territorio y dominio del guión S1.')}
                                                        </p>
                                                    </div>

                                                    {/* Factor 2: Sistema */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-black text-gray-700 uppercase tracking-wider">{t('2. Sistema (Proceso/CRM):')} {sistemaScore}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="10"
                                                            max="100"
                                                            value={sistemaScore}
                                                            onChange={(e) => setSistemaScore(Number(e.target.value))}
                                                            className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <p className="text-[9.5px] text-gray-400 font-bold uppercase leading-tight">
                                                            {t('Disciplina de llamadas de recuperación S1 y venta cruzada S2.')}
                                                        </p>
                                                    </div>

                                                    {/* Factor 3: Operaciones */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-black text-gray-700 uppercase tracking-wider">{t('3. Operaciones (Cumplimiento/OTD):')} {operacionesScore}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="10"
                                                            max="100"
                                                            value={operacionesScore}
                                                            onChange={(e) => setOperacionesScore(Number(e.target.value))}
                                                            className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <p className="text-[9.5px] text-gray-400 font-bold uppercase leading-tight">
                                                            {t('Calidad de entrega, servicio al cliente y cumplimiento del OTD (On-Time Delivery).')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between">
                                                    <div>
                                                        <h4 className="text-[9.5px] font-black uppercase tracking-widest text-indigo-700 mb-3 border-b border-indigo-100 pb-1">{t('Evaluación de Ventas Coeficiente')}</h4>
                                                        <p className="text-[11px] text-gray-600 font-semibold leading-relaxed">
                                                            {minScoreFactor === 'estructura' && t('⚠️ Alerta de Estructura: Tu equipo de ventas necesita capacitación inmediata en la metodología Moneycall. Asegúrate de que dominen el guión de apertura S1 y que la cobertura de clientes sea completa.')}
                                                            {minScoreFactor === 'sistema' && t('⚠️ Falta de Disciplina en Proceso: Tu mayor debilidad es la falta de uso riguroso del CRM. Asegúrate de registrar todas las llamadas de recuperación S1 y venta cruzada S2 en el CRM.')}
                                                            {minScoreFactor === 'operaciones' && t('⚠️ Peligro Operativo: De nada sirve un excelente equipo y un gran proceso de venta si la entrega o la calidad fallan. Los problemas operativos (OTD bajo) están ahogando tus ventas recurrentes.')}
                                                            {minScoreFactor === 'perfect' && t('🔥 ¡Felicidades! Tienes una base de ventas sólida. Mantén el ritmo de 30 llamadas diarias para maximizar tus ingresos.')}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center gap-1.5">
                                                        <span className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block shrink-0">{t('Fórmula:')}</span>
                                                        <code className="text-[10px] font-bold text-indigo-600 bg-white border border-gray-100 rounded px-2 py-1 truncate">
                                                            {estructuraScore}% × {sistemaScore}% × {operacionesScore}% = {maxSalesCoef.toFixed(1)}%
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'notificaciones' && (
                                <section className="bg-white md:rounded-3xl md:shadow-xl border-b md:border border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-[58vh] lg:max-h-[62vh] xl:max-h-[66vh] min-h-[400px]">
                                    <div className="p-8 sm:p-12 h-full flex flex-col items-center justify-center text-center">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-(--theme-500)/20 blur-3xl rounded-full" />
                                            <div className="relative w-20 h-20 rounded-3xl bg-linear-to-br from-(--theme-500) to-(--theme-600) flex items-center justify-center shadow-2xl shadow-(--theme-500)/30 rotate-12">
                                                <Bell className="text-white animate-bounce" size={40} />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center shadow-md">
                                                <AlertCircle className="text-amber-600" size={16} />
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-black text-slate-800 mb-2">{t('Próximamente')}</h2>
                                        <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-medium">
                                            {t('Estamos trabajando en un sistema de notificaciones inteligente para que no te pierdas nada.')}
                                            <span className="block mt-2 text-(--theme-600) font-bold">{t('¡Disponible muy pronto!')}</span>
                                        </p>

                                        <div className="mt-8 flex gap-2">
                                            <div className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
                                                V2.1 Beta
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-(--theme-50) text-[10px] font-black text-(--theme-600) uppercase tracking-widest border border-(--theme-100)">
                                                {t('En Desarrollo')}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'idioma' && (
                                <section className="bg-white md:rounded-3xl md:shadow-xl border-b md:border border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-[58vh] lg:max-h-[62vh] xl:max-h-[66vh] min-h-[400px]">
                                    <div className="p-6 sm:p-8 h-full flex flex-col justify-between">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                                <div className={`p-2 rounded-xl bg-linear-to-br ${roleBg} text-white shadow-sm`}>
                                                    <Globe size={15} />
                                                </div>
                                                <span className="font-black">{t('Idioma del Sistema')}</span>
                                            </h2>
                                            
                                            <p className="text-sm text-slate-500 mb-6 font-medium">
                                                {t('Selecciona el idioma principal de la aplicación')}:
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setLanguage('es')}
                                                    className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                                                        language === 'es'
                                                            ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                                                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                            {t('Español')}
                                                        </h3>
                                                        <p className="text-xs text-gray-400 font-semibold mt-0.5">Spanish</p>
                                                    </div>
                                                    {language === 'es' && (
                                                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm animate-in zoom-in-50">
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => setLanguage('en')}
                                                    className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                                                        language === 'en'
                                                            ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                                                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                            {t('Inglés')}
                                                        </h3>
                                                        <p className="text-xs text-gray-400 font-semibold mt-0.5">English</p>
                                                    </div>
                                                    {language === 'en' && (
                                                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm animate-in zoom-in-50">
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'whatsapp' && (
                                <section className="bg-white md:rounded-3xl md:shadow-xl border-b md:border border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-[58vh] lg:max-h-[62vh] xl:max-h-[66vh] min-h-[400px]">
                                    <style>{`
                                        @keyframes scan {
                                            0% { top: 0%; }
                                            50% { top: 100%; }
                                            100% { top: 0%; }
                                        }
                                        @keyframes pulse-ring {
                                            0% { transform: scale(0.95); opacity: 0.5; }
                                            50% { transform: scale(1.1); opacity: 0.8; }
                                            100% { transform: scale(0.95); opacity: 0.5; }
                                        }
                                    `}</style>
                                    
                                    <div className="p-6 sm:p-8">
                                        <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                            <div className="p-2 rounded-xl bg-linear-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/20">
                                                <MessageSquare size={16} />
                                            </div>
                                            <span className="font-black">Enlazar WhatsApp</span>
                                        </h2>

                                        {wsStatus === 'conectado' ? (
                                            <div className="max-w-xl mx-auto bg-green-50/40 border border-green-100 rounded-3xl p-6 sm:p-8 text-center shadow-xs">
                                                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-green-500/20 rounded-full" style={{ animation: 'pulse-ring 2s infinite' }} />
                                                    <div className="relative w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                                        <MessageSquare size={32} />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                                        <CheckCircle2 className="text-green-500" size={16} fill="currentColor" />
                                                    </div>
                                                </div>
                                                
                                                <h3 className="text-xl font-black text-green-900 leading-tight">¡WhatsApp Vinculado!</h3>
                                                <p className="text-xs text-green-600 font-bold mt-1 uppercase tracking-wider">Línea activa en el CRM</p>
                                                
                                                <div className="my-6 p-4 bg-white/80 border border-green-100 rounded-2xl text-left space-y-2.5 text-xs text-slate-600">
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-slate-400">Canal de Envío:</span>
                                                        <span className="font-black text-slate-800">API Baileys Embebido</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-slate-400">Estado de Conexión:</span>
                                                        <span className="font-black text-green-600 flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> En Línea
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-slate-400">Multicuenta:</span>
                                                        <span className="font-black text-slate-800">Vinculado a tu ID de Vendedor</span>
                                                    </div>
                                                </div>

                                                <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                                                    Los mensajes enviados desde el CRM saldrán desde tu número telefónico. Las respuestas de tus clientes se registrarán automáticamente.
                                                </p>
                                                
                                                <button
                                                    type="button"
                                                    onClick={disconnectWhatsApp}
                                                    className="mt-8 px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 uppercase tracking-widest"
                                                >
                                                    Desconectar WhatsApp
                                                </button>
                                            </div>
                                        ) : wsStatus === 'generando_qr' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-center bg-slate-50/50 border border-slate-100 rounded-3xl p-6 sm:p-8">
                                                {/* Left Column: Instructions */}
                                                <div className="space-y-5">
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-800 leading-tight">Vincular dispositivo</h3>
                                                        <p className="text-xs text-slate-400 mt-1">Sigue los pasos en tu teléfono móvil para establecer la conexión:</p>
                                                    </div>

                                                    <ul className="space-y-3.5 text-xs text-slate-600 font-medium">
                                                        <li className="flex items-start gap-3">
                                                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black shrink-0 text-[10px]">1</span>
                                                            <p className="mt-0.5">Abre **WhatsApp** en tu teléfono móvil.</p>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black shrink-0 text-[10px]">2</span>
                                                            <p className="mt-0.5">Toca el botón de **Menú (⋮)** en Android o **Configuración (⚙️)** en iPhone.</p>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black shrink-0 text-[10px]">3</span>
                                                            <p className="mt-0.5">Selecciona **Dispositivos vinculados** y presiona **Vincular un dispositivo**.</p>
                                                        </li>
                                                        <li className="flex items-start gap-3">
                                                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black shrink-0 text-[10px]">4</span>
                                                            <p className="mt-0.5">Apunta la cámara de tu teléfono móvil hacia la pantalla para escanear el código QR.</p>
                                                        </li>
                                                    </ul>

                                                    <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center gap-1.5 font-semibold">
                                                        <span>🔒 Conexión cifrada de extremo a extremo</span>
                                                    </div>
                                                </div>

                                                {/* Right Column: QR Container */}
                                                <div className="flex flex-col items-center justify-center text-center space-y-4 shrink-0">
                                                    <div className="relative p-3 bg-white border border-slate-200 rounded-3xl shadow-md group overflow-hidden">
                                                        {qrCode ? (
                                                            <div className="relative w-48 h-48 sm:w-52 sm:h-52">
                                                                {/* Scanning Laser Line */}
                                                                <div className="absolute left-0 w-full h-0.5 bg-green-500 shadow-[0_0_6px_#22c55e] z-20" style={{ animation: 'scan 2.5s linear infinite' }} />
                                                                <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full relative z-10" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center text-slate-400">
                                                                <div className="w-8 h-8 border-3 border-slate-100 border-t-green-500 rounded-full animate-spin mb-3" />
                                                                <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Generando QR...</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={disconnectWhatsApp}
                                                        className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 font-bold text-[10px] rounded-xl transition-all uppercase tracking-wider"
                                                    >
                                                        Cancelar Conexión
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xs">
                                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                                                    <MessageSquare size={32} />
                                                </div>
                                                
                                                <h3 className="text-lg font-black text-slate-800">Conecta tu cuenta de WhatsApp</h3>
                                                <p className="text-slate-500 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                                                    Vincula tu línea de WhatsApp personal o business para enviar alertas automáticas y mantener conversaciones fluidas en tiempo real con tus prospectos directamente desde la app.
                                                </p>

                                                <div className="my-6 grid grid-cols-3 gap-3 text-left">
                                                    <div className="p-3 bg-white border border-slate-100 rounded-2xl">
                                                        <div className="text-green-500 font-bold text-xs mb-1">🚀 Cero Costo</div>
                                                        <p className="text-[10px] text-slate-400 leading-tight">Usa tu línea celular sin pagar costos por mensaje.</p>
                                                    </div>
                                                    <div className="p-3 bg-white border border-slate-100 rounded-2xl">
                                                        <div className="text-green-500 font-bold text-xs mb-1">📂 Historial</div>
                                                        <p className="text-[10px] text-slate-400 leading-tight">Conserva todo el historial de chats en la ficha del cliente.</p>
                                                    </div>
                                                    <div className="p-3 bg-white border border-slate-100 rounded-2xl">
                                                        <div className="text-green-500 font-bold text-xs mb-1">💬 Multicuenta</div>
                                                        <p className="text-[10px] text-slate-400 leading-tight">Cada vendedor vincula su propia línea personal.</p>
                                                    </div>
                                                </div>
                                                
                                                <button
                                                    type="button"
                                                    onClick={connectWhatsApp}
                                                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-black text-xs rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 uppercase tracking-widest"
                                                >
                                                    Vincular WhatsApp
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
