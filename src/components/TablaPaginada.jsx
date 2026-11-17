/*
 * Patrones: PAGINACIÓN + TABLA DE DATOS.
 * Problema que resuelve: una tabla larga (el horario de un laboratorio, las reservas del panel)
 * abruma y obliga a hacer mucho scroll. Se muestran 5 filas por página con «Anterior»,
 * «Siguiente» y los números de página; el texto «Mostrando 1–5 de 8» dice en qué parte de la
 * lista estás. Los botones en los extremos usan aria-disabled para que el foco no se pierda.
 * La tabla usa encabezados th scope="col" y un caption para lectores de pantalla, y en pantallas
 * angostas se desplaza dentro de su propio marco (región enfocable) sin mover la página.
 */
import { useState } from 'react';

export default function TablaPaginada({ titulo, columnas, filas, porPagina = 5 }) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const desde = (paginaActual - 1) * porPagina;
  const visibles = filas.slice(desde, desde + porPagina);
  const numeros = Array.from({ length: totalPaginas }, (_, indice) => indice + 1);

  const irA = (numero) => {
    if (numero < 1 || numero > totalPaginas) return;
    setPagina(numero);
  };

  return (
    <div className="tabla-paginada">
      <div className="tabla-contenedor" role="region" aria-label={titulo} tabIndex={0}>
        <table className="tabla">
          <caption className="solo-lectores">
            {titulo}, página {paginaActual} de {totalPaginas}
          </caption>
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th key={columna.clave} scope="col">
                  {columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((fila) => (
              <tr key={fila.id}>
                {columnas.map((columna) => (
                  <td key={columna.clave}>{columna.render ? columna.render(fila) : fila[columna.clave]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="paginacion">
        <p className="paginacion-resumen" aria-live="polite">
          Mostrando {filas.length === 0 ? 0 : desde + 1}–{desde + visibles.length} de {filas.length}
        </p>
        {totalPaginas > 1 && (
          <nav aria-label={`Páginas de ${titulo}`}>
            <ul className="paginacion-lista">
              <li>
                <button
                  type="button"
                  className="boton-pagina"
                  aria-disabled={paginaActual === 1}
                  onClick={() => irA(paginaActual - 1)}
                >
                  <span aria-hidden="true">‹ </span>Anterior
                </button>
              </li>
              {numeros.map((numero) => (
                <li key={numero}>
                  <button
                    type="button"
                    className="boton-pagina boton-numero"
                    aria-current={numero === paginaActual ? 'page' : undefined}
                    aria-label={`Página ${numero}`}
                    onClick={() => irA(numero)}
                  >
                    {numero}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="boton-pagina"
                  aria-disabled={paginaActual === totalPaginas}
                  onClick={() => irA(paginaActual + 1)}
                >
                  Siguiente<span aria-hidden="true"> ›</span>
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
