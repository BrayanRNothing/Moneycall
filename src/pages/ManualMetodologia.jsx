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
    const [mostrarManualModal, setMostrarManualModal] = React.useState(false);
    const [mostrarNomenclaturaModal, setMostrarNomenclaturaModal] = React.useState(false);

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

            {/* Bloque Interactivo de Modales */}
            <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-br from-indigo-50/50 to-slate-100/50 border border-indigo-100/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-extrabold text-slate-800 text-sm md:text-base">Guías Interactivas de Nomenclatura</h3>
                    <p className="text-xs text-slate-500 mt-1">Explora visualmente el manual de registro de llamadas o la guía rápida de procesos de la metodología.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                    {/* Botón para abrir el Manual de Registro */}
                    <button 
                      onClick={() => setMostrarManualModal(true)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-slate-700 border border-slate-300/50 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      ⚡ Ver Manual de Registro
                    </button>

                    {/* Botón para abrir la Guía Rápida de Nomenclatura */}
                    <button 
                      onClick={() => setMostrarNomenclaturaModal(true)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl hover:opacity-90 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      📖 Guía de Metodología
                    </button>
                </div>
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

            {/* Modal 1: Manual de Registro y Metodología */}
            {mostrarManualModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full p-6 relative border border-white/40 flex flex-col gap-4 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
                  {/* Botón de Cerrar Esquina Superior Derecha */}
                  <button 
                    onClick={() => setMostrarManualModal(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-500 hover:text-slate-700 shadow-sm transition-all cursor-pointer"
                    aria-label="Cerrar"
                  >
                    <span className="text-xs font-bold block leading-none">✕</span>
                  </button>

                  {/* Título Principal */}
                  <div className="flex items-center gap-2 text-blue-600 font-extrabold text-base md:text-lg border-b border-slate-200 pb-3">
                    <span className="text-xl">⚡</span>
                    <h2>Manual de Registro y Metodología Moneycall</h2>
                  </div>

                  {/* Contenido en 3 Columnas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 overflow-y-auto max-h-[60vh] pr-2">
                    
                    {/* Columna 1: S1 & S2 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-black text-slate-800 text-sm border-b border-slate-200/60 pb-1.5">
                        <span className="text-rose-500 text-base">📞</span>
                        <span className="text-rose-500">S1 & S2 (Llamadas de Cuadrante)</span>
                      </div>
                      <div className="space-y-3 text-xs leading-normal">
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-bold block mb-0.5">S1 (Cuadrante 1 - Recuperación):</strong> 
                          Revisa el historial de pedidos del cliente. Si solía comprar un producto (ej. compresores) y lleva &gt;45 días sin comprarlo, llámale proactivamente para indagar la razón y recuperarlo.
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-bold block mb-0.5">S2 (Cuadrante 2 - Venta Cruzada):</strong> 
                          Identifica productos complementarios que clientes similares compran pero este no (ej. kits de instalación para minisplits). Llama para ofrecerlos proactivamente y subir tu ticket promedio.
                        </p>
                      </div>
                    </div>

                    {/* Columna 2: F1 & F2 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-black text-slate-800 text-sm border-b border-slate-200/60 pb-1.5">
                        <span className="text-amber-500 text-base">⌛</span>
                        <span className="text-amber-500">F1 & F2 (Pipeline de Cotización)</span>
                      </div>
                      <div className="space-y-3 text-xs leading-normal">
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-bold block mb-0.5">F1 (Seguimiento 1):</strong> 
                          ¡Meta 100%! Llama a las 24 horas de enviar cualquier cotización para confirmar recepción y resolver dudas. Su objetivo principal es <span className="underline decoration-slate-400 font-semibold text-slate-800">acordar una fecha de decisión</span> con el cliente.
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-bold block mb-0.5">F2 (Seguimiento 2):</strong> 
                          Llamada de cierre definitivo. Se realiza de forma puntual en la fecha de decisión acordada en F1. ¡Aquí se rescata la mayor parte de las ventas en duda!
                        </p>
                      </div>
                    </div>

                    {/* Columna 3: DC, RC, PT */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-black text-slate-800 text-sm border-b border-slate-200/60 pb-1.5">
                        <span className="text-emerald-600 text-base">🚚</span>
                        <span className="text-emerald-600">DC, RC, PT y el Secreto McDonald's</span>
                      </div>
                      <div className="space-y-3 text-xs leading-normal">
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-bold block mb-0.5">DC (Delivery Check):</strong> 
                          Llamada post-entrega física. ¿Llegó todo conforme? 100% obligatorio. 10 DCs perfectas te dan derecho a hacer una llamada <strong className="text-slate-800 font-bold">RC (Referencia)</strong> para pedir testimonios (Plan A/B/C).
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-800 font-bold block mb-0.5">PT (Contacto Personal):</strong> 
                          Llamada trimestral sin agenda comercial. "Solo llamaba para saludarte".
                        </p>
                        <p className="text-slate-600 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                          <strong className="text-slate-800 font-bold block mb-0.5">🍔 Pregunta McDonald's:</strong> 
                          Al terminar toda interacción, pregunta siempre: <span className="italic text-slate-700">"¿Qué más te resulta difícil encontrar hoy que yo pueda localizar para ti?"</span>. ¡Captura compras que el cliente asumía que no vendías!
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Footer con Botón Neumórfico de Cierre */}
                  <div className="flex justify-end pt-3 border-t border-slate-200/50 mt-2">
                    <button 
                      onClick={() => setMostrarManualModal(false)}
                      className="px-6 py-2.5 rounded-2xl bg-slate-200 text-slate-700 font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.9)] cursor-pointer"
                    >
                      Cerrar Guía
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal 2: Guía rápida de nomenclatura */}
            {mostrarNomenclaturaModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-white/50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Cabecera Azul */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
                      <div>
                        <h2 className="text-sm md:text-base font-extrabold tracking-tight">Metodología Moneycall</h2>
                        <span className="text-[10px] md:text-xs text-blue-100 font-medium block">Guía rápida de nomenclatura y procesos</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMostrarNomenclaturaModal(false)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                      aria-label="Cerrar"
                    >
                      <span className="text-lg font-bold block leading-none">✕</span>
                    </button>
                  </div>

                  {/* Cuerpo del Modal */}
                  <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    
                    {/* Sección: El Pipeline de Cotizaciones */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">El Pipeline de Cotizaciones</h3>
                      <p className="text-xs text-slate-500 leading-normal">
                        En Moneycall, <strong className="text-slate-700">nunca se envía una cotización sin darle seguimiento</strong>. El proceso es:
                      </p>
                      
                      {/* Flujo de Estados */}
                      <div className="flex items-center gap-2 pt-2 flex-wrap text-slate-600">
                        <span className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-extrabold text-slate-700 bg-white shadow-xs">
                          Cotización (Pendiente)
                        </span>
                        <span className="text-slate-400 font-bold text-xs shrink-0">➔</span>
                        <span className="px-3 py-1.5 rounded-lg border border-amber-200 text-[10px] font-extrabold text-amber-700 bg-amber-50/50 shadow-xs">
                          F1 (1er Seguimiento)
                        </span>
                        <span className="text-slate-400 font-bold text-xs shrink-0">➔</span>
                        <span className="px-3 py-1.5 rounded-lg border border-pink-200 text-[10px] font-extrabold text-pink-700 bg-pink-50/50 shadow-xs">
                          F2 (Cierre/Decisión)
                        </span>
                        <span className="text-slate-400 font-bold text-xs shrink-0">➔</span>
                        <span className="px-3 py-1.5 rounded-lg border border-emerald-200 text-[10px] font-extrabold text-emerald-700 bg-emerald-50/50 shadow-xs">
                          Ganada / Perdida
                        </span>
                      </div>
                    </div>

                    {/* Sección: Tipos de Llamadas (Nomenclatura) */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-t border-slate-200/80 pt-4">
                        Tipos de Llamadas (Nomenclatura)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Card S1 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-base">
                            📞
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-blue-600">S1 - Cuadrante de Recuperación</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Clientes inactivos en ciertos productos por más de 45 días.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-medium">
                              🔑 Llama para averiguar por qué dejaron de comprar y recupera el negocio.
                            </div>
                          </div>
                        </div>

                        {/* Card S2 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-base">
                            ⚡
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-indigo-600">S2 - Venta Cruzada</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Ofrecer productos complementarios basados en compras de clientes similares.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-medium">
                              🔑 Aumenta el ticket promedio con sugerencias relevantes al negocio del cliente.
                            </div>
                          </div>
                        </div>

                        {/* Card F1 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold text-base">
                            🕒
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-amber-600">F1 - Primer Seguimiento</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Llamada obligatoria post-cotización (100% cobertura).
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-medium">
                              🔑 No dejes cotizaciones sueltas. En esta llamada se fija la fecha F2 de decisión.
                            </div>
                          </div>
                        </div>

                        {/* Card F2 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold text-base">
                            ⌛
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-pink-600">F2 - Segundo Seguimiento</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Llamada de cierre basada en la fecha acordada en F1.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-medium">
                              🔑 El 40% restante de las ventas se cierra aquí. ¡Llama puntual en la fecha acordada!
                            </div>
                          </div>
                        </div>

                        {/* Card DC */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-base">
                            🚚
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-emerald-600">DC - Delivery Check</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Confirmar satisfacción en la entrega del pedido.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-medium">
                              💡 Asegura que el cliente recibió todo bien. Si acumulas 10 DCs perfectas, puedes pedir RC.
                            </div>
                          </div>
                        </div>

                        {/* Card RC */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center shrink-0 font-bold text-base">
                            ⭐
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-amber-500 font-black">RC - Referencia / Testimonio</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Pedir testimonio en video, texto o un referido.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-medium">
                              💡 Solo se pide después de 10 entregas perfectas. Inicia pidiendo video (Plan A).
                            </div>
                          </div>
                        </div>

                        {/* Card PT */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 font-bold text-base">
                            ♡
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-slate-600 font-black">PT - Contacto Personal</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Llamada de relación, sin intención de venta.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-medium">
                              💡 Meta: 1 por cliente al trimestre. Mantén la relación cálida ("Solo quería saludarte").
                            </div>
                          </div>
                        </div>

                        {/* Card IN */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold text-base">
                            📞
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-slate-600 font-black">IN - Entrante</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              El cliente te llama a ti.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-medium">
                              💡 Atiende su solicitud, pero antes de colgar ofrece venta cruzada (S2) o promociones.
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/50 flex justify-end gap-3">
                    <button 
                      onClick={() => setMostrarNomenclaturaModal(false)}
                      className="px-5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
                    >
                      Entendido, cerrar
                    </button>
                  </div>

                </div>
              </div>
            )}
        </div>
    );
};

export default ManualMetodologia;
