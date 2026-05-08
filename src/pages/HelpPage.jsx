import React, { useState } from "react"
import { useApp } from '../context/AppContext'

const sections = {
  en: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: '🏠',
      items: [
        { icon: '🔔', label: 'Bell — notifications', desc: 'Tap to see all alerts. The red number shows how many you haven\'t read — mentions, new tasks, completed jobs.' },
        { icon: '📋', label: 'Tasks icon — my assigned tasks', desc: 'Shows all tasks assigned to you. Red number = how many are still open. Tap to see what needs to be done.' },
        { icon: '👤', label: 'Profile photo — settings', desc: 'Tap your photo to open settings — update your name, phone, profile picture, or language.' },
        { icon: '🏡', label: 'Property cards', desc: 'Each card is a property. Tap it to see all tasks. Red number = open tasks still remaining.' },
        { icon: '✅', label: 'Active / Completed tabs', desc: 'Active = properties with work still to do. Completed = finished properties.' },
      ]
    },
    {
      id: 'property',
      title: 'Property page',
      icon: '🏗️',
      items: [
        { icon: '←', label: 'Back arrow', desc: 'Tap to go back to the main property list.' },
        { icon: '🔢', label: 'Tab numbers — Today / Upcoming / Done', desc: 'Today = tasks due now or overdue. Upcoming = future tasks. Done = completed tasks. Numbers show how many are in each tab.' },
        { icon: '⚠️', label: 'Red "Overdue" badge', desc: 'This task is past its due date. Needs attention right away. Red left border also indicates overdue.' },
        { icon: '🌐', label: 'Bilingual task description', desc: 'Your language shows in bold. The translation appears in gray underneath. Both are always saved automatically.' },
        { icon: '📷', label: 'Orange camera button — new task', desc: 'Tap to create a new task — add a photo, description, due date, and assign it to a team member.' },
        { icon: '👆', label: 'Task card — tap to open', desc: 'Tap anywhere on a task to open it — view photos, add comments, mark complete, or assign to someone.' },
      ]
    },
    {
      id: 'create',
      title: 'Creating a task',
      icon: '➕',
      items: [
        { icon: '📷', label: 'Before photos (0/5)', desc: 'Tap to take a photo or choose from your gallery. On desktop you can drag and drop. Up to 5 photos per task.' },
        { icon: '✏️', label: 'Task description', desc: 'Type what needs to be done in your language — it will automatically be translated and saved in both English and Spanish.' },
        { icon: '📅', label: 'Due date (optional)', desc: 'Set a deadline. If left blank it still appears under Today. Overdue tasks show a red warning badge.' },
        { icon: '👷', label: 'Assign to', desc: 'Choose who is responsible. The assigned person gets a push notification and the task appears in their My Tasks list.' },
        { icon: '💾', label: 'Create task button', desc: 'Tap to save. You must have either a photo or a description. The task appears immediately on the property.' },
      ]
    },
    {
      id: 'photos',
      title: 'Adding photos',
      icon: '📸',
      items: [
        { icon: '📷', label: 'Take photo', desc: 'Opens your camera to take a new photo on the spot. Works on both iPhone and Android.' },
        { icon: '🖼️', label: 'Choose from gallery', desc: 'Pick one or more photos from your phone\'s photo library. You can select up to 5 at once.' },
        { icon: '🖥️', label: 'On desktop?', desc: 'On a computer, drag and drop an image file directly onto the Add Photo area to upload it.' },
        { icon: '👆', label: 'Tap to view full size', desc: 'Tap any photo in a task to see it full screen. Swipe left or right to browse all photos without closing.' },
      ]
    },
    {
      id: 'taskdetail',
      title: 'Task detail',
      icon: '📋',
      items: [
        { icon: '🌐', label: 'Title + translation', desc: 'Task in your language (bold), translation in gray below. Always saved in both languages.' },
        { icon: '📷', label: 'Before photos', desc: 'Photos taken when task was created. Tap to view full size, swipe to browse. Tap red X to delete.' },
        { icon: 'ℹ️', label: 'Created by / Due date / Assigned to', desc: 'Shows who created the task, when it\'s due, and who is responsible. Use the Assigned to dropdown to reassign.' },
        { icon: '✅', label: 'Mark as done button', desc: 'Tap to complete the task. You\'ll be asked to upload a proof photo showing the work is finished.' },
        { icon: '💬', label: 'Comments + @mentions', desc: 'Type a comment and tap the arrow to send. Type @ then start typing a name — a list will appear, tap the name to select them. They\'ll get a push notification.' },
      ]
    },
    {
      id: 'completed',
      title: 'Completed task',
      icon: '✔️',
      items: [
        { icon: '🟢', label: 'Completed by + date', desc: 'Green boxes show who completed the task and exactly when. This is your official record of proof.' },
        { icon: '📸', label: 'After photos — proof of work', desc: 'Photos uploaded when marking the task complete. Tap + Add to add more. Tap any photo to view full size.' },
        { icon: '💬', label: 'Comments still open', desc: 'You can still leave comments after a task is done. Use @name to notify someone.' },
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      items: [
        { icon: '🔵', label: 'Blue dot — unread', desc: 'A blue dot means you haven\'t read this notification yet. Blue background also highlights unread items.' },
        { icon: '✓✓', label: 'Mark all', desc: 'Tap "Mark all" top right to mark every notification as read at once. The red badge on the bell will clear.' },
        { icon: '💬', label: 'Mention notification', desc: 'Someone used @yourname in a comment. Tap it to jump straight to that task.' },
        { icon: '✅', label: 'Task completed notification', desc: 'You\'ll be notified when someone marks a task as done. Tap to open the task and see the proof photo.' },
      ]
    },
    {
      id: 'mytasks',
      title: 'My Tasks',
      icon: '📝',
      items: [
        { icon: '📋', label: 'My Tasks page', desc: 'Shows only tasks assigned to you from any property. Tap the 📋 icon on the dashboard to get here.' },
        { icon: '🔢', label: 'Open count', desc: 'Shows how many tasks are still open and assigned to you. Matches the red badge on the 📋 icon.' },
        { icon: '⚠️', label: 'Overdue — top of list', desc: 'Red Overdue badge = past due date. These appear first so you see them right away.' },
        { icon: '📅', label: 'Today / date badges', desc: 'Yellow Today = due today. Gray date = future due date. Order: overdue first, today second, future last.' },
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      items: [
        { icon: '📷', label: 'Profile photo', desc: 'Tap the orange camera button for a new photo. Tap your existing photo to crop or adjust it.' },
        { icon: '✏️', label: 'Edit profile', desc: 'Update your name and phone number. Changes save immediately.' },
        { icon: '🌐', label: 'Language', desc: 'The orange button is your current language. Tap the other to switch — the whole app changes instantly.' },
        { icon: '📅', label: 'Work log', desc: 'Log which property you worked on today. Keeps a record by date and location.' },
        { icon: '🚪', label: 'Sign out', desc: 'Tap to log out. You\'ll need your email and password to log back in.' },
      ]
    },
  ],
  es: [
    {
      id: 'dashboard',
      title: 'Tablero',
      icon: '🏠',
      items: [
        { icon: '🔔', label: 'Campana — notificaciones', desc: 'Tócala para ver todas tus alertas. El número rojo muestra cuántas no has leído — menciones, nuevas tareas, trabajos completados.' },
        { icon: '📋', label: 'Ícono tareas — mis tareas asignadas', desc: 'Muestra todas las tareas asignadas a ti. Número rojo = cuántas siguen abiertas. Tócalo para ver qué hay que hacer.' },
        { icon: '👤', label: 'Foto de perfil — ajustes', desc: 'Toca tu foto para abrir ajustes — actualiza tu nombre, teléfono, foto de perfil o idioma.' },
        { icon: '🏡', label: 'Tarjetas de propiedad', desc: 'Cada tarjeta es una propiedad. Tócala para ver todas las tareas. Número rojo = tareas abiertas que aún quedan.' },
        { icon: '✅', label: 'Pestañas Activos / Completados', desc: 'Activos = propiedades con trabajo pendiente. Completados = propiedades terminadas.' },
      ]
    },
    {
      id: 'property',
      title: 'Página de propiedad',
      icon: '🏗️',
      items: [
        { icon: '←', label: 'Flecha atrás', desc: 'Tócala para regresar a la lista principal de propiedades.' },
        { icon: '🔢', label: 'Números — Hoy / Pendientes / Hechas', desc: 'Hoy = tareas de hoy o vencidas. Pendientes = tareas futuras. Hechas = completadas. Los números muestran cuántas hay en cada pestaña.' },
        { icon: '⚠️', label: 'Etiqueta roja "Vencida"', desc: 'Esta tarea pasó su fecha límite. Necesita atención inmediata. El borde rojo a la izquierda también lo indica.' },
        { icon: '🌐', label: 'Descripción bilingüe', desc: 'Tu idioma aparece en negrita. La traducción aparece en gris abajo. Ambas se guardan automáticamente siempre.' },
        { icon: '📷', label: 'Botón naranja — nueva tarea', desc: 'Tócalo para crear una nueva tarea — agrega foto, descripción, fecha límite y asígnala a alguien.' },
        { icon: '👆', label: 'Tarjeta de tarea — toca para abrir', desc: 'Toca en cualquier parte de la tarjeta para abrirla — ver fotos, comentarios, marcarla completada o asignarla.' },
      ]
    },
    {
      id: 'create',
      title: 'Crear una tarea',
      icon: '➕',
      items: [
        { icon: '📷', label: 'Fotos antes (0/5)', desc: 'Toca para tomar una foto o elegir de tu galería. En computadora puedes arrastrar y soltar. Hasta 5 fotos por tarea.' },
        { icon: '✏️', label: 'Descripción de la tarea', desc: 'Escribe lo que hay que hacer en tu idioma — se traducirá automáticamente y se guardará en inglés y español.' },
        { icon: '📅', label: 'Fecha límite (opcional)', desc: 'Pon una fecha límite. Si la dejas en blanco igual aparecerá en Hoy. Las tareas vencidas muestran una alerta roja.' },
        { icon: '👷', label: 'Asignar a', desc: 'Elige quién es responsable. La persona asignada recibirá una notificación y aparecerá en su lista Mis Tareas.' },
        { icon: '💾', label: 'Botón Crear tarea', desc: 'Toca para guardar. Debes tener al menos una foto o una descripción. La tarea aparecerá de inmediato en la propiedad.' },
      ]
    },
    {
      id: 'photos',
      title: 'Agregar fotos',
      icon: '📸',
      items: [
        { icon: '📷', label: 'Tomar foto', desc: 'Abre tu cámara para tomar una foto nueva en el momento. Funciona en iPhone y Android.' },
        { icon: '🖼️', label: 'Elegir de galería', desc: 'Selecciona una o más fotos de tu galería. Puedes elegir hasta 5 a la vez.' },
        { icon: '🖥️', label: '¿Usas computadora?', desc: 'En computadora, arrastra y suelta un archivo de imagen directamente sobre el área de Agregar foto.' },
        { icon: '👆', label: 'Toca para ver en grande', desc: 'Toca cualquier foto en una tarea para verla en pantalla completa. Desliza para ver todas las fotos sin cerrar.' },
      ]
    },
    {
      id: 'taskdetail',
      title: 'Detalle de tarea',
      icon: '📋',
      items: [
        { icon: '🌐', label: 'Título + traducción', desc: 'La tarea en tu idioma (negrita), traducción en gris abajo. Siempre guardada en ambos idiomas.' },
        { icon: '📷', label: 'Fotos antes', desc: 'Fotos tomadas al crear la tarea. Toca para ver en grande, desliza para ver todas. Toca X roja para eliminar.' },
        { icon: 'ℹ️', label: 'Creado por / Fecha límite / Asignado a', desc: 'Muestra quién creó la tarea, cuándo vence y quién es responsable. Usa el menú Asignado a para reasignar.' },
        { icon: '✅', label: 'Botón Marcar como hecho', desc: 'Toca para completar la tarea. Se te pedirá subir una foto de prueba que muestre que el trabajo está terminado.' },
        { icon: '💬', label: 'Comentarios + @menciones', desc: 'Escribe un comentario y toca la flecha para enviarlo. Escribe @ y empieza a escribir un nombre — aparecerá una lista, toca el nombre para seleccionarlo. Esa persona recibirá una notificación.' },
      ]
    },
    {
      id: 'completed',
      title: 'Tarea completada',
      icon: '✔️',
      items: [
        { icon: '🟢', label: 'Completado por + fecha', desc: 'Los cuadros verdes muestran quién completó la tarea y exactamente cuándo. Este es tu registro oficial de prueba.' },
        { icon: '📸', label: 'Fotos después — prueba del trabajo', desc: 'Fotos subidas al completar la tarea. Toca + Agregar para añadir más. Toca cualquier foto para verla en grande.' },
        { icon: '💬', label: 'Comentarios siguen abiertos', desc: 'Puedes seguir dejando comentarios después de completar una tarea. Usa @nombre para notificar a alguien.' },
      ]
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: '🔔',
      items: [
        { icon: '🔵', label: 'Punto azul — no leída', desc: 'Un punto azul significa que aún no has leído esta notificación. El fondo azul también resalta los elementos no leídos.' },
        { icon: '✓✓', label: 'Marcar todo', desc: 'Toca "Marcar todo" arriba a la derecha para marcar todas como leídas. El número rojo en la campana desaparecerá.' },
        { icon: '💬', label: 'Notificación de mención', desc: 'Alguien usó @tunombre en un comentario. Tócala para ir directo a esa tarea.' },
        { icon: '✅', label: 'Notificación de tarea completada', desc: 'Recibirás una notificación cuando alguien marque una tarea como hecha. Tócala para ver la foto de prueba.' },
      ]
    },
    {
      id: 'mytasks',
      title: 'Mis Tareas',
      icon: '📝',
      items: [
        { icon: '📋', label: 'Página Mis Tareas', desc: 'Muestra solo las tareas asignadas a ti de cualquier propiedad. Toca el ícono 📋 en el tablero para llegar aquí.' },
        { icon: '🔢', label: 'Contador de abiertas', desc: 'Muestra cuántas tareas siguen abiertas y asignadas a ti. Coincide con el número rojo en el ícono 📋.' },
        { icon: '⚠️', label: 'Vencidas — al principio de la lista', desc: 'La etiqueta roja Vencida = pasó la fecha límite. Aparecen primero para que las veas de inmediato.' },
        { icon: '📅', label: 'Etiquetas Hoy / fecha', desc: 'Amarilla Hoy = vence hoy. Gris = fecha futura. Orden: vencidas primero, hoy segundo, futuras al final.' },
      ]
    },
    {
      id: 'settings',
      title: 'Ajustes',
      icon: '⚙️',
      items: [
        { icon: '📷', label: 'Foto de perfil', desc: 'Toca el botón naranja de cámara para una foto nueva. Toca tu foto actual para recortarla o ajustarla.' },
        { icon: '✏️', label: 'Editar perfil', desc: 'Actualiza tu nombre y teléfono. Los cambios se guardan de inmediato.' },
        { icon: '🌐', label: 'Idioma', desc: 'El botón naranja es tu idioma actual. Toca el otro para cambiar — toda la app cambia al instante.' },
        { icon: '📅', label: 'Registro de trabajo', desc: 'Registra en qué propiedad trabajaste hoy. Lleva un historial por fecha y ubicación.' },
        { icon: '🚪', label: 'Cerrar sesión', desc: 'Toca para cerrar sesión. Necesitarás tu correo y contraseña para volver a entrar.' },
      ]
    },
  ]
}

export default function HelpPage({ onBack }) {
  const { lang } = useApp()
  const [openSection, setOpenSection] = React.useState(null)
  const content = sections[lang] || sections.en
  const title = lang === 'es' ? 'Ayuda' : 'Help'

  return (
    <div className="min-h-screen bg-gray-50 page-enter">
      <div className="bg-brand-700 safe-top">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={onBack} className="text-white text-xl active:scale-95">←</button>
          <h2 className="text-lg font-bold text-white flex-1">{title}</h2>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {content.map(section => (
          <div key={section.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className="w-full flex items-center justify-between px-4 py-4 active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <span className="font-semibold text-gray-800">{section.title}</span>
              </div>
              <span className="text-gray-400 text-lg">{openSection === section.id ? '▲' : '▼'}</span>
            </button>

            {openSection === section.id && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {section.items.map((item, i) => (
                  <div key={i} className="px-4 py-3 flex gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">{item.label}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
