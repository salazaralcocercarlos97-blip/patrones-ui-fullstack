/*
 * Patrón: INDICADOR DE CARGA (Loader), variante spinner dentro del botón.
 * Problema que resuelve: después de pulsar «Registrar», «Guardar», «Cancelar» o «Eliminar»,
 * el usuario no sabe si la app recibió su orden mientras espera al servidor, y vuelve a pulsar.
 * El botón muestra un spinner y cambia su texto («Guardando…»), queda inactivo (aria-disabled,
 * sigue enfocable para no perder el foco) y una región role="status" lo anuncia a los lectores
 * de pantalla. Con movimiento reducido el spinner no gira: queda como un anillo punteado fijo.
 * La otra variante del mismo patrón es el skeleton de las cargas de página (Skeleton.jsx).
 */

// Spinner decorativo: el texto del botón ya dice qué está pasando.
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export default function BotonConCarga({
  cargando = false,
  texto,
  textoCargando,
  className = 'boton boton-primario',
  type = 'button',
  onClick,
  ...resto
}) {
  return (
    <>
      <button
        type={type}
        className={className}
        aria-disabled={cargando || undefined}
        onClick={(evento) => {
          // Mientras se espera al servidor, un segundo clic no hace nada (ni reenvía el formulario).
          if (cargando) {
            evento.preventDefault();
            return;
          }
          onClick?.(evento);
        }}
        {...resto}
      >
        {cargando && <Spinner />}
        {cargando ? textoCargando : texto}
      </button>
      <span className="solo-lectores" role="status">
        {cargando ? textoCargando : ''}
      </span>
    </>
  );
}
