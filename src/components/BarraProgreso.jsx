/*
 * Patrón: BARRAS DE PROGRESO.
 * Problema que resuelve: comparar de un vistazo qué tan ocupado está cada laboratorio en la
 * semana. Una barra por lab, con su nombre y el porcentaje escritos (no depende solo del
 * largo ni del color) y el detalle en horas debajo. Las barras de más del 75 % cambian de tono
 * y dicen «Alta» para avisar que ese lab casi no tiene horas libres.
 * Accesible: role="progressbar" con aria-valuenow/aria-valuemin/aria-valuemax, nombre por
 * aria-labelledby y aria-valuetext con el valor en palabras («38 %, 36 h de 94,5 h»).
 */
import { useId } from 'react';

export const UMBRAL_ALTO = 75;

export default function BarraProgreso({ etiqueta, valor, maximo = 100, detalle, textoValor, insignia }) {
  const idEtiqueta = useId();
  const porcentaje = maximo > 0 ? Math.round((Math.min(valor, maximo) / maximo) * 100) : 0;
  const alto = porcentaje > UMBRAL_ALTO;

  return (
    <div className={`barra${alto ? ' barra-alta' : ''}`}>
      <div className="barra-cabecera">
        <span id={idEtiqueta} className="barra-etiqueta">
          {etiqueta}
        </span>
        {insignia}
        <span className="barra-valor">
          {porcentaje} %{alto && <span className="barra-alerta"> · Alta</span>}
        </span>
      </div>
      <div
        className="barra-pista"
        role="progressbar"
        aria-labelledby={idEtiqueta}
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={textoValor ? `${porcentaje} %, ${textoValor}` : `${porcentaje} %`}
      >
        <span className="barra-relleno" style={{ width: `${porcentaje}%` }} />
      </div>
      {detalle && <p className="barra-detalle">{detalle}</p>}
    </div>
  );
}
