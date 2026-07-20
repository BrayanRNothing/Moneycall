import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Phone, MapPin, ArrowLeft, MessageSquare, ExternalLink, Globe, Sparkles } from 'lucide-react';

const secciones = [
  {
    titulo: '1. Alcance y Compromiso de esta Política',
    contenido: [
      'Esta Política de Privacidad establece cómo CRMoneyCall (en adelante "la plataforma" o "el servicio") recopila, utiliza, almacena, procesa y protege la información personal y comercial.',
      'Esta política aplica a todos los usuarios registrados, prospectos, clientes e integrantes de las organizaciones que interactúan dentro del sistema.'
    ]
  },
  {
    titulo: '2. Responsable del Tratamiento de Datos',
    contenido: [
      'Entidad responsable: CRM DR Soluciones Comerciales / UP DM.',
      'Área encargada: Departamento de Privacidad, Seguridad e Infraestructura.',
      'Canales oficiales para dudas o derechos de privacidad: julio@updm.mx y brayan@updm.mx.'
    ]
  },
  {
    titulo: '3. Datos Personales y Operativos Recopilados',
    contenido: [
      'Datos de cuenta y perfil: nombre completo, correo electrónico corporativo, número de teléfono, contraseña cifrada, rol administrativo y equipo asignado.',
      'Datos de gestión comercial: registro de prospectos, clientes, llamadas, notas de seguimiento, etiquetas, empresas asociadas y estados del embudo.',
      'Datos de uso y auditoría: direcciones IP aproximadas, fechas y horas de inicio de sesión, eventos del sistema y bitácoras operativas para garantizar la seguridad.'
    ]
  },
  {
    titulo: '4. Uso de la API de Google y Datos de Google Calendar',
    contenido: [
      'Si autorizas la integración con Google Calendar, CRMoneyCall únicamente solicitará los permisos necesarios (OAuth 2.0) para sincronizar o agendar citas y llamadas comerciales.',
      'El uso y transferencia a cualquier otra aplicación de la información recibida a través de las APIs de Google se apegará estrictamente a la Política de Datos de Usuario de los Servicios de las APIs de Google (Google API Services User Data Policy), incluidos los requisitos de Uso Limitado.',
      'Los datos obtenidos de Google Calendar NUNCA se utilizan para fines publicitarios, perfilado de mercado externo ni se transfieren o venden a terceros.',
      'Puedes revocar el acceso en cualquier momento desde los ajustes de seguridad de tu cuenta de Google.'
    ]
  },
  {
    titulo: '5. Finalidades del Tratamiento de Datos',
    contenido: [
      'Administración eficiente de la cartera de prospectos y clientes, recordatorios de llamadas y seguimiento comercial.',
      'Mantenimiento de la estabilidad, auditoría de seguridad y prevención de fraudes o accesos no autorizados.',
      'Cumplimiento de obligaciones legales, fiscales y requerimientos de soporte técnico solicitados por la organización.'
    ]
  },
  {
    titulo: '6. Base Legal para el Tratamiento',
    contenido: [
      'Procesamos la información con base en la relación contractual del servicio, el consentimiento expreso del usuario al registrarse y el interés legítimo de mantener la seguridad operativa del CRM.'
    ]
  },
  {
    titulo: '7. Retención y Eliminación de Datos',
    contenido: [
      'Los datos se conservan únicamente durante el tiempo que la cuenta permanezca activa o según los plazos legales aplicables.',
      'Al cancelar o concluir el contrato del servicio, la organización puede solicitar la exportación o eliminación segura y definitiva de sus datos.'
    ]
  },
  {
    titulo: '8. Transferencia y Compartición con Terceros',
    contenido: [
      'No vendemos ni alquilamos datos personales a ninguna entidad externa.',
      'La información puede ser procesada por proveedores de infraestructura de nube (hosting cifrado, servidores de correo transaccional), bajo estrictas cláusulas de confidencialidad.'
    ]
  },
  {
    titulo: '9. Medidas de Seguridad de la Información',
    contenido: [
      'Implementamos controles de seguridad robustos: cifrado TLS/SSL en tránsito, autenticación mediante tokens seguros, segmentación de datos por equipo y monitoreo continuo contra vulnerabilidades.'
    ]
  },
  {
    titulo: '10. Derechos ARCO (Acceso, Rectificación, Cancelación u Oposición)',
    contenido: [
      'Como titular de los datos, tienes derecho a solicitar en cualquier momento el acceso, corrección, eliminación o limitación del uso de tu información personal.',
      'Para ejercer cualquiera de tus derechos ARCO, puedes enviar una solicitud formal al correo julio@updm.mx con tus datos de identificación.'
    ]
  },
  {
    titulo: '11. Cookies y Tecnologías de Almacenamiento Local',
    contenido: [
      'Utilizamos tokens de sesión y almacenamiento local estrictamente técnico para mantener tu sesión activa y recordar tus preferencias de tema o idioma dentro del CRM.'
    ]
  },
  {
    titulo: '12. Modificaciones a la Política de Privacidad',
    contenido: [
      'Nos reservamos el derecho de actualizar esta política. Cualquier cambio relevante se publicará directamente en este apartado con su fecha de revisión.'
    ]
  }
];

const contactosPrivacidad = [
  {
    titulo: 'Correo de Privacidad y Datos',
    valor: 'julio@updm.mx',
    href: 'mailto:julio@updm.mx',
    icon: Mail,
    detalle: 'Solicitudes de derechos ARCO, revocación de datos y consultas de privacidad.'
  },
  {
    titulo: 'Soporte Técnico',
    valor: 'brayan@updm.mx',
    href: 'mailto:brayan@updm.mx',
    icon: Mail,
    detalle: 'Asistencia técnica relacionada con la plataforma e integraciones.'
  },
  {
    titulo: 'Atención Telefónica / WhatsApp',
    valor: '813 645 8366',
    href: 'https://wa.me/528136458366',
    icon: Phone,
    detalle: 'Horario de lunes a viernes de 8:00 a.m. a 6:00 p.m.'
  },
  {
    titulo: 'Centro de Contacto Directo',
    valor: 'Formulario de Soporte',
    href: '/contacto',
    isInternalLink: true,
    icon: MessageSquare,
    detalle: 'Envía un mensaje directo a nuestro equipo técnico.'
  }
];

const PoliticaPrivacidad = () => {
  return (
    <div className="min-h-screen bg-slate-50/80 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Card Header Superior */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> Protección de Datos & Transparencia
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Política de Privacidad
              </h1>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Última actualización y revisión normativa: <span className="font-bold text-slate-800">2026</span>
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Volver al Inicio
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 sm:p-5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-950 leading-relaxed font-medium">
              <strong className="font-extrabold">Uso limitado de datos de Google Calendar:</strong> La integración con Google Calendar solo se utiliza para gestionar tus eventos y llamadas agendadas en el CRM. Nunca vendemos ni compartimos tus datos con terceros para publicidad.
            </p>
          </div>
        </div>

        {/* Secciones de Privacidad */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          {secciones.map((seccion) => (
            <section key={seccion.titulo} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6 hover:bg-slate-50 transition-colors">
              <h2 className="text-base sm:text-lg font-black text-slate-900">{seccion.titulo}</h2>
              <div className="mt-3 space-y-2.5">
                {seccion.contenido.map((parrafo) => (
                  <p key={parrafo} className="text-sm text-slate-600 leading-relaxed font-normal">
                    {parrafo}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Canales Oficiales de Privacidad */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">13. Canales para Derechos ARCO y Soporte</h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Si deseas ejercer tus derechos de acceso, rectificación, cancelación u oposición de datos, utiliza los canales directos:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactosPrivacidad.map((contacto) => {
              const Icon = contacto.icon;
              return (
                <div key={contacto.titulo} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5 flex items-start gap-3.5">
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-blue-600 shrink-0 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{contacto.titulo}</p>
                    {contacto.isInternalLink ? (
                      <Link
                        to={contacto.href}
                        className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                      >
                        {contacto.valor} <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <a
                        href={contacto.href}
                        target={contacto.href.startsWith('http') ? '_blank' : undefined}
                        rel={contacto.href.startsWith('http') ? 'noreferrer' : undefined}
                        className="mt-1 inline-block text-sm font-extrabold text-slate-900 hover:text-blue-600 underline underline-offset-2"
                      >
                        {contacto.valor}
                      </a>
                    )}
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">{contacto.detalle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Nav Links */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200/60 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:text-slate-900 transition-colors">Volver al Login</Link>
            <span>•</span>
            <Link to="/terminos-y-condiciones" className="hover:text-slate-900 transition-colors">Términos y Condiciones</Link>
            <span>•</span>
            <Link to="/contacto" className="hover:text-slate-900 transition-colors">Contáctanos</Link>
          </div>
          <p>© 2026 CRMoneyCall. Todos los derechos reservados.</p>
        </div>

      </div>
    </div>
  );
};

export default PoliticaPrivacidad;
