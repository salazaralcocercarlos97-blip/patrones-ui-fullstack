// Conexión a la base de datos SQLite (módulo node:sqlite, incluido en Node 22.13+).
// No hace falta instalar un servidor de base de datos: todo vive en un archivo.
// La primera vez crea las tablas (esquema.sql) y las llena con los datos de src/data.js.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clases, laboratorios, reservasDeEjemplo } from '../src/data.js';

const CARPETA = dirname(fileURLToPath(import.meta.url));
export const RUTA_DB = join(CARPETA, 'datos', 'laboratorios.db');
const ESQUEMA = readFileSync(join(CARPETA, 'esquema.sql'), 'utf8');

function enTransaccion(db, trabajo) {
  db.exec('BEGIN');
  try {
    trabajo();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// Inserta los datos iniciales: 6 laboratorios, materias, docentes, 33 clases y 2 reservas.
function sembrar(db) {
  const insertarLab = db.prepare(
    'INSERT INTO laboratorio (codigo, capacidad, estado, ubicacion, descripcion, motivo_mantenimiento) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertarSoftware = db.prepare(
    'INSERT INTO laboratorio_software (laboratorio_codigo, nombre, orden) VALUES (?, ?, ?)',
  );
  const insertarMateria = db.prepare('INSERT OR IGNORE INTO materia (sigla, nombre) VALUES (?, ?)');
  const insertarDocente = db.prepare('INSERT OR IGNORE INTO docente (nombre) VALUES (?)');
  const idDocente = db.prepare('SELECT id FROM docente WHERE nombre = ?');
  const insertarClase = db.prepare(
    'INSERT INTO clase (id, laboratorio_codigo, sigla, grupo, docente_id, dia, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertarReserva = db.prepare(
    'INSERT INTO reserva (id, laboratorio_codigo, fecha, hora_inicio, hora_fin, tipo, motivo) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );

  enTransaccion(db, () => {
    for (const lab of laboratorios) {
      insertarLab.run(lab.codigo, lab.capacidad, lab.estado, lab.ubicacion, lab.descripcion, lab.motivoMantenimiento ?? null);
      lab.software.forEach((nombre, indice) => insertarSoftware.run(lab.codigo, nombre, indice));
    }
    for (const clase of clases) {
      insertarMateria.run(clase.sigla, clase.materia);
      insertarDocente.run(clase.docente);
      const { id } = idDocente.get(clase.docente);
      insertarClase.run(clase.id, clase.lab, clase.sigla, clase.grupo, id, clase.dia, clase.inicio, clase.fin);
    }
    for (const r of reservasDeEjemplo()) {
      insertarReserva.run(r.id, r.lab, r.fecha, r.horaInicio, r.horaFin, r.tipo, r.motivo);
    }
  });
}

export function abrirBase() {
  mkdirSync(dirname(RUTA_DB), { recursive: true });
  const db = new DatabaseSync(RUTA_DB);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(ESQUEMA);
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM laboratorio').get();
  if (total === 0) sembrar(db);
  return db;
}

// Borra todas las tablas y las vuelve a crear con los datos iniciales.
export function reiniciarBase() {
  mkdirSync(dirname(RUTA_DB), { recursive: true });
  const db = new DatabaseSync(RUTA_DB);
  db.exec('PRAGMA foreign_keys = OFF;');
  enTransaccion(db, () => {
    for (const tabla of ['reserva', 'clase', 'docente', 'materia', 'laboratorio_software', 'laboratorio']) {
      db.exec(`DROP TABLE IF EXISTS ${tabla}`);
    }
  });
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(ESQUEMA);
  sembrar(db);
  return db;
}
