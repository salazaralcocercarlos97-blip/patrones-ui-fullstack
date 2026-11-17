/*
 * Patrón: TARJETAS KPI (indicadores clave).
 * Problema que resuelve: el encargado necesita saber en segundos cómo está el piso
 * (labs disponibles, reservas, clases, PCs, ocupación) sin leer tablas. Cada tarjeta muestra
 * UN número grande, qué mide y un dato de contexto que lo explica («1 en mantenimiento»).
 * El orden del HTML es etiqueta → valor → detalle, así el lector de pantalla lo lee con sentido.
 */
const ICONOS = {
  laboratorio: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  reserva: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4" />
    </>
  ),
  clase: <path d="M3 8.5 12 4l9 4.5-9 4.5zM7 10.5v4.5c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" />,
  pc: (
    <>
      <rect x="4" y="3" width="16" height="11" rx="1.5" />
      <path d="M2 20h20M7 17h10" />
    </>
  ),
  ocupacion: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5V12l6 6" />
    </>
  ),
};

export default function TarjetaKPI({ etiqueta, valor, detalle, icono }) {
  return (
    <li className="tarjeta kpi">
      {icono && (
        <span className="kpi-icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            {ICONOS[icono]}
          </svg>
        </span>
      )}
      <p className="kpi-etiqueta">{etiqueta}</p>
      <p className="kpi-valor">{valor}</p>
      {detalle && <p className="kpi-detalle">{detalle}</p>}
    </li>
  );
}
