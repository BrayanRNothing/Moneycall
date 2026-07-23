import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnimatedGridBackground from '../components/ui/AnimatedGridBackground';
import FloatingSidebar from '../components/ui/FloatingSidebar';
import { getUser, saveUser, getToken, logout } from '../utils/authUtils';
import API_URL from '../config/api';
import logocrmoneycall from '../assets/logocrmoneycall.png';
import useWindowSize from '../hooks/useWindowSize';
import MainLayoutMobile from './MainLayoutMobile';
import MoneycallBot from '../components/BotAssistant/MoneycallBot';
import socket from '../config/socket';
import { MdDashboard, MdShowChart, MdPersonAdd, MdEvent, MdGroups, MdWork, MdMessage, MdBook, MdGroup, MdSettings, MdSecurity } from 'react-icons/md';
import toast from 'react-hot-toast';
import Avatar from '../components/ui/Avatar';


const MainLayout = () => {
    const { width } = useWindowSize();
    const location = useLocation();
    const [usuario, setUsuario] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


    React.useEffect(() => {
        const userGuardado = getUser();
        if (!userGuardado) {
            logout(); // Limpia cualquier dato residual
            window.location.href = '/'; // Force redirect if no session
            return;
        }
        if (userGuardado.rol && userGuardado.rol !== 'vendedor' && userGuardado.rol !== 'admin' && userGuardado.rol !== 'asignador') {
            logout(); // Limpia storage antes de redirigir para evitar bucle
            window.location.href = '/';
            return;
        }
        setUsuario(userGuardado);

        // Fetch fresh user data to ensure we have latest properties like esOwner
        const token = getToken();
        if (token) {
            fetch(`${API_URL}/api/auth/me`, {
                headers: { 'x-auth-token': token }
            })
                .then(res => {
                    // Si el token expiró o es inválido, limpiar sesión y redirigir
                    if (res.status === 401 || res.status === 403) {
                        logout();
                        window.location.href = '/?expired=1&msg=Tu+sesión+ha+expirado.+Por+favor+inicia+sesión+de+nuevo.';
                        return Promise.reject('unauthorized');
                    }
                    if (!res.ok) return Promise.reject('server_error');
                    return res.json();
                })
                .then(freshUser => {
                    if (freshUser && freshUser.id) {
                        setUsuario(freshUser);
                        saveUser(freshUser, !!localStorage.getItem('user'));
                    }
                })
                .catch(err => {
                    if (err !== 'unauthorized') {
                        console.error('Failed to refresh user data:', err);
                    }
                });
        }
    }, []);

    React.useEffect(() => {
        if (!usuario) return;

        const handleNewMessage = (data) => {
            // Solo mostrar notificación si no estamos en la página de chats
            if (window.location.pathname !== '/vendedor/chats') {
                const nombreCompleto = `${data.nombres || ''} ${data.apellidoPaterno || ''}`.trim() || 'Prospecto';
                toast((t) => (
                    <div className="flex flex-col gap-1 cursor-pointer text-left" onClick={() => {
                        toast.dismiss(t.id);
                        window.location.href = '/vendedor/chats';
                    }}>
                        <span className="font-black text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                            Nuevo WhatsApp de {nombreCompleto}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            "{data.text}"
                        </span>
                    </div>
                ), {
                    duration: 6000,
                    style: {
                        borderRadius: '20px',
                        background: '#ffffff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(241, 245, 249, 0.8)',
                        padding: '14px 18px',
                        maxWidth: '350px'
                    }
                });
            }
        };

        socket.on('new-whatsapp-message', handleNewMessage);

        return () => {
            socket.off('new-whatsapp-message', handleNewMessage);
        };
    }, [usuario]);

    const isAdminRoot = usuario?.rol === 'admin';

    const getRoleLabel = () => {
        if (!usuario?.rol) return 'Usuario';
        if (usuario.rol === 'admin') return 'Admin Root';
        return 'Vendedor';
    };

    const panelAdminItem = {
        name: 'Panel Admin',
        path: '/vendedor/admin',
        icon: <MdSecurity className="w-6 h-6" />
    };

    const vendedorMainItems = [
        {
            name: 'Dashboard',
            path: '/vendedor',
            icon: <MdDashboard className="w-6 h-6" />
        },
        ...(isAdminRoot || usuario?.esOwner ? [{
            name: 'Monitoreo',
            path: '/vendedor/monitoreo',
            icon: <MdShowChart className="w-6 h-6" />
        }] : []),
        ...(usuario?.rol === 'admin' || usuario?.rol === 'asignador' ? [{
            name: 'Asignar',
            path: '/vendedor/asignar',
            icon: <MdPersonAdd className="w-6 h-6" />
        }] : []),
        {
            name: 'Calendario',
            path: '/vendedor/calendario',
            icon: <MdEvent className="w-6 h-6" />
        },
        {
            name: 'Prospectos',
            path: '/vendedor/prospectos',
            icon: <MdGroups className="w-6 h-6" />
        },
        {
            name: 'Clientes',
            path: '/vendedor/clientes',
            icon: <MdWork className="w-6 h-6" />
        },
        {
            name: 'Chats',
            path: '/vendedor/chats',
            icon: <MdMessage className="w-6 h-6" />
        },
        {
            name: 'Manual',
            path: '/vendedor/manual',
            icon: <MdBook className="w-6 h-6" />
        }
    ];

    const menuItems = [
        ...(isAdminRoot ? [panelAdminItem, { name: '__admin-separator__', isSpacer: true }] : []),
        ...vendedorMainItems,
        ...(isAdminRoot || usuario?.esOwner ? [{
            name: 'Equipo',
            path: '/vendedor/equipo',
            isBottom: true,
            icon: <MdGroup className="w-6 h-6" />
        }] : []),
        {
            name: 'Ajustes',
            path: '/vendedor/ajustes',
            isBottom: true,
            icon: <MdSettings className="w-6 h-6" />
        },
    ];

    if (width < 1024) {
        return (
            <>
                <MainLayoutMobile
                    menuItems={menuItems}
                    userInfo={{ ...usuario, rol: getRoleLabel() }}
                />
                <MoneycallBot />
            </>
        );
    }

    const isAjustesRoute = location.pathname === '/vendedor/ajustes';
    const isDashboard = location.pathname === '/vendedor';
    const isMonitoreo = location.pathname === '/vendedor/monitoreo';

    return (
        <AnimatedGridBackground mode="light">
            <div className="h-screen flex p-4 gap-4">

                {/* Floating Sidebar (Light Mode) */}
                <FloatingSidebar
                    menuItems={menuItems}
                    userInfo={{ ...usuario, rol: getRoleLabel() }}
                    title="crmoneycall"
                    subtitle="Sales Full"
                    logo={<Avatar name={usuario?.nombre || 'Usuario'} size="md" />}
                    onCollapseChange={setSidebarCollapsed}
                    mode="light"
                />

                {/* Contenido flotante - Estilo Contenedor Blanco */}
                <main
                    className="flex-1 bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden transition-all duration-300 relative premium-reflejo"
                >

                    <div className={`h-full scrollbar-hide ${isAjustesRoute || isMonitoreo || isDashboard ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                        <Outlet />
                    </div>
                </main>
            </div>
            <MoneycallBot />
        </AnimatedGridBackground>
    );
};

export default MainLayout;
