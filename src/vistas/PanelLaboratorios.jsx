/*
 * Patrón: FORMULARIO CRUD (vista de laboratorios del panel).
 * Problema que resuelve: crear, consultar, modificar y eliminar laboratorios desde la app.
 * La tabla lista los labs con ACCIONES POR FILA (Editar / Eliminar) y el botón «Nuevo
 * laboratorio» abre el mismo formulario vacío (LaboratorioForm.jsx) en una VENTANA MODAL.
 * Eliminar pide confirmación; si el servidor lo rechaza (409: el lab tiene clases o reservas),
 * su mensaje se muestra en un toast de error. Sin servidor todo queda en solo lectura.
 */
import { useState } from 'react';
import AccionesFila from '../components/AccionesFila.jsx';
import { AvisoSoloLectura } from '../components/AvisoConexion.jsx';
import LaboratorioForm from '../components/LaboratorioForm.jsx';
import { EstadoBadge } from '../components/LabCard.jsx';
import Modal from '../components/Modal.jsx';
import Skeleton from '../components/Skeleton.jsx';
import TablaPaginada from '../components/TablaPaginada.jsx';

function plural(cantidad, singular, pluralTexto) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

export default function PanelLaboratorios({
  refTitulo,
  cargando,
  laboratorios,
  clases,
  reservas,
  soloLectura,
  onGuardarLaboratorio,
  onEliminarLaboratorio,
}) {
  // edicion: null (cerrado) | { laboratorio: null } (nuevo) | { laboratorio } (editar)
  const [edicion, setEdicion] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const filas = laboratorios.map((lab) => ({
    ...lab,
    id: lab.codigo,
    clases: clases.filter((c) => c.lab === lab.codigo).length,
    reservas: reservas.filter((r) => r.lab === lab.codigo).length,
  }));

  const guardar = async (valores) => {
    setGuardando(true);
    const resultado = await onGuardarLaboratorio(valores, edicion?.laboratorio?.codigo ?? null);
    setGuardando(false);
    if (resultado.ok) setEdicion(null);
    return resultado;
  };

  const confirmarEliminacion = async () => {
    setEliminando(true);
    await onEliminarLaboratorio(aEliminar.codigo);
    setEliminando(false);
    setAEliminar(null);
  };

  const columnas = [
    { clave: 'codigo', titulo: 'Código', render: (lab) => <strong className="nowrap">Lab {lab.codigo}</strong> },
    { clave: 'capacidad', titulo: 'Capacidad', render: (lab) => <span className="nowrap">{lab.capacidad} PCs</span> },
    { clave: 'estado', titulo: 'Estado', render: (lab) => <EstadoBadge estado={lab.estado} /> },
    { clave: 'software', titulo: 'Software', render: (lab) => <span className="nowrap">{plural(lab.software.length, 'programa', 'programas')}</span> },
    { clave: 'clases', titulo: 'Clases', render: (lab) => <span className="nowrap">{plural(lab.clases, 'clase', 'clases')}</span> },
    { clave: 'reservas', titulo: 'Reservas', render: (lab) => <span className="nowrap">{plural(lab.reservas, 'reserva', 'reservas')}</span> },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (lab) => (
        <AccionesFila
          acciones={[
            {
              etiqueta: 'Editar',
              descripcion: `Editar el laboratorio ${lab.codigo}`,
              deshabilitada: soloLectura,
              onClick: () => setEdicion({ laboratorio: lab }),
            },
            {
              etiqueta: 'Eliminar',
              descripcion: `Eliminar el laboratorio ${lab.codigo}`,
              peligro: true,
              deshabilitada: soloLectura,
              onClick: () => setAEliminar(lab),
            },
          ]}
        />
      ),
    },
  ];

  const esNuevo = edicion !== null && edicion.laboratorio === null;

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Laboratorios
          </h1>
          <p className="titulo-sub">Alta, edición y baja de los laboratorios del piso.</p>
        </div>
        <button
          type="button"
          className="boton boton-primario"
          onClick={() => setEdicion({ laboratorio: null })}
          disabled={soloLectura || cargando}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo laboratorio
        </button>
      </div>

      {soloLectura && !cargando && <AvisoSoloLectura />}

      {cargando ? (
        <Skeleton variante="lineas" cantidad={6} texto="Cargando laboratorios…" />
      ) : (
        <TablaPaginada titulo="Laboratorios del piso" columnas={columnas} filas={filas} porPagina={8} />
      )}

      <Modal
        abierto={edicion !== null}
        titulo={esNuevo ? 'Nuevo laboratorio' : `Editar el Lab ${edicion?.laboratorio?.codigo ?? ''}`}
        sinAcciones
        ancho="amplio"
        ocupado={guardando}
        onCerrar={() => setEdicion(null)}
        refFocoRespaldo={refTitulo}
      >
        {edicion && (
          <LaboratorioForm
            laboratorio={edicion.laboratorio}
            codigosExistentes={laboratorios.map((lab) => lab.codigo)}
            guardando={guardando}
            onGuardar={guardar}
            onDescartar={() => setEdicion(null)}
          />
        )}
      </Modal>

      <Modal
        abierto={aEliminar !== null}
        titulo={aEliminar ? `¿Eliminar el Lab ${aEliminar.codigo}?` : ''}
        textoVolver="Volver"
        textoConfirmar="Eliminar laboratorio"
        textoOcupado="Eliminando…"
        ocupado={eliminando}
        onConfirmar={confirmarEliminacion}
        onCerrar={() => setAEliminar(null)}
        refFocoRespaldo={refTitulo}
      >
        {aEliminar && (
          <p>
            Se borrarán el laboratorio {aEliminar.codigo} y su lista de software. Solo se puede eliminar un laboratorio sin
            clases ni reservas. Esta acción no se puede deshacer.
          </p>
        )}
      </Modal>
    </>
  );
}
