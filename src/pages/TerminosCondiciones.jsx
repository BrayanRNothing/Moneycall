import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, Mail, Phone, MapPin, ArrowLeft, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';

const secciones = [
  {
    titulo: '1. Aceptación de los Términos de Servicio',
    contenido: [
      'Al acceder, registrarse o utilizar la plataforma CRMoneyCall (en adelante, "la plataforma" o "el servicio"), el usuario declara haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones de Uso.',
      'Si no estás de acuerdo con alguna de las cláusulas o políticas vigentes, deberás abstenerte de utilizar el sistema y notificarlo de inmediato al administrador de tu organización o cuenta corporativa.'
    ]
  },
  {
    titulo: '2. Identificación del Responsable y Naturaleza del Servicio',
    contenido: [
      'Titular de la plataforma: CRM DR Soluciones Comerciales / UP DM.',
      'Unidad responsable: Dirección de Tecnología, Cumplimiento Legal y Soporte Operativo.',
      'CRMoneyCall es un sistema avanzado de gestión comercial (CRM) diseñado para administrar prospectos, clientes, llamadas, embudos de venta, recordatorios, integraciones de mensajería y reportes de rendimiento operativo.'
    ]
  },
  {
    titulo: '3. Cuenta de Usuario, Seguridad y Credenciales',
    contenido: [
      'Cada cuenta de usuario asignada es personal e intransferible. El usuario es el único responsable del resguardo de sus credenciales de acceso (nombre de usuario, contraseña y tokens de autenticación).',
      'Queda estrictamente prohibido compartir accesos con terceros no autorizados, suplantar la identidad de otros miembros del equipo o eludir los mecanismos de seguridad y control de roles.',
      'Cualquier actividad sospechosa o acceso no autorizado debe ser reportado de inmediato a través de nuestros canales oficiales de contacto.'
    ]
  },
  {
    titulo: '4. Uso Permitido y Restricciones Operativas',
    contenido: [
      'El servicio debe utilizarse exclusivamente para fines comerciales legítimos y en estricto apego a las políticas de la organización contratante y las leyes aplicables.',
      'Queda expresamente prohibido: (a) la extracción masiva no autorizada de información (scraping); (b) la introducción de código malicioso o virus; (c) la alteración intencionada de bitácoras de auditoría; y (d) el uso de datos comerciales para fines ajenos a la operación legítima del CRM.'
    ]
  },
  {
    titulo: '5. Protecciones de Datos Personales y Confidencialidad',
    contenido: [
      'Toda la información capturada de prospectos, clientes y llamadas se trata bajo estrictos principios de confidencialidad, licitud, finalidad y proporcionalidad.',
      'El usuario u organización garante certifica que los datos registrados han sido recabados conforme a las leyes de protección de datos aplicables y contando con la base legal o consentimiento requerido.',
      'Aplicamos medidas de seguridad técnicas (cifrado en tránsito, segmentación por equipo) para proteger la información contra accesos no autorizados.'
    ]
  },
  {
    titulo: '6. Disponibilidad, Mantenimiento y Respaldos',
    contenido: [
      'Realizamos esfuerzos razonables y continuos para mantener la plataforma disponible las 24 horas del día, los 365 días del año. No obstante, no se garantiza una disponibilidad ininterrumpida del 100%.',
      'Pueden programarse ventanas de mantenimiento preventivo o correctivo, actualizaciones de infraestructura o experimentar interrupciones derivadas de proveedores de nube o causas de fuerza mayor.',
      'Se ejecutan respaldos automatizados de la base de datos de forma periódica para garantizar la integridad y recuperación de la información.'
    ]
  },
  {
    titulo: '7. Propiedad Intelectual y Licencia de Uso',
    contenido: [
      'Todos los derechos de propiedad intelectual sobre el código fuente, diseño de interfaz, marcas, logotipos, algoritmos e iconografía de CRMoneyCall pertenecen a su titular.',
      'Se concede una licencia limitada, no exclusiva e intransferible para usar la plataforma durante la vigencia de la suscripción o cuenta activa.'
    ]
  },
  {
    titulo: '8. Limitación de Responsabilidad',
    contenido: [
      'En la máxima medida permitida por la ley aplicable, CRMoneyCall no será responsable por pérdidas de oportunidad comercial, lucro cesante o daños indirectos derivados de interrupciones temporales o fallos de red ajenos a nuestro control directo.'
    ]
  },
  {
    titulo: '9. Actualizaciones y Modificaciones',
    contenido: [
      'Nos reservamos el derecho de actualizar los presentes Términos y Condiciones para adaptarlos a mejoras operativas, requisitos normativos o nuevas funcionalidades.',
      'Las modificaciones entrarán en vigor a partir de su fecha de publicación en esta página web oficial.'
    ]
  },
  {
    titulo: '10. Jurisdicción y Legislación Aplicable',
    contenido: [
      'Estos términos se rigen e interpretan bajo la legislación vigente en los Estados Unidos Mexicanos. Para la resolución de cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes en la ciudad de Monterrey, Nuevo León.'
    ]
  }
];

const metodosContacto = [
  {
    titulo: 'Correo de Soporte Técnico',
    valor: 'julio@updm.mx / brayan@updm.mx',
    href: 'mailto:julio@updm.mx,brayan@updm.mx',
    icon: Mail,
    detalle: 'Atención de incidencias técnicas, permisos de acceso y consultas operativas.'
  },
  {
    titulo: 'Atención Telefónica / WhatsApp',
    valor: '813 645 8366',
    href: 'https://wa.me/528136458366',
    icon: Phone,
    detalle: 'Lunes a viernes de 8:00 a.m. a 6:00 p.m. (Hora del Centro).'
  },
  {
    titulo: 'Formulario de Contacto',
    valor: 'Ir a formulario en línea',
    href: '/contacto',
    isInternalLink: true,
    icon: MessageSquare,
    detalle: 'Envía un ticket o consulta directa desde la plataforma.'
  },
  {
    titulo: 'Dirección Corporativa',
    valor: 'Av. Cumbres Elite 1310, Monterrey, N.L., México',
    href: null,
    icon: MapPin,
    detalle: 'Recepción de notificaciones oficiales en horario administrativo.'
  }
];

const TerminosCondiciones = () => {
  return (
    <div className="min-h-screen bg-slate-50/80 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Card Header Superior */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
                <FileText className="w-3.5 h-3.5 text-(--theme-600)" /> Documentación Legal Oficial
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Términos y Condiciones de Uso
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

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 sm:p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-950 leading-relaxed font-medium">
              <strong className="font-extrabold">Compromiso de confianza CRMoneyCall:</strong> Aplicamos estrictos controles de seguridad por roles, cifrado de datos y trazabilidad de actividades para salvaguardar tu operación comercial.
            </p>
          </div>
        </div>

        {/* Secciones de Términos */}
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

        {/* Canales Oficiales de Contacto */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">11. Canales Oficiales de Atención y Contacto</h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Para dudas legales, aclaraciones sobre el servicio o soporte técnico, puedes comunicarte por cualquiera de los siguientes medios verificados:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metodosContacto.map((metodo) => {
              const Icon = metodo.icon;
              return (
                <div key={metodo.titulo} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5 flex items-start gap-3.5">
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-(--theme-600) shrink-0 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{metodo.titulo}</p>
                    {metodo.isInternalLink ? (
                      <Link
                        to={metodo.href}
                        className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold text-(--theme-600) hover:text-(--theme-700) underline underline-offset-2"
                      >
                        {metodo.valor} <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : metodo.href ? (
                      <a
                        href={metodo.href}
                        target={metodo.href.startsWith('http') ? '_blank' : undefined}
                        rel={metodo.href.startsWith('http') ? 'noreferrer' : undefined}
                        className="mt-1 inline-block text-sm font-extrabold text-slate-900 hover:text-(--theme-600) underline underline-offset-2"
                      >
                        {metodo.valor}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm font-extrabold text-slate-900">{metodo.valor}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">{metodo.detalle}</p>
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
            <Link to="/politica-de-privacidad" className="hover:text-slate-900 transition-colors">Política de Privacidad</Link>
            <span>•</span>
            <Link to="/contacto" className="hover:text-slate-900 transition-colors">Contáctanos</Link>
          </div>
          <p>© 2026 CRMoneyCall. Todos los derechos reservados.</p>
        </div>

      </div>
    </div>
  );
};

export default TerminosCondiciones;
