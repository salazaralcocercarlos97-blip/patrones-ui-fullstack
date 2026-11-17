# Laboratorios FICCT – Catálogo de Patrones UI (versión con backend)

Proyecto demostrativo de **Patrones UI** para **INF513 Tecnología Web – Grupo 08 SA (2/2026)**.

Es la SPA de `patrones-ui` (React + Vite, JavaScript) que implementa, funcionando de verdad, los **21 patrones UI
del informe en 6 categorías**, con:

- **Backend:** API REST con **Node + Express**.
- **Base de datos:** **SQLite** (un archivo, sin instalar ningún servidor de base de datos). Usa el módulo
  `node:sqlite` que ya trae Node.
- **Panel del encargado** (`#/panel`): panel de control, tabla de reservas, alta/edición/baja de laboratorios,
  reportes y configuración de las reservas. Es una demo **sin inicio de sesión**.
- **Modo de respaldo:** si el servidor no responde, la app sigue funcionando con los datos de `src/data.js` y guarda
  las reservas en el navegador, con un aviso y un botón «Reintentar». En ese modo, el CRUD de laboratorios y la
  configuración quedan en solo lectura, con un mensaje que lo explica.
- **Validación compartida:** las reglas viven en `src/reglas.js` (reservas) y `src/reglasPanel.js` (laboratorios y
  configuración). Los formularios las usan para ayudar al usuario y el servidor las vuelve a aplicar antes de guardar.
- **Configuración aplicada de verdad:** el horario de atención, la duración máxima de una reserva y la anticipación
  máxima se guardan en la tabla `configuracion` y los usan el formulario de reserva, el servidor, el carrusel, la
  ayuda y la ocupación del panel.

## Cómo funciona

```
Navegador (React, puerto 5173)
   │  fetch('/api/...')         ← src/api.js
   ▼
Vite (proxy /api) ──────────────► Express (puerto 3001)   ← server/app.js
                                     │  consultas con parámetros (?)
                                     ▼
                                  SQLite: server/datos/laboratorios.db   ← server/db.js + esquema.sql
```

La primera vez que arranca, el servidor crea la base de datos y la llena con 6 laboratorios, 23 materias,
17 docentes, 33 clases, 2 reservas de ejemplo y la configuración por defecto (07:00 a 22:45, reservas de hasta 4 h y
hasta 60 días de anticipación). La tabla `configuracion` se siembra aparte, cuando está vacía, así que una base creada
con una versión anterior también la recibe al iniciar.

### API

| Método | Ruta | Qué hace | Respuestas |
|---|---|---|---|
| GET | `/api/salud` | Comprueba que el servidor responde | 200 |
| GET | `/api/laboratorios` | Laboratorios con su software | 200 |
| POST | `/api/laboratorios` | Crea un laboratorio | 201 creado · 422 datos inválidos o código repetido (con `errores` por campo) |
| PUT | `/api/laboratorios/:codigo` | Modifica un laboratorio (el código no cambia) | 200 · 404 si no existe · 422 datos inválidos |
| DELETE | `/api/laboratorios/:codigo` | Elimina un laboratorio y su software | 204 · 404 si no existe · 409 si tiene clases o reservas (con un mensaje que lo explica) |
| GET | `/api/clases` | Horario de clases (con materia y docente) | 200 |
| GET | `/api/reservas` | Reservas registradas | 200 |
| POST | `/api/reservas` | Crea una reserva (con la configuración vigente) | 201 creada · 422 datos inválidos (con `errores` por campo) · 404 lab inexistente |
| DELETE | `/api/reservas/:id` | Cancela una reserva | 204 · 404 si ya no existe |
| GET | `/api/configuracion` | Horario de atención, duración máxima y anticipación máxima | 200 |
| PUT | `/api/configuracion` | Guarda la configuración | 200 · 422 datos inválidos (cierre ≤ apertura, duración fuera de 1–8 h, anticipación fuera de 1–180 días) |

Un laboratorio válido tiene código con formato `236-NN` (único), capacidad de 1 a 100 PCs, estado `DISPONIBLE` o
`MANTENIMIENTO`, ubicación, descripción (10 a 300 caracteres), motivo obligatorio si está en mantenimiento y al menos
un programa de software (sin repetidos).

### Tablas (server/esquema.sql)

`laboratorio`, `laboratorio_software`, `materia`, `docente`, `clase`, `reserva` y `configuracion` (pares
clave/valor: `hora_apertura`, `hora_cierre`, `duracion_maxima_horas` y `anticipacion_maxima_dias`), con llaves
foráneas y restricciones `CHECK` (código `236-NN`, capacidad 1–100, estado del lab, día 1–6, tipo de reserva,
motivo de 10 a 200 caracteres, hora fin > inicio).

Para ver la base de datos con una interfaz gráfica, abre `server/datos/laboratorios.db` con
[DB Browser for SQLite](https://sqlitebrowser.org/).

## Los 21 patrones (6 categorías) y dónde verlos

| # | Categoría | Patrón | Componente | Dónde verlo en la app |
|---|---|---|---|---|
| 1 | Navegación | Barra de navegación | `Header.jsx` | Cabecera fija con la marca, los enlaces (Inicio, Laboratorios, Mis reservas, Ayuda, Panel), la búsqueda y el tema. |
| 2 | Navegación | Menú lateral | `MenuLateral.jsx` | `#/panel`: columna con Panel, Reservas, Laboratorios, Reportes y Configuración. Por debajo de 768 px es una barra horizontal desplazable. |
| 3 | Navegación | Paginación | `TablaPaginada.jsx` | Pestaña Horario del Lab 236-41 (2 páginas) y tabla de reservas del panel. |
| 4 | Navegación | Estado activo | `Header.jsx` + `MenuLateral.jsx` | El enlace de la sección actual se resalta y lleva `aria-current="page"`, en la cabecera y en el menú lateral. |
| 5 | Visualización | Carrusel principal | `Carrusel.jsx` | Inicio: 4 destacados (reservas 2/2026, lab en mantenimiento, horario de atención, software). Avanza cada 6 s; se pausa con el mouse o el foco encima, con el botón Pausar/Reanudar o si el sistema pide movimiento reducido. |
| 6 | Visualización | Tarjetas | `LabCard.jsx` | Página Laboratorios. |
| 7 | Visualización | Panel de control | `vistas/PanelControl.jsx` | `#/panel`: indicadores, ocupación por laboratorio y próximas reservas en una sola pantalla. |
| 8 | Visualización | Tarjetas KPI | `TarjetaKPI.jsx` | `#/panel`: labs disponibles, reservas, clases por semana, PCs totales y ocupación promedio. |
| 9 | Visualización | Barras de progreso | `BarraProgreso.jsx` | `#/panel`: ocupación semanal de cada lab (`role="progressbar"`, con etiqueta y porcentaje visibles). |
| 10 | Visualización | Tabla de datos | `vistas/PanelReservas.jsx` + `TablaPaginada.jsx` | `#/panel/reservas`: Lab, Fecha, Horario, Tipo, Motivo y Acciones. |
| 11 | Interacción | Ventana modal | `Modal.jsx` | Confirmar «Cancelar reserva» / «Eliminar laboratorio», ver una reserva («Cerrar») y el formulario de laboratorio. |
| 12 | Interacción | Pestañas | `Tabs.jsx` | Detalle de un laboratorio: Información / Horario / Reservar. Se recorren con ← →. |
| 13 | Interacción | Notificación toast | `Toast.jsx` | «Reserva registrada», «Laboratorio 236-47 creado», «Configuración guardada» (3 s). Los errores duran 6 s. |
| 14 | Interacción | Indicador de carga | `IndicadorCarga.jsx` + `Skeleton.jsx` | Spinner en los botones mientras responde el servidor («Registrando…», «Guardando…», «Cancelando…», «Eliminando…», «Cargando…») y skeleton en las cargas de página. |
| 15 | Formularios | Formulario de registro | `ReservaForm.jsx` + `reglas.js` | Pestaña Reservar: validación en línea con el horario, la duración y la anticipación configurados. |
| 16 | Formularios | Formulario CRUD | `LaboratorioForm.jsx` + `vistas/PanelLaboratorios.jsx` | `#/panel/laboratorios`: «Nuevo laboratorio», «Editar» y «Eliminar», con el formulario en una ventana modal. |
| 17 | Formularios | Formulario de configuración | `ConfiguracionForm.jsx` | `#/panel/configuracion`: apertura, cierre, duración máxima y anticipación máxima. |
| 18 | Búsqueda y filtrado | Barra de búsqueda | `Header.jsx` + `App.jsx` | Escribe `INF120`, `236-43` o un apellido; la tecla `/` lleva el foco a la búsqueda. |
| 19 | Búsqueda y filtrado | Filtrado | `Filtros.jsx` | Página Laboratorios: Estado y Capacidad mínima, combinables con la búsqueda; «Limpiar filtros». |
| 20 | Administración | Reportes | `vistas/PanelReportes.jsx` + `GraficoBarras.jsx` | `#/panel/reportes`: reservas por tipo, reservas por laboratorio y ocupación por día de la semana. |
| 21 | Administración | Acciones por fila | `AccionesFila.jsx` | Botones «Ver / Cancelar» (reservas) y «Editar / Eliminar» (laboratorios) en cada fila, con `aria-label` de su fila. |

### Otros patrones de la demo

Siguen funcionando igual: **menú hamburguesa** (`Header.jsx`, cabecera con la ventana a menos de 768 px; se cierra
con `Escape`), **migas de pan** (`Breadcrumbs.jsx`), **acordeón** (`Accordion.jsx`, Ayuda → Preguntas frecuentes),
**insignias de estado** (`LabCard.jsx` → `EstadoBadge` y el contador de reservas del menú), **estado vacío**
(`EmptyState.jsx`: busca `química` o elige Mantenimiento + 44 PCs o más), **aviso de conexión** (`AvisoConexion.jsx`,
con el servidor apagado) y **modo claro/oscuro** (`Header.jsx` + `styles.css`, se recuerda en `localStorage`).

## Estructura

```
server/
  index.js           # Arranca la API en el puerto 3001 (y sirve dist/ en producción)
  app.js             # Rutas de la API REST
  db.js              # Conexión SQLite, creación de tablas y datos iniciales (también la configuración)
  esquema.sql        # Tablas de la base de datos
  reset.js           # npm run db:reset
  datos/             # laboratorios.db (se crea sola; no se sube a Git)
src/
  main.jsx
  App.jsx            # Rutas por hash, estado global y vistas públicas; decide servidor / modo de respaldo
  api.js             # Llamadas fetch a la API
  reglas.js          # Validación de reservas (la usan el formulario y el servidor)
  reglasPanel.js     # Validación de laboratorios y de la configuración (cliente y servidor)
  estadisticas.js    # Cálculos del panel de control y de los reportes
  data.js            # Datos iniciales y de respaldo, configuración por defecto
  styles.css         # Variables CSS, tema claro/oscuro, responsive
  components/
    Header.jsx  Breadcrumbs.jsx  Tabs.jsx  LabCard.jsx  Modal.jsx  Toast.jsx
    ReservaForm.jsx  TablaPaginada.jsx  EmptyState.jsx  Skeleton.jsx  Accordion.jsx
    AvisoConexion.jsx  Carrusel.jsx  Filtros.jsx  IndicadorCarga.jsx  MenuLateral.jsx
    TarjetaKPI.jsx  BarraProgreso.jsx  GraficoBarras.jsx  AccionesFila.jsx
    LaboratorioForm.jsx  ConfiguracionForm.jsx
  vistas/
    PanelEncargado.jsx  PanelControl.jsx  PanelReservas.jsx  PanelLaboratorios.jsx
    PanelReportes.jsx  PanelConfiguracion.jsx
```

## Requisito: Node.js 22.13 o superior

El módulo `node:sqlite` existe desde Node 22.13. Revisa tu versión con `node -v`.

| Sistema | Cómo instalar Node |
|---|---|
| Windows | Descarga la versión **LTS** de nodejs.org |
| Ubuntu | `sudo snap install node --classic --channel=22` (no uses `apt install nodejs`: trae una versión vieja) |
| Fedora | `sudo dnf install -y nodejs` (Fedora 41 o más reciente) |

## Cómo levantarlo

```bash
npm install
npm run dev
```

Abre http://localhost:5173. `npm run dev` arranca **los dos** procesos a la vez: `[api]` (Express, puerto 3001) y
`[web]` (Vite, puerto 5173). Para detener ambos: **Ctrl + C**.

> **Windows (PowerShell):** si aparece «la ejecución de scripts está deshabilitada», usa `npm.cmd` en lugar de
> `npm`: `npm.cmd install` y `npm.cmd run dev`.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run servidor` | Solo el backend (se reinicia solo al guardar cambios en `server/`) |
| `npm run cliente` | Solo el frontend |
| `npm run db:reset` | Borra la base y vuelve a cargar los datos iniciales (reservas de ejemplo con fechas desde hoy y configuración por defecto) |
| `npm run build` y luego `npm start` | Versión de producción: todo (frontend + API) en http://localhost:3001 |

### Mostrar el modo de respaldo en la exposición

1. Abre dos terminales en la carpeta del proyecto.
2. En una: `npm run servidor`. En la otra: `npm run cliente`.
3. Abre http://localhost:5173: el pie de página dice «Datos: servidor Express + SQLite».
4. Detén el servidor con **Ctrl + C** en su terminal y recarga la página: aparece el aviso «Sin conexión con el
   servidor» y la app sigue funcionando con datos locales. En el panel, el CRUD y la configuración quedan en solo
   lectura.
5. Vuelve a ejecutar `npm run servidor` y pulsa **Reintentar**: la app vuelve a usar la base de datos.

## Notas

- Es una demo: no hay usuarios ni inicio de sesión. Cualquiera que abra la app puede reservar, cancelar y usar el
  panel del encargado (el propio panel lo dice).
- El servidor solo escucha en `127.0.0.1` (esta misma computadora).
- Algunas reglas también están en la base de datos como última barrera (`CHECK`: tipo de reserva, largo del motivo,
  hora fin > inicio, formato del código y capacidad del laboratorio). Las demás (fecha pasada, anticipación y duración
  máximas, choques de horario, lab en mantenimiento, lab con clases o reservas al eliminarlo) las aplica la API.

---

Patrones UI – INF513 Grupo 08 SA – 2/2026
