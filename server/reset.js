// npm run db:reset → borra las tablas y vuelve a cargar los datos iniciales
// (6 laboratorios, 33 clases, 2 reservas de ejemplo con fechas desde hoy y la configuración
// por defecto: 07:00 a 22:45, reservas de hasta 4 h y hasta 60 días de anticipación).
import { reiniciarBase, RUTA_DB } from './db.js';

const db = reiniciarBase();
const contar = (tabla) => db.prepare(`SELECT COUNT(*) AS total FROM ${tabla}`).get().total;
console.log(`Base reiniciada: ${RUTA_DB}`);
console.log(
  `laboratorios: ${contar('laboratorio')}, materias: ${contar('materia')}, docentes: ${contar('docente')}, ` +
    `clases: ${contar('clase')}, reservas: ${contar('reserva')}, configuracion: ${contar('configuracion')} valores`,
);
db.close();
