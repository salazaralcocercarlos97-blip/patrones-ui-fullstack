/*
 * Patrón: FORMULARIO CRUD (alta y edición de laboratorios, dentro de una ventana modal).
 * Problema que resuelve: el encargado necesita dar de alta un laboratorio nuevo, corregir sus
 * datos o ponerlo en mantenimiento sin tocar la base de datos. El mismo formulario sirve para
 * crear (código editable) y para editar (código fijo, porque las clases y reservas lo usan).
 * Validación en línea, igual que el formulario de reserva: cada campo se revisa al salir de él,
 * el error se borra en cuanto el valor es correcto, el motivo solo se pide (y se muestra) si el
 * estado es «Mantenimiento», y el software se escribe separado por comas con una vista previa.
 * Las reglas viven en src/reglasPanel.js y el servidor las vuelve a aplicar: si rechaza algo
 * (por ejemplo, otro encargado acaba de usar ese código), su mensaje aparece junto al campo.
 */
import { useId, useRef, useState } from 'react';
import BotonConCarga from './IndicadorCarga.jsx';
import {
  CAPACIDAD_MAXIMA,
  CAPACIDAD_MINIMA,
  DESCRIPCION_MAXIMA,
  ESTADOS_LAB,
  MOTIVO_MANTENIMIENTO_MAXIMO,
  ORDEN_CAMPOS_LAB,
  separarSoftware,
  validarCampoLaboratorio,
  validarLaboratorio,
} from '../reglasPanel.js';

function valoresIniciales(laboratorio) {
  if (!laboratorio) {
    // Valores por defecto razonables: todos los labs del piso comparten ubicación.
    return { codigo: '', capacidad: '', estado: 'DISPONIBLE', ubicacion: 'Módulo 236, 4to piso', descripcion: '', motivoMantenimiento: '', software: '' };
  }
  return {
    codigo: laboratorio.codigo,
    capacidad: String(laboratorio.capacidad),
    estado: laboratorio.estado,
    ubicacion: laboratorio.ubicacion,
    descripcion: laboratorio.descripcion,
    motivoMantenimiento: laboratorio.motivoMantenimiento ?? '',
    software: laboratorio.software.join(', '),
  };
}

function textoResumen(errores) {
  const total = Object.keys(errores).length;
  return total === 1 ? 'Revisa 1 campo marcado.' : `Revisa los ${total} campos marcados.`;
}

export default function LaboratorioForm({ laboratorio, codigosExistentes, guardando, onGuardar, onDescartar }) {
  const idBase = useId();
  const esNuevo = !laboratorio;
  const [valores, setValores] = useState(() => valoresIniciales(laboratorio));
  const [errores, setErrores] = useState({});
  const [resumen, setResumen] = useState('');
  // Campos que el usuario ya editó: un campo vacío que solo se recorrió con Tab no se marca en rojo
  // (además, ese mensaje empujaría hacia abajo el botón que el usuario está por pulsar).
  const modificados = useRef(new Set());
  const refs = {
    codigo: useRef(null),
    capacidad: useRef(null),
    estado: useRef(null),
    ubicacion: useRef(null),
    descripcion: useRef(null),
    motivoMantenimiento: useRef(null),
    software: useRef(null),
  };
  const contexto = { esNuevo, codigosExistentes };
  const id = (campo) => `${idBase}-${campo}`;
  const enMantenimiento = valores.estado === 'MANTENIMIENTO';

  const enfocarPrimerError = (encontrados) => {
    const primero = ORDEN_CAMPOS_LAB.find((campo) => encontrados[campo]);
    if (primero) refs[primero].current?.focus();
  };

  // Al escribir: solo se recalculan los errores que ya se ven (no se regaña antes de tiempo).
  const alCambiar = (evento) => {
    const { name, value } = evento.target;
    const nuevosValores = { ...valores, [name]: value };
    modificados.current.add(name);
    setValores(nuevosValores);
    setResumen('');
    setErrores((anteriores) => {
      const siguientes = {};
      Object.keys(anteriores).forEach((campo) => {
        const mensaje = validarCampoLaboratorio(campo, nuevosValores, contexto);
        if (mensaje) siguientes[campo] = mensaje;
      });
      return siguientes;
    });
  };

  // Al salir del campo: se valida ese campo (si el usuario ya escribió en él).
  const alSalir = (evento) => {
    const { name } = evento.target;
    if (!modificados.current.has(name)) return;
    const mensaje = validarCampoLaboratorio(name, valores, contexto);
    setErrores((anteriores) => {
      const siguientes = { ...anteriores };
      if (mensaje) siguientes[name] = mensaje;
      else delete siguientes[name];
      return siguientes;
    });
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;

    const encontrados = validarLaboratorio(valores, contexto);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setResumen(textoResumen(encontrados));
      enfocarPrimerError(encontrados);
      return;
    }

    const resultado = await onGuardar(valores);
    if (!resultado.ok && resultado.errores) {
      setErrores(resultado.errores);
      setResumen(textoResumen(resultado.errores));
      enfocarPrimerError(resultado.errores);
    }
    // Si se guardó, el panel cierra el modal; si falló la conexión, muestra un toast y se conservan los datos.
  };

  const propsCampo = (campo, ayudas = []) => {
    const describedBy = [...ayudas];
    if (errores[campo]) describedBy.push(`${id(campo)}-error`);
    return {
      id: id(campo),
      name: campo,
      ref: refs[campo],
      value: valores[campo],
      onChange: alCambiar,
      onBlur: alSalir,
      'aria-invalid': Boolean(errores[campo]),
      'aria-describedby': describedBy.length ? describedBy.join(' ') : undefined,
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

  const programas = separarSoftware(valores.software);

  return (
    <form className="formulario formulario-modal" onSubmit={alEnviar} noValidate aria-busy={guardando}>
      <p className="formulario-intro">Todos los campos son obligatorios.</p>

      <div className="formulario-campos">
        <div className="campo-fila">
          <div className="campo">
            <label htmlFor={id('codigo')}>Código</label>
            <input
              type="text"
              autoComplete="off"
              spellCheck="false"
              readOnly={!esNuevo}
              maxLength={6}
              {...propsCampo('codigo', [`${id('codigo')}-ayuda`])}
            />
            <p id={`${id('codigo')}-ayuda`} className="campo-ayuda">
              {esNuevo ? 'Formato 236-NN, por ejemplo 236-47.' : 'El código no se puede cambiar.'}
            </p>
            {mensajeError('codigo')}
          </div>
          <div className="campo">
            <label htmlFor={id('capacidad')}>Capacidad (PCs de estudiante)</label>
            <input
              type="number"
              inputMode="numeric"
              min={CAPACIDAD_MINIMA}
              max={CAPACIDAD_MAXIMA}
              step="1"
              {...propsCampo('capacidad', [`${id('capacidad')}-ayuda`])}
            />
            <p id={`${id('capacidad')}-ayuda`} className="campo-ayuda">
              De {CAPACIDAD_MINIMA} a {CAPACIDAD_MAXIMA}.
            </p>
            {mensajeError('capacidad')}
          </div>
        </div>

        <div className="campo-fila">
          <fieldset className="campo campo-radios">
            <legend>Estado</legend>
            <div className="radios-en-linea">
              {ESTADOS_LAB.map((estado, indice) => (
                <label key={estado.valor} className="radio">
                  <input
                    type="radio"
                    name="estado"
                    value={estado.valor}
                    ref={indice === 0 ? refs.estado : undefined}
                    checked={valores.estado === estado.valor}
                    onChange={alCambiar}
                  />
                  {estado.etiqueta}
                </label>
              ))}
            </div>
            {mensajeError('estado')}
          </fieldset>
          <div className="campo">
            <label htmlFor={id('ubicacion')}>Ubicación</label>
            <input type="text" autoComplete="off" {...propsCampo('ubicacion')} />
            {mensajeError('ubicacion')}
          </div>
        </div>

        {enMantenimiento && (
          <div className="campo">
            <label htmlFor={id('motivoMantenimiento')}>Motivo del mantenimiento</label>
            <textarea rows={2} maxLength={MOTIVO_MANTENIMIENTO_MAXIMO} {...propsCampo('motivoMantenimiento', [`${id('motivoMantenimiento')}-ayuda`])} />
            <p id={`${id('motivoMantenimiento')}-ayuda`} className="campo-ayuda">
              Los estudiantes lo verán en el laboratorio y en su formulario de reserva.
            </p>
            {mensajeError('motivoMantenimiento')}
          </div>
        )}

        <div className="campo">
          <label htmlFor={id('descripcion')}>Descripción</label>
          <textarea rows={2} maxLength={DESCRIPCION_MAXIMA} {...propsCampo('descripcion', [`${id('descripcion')}-ayuda`])} />
          <p id={`${id('descripcion')}-ayuda`} className="campo-ayuda">
            Para qué materias se usa. <span aria-hidden="true">{valores.descripcion.trim().length}/{DESCRIPCION_MAXIMA}</span>
          </p>
          {mensajeError('descripcion')}
        </div>

        <div className="campo">
          <label htmlFor={id('software')}>Software instalado</label>
          <input type="text" autoComplete="off" spellCheck="false" {...propsCampo('software', [`${id('software')}-ayuda`])} />
          <p id={`${id('software')}-ayuda`} className="campo-ayuda">
            Separa los programas con comas. Ej.: Visual Studio Code, Git, Python 3.
          </p>
          {programas.length > 0 && (
            <ul className="chips chips-previa" aria-hidden="true">
              {programas.map((programa, indice) => (
                <li key={`${programa}-${indice}`}>{programa}</li>
              ))}
            </ul>
          )}
          {mensajeError('software')}
        </div>
      </div>

      <div className="formulario-acciones formulario-acciones-modal">
        <p className="formulario-resumen" aria-live="polite">
          {resumen}
        </p>
        <button
          type="button"
          className="boton boton-secundario"
          onClick={() => {
            if (!guardando) onDescartar();
          }}
          aria-disabled={guardando || undefined}
        >
          Descartar
        </button>
        <BotonConCarga
          type="submit"
          cargando={guardando}
          texto={esNuevo ? 'Crear laboratorio' : 'Guardar cambios'}
          textoCargando="Guardando…"
        />
      </div>
    </form>
  );
}
