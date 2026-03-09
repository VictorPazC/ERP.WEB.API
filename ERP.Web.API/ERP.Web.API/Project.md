PROMPT: Auditoría del Proyecto ERP + Planeación de Nuevas Funcionalidades
Instrucciones para el Agente / LLM
Eres un arquitecto de software senior especializado en sistemas ERP modernos. Tu tarea es realizar dos entregables en un solo documento Markdown:

PARTE 1 — Auditoría del estado actual del proyecto
PARTE 2 — Planeación de nuevas funcionalidades basada en un mockup de referencia


PARTE 1: Auditoría del Proyecto Actual
Analiza el proyecto ERP llamado ChiwasGamers - ERP Admin y documenta exhaustivamente lo siguiente. Si no tienes acceso directo al código, usa la información provista más abajo como fuente de verdad.
1.1 Información General

Nombre del proyecto, descripción y propósito
Stack tecnológico completo (frontend, backend, base de datos, infraestructura, servicios externos)
Versiones de dependencias clave
Entornos disponibles (dev, staging, prod)

1.2 Arquitectura

Tipo de arquitectura (monolito, microservicios, MVC, etc.)
Estructura de carpetas y módulos principales
Flujo de datos general (cómo se conectan frontend ↔ backend ↔ BD)
Autenticación y manejo de sesiones
Sistema de roles y permisos

1.3 Módulos / Funcionalidades Actuales
Documenta cada módulo existente con:

Nombre del módulo
Descripción funcional
Endpoints o rutas asociadas (si aplica)
Estado: ✅ Completo | 🚧 En desarrollo | ❌ No implementado

Los módulos conocidos hasta ahora son:
MóduloDescripciónEstadoDashboardVista general con KPIs básicos🚧 BásicoCategoríasGestión de categorías de productos✅MarcasGestión de marcas✅ProductosCRUD de productos✅InventarioControl de stock🚧ArtículosContenido/blog❓ConsumosRegistro de consumos/ventas🚧PedidosGestión de órdenes❓TagsEtiquetado de productos❓PromocionesDescuentos y promos activas❓ImágenesGestión de media❓
1.4 Estilos y UI

Sistema de diseño utilizado (custom CSS, Tailwind, Material UI, etc.)
Paleta de colores principal
Tipografía
Tema actual (dark mode por defecto)
Componentes reutilizables existentes

1.5 Estado actual del Dashboard
El dashboard actual muestra:

KPIs: Productos, Total Stock, Ganancia Realizada, Consumos, Categorías, Tags, Promos Activas, Imágenes
Widget: Ganancia Realizada (con link "View all")
Widget: Margen Estimado
Widget: Promociones Activas
Widget: Low Stock (texto plano)
Limitaciones detectadas: sin gráficas, sin actividad reciente, sin filtros de fecha, sin acciones rápidas, sin alertas proactivas, sin agrupación de menú lateral


PARTE 2: Planeación de Nuevas Funcionalidades
Basándote en el mockup de referencia proporcionado, genera un plan de implementación detallado para llevar el proyecto del estado actual al estado propuesto.
2.1 Análisis de Brechas (Gap Analysis)
Compara el dashboard actual vs el mockup mejorado e identifica cada diferencia como una tarea accionable:
#ComponenteEstado ActualEstado PropuestoPrioridad1KPI CardsBásicas, sin tendenciaCon sparklines y % de cambioAlta2AlertasSin alertasBanner proactivo de stock críticoAlta3GráficasNo existenGráfico barras semanal (ventas vs pedidos)Alta4Actividad RecienteNo existeFeed con timestamp, tipo y montoMedia5Top ProductosNo existeRanking con barra de progresoMedia6Acciones RápidasNo existeGrid de 6 botones de acceso directoMedia7Stock CríticoLista pasivaTabla con botón directo de reposiciónAlta8TopbarSin búsqueda ni notificacionesSearch, notificaciones, filtro de fechasMedia9SidebarSin agrupación ni badgesSecciones agrupadas + badges numéricosBaja10Hover/AnimacionesSin interacciónHover en cards, bordes iluminadosBaja
2.2 Épicas y Tareas
🔴 ÉPICA 1 — Alertas y Monitoreo Proactivo
Objetivo: El sistema debe notificar al usuario sin que tenga que buscar problemas.

 TASK-01 Crear componente AlertBanner reutilizable con tipos: warning, error, info
 TASK-02 Endpoint /api/inventory/critical que retorne productos con stock < umbral configurable
 TASK-03 Lógica en el dashboard para consumir el endpoint y mostrar el banner si hay resultados
 TASK-04 Badge numérico en ítem de menú "Inventario" con conteo de críticos
 TASK-05 Badge numérico en ítem "Pedidos" con pedidos pendientes

🔴 ÉPICA 2 — Dashboard Gráficas y Métricas
Objetivo: Visualizar tendencias sin tener que ir a un reporte externo.

 TASK-06 Integrar librería de gráficas (Recharts / Chart.js / ApexCharts)
 TASK-07 Endpoint /api/dashboard/weekly-stats con datos de ventas y pedidos por día
 TASK-08 Componente WeeklySalesChart (barras agrupadas: ganancias vs pedidos)
 TASK-09 Agregar mini sparklines dentro de cada KPI card
 TASK-10 Agregar indicador de tendencia (↑ ↓ —) con porcentaje vs período anterior
 TASK-11 Implementar filtro de rango de fechas en topbar (últimos 7d / 30d / 90d / custom)

🟡 ÉPICA 3 — Feed de Actividad Reciente
Objetivo: El usuario debe saber qué pasó en el sistema sin revisar cada módulo.

 TASK-12 Crear tabla/colección activity_log en BD con campos: type, title, description, amount, timestamp, user_id
 TASK-13 Hook/middleware que registre automáticamente eventos: nuevo pedido, stock bajo, promo activada, inventario actualizado
 TASK-14 Endpoint /api/activity?limit=10
 TASK-15 Componente ActivityFeed con íconos por tipo de evento, monto y tiempo relativo ("hace 5 min")

🟡 ÉPICA 4 — Top Productos
Objetivo: Visibilidad inmediata del rendimiento por producto.

 TASK-16 Endpoint /api/products/top?limit=5&metric=revenue (configurable por métrica)
 TASK-17 Componente TopProductsList con ranking, barra de progreso proporcional y valor
 TASK-18 Opción de cambiar métrica: por ingresos / por unidades vendidas / por consumos

🟡 ÉPICA 5 — Acciones Rápidas
Objetivo: Reducir clics para las tareas más frecuentes.

 TASK-19 Componente QuickActions con grid 2x3 configurable
 TASK-20 Acciones iniciales: Nuevo Producto, Agregar Stock, Crear Pedido, Nueva Promo, Nuevo Artículo, Ver Reportes
 TASK-21 Cada botón debe navegar directamente al formulario correspondiente (no solo al módulo)

🟢 ÉPICA 6 — Mejoras de UX / UI
Objetivo: El sistema se siente más vivo y profesional.

 TASK-22 Refactorizar sidebar con secciones agrupadas: Main / Ventas / Contenido
 TASK-23 Agregar topbar con barra de búsqueda global (búsqueda de productos, pedidos, clientes)
 TASK-24 Agregar ícono de notificaciones en topbar con panel desplegable
 TASK-25 Hover effects en KPI cards (translateY, border glow)
 TASK-26 Stock crítico: reemplazar texto plano por tabla con botón "+Stock" por producto
 TASK-27 Mostrar fecha/saludo personalizado en topbar ("Bienvenido, Admin — Hoy es...")

2.3 Orden de Implementación Sugerido (Sprints)
Sprint 1 — Datos y Backend (Semana 1-2)

TASK-02 Endpoint stock crítico
TASK-07 Endpoint weekly stats
TASK-12 Tabla activity_log
TASK-13 Middleware de registro de eventos
TASK-14 Endpoint activity feed
TASK-16 Endpoint top productos

Sprint 2 — Componentes Core (Semana 3-4)

TASK-01 AlertBanner
TASK-06 Setup librería de gráficas
TASK-08 WeeklySalesChart
TASK-15 ActivityFeed
TASK-17 TopProductsList
TASK-03 Lógica banner en dashboard

Sprint 3 — KPIs y Quick Actions (Semana 5)

TASK-09 Sparklines en KPI cards
TASK-10 Indicadores de tendencia
TASK-11 Filtro de fechas
TASK-19 QuickActions grid
TASK-26 Tabla stock crítico con botones

Sprint 4 — UX y Polish (Semana 6)

TASK-22 Sidebar agrupado
TASK-04 / TASK-05 Badges en menú
TASK-23 Búsqueda global
TASK-24 Panel de notificaciones
TASK-25 Hover effects
TASK-27 Saludo personalizado

2.4 Consideraciones Técnicas

Todos los endpoints nuevos deben seguir el patrón REST ya establecido en el proyecto
Los componentes deben ser reutilizables y aceptar props de configuración
El filtro de fechas debe ser global (context/store) para que todos los widgets lo respeten
Los sparklines pueden generarse con CSS puro o una micro-librería para no inflar el bundle
El activity_log debe tener índice en timestamp y user_id para queries eficientes
Considerar caché (Redis o similar) para los endpoints de dashboard si el volumen de datos crece

2.5 Definición de "Listo" (DoD)
Una funcionalidad se considera completa cuando:

 Funciona en desktop y mobile (responsive)
 Maneja estados vacíos ("No hay datos aún")
 Maneja errores de red con mensaje amigable
 El código tiene al menos comentarios en funciones clave
 Fue revisado visualmente contra el mockup de referencia