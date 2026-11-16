/*
 * Patrones: BÚSQUEDA GLOBAL + MENÚ HAMBURGUESA + ESTADO ACTIVO + MODO CLARO/OSCURO.
 * Problema que resuelve: el usuario necesita llegar rápido a cualquier laboratorio
 * o materia desde cualquier página (búsqueda siempre visible, atajo «/»), navegar
 * en pantallas pequeñas sin que el menú ocupe toda la pantalla (hamburguesa < 768 px,
 * se cierra con Escape), saber siempre en qué sección está (ESTADO ACTIVO: el enlace actual se
 * resalta y lleva aria-current="page") y leer cómodamente según la luz (tema que se recuerda).
 * El contador de reservas junto a «Mis reservas» es una INSIGNIA DE ESTADO (ver LabCard.jsx).
 */
import { useEffect, useRef, useState } from 'react';

const ENLACES = [
  { id: 'inicio', etiqueta: 'Inicio', href: '#/' },
  { id: 'laboratorios', etiqueta: 'Laboratorios', href: '#/laboratorios' },
  { id: 'reservas', etiqueta: 'Mis reservas', href: '#/reservas' },
  { id: 'ayuda', etiqueta: 'Ayuda', href: '#/ayuda' },
];

function esCampoEditable(elemento) {
  if (!elemento) return false;
  const etiqueta = elemento.tagName;
  return etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT' || elemento.isContentEditable;
}

export default function Header({ busqueda, onBuscar, refBusqueda, tema, onAlternarTema, seccion, totalReservas }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const refBotonMenu = useRef(null);
  const refMenu = useRef(null);

  // Escape cierra el menú y devuelve el foco al botón; un clic fuera también lo cierra.
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
        refBotonMenu.current?.focus();
      }
    };
    const alHacerClic = (evento) => {
      if (!refMenu.current?.contains(evento.target) && !refBotonMenu.current?.contains(evento.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('mousedown', alHacerClic);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('mousedown', alHacerClic);
    };
  }, [menuAbierto]);

  // Si la ventana pasa a escritorio (>= 768 px), el menú vuelve a su estado normal.
  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 768px)');
    const alCambiar = (evento) => {
      if (evento.matches) setMenuAbierto(false);
    };
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  // Atajo de teclado: «/» lleva el foco a la búsqueda (si no se está escribiendo en otro campo).
  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key !== '/' || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (esCampoEditable(document.activeElement)) return;
      if (document.body.classList.contains('modal-abierto')) return;
      evento.preventDefault();
      refBusqueda.current?.focus();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [refBusqueda]);

  const esOscuro = tema === 'oscuro';

  return (
    <header className="cabecera">
      <div className="cabecera-interior">
        <a className="marca" href="#/">
          <span className="marca-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="12" rx="1.5" />
              <path d="M8 20h8M12 16v4" />
            </svg>
          </span>
          <span className="marca-texto">
            <span className="marca-nombre">Laboratorios FICCT</span>
            <span className="marca-sub">Módulo 236 · 4to piso</span>
          </span>
        </a>

        <nav
          id="menu-principal"
          ref={refMenu}
          className={`nav-principal${menuAbierto ? ' abierto' : ''}`}
          aria-label="Principal"
        >
          <ul>
            {ENLACES.map((enlace) => (
              <li key={enlace.id}>
                <a
                  href={enlace.href}
                  aria-current={seccion === enlace.id ? 'page' : undefined}
                  onClick={() => setMenuAbierto(false)}
                >
                  {enlace.etiqueta}
                  {enlace.id === 'reservas' && totalReservas > 0 && (
                    <span className="contador">
                      {totalReservas}
                      <span className="solo-lectores"> {totalReservas === 1 ? 'reserva' : 'reservas'}</span>
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <form className="busqueda" role="search" onSubmit={(evento) => evento.preventDefault()}>
          <label htmlFor="busqueda-global" className="solo-lectores">
            Buscar laboratorios o materias
          </label>
          <svg className="busqueda-icono" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="busqueda-global"
            ref={refBusqueda}
            type="search"
            value={busqueda}
            onChange={(evento) => onBuscar(evento.target.value)}
            placeholder="Ej.: 236-43, INF120 o un docente"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="busqueda-atajo" aria-hidden="true">/</kbd>
        </form>

        <button
          type="button"
          className="boton-icono boton-tema"
          onClick={onAlternarTema}
          aria-label={esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
          title={esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {esOscuro ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          ref={refBotonMenu}
          className="boton-icono boton-hamburguesa"
          aria-expanded={menuAbierto}
          aria-controls="menu-principal"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          {menuAbierto ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
