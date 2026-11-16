# Laboratorios FICCT – Catálogo de Patrones UI (versión con backend)

Proyecto demostrativo de **Patrones UI** para **INF513 Tecnología Web – Grupo 08 SA (2/2026)**.

Es la misma SPA de `patrones-ui` (React + Vite, JavaScript), ahora con:

- **Backend:** API REST con **Node + Express**.
- **Base de datos:** **SQLite** (un archivo, sin instalar ningún servidor de base de datos). Usa el módulo
  `node:sqlite` que ya trae Node.
- **Modo de respaldo:** si el servidor no responde, la app sigue funcionando con los datos de `src/data.js` y guarda
  las reservas en el navegador, con un aviso y un botón «Reintentar».
- **Validación compartida:** las reglas de la reserva están en `src/reglas.js`. El formulario las usa para ayudar al
  usuario y el servidor las vuelve a aplicar antes de guardar.

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
17 docentes, 33 clases y 2 reservas de ejemplo.

### API

| Método | Ruta | Qué hace | Respuestas |
|---|---|---|---|
| GET | `/api/salud` | Comprueba que el servidor responde | 200 |
| GET | `/api/laboratorios` | Laboratorios con su software | 200 |
| GET | `/api/clases` | Horario de clases (con materia y docente) | 200 |
| GET | `/api/reservas` | Reservas registradas | 200 |
| POST | `/api/reservas` | Crea una reserva | 201 creada · 422 datos inválidos (con `errores` por campo) · 404 lab inexistente |
| DELETE | `/api/reservas/:id` | Cancela una reserva | 204 · 404 si ya no existe |

### Tablas (server/esquema.sql)

`laboratorio`, `laboratorio_software`, `materia`, `docente`, `clase` y `reserva`, con llaves foráneas y
restricciones `CHECK` (estado del lab, día 1–6, tipo de reserva, motivo de 10 a 200 caracteres, hora fin > inicio).

Para ver la base de datos con una interfaz gráfica, abre `server/datos/laboratorios.db` con
[DB Browser for SQLite](https://sqlitebrowser.org/).

## Los 13 patrones y dónde verlos

| # | Patrón | Componente | Dónde verlo en la app |
|---|--------|------------|-----------------------|
| 1 | Búsqueda global | `Header.jsx` | Cabecera. Escribe `INF120`, `236-43` o un apellido; la tecla `/` lleva el foco a la búsqueda. |
| 2 | Menú hamburguesa | `Header.jsx` | Cabecera con la ventana a menos de 768 px. Se cierra con `Escape`. |
| 3 | Modo claro/oscuro | `Header.jsx` + `styles.css` | Botón de luna/sol. Cambia `data-tema="oscuro"` en `<html>` y se recuerda en `localStorage`. |
| 4 | Migas de pan | `Breadcrumbs.jsx` | Inicio › Laboratorios › Lab 236-43. |
| 5 | Pestañas | `Tabs.jsx` | Detalle de un laboratorio: Información / Horario / Reservar. Se recorren con ← →. |
| 6 | Tarjetas | `LabCard.jsx` | Página Laboratorios. |
| 7 | Skeleton de carga | `Skeleton.jsx` | Mientras llegan los datos del servidor (mínimo 1 s) y con el botón «Recargar». |
| 8 | Estado vacío | `EmptyState.jsx` | Busca `química` → «Limpiar búsqueda». También en Mis reservas sin reservas. |
| 9 | Validación en línea | `ReservaForm.jsx` + `reglas.js` | Pestaña Reservar. Los errores del servidor también aparecen junto al campo. |
| 10 | Modal de confirmación | `Modal.jsx` | Mis reservas → «Cancelar reserva». Mientras el servidor responde dice «Cancelando…». |
| 11 | Toast | `Toast.jsx` | «Reserva registrada» / «Reserva cancelada» (3 s). Si el servidor falla, un aviso de error (6 s). |
| 12 | Paginación | `TablaPaginada.jsx` | Pestaña Horario (Lab 236-41 tiene 2 páginas). |
| 13 | Acordeón | `Accordion.jsx` | Ayuda → Preguntas frecuentes. |
| + | Aviso de conexión (extra) | `AvisoConexion.jsx` | Aparece si el backend está apagado. Botón «Reintentar». |

## Estructura

```
server/
  index.js           # Arranca la API en el puerto 3001 (y sirve dist/ en producción)
  app.js             # Rutas de la API REST
  db.js              # Conexión SQLite, creación de tablas y datos iniciales
  esquema.sql        # Tablas de la base de datos
  reset.js           # npm run db:reset
  datos/             # laboratorios.db (se crea sola; no se sube a Git)
src/
  main.jsx
  App.jsx            # Une todos los patrones y decide servidor / modo de respaldo
  api.js             # Llamadas fetch a la API
  reglas.js          # Validación de reservas (la usan el formulario y el servidor)
  data.js            # Datos iniciales y de respaldo
  styles.css         # Variables CSS, tema claro/oscuro, responsive
  components/
    Header.jsx  Breadcrumbs.jsx  Tabs.jsx  LabCard.jsx  Modal.jsx  Toast.jsx
    ReservaForm.jsx  TablaPaginada.jsx  EmptyState.jsx  Skeleton.jsx  Accordion.jsx
    AvisoConexion.jsx
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
| `npm run db:reset` | Borra la base y vuelve a cargar los datos iniciales (reservas de ejemplo con fechas desde hoy) |
| `npm run build` y luego `npm start` | Versión de producción: todo (frontend + API) en http://localhost:3001 |

### Mostrar el modo de respaldo en la exposición

1. Abre dos terminales en la carpeta del proyecto.
2. En una: `npm run servidor`. En la otra: `npm run cliente`.
3. Abre http://localhost:5173: el pie de página dice «Datos: servidor Express + SQLite».
4. Detén el servidor con **Ctrl + C** en su terminal y recarga la página: aparece el aviso «Sin conexión con el
   servidor» y la app sigue funcionando con datos locales.
5. Vuelve a ejecutar `npm run servidor` y pulsa **Reintentar**: la app vuelve a usar la base de datos.

## Notas

- Es una demo: no hay usuarios ni inicio de sesión. Cualquiera que abra la app puede reservar y cancelar.
- El servidor solo escucha en `127.0.0.1` (esta misma computadora).
- Algunas reglas también están en la base de datos como última barrera (`CHECK`: tipo de reserva, largo del motivo,
  hora fin > inicio). Las demás (fecha pasada, choques de horario, lab en mantenimiento) las aplica la API.

---

Patrones UI – INF513 Grupo 08 SA – 2/2026
