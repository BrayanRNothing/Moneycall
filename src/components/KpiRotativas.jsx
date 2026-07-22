import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';

export default function KpiRotativas({
    ClienteSeleccionado,
    actividadesContext,
    llamadasExitosas,
    llamadasFallidas,
    valorCliente,
    setValorCliente,
    monedaSeleccionada,
    setMonedaSeleccionada,
    guardandoMetrica,
    handleGuardarMetricaPersonalizada,
    customSections,
    ventasHistorial = []
}) {

    // Asegurar que customSections sea un array (por si viene como string JSON)
    const sections = useMemo(() => {
        if (Array.isArray(customSections)) return customSections;
        if (typeof customSections === 'string') {
            try {
                return JSON.parse(customSections || '[]');
            } catch (e) {
                return [];
            }
        }
        return [];
    }, [customSections]);

    // Calcular valores de módulos
    const tieneModulosData = sections.some(s => ['payments', 'contracts', 'products'].includes(s.tipo));
    
    // Total facturado (suma de pagos 'pagado')
    const totalFacturadoModulos = sections
        ?.filter(s => s.tipo === 'payments')
        ?.flatMap(s => s.contenido || [])
        ?.filter(p => p.estado === 'pagado')
        ?.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0) || 0;

    // Total facturado de ventas del sistema
    const totalVentasRegistradas = ventasHistorial.reduce((sum, v) => sum + (parseFloat(v.monto) || 0), 0);
    const granTotalFacturado = totalFacturadoModulos + totalVentasRegistradas;

    // Pagos Pendientes / Vencidos
    const pagosPendientes = sections
        ?.filter(s => s.tipo === 'payments')
        ?.flatMap(s => s.contenido || [])
        ?.filter(p => p.estado === 'pendiente' || p.estado === 'vencido');
    
    const cantidadPendientes = pagosPendientes.length;
    const montoPendiente = pagosPendientes.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

    // Contratos activos
    const hoy = new Date().toISOString().slice(0,10);
    const contratosActivos = sections
        ?.filter(s => s.tipo === 'contracts')
        ?.flatMap(s => s.contenido || [])
        ?.filter(c => c.fechaVencimiento && c.fechaVencimiento >= hoy).length || 0;

    // Productos comprados
    const totalProductos = sections
        ?.filter(s => s.tipo === 'products')
        ?.flatMap(s => s.contenido || [])
        ?.reduce((sum, p) => sum + (parseInt(p.cantidad) || 1), 0) || 0;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative overflow-hidden min-h-[110px]">
            {/* Cuadro 1: Antigüedad */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm flex flex-col justify-center relative">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Antigüedad</p>
                <p className="text-2xl font-black text-(--theme-600)">
                    {ClienteSeleccionado?.fechaRegistro || ClienteSeleccionado?.createdAt 
                        ? `${Math.max(1, Math.ceil(Math.abs(new Date() - new Date(ClienteSeleccionado.fechaRegistro || ClienteSeleccionado.createdAt)) / (1000 * 60 * 60 * 24)))} días`
                        : 'N/A'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                    {ClienteSeleccionado?.fechaRegistro || ClienteSeleccionado?.createdAt
                        ? `Desde: ${new Date(ClienteSeleccionado.fechaRegistro || ClienteSeleccionado.createdAt).toLocaleDateString('es-MX')}`
                        : 'Sin fecha'}
                </p>
            </div>

            {/* Cuadro 2: Llamadas */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm flex flex-col justify-center relative">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Llamadas</p>
                <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-black text-(--theme-500)" title="Contestadas">{llamadasExitosas}</span>
                    <span className="text-xl font-bold text-slate-300">/</span>
                    <span className="text-2xl font-black text-rose-500" title="No contestadas">{llamadasFallidas}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold italic">Si / No contestó</p>
            </div>

            {/* Cuadro 3: Reuniones */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm flex flex-col justify-center relative">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reuniones</p>
                <p className="text-3xl font-black text-(--theme-500)">
                    {actividadesContext?.filter(a => a.tipo === 'cita' && a.resultado === 'exitoso').length || 0}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">Realizadas</p>
            </div>

            {/* Cuadro 4: Facturado Total */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm flex flex-col justify-center relative min-h-[100px] overflow-hidden group">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facturado</p>
                <p className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1">
                    <span className="opacity-50 text-xl">$</span>
                    {granTotalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">Total de ventas</p>
            </div>
        </div>
    );
}
