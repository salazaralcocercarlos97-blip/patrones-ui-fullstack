/*
 * Patrón: MIGAS DE PAN.
 * Problema que resuelve: en una navegación de varios niveles el usuario pierde de vista
 * dónde está. Las migas muestran la ruta (Inicio > Laboratorios > Lab 236-43) y cada
 * nivel anterior es un enlace para volver en un clic. El último nivel lleva aria-current.
 */
export default function Breadcrumbs({ items }) {
  if (!items || items.length < 2) return null;

  return (
    <nav className="migas" aria-label="Migas de pan">
      <ol>
        {items.map((item, indice) => {
          const esUltimo = indice === items.length - 1;
          return (
            <li key={item.etiqueta}>
              {indice > 0 && (
                <span className="migas-separador" aria-hidden="true">
                  ›
                </span>
              )}
              {esUltimo ? (
                <span aria-current="page">{item.etiqueta}</span>
              ) : (
                <a href={item.href}>{item.etiqueta}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
