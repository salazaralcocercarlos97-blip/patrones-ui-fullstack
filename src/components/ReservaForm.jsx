/*
 * Patrón: VALIDACIÓN EN LÍNEA.
 * Problema que resuelve: que el usuario no descubra todos sus errores recién al enviar.
 * Cada campo se valida al salir de él (onBlur) y el mensaje aparece junto al campo, en
 * español y diciendo cómo corregirlo. En cuanto el valor es correcto, el error se borra
 * mientras escribe. Accesible: aria-invalid + aria-describedby enlazan cada campo con su
 * mensaje. Al enviar con errores, el foco va al primer campo a corregir.
 * Versión con backend: las reglas viven en src/reglas.js y el servidor las vuelve a
 * aplicar al guardar; si el servidor rechaza algo (por ejemplo, otra persona reservó ese
 * horario un momento antes), su mensaje aparece junto al campo igual que los del navegador.
 */
import { useId, useRef, useState } from 'react';
import { HORA_APERTURA, HORA_CIERRE, TIPOS_RESERVA, hoyISO } from '../data.js';
import { MOTIVO_MAXIMO, MOTIVO_MINIMO, ORDEN_CAMPOS, validarCampo, validarReserva } from '../reglas.js';

const VALORES_INICIALES = { fecha: '', horaInicio: '', horaFin: '', tipo: '', motivo: '' };

function generarId() {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function textoResumen(errores) {
  const campos = Object.keys(errores).filter((campo) => campo !== 'general');
  if (errores.general) return errores.general;
  return campos.length === 1 ? 'Revisa 1 campo marcado.' : `Revisa los ${campos.length} campos marcados.`;
}

export default function ReservaForm({ laboratorio, clases, reservas, onRegistrar }) {
  const idBase = useId();
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [resumen, setResumen] = useState('');
  const [enviando, setEnviando] = useState(false);
  const refs = {
    fecha: useRef(null),
    horaInicio: useRef(null),
    horaFin: useRef(null),
    tipo: useRef(null),
    motivo: useRef(null),
  };

  const enMantenimiento = laboratorio.estado === 'MANTENIMIENTO';
  const contexto = { laboratorio, clases, reservas };
  const id = (campo) => `${idBase}-${campo}`;

  const enfocarPrimerError = (encontrados) => {
    const primero = ORDEN_CAMPOS.find((campo) => encontrados[campo]);
    if (primero) refs[primero === 'horario' ? 'horaInicio' : primero].current?.focus();
  };

  // Al escribir: solo se recalculan los campos que YA muestran un error,
  // así el mensaje desaparece apenas el valor es correcto (y no se regaña antes de tiempo).
  const alCambiar = (evento) => {
    const { name, value } = evento.target;
    const nuevosValores = { ...valores, [name]: value };
    setValores(nuevosValores);
    setResumen('');
    setErrores((anteriores) => {
      const siguientes = {};
      Object.keys(anteriores).forEach((campo) => {
        const mensaje = validarCampo(campo, nuevosValores, contexto);
        if (mensaje) siguientes[campo] = mensaje;
      });
      return siguientes;
    });
  };

  // Al salir del campo: se valida ese campo (y el choque de horario si toca).
  const alSalir = (evento) => {
    const { name } = evento.target;
    setErrores((anteriores) => {
      const siguientes = { ...anteriores };
      const revisar = ['fecha', 'horaInicio', 'horaFin'].includes(name) ? [name, 'horario'] : [name];
      revisar.forEach((campo) => {
        const mensaje = validarCampo(campo, valores, contexto);
        if (mensaje) siguientes[campo] = mensaje;
        else delete siguientes[campo];
      });
      return siguientes;
    });
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    if (enMantenimiento || enviando) return;

    const encontrados = validarReserva(valores, contexto);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setResumen(textoResumen(encontrados));
      enfocarPrimerError(encontrados);
      return;
    }

    setEnviando(true);
    const resultado = await onRegistrar({
      id: generarId(),
      lab: laboratorio.codigo,
      fecha: valores.fecha,
      horaInicio: valores.horaInicio,
      horaFin: valores.horaFin,
      tipo: valores.tipo,
      motivo: valores.motivo.trim(),
    });
    setEnviando(false);

    if (resultado.ok) {
      setValores(VALORES_INICIALES);
      setErrores({});
      setResumen('');
    } else if (resultado.errores) {
      // El servidor rechazó la reserva: sus mensajes se muestran junto a cada campo.
      setErrores(resultado.errores);
      setResumen(textoResumen(resultado.errores));
      enfocarPrimerError(resultado.errores);
    }
    // Si fue un problema de conexión, App muestra un toast y el formulario conserva los datos.
  };

  // Props comunes de accesibilidad para cada campo.
  const propsCampo = (campo, extraDescripcion = []) => {
    const esHora = campo === 'horaInicio' || campo === 'horaFin';
    const describedBy = [...extraDescripcion];
    if (errores[campo]) describedBy.push(`${id(campo)}-error`);
    if (esHora && errores.horario) describedBy.push(`${id('horario')}-error`);
    return {
      id: id(campo),
      name: campo,
      ref: refs[campo],
      value: valores[campo],
      onChange: alCambiar,
      onBlur: alSalir,
      'aria-invalid': Boolean(errores[campo] || (esHora && errores.horario)),
      'aria-describedby': describedBy.length ? describedBy.join(' ') : undefined,
    };
  };

  // Mensaje de error junto al campo (el id lo enlaza con aria-describedby).
  const mensajeError = (campo) =>
    errores[campo] ? (
      <p id={`${id(campo)}-error`} className="campo-error">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5v.5" />
        </svg>
        <span>{errores[campo]}</span>
      </p>
    ) : null;

  const largoMotivo = valores.motivo.trim().length;

  return (
    <form className="formulario" onSubmit={alEnviar} noValidate aria-busy={enviando}>
      <h2 className="formulario-titulo">Reservar el laboratorio {laboratorio.codigo}</h2>

      {enMantenimiento ? (
        <div className="aviso-bloque aviso-mantenimiento">
          <p>
            <strong>Este laboratorio está en mantenimiento y no recibe reservas.</strong>{' '}
            {laboratorio.motivoMantenimiento}
          </p>
          <a className="boton boton-secundario" href="#/laboratorios">
            Ver laboratorios disponibles
          </a>
        </div>
      ) : (
        <p className="formulario-intro">
          Todos los campos son obligatorios. Atención de lunes a sábado, {HORA_APERTURA} a {HORA_CIERRE}.
        </p>
      )}

      <fieldset className="formulario-campos" disabled={enMantenimiento}>
        <legend className="solo-lectores">Datos de la reserva</legend>

        <div className="campo">
          <label htmlFor={id('fecha')}>Fecha</label>
          <input type="date" min={hoyISO()} {...propsCampo('fecha')} />
          {mensajeError('fecha')}
        </div>

        <div className="campo-fila">
          <div className="campo">
            <label htmlFor={id('horaInicio')}>Hora de inicio</label>
            <input type="time" min={HORA_APERTURA} max={HORA_CIERRE} step="300" {...propsCampo('horaInicio')} />
            {mensajeError('horaInicio')}
          </div>
          <div className="campo">
            <label htmlFor={id('horaFin')}>Hora de fin</label>
            <input type="time" min={HORA_APERTURA} max={HORA_CIERRE} step="300" {...propsCampo('horaFin')} />
            {mensajeError('horaFin')}
          </div>
        </div>
        {mensajeError('horario')}

        <div className="campo">
          <label htmlFor={id('tipo')}>Tipo de reserva</label>
          <select {...propsCampo('tipo')}>
            <option value="">Selecciona un tipo</option>
            {TIPOS_RESERVA.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.etiqueta}
              </option>
            ))}
          </select>
          {mensajeError('tipo')}
        </div>

        <div className="campo">
          <label htmlFor={id('motivo')}>Motivo</label>
          <textarea rows={3} maxLength={MOTIVO_MAXIMO} {...propsCampo('motivo', [`${id('motivo')}-ayuda`])} />
          <p id={`${id('motivo')}-ayuda`} className="campo-ayuda">
            Mínimo {MOTIVO_MINIMO} caracteres. <span aria-hidden="true">{largoMotivo}/{MOTIVO_MAXIMO}</span>
          </p>
          {mensajeError('motivo')}
        </div>

        <div className="formulario-acciones">
          <button type="submit" className="boton boton-primario" aria-disabled={enviando}>
            {enviando ? 'Registrando…' : 'Registrar reserva'}
          </button>
          <p className="formulario-resumen" aria-live="polite">
            {resumen}
          </p>
        </div>
      </fieldset>
    </form>
  );
}
