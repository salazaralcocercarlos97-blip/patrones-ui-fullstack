/*
 * Patrón: PESTAÑAS.
 * Problema que resuelve: el detalle de un laboratorio tiene tres tipos de información
 * (datos, horario y formulario de reserva). Las pestañas los separan sin cambiar de página.
 * Accesible según WAI-ARIA: role="tablist"/"tab"/"tabpanel", flechas ← → para moverse,
 * Inicio/Fin para ir a la primera o la última. Los paneles ocultos se mantienen montados
 * para no perder lo que el usuario escribió en el formulario.
 */
import { useId, useRef } from 'react';

export default function Tabs({ etiqueta, pestanas, activa, onCambiar }) {
  const idBase = useId();
  const refsPestanas = useRef([]);
  const indiceActivo = Math.max(0, pestanas.findIndex((pestana) => pestana.id === activa));

  const alTeclear = (evento) => {
    const total = pestanas.length;
    let nuevoIndice = null;
    if (evento.key === 'ArrowRight') nuevoIndice = (indiceActivo + 1) % total;
    else if (evento.key === 'ArrowLeft') nuevoIndice = (indiceActivo - 1 + total) % total;
    else if (evento.key === 'Home') nuevoIndice = 0;
    else if (evento.key === 'End') nuevoIndice = total - 1;
    if (nuevoIndice === null) return;
    evento.preventDefault();
    onCambiar(pestanas[nuevoIndice].id);
    refsPestanas.current[nuevoIndice]?.focus();
  };

  return (
    <div className="pestanas">
      <div className="pestanas-lista" role="tablist" aria-label={etiqueta} onKeyDown={alTeclear}>
        {pestanas.map((pestana, indice) => {
          const seleccionada = indice === indiceActivo;
          return (
            <button
              key={pestana.id}
              ref={(elemento) => {
                refsPestanas.current[indice] = elemento;
              }}
              type="button"
              role="tab"
              id={`${idBase}-pestana-${pestana.id}`}
              aria-selected={seleccionada}
              aria-controls={`${idBase}-panel-${pestana.id}`}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => onCambiar(pestana.id)}
            >
              {pestana.etiqueta}
            </button>
          );
        })}
      </div>

      {pestanas.map((pestana, indice) => (
        <div
          key={pestana.id}
          role="tabpanel"
          id={`${idBase}-panel-${pestana.id}`}
          aria-labelledby={`${idBase}-pestana-${pestana.id}`}
          hidden={indice !== indiceActivo}
          tabIndex={0}
          className="pestanas-panel"
        >
          {pestana.contenido}
        </div>
      ))}
    </div>
  );
}
