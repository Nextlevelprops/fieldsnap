// ============================================================
// FIELDSNAP — Complete Translation Strings
// Every piece of UI text in both English and Spanish
// Usage: import { t } from '../lib/i18n'
//        t('dashboard.active', lang)
// ============================================================

const strings = {

  // ── AUTH ────────────────────────────────────────────────────
  'auth.appName':            { en: 'FieldSnap',              es: 'FieldSnap' },
  'auth.tagline':            { en: 'Field Crew Management',  es: 'Gestión de Cuadrilla' },
  'auth.chooseLanguage':     { en: 'Choose your language',   es: 'Elige tu idioma' },
  'auth.signIn':             { en: 'Sign In',                es: 'Iniciar sesión' },
  'auth.createAccount':      { en: 'Create Account',         es: 'Crear cuenta' },
  'auth.signInBtn':          { en: 'Sign In',                es: 'Iniciar sesión' },
  'auth.signUpBtn':          { en: 'Create Account',         es: 'Crear cuenta' },
  'auth.forgotPassword':     { en: 'Forgot password?',       es: '¿Olvidaste tu contraseña?' },
  'auth.resetSent':          { en: 'Check your email for a reset link.', es: 'Revisa tu correo para el enlace de restablecimiento.' },
  'auth.loading':            { en: 'Loading...',             es: 'Cargando...' },
  'auth.invitedAs':          { en: 'You were invited as a contractor.', es: 'Fuiste invitado como contratista.' },
  'auth.noAccount':          { en: "Don't have an account? Sign up", es: '¿No tienes cuenta? Regístrate' },
  'auth.haveAccount':        { en: 'Already have an account? Sign in', es: '¿Ya tienes cuenta? Inicia sesión' },

  // ── FORM FIELDS ─────────────────────────────────────────────
  'field.fullName':          { en: 'Full name',              es: 'Nombre completo' },
  'field.firstName':         { en: 'First name',             es: 'Nombre' },
  'field.lastName':          { en: 'Last name',              es: 'Apellido' },
  'field.phone':             { en: 'Phone number',           es: 'Número de teléfono' },
  'field.email':             { en: 'Email address',          es: 'Correo electrónico' },
  'field.password':          { en: 'Password',               es: 'Contraseña' },
  'field.profilePhoto':      { en: 'Profile photo',          es: 'Foto de perfil' },
  'field.profilePhotoOpt':   { en: 'Profile photo (optional)', es: 'Foto de perfil (opcional)' },
  'field.optional':          { en: '(optional)',             es: '(opcional)' },
  'field.required':          { en: 'Required',               es: 'Requerido' },
  'field.select':            { en: '-- Select --',           es: '-- Selecciona --' },
  'field.search':            { en: 'Search...',              es: 'Buscar...' },

  // ── NAVIGATION / TABS ────────────────────────────────────────
  'nav.dashboard':           { en: 'Dashboard',              es: 'Inicio' },
  'nav.settings':            { en: 'Settings',               es: 'Ajustes' },
  'nav.back':                { en: 'Back',                   es: 'Atrás' },
  'nav.notifications':       { en: 'Notifications',          es: 'Notificaciones' },

  // ── DASHBOARD ───────────────────────────────────────────────
  'dashboard.greeting':      { en: 'Hello',                  es: 'Hola' },
  'dashboard.active':        { en: 'Active',                 es: 'Activos' },
  'dashboard.completed':     { en: 'Completed',              es: 'Completados' },
  'dashboard.noProperties':  { en: 'No properties yet',      es: 'Sin propiedades aún' },
  'dashboard.tapToAdd':      { en: 'Tap + to add one',       es: 'Toca + para agregar una' },
  'dashboard.openTasks':     { en: 'open tasks',             es: 'tareas abiertas' },

  // ── PROPERTY ────────────────────────────────────────────────
  'property.add':            { en: 'Add Property',           es: 'Agregar propiedad' },
  'property.new':            { en: 'New Property',           es: 'Nueva propiedad' },
  'property.projectName':    { en: 'Project name',           es: 'Nombre del proyecto' },
  'property.street':         { en: 'Street address',         es: 'Dirección (calle)' },
  'property.city':           { en: 'City',                   es: 'Ciudad' },
  'property.state':          { en: 'State',                  es: 'Estado' },
  'property.zip':            { en: 'ZIP',                    es: 'Código postal' },
  'property.coverPhoto':     { en: 'Cover photo',            es: 'Foto de portada' },
  'property.assignContractors': { en: 'Assign contractors',  es: 'Asignar contratistas' },
  'property.save':           { en: 'Save Property',          es: 'Guardar propiedad' },
  'property.settings':       { en: 'Property Settings',      es: 'Configuración de propiedad' },
  'property.saveChanges':    { en: 'Save Changes',           es: 'Guardar cambios' },
  'property.assignedContractors': { en: 'Assigned Contractors', es: 'Contratistas asignados' },
  'property.markComplete':   { en: '✓ Complete',             es: '✓ Completar' },
  'property.confirmComplete': { en: 'Mark this property as completed?', es: '¿Marcar esta propiedad como completada?' },
  'property.doneLabel':      { en: '✓ Done',                 es: '✓ Listo' },
  'property.noProperties':   { en: 'No properties',          es: 'Sin propiedades' },

  // ── TASK TABS ────────────────────────────────────────────────
  'tasks.today':             { en: 'Today',                  es: 'Hoy' },
  'tasks.upcoming':          { en: 'Upcoming',               es: 'Pendientes' },
  'tasks.done':              { en: 'Done',                   es: 'Hechas' },
  'tasks.noTasks':           { en: 'No tasks here',          es: 'Sin tareas aquí' },

  // ── TASK STATUS ──────────────────────────────────────────────
  'task.overdue':            { en: 'Overdue',                es: 'Vencida' },
  'task.dueToday':           { en: 'Today',                  es: 'Hoy' },
  'task.done':               { en: 'Done',                   es: 'Hecho' },
  'task.noDescription':      { en: '(No description)',       es: '(Sin descripción)' },
  'task.open':               { en: 'Open',                   es: 'Abierta' },

  // ── CREATE TASK ──────────────────────────────────────────────
  'createTask.title':        { en: 'New Task',               es: 'Nueva tarea' },
  'createTask.camera':       { en: 'Camera',                 es: 'Cámara' },
  'createTask.gallery':      { en: 'Gallery',                es: 'Galería' },
  'createTask.annotate':     { en: '✏️ Annotate',            es: '✏️ Anotar' },
  'createTask.removePhoto':  { en: 'Remove',                 es: 'Quitar' },
  'createTask.description':  { en: 'Task description...',    es: 'Descripción de la tarea...' },
  'createTask.translateHint':{ en: '🌐 Will be auto-translated to Spanish', es: '🌐 Se traducirá automáticamente al inglés' },
  'createTask.dueDate':      { en: 'Due date (optional)',    es: 'Fecha límite (opcional)' },
  'createTask.save':         { en: 'Create Task',            es: 'Crear tarea' },
  'createTask.saving':       { en: 'Saving...',              es: 'Guardando...' },
  'createTask.needPhotoOrDesc': { en: 'Add a photo or description', es: 'Agrega una foto o descripción' },
  'createTask.annotated':    { en: '✏️ Annotated',           es: '✏️ Anotada' },

  // ── TASK DETAIL ──────────────────────────────────────────────
  'taskDetail.createdBy':    { en: 'Created by',             es: 'Creado por' },
  'taskDetail.dueDate':      { en: 'Due date',               es: 'Fecha límite' },
  'taskDetail.completedBy':  { en: 'Completed by',           es: 'Completado por' },
  'taskDetail.completedAt':  { en: 'Completed at',           es: 'Completado el' },
  'taskDetail.completionPhoto': { en: 'Completion photo',    es: 'Foto de completado' },
  'taskDetail.markComplete': { en: '✓ Mark Complete',        es: '✓ Marcar como hecho' },
  'taskDetail.proofPhoto':   { en: 'Add proof photo',        es: 'Agrega una foto de prueba' },
  'taskDetail.proofRequired': { en: 'A completion photo is required', es: 'Se requiere una foto de prueba' },
  'taskDetail.cancel':       { en: 'Cancel',                 es: 'Cancelar' },
  'taskDetail.confirm':      { en: 'Confirm',                es: 'Confirmar' },
  'taskDetail.comments':     { en: 'Comments',               es: 'Comentarios' },
  'taskDetail.commentPlaceholder': { en: 'Comment... use @name', es: 'Comentar... usa @nombre' },
  'taskDetail.englishLabel': { en: '🇺🇸 English',            es: '🇺🇸 English' },
  'taskDetail.spanishLabel': { en: '🇲🇽 Español',            es: '🇲🇽 Español' },

  // ── ANNOTATION ──────────────────────────────────────────────
  'annotate.cancel':         { en: 'Cancel',                 es: 'Cancelar' },
  'annotate.undo':           { en: '↩ Undo',                 es: '↩ Deshacer' },
  'annotate.done':           { en: '✓ Done',                 es: '✓ Listo' },
  'annotate.delete':         { en: '🗑 Delete',               es: '🗑 Eliminar' },
  'annotate.addText':        { en: 'Add Text',               es: 'Agregar texto' },
  'annotate.typeHere':       { en: 'Type here...',           es: 'Escribe aquí...' },
  'annotate.place':          { en: 'Place',                  es: 'Colocar' },
  'annotate.width':          { en: 'Width',                  es: 'Grosor' },
  'annotate.toolLine':       { en: 'Line',                   es: 'Línea' },
  'annotate.toolCircle':     { en: 'Circle',                 es: 'Círculo' },
  'annotate.toolArrow':      { en: 'Arrow',                  es: 'Flecha' },
  'annotate.toolText':       { en: 'Text',                   es: 'Texto' },

  // ── NOTIFICATIONS ────────────────────────────────────────────
  'notif.title':             { en: 'Notifications',          es: 'Notificaciones' },
  'notif.none':              { en: 'No notifications',        es: 'Sin notificaciones' },
  'notif.mentioned':         { en: 'You were mentioned in a comment', es: 'Te mencionaron en un comentario' },

  // ── SETTINGS PAGE ───────────────────────────────────────────
  'settings.title':          { en: 'Settings',               es: 'Ajustes' },
  'settings.roleOwner':      { en: 'Owner',                  es: 'Propietario' },
  'settings.roleContractor': { en: 'Contractor',             es: 'Contratista' },
  'settings.language':       { en: 'Language',               es: 'Idioma' },
  'settings.logWorkDay':     { en: 'Log Work Day',           es: 'Registro de trabajo' },
  'settings.logWorkDesc':    { en: 'Record which property you worked at', es: 'Registra en qué propiedad trabajaste' },
  'settings.contractors':    { en: 'Contractors',            es: 'Contratistas' },
  'settings.invitePlaceholder': { en: 'Email or phone number', es: 'Correo o número de teléfono' },
  'settings.invite':         { en: 'Invite',                 es: 'Invitar' },
  'settings.noContractors':  { en: 'No contractors yet',     es: 'Sin contratistas aún' },
  'settings.deleteContractor': { en: 'Delete this contractor?', es: '¿Eliminar este contratista?' },
  'settings.signOut':        { en: 'Sign Out',               es: 'Cerrar sesión' },
  'settings.paySchedule':    { en: 'Pay Schedule',           es: 'Calendario de pago' },

  // ── CONTRACTOR PROFILE ───────────────────────────────────────
  'contractor.tabInfo':      { en: 'Info',                   es: 'Info' },
  'contractor.tabActivity':  { en: 'Activity',               es: 'Actividad' },
  'contractor.tabSchedule':  { en: 'Schedule',               es: 'Horario' },
  'contractor.tabPay':       { en: 'Pay',                    es: 'Pago' },
  'contractor.assignedProps':{ en: 'Assigned properties',    es: 'Propiedades asignadas' },
  'contractor.noActivity':   { en: 'No activity yet',        es: 'Sin actividad aún' },
  'contractor.noLogs':       { en: 'No work logs',           es: 'Sin registros' },
  'contractor.created':      { en: 'Created',                es: 'Creó' },
  'contractor.completed':    { en: 'Completed',              es: 'Completó' },
  'contractor.payType':      { en: 'Pay type',               es: 'Tipo de pago' },
  'contractor.payPerDay':    { en: 'Per Day',                es: 'Por día' },
  'contractor.payPerHour':   { en: 'Per Hour',               es: 'Por hora' },
  'contractor.payWeeklyFlat':{ en: 'Weekly Flat',            es: 'Semanal fijo' },
  'contractor.payGC':        { en: 'GC / Manager',           es: 'GC / Gerente' },
  'contractor.payRate':      { en: 'Rate ($)',                es: 'Tarifa ($)' },
  'contractor.payPerWeek':   { en: 'per week',               es: 'por semana' },
  'contractor.payGCNote':    { en: 'Weekly rate will be split proportionally across all active properties that week.', es: 'La tarifa semanal se dividirá proporcionalmente entre todas las propiedades activas esa semana.' },
  'contractor.saveRate':     { en: 'Save Rate',              es: 'Guardar tarifa' },
  'contractor.saved':        { en: 'Saved!',                 es: '¡Guardado!' },

  // ── WORK LOG ─────────────────────────────────────────────────
  'worklog.title':           { en: 'Log Work Day',           es: 'Registrar día de trabajo' },
  'worklog.date':            { en: 'Date',                   es: 'Fecha' },
  'worklog.dayType':         { en: 'Day type',               es: 'Tipo de día' },
  'worklog.fullDay':         { en: '● Full Day',             es: '● Día completo' },
  'worklog.halfDay':         { en: '◑ Half Day',             es: '◑ Medio día' },
  'worklog.property1':       { en: 'Property',               es: 'Propiedad' },
  'worklog.property1Half':   { en: 'Property 1 (first half)', es: 'Propiedad 1 (primer medio día)' },
  'worklog.property2':       { en: 'Property 2 (second half, optional)', es: 'Propiedad 2 (segundo medio día, opcional)' },
  'worklog.save':            { en: 'Save',                   es: 'Guardar' },
  'worklog.fullDayLabel':    { en: 'Full Day',               es: 'Día completo' },
  'worklog.halfDayLabel':    { en: 'Half Day',               es: 'Medio día' },

  // ── DAYS OF WEEK ─────────────────────────────────────────────
  'day.sun':                 { en: 'Sun',    es: 'Dom' },
  'day.mon':                 { en: 'Mon',    es: 'Lun' },
  'day.tue':                 { en: 'Tue',    es: 'Mar' },
  'day.wed':                 { en: 'Wed',    es: 'Mié' },
  'day.thu':                 { en: 'Thu',    es: 'Jue' },
  'day.fri':                 { en: 'Fri',    es: 'Vie' },
  'day.sat':                 { en: 'Sat',    es: 'Sáb' },
  'day.sunday':              { en: 'Sunday',    es: 'Domingo' },
  'day.monday':              { en: 'Monday',    es: 'Lunes' },
  'day.tuesday':             { en: 'Tuesday',   es: 'Martes' },
  'day.wednesday':           { en: 'Wednesday', es: 'Miércoles' },
  'day.thursday':            { en: 'Thursday',  es: 'Jueves' },
  'day.friday':              { en: 'Friday',    es: 'Viernes' },
  'day.saturday':            { en: 'Saturday',  es: 'Sábado' },

  // ── MONTHS ───────────────────────────────────────────────────
  'month.jan':               { en: 'Jan',       es: 'Ene' },
  'month.feb':               { en: 'Feb',       es: 'Feb' },
  'month.mar':               { en: 'Mar',       es: 'Mar' },
  'month.apr':               { en: 'Apr',       es: 'Abr' },
  'month.may':               { en: 'May',       es: 'May' },
  'month.jun':               { en: 'Jun',       es: 'Jun' },
  'month.jul':               { en: 'Jul',       es: 'Jul' },
  'month.aug':               { en: 'Aug',       es: 'Ago' },
  'month.sep':               { en: 'Sep',       es: 'Sep' },
  'month.oct':               { en: 'Oct',       es: 'Oct' },
  'month.nov':               { en: 'Nov',       es: 'Nov' },
  'month.dec':               { en: 'Dec',       es: 'Dic' },
  'month.january':           { en: 'January',   es: 'Enero' },
  'month.february':          { en: 'February',  es: 'Febrero' },
  'month.march':             { en: 'March',     es: 'Marzo' },
  'month.april':             { en: 'April',     es: 'Abril' },
  'month.mayFull':           { en: 'May',       es: 'Mayo' },
  'month.june':              { en: 'June',      es: 'Junio' },
  'month.july':              { en: 'July',      es: 'Julio' },
  'month.august':            { en: 'August',    es: 'Agosto' },
  'month.september':         { en: 'September', es: 'Septiembre' },
  'month.october':           { en: 'October',   es: 'Octubre' },
  'month.november':          { en: 'November',  es: 'Noviembre' },
  'month.december':          { en: 'December',  es: 'Diciembre' },

  // ── DATE FORMATTING ──────────────────────────────────────────
  'date.today':              { en: 'Today',        es: 'Hoy' },
  'date.yesterday':          { en: 'Yesterday',    es: 'Ayer' },
  'date.tomorrow':           { en: 'Tomorrow',     es: 'Mañana' },
  'date.thisWeek':           { en: 'This week',    es: 'Esta semana' },
  'date.lastWeek':           { en: 'Last week',    es: 'La semana pasada' },
  'date.weekOf':             { en: 'Week of',      es: 'Semana del' },

  // ── GENERIC ACTIONS ──────────────────────────────────────────
  'action.save':             { en: 'Save',          es: 'Guardar' },
  'action.cancel':           { en: 'Cancel',        es: 'Cancelar' },
  'action.delete':           { en: 'Delete',        es: 'Eliminar' },
  'action.edit':             { en: 'Edit',          es: 'Editar' },
  'action.confirm':          { en: 'Confirm',       es: 'Confirmar' },
  'action.close':            { en: 'Close',         es: 'Cerrar' },
  'action.add':              { en: 'Add',           es: 'Agregar' },
  'action.remove':           { en: 'Remove',        es: 'Quitar' },
  'action.done':             { en: 'Done',          es: 'Listo' },
  'action.sending':          { en: 'Sending...',    es: 'Enviando...' },
  'action.saving':           { en: 'Saving...',     es: 'Guardando...' },
  'action.loading':          { en: 'Loading...',    es: 'Cargando...' },

  // ── GENERIC STATES ───────────────────────────────────────────
  'state.noData':            { en: 'Nothing here yet', es: 'Nada aquí todavía' },
  'state.error':             { en: 'Something went wrong', es: 'Algo salió mal' },
  'state.success':           { en: 'Saved!',        es: '¡Guardado!' },

}

// ── Main translation function ──────────────────────────────────
// t('auth.signIn', lang) → 'Sign In' or 'Iniciar sesión'
export function t(key, lang = 'en') {
  const entry = strings[key]
  if (!entry) {
    console.warn(`[i18n] Missing key: "${key}"`)
    return key
  }
  return entry[lang] ?? entry['en'] ?? key
}

// ── Format a date with translated month/day names ──────────────
// formatDate(new Date(), lang) → 'May 1' or '1 de mayo'
export function formatDate(date, lang = 'en') {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const months = [
    t('month.january', lang), t('month.february', lang), t('month.march', lang),
    t('month.april', lang),   t('month.mayFull', lang),  t('month.june', lang),
    t('month.july', lang),    t('month.august', lang),   t('month.september', lang),
    t('month.october', lang), t('month.november', lang), t('month.december', lang),
  ]
  const month = months[d.getMonth()]
  const day   = d.getDate()
  const year  = d.getFullYear()
  return lang === 'es' ? `${day} de ${month} ${year}` : `${month} ${day}, ${year}`
}

// ── Format a short date (no year) ─────────────────────────────
// formatShortDate(new Date(), lang) → 'May 1' or '1 de mayo'
export function formatShortDate(date, lang = 'en') {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const monthKeys = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  const month = t(`month.${monthKeys[d.getMonth()]}`, lang)
  const day   = d.getDate()
  return lang === 'es' ? `${day} ${month}` : `${month} ${day}`
}

// ── Format date + time ─────────────────────────────────────────
export function formatDateTime(date, lang = 'en') {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const dateStr = formatShortDate(d, lang)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return `${dateStr} ${h12}:${m} ${ampm}`
}

// ── Get translated day name from a Date ───────────────────────
const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
const DAY_SHORT_KEYS = ['sun','mon','tue','wed','thu','fri','sat']
export function getDayName(date, lang = 'en', short = false) {
  const d = typeof date === 'string' ? new Date(date) : date
  const key = short ? DAY_SHORT_KEYS[d.getDay()] : DAY_KEYS[d.getDay()]
  return t(`day.${key}`, lang)
}
