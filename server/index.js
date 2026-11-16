// Punto de entrada del backend: abre la base SQLite y levanta la API en el puerto 3001.
// Si existe la carpeta dist/ (después de «npm run build»), también sirve el frontend,
// así «npm start» deja la app completa en http://localhost:3001.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirBase, RUTA_DB } from './db.js';
import { crearApp } from './app.js';

// Se usa API_PUERTO (y no PORT) para no chocar con otras herramientas que fijan PORT.
const PUERTO = Number(process.env.API_PUERTO) || 3001;
const HOST = '127.0.0.1';
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const db = abrirBase();
const app = crearApp(db, { carpetaEstatica: existsSync(DIST) ? DIST : undefined });

const servidor = app.listen(PUERTO, HOST, () => {
  console.log(`API lista en http://localhost:${PUERTO}/api  (base de datos: ${RUTA_DB})`);
  if (existsSync(DIST)) console.log(`Frontend compilado disponible en http://localhost:${PUERTO}`);
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PUERTO} ya está en uso. Cierra el otro servidor o usa otro puerto con la variable API_PUERTO.`);
    process.exit(1);
  }
  throw error;
});

// Cierra la base de datos ordenadamente al detener el servidor (Ctrl + C).
for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    servidor.close();
    db.close();
    process.exit(0);
  });
}
