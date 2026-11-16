/*
 * Patrón: SKELETON DE CARGA.
 * Problema que resuelve: mientras llegan los datos, un spinner no dice qué va a aparecer.
 * El skeleton dibuja la forma del contenido (tarjetas grises animadas), la espera se
 * percibe más corta y la página no "salta" cuando llegan los datos.
 * Se anuncia «Cargando…» a lectores de pantalla y la animación se apaga si el sistema
 * pide movimiento reducido.
 */
function Bloque({ ancho = '100%', alto = '1rem', className = '' }) {
  return <span className={`skeleton-bloque ${className}`} style={{ width: ancho, height: alto }} />;
}

function TarjetaFantasma() {
  return (
    <div className="tarjeta skeleton-tarjeta">
      <div className="skeleton-fila">
        <Bloque ancho="45%" alto="1.4rem" />
        <Bloque ancho="28%" alto="1.4rem" className="skeleton-pastilla" />
      </div>
      <Bloque ancho="60%" />
      <div className="skeleton-fila">
        <Bloque ancho="40%" alto="2.5rem" />
        <Bloque ancho="40%" alto="2.5rem" />
      </div>
      <Bloque alto="2.75rem" />
    </div>
  );
}

function DatoFantasma() {
  return (
    <div className="tarjeta skeleton-dato">
      <Bloque ancho="40%" alto="2rem" />
      <Bloque ancho="70%" />
    </div>
  );
}

export default function Skeleton({ variante = 'tarjetas', cantidad = 6, texto = 'Cargando…' }) {
  return (
    <div className="skeleton" aria-busy="true">
      <span className="solo-lectores" role="status">
        {texto}
      </span>
      {variante === 'tarjetas' && (
        <div className="grilla grilla-tarjetas" aria-hidden="true">
          {Array.from({ length: cantidad }, (_, indice) => (
            <TarjetaFantasma key={indice} />
          ))}
        </div>
      )}
      {variante === 'datos' && (
        <div className="grilla grilla-datos" aria-hidden="true">
          {Array.from({ length: cantidad }, (_, indice) => (
            <DatoFantasma key={indice} />
          ))}
        </div>
      )}
      {variante === 'lineas' && (
        <div className="skeleton-lineas" aria-hidden="true">
          <Bloque ancho="35%" alto="2.75rem" />
          {Array.from({ length: cantidad }, (_, indice) => (
            <Bloque key={indice} ancho={`${92 - (indice % 3) * 14}%`} />
          ))}
        </div>
      )}
    </div>
  );
}
