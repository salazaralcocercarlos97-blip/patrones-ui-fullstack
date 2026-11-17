// API REST del backend (Express). Todas las rutas empiezan con /api.
//
//   GET    /api/salud                    ¿el servidor responde?
//   GET    /api/laboratorios             lista de laboratorios (con su software)
//   POST   /api/laboratorios             crea un laboratorio (valida con src/reglasPanel.js)
//   PUT    /api/laboratorios/:codigo     modifica un laboratorio
//   DELETE /api/laboratorios/:codigo     elimina un laboratorio sin clases ni reservas
//   GET    /api/clases                   horario de clases
//   GET    /api/reservas                 reservas registradas
//   POST   /api/reservas                 crea una reserva (valida con src/reglas.js y la configuración)
//   DELETE /api/reservas/:id             cancela una reserva
//   GET    /api/configuracion            horario de atención, duración y anticipación máximas
//   PUT    /api/configuracion            guarda la configuración (valida con src/reglasPanel.js)
//
// Las consultas usan parámetros (?) y nunca concatenan texto del usuario: así se evita
// la inyección SQL.
import { randomUUID } from 'node:crypto';
import express from 'express';
import { CONFIGURACION_POR_DEFECTO } from '../src/data.js';
import { validarReserva } from '../src/reglas.js';
import {
  normalizarConfiguracion,
  normalizarLaboratorio,
  validarConfiguracion,
  validarLaboratorio,
} from '../src/reglasPanel.js';
import { CLAVES_CONFIGURACION } from './db.js';

function texto(valor) {
  return typeof valor === 'string' ? valor : '';
}

function plural(cantidad, singular, pluralTexto) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

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

export function crearApp(db, { carpetaEstatica } = {}) {
  const consultas = {
    laboratorios: db.prepare(
      `SELECT codigo, capacidad, estado, ubicacion, descripcion, motivo_mantenimiento AS motivoMantenimiento
       FROM laboratorio ORDER BY codigo`,
    ),
    laboratorio: db.prepare(
      `SELECT codigo, capacidad, estado, ubicacion, descripcion, motivo_mantenimiento AS motivoMantenimiento
       FROM laboratorio WHERE codigo = ?`,
    ),
    codigosLab: db.prepare('SELECT codigo FROM laboratorio'),
    insertarLab: db.prepare(
      `INSERT INTO laboratorio (codigo, capacidad, estado, ubicacion, descripcion, motivo_mantenimiento)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ),
    actualizarLab: db.prepare(
      `UPDATE laboratorio SET capacidad = ?, estado = ?, ubicacion = ?, descripcion = ?, motivo_mantenimiento = ?
       WHERE codigo = ?`,
    ),
    borrarLab: db.prepare('DELETE FROM laboratorio WHERE codigo = ?'),
    software: db.prepare(
      'SELECT laboratorio_codigo AS lab, nombre FROM laboratorio_software ORDER BY laboratorio_codigo, orden',
    ),
    softwareDeLab: db.prepare('SELECT nombre FROM laboratorio_software WHERE laboratorio_codigo = ? ORDER BY orden'),
    insertarSoftware: db.prepare('INSERT INTO laboratorio_software (laboratorio_codigo, nombre, orden) VALUES (?, ?, ?)'),
    borrarSoftware: db.prepare('DELETE FROM laboratorio_software WHERE laboratorio_codigo = ?'),
    contarClasesDeLab: db.prepare('SELECT COUNT(*) AS total FROM clase WHERE laboratorio_codigo = ?'),
    contarReservasDeLab: db.prepare('SELECT COUNT(*) AS total FROM reserva WHERE laboratorio_codigo = ?'),
    clases: db.prepare(
      `SELECT c.id, c.laboratorio_codigo AS lab, c.sigla, m.nombre AS materia, c.grupo, d.nombre AS docente,
              c.dia, c.hora_inicio AS inicio, c.hora_fin AS fin
       FROM clase c
       JOIN materia m ON m.sigla = c.sigla
       JOIN docente d ON d.id = c.docente_id
       ORDER BY c.laboratorio_codigo, c.dia, c.hora_inicio`,
    ),
    clasesDeLab: db.prepare(
      `SELECT c.id, c.laboratorio_codigo AS lab, c.sigla, c.grupo, c.dia, c.hora_inicio AS inicio, c.hora_fin AS fin
       FROM clase c WHERE c.laboratorio_codigo = ?`,
    ),
    reservas: db.prepare(
      `SELECT id, laboratorio_codigo AS lab, fecha, hora_inicio AS horaInicio, hora_fin AS horaFin, tipo, motivo
       FROM reserva ORDER BY fecha, hora_inicio`,
    ),
    reservasDeLab: db.prepare(
      `SELECT id, laboratorio_codigo AS lab, fecha, hora_inicio AS horaInicio, hora_fin AS horaFin
       FROM reserva WHERE laboratorio_codigo = ?`,
    ),
    insertarReserva: db.prepare(
      `INSERT INTO reserva (id, laboratorio_codigo, fecha, hora_inicio, hora_fin, tipo, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ),
    borrarReserva: db.prepare('DELETE FROM reserva WHERE id = ?'),
    configuracion: db.prepare('SELECT clave, valor FROM configuracion'),
    guardarValorConfiguracion: db.prepare(
      'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor',
    ),
  };

  // Un laboratorio con su lista de software (igual que en GET /api/laboratorios).
  function laboratorioCompleto(codigo) {
    const lab = consultas.laboratorio.get(codigo);
    if (!lab) return null;
    return { ...lab, software: consultas.softwareDeLab.all(codigo).map((s) => s.nombre) };
  }

  // Configuración vigente; si falta algún valor en la tabla, se usa el de data.js.
  function leerConfiguracion() {
    const filas = Object.fromEntries(consultas.configuracion.all().map((fila) => [fila.clave, fila.valor]));
    const configuracion = { ...CONFIGURACION_POR_DEFECTO };
    for (const [nombre, clave] of Object.entries(CLAVES_CONFIGURACION)) {
      if (filas[clave] !== undefined) configuracion[nombre] = filas[clave];
    }
    return normalizarConfiguracion(configuracion);
  }

  function guardarSoftware(codigo, software) {
    consultas.borrarSoftware.run(codigo);
    software.forEach((nombre, indice) => consultas.insertarSoftware.run(codigo, nombre, indice));
  }

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/salud', (req, res) => {
    res.json({ ok: true, baseDeDatos: 'SQLite' });
  });

  // ---------- Laboratorios ----------

  app.get('/api/laboratorios', (req, res) => {
    const software = consultas.software.all();
    const labs = consultas.laboratorios.all().map((lab) => ({
      ...lab,
      software: software.filter((s) => s.lab === lab.codigo).map((s) => s.nombre),
    }));
    res.json(labs);
  });

  app.post('/api/laboratorios', (req, res) => {
    const cuerpo = req.body ?? {};
    const contexto = { esNuevo: true, codigosExistentes: consultas.codigosLab.all().map((fila) => fila.codigo) };
    const errores = validarLaboratorio(cuerpo, contexto);
    if (Object.keys(errores).length > 0) {
      res.status(422).json({ error: 'Revisa los datos del laboratorio.', errores });
      return;
    }

    const lab = normalizarLaboratorio(cuerpo);
    enTransaccion(db, () => {
      consultas.insertarLab.run(lab.codigo, lab.capacidad, lab.estado, lab.ubicacion, lab.descripcion, lab.motivoMantenimiento);
      guardarSoftware(lab.codigo, lab.software);
    });
    res.status(201).json(laboratorioCompleto(lab.codigo));
  });

  app.put('/api/laboratorios/:codigo', (req, res) => {
    const { codigo } = req.params;
    if (!consultas.laboratorio.get(codigo)) {
      res.status(404).json({ error: `No existe el laboratorio «${codigo}».` });
      return;
    }

    // El código no cambia al editar: se toma de la URL, no del cuerpo.
    const valores = { ...(req.body ?? {}), codigo };
    const errores = validarLaboratorio(valores, { esNuevo: false });
    if (Object.keys(errores).length > 0) {
      res.status(422).json({ error: 'Revisa los datos del laboratorio.', errores });
      return;
    }

    const lab = normalizarLaboratorio(valores);
    enTransaccion(db, () => {
      consultas.actualizarLab.run(lab.capacidad, lab.estado, lab.ubicacion, lab.descripcion, lab.motivoMantenimiento, codigo);
      guardarSoftware(codigo, lab.software);
    });
    res.json(laboratorioCompleto(codigo));
  });

  app.delete('/api/laboratorios/:codigo', (req, res) => {
    const { codigo } = req.params;
    if (!consultas.laboratorio.get(codigo)) {
      res.status(404).json({ error: `No existe el laboratorio «${codigo}».` });
      return;
    }

    // Un laboratorio con clases o reservas no se borra: se perdería el horario o la reserva de alguien.
    const clases = consultas.contarClasesDeLab.get(codigo).total;
    const reservas = consultas.contarReservasDeLab.get(codigo).total;
    if (clases > 0 || reservas > 0) {
      const partes = [];
      if (clases > 0) partes.push(plural(clases, 'clase', 'clases'));
      if (reservas > 0) partes.push(plural(reservas, 'reserva', 'reservas'));
      res.status(409).json({
        error: `No se puede eliminar el Lab ${codigo}: tiene ${partes.join(' y ')}. Si ya no se usa, márcalo como «Mantenimiento».`,
        clases,
        reservas,
      });
      return;
    }

    consultas.borrarLab.run(codigo); // su software se borra en cascada (ON DELETE CASCADE)
    res.status(204).end();
  });

  // ---------- Clases y reservas ----------

  app.get('/api/clases', (req, res) => {
    res.json(consultas.clases.all());
  });

  app.get('/api/reservas', (req, res) => {
    res.json(consultas.reservas.all());
  });

  app.post('/api/reservas', (req, res) => {
    const cuerpo = req.body ?? {};
    const laboratorio = consultas.laboratorio.get(texto(cuerpo.lab));
    if (!laboratorio) {
      res.status(404).json({ error: `No existe el laboratorio «${texto(cuerpo.lab)}».` });
      return;
    }

    const valores = {
      fecha: texto(cuerpo.fecha),
      horaInicio: texto(cuerpo.horaInicio),
      horaFin: texto(cuerpo.horaFin),
      tipo: texto(cuerpo.tipo),
      motivo: texto(cuerpo.motivo),
    };
    // Mismas reglas que el formulario, pero con los datos reales de la base y la configuración vigente.
    const errores = validarReserva(valores, {
      laboratorio,
      clases: consultas.clasesDeLab.all(laboratorio.codigo),
      reservas: consultas.reservasDeLab.all(laboratorio.codigo),
      configuracion: leerConfiguracion(),
    });
    if (Object.keys(errores).length > 0) {
      res.status(422).json({ error: 'Revisa los datos de la reserva.', errores });
      return;
    }

    const reserva = {
      id: randomUUID(),
      lab: laboratorio.codigo,
      fecha: valores.fecha,
      horaInicio: valores.horaInicio,
      horaFin: valores.horaFin,
      tipo: valores.tipo,
      motivo: valores.motivo.trim(),
    };
    consultas.insertarReserva.run(
      reserva.id,
      reserva.lab,
      reserva.fecha,
      reserva.horaInicio,
      reserva.horaFin,
      reserva.tipo,
      reserva.motivo,
    );
    res.status(201).json(reserva);
  });

  app.delete('/api/reservas/:id', (req, res) => {
    const { changes } = consultas.borrarReserva.run(req.params.id);
    if (changes === 0) {
      res.status(404).json({ error: 'Esa reserva ya no existe.' });
      return;
    }
    res.status(204).end();
  });

  // ---------- Configuración ----------

  app.get('/api/configuracion', (req, res) => {
    res.json(leerConfiguracion());
  });

  app.put('/api/configuracion', (req, res) => {
    const cuerpo = req.body ?? {};
    const errores = validarConfiguracion(cuerpo);
    if (Object.keys(errores).length > 0) {
      res.status(422).json({ error: 'Revisa la configuración.', errores });
      return;
    }

    const configuracion = normalizarConfiguracion(cuerpo);
    enTransaccion(db, () => {
      for (const [nombre, clave] of Object.entries(CLAVES_CONFIGURACION)) {
        consultas.guardarValorConfiguracion.run(clave, String(configuracion[nombre]));
      }
    });
    res.json(leerConfiguracion());
  });

  // Cualquier otra ruta /api que no exista.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta de la API no encontrada.' });
  });

  // En producción (npm start) el mismo servidor entrega el frontend ya compilado.
  if (carpetaEstatica) {
    app.use(express.static(carpetaEstatica));
  }

  // Manejo de errores: JSON mal formado, cuerpo muy grande o fallos inesperados.
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
      return;
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json({ error: 'La petición es demasiado grande.' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}
