/*
 * Patrón: FILTRADO.
 * Problema que resuelve: el estudiante no busca «cualquier» laboratorio, sino uno disponible
 * y con PCs suficientes para su curso. Los filtros acotan las tarjetas por estado y capacidad
 * mínima, se combinan con la búsqueda de la cabecera y se aplican al instante (sin botón
 * «Aplicar»). «Limpiar filtros» vuelve a mostrar todo en un clic.
 * Accesible: cada grupo es un fieldset con su legend y radios nativos (se recorren con las
 * flechas); la cantidad de resultados se anuncia en una región role="status" (en App.jsx).
 */
import { useId } from 'react';

export const FILTROS_INICIALES = { estado: 'TODOS', capacidadMinima: 0 };

export const OPCIONES_ESTADO = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'DISPONIBLE', etiqueta: 'Disponible' },
  { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento' },
];

export const OPCIONES_CAPACIDAD = [
  { valor: 0, etiqueta: 'Cualquiera' },
  { valor: 30, etiqueta: '30 PCs o más' },
  { valor: 40, etiqueta: '40 PCs o más' },
  { valor: 44, etiqueta: '44 PCs o más' },
];

export function hayFiltrosActivos(filtros) {
  return filtros.estado !== FILTROS_INICIALES.estado || filtros.capacidadMinima !== FILTROS_INICIALES.capacidadMinima;
}

export function cumpleFiltros(laboratorio, filtros) {
  if (filtros.estado !== 'TODOS' && laboratorio.estado !== filtros.estado) return false;
  return laboratorio.capacidad >= filtros.capacidadMinima;
}

function GrupoOpciones({ leyenda, nombre, opciones, valor, onCambiar }) {
  return (
    <fieldset className="filtro-grupo">
      <legend>{leyenda}</legend>
      <div className="filtro-opciones">
        {opciones.map((opcion) => (
          <label key={opcion.valor} className="filtro-opcion">
            <input
              type="radio"
              name={nombre}
              value={opcion.valor}
              checked={valor === opcion.valor}
              onChange={() => onCambiar(opcion.valor)}
            />
            <span>{opcion.etiqueta}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Filtros({ filtros, onCambiar, onLimpiar }) {
  const idBase = useId();

  return (
    <section className="filtros tarjeta" aria-labelledby={`${idBase}-titulo`}>
      <h2 id={`${idBase}-titulo`} className="filtros-titulo">
        Filtrar laboratorios
      </h2>
      <div className="filtros-grupos">
        <GrupoOpciones
          leyenda="Estado"
          nombre={`${idBase}-estado`}
          opciones={OPCIONES_ESTADO}
          valor={filtros.estado}
          onCambiar={(estado) => onCambiar({ ...filtros, estado })}
        />
        <GrupoOpciones
          leyenda="Capacidad mínima"
          nombre={`${idBase}-capacidad`}
          opciones={OPCIONES_CAPACIDAD}
          valor={filtros.capacidadMinima}
          onCambiar={(capacidadMinima) => onCambiar({ ...filtros, capacidadMinima })}
        />
      </div>
      {/* Siempre activo: si se deshabilitara al limpiar, el foco se perdería. */}
      <button type="button" className="boton boton-secundario filtros-limpiar" onClick={onLimpiar}>
        Limpiar filtros
      </button>
    </section>
  );
}
