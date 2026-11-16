/*
 * Patrón: TARJETAS.
 * Problema que resuelve: comparar seis laboratorios de un vistazo. Cada tarjeta agrupa
 * los datos clave (código, capacidad, estado con etiqueta de color + texto, clases por
 * semana) y una sola acción clara: «Ver laboratorio». Se acomodan en una cuadrícula que
 * pasa de 1 a 3 columnas según el ancho de la pantalla.
 */
import { useId } from 'react';

export function EstadoBadge({ estado }) {
  const enMantenimiento = estado === 'MANTENIMIENTO';
  return (
    <span className={`badge ${enMantenimiento ? 'badge-mantenimiento' : 'badge-disponible'}`}>
      <span className="badge-punto" aria-hidden="true" />
      {enMantenimiento ? 'Mantenimiento' : 'Disponible'}
    </span>
  );
}

export default function LabCard({ laboratorio, totalClases, coincidencias = 0 }) {
  const idTitulo = useId();

  return (
    <article className="tarjeta tarjeta-lab" aria-labelledby={idTitulo}>
      <div className="tarjeta-cabecera">
        <h3 id={idTitulo} className="tarjeta-titulo">
          Lab {laboratorio.codigo}
        </h3>
        <EstadoBadge estado={laboratorio.estado} />
      </div>
      <p className="tarjeta-ubicacion">{laboratorio.ubicacion}</p>

      <dl className="tarjeta-datos">
        <div>
          <dt>Capacidad</dt>
          <dd>{laboratorio.capacidad} PCs</dd>
        </div>
        <div>
          <dt>Clases por semana</dt>
          <dd>{totalClases}</dd>
        </div>
      </dl>

      {coincidencias > 0 && (
        <p className="tarjeta-nota">
          {coincidencias === 1 ? '1 clase coincide' : `${coincidencias} clases coinciden`} con tu búsqueda
        </p>
      )}

      <a className="boton boton-primario tarjeta-accion" href={`#/laboratorios/${laboratorio.codigo}`}>
        Ver laboratorio
        <span className="solo-lectores"> {laboratorio.codigo}</span>
      </a>
    </article>
  );
}
