-- Base de datos SQLite de la demo (archivo server/datos/laboratorios.db).
-- El servidor ejecuta este script al iniciar: CREATE TABLE IF NOT EXISTS no borra nada
-- si las tablas ya existen. Para empezar de cero: npm run db:reset

CREATE TABLE IF NOT EXISTS laboratorio (
  codigo               TEXT PRIMARY KEY CHECK (codigo GLOB '236-[0-9][0-9]'),
  capacidad            INTEGER NOT NULL CHECK (capacidad BETWEEN 1 AND 100),
  estado               TEXT NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'MANTENIMIENTO')),
  ubicacion            TEXT NOT NULL,
  descripcion          TEXT NOT NULL DEFAULT '',
  motivo_mantenimiento TEXT
);

CREATE TABLE IF NOT EXISTS laboratorio_software (
  laboratorio_codigo TEXT NOT NULL REFERENCES laboratorio (codigo) ON DELETE CASCADE,
  nombre             TEXT NOT NULL,
  orden              INTEGER NOT NULL,
  PRIMARY KEY (laboratorio_codigo, nombre)
);

CREATE TABLE IF NOT EXISTS materia (
  sigla  TEXT PRIMARY KEY,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS docente (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

-- dia: 1 = lunes … 6 = sábado (igual que dia_semana en la base sislab).
CREATE TABLE IF NOT EXISTS clase (
  id                 TEXT PRIMARY KEY,
  laboratorio_codigo TEXT NOT NULL REFERENCES laboratorio (codigo),
  sigla              TEXT NOT NULL REFERENCES materia (sigla),
  grupo              TEXT NOT NULL,
  docente_id         INTEGER NOT NULL REFERENCES docente (id),
  dia                INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 6),
  hora_inicio        TEXT NOT NULL,
  hora_fin           TEXT NOT NULL,
  CHECK (hora_fin > hora_inicio)
);

CREATE TABLE IF NOT EXISTS reserva (
  id                 TEXT PRIMARY KEY,
  laboratorio_codigo TEXT NOT NULL REFERENCES laboratorio (codigo),
  fecha              TEXT NOT NULL,
  hora_inicio        TEXT NOT NULL,
  hora_fin           TEXT NOT NULL,
  tipo               TEXT NOT NULL CHECK (tipo IN ('EXAMEN', 'PRACTICA', 'RECUPERACION', 'EVENTO')),
  motivo             TEXT NOT NULL CHECK (length(motivo) BETWEEN 10 AND 200),
  creada_en          TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  CHECK (hora_fin > hora_inicio)
);

-- Configuración de las reservas (patrón «Formulario de configuración»), como pares clave/valor:
-- hora_apertura, hora_cierre, duracion_maxima_horas y anticipacion_maxima_dias.
-- Se siembra aparte (server/db.js) cuando está vacía, aunque la base ya tenga laboratorios.
CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clase_lab_dia ON clase (laboratorio_codigo, dia);
CREATE INDEX IF NOT EXISTS idx_reserva_lab_fecha ON reserva (laboratorio_codigo, fecha);
