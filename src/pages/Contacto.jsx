import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2, ArrowLeft, ShieldCheck, Globe, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const canalesContacto = [
  {
    titulo: 'Correo Electrónico de Soporte',
    valor: 'julio@updm.mx / brayan@updm.mx',
    href: 'mailto:julio@updm.mx,brayan@updm.mx',
    icon: Mail,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    detalle: 'Atención prioritaria de dudas técnicas, soporte de plataforma y consultas operativas.'
  },
  {
    titulo: 'Teléfono y WhatsApp Directo',
    valor: '813 645 8366',
    href: 'https://wa.me/528136458366',
    icon: Phone,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    detalle: 'Atención telefónica y asistencia vía WhatsApp en tiempo real.'
  },
  {
    titulo: 'Horario de Atención',
    valor: 'Lunes a Viernes (8:00 AM - 6:00 PM)',
    href: null,
    icon: Clock,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    detalle: 'Horario administrativo y técnico (Hora del Centro de México / GMT-6).'
  },
  {
    titulo: 'Oficinas Administrativas',
    valor: 'Av. Cumbres Elite 1310, Monterrey, N.L., México',
    href: null,
    icon: MapPin,
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    detalle: 'Recepción de correspondencia formal y notificaciones corporativas.'
  }
];

const Contacto = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    empresa: '',
    asunto: 'Soporte Técnico',
    mensaje: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.correo.trim() || !formData.mensaje.trim()) {
      toast.error('Por favor completa los campos obligatorios (*)');
      return;
    }

    setEnviando(true);

    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      toast.success('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo a la brevedad.');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Header de la Página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-(--theme-50) text-(--theme-700) text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Centro de Atención & Soporte
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Contáctanos
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium max-w-2xl">
              ¿Tienes alguna duda, requerimiento especial o necesitas asistencia técnica con la plataforma? Estamos listos para ayudarte.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Inicio
            </Link>
          </div>
        </div>

        {/* Grid Principal: Formulario + Canales */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Formulario de Contacto (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-(--theme-600)" />
                  Envíanos un mensaje
                </h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formulario directo</span>
              </div>

              {enviado ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">¡Mensaje Recibido!</h3>
                  <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                    Hemos registrado tu consulta correctamente. Un asesor o especialista técnico se comunicará al correo <span className="font-bold text-slate-800">{formData.correo}</span> a la brevedad.
                  </p>
                  <button
                    onClick={() => {
                      setEnviado(false);
                      setFormData({ nombre: '', correo: '', telefono: '', empresa: '', asunto: 'Soporte Técnico', mensaje: '' });
                    }}
                    className="mt-4 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Nombre completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej. Juan Pérez"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-500) transition-all bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Correo electrónico <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        placeholder="juan@empresa.com"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-500) transition-all bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Ej. 81 1234 5678"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-500) transition-all bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Empresa / Organización
                      </label>
                      <input
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        placeholder="Nombre de tu empresa"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-500) transition-all bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Asunto de la consulta
                    </label>
                    <select
                      name="asunto"
                      value={formData.asunto}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-500) transition-all bg-slate-50/50 font-medium text-slate-700"
                    >
                      <option value="Soporte Técnico">Soporte Técnico y Asistencia</option>
                      <option value="Información Comercial">Información Comercial y Planes</option>
                      <option value="Privacidad y Datos">Privacidad y Protección de Datos</option>
                      <option value="Facturación y Pagos">Facturación y Pagos</option>
                      <option value="Otro">Otro Asunto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mensaje o Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="mensaje"
                      rows={4}
                      value={formData.mensaje}
                      onChange={handleChange}
                      placeholder="Escribe aquí los detalles de tu consulta o mensaje..."
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-500) transition-all bg-slate-50/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-(--theme-600) text-white font-bold text-sm hover:bg-(--theme-700) disabled:opacity-50 transition-all shadow-md cursor-pointer"
                  >
                    {enviando ? (
                      <span>Enviando mensaje...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Mensaje</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Columna Derecha: Canales Oficiales y Políticas (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-(--theme-600)" />
                Canales Oficiales
              </h2>

              <div className="space-y-4">
                {canalesContacto.map((canal) => {
                  const Icon = canal.icon;
                  return (
                    <div key={canal.titulo} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl border ${canal.color} shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{canal.titulo}</p>
                          {canal.href ? (
                            <a
                              href={canal.href}
                              target={canal.href.startsWith('http') ? '_blank' : undefined}
                              rel={canal.href.startsWith('http') ? 'noreferrer' : undefined}
                              className="text-sm font-extrabold text-slate-900 hover:text-(--theme-600) transition-colors mt-0.5 block underline underline-offset-2"
                            >
                              {canal.valor}
                            </a>
                          ) : (
                            <p className="text-sm font-extrabold text-slate-900 mt-0.5">{canal.valor}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{canal.detalle}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card de Enlaces Legales */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Garantía de Transparencia
                </div>
                <h3 className="text-lg font-bold">Documentación Legal & Privacidad</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conoce cómo protegemos tus datos y las condiciones de servicio aplicables al uso de la plataforma CRM.
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/terminos-y-condiciones"
                    className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors border border-slate-700"
                  >
                    <span>Términos y Condiciones de Uso</span>
                    <span>→</span>
                  </Link>
                  <Link
                    to="/politica-de-privacidad"
                    className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors border border-slate-700"
                  >
                    <span>Política de Privacidad</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Contacto;
