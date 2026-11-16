/*
 * App: une los 13 patrones UI. Versión con backend (Express + SQLite).
 * - Al iniciar pide laboratorios, clases y reservas a la API (src/api.js). Mientras tanto
 *   se ve el skeleton (mínimo 1 s, para que se note en la demo).
 * - MODO DE RESPALDO: si el servidor no responde, usa los datos de src/data.js y guarda
 *   las reservas en localStorage (dentro de try/catch). Un aviso lo explica y ofrece «Reintentar».
 * - Navegación por hash (#/laboratorios/236-43) para que funcionen Atrás/Adelante del navegador.
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
import { cancelarReserva, crearReserva, obtenerDatos } from './api.js';
import {
  DIAS,
  HORA_APERTURA,
  HORA_CIERRE,
  SEMESTRE,
  TIPOS_RESERVA,
  clases as clasesLocales,
  formatearFecha,
  laboratorios as laboratoriosLocales,
  preguntasFrecuentes,
  reservasDeEjemplo,
} from './data.js';

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
  return { vista: 'no-encontrada' };
}

function claveDeRuta(ruta) {
  return [ruta.vista, ruta.codigo, ruta.pestana].filter(Boolean).join('/');
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

const PATRONES = [
  { numero: 1, nombre: 'Búsqueda global', descripcion: 'Filtra laboratorios y materias mientras escribes.', donde: 'En la cabecera (atajo: tecla /)' },
  { numero: 2, nombre: 'Menú hamburguesa', descripcion: 'Agrupa la navegación en pantallas de menos de 768 px. Se cierra con Escape.', donde: 'En la cabecera, en móvil' },
  { numero: 3, nombre: 'Modo claro/oscuro', descripcion: 'Cambia el tema con variables CSS y recuerda tu elección.', donde: 'Botón de luna/sol en la cabecera' },
  { numero: 4, nombre: 'Migas de pan', descripcion: 'Muestran dónde estás y te llevan de vuelta en un clic.', donde: 'Ir al Lab 236-43', href: '#/laboratorios/236-43' },
  { numero: 5, nombre: 'Pestañas', descripcion: 'Separan Información, Horario y Reservar. Se recorren con las flechas.', donde: 'Ir al Lab 236-43', href: '#/laboratorios/236-43' },
  { numero: 6, nombre: 'Tarjetas', descripcion: 'Resumen de cada laboratorio con su estado y una sola acción.', donde: 'Ir a Laboratorios', href: '#/laboratorios' },
  { numero: 7, nombre: 'Skeleton de carga', descripcion: 'Dibuja la forma del contenido mientras llegan los datos del servidor.', donde: 'Ir a Laboratorios («Recargar»)', href: '#/laboratorios' },
  { numero: 8, nombre: 'Estado vacío', descripcion: 'Explica que no hubo resultados y ofrece «Limpiar búsqueda».', donde: 'Probar búsqueda sin resultados', accion: 'vacio' },
  { numero: 9, nombre: 'Validación en línea', descripcion: 'Revisa cada campo al salir de él; el servidor vuelve a validar al guardar.', donde: 'Reservar el Lab 236-44', href: '#/laboratorios/236-44/reservar' },
  { numero: 10, nombre: 'Modal de confirmación', descripcion: 'Pide confirmación antes de cancelar una reserva.', donde: 'Ir a Mis reservas', href: '#/reservas' },
  { numero: 11, nombre: 'Toast', descripcion: 'Avisa «Reserva registrada» o «Reserva cancelada» y se oculta a los 3 s.', donde: 'Al registrar o cancelar una reserva' },
  { numero: 12, nombre: 'Paginación', descripcion: 'Divide el horario del laboratorio en páginas de 5 filas.', donde: 'Horario del Lab 236-41', href: '#/laboratorios/236-41/horario' },
  { numero: 13, nombre: 'Acordeón', descripcion: 'Preguntas frecuentes con un solo panel abierto a la vez.', donde: 'Ir a Ayuda', href: '#/ayuda' },
];

// ---------- Vistas ----------

function VistaInicio({ refTitulo, cargando, laboratorios, clases, totalReservas, onProbarVacio }) {
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
          Consulta los seis laboratorios de computación del módulo 236, revisa sus horarios y reserva un espacio para tu
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

      <section className="seccion" aria-labelledby="titulo-patrones">
        <h2 id="titulo-patrones" className="subtitulo">
          Los 13 patrones de esta demo
        </h2>
        <p className="seccion-intro">Cada patrón resuelve un problema concreto de uso. Ábrelo para verlo funcionando.</p>
        <ol className="lista-patrones">
          {PATRONES.map((patron) => (
            <li key={patron.numero} className="patron">
              <span className="patron-numero" aria-hidden="true">
                {patron.numero}
              </span>
              <div>
                <h3 className="patron-nombre">{patron.nombre}</h3>
                <p className="patron-descripcion">{patron.descripcion}</p>
                <p className="patron-donde">
                  {patron.href && <a href={patron.href}>{patron.donde}</a>}
                  {patron.accion === 'vacio' && (
                    <button type="button" className="boton-enlace" onClick={onProbarVacio}>
                      {patron.donde}
                    </button>
                  )}
                  {!patron.href && !patron.accion && patron.donde}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="nota">
          Extra de la versión con backend: si el servidor no responde, aparece un aviso con «Reintentar» y la app sigue
          funcionando con datos locales (modo de respaldo).
        </p>
      </section>
    </>
  );
}

function VistaLaboratorios({
  refTitulo,
  cargando,
  onRecargar,
  busqueda,
  labsEncontrados,
  clasesEncontradas,
  totalClasesPorLab,
  onLimpiar,
}) {
  const termino = busqueda.trim();
  const hayBusqueda = termino !== '';
  const sinResultados = hayBusqueda && labsEncontrados.length === 0 && clasesEncontradas.length === 0;

  let resumen = '';
  if (hayBusqueda && !cargando) {
    resumen = sinResultados
      ? `Sin resultados para «${termino}».`
      : `${plural(labsEncontrados.length, 'laboratorio', 'laboratorios')} y ${plural(clasesEncontradas.length, 'clase', 'clases')} para «${termino}».`;
  }

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1 ref={refTitulo} tabIndex={-1}>
            Laboratorios
          </h1>
          <p className="titulo-sub">Seis laboratorios de computación del 4to piso, módulo 236.</p>
        </div>
        <button type="button" className="boton boton-secundario" onClick={onRecargar}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
          </svg>
          Recargar
        </button>
      </div>

      <p className="resultado-resumen" role="status">
        {resumen}
      </p>

      {cargando && <Skeleton variante="tarjetas" cantidad={6} texto="Cargando laboratorios…" />}

      {!cargando && sinResultados && (
        <EmptyState
          icono="busqueda"
          titulo={`No encontramos nada para «${termino}»`}
          mensaje="Prueba con el código de un laboratorio (236-43), la sigla de una materia (INF120) o el apellido de un docente."
          accion={{ etiqueta: 'Limpiar búsqueda', onClick: onLimpiar }}
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

function VistaLaboratorio({ refTitulo, laboratorio, clases, pestanaInicial, cargando, reservas, onRegistrar }) {
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
              Lunes a sábado, {HORA_APERTURA} a {HORA_CIERRE}
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
              contenido: <ReservaForm laboratorio={laboratorio} clases={clases} reservas={reservas} onRegistrar={onRegistrar} />,
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

function VistaAyuda({ refTitulo }) {
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
      <Accordion items={preguntasFrecuentes} nivelTitulo={2} />
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
  const [tema, setTema] = useState(() =>
    document.documentElement.getAttribute('data-tema') === 'oscuro' ? 'oscuro' : 'claro',
  );
  const [datos, setDatos] = useState({ laboratorios: [], clases: [] });
  const [reservas, setReservas] = useState([]);
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

  // Patrón 3: el tema vive en <html data-tema="…"> y las variables CSS hacen el resto.
  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema);
  }, [tema]);

  const alternarTema = () => {
    const nuevo = tema === 'oscuro' ? 'claro' : 'oscuro';
    setTema(nuevo);
    guardarAlmacen(CLAVE_TEMA, nuevo);
  };

  // Carga de datos desde la API (patrón 7 mientras tanto). Si falla → modo de respaldo.
  useEffect(() => {
    let cancelado = false;
    const esperaMinima = new Promise((resolver) => setTimeout(resolver, CARGA_MINIMA_MS));
    Promise.allSettled([obtenerDatos(), esperaMinima]).then(([resultado]) => {
      if (cancelado) return;
      if (resultado.status === 'fulfilled') {
        const { laboratorios, clases, reservas: delServidor } = resultado.value;
        setDatos({ laboratorios, clases });
        setReservas(delServidor);
        setOrigen('servidor');
      } else {
        setDatos({ laboratorios: laboratoriosLocales, clases: clasesLocales });
        setReservas(cargarReservasLocales());
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

  // Patrón 1: búsqueda global en vivo.
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

  const probarEstadoVacio = () => {
    setBusqueda('química');
    navegandoDesdeBusqueda.current = false;
    window.location.hash = '#/laboratorios';
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
        onProbarVacio={probarEstadoVacio}
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
        labsEncontrados={labsEncontrados}
        clasesEncontradas={clasesEncontradas}
        totalClasesPorLab={totalClasesPorLab}
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
          mensaje="Los laboratorios del 4to piso van del 236-41 al 236-46."
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
    vista = <VistaAyuda refTitulo={refTitulo} />;
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
