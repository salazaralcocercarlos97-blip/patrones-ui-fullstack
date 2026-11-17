/*
 * Patrón: FORMULARIO DE CONFIGURACIÓN (Settings form).
 * Problema que resuelve: el horario de atención y los límites de las reservas cambian según el
 * semestre, y no deberían estar escritos en el código. El encargado los ajusta aquí y se aplican
 * de verdad: el formulario de reserva, el servidor, el carrusel, la ayuda y la ocupación del
 * panel usan estos valores.
 * Los ajustes se agrupan por tema (fieldset + legend), cada campo dice su unidad y su rango,
 * la validación es en línea (el cierre debe ser posterior a la apertura) y un resumen en lenguaje
 * claro muestra cómo quedará la regla antes de guardar. «Descartar cambios» vuelve a lo guardado
 * y al guardar aparece el toast «Configuración guardada».
 */
import { useId, useRef, useState } from 'react';
import BotonConCarga from './IndicadorCarga.jsx';
import {
  ANTICIPACION_MAXIMA_DIAS,
  ANTICIPACION_MINIMA_DIAS,
  DURACION_MAXIMA_HORAS,
  DURACION_MINIMA_HORAS,
  ORDEN_CAMPOS_CONFIGURACION,
  validarCampoConfiguracion,
  validarConfiguracion,
} from '../reglasPanel.js';

function comoTexto(configuracion) {
  return {
    horaApertura: configuracion.horaApertura,
    horaCierre: configuracion.horaCierre,
    duracionMaximaHoras: String(configuracion.duracionMaximaHoras),
    anticipacionMaximaDias: String(configuracion.anticipacionMaximaDias),
  };
}

export default function ConfiguracionForm({ configuracion, soloLectura, guardando, onGuardar }) {
  const idBase = useId();
  const guardados = comoTexto(configuracion);
  const [valores, setValores] = useState(guardados);
  const [errores, setErrores] = useState({});
  const [resumen, setResumen] = useState('');
  const refs = {
    horaApertura: useRef(null),
    horaCierre: useRef(null),
    duracionMaximaHoras: useRef(null),
    anticipacionMaximaDias: useRef(null),
  };
  const id = (campo) => `${idBase}-${campo}`;
  const hayCambios = ORDEN_CAMPOS_CONFIGURACION.some((campo) => valores[campo] !== guardados[campo]);
  const sinErrores = Object.keys(validarConfiguracion(valores)).length === 0;

  const alCambiar = (evento) => {
    const { name, value } = evento.target;
    const nuevosValores = { ...valores, [name]: value };
    setValores(nuevosValores);
    setResumen('');
    setErrores((anteriores) => {
      const siguientes = {};
      // La hora de cierre depende de la de apertura: si se ve su error, se recalcula también.
      Object.keys(anteriores).forEach((campo) => {
        const mensaje = validarCampoConfiguracion(campo, nuevosValores);
        if (mensaje) siguientes[campo] = mensaje;
      });
      return siguientes;
    });
  };

  const alSalir = (evento) => {
    const { name } = evento.target;
    const revisar = name === 'horaApertura' && valores.horaCierre ? ['horaApertura', 'horaCierre'] : [name];
    setErrores((anteriores) => {
      const siguientes = { ...anteriores };
      revisar.forEach((campo) => {
        const mensaje = validarCampoConfiguracion(campo, valores);
        if (mensaje) siguientes[campo] = mensaje;
        else delete siguientes[campo];
      });
      return siguientes;
    });
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    if (guardando || soloLectura) return;

    const encontrados = validarConfiguracion(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      const total = Object.keys(encontrados).length;
      setResumen(total === 1 ? 'Revisa 1 campo marcado.' : `Revisa los ${total} campos marcados.`);
      refs[ORDEN_CAMPOS_CONFIGURACION.find((campo) => encontrados[campo])].current?.focus();
      return;
    }

    const resultado = await onGuardar(valores);
    // Guardado: el formulario queda con los valores tal como los devolvió el servidor (sin cambios pendientes).
    if (resultado.ok && resultado.configuracion) setValores(comoTexto(resultado.configuracion));
    if (!resultado.ok && resultado.errores) {
      setErrores(resultado.errores);
      setResumen('El servidor rechazó la configuración. Revisa los campos marcados.');
    }
  };

  // El botón se deshabilita al no haber cambios: el foco pasa al primer campo para no perderse.
  const descartar = () => {
    setValores(guardados);
    setErrores({});
    setResumen('');
    refs.horaApertura.current?.focus();
  };

  const propsCampo = (campo) => {
    const describedBy = [`${id(campo)}-ayuda`];
    if (errores[campo]) describedBy.push(`${id(campo)}-error`);
    return {
      id: id(campo),
      name: campo,
      ref: refs[campo],
      value: valores[campo],
      onChange: alCambiar,
      onBlur: alSalir,
      'aria-invalid': Boolean(errores[campo]),
      'aria-describedby': describedBy.join(' '),
    };
  };

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

  const duracion = Number(valores.duracionMaximaHoras);
  const anticipacion = Number(valores.anticipacionMaximaDias);

  return (
    <form className="formulario formulario-configuracion" onSubmit={alEnviar} noValidate aria-busy={guardando}>
      <fieldset className="formulario-campos" disabled={soloLectura}>
        <legend className="solo-lectores">Configuración de las reservas</legend>
        <fieldset className="tarjeta grupo-ajustes">
          <legend>Horario de atención</legend>
          <p className="grupo-ajustes-texto">De lunes a sábado. Las reservas deben empezar y terminar dentro de este horario.</p>
          <div className="campo-fila">
            <div className="campo">
              <label htmlFor={id('horaApertura')}>Hora de apertura</label>
              <input type="time" step="300" {...propsCampo('horaApertura')} />
              <p id={`${id('horaApertura')}-ayuda`} className="campo-ayuda">
                Formato de 24 horas.
              </p>
              {mensajeError('horaApertura')}
            </div>
            <div className="campo">
              <label htmlFor={id('horaCierre')}>Hora de cierre</label>
              <input type="time" step="300" {...propsCampo('horaCierre')} />
              <p id={`${id('horaCierre')}-ayuda`} className="campo-ayuda">
                Posterior a la hora de apertura.
              </p>
              {mensajeError('horaCierre')}
            </div>
          </div>
        </fieldset>

        <fieldset className="tarjeta grupo-ajustes">
          <legend>Límites de las reservas</legend>
          <p className="grupo-ajustes-texto">Se aplican a las reservas nuevas; las ya registradas no cambian.</p>
          <div className="campo-fila">
            <div className="campo">
              <label htmlFor={id('duracionMaximaHoras')}>Duración máxima de una reserva</label>
              <div className="campo-unidad">
                <input
                  type="number"
                  inputMode="numeric"
                  min={DURACION_MINIMA_HORAS}
                  max={DURACION_MAXIMA_HORAS}
                  step="1"
                  {...propsCampo('duracionMaximaHoras')}
                />
                <span aria-hidden="true">horas</span>
              </div>
              <p id={`${id('duracionMaximaHoras')}-ayuda`} className="campo-ayuda">
                En horas, de {DURACION_MINIMA_HORAS} a {DURACION_MAXIMA_HORAS}.
              </p>
              {mensajeError('duracionMaximaHoras')}
            </div>
            <div className="campo">
              <label htmlFor={id('anticipacionMaximaDias')}>Anticipación máxima</label>
              <div className="campo-unidad">
                <input
                  type="number"
                  inputMode="numeric"
                  min={ANTICIPACION_MINIMA_DIAS}
                  max={ANTICIPACION_MAXIMA_DIAS}
                  step="1"
                  {...propsCampo('anticipacionMaximaDias')}
                />
                <span aria-hidden="true">días</span>
              </div>
              <p id={`${id('anticipacionMaximaDias')}-ayuda`} className="campo-ayuda">
                En días desde hoy, de {ANTICIPACION_MINIMA_DIAS} a {ANTICIPACION_MAXIMA_DIAS}.
              </p>
              {mensajeError('anticipacionMaximaDias')}
            </div>
          </div>
        </fieldset>

        <div className="configuracion-resumen">
          <h2 className="configuracion-resumen-titulo">Así quedará la regla</h2>
          <p>
            {sinErrores
              ? `Los estudiantes podrán reservar de lunes a sábado, de ${valores.horaApertura} a ${valores.horaCierre}, hasta ${duracion} ${duracion === 1 ? 'hora' : 'horas'} seguidas y con hasta ${anticipacion} ${anticipacion === 1 ? 'día' : 'días'} de anticipación.`
              : 'Corrige los campos marcados para ver cómo quedará la regla.'}
          </p>
        </div>

        <div className="formulario-acciones">
          <BotonConCarga type="submit" cargando={guardando} texto="Guardar configuración" textoCargando="Guardando…" />
          <button type="button" className="boton boton-secundario" onClick={descartar} disabled={!hayCambios || guardando}>
            Descartar cambios
          </button>
          <p className="formulario-resumen" aria-live="polite">
            {resumen}
          </p>
        </div>
      </fieldset>
    </form>
  );
}
