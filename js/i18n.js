/**
 * Internationalization (i18n) Module
 * Supports Spanish (es) and English (en)
 */

const I18n = {
  currentLang: localStorage.getItem('lang') || 'es',

  init() {
    console.log('i18n initialized with language:', this.currentLang);
    // Apply language on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.updatePageLanguage());
    } else {
      this.updatePageLanguage();
    }
  },

  translations: {
    es: {
      // App
      'app.title': 'PSA BDP · Gestión de Proyectos Ocean Freight',
      'app.loading': 'Cargando...',
      
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.cover': 'Cover Page',
      'nav.scope': 'Scope',
      'nav.kickoff': 'Kick-off',
      'nav.plan': 'Project Plan',
      'nav.psr': 'PSR',
      'nav.oil': 'Open Items',
      'nav.uat': 'UAT Tracker',
      'nav.vacation': 'Vacaciones',
      'nav.participants': 'Participantes',
      'nav.finance': 'Cost Management',
      'nav.jira': 'JIRA',
      'nav.email': 'Email Reporting',
      'nav.back_projects': 'Ver proyectos',
      'section.jira': 'Integración JIRA',

      // Topbar
      'topbar.search_placeholder': 'Buscar en el proyecto...',
      'topbar.export': 'Exportar proyecto',
      'topbar.print': 'Imprimir',
      'topbar.report': 'Report',
      'topbar.options': 'Opciones',
      'topbar.project': 'Proyecto',
      
      // Options Menu
      'options.title': 'Opciones',
      'options.language': 'Idioma',
      'options.language_es': 'Español',
      'options.language_en': 'English',
      'options.export_all': 'Exportar todos los proyectos',
      'options.theme': 'Tema',
      'options.theme_light': 'Claro',
      'options.theme_dark': 'Oscuro',
      'options.colors': 'Color principal',
      
      // Project Selector
      'selector.title': 'Gestión de Proyectos Ocean Freight',
      'selector.subtitle': 'Selecciona un proyecto o crea uno nuevo',
      'selector.new_project': 'Nuevo Proyecto',
      'selector.import': 'Importar',
      'selector.empty_title': 'No hay proyectos creados',
      'selector.empty_action': 'Crear primer proyecto',
      'selector.theme_toggle': 'Modo Oscuro',
      'selector.no_date': 'Sin fecha',
      'selector.no_customer': 'Sin cliente',
      'selector.no_name': 'Sin nombre',

      // Project Management
      'project.confirm_delete': '¿Estás seguro de que quieres eliminar este proyecto? Se eliminarán todos los datos asociados.',
      'project.deleted': 'Proyecto eliminado',
      'project.duplicated': 'Proyecto duplicado',
      'project.copy': 'Copia',
      'project.not_found': 'Proyecto no encontrado',
      'project.new_title': 'Nuevo Proyecto',
      'project.name_placeholder': 'Nombre del proyecto...',
      'project.code_placeholder': 'Código del proyecto...',
      'project.customer_placeholder': 'Nombre del cliente...',
      'project.business_placeholder': 'Describe el business case y objetivos del proyecto...',
      'project.participants': 'Participantes del Proyecto',
      'project.name_required': 'El nombre del proyecto es obligatorio',
      'project.created': 'Proyecto creado',
      'participants.name_required': 'El nombre del participante es obligatorio',
      
      // Dashboard
      'dashboard.title': 'Dashboard del Proyecto',
      'dashboard.project_info': 'Información del Proyecto',
      'dashboard.name': 'Nombre',
      'dashboard.code': 'Código',
      'dashboard.status': 'Estado',
      'dashboard.progress': 'Progreso General',
      'dashboard.duration': 'Duración',
      'dashboard.participants': 'Participantes',
      'dashboard.view_all': 'Ver todos',
      'dashboard.total_participants': 'Total: {count} participantes',
      'dashboard.open_items': 'Open Items',
      'dashboard.high_priority': 'Alta Prioridad',
      'dashboard.vacations': 'Vacaciones',
      'dashboard.uat_tests': 'UAT Tests',
      'dashboard.psr': 'Último Project Status Report',
      'dashboard.view_psr': 'Ver PSR completo',
      'dashboard.no_psr': 'No hay PSR registrado aún',
      'dashboard.open_items_title': 'Open Items Abiertos',
      'dashboard.view_all_oil': 'Ver todos',
      'dashboard.vacations_title': 'Vacaciones Programadas',
      'dashboard.view_all_vacations': 'Ver todas',
      'dashboard.report_title': 'Reporte del Proyecto',
      'dashboard.report_desc': 'PSR, Open Items, Participantes, Budget',
      'dashboard.download_pdf': 'Descargar PDF',
      
      // Status
      'status.draft': 'En preparación',
      'status.active': 'Activo',
      'status.on_hold': 'En pausa',
      'status.completed': 'Completado',
      'status.cancelled': 'Cancelado',
      'status.pending': 'Pendiente',
      'status.in_progress': 'En progreso',
      
      // Common Actions
      'action.save': 'Guardar',
      'action.cancel': 'Cancelar',
      'action.edit': 'Editar',
      'action.delete': 'Eliminar',
      'action.add': 'Añadir',
      'action.close': 'Cerrar',
      'action.export': 'Exportar',
      'action.import': 'Importar',
      'action.duplicate': 'Duplicar',
      'action.download': 'Descargar',
      'action.upload': 'Subir',
      'action.search': 'Buscar',
      'action.filter': 'Filtrar',
      'action.view': 'Ver',
      'action.create': 'Crear',
      'action.update': 'Actualizar',
      'action.confirm': 'Confirmar',
      'action.back': 'Volver',
      'action.next': 'Siguiente',
      'action.select': 'Seleccionar...',
      'action.previous': 'Anterior',
      'action.save_changes': 'Guardar Cambios',
      
      // Confirmations
      'confirm.delete': '¿Estás seguro de que quieres eliminar esto?',
      'confirm.unsaved': 'Tienes cambios sin guardar. ¿Deseas continuar?',
      
      // Notifications
      'toast.saved': 'Guardado correctamente',
      'toast.deleted': 'Eliminado correctamente',
      'toast.error': 'Ha ocurrido un error',
      'toast.success': 'Operación completada',
      'toast.loading': 'Cargando...',
      'toast.pdf_downloaded': 'PDF descargado correctamente',
      'toast.popup_blocked': 'El navegador bloqueó la ventana emergente. Permite popups para imprimir.',
      'toast.print_opened': 'Abriendo ventana de impresión. Guarda como PDF.',

      // General
      'days': 'días',
      'more': 'más',
      'print_save_pdf': 'Imprimir / Guardar como PDF',
      'language_changed': 'Idioma cambiado a {lang}',
      
      // Cover Page
      'cover.title': 'Información General del Proyecto',
      'cover.project_name': 'Nombre del Proyecto',
      'cover.project_code': 'Código del Proyecto',
      'cover.project_type': 'Tipo de Proyecto',
      'cover.region': 'Región',
      'cover.start_date': 'Fecha de Inicio',
      'cover.end_date': 'Go-Live / Fecha Fin',
      'cover.customer': 'Customer Name',
      'cover.business_unit': 'Business Unit',
      'cover.business_case': 'Business Case / Resumen Ejecutivo',
      'cover.summary': 'Project Summary / Alcance',
      'cover.notes': 'Notas / Comentarios',
      'cover.status': 'Estado',
      'cover.dates': 'Fechas',
      'cover.duration': 'Duración (días)',
      'cover.customer_bu': 'Cliente & Business Case',
      'cover.additional_info': 'Información Adicional',
      'cover.project_name_placeholder': 'Ej: Implementación sistema tracking',
      'cover.project_code_placeholder': 'Ej: PSA-2024-001',
      'cover.customer_placeholder': 'Nombre del cliente',
      'cover.business_placeholder': 'Describe el business case del proyecto...',
      'cover.summary_placeholder': 'Resumen del proyecto y alcance general...',
      'cover.notes_placeholder': 'Notas adicionales...',

      // Project Types
      'type.digital': 'Digitalización',
      'type.process': 'Optimización Procesos',
      'type.system': 'Implementación Sistema',
      'type.integration': 'Integración',
      'type.compliance': 'Compliance/Regulatorio',
      'type.expansion': 'Expansión/Geográfico',
      'type.other': 'Otro',
      
      // Regions
      'region.global': 'Global',
      'region.europe': 'Europa',
      'region.americas': 'Américas',
      'region.asia': 'Asia-Pacífico',
      'region.mea': 'Middle East & Africa',
      
      // Scope
      'scope.title': 'Scope & Requisitos',
      'scope.add_item': 'Añadir Item',
      'scope.export': 'Exportar',
      'scope.filter_phase': 'Fase',
      'scope.filter_priority': 'Prioridad',
      'scope.filter_status': 'Estado',
      'scope.all': 'Todas',
      'scope.id': 'ID',
      'scope.requirement': 'Requisito / Scope Item',
      'scope.phase': 'Fase',
      'scope.priority': 'Prioridad',
      'scope.comments': 'Comments',
      'scope.actions': 'Acciones',
      'scope.empty': 'No hay items de scope definidos',
      'scope.add_first': 'Añadir primer item',
      
      // Phases
      'phase.pre': 'Pre-Implementación',
      'phase.during': 'During Implementation',
      'phase.post': 'Post-Implementation',
      
      // Priorities
      'priority.high': 'Alta',
      'priority.medium': 'Media',
      'priority.low': 'Baja',
      'priority.critical': 'Crítica',
      
      // Kickoff
      'kickoff.title': 'Kick-off Template',
      'kickoff.scope': 'Scope & Alcance',
      'kickoff.metrics': 'Métricas Clave (KPIs)',
      'kickoff.data_sources': 'Fuentes de Datos',
      'kickoff.logic': 'Lógica de Negocio / Business Rules',
      'kickoff.integration': 'Puntos de Integración',
      'kickoff.governance': 'Governance & Gestión',
      'kickoff.update_freq': 'Frecuencia de Actualización',
      'kickoff.meetings': 'Reuniones Programadas',
      'kickoff.escalation': 'Ruta de Escalación',
      'kickoff.decisions': 'Decision Making / Aprobaciones',
      'kickoff.ui': 'UI/UX Requirements',
      'kickoff.ui_reqs': 'Requisitos de Interfaz / Dashboards',
      'kickoff.users': 'Usuarios Finales / Stakeholders',
      'kickoff.copy_email': 'Copiar para Email',
      'kickoff.save': 'Guardar',
      
      // Plan
      'plan.title': 'Project Plan',
      'plan.hide_completed': 'Ocultar completadas',
      'plan.export_csv': 'Exportar CSV',
      'plan.save_baseline': 'Guardar Plan Inicial',
      'plan.new_task': 'Nueva Tarea',
      'plan.total_tasks': 'Total Tareas',
      'plan.completed': 'Completadas',
      'plan.in_progress': 'En Progreso',
      'plan.delayed': 'Retrasadas',
      'plan.task_list': 'Lista de Tareas',
      'plan.phase': 'Fase',
      'plan.task': 'Tarea',
      'plan.assignee': 'Responsable',
      'plan.start': 'Inicio',
      'plan.end': 'Fin',
      'plan.progress': 'Progreso',
      'plan.dependencies': 'Dependencias',
      'plan.empty': 'No hay tareas en el plan',
      'plan.create_first': 'Crear primera tarea',
      'plan.task_moved': 'Tarea movida',
      'plan.task_resized': 'Duración actualizada',
      
      // PSR
      'psr.title': 'Project Status Report (PSR)',
      'psr.history': 'Historial',
      'psr.export': 'Exportar',
      'psr.email': 'Generar Email',
      'psr.save': 'Guardar PSR',
      'psr.week': 'Semana del Reporte',
      'psr.new_week': '+ Nueva Semana',
      'psr.report_date': 'Fecha del Reporte',
      'psr.links': 'Project Links (JIRA, etc.)',
      'psr.health': 'Overall Project Health',
      'psr.progress': 'Progreso General (%)',
      'psr.schedule': 'Schedule',
      'psr.budget': 'Budget',
      'psr.resources': 'Resources',
      'psr.scope_psr': 'Scope',
      'psr.risks': 'Risks',
      'psr.oil_summary': 'OIL Status / Resumen de Items Abiertos',
      'psr.oil_high': 'High Priority',
      'psr.oil_medium': 'Medium Priority',
      'psr.oil_low': 'Low Priority',
      'psr.oil_completed': 'Completed',
      'psr.critical_path': 'Critical Path / Fases del Proyecto',
      'psr.add_phase': 'Añadir Fase',
      'psr.accomplishments': 'Key Accomplishments / Logros Clave',
      'psr.add_accomplishment': 'Añadir Logro',
      'psr.issues': 'Key Issues / Bloqueos Principales',
      'psr.add_issue': 'Añadir Issue',
      'psr.next_steps': 'Next Steps / Próximos Pasos',
      'psr.add_step': 'Añadir Actividad',
      'psr.risk_mgmt': 'Risk Management / Gestión de Riesgos',
      'psr.add_risk': 'Añadir Riesgo',
      'psr.comments': 'Comments / Comentarios Adicionales',
      
      // OIL
      'oil.title': 'Open Item List (OIL)',
      'oil.export': 'Exportar',
      'oil.new_item': 'Nuevo Item',
      'oil.filter_status': 'Estado',
      'oil.filter_priority': 'Prioridad',
      'oil.filter_assignee': 'Asignado a',
      'oil.all': 'Todos',
      'oil.id': 'ID',
      'oil.description': 'Issue Description',
      'oil.raised_by': 'Raised By',
      'oil.assigned_to': 'Assigned To',
      'oil.deadline': 'Target Deadline',
      'oil.status': 'Estado',
      'oil.empty': 'No hay items abiertos',
      'oil.create_first': 'Crear primer item',
      
      // OIL Status
      'oil.open': 'Open',
      'oil.in_progress': 'In Progress',
      'oil.on_hold': 'On Hold',
      'oil.completed': 'Completed',
      
      // UAT
      'uat.title': 'UAT Test Tracker',
      'uat.export': 'Exportar',
      'uat.new_test': 'Nuevo Test',
      'uat.total': 'Total Tests',
      'uat.passed': 'Passed',
      'uat.failed': 'Failed',
      'uat.in_progress': 'In Progress',
      'uat.empty': 'No hay tests definidos',
      
      // Vacation
      'vacation.title': 'Vacation Tracker',
      'vacation.export': 'Exportar',
      'vacation.new': 'Registrar Vacación',
      'vacation.member': 'Miembro del Equipo',
      'vacation.start': 'Fecha Inicio',
      'vacation.end': 'Fecha Fin',
      'vacation.days': 'Días',
      'vacation.backup': 'Backup / Reemplazo',
      'vacation.empty': 'No hay vacaciones registradas',
      'vacation.active': 'Activa',
      'vacation.upcoming': 'Próxima',
      
      // Participants
      'participants.title': 'Participantes del Proyecto',
      'participants.export': 'Exportar',
      'participants.new': 'Nuevo Participante',
      'participants.name': 'Nombre',
      'participants.role': 'Rol',
      'participants.email': 'Email',
      'participants.phone': 'Teléfono',
      'participants.company': 'Empresa',
      'participants.empty': 'No hay participantes registrados',
      'participants.no_role': 'Sin rol',
      
      // Finance
      'finance.title': 'Cost Management',
      'finance.budget': 'Budget',
      'finance.expenses': 'Expenses',
      'finance.vendors': 'Vendors',
      
      // Budget
      'budget.estimated': 'Estimated Budget',
      'budget.spent': 'Actual Spent',
      'budget.variance': 'Variance',
      'budget.filter_category': 'Category',
      'budget.search': 'Buscar budget items...',
      'budget.export': 'Exportar',
      'budget.add': 'Add Item',
      'budget.line_item': 'Line Item',
      'budget.vendor': 'Vendor',
      'budget.estimated_cost': 'Estimated',
      'budget.actual': 'Actual',
      'budget.progress': 'Progress',
      'budget.empty': 'No budget items defined',
      'budget.add_first': 'Add first budget item',
      
      // Expenses
      'expenses.total': 'Total Expenses',
      'expenses.items': '{count} items',
      'expenses.filter_category': 'Category',
      'expenses.filter_month': 'Month',
      'expenses.search': 'Buscar expenses...',
      'expenses.export': 'Exportar',
      'expenses.all_categories': 'Todas las categorías',
      'expenses.all_months': 'Todos los meses',
      'expenses.download_receipt': 'Descargar recibo',
      'expenses.error_required': 'Fecha, monto (mayor a 0) y descripción son requeridos',
      'expenses.error_file_size': 'Archivo muy grande. Máximo 5MB permitido.',
      'expenses.added': 'Gasto añadido',
      'expenses.updated': 'Gasto actualizado',
      'expenses.deleted': 'Gasto eliminado',
      'expenses.confirm_delete': '¿Estás seguro de que quieres eliminar este gasto?',
      'expenses.confirm_remove_receipt': '¿Eliminar este recibo?',
      'expenses.receipt_removed': 'Recibo eliminado',
      'budget.under': 'Under',
      'budget.over': 'Over',
      'budget.spent': 'gastado',
      'expenses.add': 'Add Expense',
      'expenses.date': 'Date',
      'expenses.description': 'Description',
      'expenses.amount': 'Amount',
      'expenses.receipt': 'Receipt',
      'expenses.receipt_yes': 'Receipt ✓',
      'expenses.receipt_no': 'No Receipt',
      'expenses.empty': 'No expenses recorded',
      'expenses.add_first': 'Add first expense',
      'expenses.receipt_available': 'Receipt available',
      'expenses.attach_receipt': 'Attach Receipt',
      'expenses.supported_files': 'Supported: Images, PDF (max 5MB)',
      'expenses.current_receipt': 'Current Receipt',
      'expenses.replace_receipt': 'Replace Receipt',
      'expenses.download': 'Download',
      'expenses.remove': 'Remove',
      
      // Vendors
      'vendors.total': 'Total Vendors',
      'vendors.active': 'Active',
      'vendors.pending': 'Pending',
      'vendors.filter_category': 'Category',
      'vendors.filter_status': 'Status',
      'vendors.search': 'Buscar vendors...',
      'vendors.export': 'Exportar',
      'vendors.add': 'Add Vendor',
      'vendors.name': 'Vendor Name',
      'vendors.contact': 'Contact Person',
      'vendors.email': 'Email',
      'vendors.phone': 'Teléfono',
      'vendors.services': 'Services Provided',
      'vendors.empty': 'No vendors registered',
      'vendors.add_first': 'Add first vendor',
      'vendors.attachments': 'Attachments',
      'vendors.add_file': 'Add New File',
      'vendors.supported_files': 'Supported: PDF, Images, Docs (max 10MB each)',
      'vendors.no_attachments': 'No attachments yet',
      
      // Vendor Categories
      'vc.ocean_carrier': 'Ocean Carrier',
      'vc.air_freight': 'Air Freight Carrier',
      'vc.customs': 'Customs Broker',
      'vc.3pl': '3PL / Warehouse',
      'vc.trucking': 'Trucking / Drayage',
      'vc.tech': 'Technology Vendor',
      'vc.consulting': 'Consulting Services',
      'vc.equipment': 'Equipment Supplier',
      'vc.insurance': 'Insurance Provider',
      'vc.legal': 'Legal Services',
      'vc.other': 'Other',
      
      // Email
      'email.title': 'Email Reporting',
      'email.generate': 'Generar Email',
      'email.copy': 'Copiar al portapapeles',
      'email.preview': 'Vista previa',

      // JIRA Hierarchy
      'jira.epics': 'Epics',
      'jira.tasks': 'Tasks',
      'jira.subtasks': 'Sub-tasks',
      'jira.new_epic': 'Nuevo Epic',
      'jira.edit_epic': 'Editar Epic',
      'jira.summary': 'Summary',
      'jira.summary_placeholder': 'Título del Epic...',
      'jira.description': 'Description',
      'jira.assignee': 'Assignee',
      'jira.priority': 'Priority',
      'jira.team': 'Team',
      'jira.status': 'Status',
      'jira.rag_status': 'RAG Status',
      'jira.target_completion': 'Target Completion Date',
      'jira.progress': 'Progress (%)',
      'jira.region': 'Region',
      'jira.investment_amount': 'Investment Amount ($)',
      'jira.investment_recovery': 'Investment Recovery (months)',
      'jira.labels': 'Labels',
      'jira.labels_placeholder': 'etiqueta1, etiqueta2...',
      'jira.stakeholders': 'Stakeholders',
      'jira.platforms': 'Platforms',
      'jira.platforms_placeholder': 'Xeneta, Freightify, etc.',
      'jira.success_criteria': 'Success Criteria',
      'jira.to_do': '📝 To Do',
      'jira.approved': '✅ Approved',
      'jira.in_progress': '🚧 In Progress',
      'jira.in_review': '🔍 In Review',
      'jira.done': '🏁 Done',
      'jira.cancelled': '❌ Cancelled',
      'jira.blocked_internal': '⛔ Blocked – Internal',
      'jira.blocked_external': '🚫 Blocked – External',
      'jira.epic_created': 'Epic creado',
      'jira.epic_updated': 'Epic actualizado',
      'jira.epic_deleted': 'Epic eliminado',
      'jira.confirm_delete_epic': '¿Eliminar este Epic? Se eliminarán también sus Tasks y Sub-tasks.',
      'jira.summary_required': 'El Summary es obligatorio',
      'jira.no_tasks': 'No hay Tasks para este Epic',
      'jira.no_epics': 'No hay Epics definidos',
      'jira.add_epic': 'Añadir Epic',
      'jira.view_tasks': 'Ver Tasks',
      'jira.due_date': 'Due Date',
      'jira.effort_estimate': 'Effort Estimate (hours)',
      'jira.acceptance_criteria': 'Acceptance Criteria',
      'jira.months': 'months',
      'jira.sync': 'Sincronizar JIRA',
      'jira.config_url': 'URL de JIRA',
      'jira.config_url_help': 'Ej: https://bdpinternational.atlassian.net',
      'jira.config_email': 'Email',
      'jira.config_token': 'API Token',
      'jira.config_token_placeholder': 'Crea un token en https://id.atlassian.com/manage-profile/security/api-tokens',
      'jira.config_token_help': 'Necesitas un API Token de tu cuenta de Atlassian',
      'jira.config_project': 'Clave del Proyecto',
      'jira.config_project_help': 'Ej: GOF (Global Ocean Freight)',
      'jira.config_title': 'Configuración JIRA',
      'jira.config_save': 'Guardar y Probar',
      'jira.testing': 'Probando conexión...',
      'jira.config_success': 'Conexión exitosa! Bienvenido {user}',
      'jira.config_error': 'Error de conexión',
      'jira.sync_start': 'Sincronizando con JIRA...',
      'jira.sync_complete': 'Sincronización completa: {epics} Epics, {tasks} Tasks, {subtasks} Sub-tasks',
      'jira.sync_error': 'Error de sincronización',
      'jira.plan_synced': '{count} tareas añadidas al Project Plan',
      'rag.green': '🟢 Green - On Track',
      'rag.amber': '🟡 Amber - At Risk',
      'rag.red': '🔴 Red - Off Track',
      'priority.highest': 'Highest',
      'priority.lowest': 'Lowest',
      
      // Frequency
      'freq.daily': 'Diaria',
      'freq.weekly': 'Semanal',
      'freq.biweekly': 'Quincenal',
      'freq.monthly': 'Mensual',
      
      // Business Units
      'bu.ocean': 'Ocean Freight',
      'bu.air': 'Air Freight',
      'bu.contract': 'Contract Logistics',
      'bu.distribution': 'Distribution',
      'bu.supply': 'Supply Chain Solutions',
      
      // Months
      'month.jan': 'Ene', 'month.feb': 'Feb', 'month.mar': 'Mar',
      'month.apr': 'Abr', 'month.may': 'May', 'month.jun': 'Jun',
      'month.jul': 'Jul', 'month.aug': 'Ago', 'month.sep': 'Sep',
      'month.oct': 'Oct', 'month.nov': 'Nov', 'month.dec': 'Dic',
    },
    
    en: {
      // App
      'app.title': 'PSA BDP · Ocean Freight Project Management',
      'app.loading': 'Loading...',
      
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.cover': 'Cover Page',
      'nav.scope': 'Scope',
      'nav.kickoff': 'Kick-off',
      'nav.plan': 'Project Plan',
      'nav.psr': 'PSR',
      'nav.oil': 'Open Items',
      'nav.uat': 'UAT Tracker',
      'nav.vacation': 'Vacation',
      'nav.participants': 'Participants',
      'nav.finance': 'Cost Management',
      'nav.jira': 'JIRA',
      'nav.email': 'Email Reporting',
      'nav.back_projects': 'View projects',
      'section.jira': 'Integración JIRA',
      
      // Topbar
      'topbar.search_placeholder': 'Search in project...',
      'topbar.export': 'Export project',
      'topbar.print': 'Print',
      'topbar.report': 'Report',
      'topbar.options': 'Options',
      'topbar.project': 'Project',
      
      // Options Menu
      'options.title': 'Options',
      'options.language': 'Language',
      'options.language_es': 'Español',
      'options.language_en': 'English',
      'options.export_all': 'Export all projects',
      'options.theme': 'Theme',
      'options.theme_light': 'Light',
      'options.theme_dark': 'Dark',
      'options.colors': 'Primary Color',
      
      // Project Selector
      'selector.title': 'Ocean Freight Project Management',
      'selector.subtitle': 'Select a project or create a new one',
      'selector.new_project': 'New Project',
      'selector.import': 'Import',
      'selector.empty_title': 'No projects created',
      'selector.empty_action': 'Create first project',
      'selector.theme_toggle': 'Dark Mode',
      'selector.no_date': 'No date',
      'selector.no_customer': 'No customer',
      'selector.no_name': 'No name',

      // Project Management
      'project.confirm_delete': 'Are you sure you want to delete this project? All associated data will be removed.',
      'project.deleted': 'Project deleted',
      'project.duplicated': 'Project duplicated',
      'project.copy': 'Copy',
      'project.not_found': 'Project not found',
      'project.new_title': 'New Project',
      'project.name_placeholder': 'Project name...',
      'project.code_placeholder': 'Project code...',
      'project.customer_placeholder': 'Customer name...',
      'project.business_placeholder': 'Describe the business case and project objectives...',
      'project.participants': 'Project Participants',
      'project.name_required': 'Project name is required',
      'project.created': 'Project created',
      'participants.name_required': 'Participant name is required',
      
      // Dashboard
      'dashboard.title': 'Project Dashboard',
      'dashboard.project_info': 'Project Information',
      'dashboard.name': 'Name',
      'dashboard.code': 'Code',
      'dashboard.status': 'Status',
      'dashboard.progress': 'Overall Progress',
      'dashboard.duration': 'Duration',
      'dashboard.participants': 'Participants',
      'dashboard.view_all': 'View all',
      'dashboard.total_participants': 'Total: {count} participants',
      'dashboard.open_items': 'Open Items',
      'dashboard.high_priority': 'High Priority',
      'dashboard.vacations': 'Vacations',
      'dashboard.uat_tests': 'UAT Tests',
      'dashboard.psr': 'Latest Project Status Report',
      'dashboard.view_psr': 'View full PSR',
      'dashboard.no_psr': 'No PSR registered yet',
      'dashboard.open_items_title': 'Open Open Items',
      'dashboard.view_all_oil': 'View all',
      'dashboard.vacations_title': 'Scheduled Vacations',
      'dashboard.view_all_vacations': 'View all',
      'dashboard.report_title': 'Project Report',
      'dashboard.report_desc': 'PSR, Open Items, Participants, Budget',
      'dashboard.download_pdf': 'Download PDF',
      
      // Status
      'status.draft': 'In Preparation',
      'status.active': 'Active',
      'status.on_hold': 'On Hold',
      'status.completed': 'Completed',
      'status.cancelled': 'Cancelled',
      'status.pending': 'Pending',
      'status.in_progress': 'In Progress',
      
      // Common Actions
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.edit': 'Edit',
      'action.delete': 'Delete',
      'action.add': 'Add',
      'action.close': 'Close',
      'action.export': 'Export',
      'action.import': 'Import',
      'action.duplicate': 'Duplicate',
      'action.download': 'Download',
      'action.upload': 'Upload',
      'action.search': 'Search',
      'action.filter': 'Filter',
      'action.view': 'View',
      'action.create': 'Create',
      'action.update': 'Update',
      'action.confirm': 'Confirm',
      'action.back': 'Back',
      'action.next': 'Next',
      'action.select': 'Select...',
      'action.previous': 'Previous',
      'action.save_changes': 'Save Changes',

      // Confirmations
      'confirm.delete': 'Are you sure you want to delete this?',
      'confirm.unsaved': 'You have unsaved changes. Do you want to continue?',
      
      // Notifications
      'toast.saved': 'Saved successfully',
      'toast.deleted': 'Deleted successfully',
      'toast.error': 'An error occurred',
      'toast.success': 'Operation completed',
      'toast.loading': 'Loading...',
      'toast.pdf_downloaded': 'PDF downloaded successfully',
      'toast.popup_blocked': 'Browser blocked the popup. Allow popups to print.',
      'toast.print_opened': 'Opening print window. Save as PDF.',

      // General
      'days': 'days',
      'more': 'more',
      'print_save_pdf': 'Print / Save as PDF',
      'language_changed': 'Language changed to {lang}',

      // Cover Page
      'cover.title': 'General Project Information',
      'cover.project_name': 'Project Name',
      'cover.project_code': 'Project Code',
      'cover.project_type': 'Project Type',
      'cover.region': 'Region',
      'cover.start_date': 'Start Date',
      'cover.end_date': 'Go-Live / End Date',
      'cover.customer': 'Customer Name',
      'cover.business_unit': 'Business Unit',
      'cover.business_case': 'Business Case / Executive Summary',
      'cover.summary': 'Project Summary / Scope',
      'cover.notes': 'Notes / Comments',
      'cover.status': 'Status',
      'cover.dates': 'Dates',
      'cover.duration': 'Duration (days)',
      'cover.customer_bu': 'Customer & Business Case',
      'cover.additional_info': 'Additional Information',
      'cover.project_name_placeholder': 'E.g.: Tracking system implementation',
      'cover.project_code_placeholder': 'E.g.: PSA-2024-001',
      'cover.customer_placeholder': 'Customer name',
      'cover.business_placeholder': 'Describe the project business case...',
      'cover.summary_placeholder': 'Project summary and general scope...',
      'cover.notes_placeholder': 'Additional notes...',

      // Project Types
      'type.digital': 'Digitalization',
      'type.process': 'Process Optimization',
      'type.system': 'System Implementation',
      'type.integration': 'Integration',
      'type.compliance': 'Compliance/Regulatory',
      'type.expansion': 'Expansion/Geographic',
      'type.other': 'Other',
      
      // Regions
      'region.global': 'Global',
      'region.europe': 'Europe',
      'region.americas': 'Americas',
      'region.asia': 'Asia-Pacific',
      'region.mea': 'Middle East & Africa',
      
      // Scope
      'scope.title': 'Scope & Requirements',
      'scope.add_item': 'Add Item',
      'scope.export': 'Export',
      'scope.filter_phase': 'Phase',
      'scope.filter_priority': 'Priority',
      'scope.filter_status': 'Status',
      'scope.all': 'All',
      'scope.id': 'ID',
      'scope.requirement': 'Requirement / Scope Item',
      'scope.phase': 'Phase',
      'scope.priority': 'Priority',
      'scope.comments': 'Comments',
      'scope.actions': 'Actions',
      'scope.empty': 'No scope items defined',
      'scope.add_first': 'Add first item',
      
      // Phases
      'phase.pre': 'Pre-Implementation',
      'phase.during': 'During Implementation',
      'phase.post': 'Post-Implementation',
      
      // Priorities
      'priority.high': 'High',
      'priority.medium': 'Medium',
      'priority.low': 'Low',
      'priority.critical': 'Critical',
      
      // Kickoff
      'kickoff.title': 'Kick-off Template',
      'kickoff.scope': 'Scope & Overview',
      'kickoff.metrics': 'Key Metrics (KPIs)',
      'kickoff.data_sources': 'Data Sources',
      'kickoff.logic': 'Business Logic / Business Rules',
      'kickoff.integration': 'Integration Points',
      'kickoff.governance': 'Governance & Management',
      'kickoff.update_freq': 'Update Frequency',
      'kickoff.meetings': 'Scheduled Meetings',
      'kickoff.escalation': 'Escalation Path',
      'kickoff.decisions': 'Decision Making / Approvals',
      'kickoff.ui': 'UI/UX Requirements',
      'kickoff.ui_reqs': 'Interface Requirements / Dashboards',
      'kickoff.users': 'End Users / Stakeholders',
      'kickoff.copy_email': 'Copy for Email',
      'kickoff.save': 'Save',
      
      // Plan
      'plan.title': 'Project Plan',
      'plan.hide_completed': 'Hide completed',
      'plan.export_csv': 'Export CSV',
      'plan.save_baseline': 'Save Baseline',
      'plan.new_task': 'New Task',
      'plan.total_tasks': 'Total Tasks',
      'plan.completed': 'Completed',
      'plan.in_progress': 'In Progress',
      'plan.delayed': 'Delayed',
      'plan.task_list': 'Task List',
      'plan.phase': 'Phase',
      'plan.task': 'Task',
      'plan.assignee': 'Assignee',
      'plan.start': 'Start',
      'plan.end': 'End',
      'plan.progress': 'Progress',
      'plan.dependencies': 'Dependencies',
      'plan.empty': 'No tasks in the plan',
      'plan.create_first': 'Create first task',
      'plan.task_moved': 'Task moved',
      'plan.task_resized': 'Duration updated',
      
      // PSR
      'psr.title': 'Project Status Report (PSR)',
      'psr.history': 'History',
      'psr.export': 'Export',
      'psr.email': 'Generate Email',
      'psr.save': 'Save PSR',
      'psr.week': 'Report Week',
      'psr.new_week': '+ New Week',
      'psr.report_date': 'Report Date',
      'psr.links': 'Project Links (JIRA, etc.)',
      'psr.health': 'Overall Project Health',
      'psr.progress': 'Overall Progress (%)',
      'psr.schedule': 'Schedule',
      'psr.budget': 'Budget',
      'psr.resources': 'Resources',
      'psr.scope_psr': 'Scope',
      'psr.risks': 'Risks',
      'psr.oil_summary': 'OIL Status / Open Items Summary',
      'psr.oil_high': 'High Priority',
      'psr.oil_medium': 'Medium Priority',
      'psr.oil_low': 'Low Priority',
      'psr.oil_completed': 'Completed',
      'psr.critical_path': 'Critical Path / Project Phases',
      'psr.add_phase': 'Add Phase',
      'psr.accomplishments': 'Key Accomplishments',
      'psr.add_accomplishment': 'Add Accomplishment',
      'psr.issues': 'Key Issues / Blockers',
      'psr.add_issue': 'Add Issue',
      'psr.next_steps': 'Next Steps / Planned Activities',
      'psr.add_step': 'Add Activity',
      'psr.risk_mgmt': 'Risk Management',
      'psr.add_risk': 'Add Risk',
      'psr.comments': 'Additional Comments',
      
      // OIL
      'oil.title': 'Open Item List (OIL)',
      'oil.export': 'Export',
      'oil.new_item': 'New Item',
      'oil.filter_status': 'Status',
      'oil.filter_priority': 'Priority',
      'oil.filter_assignee': 'Assigned To',
      'oil.all': 'All',
      'oil.id': 'ID',
      'oil.description': 'Issue Description',
      'oil.raised_by': 'Raised By',
      'oil.assigned_to': 'Assigned To',
      'oil.deadline': 'Target Deadline',
      'oil.status': 'Status',
      'oil.empty': 'No open items',
      'oil.create_first': 'Create first item',
      
      // OIL Status
      'oil.open': 'Open',
      'oil.in_progress': 'In Progress',
      'oil.on_hold': 'On Hold',
      'oil.completed': 'Completed',
      
      // UAT
      'uat.title': 'UAT Test Tracker',
      'uat.export': 'Export',
      'uat.new_test': 'New Test',
      'uat.total': 'Total Tests',
      'uat.passed': 'Passed',
      'uat.failed': 'Failed',
      'uat.in_progress': 'In Progress',
      'uat.empty': 'No tests defined',
      
      // Vacation
      'vacation.title': 'Vacation Tracker',
      'vacation.export': 'Export',
      'vacation.new': 'Register Vacation',
      'vacation.member': 'Team Member',
      'vacation.start': 'Start Date',
      'vacation.end': 'End Date',
      'vacation.days': 'Days',
      'vacation.backup': 'Backup / Replacement',
      'vacation.empty': 'No vacations registered',
      'vacation.active': 'Active',
      'vacation.upcoming': 'Upcoming',
      
      // Participants
      'participants.title': 'Project Participants',
      'participants.export': 'Export',
      'participants.new': 'New Participant',
      'participants.name': 'Name',
      'participants.role': 'Role',
      'participants.email': 'Email',
      'participants.phone': 'Phone',
      'participants.company': 'Company',
      'participants.empty': 'No participants registered',
      'participants.no_role': 'No role',
      
      // Finance
      'finance.title': 'Cost Management',
      'finance.budget': 'Budget',
      'finance.expenses': 'Expenses',
      'finance.vendors': 'Vendors',
      
      // Budget
      'budget.estimated': 'Estimated Budget',
      'budget.spent': 'Actual Spent',
      'budget.variance': 'Variance',
      'budget.filter_category': 'Category',
      'budget.search': 'Search budget items...',
      'budget.export': 'Export',
      'budget.add': 'Add Item',
      'budget.line_item': 'Line Item',
      'budget.vendor': 'Vendor',
      'budget.estimated_cost': 'Estimated',
      'budget.actual': 'Actual',
      'budget.progress': 'Progress',
      'budget.empty': 'No budget items defined',
      'budget.add_first': 'Add first budget item',
      
      // Expenses
      'expenses.total': 'Total Expenses',
      'expenses.items': '{count} items',
      'expenses.filter_category': 'Category',
      'expenses.filter_month': 'Month',
      'expenses.search': 'Search expenses...',
      'expenses.export': 'Export',
      'expenses.all_categories': 'All Categories',
      'expenses.all_months': 'All Months',
      'expenses.download_receipt': 'Download receipt',
      'expenses.error_required': 'Date, amount (greater than 0), and description are required',
      'expenses.error_file_size': 'File too large. Maximum 5MB allowed.',
      'expenses.added': 'Expense added',
      'expenses.updated': 'Expense updated',
      'expenses.deleted': 'Expense deleted',
      'expenses.confirm_delete': 'Are you sure you want to delete this expense?',
      'expenses.confirm_remove_receipt': 'Remove this receipt?',
      'expenses.receipt_removed': 'Receipt removed',
      'budget.under': 'Under',
      'budget.over': 'Over',
      'budget.spent': 'spent',
      'expenses.add': 'Add Expense',
      'expenses.date': 'Date',
      'expenses.description': 'Description',
      'expenses.amount': 'Amount',
      'expenses.receipt': 'Receipt',
      'expenses.receipt_yes': 'Receipt ✓',
      'expenses.receipt_no': 'No Receipt',
      'expenses.empty': 'No expenses recorded',
      'expenses.add_first': 'Add first expense',
      'expenses.receipt_available': 'Receipt available',
      'expenses.attach_receipt': 'Attach Receipt',
      'expenses.supported_files': 'Supported: Images, PDF (max 5MB)',
      'expenses.current_receipt': 'Current Receipt',
      'expenses.replace_receipt': 'Replace Receipt',
      'expenses.download': 'Download',
      'expenses.remove': 'Remove',
      
      // Vendors
      'vendors.total': 'Total Vendors',
      'vendors.active': 'Active',
      'vendors.pending': 'Pending',
      'vendors.filter_category': 'Category',
      'vendors.filter_status': 'Status',
      'vendors.search': 'Search vendors...',
      'vendors.export': 'Export',
      'vendors.add': 'Add Vendor',
      'vendors.name': 'Vendor Name',
      'vendors.contact': 'Contact Person',
      'vendors.email': 'Email',
      'vendors.phone': 'Phone',
      'vendors.services': 'Services Provided',
      'vendors.empty': 'No vendors registered',
      'vendors.add_first': 'Add first vendor',
      'vendors.attachments': 'Attachments',
      'vendors.add_file': 'Add New File',
      'vendors.supported_files': 'Supported: PDF, Images, Docs (max 10MB each)',
      'vendors.no_attachments': 'No attachments yet',
      
      // Vendor Categories
      'vc.ocean_carrier': 'Ocean Carrier',
      'vc.air_freight': 'Air Freight Carrier',
      'vc.customs': 'Customs Broker',
      'vc.3pl': '3PL / Warehouse',
      'vc.trucking': 'Trucking / Drayage',
      'vc.tech': 'Technology Vendor',
      'vc.consulting': 'Consulting Services',
      'vc.equipment': 'Equipment Supplier',
      'vc.insurance': 'Insurance Provider',
      'vc.legal': 'Legal Services',
      'vc.other': 'Other',
      
      // Email
      'email.title': 'Email Reporting',
      'email.generate': 'Generate Email',
      'email.copy': 'Copy to clipboard',
      'email.preview': 'Preview',

      // JIRA Hierarchy
      'jira.epics': 'Epics',
      'jira.tasks': 'Tasks',
      'jira.subtasks': 'Sub-tasks',
      'jira.new_epic': 'New Epic',
      'jira.edit_epic': 'Edit Epic',
      'jira.summary': 'Summary',
      'jira.summary_placeholder': 'Epic title...',
      'jira.description': 'Description',
      'jira.assignee': 'Assignee',
      'jira.priority': 'Priority',
      'jira.team': 'Team',
      'jira.status': 'Status',
      'jira.rag_status': 'RAG Status',
      'jira.target_completion': 'Target Completion Date',
      'jira.progress': 'Progress (%)',
      'jira.region': 'Region',
      'jira.investment_amount': 'Investment Amount ($)',
      'jira.investment_recovery': 'Investment Recovery (months)',
      'jira.labels': 'Labels',
      'jira.labels_placeholder': 'label1, label2...',
      'jira.stakeholders': 'Stakeholders',
      'jira.platforms': 'Platforms',
      'jira.platforms_placeholder': 'Xeneta, Freightify, etc.',
      'jira.success_criteria': 'Success Criteria',
      'jira.to_do': '📝 To Do',
      'jira.approved': '✅ Approved',
      'jira.in_progress': '🚧 In Progress',
      'jira.in_review': '🔍 In Review',
      'jira.done': '🏁 Done',
      'jira.cancelled': '❌ Cancelled',
      'jira.blocked_internal': '⛔ Blocked – Internal',
      'jira.blocked_external': '🚫 Blocked – External',
      'jira.epic_created': 'Epic created',
      'jira.epic_updated': 'Epic updated',
      'jira.epic_deleted': 'Epic deleted',
      'jira.confirm_delete_epic': 'Delete this Epic? Its Tasks and Sub-tasks will also be removed.',
      'jira.summary_required': 'Summary is required',
      'jira.no_tasks': 'No Tasks for this Epic',
      'jira.no_epics': 'No Epics defined',
      'jira.add_epic': 'Add Epic',
      'jira.view_tasks': 'View Tasks',
      'jira.due_date': 'Due Date',
      'jira.effort_estimate': 'Effort Estimate (hours)',
      'jira.acceptance_criteria': 'Acceptance Criteria',
      'jira.months': 'months',
      'jira.sync': 'Sync JIRA',
      'jira.config_url': 'JIRA URL',
      'jira.config_url_help': 'E.g.: https://bdpinternational.atlassian.net',
      'jira.config_email': 'Email',
      'jira.config_token': 'API Token',
      'jira.config_token_placeholder': 'Create token at https://id.atlassian.com/manage-profile/security/api-tokens',
      'jira.config_token_help': 'You need an API Token from your Atlassian account',
      'jira.config_project': 'Project Key',
      'jira.config_project_help': 'E.g.: GOF (Global Ocean Freight)',
      'jira.config_title': 'JIRA Configuration',
      'jira.config_save': 'Save & Test',
      'jira.testing': 'Testing connection...',
      'jira.config_success': 'Connection successful! Welcome {user}',
      'jira.config_error': 'Connection error',
      'jira.sync_start': 'Syncing with JIRA...',
      'jira.sync_complete': 'Sync complete: {epics} Epics, {tasks} Tasks, {subtasks} Sub-tasks',
      'jira.sync_error': 'Sync error',
      'jira.plan_synced': '{count} tasks added to Project Plan',
      'rag.green': '🟢 Green - On Track',
      'rag.amber': '🟡 Amber - At Risk',
      'rag.red': '🔴 Red - Off Track',
      'priority.highest': 'Highest',
      'priority.lowest': 'Lowest',

      // Frequency
      'freq.daily': 'Daily',
      'freq.weekly': 'Weekly',
      'freq.biweekly': 'Bi-weekly',
      'freq.monthly': 'Monthly',
      
      // Business Units
      'bu.ocean': 'Ocean Freight',
      'bu.air': 'Air Freight',
      'bu.contract': 'Contract Logistics',
      'bu.distribution': 'Distribution',
      'bu.supply': 'Supply Chain Solutions',
      
      // Months
      'month.jan': 'Jan', 'month.feb': 'Feb', 'month.mar': 'Mar',
      'month.apr': 'Apr', 'month.may': 'May', 'month.jun': 'Jun',
      'month.jul': 'Jul', 'month.aug': 'Aug', 'month.sep': 'Sep',
      'month.oct': 'Oct', 'month.nov': 'Nov', 'month.dec': 'Dec',
    }
  },

  t(key, params = {}) {
    const translation = this.translations[this.currentLang]?.[key] || 
                       this.translations['en']?.[key] || 
                       key;
    
    // Replace parameters
    return translation.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  },

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('lang', lang);
      this.updatePageLanguage();
      return true;
    }
    return false;
  },

  updatePageLanguage() {
    console.log('Updating page language to:', this.currentLang);

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const paramsAttr = el.getAttribute('data-i18n-params');
      let params = {};

      if (paramsAttr) {
        try {
          params = JSON.parse(paramsAttr);
        } catch (e) {
          params = {};
        }
      }

      const translation = this.t(key, params);
      console.log(`Translating ${key} -> ${translation}`);

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('data-i18n-placeholder')) {
          // Handled separately below
        } else {
          el.value = translation;
        }
      } else {
        // Check if element has child elements (icons, spans, etc.)
        const hasChildren = el.children.length > 0;

        if (hasChildren) {
          // Element has children - we need to be careful
          // Find and update only direct text content or span children with text
          Array.from(el.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              // Update text nodes that have content
              node.textContent = ' ' + translation + ' ';
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN' && !node.hasAttribute('data-i18n')) {
              // Update span children that don't have their own data-i18n
              if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
                node.textContent = translation;
              }
            }
          });
        } else {
          // Simple element with just text
          el.textContent = translation;
        }
      }
    });

    // Update page title
    const titleEl = document.querySelector('title');
    if (titleEl) {
      titleEl.textContent = this.t('app.title');
    }

    // Update placeholders for elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Update titles for elements with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });

    // Trigger icons refresh
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    console.log('Page language update complete');
  },

  getCurrentLang() {
    return this.currentLang;
  },

  getAvailableLanguages() {
    return [
      { code: 'es', name: this.t('options.language_es') },
      { code: 'en', name: this.t('options.language_en') }
    ];
  }
};

// Test function
I18n.test = function() {
  console.log('=== i18n Test ===');
  console.log('Current language:', this.currentLang);
  console.log('Testing translations:');
  console.log('  selector.title (es):', this.translations.es['selector.title']);
  console.log('  selector.title (en):', this.translations.en['selector.title']);
  console.log('  action.duplicate (es):', this.translations.es['action.duplicate']);
  console.log('  action.duplicate (en):', this.translations.en['action.duplicate']);
  console.log('Active t() calls:');
  console.log('  I18n.t("selector.title"):', this.t('selector.title'));
  console.log('  I18n.t("action.duplicate"):', this.t('action.duplicate'));
  console.log('Elements with data-i18n:', document.querySelectorAll('[data-i18n]').length);
  console.log('=================');
};

// Force refresh all translations
I18n.forceRefresh = function() {
  console.log('Force refreshing all translations...');
  this.updatePageLanguage();
  console.log('Refresh complete');
};

// Make it global
window.I18n = I18n;
