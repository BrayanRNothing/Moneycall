import { useEffect } from 'react';
import { useBotStore } from '../store/useBotStore';
import { useNavigate, useLocation } from 'react-router-dom';

export const useMoneycallBotLogic = () => {
  const { setCurrentStep, setAvatarState, closeBot, isOpen, currentStep, setBotActions } = useBotStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setBotActions({
      stepSelectProspectAfterCreation,
      stepContactMethod,
      stepGoToProspects,
      stepCreateProspect,
      stepCreateProspectSurnames,
      stepCreateProspectSurnameMaterno,
      stepCreateProspectPhone,
      stepCreateProspectEmails,
      stepCreateProspectCompany,
      stepCreateProspectWebsite,
      stepCreateProspectLocation,
      stepCreateProspectNotes,
      stepCreateProspectSource,
      stepCreateProspectConfirm,
      stepTourDetailInteres,
      stepTourDetailValor,
      stepTourDetailMetricas,
      stepTourDetailContactoRapido,
      stepTourDetailAccionesLlamada,
      stepTourDetailRecordatoriosLista,
      stepTourDetailNotes,
      stepTourDetailModulosExtras,
      stepTourDetailHistorial,
      stepTourDetailCierre,
      stepTourDetailCierreOptions,
      // Flujo interactivo de registro de llamada
      stepCallRegistrationIntro,
      stepCallModalContesto,
      stepCallOpcionesContesto,
      stepCallAskClose,
      stepCallRegistrationDone,
      // Clientes actions

      // Nuevas acciones de contexto
      stepDashboardIntro,
      stepCalendarioIntro,
      stepCalendarioAgendar,
      stepCalendarioGuiaRapida,
      stepCalendarioGuiaRapidaPaso2,
      stepEquipoIntro,
      stepEquipoAgregar,
      stepEquipoRoles,
      stepManualIntro,
      stepProspectosGuiaRapida,
      stepProspectosGuiaRapida3,
      stepOtrasFunciones,
      greetingProspectoDetalle,
      stepClientesGuiaRapida,
      stepClientesGuiaRapida2,
      greetingClienteDetalle,
      stepPreguntarExplicacionClientes,
      stepTourBotonesAccionClientes,
      stepTourDetailCliente,
      stepTourDetailAlertasCliente
    });
    return () => {
      setBotActions({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startConversation = () => {
    setAvatarState('talking');
    const path = location.pathname;

    if (path.includes('/clientes')) {
      if (document.getElementById('detalle-cliente-acciones-contacto')) {
        greetingClienteDetalle();
      } else {
        setCurrentStep({
          id: 'greeting_clientes',
          text: '¡Hola! Te guiaré en la gestión de tus clientes ganados. ¿Qué deseas hacer hoy?',
          options: [
            { label: 'Tomar guía rápida', action: () => stepClientesGuiaRapida() },
            { label: 'Dar seguimiento a un cliente', action: () => stepGoToClientes() },
            { label: 'Otras funciones (Próximamente)', action: () => stepOtrasFunciones() },
            { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
          ]
        });
      }
    } else if (path.includes('/calendario')) {
      stepCalendarioIntro();
    } else if (path.includes('/equipo') || path.includes('/usuarios')) {
      stepEquipoIntro();
    } else if (path.includes('/manual')) {
      stepManualIntro();
    } else if (path.includes('/prospectos')) {
      if (document.getElementById('detalle-prospecto-interes')) {
        greetingProspectoDetalle();
      } else {
        setCurrentStep({
          id: 'greeting_prospectos',
          text: '¡Hola! Te guiaré en la gestión de tus prospectos paso a paso. ¿Qué deseas hacer primero?',
          options: [
            { label: 'Tomar guía rápida', action: () => stepProspectosGuiaRapida() },
            { label: 'Dar seguimiento y cerrar', action: () => stepGoToProspects() },
            { label: 'Otras funciones (Próximamente)', action: () => stepOtrasFunciones() },
            { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
          ]
        });
      }
    } else if (path.includes('/admin')) {
      setCurrentStep({
        id: 'greeting_admin',
        text: '¡Hola! Bienvenido al Panel de Administración. Aquí puedes gestionar los propietarios de equipo, revisar los usuarios de cada equipo y realizar configuraciones del sistema.',
        options: [
          { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
        ]
      });
    } else if (path.includes('/monitoreo')) {
      setCurrentStep({
        id: 'greeting_monitoreo',
        text: '¡Hola! Bienvenido al panel de Monitoreo de Equipo. Aquí puedes ver el rendimiento de tu equipo, actividades recientes y métricas clave en tiempo real.',
        options: [
          { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
        ]
      });
    } else if (path.includes('/asignar')) {
      setCurrentStep({
        id: 'greeting_asignar',
        text: '¡Hola! Bienvenido al panel de Asignación. Aquí puedes registrar prospectos y asignarlos directamente a los vendedores del sistema.',
        options: [
          { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
        ]
      });
    } else {
      // Dashboard o fallback
      setCurrentStep({
        id: 'greeting_dashboard',
        text: '¡Hola! Bienvenido al panel principal (Dashboard). Como tu asistente, mi tarea es ayudarte a navegar y sacarle provecho al sistema. ¿Qué te gustaría hacer?',
        options: [
          { label: 'Conocer el Dashboard', action: () => stepDashboardIntro() },
          { label: 'Ir a Prospectos', action: () => { navigate('/vendedor/prospectos'); setTimeout(startConversation, 300); } },
          { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
        ]
      });
    }
  };

  const stepLearnSection = () => {
    setCurrentStep({
      id: 'learn_section',
      text: '¡Genial! Esta sección cuenta con herramientas muy útiles. ¿De cuál te gustaría aprender hoy?',
      options: [
        { label: '📉 Etapas del Embudo', action: () => stepExplainEtapas1() },
        { label: '🔍 Filtros y Búsqueda', action: () => stepExplainFilters() },
        { label: '👥 Compartir Prospectos', action: () => stepExplainSharing() },
        { label: '📄 Importar y Exportar CSV', action: () => stepExplainCsv() },
        { label: 'Volver al inicio', action: () => startConversation() }
      ]
    });
  };

  const stepLearnSectionClientes = () => {
    setCurrentStep({
      id: 'learn_section_clientes',
      text: '¡Genial! Esta sección cuenta con herramientas muy útiles. ¿De cuál te gustaría aprender hoy?',
      options: [
        { label: '🔍 Filtros y Búsqueda', action: () => stepExplainFiltersClientes() },
        { label: '📄 Importar/Exportar CSV', action: () => stepExplainCsvClientes() },
        { label: '➕ Crear Cliente', action: () => stepExplainCrearCliente() },
        { label: 'Volver al inicio', action: () => startConversation() }
      ]
    });
  };

  // --- CLIENTES GUIA RAPIDA Y SEGUIMIENTO ---
  const stepClientesGuiaRapida = () => {
    setCurrentStep({
      id: 'clientes_guia_1',
      text: 'Primero, puedes crear clientes manualmente usando este botón de "Crear cliente".',
      targetSelector: '#btn-crear-cliente',
      options: [
        { label: 'Siguiente', action: () => stepClientesGuiaRapida2() },
        { label: 'Cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepClientesGuiaRapida2 = () => {
    setCurrentStep({
      id: 'clientes_guia_2',
      text: 'Aquí tienes los filtros y la barra de búsqueda para encontrar fácilmente a cualquier cliente y organizarlos.',
      targetSelector: '#seccion-filtros-busqueda-clientes',
      options: [
        { label: '¡Entendido, terminar guía!', action: () => startConversation() }
      ]
    });
  };

  const greetingClienteDetalle = () => {
    setCurrentStep({
      id: 'greeting_cliente_detalle',
      text: 'Estás viendo el detalle de un cliente. ¿Qué te gustaría explorar en este panel?',
      options: [
        { label: 'Recorrido rápido del panel', action: () => stepTourDetailCliente() },
        { label: 'Explicar botones de acción', action: () => stepTourBotonesAccionClientes() },
        { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
      ]
    });
  };

  const stepGoToClientes = () => {
    navigate('/vendedor/clientes');
    setCurrentStep({
      id: 'goto_clientes',
      text: 'Primero, selecciona cualquier cliente de la lista dándole clic para ver su información detallada. Si no ves a ninguno, crea uno nuevo primero.',
      options: [
        { label: 'Omitir y cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepPreguntarExplicacionClientes = () => {
    setCurrentStep({
      id: 'preguntar_explicacion_clientes',
      text: '¡Excelente! Has abierto el panel detallado del cliente. ¿Quieres un recorrido rápido para entender el panel o prefieres que te explique directamente los botones de acción?',
      options: [
        { label: 'Recorrido rápido del panel', action: () => stepTourDetailCliente() },
        { label: 'Explicar botones de acción', action: () => stepTourBotonesAccionClientes() },
        { label: 'Omitir y cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepTourBotonesAccionClientes = () => {
    setCurrentStep({
      id: 'tour_botones_accion_clientes',
      text: 'Estos son los botones principales para dar seguimiento a tus clientes:\n\n📞 **Interacción**: Guarda un resumen de su contacto.\n📅 **Cita**: Crea una reunión en el calendario.\n⏰ **Recordatorio**: Para que te notifique contactarlo después.',
      targetSelector: '#detalle-cliente-acciones-seguimiento',
      options: [
        { label: '¡Entendido, cerrar!', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailCliente = () => {
    setCurrentStep({
      id: 'tour_detail_cliente',
      text: '¡Genial! Este es el detalle del cliente. En esta zona tienes opciones de contacto rápido para mandarle WhatsApp, Correo o usar plantillas.',
      targetSelector: '#detalle-cliente-acciones-contacto',
      options: [
        { label: 'Siguiente: Alertas', action: () => stepTourDetailAlertasCliente() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailAlertasCliente = () => {
    setCurrentStep({
      id: 'tour_detail_alertas_cliente',
      text: 'Aquí se mostrarán las alertas importantes sobre el cliente. Además, más abajo tienes el historial de compras y diagnósticos. ¡Explóralo a tu ritmo!',
      targetSelector: '#detalle-cliente-alertas',
      options: [
        { label: 'Terminar recorrido', action: () => startConversation() }
      ]
    });
  };

  // --- PROSPECTOS GUIA RAPIDA ---
  const stepProspectosGuiaRapida = () => {
    setCurrentStep({
      id: 'prospectos_guia_1',
      text: 'Primero, puedes crear prospectos manualmente usando este botón de "Crear prospecto".',
      targetSelector: '#btn-crear-prospecto',
      options: [
        { label: 'Siguiente', action: () => stepProspectosGuiaRapida2() },
        { label: 'Cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepProspectosGuiaRapida2 = () => {
    setCurrentStep({
      id: 'prospectos_guia_2',
      text: 'En esta área tienes los filtros y la barra de búsqueda para encontrar fácilmente a cualquier prospecto y organizarlos por etapa.',
      targetSelector: '#seccion-filtros-busqueda',
      options: [
        { label: 'Siguiente', action: () => stepProspectosGuiaRapida3() },
        { label: 'Cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepProspectosGuiaRapida3 = () => {
    setCurrentStep({
      id: 'prospectos_guia_3',
      text: 'Finalmente, cada prospecto tiene un botón para hacerlo Público o Privado. Si lo pones como Compartido, tus compañeros de equipo también podrán interactuar y ayudar en el seguimiento.',
      targetSelector: '.btn-compartir-prospecto',
      options: [
        { label: '¡Entendido, terminar guía!', action: () => startConversation() }
      ]
    });
  };

  const stepOtrasFunciones = () => {
    setCurrentStep({
      id: 'otras_funciones',
      text: 'Próximamente agregaremos más funciones y atajos increíbles aquí. ¡Mantente atento a las actualizaciones!',
      options: [
        { label: 'Volver', action: () => startConversation() }
      ]
    });
  };

  // --- DASHBOARD STEPS ---
  // --- DASHBOARD STEPS ---
  const stepDashboardIntro = () => {
    setCurrentStep({
      id: 'dashboard_intro',
      text: 'Este es tu Embudo de Ventas. Aquí puedes ver de forma gráfica y en tiempo real el flujo de tus leads desde la Entrada hasta el Cierre de ventas, junto con los porcentajes de conversión de cada etapa.',
      targetSelector: '#dashboard-funnel-container',
      options: [
        { label: 'Siguiente: Filtros de Período', action: () => stepDashboardPeriodos() },
        { label: 'Cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepDashboardPeriodos = () => {
    setCurrentStep({
      id: 'dashboard_periodos',
      text: 'Con estos botones de Filtro, puedes segmentar las métricas de tu embudo y ver el desempeño por Hoy, esta Semana o el Mes en curso. ¡Así tienes el control absoluto de tus números en tiempo real!',
      targetSelector: '#dashboard-period-selector',
      options: [
        { label: 'Siguiente: KPIs Operativos', action: () => stepDashboardKpis() },
        { label: 'Atrás', action: () => stepDashboardIntro() },
        { label: 'Cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepDashboardKpis = () => {
    setCurrentStep({
      id: 'dashboard_kpis',
      text: 'En esta sección de Salud Operativa vigilamos tu eficiencia comercial. Medimos tu Velocidad de Respuesta, Tasa de Asistencia a reuniones (show-up), Ciclo de Cierre en días y el Ticket Promedio.',
      targetSelector: '#dashboard-kpi-cards',
      options: [
        { label: 'Siguiente: Agenda Prioritaria', action: () => stepDashboardAgenda() },
        { label: 'Atrás', action: () => stepDashboardPeriodos() },
        { label: 'Cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepDashboardAgenda = () => {
    setCurrentStep({
      id: 'dashboard_agenda',
      text: 'Aquí tienes la Agenda Prioritaria. Te muestra tus próximos compromisos de reuniones y citas de ventas del día para que nunca dejes de asistir a un cliente.',
      targetSelector: '#dashboard-agenda-prioritaria',
      options: [
        { label: 'Siguiente: Tareas Críticas', action: () => stepDashboardTareas() },
        { label: 'Atrás', action: () => stepDashboardKpis() },
        { label: 'Cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepDashboardTareas = () => {
    setCurrentStep({
      id: 'dashboard_tareas',
      text: 'Por último, este es el panel de Tareas Críticas de tu equipo. Te ayuda a recordar y ejecutar los pendientes de alta prioridad en tu día a día comercial.',
      targetSelector: '#dashboard-tareas-criticas',
      options: [
        { label: 'Finalizar Recorrido', action: () => startConversation() },
        { label: 'Atrás', action: () => stepDashboardAgenda() }
      ]
    });
  };

  // --- CALENDARIO STEPS ---
  const stepCalendarioIntro = () => {
    setCurrentStep({
      id: 'calendario_intro',
      text: 'En el Calendario puedes gestionar tus citas, reuniones y recordatorios. Además, si lo vinculas, sincronizará directamente con tu Google Calendar. ¿Sobre qué te gustaría aprender?',
      options: [
        { label: 'Tomar guía rápida (Agendar)', action: () => stepCalendarioGuiaRapida() },
        { label: 'Aprender más', action: () => stepCalendarioAgendar() },
        { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
      ]
    });
  };

  const stepCalendarioGuiaRapida = () => {
    setCurrentStep({
      id: 'calendario_guia_rapida',
      text: '¡Perfecto! Para empezar, haz clic en la pestaña "Agendar" que estoy resaltando arriba del panel.',
      targetSelector: '#btn-calendario-agendar-tab',
      options: [
        { label: 'Ya le di clic', action: () => stepCalendarioGuiaRapidaPaso2() },
        { label: 'Cancelar guía', action: () => startConversation() }
      ]
    });
  };

  const stepCalendarioGuiaRapidaPaso2 = () => {
    setCurrentStep({
      id: 'calendario_guia_rapida_paso2',
      text: '¡Muy bien! Ahora, busca y selecciona al prospecto o cliente en la barra de búsqueda, elige la fecha en el calendario y oprime el botón azul de agendar.',
      options: [
        { label: 'Entendido, ¡gracias!', action: () => startConversation() }
      ]
    });
  };

  const stepCalendarioAgendar = () => {
    setCurrentStep({
      id: 'calendario_agendar',
      text: 'Para agendar, puedes usar el botón "Agendar" en el panel o hacer clic sobre cualquier día en el calendario de la izquierda. Es importante asociar la reunión a un prospecto o cliente para que quede en su perfil.',
      options: [
        { label: 'Entendido', action: () => startConversation() }
      ]
    });
  };

  // --- EQUIPO STEPS ---
  const stepEquipoIntro = () => {
    setCurrentStep({
      id: 'equipo_intro',
      text: 'Esta es la sección de Equipo. Aquí puedes ver a tus compañeros de trabajo o gestionar accesos si eres el administrador. ¿Qué quieres explorar?',
      options: [
        { label: 'Agregar un miembro', action: () => stepEquipoAgregar() },
        { label: 'Roles y permisos', action: () => stepEquipoRoles() },
        { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
      ]
    });
  };

  const stepEquipoAgregar = () => {
    setCurrentStep({
      id: 'equipo_agregar',
      text: 'Para dar de alta a alguien, usa el botón "AGREGAR MIEMBRO" arriba a la derecha. Te pedirá su Nombre, Usuario y Contraseña. Inmediatamente el sistema le dará acceso como Vendedor.',
      options: [
        { label: 'Volver', action: () => stepEquipoIntro() }
      ]
    });
  };

  const stepEquipoRoles = () => {
    setCurrentStep({
      id: 'equipo_roles',
      text: 'El sistema cuenta con los siguientes roles clave:\n\n👑 **Dueño de Equipo (Owner)**: Gestiona la configuración, las fórmulas de ventas y supervisa todo el equipo.\n💼 **Asignador**: Registra prospectos y los distribuye equitativamente entre los vendedores.\n👥 **Vendedor**: Gestiona su cartera de clientes, realiza llamadas de seguimiento y cierra ventas.\n🛡️ **Admin Root**: Administrador global del sistema con control total de propietarios y configuraciones.',
      options: [
        { label: 'Volver', action: () => stepEquipoIntro() }
      ]
    });
  };

  // --- MANUAL STEPS ---
  const stepManualIntro = () => {
    setCurrentStep({
      id: 'manual_intro',
      text: 'Bienvenido al Manual. Aquí encontrarás la Metodología comercial paso a paso, incluyendo el guion de llamadas y las 5 preguntas de diagnóstico. Te recomiendo leerlo completo para cerrar más ventas.',
      options: [
        { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
      ]
    });
  };

  const stepExplainFiltersClientes = () => {
    setCurrentStep({
      id: 'explain_filters_clientes',
      text: 'Aquí tienes el panel de filtros y búsqueda rápida para clientes. Te permite buscar por nombre o empresa, o filtrar por visibilidad (propios o compartidos) y por recordatorios pendientes.',
      targetSelector: '#seccion-filtros-busqueda-clientes',
      options: [
        { label: 'Ver otras explicaciones', action: () => stepLearnSectionClientes() },
        { label: 'Entendido', action: () => startConversation() }
      ]
    });
  };

  const stepExplainCsvClientes = () => {
    setCurrentStep({
      id: 'explain_csv_clientes',
      text: 'Los botones de importación y exportación de CSV te permiten transferir clientes de forma masiva. Puedes cargar una base externa utilizando un archivo CSV, o descargar la lista actual de clientes.',
      targetSelector: '#btn-importar-csv-clientes',
      options: [
        { label: 'Ver otras explicaciones', action: () => stepLearnSectionClientes() },
        { label: 'Entendido', action: () => startConversation() }
      ]
    });
  };

  const stepExplainCrearCliente = () => {
    setCurrentStep({
      id: 'explain_crear_cliente',
      text: 'Este botón te permite abrir el formulario para registrar un nuevo cliente ganado de forma manual ingresando sus datos.',
      targetSelector: '#btn-crear-cliente',
      options: [
        { label: 'Ver otras explicaciones', action: () => stepLearnSectionClientes() },
        { label: 'Entendido', action: () => startConversation() }
      ]
    });
  };



  const stepExplainEtapas1 = () => {
    setCurrentStep({
      id: 'explain_etapas_1',
      text: '**Etapas y Filtros (1/2)**\n\n⚪ **No contactado** → Prospecto nuevo sin ningún intento de llamada.\n🔴 **Sin contacto** → Se registró llamada pero no contestó (sin respuesta).\n🔵 **En contacto** → Ya se estableció comunicación iniciada.\n📅 **Cita agendada** → Se programó una reunión o llamada futura.',
      targetSelector: '#seccion-filtros-etapa',
      options: [
        { label: 'Siguiente: etapas 5-8 →', action: () => stepExplainEtapas2() },
        { label: 'Volver', action: () => stepLearnSection() }
      ]
    });
  };

  const stepExplainEtapas2 = () => {
    setCurrentStep({
      id: 'explain_etapas_2',
      text: '**Etapas y Filtros (2/2)**\n\n✅ **Cita realizada** → La reunión ya se llevó a cabo.\n🟡 **Negociación** → Se están discutiendo propuestas/términos.\n🏆 **Venta ganada** → ¡Cerró con éxito! Listo para pasar a cliente.\n🗑️ **Perdido** → Prospecto descartado o rechazado.\n\nPuedes usar los **filtros de arriba** para ver prospectos por cada etapa.',
      targetSelector: '#seccion-filtros-etapa',
      options: [
        { label: '← Anterior: etapas 1-4', action: () => stepExplainEtapas1() },
        { label: 'Ver otras explicaciones', action: () => stepLearnSection() },
        { label: 'Entendido', action: () => startConversation() }
      ]
    });
  };

  const stepExplainFilters = () => {
    setCurrentStep({
      id: 'explain_filters',
      text: 'Aquí tienes el panel de filtros y búsqueda rápida. Te permite buscar prospectos por nombre/empresa, o filtrar por visibilidad (propios o compartidos) y etapas del embudo en el que se encuentran.',
      targetSelector: '#seccion-filtros-busqueda',
      options: [
        { label: 'Ver otras explicaciones', action: () => stepLearnSection() },
        { label: 'Entendido', action: () => startConversation() }
      ]
    });
  };

  const stepExplainSharing = () => {
    setCurrentStep({
      id: 'explain_sharing',
      text: 'Este botón te permite cambiar el estado de privacidad del prospecto. Al marcarlo como "Compartido", tus compañeros de equipo Closer podrán verlo y ayudarte en el seguimiento del cliente.',
      targetSelector: '.btn-compartir-prospecto',
      options: [
        { label: 'Ver otras explicaciones', action: () => stepLearnSection() },
        { label: 'Entendido', action: () => startConversation() }
      ]
    });
  };

  const stepExplainCsv = () => {
    setCurrentStep({
      id: 'explain_csv',
      text: 'Los botones de importación y exportación de CSV te permiten transferir datos de forma masiva. Puedes cargar una base externa utilizando un archivo CSV, o descargar la lista actual de prospectos en Excel/CSV.',
      targetSelector: '#btn-importar-csv',
      options: [
        { label: 'Ver otras explicaciones', action: () => stepLearnSection() },
        { label: 'Entendido', action: () => startConversation() }
      ]
    });
  };

  const stepCreateProspect = () => {
    navigate('/vendedor/prospectos');
    setCurrentStep({
      id: 'create_prospect',
      text: '¡Estupendo! Te he llevado a la sección de Prospectos y te he abierto el formulario. Primero, introduce el Nombre. Recuerda que el Nombre es obligatorio.',
      targetSelector: '#crear-prospecto-nombres',
      options: [
        { label: 'Siguiente: Apellidos', action: () => stepCreateProspectSurnames() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectSurnames() }
      ]
    });
  };

  const stepCreateProspectSurnames = () => {
    setCurrentStep({
      id: 'create_prospect_surnames',
      text: 'Ahora introduce el Apellido Paterno del prospecto.',
      targetSelector: '#crear-prospecto-apellido-paterno',
      options: [
        { label: 'Siguiente: Apellido Materno', action: () => stepCreateProspectSurnameMaterno() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectSurnameMaterno() }
      ]
    });
  };

  const stepCreateProspectSurnameMaterno = () => {
    setCurrentStep({
      id: 'create_prospect_surname_materno',
      text: 'Ahora introduce el Apellido Materno del prospecto.',
      targetSelector: '#crear-prospecto-apellido-materno',
      options: [
        { label: 'Siguiente: Teléfonos', action: () => stepCreateProspectPhone() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectPhone() }
      ]
    });
  };

  const stepCreateProspectPhone = () => {
    setCurrentStep({
      id: 'create_prospect_phone',
      text: 'Aquí va el Teléfono principal. Si necesitas agregar más números de contacto, haz clic en "+ Añadir otro".',
      targetSelector: '#crear-prospecto-telefonos-0',
      options: [
        { label: 'Siguiente: Correos', action: () => stepCreateProspectEmails() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectEmails() }
      ]
    });
  };

  const stepCreateProspectEmails = () => {
    setCurrentStep({
      id: 'create_prospect_emails',
      text: 'Escribe el Correo electrónico. Puedes registrar múltiples correos para este prospecto pulsando en "+ Añadir otro".',
      targetSelector: '#crear-prospecto-correos-0',
      options: [
        { label: 'Siguiente: Empresa', action: () => stepCreateProspectCompany() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectCompany() }
      ]
    });
  };

  const stepCreateProspectCompany = () => {
    setCurrentStep({
      id: 'create_prospect_company',
      text: 'Introduce el Nombre de la Empresa en la que labora el prospecto.',
      targetSelector: '#crear-prospecto-empresa',
      options: [
        { label: 'Siguiente: Sitio Web', action: () => stepCreateProspectWebsite() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectWebsite() }
      ]
    });
  };

  const stepCreateProspectWebsite = () => {
    setCurrentStep({
      id: 'create_prospect_website',
      text: 'Escribe el Sitio Web de la empresa o del prospecto.',
      targetSelector: '#crear-prospecto-sitio-web',
      options: [
        { label: 'Siguiente: Ubicación', action: () => stepCreateProspectLocation() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectLocation() }
      ]
    });
  };

  const stepCreateProspectLocation = () => {
    setCurrentStep({
      id: 'create_prospect_location',
      text: 'Indica la Ubicación o dirección de contacto si dispones de ella.',
      targetSelector: '#crear-prospecto-ubicacion',
      options: [
        { label: 'Siguiente: Notas', action: () => stepCreateProspectNotes() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectNotes() }
      ]
    });
  };

  const stepCreateProspectNotes = () => {
    setCurrentStep({
      id: 'create_prospect_notes',
      text: 'Escribe cualquier detalle o nota relevante sobre el prospecto en esta sección.',
      targetSelector: '#crear-prospecto-notas',
      options: [
        { label: 'Siguiente: Fuente', action: () => stepCreateProspectSource() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectSource() }
      ]
    });
  };

  const stepCreateProspectSource = () => {
    setCurrentStep({
      id: 'create_prospect_source',
      text: 'Selecciona el canal de procedencia o fuente de donde proviene este prospecto (ej. WhatsApp, Facebook Ads, Google Ads, etc.).',
      targetSelector: '#crear-prospecto-fuente',
      options: [
        { label: 'Siguiente: Guardar', action: () => stepCreateProspectConfirm() },
        { label: 'No tengo este dato / No compartido', action: () => stepCreateProspectConfirm() }
      ]
    });
  };

  const stepCreateProspectConfirm = () => {
    setCurrentStep({
      id: 'create_prospect_confirm',
      text: '¡Excelente! Haz clic en "Confirmar y Crear Prospecto" al final para guardar el nuevo prospecto.',
      targetSelector: '#crear-prospecto-confirmar',
      options: [
        { label: 'Listo', action: () => stepSelectProspectAfterCreation() }
      ]
    });
  };

  const stepSelectProspectAfterCreation = () => {
    setCurrentStep({
      id: 'select_created',
      text: '¡Excelente! Ahora busca y selecciona el prospecto que acabas de crear haciendo clic en su fila para ver su detalle.',
      targetSelector: '#tabla-prospectos',
      options: [
        { label: 'Ya lo seleccioné', action: () => stepTourDetailInteres() }
      ]
    });
  };

  const stepGoToProspects = () => {
    navigate('/vendedor/prospectos');
    setCurrentStep({
      id: 'goto_prospects',
      text: 'Primero, selecciona cualquier prospecto de la lista dándole clic para ver su información detallada. Si no ves a ninguno, crea uno nuevo primero.',
      options: [
        { label: 'Omitir y cancelar', action: () => startConversation() }
      ]
    });
  };

  const greetingProspectoDetalle = () => {
    setCurrentStep({
      id: 'greeting_prospecto_detalle',
      text: 'Estás viendo el detalle de un prospecto. ¿Qué te gustaría explorar en este panel?',
      options: [
        { label: 'Recorrido rápido del panel', action: () => stepTourDetailInteres() },
        { label: 'Explicar botones (Llamar, Agendar)', action: () => stepTourBotonesAccion() },
        { label: 'Cerrar Asistente', action: () => { setAvatarState('resting'); closeBot(); } }
      ]
    });
  };

  const stepPreguntarExplicacion = () => {
    setCurrentStep({
      id: 'preguntar_explicacion',
      text: '¡Excelente! Has abierto el panel detallado del prospecto. ¿Quieres un recorrido rápido para entender el panel o prefieres que te explique directamente los botones de acción?',
      options: [
        { label: 'Recorrido rápido del panel', action: () => stepTourDetailInteres() },
        { label: 'Explicar botones (Llamar, Agendar)', action: () => stepTourBotonesAccion() },
        { label: 'Omitir y cancelar', action: () => startConversation() }
      ]
    });
  };

  const stepTourBotonesAccion = () => {
    setCurrentStep({
      id: 'tour_botones_accion',
      text: 'Estos son los botones principales:\n\n📞 **Registrar Llamada**: Guarda qué pasó en la llamada.\n📅 **Agendar**: Crea una cita que irá a tu Calendario.\n⏰ **Recordatorio**: Para que no se te olvide contactarlo después.',
      targetSelector: '#detalle-prospecto-acciones-llamada',
      options: [
        { label: '¡Entendido, cerrar!', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailInteres = () => {
    setCurrentStep({
      id: 'tour_detail_interes',
      text: '¡Genial! Este es el detalle del prospecto. Aquí arriba tienes el **Nivel de Interés** (estrellas). Puedes calificarlo de 1 a 5 para priorizar tus prospectos más calientes.',
      targetSelector: '#detalle-prospecto-interes',
      options: [
        { label: 'Siguiente: Valor', action: () => stepTourDetailValor() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailValor = () => {
    setCurrentStep({
      id: 'tour_detail_valor',
      text: 'Aquí se encuentra el **Valor del Prospecto**. Puedes editar el monto y cambiar la moneda directamente haciendo clic sobre el número. Se guardará automáticamente cuando hagas clic fuera.',
      targetSelector: '#detalle-prospecto-valor',
      options: [
        { label: 'Siguiente: Antigüedad y Llamadas', action: () => stepTourDetailMetricas() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailMetricas = () => {
    setCurrentStep({
      id: 'tour_detail_metricas',
      text: 'Aquí puedes ver la **Antigüedad** (días transcurridos desde su registro) y las estadísticas de **Llamadas** realizadas, diferenciadas entre contestadas (si contestó, en verde) y no contestadas (no contestó, en rojo).',
      targetSelector: '#detalle-prospecto-metricas',
      options: [
        { label: 'Siguiente: Contacto Rápido', action: () => stepTourDetailContactoRapido() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailContactoRapido = () => {
    setCurrentStep({
      id: 'tour_detail_contacto_rapido',
      text: 'Estos accesos te permiten contactar al prospecto rápidamente: iniciar un chat de **WhatsApp**, enviar un correo electrónico por **Gmail** o abrir tus **Plantillas de mensajes** predefinidas.',
      targetSelector: '#detalle-prospecto-contacto-rapido',
      options: [
        { label: 'Siguiente: Acciones de Llamada', action: () => stepTourDetailAccionesLlamada() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailAccionesLlamada = () => {
    setCurrentStep({
      id: 'call_reg_waiting',
      text: 'Aquí puedes 📞 **Registrar Llamada**, crear un recordatorio o agendar reunión. ¡Vamos a ver cómo funciona! **Dale clic en "Registrar Llamada"** para que te explique paso a paso.',
      targetSelector: '#detalle-prospecto-btn-registrar-llamada',
      options: [
        { label: 'Siguiente: Recordatorios', action: () => stepTourDetailRecordatoriosLista() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepCallRegistrationIntro = () => {
    setCurrentStep({
      id: 'call_reg_waiting',
      text: '¡Perfecto! **Dale clic en el botón "Registrar Llamada"** — está resaltado abajo. Te iré explicando cada paso del flujo en tiempo real.',
      targetSelector: '#detalle-prospecto-btn-registrar-llamada',
      options: [
        { label: 'Volver atrás', action: () => stepTourDetailAccionesLlamada() }
      ]
    });
  };

  const stepTourDetailRecordatoriosLista = () => {
    setCurrentStep({
      id: 'tour_detail_recordatorios_lista',
      text: 'En esta tarjeta se listan tus **Recordatorios** pendientes y citas agendadas. Desde aquí puedes editarlas, quitarlas, o marcarlas como completadas rápidamente.',
      targetSelector: '#detalle-prospecto-recordatorios-lista',
      options: [
        { label: 'Siguiente: Notas', action: () => stepTourDetailNotes() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailNotes = () => {
    setCurrentStep({
      id: 'tour_detail_notes',
      text: 'En el cuadro de **Notas del Prospecto**, puedes escribir anotaciones rápidas, recordatorios internos o detalles clave, y guardarlos pulsando el icono del disco.',
      targetSelector: '#detalle-prospecto-notes-textarea',
      options: [
        { label: 'Siguiente: Módulos Extras', action: () => stepTourDetailModulosExtras() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailModulosExtras = () => {
    setCurrentStep({
      id: 'tour_detail_modulos_extras',
      text: 'Con este botón de **Añadir Módulo**, puedes expandir la ficha del prospecto agregando cuadros de notas adicionales o listas de tareas (checklists) a tu gusto.',
      targetSelector: '#detalle-prospecto-add-modulo',
      options: [
        { label: 'Siguiente: Historial', action: () => stepTourDetailHistorial() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailHistorial = () => {
    setCurrentStep({
      id: 'tour_detail_historial',
      text: 'Y en el lateral derecho tienes el **Historial de Interacciones**. Aquí se registran automáticamente las llamadas, WhatsApps, recordatorios, citas y cambios de etapa que realices.',
      targetSelector: '#detalle-prospecto-historial',
      options: [
        { label: 'Siguiente: Acciones de Cierre', action: () => stepTourDetailCierre() },
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailCierre = () => {
    setCurrentStep({
      id: 'tour_detail_cierre',
      text: 'El botón de **Acciones de Cierre** te permite finalizar el seguimiento. Haz clic en él ahora mismo para ver y conocer las opciones disponibles.',
      targetSelector: '#detalle-prospecto-cierre',
      options: [
        { label: 'Omitir', action: () => startConversation() }
      ]
    });
  };

  const stepTourDetailCierreOptions = () => {
    setCurrentStep({
      id: 'tour_detail_cierre_options',
      text: 'En esta ventana de cierre puedes:\n- **Pasar a Cliente**: Si ganaste la venta, convirtiendo el prospecto y enviándolo a la lista de clientes.\n- **Descartar Prospecto**: Si la negociación no prosperó y quieres marcarlo como perdido.\n\nHaz clic en **Volver atrás** para cerrar esta ventana y finalizar la guía.',
      targetSelector: '#cierre-modal-cuerpo',
      options: [
        { label: 'Comenzar seguimiento', action: () => stepContactMethod() }
      ]
    });
  };

  const stepCallModalContesto = () => {
    setCurrentStep({
      id: 'call_modal_contesto',
      text: '¡Abriste el modal! **Paso 1: ¿Contestó?**\n\n✅ **Sí, contestó** → ver resultado\n❌ **No contestó** → registra como fallida\n\nPrueba cualquier opción.',
      targetSelector: '#llamada-paso-contesto',
      options: [
        { label: 'Cancelar guía', action: () => {} }
      ]
    });
  };

  const stepCallOpcionesContesto = () => {
    setCurrentStep({
      id: 'call_opciones_contesto',
      text: '**Paso 2: ¿Cuál fue el resultado?**\n\n📅 **Agendó reunión** → va al Calendario\n📞 **Llamar después** → agenda reintento\n💬 **WhatsApp/Correo** → prefiere mensajes\n❌ **Sin interés** → rechazó la oferta\n📝 **Notas** → texto libre\n⏭️ **Omitir** → cierra sin guardar',
      targetSelector: '#llamada-paso-opciones',
      options: [
        { label: 'Continuar →', action: () => stepCallAskClose() }
      ]
    });
  };

  const stepCallAskClose = () => {
    setCurrentStep({
      id: 'call_ask_close',
      text: '¡Perfecto, ya conoces todas las opciones! Ahora **cierra el modal** con el botón “✕ Cancelar” para continuar el tour.',
      targetSelector: '#llamada-btn-cancelar',
      options: []
    });
  };

  const stepCallRegistrationDone = () => {
    setCurrentStep({
      id: 'call_reg_done',
      text: '¡Excelente! Ya dominas el flujo completo de registro de llamadas 📞. Continuemos con el resto del tour.',
      options: [
        { label: 'Continuar: Recordatorios', action: () => stepTourDetailRecordatoriosLista() },
        { label: 'Volver al inicio', action: () => startConversation() }
      ]
    });
  };

  const stepContactMethod = () => {
    setCurrentStep({
      id: 'contact_method',
      text: 'Revisa su información (si tiene número de teléfono o correo). ¿Por qué medio prefieres contactarlo primero?',
      options: [
        { label: 'Llamada telefónica', action: () => stepPhoneCall() },
        { label: 'Mensaje de WhatsApp', action: () => stepWhatsApp() }
      ]
    });
  };

  const stepPhoneCall = () => {
    setCurrentStep({
      id: 'phone_call',
      text: 'Genial. Llámalo y puedes usar este guion: "Hola, soy [Tu Nombre] de [Tu Empresa]. Vi que te registraste/mostraste interés y te llamo para ver cómo podemos ayudarte. ¿Tienes un minuto?"',
      options: [
        { label: 'Terminé la llamada', action: () => stepRegisterInteraction() }
      ]
    });
  };

  const stepWhatsApp = () => {
    setCurrentStep({
      id: 'whatsapp_msg',
      text: 'Perfecto. Envíale este mensaje: "Hola, soy [Tu Nombre] de [Tu Empresa] 👋. Me pongo a tu disposición para ayudarte con [Producto/Servicio]. ¿En qué horario te viene bien que hablemos?"',
      options: [
        { label: 'Mensaje enviado', action: () => stepRegisterInteraction() }
      ]
    });
  };

  const stepRegisterInteraction = () => {
    setCurrentStep({
      id: 'register_interaction',
      text: '¡Muy bien! Ahora, busca la sección para registrar interacción o agregar notas en su perfil y anota exactamente qué pasó durante el contacto.',
      options: [
        { label: 'Interacción registrada', action: () => stepCongratulateAndRemind() }
      ]
    });
  };

  const stepCongratulateAndRemind = () => {
    setCurrentStep({
      id: 'congratulate',
      text: '¡Felicidades, un paso más cerca de la venta! 🎉 Recuerda: si acordaron algo, agenda una reunión, crea un recordatorio o deja una nota para que no se te olvide el siguiente seguimiento.',
      options: [
        { label: 'Hacer otro seguimiento', action: () => stepGoToProspects() },
        { label: 'Terminar por ahora', action: () => { setAvatarState('resting'); closeBot(); } }
      ]
    });
  };

  useEffect(() => {
    // Si el bot está abierto y cambian de sección, reiniciamos la conversación al contexto actual
    if (isOpen && !['goto_prospects', 'preguntar_explicacion', 'tour_botones_accion', 'goto_clientes', 'preguntar_explicacion_clientes', 'tour_botones_accion_clientes'].includes(currentStep?.id)) {
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Escuchar cuando el usuario abre el bot manualmente con un clic
  useEffect(() => {
    if (isOpen && !currentStep) {
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep]);

  // Observador para detectar cuando se abre el panel de un prospecto o cliente
  useEffect(() => {
    if (!isOpen) return;

    if (currentStep?.id === 'goto_prospects') {
      const observer = new MutationObserver(() => {
        if (document.getElementById('detalle-prospecto-interes')) {
          stepPreguntarExplicacion();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      if (document.getElementById('detalle-prospecto-interes')) {
        stepPreguntarExplicacion();
        observer.disconnect();
      }
      return () => observer.disconnect();
    }

    if (currentStep?.id === 'goto_clientes') {
      const observer = new MutationObserver(() => {
        if (document.getElementById('detalle-cliente-acciones-contacto')) {
          stepPreguntarExplicacionClientes();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      if (document.getElementById('detalle-cliente-acciones-contacto')) {
        stepPreguntarExplicacionClientes();
        observer.disconnect();
      }
      return () => observer.disconnect();
    }
  }, [isOpen, currentStep?.id]);

  return { startConversation };
};
