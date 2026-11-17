/*
 * Patrón: TABLA DE DATOS + ACCIONES POR FILA.
 * Problema que resuelve: el encargado necesita ver TODAS las reservas a la vez, ordenadas por
 * fecha y con las mismas columnas (Lab, Fecha, Horario, Tipo, Motivo), para compararlas y
 * actuar sobre una sin buscarla. La tabla usa encabezados reales (th scope="col"), un caption
 * para lectores de pantalla, se desplaza dentro de su propio marco en pantallas angostas y se
 * divide en páginas de 5 filas (TablaPaginada.jsx).
 * En la última columna, «Ver» abre una ventana modal informativa con un solo botón («Cerrar»)
 * y «Cancelar» abre la confirmación de siempre. Cada botón tiene un aria-label con su fila.
 */
import { useState } from 'react';
import AccionesFila from '../components/AccionesFila.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import Skeleton from '../components/Skeleton.jsx';
import TablaPaginada from '../components/TablaPaginada.jsx';
import { TIPOS_RESERVA, formatearFecha, formatearFechaCorta } from '../data.js';
import { formatearHoras, horas } from '../estadisticas.js';

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function etiquetaTipo(valor) {
  return TIPOS_RESERVA.find((tipo) => tipo.valor === valor)?.etiqueta ?? valor;
}

export default function PanelReservas({ refTitulo, cargando, reservas, onPedirCancelacion }) {
  const [reservaVista, setReservaVista] = useState(null);
  const ordenadas = [...reservas].sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`));

  const columnas = [
    { clave: 'lab', titulo: 'Lab', render: (r) => <strong className="nowrap">{r.lab}</strong> },
    { clave: 'fecha', titulo: 'Fecha', render: (r) => <span className="nowrap">{capitalizar(formatearFechaCorta(r.fecha))}</span> },
    { clave: 'horario', titulo: 'Horario', render: (r) => <span className="nowrap">{r.horaInicio}–{r.horaFin}</span> },
    { clave: 'tipo', titulo: 'Tipo', render: (r) => <span className="badge badge-tipo">{etiquetaTipo(r.tipo)}</span> },
    { clave: 'motivo', titulo: 'Motivo', render: (r) => <span className="celda-motivo">{r.motivo}</span> },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (r) => {
        const contexto = `la reserva del Lab ${r.lab} del ${formatearFecha(r.fecha)}, de ${r.horaInicio} a ${r.horaFin}`;
        return (
          <AccionesFila
            acciones={[
              { etiqueta: 'Ver', descripcion: `Ver ${contexto}`, onClick: () => setReservaVista(r) },
              { etiqueta: 'Cancelar', descripcion: `Cancelar ${contexto}`, peligro: true, onClick: () => onPedirCancelacion(r) },
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Reservas
          </h1>
          <p className="titulo-sub">
            {cargando
              ? 'Cargando reservas…'
              : `${ordenadas.length} ${ordenadas.length === 1 ? 'reserva registrada' : 'reservas registradas'}, ordenadas por fecha.`}
          </p>
        </div>
      </div>

      {cargando && <Skeleton variante="lineas" cantidad={5} texto="Cargando reservas…" />}

      {!cargando && ordenadas.length === 0 && (
        <EmptyState
          icono="calendario"
          titulo="No hay reservas registradas"
          mensaje="Cuando un estudiante reserve un laboratorio, su reserva aparecerá en esta tabla."
          accion={{ etiqueta: 'Ver laboratorios', href: '#/laboratorios' }}
        />
      )}

      {!cargando && ordenadas.length > 0 && (
        <TablaPaginada titulo="Reservas registradas" columnas={columnas} filas={ordenadas} />
      )}

      <Modal
        abierto={reservaVista !== null}
        titulo={reservaVista ? `Reserva del Lab ${reservaVista.lab}` : ''}
        textoVolver="Cerrar"
        onCerrar={() => setReservaVista(null)}
        refFocoRespaldo={refTitulo}
      >
        {reservaVista && (
          <dl className="lista-datos lista-datos-modal">
            <div>
              <dt>Fecha</dt>
              <dd>{capitalizar(formatearFecha(reservaVista.fecha))}</dd>
            </div>
            <div>
              <dt>Horario</dt>
              <dd>
                {reservaVista.horaInicio}–{reservaVista.horaFin} ({formatearHoras(horas(reservaVista.horaInicio, reservaVista.horaFin))})
              </dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{etiquetaTipo(reservaVista.tipo)}</dd>
            </div>
            <div>
              <dt>Motivo</dt>
              <dd>{reservaVista.motivo}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  );
}
