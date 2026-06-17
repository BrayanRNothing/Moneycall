import React, { useState } from 'react';
import {
    BookOpen,
    Target,
    MessageCircleQuestion,
    PhoneOutgoing,
    Clock,
    PieChart,
    BarChart3,
    TrendingUp,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const ManualMetodologia = () => {
    const [currentPage, setCurrentPage] = useState(0);

    const pages = [
        // 0: Portada
        <div key="page-0" className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center mb-8 shadow-sm">
                <BookOpen className="w-10 h-10 text-white" strokeWidth={1} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-light text-slate-900 tracking-tight mb-4">
                Manual<span className="font-semibold">Operativo</span>
            </h1>
            <div className="h-px w-24 bg-slate-200 mb-8"></div>
            <h2 className="text-sm font-medium text-slate-500 tracking-widest uppercase">
                Sistema Moneycall
            </h2>
            <p className="text-slate-400 mt-6 max-w-sm font-light leading-relaxed mx-auto text-sm">
                Ventas recurrentes B2B proactivas y controladas.
            </p>
        </div>,

        // 1: Visión General
        <div key="page-1" className="flex flex-col h-full justify-center px-4 sm:px-12 max-w-3xl mx-auto w-full">
            <div className="mb-8">
                <span className="text-xs font-semibold text-blue-500 tracking-widest uppercase mb-2 block">Fundamento</span>
                <h2 className="text-3xl font-light text-slate-900">De reactivo a <span className="font-semibold">proactivo</span></h2>
            </div>
            <div className="space-y-6 text-slate-600 font-light leading-relaxed">
                <p>
                    La mayoría de las empresas operan respondiendo llamadas. El control lo tiene el cliente.
                </p>
                <p>
                    El objetivo es tomar el control nutriendo una cartera exclusiva. <br/>
                    <span className="text-slate-900 font-medium">Vender es obtener información escuchando, no proporcionarla.</span>
                </p>
                <div className="border-l border-slate-200 pl-6 text-slate-500 italic mt-8 text-sm">
                    "El 20% de tus clientes genera el 80% de tus ingresos. Enfócate en desarrollar al otro 80%."
                </div>
            </div>
        </div>,

        // 2: Diagnóstico
        <div key="page-2" className="flex flex-col h-full justify-center px-4 sm:px-12 w-full">
            <div className="mb-8">
                <span className="text-xs font-semibold text-blue-500 tracking-widest uppercase mb-2 block">Paso 1</span>
                <h2 className="text-3xl font-light text-slate-900">Llamada de <span className="font-semibold">Diagnóstico</span></h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pr-2 pb-2">
                {[
                    { title: '¿Qué le gusta de nosotros?', desc: 'Identifica puntos fuertes y de valor.' },
                    { title: '¿Qué le gusta de la competencia?', desc: 'Entiende las fortalezas de otros.' },
                    { title: '¿Qué % compra con nosotros?', desc: 'Mide la participación (Share of Wallet).' },
                    { title: '¿Qué le es difícil encontrar?', desc: 'Detecta desabastos o necesidades.' },
                    { title: '¿En qué nicho le gustaría crecer?', desc: 'Mercados que no ha podido penetrar aún.' },
                ].map((q, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-transparent">
                        <span className="text-slate-300 font-mono text-sm mb-3 block">0{i + 1}</span>
                        <h4 className="font-medium text-slate-800 mb-2 text-sm">{q.title}</h4>
                        <p className="text-slate-500 text-xs font-light">{q.desc}</p>
                    </div>
                ))}
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                    <span className="text-blue-400 font-mono text-sm mb-3 block">TIP</span>
                    <h4 className="font-medium text-blue-900 mb-2 text-sm">Profundizar a fondo</h4>
                    <p className="text-blue-700/80 text-xs font-light">Pregunta "¿Qué más?" repetidamente hasta agotar respuestas.</p>
                </div>
            </div>
        </div>,

        // 3: Cuadrante de Ventas
        <div key="page-3" className="flex flex-col h-full justify-center px-4 sm:px-12 max-w-4xl mx-auto w-full">
            <div className="mb-10">
                <span className="text-xs font-semibold text-blue-500 tracking-widest uppercase mb-2 block">Enfoque</span>
                <h2 className="text-3xl font-light text-slate-900">Cuadrante de <span className="font-semibold">Ventas</span></h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
                <div className="group border border-slate-100 rounded-2xl p-8 hover:border-slate-200 transition-colors bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">S1</span>
                        <Target className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <h4 className="font-medium text-slate-900 text-lg mb-3">Actuales + Actuales</h4>
                    <p className="text-slate-500 font-light text-sm leading-relaxed">
                        Aumentar volumen o frecuencia de compra. Cierre con la Pregunta final.
                    </p>
                </div>
                <div className="group border border-slate-100 rounded-2xl p-8 hover:border-slate-200 transition-colors bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">S2</span>
                        <PieChart className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <h4 className="font-medium text-slate-900 text-lg mb-3">Actuales + Nuevos</h4>
                    <p className="text-slate-500 font-light text-sm leading-relaxed">
                        Descubrir proactivamente qué le compran a la competencia y ofrecérselos.
                    </p>
                </div>
            </div>
        </div>,

        // 4: Pipeline de Cotizaciones
        <div key="page-4" className="flex flex-col h-full justify-center px-4 sm:px-12 max-w-2xl mx-auto w-full">
            <div className="mb-10">
                <span className="text-xs font-semibold text-blue-500 tracking-widest uppercase mb-2 block">Proceso</span>
                <h2 className="text-3xl font-light text-slate-900">Pipeline de <span className="font-semibold">Cotizaciones</span></h2>
            </div>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {[
                    { step: '1', title: 'Emitida', desc: 'Se genera y envía la cotización formal al cliente.' },
                    { step: '2', title: 'F1 (24h)', desc: 'Seguimiento para confirmar recepción y agendar decisión.' },
                    { step: '3', title: 'F2 (Cierre)', desc: 'Llamada en la fecha acordada para cerrar la venta.' }
                ].map((item, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-200 group-hover:bg-blue-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>
                            </div>
                            <p className="text-slate-500 text-xs font-light">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>,

        // 5: Nomenclatura (I)
        <div key="page-5" className="flex flex-col h-full justify-center px-4 sm:px-12 w-full max-w-4xl mx-auto">
            <div className="mb-10">
                <span className="text-xs font-semibold text-blue-500 tracking-widest uppercase mb-2 block">Glosario</span>
                <h2 className="text-3xl font-light text-slate-900">Nomenclatura <span className="font-semibold">Comercial</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                    { id: 'S1', title: 'Recuperación', desc: 'Inactivos >45 días. Recupéralos.' },
                    { id: 'S2', title: 'Venta Cruzada', desc: 'Productos complementarios.' },
                    { id: 'F1', title: '1er Seguimiento', desc: 'Primeras 24h post-cotización.' },
                    { id: 'F2', title: '2do Seguimiento', desc: 'Llamada de cierre definitivo.' },
                ].map((call, idx) => (
                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 sm:last:border-b sm:[&:nth-last-child(-n+2)]:border-0">
                        <span className="font-mono text-xs font-medium text-slate-400 w-6 pt-0.5">{call.id}</span>
                        <div>
                            <h4 className="font-medium text-slate-900 text-sm mb-1">{call.title}</h4>
                            <p className="text-slate-500 text-xs font-light">{call.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>,

        // 6: Nomenclatura (II)
        <div key="page-6" className="flex flex-col h-full justify-center px-4 sm:px-12 w-full max-w-4xl mx-auto">
            <div className="mb-10">
                <span className="text-xs font-semibold text-blue-500 tracking-widest uppercase mb-2 block">Glosario</span>
                <h2 className="text-3xl font-light text-slate-900">Nomenclatura <span className="font-semibold">Relacional</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                    { id: 'DC', title: 'Delivery Check', desc: 'Confirma que la entrega fue perfecta.' },
                    { id: 'RC', title: 'Referencia', desc: 'Pide referido tras 10 DCs perfectas.' },
                    { id: 'PT', title: 'Contacto Personal', desc: 'Relación 100% sin agenda comercial.' },
                    { id: 'IN', title: 'Entrante', desc: 'Cliente inicia. Intentar un S2.' }
                ].map((call, idx) => (
                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 sm:last:border-b sm:[&:nth-last-child(-n+2)]:border-0">
                        <span className="font-mono text-xs font-medium text-slate-400 w-6 pt-0.5">{call.id}</span>
                        <div>
                            <h4 className="font-medium text-slate-900 text-sm mb-1">{call.title}</h4>
                            <p className="text-slate-500 text-xs font-light">{call.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>,

        // 7: Cierre & Métricas
        <div key="page-7" className="flex flex-col h-full justify-center px-4 sm:px-12 w-full max-w-3xl mx-auto">
            <div className="mb-12">
                <h2 className="text-2xl font-light text-slate-900 mb-6">La pregunta <span className="font-semibold">definitiva</span></h2>
                <div className="pl-6 border-l-2 border-blue-500">
                    <p className="text-xl font-light text-slate-700 italic leading-relaxed">
                        "¿Qué más le resulta difícil encontrar hoy en día que yo pueda localizar para usted?"
                    </p>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
                <h3 className="text-sm font-medium text-slate-900 mb-6 uppercase tracking-widest">Métricas Clave</h3>
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="text-2xl font-light text-slate-900 mb-1">20-30</div>
                        <div className="text-xs text-slate-500 font-light">Llamadas proactivas / día</div>
                    </div>
                    <div>
                        <div className="text-2xl font-light text-slate-900 mb-1">20-25%</div>
                        <div className="text-xs text-slate-500 font-light">Tasa de cierre esperada</div>
                    </div>
                </div>
            </div>
        </div>,

        // 8: Fin
        <div key="page-8" className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full border border-slate-100 bg-white flex items-center justify-center mb-6 shadow-sm">
                <Target className="w-6 h-6 text-slate-400" strokeWidth={1} />
            </div>
            <h1 className="text-2xl font-light text-slate-900 tracking-tight mb-2">
                Fin del Manual
            </h1>
            <h2 className="text-xs font-medium text-slate-400 tracking-widest uppercase mt-4">
                Estás listo para comenzar
            </h2>
        </div>
    ];

    const handleNext = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="flex-1 bg-[#FAFAFA] h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-8 overflow-hidden relative">
            <div className="w-full max-w-4xl h-full max-h-[700px] bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col relative">
                
                {/* Main Content Area */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-white flex flex-col relative w-full">
                    <div className="min-h-full w-full flex flex-col justify-center py-8">
                        {pages[currentPage]}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="h-16 px-6 sm:px-8 flex items-center justify-between border-t border-slate-100 bg-white z-10 shrink-0">
                    <button 
                        onClick={handlePrev}
                        disabled={currentPage === 0}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                            currentPage === 0 
                            ? 'text-slate-300 cursor-not-allowed opacity-50' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <div className="flex gap-1.5 items-center">
                        {pages.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === currentPage ? 'w-4 bg-slate-800' : 'w-1.5 bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>

                    <button 
                        onClick={handleNext}
                        disabled={currentPage === pages.length - 1}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                            currentPage === pages.length - 1 
                            ? 'text-slate-300 cursor-not-allowed opacity-50' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualMetodologia;

