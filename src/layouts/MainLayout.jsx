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

    const isAdminRoot = usuario?.rol === 'admin';

    const getRoleLabel = () => {
        if (!usuario?.rol) return 'Usuario';
        if (usuario.rol === 'admin') return 'Admin Root';
        return 'Vendedor';
    };

    const panelAdminItem = {
        name: 'Panel Admin',
        path: '/vendedor/admin',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 01.707.293l6 6A1 1 0 0117 9v6a3 3 0 01-3 3H6a3 3 0 01-3-3V9a1 1 0 01.293-.707l6-6A1 1 0 0110 2zm0 3.414L5 10.414V15a1 1 0 001 1h8a1 1 0 001-1v-4.586L10 5.414z" clipRule="evenodd" />
            </svg>
        )
    };

    const vendedorMainItems = [
        {
            name: 'Dashboard',
            path: '/vendedor',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
            )
        },
        ...(isAdminRoot || usuario?.esOwner ? [{
            name: 'Monitoreo',
            path: '/vendedor/monitoreo',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /><path d="M4 5.49A10 10 0 0 0 5.6 20.3" /><path d="M8.5 8.5A5 5 0 0 1 15.5 8.5" /><path d="M15.5 15.5A5 5 0 0 1 8.5 15.5" /><circle cx="12" cy="12" r="1" />
                </svg>
            )
        }] : []),
        ...(usuario?.rol === 'admin' || usuario?.rol === 'asignador' ? [{
            name: 'Asignar',
            path: '/vendedor/asignar',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
            )
        }] : []),
        {
            name: 'Calendario',
            path: '/vendedor/calendario',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            name: 'Prospectos',
            path: '/vendedor/prospectos',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
            )
        },
        {
            name: 'Clientes',
            path: '/vendedor/clientes',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            name: 'Manual',
            path: '/vendedor/manual',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            )
        }
    ];

    const menuItems = [
        ...(isAdminRoot ? [panelAdminItem, { name: '__admin-separator__', isSpacer: true }] : []),
        ...vendedorMainItems,
        ...(isAdminRoot || usuario?.esOwner ? [{
            name: 'Equipo',
            path: '/vendedor/equipo',
            isBottom: true,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
            )
        }] : []),
        {
            name: 'Ajustes',
            path: '/vendedor/ajustes',
            isBottom: true,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
            )
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

    return (
        <AnimatedGridBackground mode="light">
            <div className="h-screen flex p-4 gap-4">

                {/* Floating Sidebar (Light Mode) */}
                <FloatingSidebar
                    menuItems={menuItems}
                    userInfo={{ ...usuario, rol: getRoleLabel() }}
                    title="crmoneycall"
                    subtitle="Sales Full"
                    logo={<img src={logocrmoneycall} alt="crmoneycall" className="w-full h-full object-contain" />}
                    onCollapseChange={setSidebarCollapsed}
                    mode="light"
                />

                {/* Contenido flotante - Estilo Contenedor Blanco */}
                <main
                    className="flex-1 bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden transition-all duration-300 relative premium-reflejo"
                >

                    <div className={`h-full scrollbar-hide ${isAjustesRoute || isDashboard ? 'overflow-hidden' : 'overflow-y-auto pt-14'}`}>
                        <Outlet />
                    </div>
                </main>
            </div>
            <MoneycallBot />
        </AnimatedGridBackground>
    );
};

export default MainLayout;
