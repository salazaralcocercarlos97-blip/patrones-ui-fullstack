/*
 * Patrón: PANEL DE CONTROL (Dashboard).
 * Problema que resuelve: el encargado necesita una sola pantalla que le diga cómo está el piso
 * hoy, sin abrir cada laboratorio. Arriba, las TARJETAS KPI con los cinco números clave;
 * debajo, las BARRAS DE PROGRESO con la ocupación semanal de cada lab y, al lado, las próximas
 * reservas con un enlace a la tabla completa. Todo se calcula con los datos ya cargados y con
 * el horario de la configuración vigente (src/estadisticas.js).
 */
import BarraProgreso from '../components/BarraProgreso.jsx';
import { EstadoBadge } from '../components/LabCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import TarjetaKPI from '../components/TarjetaKPI.jsx';
import { TIPOS_RESERVA, formatearFecha, formatearFechaCorta, hoyISO } from '../data.js';
import { formatearHoras, horas, ocupacionPorLaboratorio, promedio, reservasProximos7Dias } from '../estadisticas.js';

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function PanelControl({ refTitulo, cargando, laboratorios, clases, reservas, configuracion }) {
  const disponibles = laboratorios.filter((lab) => lab.estado === 'DISPONIBLE').length;
  const enMantenimiento = laboratorios.length - disponibles;
  const totalPCs = laboratorios.reduce((suma, lab) => suma + lab.capacidad, 0);
  const horasClase = clases.reduce((suma, c) => suma + horas(c.inicio, c.fin), 0);
  const ocupacion = ocupacionPorLaboratorio({ laboratorios, clases, reservas, configuracion });
  const ocupacionPromedio = promedio(ocupacion.map((fila) => fila.porcentaje));
  const horasSemana = ocupacion[0]?.disponibles ?? 0;
  const proximas = [...reservas]
    .filter((r) => r.fecha >= hoyISO())
    .sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`));
  const enSieteDias = reservasProximos7Dias(reservas).length;

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Panel de control
          </h1>
          <p className="titulo-sub">Estado del piso al {formatearFecha(hoyISO())}.</p>
        </div>
      </div>

      {cargando ? (
        <Skeleton variante="datos" cantidad={5} texto="Cargando el panel…" />
      ) : (
        <>
          <section aria-label="Indicadores clave">
            <ul className="grilla grilla-kpi">
              <TarjetaKPI
                icono="laboratorio"
                etiqueta="Laboratorios disponibles"
                valor={`${disponibles} de ${laboratorios.length}`}
                detalle={enMantenimiento === 0 ? 'Ninguno en mantenimiento' : `${enMantenimiento} en mantenimiento`}
              />
              <TarjetaKPI
                icono="reserva"
                etiqueta="Reservas registradas"
                valor={reservas.length}
                detalle={`${enSieteDias} en los próximos 7 días`}
              />
              <TarjetaKPI icono="clase" etiqueta="Clases por semana" valor={clases.length} detalle={`${formatearHoras(horasClase)} de clase`} />
              <TarjetaKPI icono="pc" etiqueta="PCs totales" valor={totalPCs} detalle={`En ${laboratorios.length} laboratorios`} />
              <TarjetaKPI
                icono="ocupacion"
                etiqueta="Ocupación promedio"
                valor={`${ocupacionPromedio} %`}
                detalle={`De ${formatearHoras(horasSemana)} de atención por lab`}
              />
            </ul>
          </section>

          <div className="panel-columnas">
            <section className="tarjeta panel-bloque" aria-labelledby="titulo-ocupacion">
              <h2 id="titulo-ocupacion" className="panel-bloque-titulo">
                Ocupación semanal por laboratorio
              </h2>
              <p className="panel-bloque-texto">
                Horas de clase más horas reservadas en los próximos 7 días, sobre {formatearHoras(horasSemana)} de atención
                (lunes a sábado, {configuracion.horaApertura} a {configuracion.horaCierre}).
              </p>
              <div className="lista-barras">
                {ocupacion.map((fila) => (
                  <BarraProgreso
                    key={fila.codigo}
                    etiqueta={`Lab ${fila.codigo}`}
                    valor={fila.porcentaje}
                    insignia={fila.estado === 'MANTENIMIENTO' ? <EstadoBadge estado={fila.estado} /> : null}
                    textoValor={`${formatearHoras(fila.ocupadas)} de ${formatearHoras(fila.disponibles)}`}
                    detalle={`${formatearHoras(fila.horasClase)} de clase + ${formatearHoras(fila.horasReserva)} reservadas · ${formatearHoras(fila.ocupadas)} de ${formatearHoras(fila.disponibles)}`}
                  />
                ))}
              </div>
            </section>

            <section className="tarjeta panel-bloque" aria-labelledby="titulo-proximas">
              <h2 id="titulo-proximas" className="panel-bloque-titulo">
                Próximas reservas
              </h2>
              {proximas.length === 0 ? (
                <p className="panel-bloque-texto">No hay reservas próximas.</p>
              ) : (
                <ul className="lista-proximas">
                  {proximas.slice(0, 4).map((reserva) => (
                    <li key={reserva.id}>
                      <p className="proxima-cabecera">
                        <strong>Lab {reserva.lab}</strong>
                        <span className="badge badge-tipo">{TIPOS_RESERVA.find((t) => t.valor === reserva.tipo)?.etiqueta ?? reserva.tipo}</span>
                      </p>
                      <p className="proxima-fecha">
                        {capitalizar(formatearFechaCorta(reserva.fecha))} · {reserva.horaInicio}–{reserva.horaFin}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <a className="enlace-flecha" href="#/panel/reservas">
                Ver todas las reservas<span aria-hidden="true"> →</span>
              </a>
            </section>
          </div>
        </>
      )}
    </>
  );
}
