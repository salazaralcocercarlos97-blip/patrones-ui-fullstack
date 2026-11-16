// npm run db:reset → borra las tablas y vuelve a cargar los datos iniciales
// (6 laboratorios, 33 clases y 2 reservas de ejemplo con fechas desde hoy).
import { reiniciarBase, RUTA_DB } from './db.js';

const db = reiniciarBase();
const contar = (tabla) => db.prepare(`SELECT COUNT(*) AS total FROM ${tabla}`).get().total;
console.log(`Base reiniciada: ${RUTA_DB}`);
console.log(
  `laboratorios: ${contar('laboratorio')}, materias: ${contar('materia')}, docentes: ${contar('docente')}, ` +
    `clases: ${contar('clase')}, reservas: ${contar('reserva')}`,
);
db.close();
