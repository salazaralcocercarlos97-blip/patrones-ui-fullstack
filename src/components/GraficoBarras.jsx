/*
 * Gráfico de barras horizontales para el patrón REPORTES (ver vistas/PanelReportes.jsx).
 * Problema que resuelve: un conteo («reservas por tipo») se compara mejor con barras que con
 * una lista de números. Cada fila escribe la categoría, la cantidad y el porcentaje como texto;
 * la barra es solo un refuerzo visual (aria-hidden), así el lector de pantalla lee
 * «Examen: 2 reservas (50 %)» y nada depende del color ni del largo.
 */
import { useId } from 'react';

export default function GraficoBarras({ titulo, descripcion, datos, unidad = ['reserva', 'reservas'] }) {
  const idTitulo = useId();
  const total = datos.reduce((suma, dato) => suma + dato.valor, 0);
  const maximo = Math.max(1, ...datos.map((dato) => dato.valor));

  return (
    <figure className="tarjeta grafico" aria-labelledby={idTitulo}>
      <figcaption>
        <h2 id={idTitulo} className="grafico-titulo">
          {titulo}
        </h2>
        {descripcion && <p className="grafico-descripcion">{descripcion}</p>}
      </figcaption>
      <ul className="grafico-lista">
        {datos.map((dato) => {
          const porcentaje = total > 0 ? Math.round((dato.valor / total) * 100) : 0;
          return (
            <li key={dato.clave} className="grafico-fila">
              <span className="grafico-etiqueta">{dato.etiqueta}</span>
              <span className="grafico-pista" aria-hidden="true">
                <span className="grafico-barra" style={{ width: `${(dato.valor / maximo) * 100}%` }} />
              </span>
              <span className="grafico-valor">
                <span className="solo-lectores">: </span>
                {dato.valor} <span className="grafico-unidad">{dato.valor === 1 ? unidad[0] : unidad[1]}</span>{' '}
                <span className="grafico-porcentaje">({porcentaje} %)</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="grafico-total">
        Total: {total} {total === 1 ? unidad[0] : unidad[1]}
      </p>
    </figure>
  );
}
