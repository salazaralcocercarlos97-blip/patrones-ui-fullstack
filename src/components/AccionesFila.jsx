/*
 * Patrón: ACCIONES POR FILA (Row actions).
 * Problema que resuelve: en una tabla de reservas o de laboratorios, el encargado quiere actuar
 * sobre UN registro («Ver», «Cancelar», «Editar», «Eliminar») sin ir a otra página a buscarlo.
 * Los botones viven en la última columna de cada fila; la acción destructiva va al final y en
 * rojo. Como «Ver» se repite en todas las filas, cada botón lleva un aria-label con el contexto
 * de su fila («Ver la reserva del Lab 236-44 del jueves 19 de noviembre»), que empieza con el
 * mismo texto visible para que también funcione el control por voz.
 */
export default function AccionesFila({ acciones }) {
  return (
    <div className="acciones-fila">
      {acciones.map((accion) => (
        <button
          key={accion.etiqueta}
          type="button"
          className={`boton-fila${accion.peligro ? ' boton-fila-peligro' : ''}`}
          aria-label={accion.descripcion}
          disabled={accion.deshabilitada}
          onClick={accion.onClick}
        >
          {accion.etiqueta}
        </button>
      ))}
    </div>
  );
}
