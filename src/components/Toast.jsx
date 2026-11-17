/*
 * Patrón: NOTIFICACIÓN TOAST (notificación breve).
 * Problema que resuelve: confirmar que una acción funcionó («Reserva registrada»,
 * «Laboratorio creado», «Configuración guardada») sin bloquear al usuario ni pedirle que
 * cierre nada. Se oculta solo a los 3 s (6 s si es un error, para que dé tiempo a leerlo).
 * La región role="status" existe siempre en la página para que los lectores de pantalla
 * anuncien el mensaje en cuanto aparece.
 */
import { useEffect, useRef } from 'react';

export default function Toast({ aviso, onCerrar, duracion = 3000 }) {
  const refOnCerrar = useRef(onCerrar);
  refOnCerrar.current = onCerrar;

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => refOnCerrar.current(), duracion);
    return () => clearTimeout(temporizador);
  }, [aviso, duracion]);

  return (
    <div className="toast-region">
      <div className={aviso ? `toast toast-${aviso.tipo}` : 'toast-oculto'}>
        {aviso && (
          <svg className="toast-icono" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {aviso.tipo === 'exito' ? <path d="M5 12.5 10 17l9-10" /> : <path d="M12 8v5M12 16.5v.5M12 3l10 18H2z" />}
          </svg>
        )}
        <p className="toast-mensaje" role="status">
          {aviso ? aviso.mensaje : ''}
        </p>
        {aviso && (
          <button type="button" className="toast-cerrar" onClick={onCerrar} aria-label="Cerrar aviso">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
