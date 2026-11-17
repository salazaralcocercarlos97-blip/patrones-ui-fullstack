/*
 * Patrón: REPORTES (Reporting).
 * Problema que resuelve: para planificar el semestre el encargado necesita respuestas resumidas
 * («¿qué tipo de reserva se pide más?», «¿qué lab se reserva más?», «¿qué día está más lleno?»)
 * y no una lista de registros. Dos gráficos de barras horizontales accesibles (GraficoBarras.jsx)
 * y una tabla de ocupación por día de la semana con su fila de totales. Todo se calcula en el
 * navegador con los datos cargados (src/estadisticas.js) y se indica cuándo se generó.
 */
import GraficoBarras from '../components/GraficoBarras.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { formatearHoras, ocupacionPorDia, reservasPorLaboratorio, reservasPorTipo } from '../estadisticas.js';

const formatoDia = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'long' });
const formatoHora = new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export default function PanelReportes({ refTitulo, cargando, laboratorios, clases, reservas, configuracion }) {
  const momento = new Date();
  const porTipo = reservasPorTipo(reservas);
  const porLab = reservasPorLaboratorio(reservas, laboratorios);
  const porDia = ocupacionPorDia({ laboratorios, clases, reservas, configuracion });
  const totales = porDia.reduce(
    (suma, fila) => ({
      clases: suma.clases + fila.clases,
      horasClase: suma.horasClase + fila.horasClase,
      reservas: suma.reservas + fila.reservas,
      horasReserva: suma.horasReserva + fila.horasReserva,
      disponibles: suma.disponibles + fila.disponibles,
    }),
    { clases: 0, horasClase: 0, reservas: 0, horasReserva: 0, disponibles: 0 },
  );
  const porcentajeTotal =
    totales.disponibles > 0 ? Math.round(((totales.horasClase + totales.horasReserva) / totales.disponibles) * 100) : 0;
  const diaMasOcupado = porDia.reduce((mayor, fila) => (fila.porcentaje > mayor.porcentaje ? fila : mayor), porDia[0]);

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Reportes
          </h1>
          <p className="titulo-sub">
            Calculados con los datos cargados el {formatoDia.format(momento)} a las {formatoHora.format(momento)}.
          </p>
        </div>
      </div>

      {cargando ? (
        <Skeleton variante="lineas" cantidad={6} texto="Cargando reportes…" />
      ) : (
        <>
          <div className="grilla grilla-graficos">
            <GraficoBarras
              titulo="Reservas por tipo"
              descripcion="Todas las reservas registradas."
              datos={porTipo}
            />
            <GraficoBarras
              titulo="Reservas por laboratorio"
              descripcion="Todas las reservas registradas."
              datos={porLab}
            />
          </div>

          <section className="seccion" aria-labelledby="titulo-por-dia">
            <h2 id="titulo-por-dia" className="subtitulo">
              Ocupación por día de la semana
            </h2>
            <p className="seccion-intro">
              Clases más reservas de los próximos 7 días en los {laboratorios.length} laboratorios, sobre{' '}
              {formatearHoras(porDia[0]?.disponibles ?? 0)} de atención por día. El día más ocupado es el{' '}
              <strong>{diaMasOcupado?.nombre.toLowerCase()}</strong> ({diaMasOcupado?.porcentaje} %).
            </p>
            <div className="tabla-contenedor" role="region" aria-labelledby="titulo-por-dia" tabIndex={0}>
              <table className="tabla tabla-reporte">
                <caption className="solo-lectores">Ocupación por día de la semana, de lunes a sábado, con totales</caption>
                <thead>
                  <tr>
                    <th scope="col">Día</th>
                    <th scope="col" className="numero">Clases</th>
                    <th scope="col" className="numero">Horas de clase</th>
                    <th scope="col" className="numero">Reservas</th>
                    <th scope="col" className="numero">Horas reservadas</th>
                    <th scope="col">Ocupación</th>
                  </tr>
                </thead>
                <tbody>
                  {porDia.map((fila) => (
                    <tr key={fila.dia}>
                      <th scope="row">{fila.nombre}</th>
                      <td className="numero">{fila.clases}</td>
                      <td className="numero">{formatearHoras(fila.horasClase)}</td>
                      <td className="numero">{fila.reservas}</td>
                      <td className="numero">{formatearHoras(fila.horasReserva)}</td>
                      <td>
                        <span className="celda-ocupacion">
                          <span className="celda-ocupacion-pista" aria-hidden="true">
                            <span style={{ width: `${fila.porcentaje}%` }} />
                          </span>
                          {fila.porcentaje} %
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Semana</th>
                    <td className="numero">{totales.clases}</td>
                    <td className="numero">{formatearHoras(totales.horasClase)}</td>
                    <td className="numero">{totales.reservas}</td>
                    <td className="numero">{formatearHoras(totales.horasReserva)}</td>
                    <td>{porcentajeTotal} %</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
