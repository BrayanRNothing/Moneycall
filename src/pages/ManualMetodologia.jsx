import React from 'react';
import { 
    BookOpen, 
    Target, 
    ListChecks,
    BarChart3,
    MessageCircleQuestion,
    PhoneOutgoing,
    Clock,
    TrendingUp
} from 'lucide-react';

const ManualMetodologia = () => {
    return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 relative hide-scrollbar pb-24">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            {/* Header Principal */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Metodología Moneycall</h1>
                        <p className="text-xs md:text-sm font-semibold text-slate-500 mt-1">Guía Oficial del Sistema Proactivo de Ventas Recurrentes B2B</p>
                    </div>
                </div>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-4"></div>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">

                {/* Sección 1: Visión General */}
                <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center gap-3 mb-5">
                        <Target className="w-5.5 h-5.5 text-blue-600" />
                        <h2 className="text-lg font-black text-slate-800">1. De Reactivo a Proactivo</h2>
                    </div>
                    <div className="text-slate-600 leading-relaxed text-xs sm:text-sm space-y-4 font-medium">
                        <p>
                          En la industria de distribución B2B, la mayoría de las empresas operan de manera <strong>reactiva</strong>, esperando a que el cliente llame. Los datos demuestran que en estos entornos, entre el 93% y el 99% de las interacciones son llamadas entrantes, lo que deja el control comercial en manos del cliente.
                        </p>
                        <p>
                          La metodología <strong>Moneycall</strong> propone cambiar esto radicalmente hacia una <strong>proactividad controlada</strong>. El objetivo del asesor no es hacer marketing masivo o prospección en frío, sino <strong>desarrollar y recuperar a la base de clientes actual</strong>.
                        </p>
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800 italic font-semibold my-2">
                          "La regla del 80/20: El 20% de tus clientes ya genera el 80% de tus ingresos. Moneycall se enfoca proactivamente en el restante 80% de los clientes registrados que compran de forma irregular o le compran más a la competencia."
                        </div>
                    </div>
                </section>

                {/* Sección 2: Las 5 Preguntas Clave */}
                <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center gap-3 mb-5">
                        <MessageCircleQuestion className="w-5.5 h-5.5 text-emerald-600" />
                        <h2 className="text-lg font-black text-slate-800">2. Las 5 Preguntas Clave (Llamada de Diagnóstico)</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-6 font-medium">
                        La primera llamada (S1) con cada cliente es una <strong>entrevista de diagnóstico inicial</strong>. El objetivo único es escuchar activamente, no vender un producto en ese instante:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-xs">¿Qué le gusta de hacer negocios con nosotros?</h4>
                                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Identifica los puntos fuertes y de valor para retener al cliente.</p>
                            </div>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-xs">¿Qué le gusta de hacer negocios con la competencia?</h4>
                                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Entiende las fortalezas de otros proveedores para reaccionar.</p>
                            </div>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-xs">¿Qué porcentaje de lo que compra nos lo compra a nosotros?</h4>
                                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Mide la participación de mercado de la cuenta (Share of Wallet).</p>
                            </div>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-xs">¿Qué le resulta difícil encontrar últimamente?</h4>
                                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Detecta desabastos o necesidades insatisfechas que puedas cubrir.</p>
                            </div>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex gap-3 md:col-span-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">5</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-xs">¿En qué segmento de mercado le gustaría crecer y no ha podido?</h4>
                                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Posiciona a tu empresa como un aliado estratégico enfocado en su crecimiento comercial.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sección 3: El Pipeline de Cotizaciones */}
                <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-5.5 h-5.5 text-amber-500" />
                        <h2 className="text-lg font-black text-slate-800">3. El Pipeline de Cotizaciones</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-normal font-medium mb-6">
                        En la metodología Moneycall, <strong>ninguna cotización se envía sin darle seguimiento absoluto</strong>. El flujo de estados se controla rigurosamente:
                    </p>
                    
                    {/* Flujo de Estados Visualizado */}
                    <div className="flex items-center gap-2.5 pt-2 flex-wrap text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-extrabold text-slate-700 bg-white shadow-xs">
                            📝 Cotización Emitida
                        </div>
                        <span className="text-slate-400 font-bold text-xs shrink-0">➔</span>
                        <div className="px-3 py-2 rounded-xl border border-amber-200 text-[10px] font-extrabold text-amber-700 bg-amber-50/50 shadow-xs">
                            🕒 F1 (Primer Seguimiento a las 24h)
                        </div>
                        <span className="text-slate-400 font-bold text-xs shrink-0">➔</span>
                        <div className="px-3 py-2 rounded-xl border border-pink-200 text-[10px] font-extrabold text-pink-700 bg-pink-50/50 shadow-xs">
                            ⌛ F2 (Segundo Seguimiento / Cierre)
                        </div>
                        <span className="text-slate-400 font-bold text-xs shrink-0">➔</span>
                        <div className="px-3 py-2 rounded-xl border border-emerald-200 text-[10px] font-extrabold text-emerald-700 bg-emerald-50/50 shadow-xs">
                            🏆 Venta Ganada / Perdida
                        </div>
                    </div>
                </section>

                {/* Sección 4: Tipos de Llamadas (Nomenclatura) */}
                <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center gap-3 mb-5">
                        <PhoneOutgoing className="w-5.5 h-5.5 text-indigo-600" />
                        <h2 className="text-lg font-black text-slate-800">4. Tipos de Llamadas (Nomenclatura de Procesos)</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-6 font-medium">
                        Todas las llamadas e interacciones del CRM deben registrarse bajo la nomenclatura estricta de la metodología para mantener consistencia métrica:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Card S1 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-base">
                            📞
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <h4 className="text-xs font-extrabold text-blue-600">S1 - Cuadrante de Recuperación</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              Clientes inactivos en ciertos productos por más de 45 días.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-semibold">
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
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              Ofrecer productos complementarios basados en compras de clientes similares.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-semibold">
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
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              Llamada obligatoria post-cotización dentro de las primeras 24 horas (cobertura 100%).
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-semibold">
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
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              Llamada de cierre basada exactamente en la fecha de decisión acordada en F1.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-semibold">
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
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              Llamada de servicio para confirmar satisfacción en la entrega física del pedido.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-semibold">
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
                            <h4 className="text-xs font-extrabold text-amber-500">RC - Referencia / Testimonio</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              Pedir un referido o un testimonio en video/texto para mercadotecnia.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-semibold">
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
                            <h4 className="text-xs font-extrabold text-slate-600">PT - Contacto Personal</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              Llamada de mantenimiento de relación, 100% libre de agenda comercial.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-semibold">
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
                            <h4 className="text-xs font-extrabold text-slate-600">IN - Entrante (Reactiva)</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              El cliente inicia la llamada por dudas, compras o soporte reactivo.
                            </p>
                            <div className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] text-slate-600 font-semibold">
                              💡 Resuelve su duda, y antes de colgar realiza siempre venta cruzada (S2) o pregunta de McDonald's.
                            </div>
                          </div>
                        </div>

                      </div>
                </section>

                {/* Sección 5: El Secreto McDonald's */}
                <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-xl">🍔</span>
                        <h2 className="text-lg font-black text-slate-800">5. La Pregunta McDonald's</h2>
                    </div>
                    <div className="text-slate-600 leading-relaxed text-xs sm:text-sm space-y-4 font-medium">
                        <p>
                          Al terminar cualquier interacción B2B, es mandatorio que el asesor proactivo realice la pregunta de cierre de diagnóstico secundario:
                        </p>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-indigo-800 font-black text-center text-sm md:text-base my-2">
                          "¿Qué más le resulta difícil encontrar hoy en día que yo pueda localizar para usted?"
                        </div>
                        <p>
                          Esta simple frase desencadena que el cliente recuerde compras de baja rotación o productos complejos que asumía que no distribuías, abriendo oportunidades directas de venta inmediata.
                        </p>
                    </div>
                </section>

                {/* Sección 6: KPIs del Sistema */}
                <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center gap-3 mb-5">
                        <BarChart3 className="w-5.5 h-5.5 text-blue-600" />
                        <h2 className="text-lg font-black text-slate-800">6. Indicadores Clave de Rendimiento (KPIs)</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-3 items-start">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></span>
                            <div>
                                <h4 className="text-xs md:text-sm font-extrabold text-slate-800">Volumen Proactivo Diario</h4>
                                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Meta: 20 a 30 llamadas proactivas (S1 / S2) al día por vendedor. El ratio del departamento debe ser del 80% salientes y 20% entrantes.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2"></span>
                            <div>
                                <h4 className="text-xs md:text-sm font-extrabold text-slate-800">Generación de Oportunidades</h4>
                                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Meta: Al menos el 50% de las llamadas proactivas S1/S2 deben resultar en una cotización solicitada.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0 mt-2"></span>
                            <div>
                                <h4 className="text-xs md:text-sm font-extrabold text-slate-800">Seguimiento de Pipeline (F1/F2)</h4>
                                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Meta: Cobertura del 100% de las cotizaciones emitidas con llamada F1 (a las 24 horas) y al menos el 50% de llamadas F2 de cierre.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2"></span>
                            <div>
                                <h4 className="text-xs md:text-sm font-extrabold text-slate-800">Tasa de Cierre Comercial</h4>
                                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Meta: Al menos el 20% a 25% de todas las cotizaciones emitidas deben ser cerradas como Ganadas.</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default ManualMetodologia;
