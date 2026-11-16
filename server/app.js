// API REST del backend (Express). Todas las rutas empiezan con /api.
//
//   GET    /api/salud            ¿el servidor responde?
//   GET    /api/laboratorios     lista de laboratorios (con su software)
//   GET    /api/clases           horario de clases
//   GET    /api/reservas         reservas registradas
//   POST   /api/reservas         crea una reserva (valida con src/reglas.js)
//   DELETE /api/reservas/:id     cancela una reserva
//
// Las consultas usan parámetros (?) y nunca concatenan texto del usuario: así se evita
// la inyección SQL.
import { randomUUID } from 'node:crypto';
import express from 'express';
import { validarReserva } from '../src/reglas.js';

function texto(valor) {
  return typeof valor === 'string' ? valor : '';
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
    software: db.prepare(
      'SELECT laboratorio_codigo AS lab, nombre FROM laboratorio_software ORDER BY laboratorio_codigo, orden',
    ),
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
  };

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/salud', (req, res) => {
    res.json({ ok: true, baseDeDatos: 'SQLite' });
  });

  app.get('/api/laboratorios', (req, res) => {
    const software = consultas.software.all();
    const labs = consultas.laboratorios.all().map((lab) => ({
      ...lab,
      software: software.filter((s) => s.lab === lab.codigo).map((s) => s.nombre),
    }));
    res.json(labs);
  });

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
    // Mismas reglas que el formulario, pero con los datos reales de la base.
    const errores = validarReserva(valores, {
      laboratorio,
      clases: consultas.clasesDeLab.all(laboratorio.codigo),
      reservas: consultas.reservasDeLab.all(laboratorio.codigo),
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
