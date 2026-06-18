import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, RefreshCw, Plus, Users, Phone, Calendar, Mail, Building, ChevronLeft, Globe, MapPin, X } from 'lucide-react';
import { getUser, getToken } from '../utils/authUtils';
import API_URL from '../config/api';

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

const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function AsignadorDashboard() {
    const userAuth = getUser();
    const token = getToken();
    const [vendedores, setVendedores] = useState([]);
    const [prospectos, setProspectos] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingProps, setLoadingProps] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    const [formData, setFormData] = useState({
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        telefonos: [''],
        correos: [''],
        empresa: '',
        sitioWeb: '',
        ubicacion: '',
        fuente: 'Asignador'
    });

    const fetchVendedores = useCallback(async () => {
        setLoading(true);
        try {
            // Obtener el equipo actual y filtrar los vendedores de este equipo
            const res = await fetch(`${API_URL}/api/equipos/mi-equipo`, {
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.miembros) {
                    const vends = data.miembros.filter(u => u.rol === 'vendedor');
                    setVendedores(vends);
                }
            }
        } catch (e) {
            console.error('Error fetching vendedores:', e);
        } finally {
            setLoading(false);
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
        fetchVendedores();
    }, [fetchVendedores]);

    useEffect(() => {
        if (selectedMember) {
            fetchProspectos(selectedMember.id);
        }
    }, [selectedMember, fetchProspectos]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const telefonosLimpios = formData.telefonos.filter(t => t.trim());
            const correosLimpios = formData.correos.filter(c => c.trim());

            if (!formData.nombres.trim()) {
                alert('El nombre es obligatorio');
                return;
            }

            const payload = {
                nombres: formData.nombres,
                apellidoPaterno: formData.apellidoPaterno,
                apellidoMaterno: formData.apellidoMaterno,
                telefono: telefonosLimpios[0] || '',
                telefono2: telefonosLimpios.slice(1).join(', ') || '',
                correo: correosLimpios.join(', ') || '',
                empresa: formData.empresa,
                sitioWeb: formData.sitioWeb,
                ubicacion: formData.ubicacion,
                fuente: formData.fuente || 'Asignador',
                vendedorAsignado: selectedMember.id,
                etapaEmbudo: 'prospecto_nuevo'
            };

            const res = await fetch(`${API_URL}/api/clientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alert('Prospecto asignado con éxito');
                setShowForm(false);
                setFormData({
                    nombres: '',
                    apellidoPaterno: '',
                    apellidoMaterno: '',
                    telefonos: [''],
                    correos: [''],
                    empresa: '',
                    sitioWeb: '',
                    ubicacion: '',
                    fuente: 'Asignador'
                });
                fetchProspectos(selectedMember.id);
            } else {
                const errorData = await res.json();
                alert(errorData.mensaje || 'Error al asignar');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    };

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
                                    <Users size={28} className="text-white" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                                    {selectedMember ? `Asignar a: ${selectedMember.nombre}` : 'Panel de Asignación'}
                                </h1>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
                                    {selectedMember ? 'Cartera actual y asignación' : 'Selecciona un vendedor para asignarle clientes'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] md:text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                                onClick={selectedMember ? () => fetchProspectos(selectedMember.id) : fetchVendedores}
                            >
                                <RefreshCw size={14} className={(selectedMember ? loadingProps : loading) ? 'animate-spin' : ''} />
                                ACTUALIZAR
                            </button>
                            {selectedMember && (
                                <button
                                    onClick={() => setShowForm(!showForm)}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-(--theme-600) text-white rounded-xl text-[11px] md:text-xs font-bold hover:bg-(--theme-700) transition-all shadow-sm"
                                >
                                    <Plus size={14} />
                                    AGREGAR PROSPECTO
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Vista de Tarjetas (Grid de Usuarios) */}
                {!selectedMember && (
                    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-white md:rounded-2xl p-5 border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">Vendedores</h2>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-widest mt-1">Selecciona a quién asignar</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 flex-1">
                                    <RefreshCw size={48} className="animate-spin text-(--theme-500) mb-4" />
                                    <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Cargando vendedores...</p>
                                </div>
                            ) : vendedores.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex-1 flex flex-col items-center justify-center min-h-0">
                                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-semibold">No hay vendedores disponibles.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-2 flex-1 content-start min-h-0">
                                    {vendedores.map(miembro => (
                                        <div 
                                            key={miembro.id} 
                                            onClick={() => setSelectedMember(miembro)}
                                            className="group relative p-5 bg-white border border-gray-200 rounded-2xl transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 cursor-pointer"
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
                                            </div>
                                            
                                            <div className="pt-4 border-t border-gray-50 flex justify-center">
                                                <span className="text-[10px] font-bold text-(--theme-600) bg-(--theme-50) px-4 py-1.5 rounded-xl border border-(--theme-100) group-hover:bg-(--theme-100) transition-colors uppercase tracking-widest">
                                                    SELECCIONAR
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Detalles del Usuario Seleccionado (Formulario y Cartera) */}
                {selectedMember && (
                    <div className={`grid ${showForm ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6 flex-1 min-h-0 animate-in slide-in-from-bottom-4 fade-in duration-500`}>
                        
                        {/* Formulario de Asignación */}
                        {showForm && (
                            <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0">
                                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2 shrink-0">
                                    <div className="p-2 bg-(--theme-50) rounded-lg">
                                        <Plus size={18} className="text-(--theme-600)" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 leading-tight">Asignar Nuevo Prospecto</h2>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">Llenar datos del cliente</p>
                                    </div>
                                </div>
                                <div className="p-4 sm:p-5 flex-1 overflow-y-auto content-start min-h-0 custom-scrollbar pr-2">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        
                                        {/* Sección: Identidad */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="w-1 h-3 bg-(--theme-500) rounded-full"></div>
                                                Identidad
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Nombres *</label>
                                                    <input 
                                                        type="text" 
                                                        required 
                                                        value={formData.nombres} 
                                                        onChange={e => setFormData({...formData, nombres: e.target.value})} 
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium" 
                                                        placeholder="Juan" 
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Apellido Paterno</label>
                                                        <input 
                                                            type="text" 
                                                            value={formData.apellidoPaterno} 
                                                            onChange={e => setFormData({...formData, apellidoPaterno: e.target.value})} 
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium" 
                                                            placeholder="García" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Apellido Materno</label>
                                                        <input 
                                                            type="text" 
                                                            value={formData.apellidoMaterno} 
                                                            onChange={e => setFormData({...formData, apellidoMaterno: e.target.value})} 
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium" 
                                                            placeholder="López" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sección: Contacto */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                                Contacto
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Teléfonos *</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(f => ({ ...f, telefonos: [...f.telefonos, ''] }))}
                                                            className="text-[10px] text-(--theme-600) hover:text-(--theme-700) font-black uppercase tracking-tighter"
                                                        >
                                                            + Añadir otro
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {formData.telefonos.map((tel, idx) => (
                                                            <div key={idx} className="relative group">
                                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                                <input
                                                                    type="tel"
                                                                    required={idx === 0}
                                                                    value={tel}
                                                                    onChange={e => setFormData(f => {
                                                                        const t = [...f.telefonos];
                                                                        t[idx] = e.target.value;
                                                                        return { ...f, telefonos: t };
                                                                    })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                                    placeholder="55 1234 5678"
                                                                />
                                                                {formData.telefonos.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData(f => ({ ...f, telefonos: f.telefonos.filter((_, i) => i !== idx) }))}
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
                                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Correos Electrónicos</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(f => ({ ...f, correos: [...f.correos, ''] }))}
                                                            className="text-[10px] text-(--theme-600) hover:text-(--theme-700) font-black uppercase tracking-tighter"
                                                        >
                                                            + Añadir otro
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {formData.correos.map((cor, idx) => (
                                                            <div key={idx} className="relative group">
                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                                <input
                                                                    type="email"
                                                                    value={cor}
                                                                    onChange={e => setFormData(f => {
                                                                        const c = [...f.correos];
                                                                        c[idx] = e.target.value;
                                                                        return { ...f, correos: c };
                                                                    })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium"
                                                                    placeholder="ejemplo@correo.com"
                                                                />
                                                                {formData.correos.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData(f => ({ ...f, correos: f.correos.filter((_, i) => i !== idx) }))}
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

                                        {/* Sección: Empresa y Sitio */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                                Empresa & Sitio
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Nombre de Empresa</label>
                                                    <div className="relative group">
                                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                        <input 
                                                            type="text" 
                                                            value={formData.empresa} 
                                                            onChange={e => setFormData({...formData, empresa: e.target.value})} 
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium" 
                                                            placeholder="Empresa S.A." 
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Sitio Web</label>
                                                    <div className="relative group">
                                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                        <input 
                                                            type="url" 
                                                            value={formData.sitioWeb} 
                                                            onChange={e => setFormData({...formData, sitioWeb: e.target.value})} 
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium" 
                                                            placeholder="https://google.com" 
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Ubicación</label>
                                                    <div className="relative group">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-(--theme-500) transition-colors" />
                                                        <input 
                                                            type="text" 
                                                            value={formData.ubicacion} 
                                                            onChange={e => setFormData({...formData, ubicacion: e.target.value})} 
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 py-3 text-sm focus:ring-2 focus:ring-(--theme-500) focus:bg-white transition-all outline-none font-medium" 
                                                            placeholder="CDMX, México" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button type="submit" className="w-full py-3 bg-(--theme-600) text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-(--theme-700) hover:brightness-110 transition-all shadow-md mt-6">
                                            Asignar Prospecto a {selectedMember.nombre}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Columna Cartera */}
                        <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0">
                            <div className="p-4 sm:p-5 border-b border-gray-100 shrink-0">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-(--theme-50) rounded-lg">
                                        <Briefcase size={18} className="text-(--theme-600)" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 leading-tight">Cartera de {selectedMember.nombre}</h2>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">Contactos asignados</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-5 flex-1 overflow-y-auto content-start min-h-0 custom-scrollbar pr-2">
                                {loadingProps ? (
                                    <div className="flex flex-col items-center justify-center py-20 flex-1">
                                        <RefreshCw size={32} className="animate-spin text-(--theme-500) mb-4" />
                                    </div>
                                ) : prospectos.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                                        <Briefcase size={32} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500 text-sm font-semibold">No hay prospectos asignados.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {prospectos.map((p) => (
                                            <div key={p.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-(--theme-100) transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm group-hover:text-(--theme-600) transition-colors">{p.nombres} {p.apellidoPaterno}</div>
                                                        <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-1">
                                                            <Building size={10} className="text-gray-400" /> {p.empresa || 'Sin empresa'}
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
                                                    {p.correo && (
                                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                            <Mail size={10} className="text-gray-400" /> {p.correo}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
