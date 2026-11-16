/*
 * Patrón: ESTADO VACÍO.
 * Problema que resuelve: una pantalla en blanco no explica nada. Cuando no hay resultados
 * (o no hay reservas) se dice claramente qué pasó, qué se puede intentar y se ofrece una
 * acción para salir del vacío («Limpiar búsqueda», «Ver laboratorios»).
 */
const ICONOS = {
  busqueda: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5M8.5 8.5l5 5M13.5 8.5l-5 5" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  pagina: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9.5 13.5h5" />
    </>
  ),
};

export default function EmptyState({ icono = 'busqueda', titulo, mensaje, accion }) {
  return (
    <div className="vacio">
      <svg className="vacio-icono" aria-hidden="true" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {ICONOS[icono]}
      </svg>
      <h2 className="vacio-titulo">{titulo}</h2>
      {mensaje && <p className="vacio-mensaje">{mensaje}</p>}
      {accion &&
        (accion.href ? (
          <a className="boton boton-primario" href={accion.href}>
            {accion.etiqueta}
          </a>
        ) : (
          <button type="button" className="boton boton-primario" onClick={accion.onClick}>
            {accion.etiqueta}
          </button>
        ))}
    </div>
  );
}
