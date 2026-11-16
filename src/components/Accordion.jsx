/*
 * Patrón: ACORDEÓN.
 * Problema que resuelve: mostrar varias preguntas frecuentes sin una pared de texto.
 * El usuario ve todas las preguntas y abre solo la que le interesa; un panel abierto a la
 * vez mantiene la página corta. Cada cabecera es un botón con aria-expanded/aria-controls.
 */
import { useId, useState } from 'react';

export default function Accordion({ items, nivelTitulo = 2, abiertoInicial = 0 }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const idBase = useId();
  const Titulo = `h${nivelTitulo}`;

  return (
    <div className="acordeon">
      {items.map((item, indice) => {
        const estaAbierto = abierto === indice;
        const idBoton = `${idBase}-boton-${indice}`;
        const idPanel = `${idBase}-panel-${indice}`;
        return (
          <div key={item.pregunta} className={`acordeon-item${estaAbierto ? ' abierto' : ''}`}>
            <Titulo className="acordeon-titulo">
              <button
                type="button"
                id={idBoton}
                aria-expanded={estaAbierto}
                aria-controls={idPanel}
                onClick={() => setAbierto(estaAbierto ? null : indice)}
              >
                <span>{item.pregunta}</span>
                <svg className="acordeon-flecha" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </Titulo>
            <div id={idPanel} role="region" aria-labelledby={idBoton} className="acordeon-panel" hidden={!estaAbierto}>
              <p>{item.respuesta}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
