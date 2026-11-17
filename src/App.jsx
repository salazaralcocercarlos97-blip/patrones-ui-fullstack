/*
 * App: une los 21 patrones UI del informe (6 categorías) y los demás patrones de la demo.
 * Versión con backend (Express + SQLite).
 * - Al iniciar pide laboratorios, clases, reservas y configuración a la API (src/api.js).
 *   Mientras tanto se ve el skeleton (mínimo 1 s, para que se note en la demo).
 * - MODO DE RESPALDO: si el servidor no responde, usa los datos de src/data.js y guarda
 *   las reservas en localStorage (dentro de try/catch). Un aviso lo explica y ofrece «Reintentar».
 *   En ese modo, el CRUD de laboratorios y la configuración del panel quedan en solo lectura.
 * - Navegación por hash (#/laboratorios/236-43, #/panel/reportes) para que funcionen
 *   Atrás/Adelante del navegador.
 * - Al cambiar de página, el foco va al título (h1) para que el lector de pantalla lo anuncie.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Breadcrumbs from './components/Breadcrumbs.jsx';
import Tabs from './components/Tabs.jsx';
import LabCard, { EstadoBadge } from './components/LabCard.jsx';
import Modal from './components/Modal.jsx';
import Toast from './components/Toast.jsx';
import ReservaForm from './components/ReservaForm.jsx';
import TablaPaginada from './components/TablaPaginada.jsx';
import EmptyState from './components/EmptyState.jsx';
import Skeleton from './components/Skeleton.jsx';
import Accordion from './components/Accordion.jsx';
import AvisoConexion from './components/AvisoConexion.jsx';
import Carrusel from './components/Carrusel.jsx';
import Filtros, { FILTROS_INICIALES, OPCIONES_CAPACIDAD, OPCIONES_ESTADO, cumpleFiltros, hayFiltrosActivos } from './components/Filtros.jsx';
import BotonConCarga from './components/IndicadorCarga.jsx';
import { SECCIONES_PANEL } from './components/MenuLateral.jsx';
import PanelEncargado from './vistas/PanelEncargado.jsx';
import {
  actualizarLaboratorio,
  cancelarReserva,
  crearLaboratorio,
  crearReserva,
  eliminarLaboratorio,
  guardarConfiguracion,
  obtenerDatos,
} from './api.js';
import {
  CONFIGURACION_POR_DEFECTO,
  DIAS,
  SEMESTRE,
  TIPOS_RESERVA,
  clases as clasesLocales,
  crearPreguntasFrecuentes,
  formatearFecha,
  laboratorios as laboratoriosLocales,
  reservasDeEjemplo,
} from './data.js';
import { normalizarConfiguracion, normalizarLaboratorio } from './reglasPanel.js';

const CLAVE_TEMA = 'patrones-ui:tema';
const CLAVE_RESERVAS = 'patrones-ui:reservas';
const PESTANAS = ['info', 'horario', 'reservar'];
const CARGA_MINIMA_MS = 1000;

// ---------- Utilidades ----------

function leerRuta() {
  const partes = window.location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((parte) => decodeURIComponent(parte));
  if (partes.length === 0) return { vista: 'inicio' };
  if (partes[0] === 'laboratorios') {
    if (!partes[1]) return { vista: 'laboratorios' };
    return { vista: 'lab', codigo: partes[1], pestana: PESTANAS.includes(partes[2]) ? partes[2] : 'info' };
  }
  if (partes[0] === 'reservas') return { vista: 'reservas' };
  if (partes[0] === 'ayuda') return { vista: 'ayuda' };
  if (partes[0] === 'panel') {
    const seccion = partes[1] ?? 'inicio';
    if (SECCIONES_PANEL.some((item) => item.id === seccion)) return { vista: 'panel', seccion };
  }
  return { vista: 'no-encontrada' };
}

function claveDeRuta(ruta) {
  return [ruta.vista, ruta.codigo, ruta.pestana, ruta.seccion].filter(Boolean).join('/');
}

// Minúsculas y sin tildes, para que «programacion» encuentre «Programación».
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function leerAlmacen(clave) {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardarAlmacen(clave, valor) {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Almacenamiento bloqueado (modo privado, permisos): se sigue solo en memoria.
  }
}

function cargarReservasLocales() {
  const texto = leerAlmacen(CLAVE_RESERVAS);
  if (texto === null) return reservasDeEjemplo();
  try {
    const datos = JSON.parse(texto);
    return Array.isArray(datos) ? datos : reservasDeEjemplo();
  } catch {
    return reservasDeEjemplo();
  }
}

function ordenarClases(a, b) {
  return a.dia - b.dia || a.inicio.localeCompare(b.inicio);
}

function minutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function plural(cantidad, singular, pluralTexto) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

function etiquetaTipo(valor) {
  return TIPOS_RESERVA.find((tipo) => tipo.valor === valor)?.etiqueta ?? valor;
}

const COLUMNAS_HORARIO = [
  { clave: 'dia', titulo: 'Día', render: (c) => DIAS[c.dia] },
  { clave: 'hora', titulo: 'Horario', render: (c) => <span className="nowrap">{c.inicio}–{c.fin}</span> },
  { clave: 'sigla', titulo: 'Sigla', render: (c) => <strong>{c.sigla}</strong> },
  { clave: 'materia', titulo: 'Materia' },
  { clave: 'grupo', titulo: 'Grupo' },
  { clave: 'docente', titulo: 'Docente' },
];

const COLUMNAS_BUSQUEDA = [
  { clave: 'sigla', titulo: 'Sigla', render: (c) => <strong>{c.sigla}</strong> },
  { clave: 'materia', titulo: 'Materia' },
  { clave: 'grupo', titulo: 'Grupo' },
  { clave: 'docente', titulo: 'Docente' },
  {
    clave: 'lab',
    titulo: 'Laboratorio',
    render: (c) => (
      <a className="nowrap" href={`#/laboratorios/${c.lab}/horario`}>
        {c.lab}
      </a>
    ),
  },
  {
    clave: 'cuando',
    titulo: 'Día y hora',
    render: (c) => (
      <span className="nowrap">
        {DIAS[c.dia].slice(0, 3)} {c.inicio}–{c.fin}
      </span>
    ),
  },
];

// ---------- Vistas ----------

// Diapositivas del carrusel de Inicio, armadas con los datos reales del sistema.
function crearDiapositivas(laboratorios, configuracion) {
  const { horaApertura, horaCierre, duracionMaximaHoras, anticipacionMaximaDias } = configuracion;
  const enMantenimiento = laboratorios.filter((lab) => lab.estado === 'MANTENIMIENTO');

  let mantenimiento;
  if (enMantenimiento.length === 1) {
    const [lab] = enMantenimiento;
    mantenimiento = {
      id: 'mantenimiento',
      icono: 'herramienta',
      etiqueta: 'Aviso',
      titulo: `Lab ${lab.codigo} en mantenimiento`,
      texto: `${lab.motivoMantenimiento ? `${lab.motivoMantenimiento} ` : ''}Mientras tanto no recibe reservas: elige otro laboratorio del piso.`,
      accion: { etiqueta: `Ver el Lab ${lab.codigo}`, href: `#/laboratorios/${lab.codigo}` },
    };
  } else if (enMantenimiento.length > 1) {
    mantenimiento = {
      id: 'mantenimiento',
      icono: 'herramienta',
      etiqueta: 'Aviso',
      titulo: `${enMantenimiento.length} laboratorios en mantenimiento`,
      texto: `Los labs ${enMantenimiento.map((lab) => lab.codigo).join(', ')} no reciben reservas por ahora. Elige otro laboratorio del piso.`,
      accion: { etiqueta: 'Ver laboratorios', href: '#/laboratorios' },
    };
  } else {
    mantenimiento = {
      id: 'mantenimiento',
      icono: 'herramienta',
      etiqueta: 'Estado del piso',
      titulo: `Los ${laboratorios.length} laboratorios están disponibles`,
      texto: 'Ningún laboratorio está en mantenimiento: todos reciben reservas.',
      accion: { etiqueta: 'Ver laboratorios', href: '#/laboratorios' },
    };
  }

  // Programas ordenados por cuántos laboratorios los tienen.
  const conteo = new Map();
  laboratorios.forEach((lab) => lab.software.forEach((nombre) => conteo.set(nombre, (conteo.get(nombre) || 0) + 1)));
  const programas = [...conteo.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
  const [primero] = programas;
  const otros = programas.slice(1, 4).map(([nombre]) => nombre);
  const textoSoftware =
    primero && primero[1] === laboratorios.length && otros.length > 0
      ? `${primero[0]} está en los ${laboratorios.length} laboratorios; también hay ${otros.join(', ')} y más. Revisa la pestaña Información de cada lab antes de reservar.`
      : `Entre ellos, ${programas
          .slice(0, 4)
          .map(([nombre]) => nombre)
          .join(', ')}. Revisa la pestaña Información de cada lab antes de reservar.`;

  return [
    {
      id: 'reservas',
      icono: 'calendario',
      etiqueta: `Semestre ${SEMESTRE}`,
      titulo: `Reserva tu laboratorio para el semestre ${SEMESTRE}`,
      texto:
        'Exámenes, prácticas, recuperatorios y eventos: elige un laboratorio disponible, revisa su horario y regístralo en un minuto.',
      accion: { etiqueta: 'Ver laboratorios', href: '#/laboratorios' },
    },
    mantenimiento,
    {
      id: 'horario',
      icono: 'reloj',
      etiqueta: 'Horario de atención',
      titulo: `Lunes a sábado, de ${horaApertura} a ${horaCierre}`,
      texto: `Cada reserva puede durar hasta ${duracionMaximaHoras} h y se registra con hasta ${anticipacionMaximaDias} ${Number(anticipacionMaximaDias) === 1 ? 'día' : 'días'} de anticipación. Los domingos los laboratorios están cerrados.`,
      accion: { etiqueta: 'Ver preguntas frecuentes', href: '#/ayuda' },
    },
    {
      id: 'software',
      icono: 'monitor',
      etiqueta: 'Software disponible',
      titulo: `${programas.length} programas instalados en el piso`,
      texto: textoSoftware,
      accion: { etiqueta: 'Comparar laboratorios', href: '#/laboratorios' },
    },
  ];
}

function VistaInicio({ refTitulo, cargando, laboratorios, clases, totalReservas, configuracion }) {
  const disponibles = laboratorios.filter((lab) => lab.estado === 'DISPONIBLE').length;
  const totalPCs = laboratorios.reduce((suma, lab) => suma + lab.capacidad, 0);

  return (
    <>
      <section className="portada">
        <p className="portada-etiqueta">FICCT · UAGRM · Semestre {SEMESTRE}</p>
        <h1 ref={refTitulo} tabIndex={-1}>
          Laboratorios del 4to piso
        </h1>
        <p className="portada-texto">
          Consulta los laboratorios de computación del módulo 236, revisa sus horarios y reserva un espacio para tu
          examen, práctica o evento.
        </p>
        <div className="acciones">
          <a className="boton boton-primario" href="#/laboratorios">
            Ver laboratorios
          </a>
          <a className="boton boton-secundario" href="#/reservas">
            Mis reservas
          </a>
        </div>
      </section>

      {cargando ? (
        <Skeleton variante="carrusel" texto="Cargando destacados…" />
      ) : (
        <Carrusel etiqueta="Destacados" diapositivas={crearDiapositivas(laboratorios, configuracion)} />
      )}

      <section className="seccion" aria-label="Resumen">
        {cargando ? (
          <Skeleton variante="datos" cantidad={4} texto="Cargando resumen…" />
        ) : (
          <ul className="grilla grilla-datos">
            <li className="tarjeta dato">
              <span className="dato-valor">
                {disponibles} de {laboratorios.length}
              </span>
              <span className="dato-etiqueta">laboratorios disponibles</span>
            </li>
            <li className="tarjeta dato">
              <span className="dato-valor">{totalPCs}</span>
              <span className="dato-etiqueta">computadoras de estudiante</span>
            </li>
            <li className="tarjeta dato">
              <span className="dato-valor">{clases.length}</span>
              <span className="dato-etiqueta">clases por semana</span>
            </li>
            <li className="tarjeta dato">
              <span className="dato-valor">{totalReservas}</span>
              <span className="dato-etiqueta">{totalReservas === 1 ? 'reserva registrada' : 'reservas registradas'}</span>
            </li>
          </ul>
        )}
      </section>
    </>
  );
}

// Texto de los filtros elegidos, para el estado vacío («estado «Mantenimiento» y capacidad de 44 PCs o más»).
function describirFiltros(filtros) {
  const partes = [];
  if (filtros.estado !== FILTROS_INICIALES.estado)
    partes.push(`estado «${OPCIONES_ESTADO.find((o) => o.valor === filtros.estado)?.etiqueta}»`);
  if (filtros.capacidadMinima !== FILTROS_INICIALES.capacidadMinima)
    partes.push(`capacidad de ${OPCIONES_CAPACIDAD.find((o) => o.valor === filtros.capacidadMinima)?.etiqueta}`);
  return partes.join(' y ');
}

function VistaLaboratorios({
  refTitulo,
  cargando,
  onRecargar,
  busqueda,
  labsEncontrados,
  clasesEncontradas,
  totalLabs,
  totalClasesPorLab,
  filtros,
  onCambiarFiltros,
  onLimpiarFiltros,
  onLimpiar,
}) {
  const termino = busqueda.trim();
  const hayBusqueda = termino !== '';
  const filtrando = hayFiltrosActivos(filtros);
  const sinResultados = labsEncontrados.length === 0 && clasesEncontradas.length === 0;
  const conFiltros = filtrando ? ', con los filtros elegidos' : '';

  // Cantidad de resultados, anunciada en una región role="status" (patrones Búsqueda y Filtrado).
  let resumen = '';
  if (!cargando) {
    if (hayBusqueda) {
      resumen = sinResultados
        ? `Sin resultados para «${termino}»${conFiltros}.`
        : `${plural(labsEncontrados.length, 'laboratorio', 'laboratorios')} y ${plural(clasesEncontradas.length, 'clase', 'clases')} para «${termino}»${conFiltros}.`;
    } else {
      resumen = `Mostrando ${labsEncontrados.length} de ${plural(totalLabs, 'laboratorio', 'laboratorios')}.`;
    }
  }

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Laboratorios
          </h1>
          <p className="titulo-sub">Laboratorios de computación del 4to piso, módulo 236.</p>
        </div>
        <BotonConCarga
          className="boton boton-secundario"
          cargando={cargando}
          textoCargando="Cargando…"
          onClick={onRecargar}
          texto={
            <>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
              </svg>
              Recargar
            </>
          }
        />
      </div>

      <Filtros filtros={filtros} onCambiar={onCambiarFiltros} onLimpiar={onLimpiarFiltros} />

      <p className="resultado-resumen" role="status">
        {resumen}
      </p>

      {cargando && <Skeleton variante="tarjetas" cantidad={6} texto="Cargando laboratorios…" />}

      {!cargando && sinResultados && hayBusqueda && !filtrando && (
        <EmptyState
          icono="busqueda"
          titulo={`No encontramos nada para «${termino}»`}
          mensaje="Prueba con el código de un laboratorio (236-43), la sigla de una materia (INF120) o el apellido de un docente."
          accion={{ etiqueta: 'Limpiar búsqueda', onClick: onLimpiar }}
        />
      )}

      {!cargando && sinResultados && filtrando && (
        <EmptyState
          icono="busqueda"
          titulo="Ningún laboratorio cumple los filtros"
          mensaje={`No hay laboratorios con ${describirFiltros(filtros)}${hayBusqueda ? ` para «${termino}»` : ''}. Prueba con otro estado o una capacidad menor.`}
          accion={{ etiqueta: 'Limpiar filtros', onClick: onLimpiarFiltros }}
        />
      )}

      {!cargando && !sinResultados && (
        <>
          {hayBusqueda && labsEncontrados.length > 0 && (
            <h2 className="subtitulo">Laboratorios ({labsEncontrados.length})</h2>
          )}
          {labsEncontrados.length > 0 && (
            <div className="grilla grilla-tarjetas">
              {labsEncontrados.map((lab) => (
                <LabCard
                  key={lab.codigo}
                  laboratorio={lab}
                  totalClases={totalClasesPorLab[lab.codigo] || 0}
                  coincidencias={hayBusqueda ? clasesEncontradas.filter((c) => c.lab === lab.codigo).length : 0}
                />
              ))}
            </div>
          )}
          {hayBusqueda && clasesEncontradas.length > 0 && (
            <section className="seccion" aria-labelledby="titulo-materias">
              <h2 id="titulo-materias" className="subtitulo">
                Materias ({clasesEncontradas.length} {clasesEncontradas.length === 1 ? 'clase' : 'clases'})
              </h2>
              <TablaPaginada
                key={termino}
                titulo="Clases que coinciden con la búsqueda"
                columnas={COLUMNAS_BUSQUEDA}
                filas={clasesEncontradas}
              />
            </section>
          )}
        </>
      )}
    </>
  );
}

function VistaLaboratorio({ refTitulo, laboratorio, clases, pestanaInicial, cargando, reservas, configuracion, onRegistrar }) {
  const [pestana, setPestana] = useState(pestanaInicial);
  const clasesLab = useMemo(
    () => clases.filter((clase) => clase.lab === laboratorio.codigo).sort(ordenarClases),
    [clases, laboratorio.codigo],
  );
  const horasSemana = clasesLab.reduce((suma, c) => suma + minutos(c.fin) - minutos(c.inicio), 0) / 60;

  const informacion = (
    <div className="info-lab">
      <section>
        <h2 className="subtitulo">Datos generales</h2>
        <p>{laboratorio.descripcion}</p>
        <dl className="lista-datos">
          <div>
            <dt>Código</dt>
            <dd>{laboratorio.codigo}</dd>
          </div>
          <div>
            <dt>Capacidad</dt>
            <dd>{laboratorio.capacidad} PCs de estudiante + 1 PC del docente</dd>
          </div>
          <div>
            <dt>Ubicación</dt>
            <dd>{laboratorio.ubicacion}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>
              <EstadoBadge estado={laboratorio.estado} />
              {laboratorio.motivoMantenimiento && <span className="dato-nota">{laboratorio.motivoMantenimiento}</span>}
            </dd>
          </div>
          <div>
            <dt>Atención</dt>
            <dd>
              Lunes a sábado, {configuracion.horaApertura} a {configuracion.horaCierre}
            </dd>
          </div>
          <div>
            <dt>Ocupación</dt>
            <dd>
              {plural(clasesLab.length, 'clase', 'clases')}, {horasSemana.toLocaleString('es-BO', { maximumFractionDigits: 1 })} h
              por semana
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h2 className="subtitulo">Software instalado</h2>
        <ul className="chips">
          {laboratorio.software.map((programa) => (
            <li key={programa}>{programa}</li>
          ))}
        </ul>
      </section>
    </div>
  );

  const horario = (
    <>
      <h2 className="subtitulo">Horario semanal · {SEMESTRE}</h2>
      <TablaPaginada titulo={`Horario del laboratorio ${laboratorio.codigo}`} columnas={COLUMNAS_HORARIO} filas={clasesLab} />
    </>
  );

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Laboratorio {laboratorio.codigo}
          </h1>
          <p className="titulo-sub">
            {laboratorio.ubicacion} · {laboratorio.capacidad} PCs
          </p>
        </div>
        <EstadoBadge estado={laboratorio.estado} />
      </div>

      {cargando ? (
        <Skeleton variante="lineas" cantidad={5} texto="Cargando laboratorio…" />
      ) : (
        <Tabs
          etiqueta={`Secciones del laboratorio ${laboratorio.codigo}`}
          activa={pestana}
          onCambiar={setPestana}
          pestanas={[
            { id: 'info', etiqueta: 'Información', contenido: informacion },
            { id: 'horario', etiqueta: 'Horario', contenido: horario },
            {
              id: 'reservar',
              etiqueta: 'Reservar',
              contenido: (
                <ReservaForm
                  laboratorio={laboratorio}
                  clases={clases}
                  reservas={reservas}
                  configuracion={configuracion}
                  onRegistrar={onRegistrar}
                />
              ),
            },
          ]}
        />
      )}
    </>
  );
}

// Mientras llegan los datos del servidor todavía no se sabe si el laboratorio existe.
function VistaLaboratorioCargando({ refTitulo, codigo }) {
  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Laboratorio {codigo}
          </h1>
        </div>
      </div>
      <Skeleton variante="lineas" cantidad={5} texto="Cargando laboratorio…" />
    </>
  );
}

function VistaReservas({ refTitulo, cargando, reservas, onPedirCancelacion }) {
  const ordenadas = [...reservas].sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`));

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Mis reservas
          </h1>
          <p className="titulo-sub">
            {cargando
              ? 'Cargando reservas…'
              : ordenadas.length === 0
                ? 'No tienes reservas registradas.'
                : `${plural(ordenadas.length, 'reserva registrada', 'reservas registradas')}.`}
          </p>
        </div>
      </div>

      {cargando && <Skeleton variante="tarjetas" cantidad={2} texto="Cargando reservas…" />}

      {!cargando && ordenadas.length === 0 && (
        <EmptyState
          icono="calendario"
          titulo="Todavía no tienes reservas"
          mensaje="Elige un laboratorio disponible y usa la pestaña «Reservar» para registrar tu primera reserva."
          accion={{ etiqueta: 'Ver laboratorios', href: '#/laboratorios' }}
        />
      )}

      {!cargando && ordenadas.length > 0 && (
        <ul className="lista-reservas">
          {ordenadas.map((reserva) => (
            <li key={reserva.id} className="tarjeta reserva">
              <div className="reserva-cabecera">
                <h2 className="reserva-titulo">
                  <a href={`#/laboratorios/${reserva.lab}`}>Lab {reserva.lab}</a>
                </h2>
                <span className="badge badge-tipo">{etiquetaTipo(reserva.tipo)}</span>
              </div>
              <p className="reserva-fecha">
                {capitalizar(formatearFecha(reserva.fecha))}
                <span aria-hidden="true"> · </span>
                <span className="nowrap">
                  {reserva.horaInicio}–{reserva.horaFin}
                </span>
              </p>
              <p className="reserva-motivo">{reserva.motivo}</p>
              <button type="button" className="boton boton-peligro-borde" onClick={() => onPedirCancelacion(reserva)}>
                Cancelar reserva
                <span className="solo-lectores">
                  {' '}
                  del Lab {reserva.lab}, {formatearFecha(reserva.fecha)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function VistaAyuda({ refTitulo, configuracion }) {
  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Preguntas frecuentes
          </h1>
          <p className="titulo-sub">Lo que necesitas saber antes de reservar un laboratorio.</p>
        </div>
      </div>
      <Accordion items={crearPreguntasFrecuentes(configuracion)} nivelTitulo={2} />
      <p className="nota">¿No encontraste tu respuesta? Consulta con el encargado de laboratorios del 4to piso.</p>
    </>
  );
}

function VistaNoEncontrada({ refTitulo, titulo, mensaje }) {
  return (
    <>
      <h1 ref={refTitulo} tabIndex={-1} className="solo-lectores">
        {titulo}
      </h1>
      <EmptyState icono="pagina" titulo={titulo} mensaje={mensaje} accion={{ etiqueta: 'Ver laboratorios', href: '#/laboratorios' }} />
    </>
  );
}

// ---------- App ----------

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [tema, setTema] = useState(() =>
    document.documentElement.getAttribute('data-tema') === 'oscuro' ? 'oscuro' : 'claro',
  );
  const [datos, setDatos] = useState({ laboratorios: [], clases: [] });
  const [reservas, setReservas] = useState([]);
  const [configuracion, setConfiguracion] = useState(CONFIGURACION_POR_DEFECTO);
  const [origen, setOrigen] = useState(null); // 'servidor' | 'local' | null (todavía no se sabe)
  const [cargando, setCargando] = useState(true);
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const refBusqueda = useRef(null);
  const refMain = useRef(null);
  const refTitulo = useRef(null);
  const rutaPrevia = useRef(claveDeRuta(ruta));
  const navegandoDesdeBusqueda = useRef(false);

  // Navegación por hash.
  useEffect(() => {
    const alCambiarHash = () => setRuta(leerRuta());
    window.addEventListener('hashchange', alCambiarHash);
    return () => window.removeEventListener('hashchange', alCambiarHash);
  }, []);

  // Al cambiar de página: subir al inicio y llevar el foco al título.
  useEffect(() => {
    const clave = claveDeRuta(ruta);
    if (rutaPrevia.current === clave) return;
    rutaPrevia.current = clave;
    window.scrollTo(0, 0);
    if (navegandoDesdeBusqueda.current) {
      navegandoDesdeBusqueda.current = false; // el usuario sigue escribiendo en la búsqueda
      return;
    }
    refTitulo.current?.focus({ preventScroll: true });
  }, [ruta]);

  // Patrón «Modo claro/oscuro»: el tema vive en <html data-tema="…"> y las variables CSS hacen el resto.
  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
  }, [tema]);

  const alternarTema = () => {
    const nuevo = tema === 'oscuro' ? 'claro' : 'oscuro';
    setTema(nuevo);
    guardarAlmacen(CLAVE_TEMA, nuevo);
  };

  // Carga de datos desde la API (con el indicador de carga mientras tanto). Si falla → modo de respaldo.
  useEffect(() => {
    let cancelado = false;
    const esperaMinima = new Promise((resolver) => setTimeout(resolver, CARGA_MINIMA_MS));
    Promise.allSettled([obtenerDatos(), esperaMinima]).then(([resultado]) => {
      if (cancelado) return;
      if (resultado.status === 'fulfilled') {
        const { laboratorios, clases, reservas: delServidor, configuracion: delServidorConfig } = resultado.value;
        setDatos({ laboratorios, clases });
        setReservas(delServidor);
        setConfiguracion({ ...CONFIGURACION_POR_DEFECTO, ...delServidorConfig });
        setOrigen('servidor');
      } else {
        setDatos({ laboratorios: laboratoriosLocales, clases: clasesLocales });
        setReservas(cargarReservasLocales());
        setConfiguracion(CONFIGURACION_POR_DEFECTO);
        setOrigen('local');
      }
      setCargando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [intentoCarga]);

  const recargar = () => {
    setCargando(true);
    setIntentoCarga((n) => n + 1);
  };

  // En modo de respaldo, las reservas se guardan en este navegador.
  useEffect(() => {
    if (origen === 'local') guardarAlmacen(CLAVE_RESERVAS, JSON.stringify(reservas));
  }, [reservas, origen]);

  // Patrón «Barra de búsqueda»: filtra en vivo. Patrón «Filtrado»: acota por estado y capacidad.
  const { laboratorios, clases } = datos;
  const termino = normalizar(busqueda.trim());
  const clasesEncontradas = useMemo(() => {
    if (!termino) return [];
    return clases.filter((c) => normalizar(`${c.sigla} ${c.materia} ${c.docente}`).includes(termino)).sort(ordenarClases);
  }, [termino, clases]);
  const labsEncontrados = useMemo(() => {
    if (!termino) return laboratorios;
    return laboratorios.filter((lab) => {
      const texto = normalizar(
        `lab ${lab.codigo} laboratorio ${lab.codigo} ${lab.codigo.replace('-', '')} ${lab.estado === 'MANTENIMIENTO' ? 'mantenimiento' : 'disponible'}`,
      );
      return texto.includes(termino) || clasesEncontradas.some((c) => c.lab === lab.codigo);
    });
  }, [termino, laboratorios, clasesEncontradas]);
  const labsFiltrados = useMemo(() => labsEncontrados.filter((lab) => cumpleFiltros(lab, filtros)), [labsEncontrados, filtros]);
  const clasesFiltradas = useMemo(() => {
    const permitidos = new Set(laboratorios.filter((lab) => cumpleFiltros(lab, filtros)).map((lab) => lab.codigo));
    return clasesEncontradas.filter((clase) => permitidos.has(clase.lab));
  }, [clasesEncontradas, laboratorios, filtros]);
  const totalClasesPorLab = useMemo(
    () =>
      clases.reduce((acumulado, clase) => {
        acumulado[clase.lab] = (acumulado[clase.lab] || 0) + 1;
        return acumulado;
      }, {}),
    [clases],
  );

  const buscar = (valor) => {
    setBusqueda(valor);
    if (valor.trim() && ruta.vista !== 'laboratorios') {
      navegandoDesdeBusqueda.current = true;
      window.location.hash = '#/laboratorios';
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    refBusqueda.current?.focus();
  };

  const avisar = (mensaje, tipo = 'exito') => setAviso({ id: Date.now(), mensaje, tipo });

  // Devuelve { ok } o { ok: false, errores } para que el formulario muestre los mensajes.
  const registrarReserva = async (reserva) => {
    if (origen === 'servidor') {
      try {
        const creada = await crearReserva(reserva);
        setReservas((actuales) => [...actuales, creada]);
        avisar('Reserva registrada');
        return { ok: true };
      } catch (error) {
        if (error.errores) return { ok: false, errores: error.errores };
        avisar('No se pudo registrar la reserva: el servidor no responde. Inténtalo de nuevo.', 'error');
        return { ok: false };
      }
    }
    setReservas((actuales) => [...actuales, reserva]);
    avisar('Reserva registrada');
    return { ok: true };
  };

  const confirmarCancelacion = async () => {
    const { id } = reservaACancelar;
    if (origen === 'servidor') {
      setCancelando(true);
      try {
        await cancelarReserva(id);
      } catch (error) {
        // 404: la reserva ya no existía en el servidor; igual se quita de la lista.
        if (error.estado !== 404) {
          setCancelando(false);
          setReservaACancelar(null);
          avisar('No se pudo cancelar la reserva: el servidor no responde. Inténtalo de nuevo.', 'error');
          return;
        }
      }
      setCancelando(false);
    }
    setReservas((actuales) => actuales.filter((reserva) => reserva.id !== id));
    setReservaACancelar(null);
    avisar('Reserva cancelada');
  };

  // ---------- Panel del encargado (solo con servidor) ----------

  // Crea (codigoOriginal = null) o modifica un laboratorio. Devuelve { ok } o { ok: false, errores }.
  const guardarLaboratorio = async (valores, codigoOriginal) => {
    if (origen !== 'servidor') return { ok: false };
    const laboratorio = normalizarLaboratorio(valores);
    try {
      const guardado = codigoOriginal
        ? await actualizarLaboratorio(codigoOriginal, laboratorio)
        : await crearLaboratorio(laboratorio);
      setDatos((actuales) => ({
        ...actuales,
        laboratorios: codigoOriginal
          ? actuales.laboratorios.map((lab) => (lab.codigo === codigoOriginal ? guardado : lab))
          : [...actuales.laboratorios, guardado].sort((a, b) => a.codigo.localeCompare(b.codigo)),
      }));
      avisar(codigoOriginal ? `Laboratorio ${guardado.codigo} actualizado` : `Laboratorio ${guardado.codigo} creado`);
      return { ok: true };
    } catch (error) {
      if (error.errores) return { ok: false, errores: error.errores };
      if (error.estado === 404) {
        avisar(`${error.message} Pulsa «Recargar» en Laboratorios para ver la lista actual.`, 'error');
        return { ok: false };
      }
      avisar('No se pudo guardar el laboratorio: el servidor no responde. Inténtalo de nuevo.', 'error');
      return { ok: false };
    }
  };

  const quitarLaboratorio = async (codigo) => {
    if (origen !== 'servidor') return { ok: false };
    try {
      await eliminarLaboratorio(codigo);
    } catch (error) {
      // 409: tiene clases o reservas. El servidor explica por qué no se puede eliminar.
      if (error.estado === 409) {
        avisar(error.message, 'error');
        return { ok: false };
      }
      if (error.estado !== 404) {
        avisar('No se pudo eliminar el laboratorio: el servidor no responde. Inténtalo de nuevo.', 'error');
        return { ok: false };
      }
      // 404: ya no existía; igual se quita de la lista.
    }
    setDatos((actuales) => ({ ...actuales, laboratorios: actuales.laboratorios.filter((lab) => lab.codigo !== codigo) }));
    avisar(`Laboratorio ${codigo} eliminado`);
    return { ok: true };
  };

  const guardarAjustes = async (valores) => {
    if (origen !== 'servidor') return { ok: false };
    try {
      const guardada = await guardarConfiguracion(normalizarConfiguracion(valores));
      setConfiguracion(guardada);
      avisar('Configuración guardada');
      return { ok: true, configuracion: guardada };
    } catch (error) {
      if (error.errores) return { ok: false, errores: error.errores };
      avisar('No se pudo guardar la configuración: el servidor no responde. Inténtalo de nuevo.', 'error');
      return { ok: false };
    }
  };

  // Vista actual + migas de pan.
  const seccion = ruta.vista === 'lab' ? 'laboratorios' : ruta.vista;
  const inicio = { etiqueta: 'Inicio', href: '#/' };
  let migas = [];
  let vista;

  if (ruta.vista === 'inicio') {
    vista = (
      <VistaInicio
        refTitulo={refTitulo}
        cargando={cargando}
        laboratorios={laboratorios}
        clases={clases}
        totalReservas={reservas.length}
        configuracion={configuracion}
      />
    );
  } else if (ruta.vista === 'laboratorios') {
    migas = [inicio, { etiqueta: 'Laboratorios' }];
    vista = (
      <VistaLaboratorios
        refTitulo={refTitulo}
        cargando={cargando}
        onRecargar={recargar}
        busqueda={busqueda}
        labsEncontrados={labsFiltrados}
        clasesEncontradas={clasesFiltradas}
        totalLabs={laboratorios.length}
        totalClasesPorLab={totalClasesPorLab}
        filtros={filtros}
        onCambiarFiltros={setFiltros}
        onLimpiarFiltros={() => setFiltros(FILTROS_INICIALES)}
        onLimpiar={limpiarBusqueda}
      />
    );
  } else if (ruta.vista === 'lab') {
    const laboratorio = laboratorios.find((lab) => lab.codigo === ruta.codigo);
    migas = [inicio, { etiqueta: 'Laboratorios', href: '#/laboratorios' }, { etiqueta: `Lab ${ruta.codigo}` }];
    if (laboratorio) {
      vista = (
        <VistaLaboratorio
          key={`${laboratorio.codigo}-${ruta.pestana}`}
          refTitulo={refTitulo}
          laboratorio={laboratorio}
          clases={clases}
          pestanaInicial={ruta.pestana}
          cargando={cargando}
          reservas={reservas}
          configuracion={configuracion}
          onRegistrar={registrarReserva}
        />
      );
    } else if (cargando) {
      vista = <VistaLaboratorioCargando refTitulo={refTitulo} codigo={ruta.codigo} />;
    } else {
      vista = (
        <VistaNoEncontrada
          refTitulo={refTitulo}
          titulo={`No existe el laboratorio «${ruta.codigo}»`}
          mensaje="Revisa el código en la lista de laboratorios del 4to piso."
        />
      );
    }
  } else if (ruta.vista === 'reservas') {
    migas = [inicio, { etiqueta: 'Mis reservas' }];
    vista = (
      <VistaReservas refTitulo={refTitulo} cargando={cargando} reservas={reservas} onPedirCancelacion={setReservaACancelar} />
    );
  } else if (ruta.vista === 'ayuda') {
    migas = [inicio, { etiqueta: 'Ayuda' }];
    vista = <VistaAyuda refTitulo={refTitulo} configuracion={configuracion} />;
  } else if (ruta.vista === 'panel') {
    const actual = SECCIONES_PANEL.find((item) => item.id === ruta.seccion);
    migas =
      ruta.seccion === 'inicio'
        ? [inicio, { etiqueta: 'Panel' }]
        : [inicio, { etiqueta: 'Panel', href: '#/panel' }, { etiqueta: actual.etiqueta }];
    vista = (
      <PanelEncargado
        seccion={ruta.seccion}
        refTitulo={refTitulo}
        cargando={cargando}
        laboratorios={laboratorios}
        clases={clases}
        reservas={reservas}
        configuracion={configuracion}
        soloLectura={origen !== 'servidor'}
        onPedirCancelacion={setReservaACancelar}
        onGuardarLaboratorio={guardarLaboratorio}
        onEliminarLaboratorio={quitarLaboratorio}
        onGuardarConfiguracion={guardarAjustes}
      />
    );
  } else {
    migas = [inicio, { etiqueta: 'Página no encontrada' }];
    vista = (
      <VistaNoEncontrada
        refTitulo={refTitulo}
        titulo="Esta página no existe"
        mensaje="Revisa la dirección o vuelve a la lista de laboratorios."
      />
    );
  }

  let textoOrigen = 'Conectando con el servidor…';
  if (origen === 'servidor') textoOrigen = 'Datos: servidor Express + SQLite';
  if (origen === 'local') textoOrigen = 'Datos: locales (modo de respaldo)';

  return (
    <>
      <a
        className="saltar-contenido"
        href="#contenido"
        onClick={(evento) => {
          evento.preventDefault();
          refMain.current?.focus();
        }}
      >
        Saltar al contenido
      </a>

      <Header
        busqueda={busqueda}
        onBuscar={buscar}
        refBusqueda={refBusqueda}
        tema={tema}
        onAlternarTema={alternarTema}
        seccion={seccion}
        totalReservas={reservas.length}
      />

      <main id="contenido" ref={refMain} tabIndex={-1} className="contenedor principal">
        <AvisoConexion visible={origen === 'local'} reintentando={cargando} onReintentar={recargar} />
        <Breadcrumbs items={migas} />
        {vista}
      </main>

      <footer className="pie">
        <div className="contenedor">
          <p>Patrones UI – INF513 Grupo 08 SA – 2/2026</p>
          <p className="pie-origen">{textoOrigen}</p>
        </div>
      </footer>

      <Toast aviso={aviso} onCerrar={() => setAviso(null)} duracion={aviso?.tipo === 'error' ? 6000 : 3000} />

      <Modal
        abierto={reservaACancelar !== null}
        titulo={reservaACancelar ? `¿Cancelar la reserva del Lab ${reservaACancelar.lab}?` : ''}
        textoVolver="Volver"
        textoConfirmar="Cancelar reserva"
        textoOcupado="Cancelando…"
        ocupado={cancelando}
        onConfirmar={confirmarCancelacion}
        onCerrar={() => setReservaACancelar(null)}
        refFocoRespaldo={refTitulo}
      >
        {reservaACancelar && (
          <p>
            Se liberará el laboratorio el {formatearFecha(reservaACancelar.fecha)}, de {reservaACancelar.horaInicio} a{' '}
            {reservaACancelar.horaFin}. Esta acción no se puede deshacer.
          </p>
        )}
      </Modal>
    </>
  );
}
