/*
 * Patrón: MODAL DE CONFIRMACIÓN.
 * Problema que resuelve: evitar acciones destructivas por accidente (cancelar una reserva).
 * Interrumpe al usuario solo cuando hace falta y le dice exactamente qué va a pasar.
 * Accesible: role="dialog" + aria-modal, foco atrapado dentro, Escape o clic fuera para
 * cerrar, el foco empieza en la opción segura («Volver») y al cerrar vuelve al botón que
 * lo abrió. Los botones dicen la acción («Cancelar reserva»), nunca «Aceptar/OK».
 * Versión con backend: mientras el servidor responde, el botón dice «Cancelando…» y el
 * modal no se cierra, para que el usuario sepa que su acción está en curso.
 */
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

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
}) {
  const idTitulo = useId();
  const idDescripcion = useId();
  const refDialogo = useRef(null);
  const refVolver = useRef(null);
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
    refVolver.current?.focus();

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
      // (la reserva se canceló y desapareció de la lista), usa el respaldo.
      const destino = elementoPrevio && elementoPrevio.isConnected ? elementoPrevio : refFocoRespaldo?.current;
      destino?.focus?.();
    };
  }, [abierto, refFocoRespaldo]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="modal-fondo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) cerrar();
      }}
    >
      <div
        ref={refDialogo}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDescripcion}
      >
        <h2 id={idTitulo} className="modal-titulo">
          {titulo}
        </h2>
        <div id={idDescripcion} className="modal-cuerpo">
          {children}
        </div>
        <div className="modal-acciones">
          <button ref={refVolver} type="button" className="boton boton-secundario" onClick={cerrar} aria-disabled={ocupado}>
            {textoVolver}
          </button>
          <button
            type="button"
            className="boton boton-peligro"
            onClick={() => {
              if (!ocupado) onConfirmar();
            }}
            aria-disabled={ocupado}
          >
            {ocupado ? textoOcupado : textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
