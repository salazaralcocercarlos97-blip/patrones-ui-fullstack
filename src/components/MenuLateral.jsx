/*
 * Patrón: MENÚ LATERAL (Sidebar) + ESTADO ACTIVO.
 * Problema que resuelve: el panel del encargado tiene cinco secciones (Panel, Reservas,
 * Laboratorios, Reportes y Configuración) que no caben en la barra de navegación principal.
 * El menú lateral las deja siempre a la vista, en una columna a la izquierda, y marca la
 * sección actual (fondo, barra y aria-current="page") para que el encargado sepa dónde está.
 * Por debajo de 768 px pasa a una barra horizontal desplazable, para no robar ancho al contenido;
 * al cambiar de sección, la barra se desplaza sola hasta dejar visible el ítem actual.
 */
import { useEffect, useRef } from 'react';

export const SECCIONES_PANEL = [
  { id: 'inicio', etiqueta: 'Panel', href: '#/panel', icono: <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" /> },
  {
    id: 'reservas',
    etiqueta: 'Reservas',
    href: '#/panel/reservas',
    icono: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    id: 'laboratorios',
    etiqueta: 'Laboratorios',
    href: '#/panel/laboratorios',
    icono: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M8 20h8M12 16v4" />
      </>
    ),
  },
  { id: 'reportes', etiqueta: 'Reportes', href: '#/panel/reportes', icono: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /> },
  {
    id: 'configuracion',
    etiqueta: 'Configuración',
    href: '#/panel/configuracion',
    icono: (
      <>
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </>
    ),
  },
];

export default function MenuLateral({ actual }) {
  const refLista = useRef(null);

  // En la barra horizontal (móvil), desplaza la lista hasta el ítem actual sin mover la página.
  useEffect(() => {
    const lista = refLista.current;
    const activo = lista?.querySelector('[aria-current="page"]');
    if (!lista || !activo || lista.scrollWidth <= lista.clientWidth) return;
    const izquierda = activo.getBoundingClientRect().left - lista.getBoundingClientRect().left + lista.scrollLeft;
    if (izquierda < lista.scrollLeft || izquierda + activo.offsetWidth > lista.scrollLeft + lista.clientWidth) {
      lista.scrollLeft = izquierda - 16;
    }
  }, [actual]);

  return (
    <nav className="menu-lateral" aria-label="Panel del encargado">
      <p className="menu-lateral-titulo" aria-hidden="true">
        Panel del encargado
      </p>
      <ul ref={refLista}>
        {SECCIONES_PANEL.map((seccion) => (
          <li key={seccion.id}>
            <a href={seccion.href} aria-current={actual === seccion.id ? 'page' : undefined}>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {seccion.icono}
              </svg>
              {seccion.etiqueta}
            </a>
          </li>
        ))}
      </ul>
      <p className="menu-lateral-nota">Demo sin inicio de sesión: cualquiera que abra la app puede usar este panel.</p>
    </nav>
  );
}
