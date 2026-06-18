import { useLanguageStore } from '../store/useLanguageStore';

const translations = {
  en: {
    // Navigation / Sidebar
    'Dashboard': 'Dashboard',
    'Monitoreo': 'Monitoring',
    'Asignar': 'Assign',
    'Calendario': 'Calendar',
    'Prospectos': 'Prospects',
    'Clientes': 'Clients',
    'Manual': 'Manual',
    'Equipo': 'Team',
    'Ajustes': 'Settings',
    'Salir': 'Logout',
    'Módulos de Vendedor': 'Seller Modules',
    'Panel Admin': 'Admin Panel',

    // Ajustes
    'Perfil': 'Profile',
    'Seguridad': 'Security',
    'Colores del Sistema': 'System Colors',
    'Fórmula de Ventas': 'Sales Formula',
    'Notificaciones': 'Notifications',
    'Cuenta Google': 'Google Account',
    'Información Personal': 'Personal Information',
    'Nombre Completo': 'Full Name',
    'Email': 'Email',
    'Teléfono': 'Phone',
    'Guardar Cambios': 'Save Changes',
    'Guardando...': 'Saving...',
    'Nueva Contraseña': 'New Password',
    'Confirmar Contraseña': 'Confirm Password',
    'Actualizar Contraseña': 'Update Password',
    'Actualizando...': 'Updating...',
    'Vinculado': 'Linked',
    'Desvincular': 'Disconnect',
    'Vincular ahora': 'Link now',
    'Estado de Cuenta': 'Account Status',
    'Idioma / Language': 'Language',
    'Idioma del Sistema': 'System Language',
    'Selecciona el idioma principal de la aplicación': 'Select the main language for the application',
    'Español': 'Spanish',
    'Inglés': 'English',

    // Dashboard
    'Embudo de Ventas': 'Sales Funnel',
    'Salud Operativa': 'Operational Health',
    'Velocidad de Respuesta': 'Response Speed',
    'Tasa de Asistencia': 'Show-up Rate',
    'Ciclo de Cierre': 'Closing Cycle',
    'Ticket Promedio': 'Average Ticket',
    'Agenda Prioritaria': 'Priority Agenda',
    'Tareas Críticas': 'Critical Tasks',
    'Hoy': 'Today',
    'Semana': 'Week',
    'Mes': 'Month',
    'Entrada': 'Leads',
    'Reunión Realizada': 'Meeting Done',
    'Negociación': 'Negotiation',
    'Venta Ganada': 'Won Sale',
    'Perdido': 'Lost',
    'En línea': 'Online',
    'Desconectado': 'Offline',

    // Monitoreo
    'Monitoreo del Equipo': 'Team Monitoring',
    'Monitoreo: ': 'Monitoring: ',
    'Supervisa en tiempo real a los miembros de tu equipo': 'Supervise your team members in real time',
    'ACTUALIZAR': 'UPDATE',
    'Miembros Disponibles': 'Available Members',
    'Selecciona un miembro para monitorear': 'Select a member to monitor',
    'Cargando equipo...': 'Loading team...',
    'Tu equipo no tiene otros miembros además de ti.': 'Your team has no other members besides you.',
    'MONITOREAR': 'MONITOR',
    'Historial': 'Activity History',
    'Actividades del usuario': 'User activities',
    'Global': 'Global',
    'No hay interacciones': 'No interactions',
    'para hoy': 'for today',
    'registradas': 'registered',
    'Cartera': 'Portfolio',
    'Contactos asignados': 'Assigned contacts',
    'Prospectos ': 'Prospects ',
    'Clientes ': 'Clients ',
    'Sin empresa': 'No company',
    'Nunca': 'Never',
    'Tasa de Asistencia de Citas': 'Meeting Attendance Rate',
    'Pipeline Activo': 'Active Pipeline',
    'Interacciones Hoy': 'Interactions Today',

    // Asignar
    'Panel de Asignación': 'Assignment Panel',
    'Asignar a: ': 'Assign to: ',
    'Selecciona un vendedor para asignarle clientes': 'Select a seller to assign clients to',
    'AGREGAR PROSPECTO': 'ADD PROSPECT',
    'Vendedores': 'Sellers',
    'Selecciona a quién asignar': 'Select who to assign',
    'Cargando vendedores...': 'Loading sellers...',
    'No hay vendedores disponibles.': 'No sellers available.',
    'SELECCIONAR': 'SELECT',
    'Asignar Nuevo Prospecto': 'Assign New Prospect',
    'Llenar datos del cliente': 'Fill client details',
    'Identidad': 'Identity',
    'Nombres *': 'First Names *',
    'Apellido Paterno': 'Last Name (Paternal)',
    'Apellido Materno': 'Last Name (Maternal)',
    'Contacto': 'Contact',
    'Teléfonos *': 'Phones *',
    '+ Añadir otro': 'Add another',
    'Correos Electrónicos': 'Emails',
    'Empresa & Sitio': 'Company & Website',
    'Nombre de Empresa': 'Company Name',
    'Sitio Web': 'Website',
    'Ubicación': 'Location',
    'Asignar Prospecto a ': 'Assign Prospect to ',
    'Cartera de ': 'Portfolio of ',

    // Clientes & Seguimiento
    'Crear cliente': 'Create client',
    'Crear prospecto': 'Create prospect',
    'Filtrar por': 'Filter by',
    'Buscar...': 'Search...',
    'Filtros y Búsqueda': 'Filters & Search',
    'Etapa': 'Stage',
    'Última Interacción': 'Last Interaction',
    'Acciones': 'Actions',
    'Ver Detalles': 'View Details',
    'Nombre': 'Name',
    'Teléfono': 'Phone',
    'Correo': 'Email',
    'Empresa': 'Company',

    // Chatbot Greetings and Options
    '¡Hola! Te guiaré en la gestión de tus clientes ganados. ¿Qué deseas hacer hoy?': 'Hello! I will guide you in managing your won clients. What would you like to do today?',
    'Tomar guía rápida': 'Take a quick tour',
    'Dar seguimiento a un cliente': 'Follow up on a client',
    'Otras funciones (Próximamente)': 'Other features (Coming soon)',
    'Cerrar Asistente': 'Close Assistant',
    '¡Hola! Te guiaré en la gestión de tus prospectos paso a paso. ¿Qué deseas hacer primero?': 'Hello! I will guide you through managing your prospects step by step. What would you like to do first?',
    'Dar seguimiento y cerrar': 'Follow up and close',
    '¡Hola! Bienvenido al Panel de Administración. Aquí puedes gestionar los propietarios de equipo, revisar los usuarios de cada equipo y realizar configuraciones del sistema.': 'Hello! Welcome to the Administration Panel. Here you can manage team owners, review users in each team, and configure the system.',
    '¡Hola! Bienvenido al panel de Monitoreo de Equipo. Aquí puedes ver el rendimiento de tu equipo, actividades recientes y métricas clave en tiempo real.': 'Hello! Welcome to the Team Monitoring panel. Here you can view your team performance, recent activities, and key metrics in real time.',
    '¡Hola! Bienvenido al panel de Asignación. Aquí puedes registrar prospectos y asignarlos directamente a los vendedores del sistema.': 'Hello! Welcome to the Assignment panel. Here you can register prospects and assign them directly to the system\'s sellers.',
    '¡Hola! Bienvenido al panel principal (Dashboard). Como tu asistente, mi tarea es ayudarte a navegar y sacarle provecho al sistema. ¿Qué te gustaría hacer?': 'Hello! Welcome to the main panel (Dashboard). As your assistant, my job is to help you navigate and get the most out of the system. What would you like to do?',
    'Conocer el Dashboard': 'Know the Dashboard',
    'Ir a Prospectos': 'Go to Prospects',
    '¡Genial! Esta sección cuenta con herramientas muy útiles. ¿De cuál te gustaría aprender hoy?': 'Great! This section has very useful tools. Which one would you like to learn about today?',
    '📉 Etapas del Embudo': '📉 Funnel Stages',
    '🔍 Filtros y Búsqueda': '🔍 Filters & Search',
    '👥 Compartir Prospectos': '👥 Share Prospects',
    '📄 Importar y Exportar CSV': '📄 Import & Export CSV',
    'Volver al inicio': 'Go to start',
    '📄 Importar/Exportar CSV': '📄 Import/Export CSV',
    '➕ Crear Cliente': '➕ Create Client',

    // Etapas del Embudo
    'no_contactado': 'not_contacted',
    'No contactado': 'Not contacted',
    'sin_contacto': 'no_contact',
    'Sin contacto': 'No contact',
    'en_contacto': 'in_contact',
    'En contacto': 'In contact',
    'reunion_agendada': 'meeting_scheduled',
    'Cita agendada': 'Meeting scheduled',
    'reunion_realizada': 'meeting_held',
    'Cita realizada': 'Meeting held',
    'negociacion': 'negotiation',
    'venta_ganada': 'sale_won',
    'Venta ganada': 'Won sale',
    'perdido': 'lost',
    'Perdido': 'Lost',
    'prospecto_nuevo': 'new_prospect',
    'Prospecto nuevo': 'New prospect',
    'cliente_activo': 'active_client',
    'Cliente activo': 'Active client',
    '¿Confirmar Asignación?': 'Confirm Assignment?',
    '¿Estás seguro de que deseas asignar el prospecto': 'Are you sure you want to assign the prospect',
    'a': 'to',
    'Sí, asignar': 'Yes, assign',
    'Cancelar': 'Cancel',
    'Unirse a la videollamada': 'Join video call',
  }
};

export const t = (text) => {
  const lang = useLanguageStore.getState().language;
  if (lang === 'es' || !text) return text;
  
  // Clean matching for text that might contain whitespace or punctuation
  const cleanKey = String(text).trim();
  const translation = translations[lang]?.[cleanKey];
  if (translation) return translation;

  // Partial match helper or fallback
  return cleanKey ? (translations[lang]?.[cleanKey] || text) : text;
};

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const translate = (text) => {
    if (language === 'es' || !text) return text;
    const cleanKey = String(text).trim();
    return translations.en?.[cleanKey] || text;
  };
  return { t: translate, language };
};
