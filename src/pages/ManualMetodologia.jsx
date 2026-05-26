import React from 'react';
import { 
    BookOpen, 
    Target, 
    ListChecks,
    BarChart3,
    MessageCircleQuestion,
    PhoneOutgoing,
    PieChart
} from 'lucide-react';

const ManualMetodologia = () => {
    return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 relative hide-scrollbar pb-24">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-10">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Metodología Moneycall</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Guía Oficial del Sistema Proactivo de Ventas Recurrentes (B2B)</p>
                    </div>
                </div>
                <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full mt-4"></div>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">

                {/* Sección 1: Visión General */}
                <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-xl font-bold text-slate-800">1. De Reactivo a Proactivo</h2>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                        En la industria de ventas recurrentes (B2B), muchas empresas operan de forma <strong>reactiva</strong>, dependiendo de que el cliente llame para comprar. El sistema <strong>Moneycall</strong> transforma este modelo hacia uno <strong>proactivo</strong>.
                        <br/><br/>
                        La regla de oro del sistema no es "prospectar nuevos clientes", sino <strong>nutrir y crecer a partir de los clientes actuales</strong>. Los datos demuestran que el 20% de los clientes generan el 80% de las ventas. Nuestro objetivo es contactar proactivamente al resto de la base de clientes actual para descubrir por qué compran en la competencia y ganar su volumen de negocio.
                        <br/><br/>
                        <em>"Vender es obtener información, no proporcionar información. Significa entender cuáles son los problemas que el cliente quiere resolver."</em>
                    </p>
                </section>

                {/* Sección 2: Las 5 Preguntas Clave */}
                <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageCircleQuestion className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-xl font-bold text-slate-800">2. Las 5 Preguntas Clave</h2>
                    </div>
                    <p className="text-slate-600 text-sm mb-6">
                        La llamada inicial no es para vender un producto específico, sino para realizar un <strong>"mini estudio de mercado"</strong> y entender qué valora el cliente. El vendedor pide 17 minutos de su tiempo y hace las siguientes preguntas:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                            <span className="bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">P1</span>
                            <h4 className="font-bold text-slate-800 mt-2 text-sm">¿Por qué les gusta hacer negocios con nosotros?</h4>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                            <span className="bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">P2</span>
                            <h4 className="font-bold text-slate-800 mt-2 text-sm">¿Por qué les gusta hacer negocios con la competencia?</h4>
                            <p className="text-xs text-slate-500 mt-1">Busca entender qué valoran de otros sitios.</p>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                            <span className="bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">P3</span>
                            <h4 className="font-bold text-slate-800 mt-2 text-sm">¿Qué porcentaje de lo que compran nos compran a nosotros?</h4>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                            <span className="bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">P4</span>
                            <h4 className="font-bold text-slate-800 mt-2 text-sm">¿Qué les cuesta o frustra encontrar últimamente?</h4>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl md:col-span-2">
                            <span className="bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">P5</span>
                            <h4 className="font-bold text-slate-800 mt-2 text-sm">¿En qué segmento del mercado les gustaría penetrar y aún no han podido hacerlo?</h4>
                            <p className="text-xs text-slate-500 mt-1">Posiciona a la empresa como aliada para ayudarles a crecer.</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 italic mt-4">
                        * Si el vendedor ya conoce al cliente, se añade: "¿Qué le gusta de hacer negocios conmigo?"
                    </p>
                </section>

                {/* Sección 3: El Cuadrante de Ventas (S1 y S2) */}
                <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <PieChart className="w-6 h-6 text-amber-500" />
                        <h2 className="text-xl font-bold text-slate-800">3. El Cuadrante de Ventas (Nomenclaturas)</h2>
                    </div>
                    <p className="text-slate-600 text-sm mb-6">
                        Todo seguimiento y llamada se clasifica utilizando el <strong>Cuadrante de Ventas</strong>. En la etapa inicial del sistema Moneycall, <strong>solo nos enfocamos en el Cuadrante 1 y 2</strong> (Clientes actuales), nunca prospectamos clientes nuevos (Cuadrantes 3 y 4).
                    </p>
                    <div className="space-y-4">
                        <div className="border border-slate-200 rounded-xl p-5 hover:border-amber-300 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded text-xs">S1 (Cuadrante 1)</span>
                                <h4 className="font-bold text-slate-800">Clientes Actuales + Productos Actuales</h4>
                            </div>
                            <p className="text-sm text-slate-600">
                                Clientes que compran actualmente lo que ya les vendemos. El objetivo es que compren con mayor volumen o frecuencia. Se cierra la llamada con la pregunta de McDonald's: <em>"¿Qué más le apetece añadir a su pedido hoy?"</em>.
                            </p>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-5 hover:border-amber-300 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded text-xs">S2 (Cuadrante 2)</span>
                                <h4 className="font-bold text-slate-800">Clientes Actuales + Productos NUEVOS</h4>
                            </div>
                            <p className="text-sm text-slate-600">
                                Clientes de nuestra base de datos pero que le compran ciertos productos a la competencia. El objetivo es descubrir qué productos les faltan (usando la información de las 5 Preguntas Clave) y ofrecérselos para ganar esa cuota de mercado.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-2 opacity-50">
                            <div className="border border-slate-200 border-dashed rounded-xl p-4 bg-slate-50">
                                <span className="text-slate-500 font-bold text-xs">S3 (Cuadrante 3)</span>
                                <p className="text-xs text-slate-400 mt-1">Clientes Nuevos + Prod. Actuales (Prospección pura, no aplica inicialmente)</p>
                            </div>
                            <div className="border border-slate-200 border-dashed rounded-xl p-4 bg-slate-50">
                                <span className="text-slate-500 font-bold text-xs">S4 (Cuadrante 4)</span>
                                <p className="text-xs text-slate-400 mt-1">Clientes Nuevos + Prod. Nuevos (No aplica a nuestro modelo)</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sección 4: KPIs y Seguimiento */}
                <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-slate-800">4. KPIs: Lo que mides, crece</h2>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex gap-3 items-start">
                            <PhoneOutgoing className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Volumen Proactivo</h4>
                                <p className="text-xs text-slate-600 mt-1">Se busca generar entre <strong>20 y 30 llamadas proactivas al día</strong> por vendedor (registradas como S1 o S2). El ratio ideal del departamento debe ser 80% llamadas salientes y 20% llamadas entrantes.</p>
                            </div>
                        </li>
                        <li className="flex gap-3 items-start">
                            <ListChecks className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Seguimiento de Cotizaciones (100%)</h4>
                                <p className="text-xs text-slate-600 mt-1">Se espera que se pida una cotización en el 50% de las llamadas salientes. La regla de oro es realizar el seguimiento del <strong>100%</strong> de los presupuestos emitidos. El seguimiento eleva drásticamente el porcentaje de cierre.</p>
                            </div>
                        </li>
                    </ul>
                </section>

            </div>
        </div>
    );
};

export default ManualMetodologia;
