/*
 * Patrón: CARRUSEL PRINCIPAL (Hero carousel).
 * Problema que resuelve: la portada tiene varios avisos importantes (abrir reservas del
 * semestre, un laboratorio en mantenimiento, el horario de atención, el software disponible)
 * y no caben todos en primer plano sin saturarla. El carrusel los muestra de uno en uno en el
 * mismo espacio, con «Anterior/Siguiente» y puntos para elegir cualquiera.
 * Accesible según el patrón de carrusel de WAI-ARIA:
 * - Región con aria-roledescription="carrusel"; cada diapositiva es un grupo «1 de 4».
 * - Avance automático cada 6 s que se pausa con el mouse encima o el foco dentro, y un botón
 *   Pausar/Reanudar (el primero en el orden de tabulación) para detenerlo del todo.
 * - Si el sistema pide movimiento reducido (prefers-reduced-motion), no avanza solo.
 * - La región de las diapositivas usa aria-live="off" mientras rota (no interrumpe al lector de
 *   pantalla cada 6 s) y "polite" cuando está en pausa (anuncia el cambio que pidió el usuario).
 */
import { useEffect, useId, useRef, useState } from 'react';

const ICONOS = {
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h3M8 17h6" />
    </>
  ),
  herramienta: <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5zM14.5 6.5 17 4l3 3-2.5 2.5" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4M7.5 8.5l2 1.5-2 1.5M11.5 11.5h4" />
    </>
  ),
};

function prefiereMenosMovimiento() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Carrusel({ etiqueta, diapositivas, intervalo = 6000 }) {
  const idBase = useId();
  const idDiapositivas = `${idBase}-diapositivas`;
  const total = diapositivas.length;
  const [actual, setActual] = useState(0);
  // «detenido» = pausa pedida por el usuario (o por el sistema, con movimiento reducido).
  const [detenido, setDetenido] = useState(prefiereMenosMovimiento);
  const [conPuntero, setConPuntero] = useState(false);
  const [conFoco, setConFoco] = useState(false);
  const refRaiz = useRef(null);
  const refRotacion = useRef(null);

  const indice = Math.min(actual, total - 1);
  const rotando = total > 1 && !detenido && !conPuntero && !conFoco;

  // Avance automático. Se reprograma en cada cambio, así un clic en «Siguiente» reinicia los 6 s.
  useEffect(() => {
    if (!rotando) return undefined;
    const temporizador = setTimeout(() => setActual((i) => (i + 1) % total), intervalo);
    return () => clearTimeout(temporizador);
  }, [rotando, indice, total, intervalo]);

  // Si el usuario activa «reducir movimiento» con la página abierta, el carrusel se detiene.
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    const alCambiar = (evento) => {
      if (evento.matches) setDetenido(true);
    };
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  const irA = (nuevo) => setActual((nuevo + total) % total);

  // El foco en el botón Pausar/Reanudar no cuenta como pausa: así «Reanudar» se nota al instante.
  const alEnfocar = (evento) => {
    if (evento.target !== refRotacion.current) setConFoco(true);
  };
  const alDesenfocar = (evento) => {
    const destino = evento.relatedTarget;
    if (!refRaiz.current?.contains(destino) || destino === refRotacion.current) setConFoco(false);
  };

  if (total === 0) return null;

  return (
    <section
      ref={refRaiz}
      className="carrusel"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
      onFocus={alEnfocar}
      onBlur={alDesenfocar}
    >
      {/* Primero en el orden de tabulación: se puede detener el carrusel antes de llegar al contenido. */}
      {total > 1 && (
        <button
          ref={refRotacion}
          type="button"
          className="carrusel-boton carrusel-rotacion"
          onClick={() => setDetenido((valor) => !valor)}
        >
          {detenido ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5.5v13l10.5-6.5z" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <rect x="6.5" y="5.5" width="4" height="13" rx="1" />
              <rect x="13.5" y="5.5" width="4" height="13" rx="1" />
            </svg>
          )}
          {detenido ? 'Reanudar' : 'Pausar'}
          <span className="solo-lectores"> el avance automático</span>
        </button>
      )}

      <div
        id={idDiapositivas}
        className="carrusel-diapositivas"
        aria-live={rotando ? 'off' : 'polite'}
        onMouseEnter={() => setConPuntero(true)}
        onMouseLeave={() => setConPuntero(false)}
      >
        {diapositivas.map((diapositiva, i) => {
          const activa = i === indice;
          return (
            <div
              key={diapositiva.id}
              className={`carrusel-diapositiva${activa ? ' activa' : ''}`}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}`}
              aria-hidden={!activa}
              inert={!activa}
            >
              <div className="carrusel-texto">
                {diapositiva.etiqueta && <p className="carrusel-etiqueta">{diapositiva.etiqueta}</p>}
                <h2 className="carrusel-titulo">{diapositiva.titulo}</h2>
                <p className="carrusel-descripcion">{diapositiva.texto}</p>
                {diapositiva.accion && (
                  <a className="boton carrusel-accion" href={diapositiva.accion.href}>
                    {diapositiva.accion.etiqueta}
                  </a>
                )}
              </div>
              {diapositiva.icono && (
                <svg className="carrusel-ilustracion" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  {ICONOS[diapositiva.icono]}
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <div className="carrusel-controles">
          <div className="carrusel-puntos">
            {diapositivas.map((diapositiva, i) => (
              <button
                key={diapositiva.id}
                type="button"
                className="carrusel-punto"
                aria-label={`Diapositiva ${i + 1} de ${total}: ${diapositiva.titulo}`}
                aria-current={i === indice ? 'true' : undefined}
                aria-controls={idDiapositivas}
                onClick={() => irA(i)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="carrusel-flechas">
            <span className="carrusel-contador" aria-hidden="true">
              {indice + 1} de {total}
            </span>
            <button
              type="button"
              className="carrusel-boton carrusel-flecha"
              aria-label="Diapositiva anterior"
              aria-controls={idDiapositivas}
              onClick={() => irA(indice - 1)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m14.5 6-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              className="carrusel-boton carrusel-flecha"
              aria-label="Diapositiva siguiente"
              aria-controls={idDiapositivas}
              onClick={() => irA(indice + 1)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9.5 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
