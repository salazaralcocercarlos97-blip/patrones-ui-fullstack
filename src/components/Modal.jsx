/*
 * Patrón: VENTANA MODAL (de confirmación, informativa o con un formulario).
 * Problema que resuelve: evitar acciones destructivas por accidente (cancelar una reserva,
 * eliminar un laboratorio) y mostrar un detalle o un formulario breve sin perder la página
 * de fondo. Interrumpe al usuario solo cuando hace falta y le dice exactamente qué va a pasar.
 * Variantes:
 * - Confirmación (con onConfirmar): «Volver» + botón de la acción («Cancelar reserva»), nunca «Aceptar/OK».
 * - Informativa (sin onConfirmar): un solo botón, «Cerrar». Ej.: «Ver» una reserva en el panel.
 * - Formulario (sinAcciones): el contenido trae sus propios botones. Ej.: alta y edición de laboratorios.
 * Accesible: role="dialog" + aria-modal, foco atrapado dentro, Escape (o clic fuera, salvo en
 * formularios) para cerrar, el foco empieza en la opción segura o en el primer campo y al cerrar
 * vuelve al botón que lo abrió. Mientras el servidor responde, el botón de la acción muestra el
 * INDICADOR DE CARGA («Cancelando…») y el modal no se cierra.
 */
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import BotonConCarga from './IndicadorCarga.jsx';

const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  abierto,
  titulo,
  children,
  textoVolver = 'Volver',
  textoConfirmar,
  onConfirmar,
  onCerrar,
  refFocoRespaldo,
  ocupado = false,
  textoOcupado = 'Procesando…',
  sinAcciones = false,
  ancho = 'normal',
}) {
  const idTitulo = useId();
  const idDescripcion = useId();
  const refDialogo = useRef(null);
  const refVolver = useRef(null);
  const esInformativo = !sinAcciones && !onConfirmar;
  // Mientras se espera al servidor (ocupado), el modal no se puede cerrar.
  const cerrar = () => {
    if (!ocupado) onCerrar();
  };
  const refOnCerrar = useRef(cerrar);
  refOnCerrar.current = cerrar;

  useEffect(() => {
    if (!abierto) return undefined;

    const elementoPrevio = document.activeElement;
    const raiz = document.getElementById('root');
    raiz?.setAttribute('inert', '');
    document.body.classList.add('modal-abierto');
    // Foco inicial: la opción segura («Volver»/«Cerrar») o, en un formulario, su primer campo.
    if (sinAcciones) {
      refDialogo.current?.querySelector(`.modal-cuerpo :is(${SELECTOR_ENFOCABLES})`)?.focus();
    } else {
      refVolver.current?.focus();
    }

    const alTeclear = (evento) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        refOnCerrar.current();
        return;
      }
      if (evento.key !== 'Tab' || !refDialogo.current) return;
      // Trampa de foco: Tab y Shift+Tab giran dentro del diálogo.
      const enfocables = refDialogo.current.querySelectorAll(SELECTOR_ENFOCABLES);
      if (enfocables.length === 0) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      } else if (!refDialogo.current.contains(document.activeElement)) {
        evento.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', alTeclear);

    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.classList.remove('modal-abierto');
      raiz?.removeAttribute('inert');
      // Devuelve el foco al botón que abrió el modal. Si ese botón ya no existe
      // (la fila se eliminó y desapareció de la lista), usa el respaldo.
      const destino = elementoPrevio && elementoPrevio.isConnected ? elementoPrevio : refFocoRespaldo?.current;
      destino?.focus?.();
    };
  }, [abierto, refFocoRespaldo, sinAcciones]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="modal-fondo"
      onMouseDown={(evento) => {
        // En un formulario, un clic fuera no lo cierra: se perdería lo escrito.
        if (!sinAcciones && evento.target === evento.currentTarget) cerrar();
      }}
    >
      <div
        ref={refDialogo}
        className={`modal${ancho === 'amplio' ? ' modal-amplio' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={sinAcciones ? undefined : idDescripcion}
      >
        <h2 id={idTitulo} className="modal-titulo">
          {titulo}
        </h2>
        <div id={idDescripcion} className="modal-cuerpo">
          {children}
        </div>
        {!sinAcciones && (
          <div className="modal-acciones">
            <button
              ref={refVolver}
              type="button"
              className={`boton ${esInformativo ? 'boton-primario' : 'boton-secundario'}`}
              onClick={cerrar}
              aria-disabled={ocupado || undefined}
            >
              {textoVolver}
            </button>
            {!esInformativo && (
              <BotonConCarga
                className="boton boton-peligro"
                cargando={ocupado}
                texto={textoConfirmar}
                textoCargando={textoOcupado}
                onClick={onConfirmar}
              />
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
