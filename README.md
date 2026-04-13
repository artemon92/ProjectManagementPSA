# PSA BDP - Gestión de Proyectos Ocean Freight

Aplicación web progresiva (PWA) para la gestión de proyectos de Global Ocean Freight en PSA BDP. Diseñada para Product Managers que necesitan una herramienta completa y offline-first.

## Características

### Módulos Principales

- **Cover Page**: Información general del proyecto, metadatos, fechas, equipo
- **Scope**: Gestión de requisitos y alcance (Pre/During/Post-Implementation)
- **Kick-off Template**: Plantilla estandarizada para iniciar proyectos
- **Project Plan**: Planificación tipo Gantt con fases, tareas y dependencias
- **PSR (Project Status Report)**: Reporte de estado con KPIs (Schedule, Budget, Resources, Scope, Risks)
- **OIL (Open Item List)**: Seguimiento de issues y action items
- **UAT Test Tracker**: Gestión de pruebas de aceptación
- **Vacation Coverage**: Planificación de ausencias y backups
- **Participantes**: Directorio de stakeholders internos y externos
- **Email Reporting**: Generación automática de emails de status semanal

### Características Técnicas

- **Offline-first**: IndexedDB para almacenamiento local
- **Multi-proyecto**: Gestión de múltiples proyectos independientes
- **PWA**: Instalable en dispositivos móviles y escritorio
- **Responsive**: Optimizado para desktop, tablet y móvil
- **Export/Import**: Backup en JSON con todo el proyecto
- **Modo claro/oscuro**: Tema adaptable

## Estructura del Proyecto

```
GestionProyectosPSA/
├── index.html              # App shell principal
├── css/
│   └── styles.css          # Estilos con tema claro/oscuro
├── js/
│   ├── db.js               # Capa IndexedDB (CRUD)
│   ├── app.js              # Navegación, modales, utilidades
│   └── modules/
│       ├── cover.js        # Cover Page
│       ├── scope.js        # Scope & Requisitos
│       ├── kickoff.js      # Kick-off Template
│       ├── plan.js         # Project Plan (Gantt)
│       ├── psr.js          # Project Status Report
│       ├── oil.js          # Open Item List
│       ├── uat.js          # UAT Test Tracker
│       ├── vacation.js     # Vacation Coverage
│       ├── participants.js # Participantes
│       ├── email.js        # Email Reporting
│       └── report.js       # Generación de reportes
├── manifest.json           # Web App Manifest (PWA)
├── sw.js                   # Service Worker
└── README.md
```

## Instalación y Uso

### Requisitos

- Navegador moderno con soporte para IndexedDB (Chrome, Firefox, Safari, Edge)
- Servidor HTTP estático (opcional para desarrollo local)

### Iniciar en Desarrollo

```bash
# Usando Python
python3 -m http.server 8080

# Usando Node.js
npx http-server -p 8080

# Usando PHP
php -S localhost:8080
```

Abre `http://localhost:8080` en tu navegador.

### Instalar como PWA

1. Abre la aplicación en Chrome/Edge/Safari
2. Busca la opción "Instalar" o "Añadir a pantalla de inicio" en el menú del navegador
3. La app se instalará como aplicación nativa con acceso offline

## Base de Datos

La aplicación utiliza IndexedDB local con las siguientes stores:

| Store | Descripción |
|-------|-------------|
| `projects` | Proyectos (metadata general) |
| `cover` | Información de Cover Page por proyecto |
| `scope` | Items de scope/requisitos |
| `kickoff` | Datos del kick-off template |
| `tasks` | Tareas del plan de proyecto |
| `psr` | Project Status Reports históricos |
| `oil` | Open Items / Issues |
| `uat` | Casos de prueba UAT |
| `vacation` | Registros de vacaciones |
| `participants` | Participantes y stakeholders |

## Uso del Flujo de Trabajo

### 1. Crear Nuevo Proyecto
- Desde la pantalla de selector, haz clic en "Nuevo Proyecto"
- Ingresa el nombre del proyecto

### 2. Completar Cover Page
- Define el tipo de proyecto (Digitalización, Optimización, etc.)
- Establece fechas de inicio y Go-Live
- Documenta el Business Case
- Lista el equipo interno y externo

### 3. Definir Scope
- Añade items de scope por fase (Pre/During/Post)
- Define prioridades y estados
- Documenta comments para cada item

### 4. Kick-off Template
- Documenta métricas clave (KPIs)
- Define fuentes de datos y lógica de negocio
- Establece governance: frecuencia de reporting, meetings, escalation path
- Usa "Copiar para Email" para notificar stakeholders

### 5. Project Plan
- Crea fases (Initiation, Planning, Development, Testing, UAT, Go-Live)
- Añade tareas con fechas, responsables y dependencias
- Visualiza el timeline Gantt
- Guarda el plan inicial como baseline

### 6. Weekly PSR
- Actualiza el PSR semanalmente
- Registra health indicators (Green/Amber/Red)
- Documenta accomplishments, issues y next steps
- Revisa el resumen automático de OIL

### 7. OIL Management
- Registra todos los issues que surgen
- Asigna responsables y fechas target
- Prioriza (Crítica/Alta/Media/Baja)
- Actualiza estados en las reuniones semanales

### 8. UAT Testing
- Define casos de prueba con steps y expected results
- Asigna testers y registra resultados
- Track de status: Open, In Progress, Passed, Failed

### 9. Email Reporting
- Genera el email semanal automáticamente desde el último PSR
- Personaliza destinatarios y asunto
- Copia al portapapeles o abre el cliente de email

## Exportar e Importar Proyectos

### Backup de un proyecto
1. Dentro del proyecto, haz clic en el botón "Exportar" (icono de descarga)
2. Se descargará un archivo JSON con todo el proyecto

### Restaurar un proyecto
1. Desde el selector de proyectos, haz clic en "Importar"
2. Selecciona el archivo JSON exportado
3. El proyecto se creará como una copia nueva

## Personalización para tu Organización

### Colores corporativos PSA BDP
Los colores oficiales ya están configurados en `css/styles.css`:
```css
:root {
  --primary: #0B1F3F;      /* Navy Blue - Color corporativo principal */
  --primary-light: #1a3a6e; /* Azul claro para hover */
  --primary-dark: #051020;  /* Azul oscuro */
  --secondary: #E31837;     /* Rojo PSA BDP */
  --accent: #00B2E3;        /* Cyan/Azul eléctrico */
}
```

### Logo
El logo SVG de PSA BDP está en `img/logo-psa-bdp.svg` y `img/logo-psa-bdp-white.svg` para fondos oscuros.

### Tipos de proyecto
Edita las opciones en `index.html` dentro del select `#cover-project-type` para añadir tipos específicos de tu organización.

### Regiones
Modifica las opciones en el select `#cover-region` para ajustar a tu estructura geográfica.

## Notas de Desarrollo

- **Vanilla JS**: Sin frameworks, sin bundlers, sin dependencias locales
- **Lucide Icons**: Iconos cargados desde CDN
- **Inter Font**: Fuente cargada desde Google Fonts
- **ES6+**: Usa async/await, arrow functions, template literals

## Licencia

Proyecto privado - PSA BDP.
