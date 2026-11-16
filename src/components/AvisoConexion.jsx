/*
 * Patrón extra (versión con backend): AVISO DE CONEXIÓN / MODO DE RESPALDO.
 * Problema que resuelve: si el servidor no responde, la app no debe quedar en blanco ni
 * fallar en silencio. Se explica qué pasó, qué significa para el usuario (sus reservas se
 * guardan solo en este navegador) y se ofrece una salida: «Reintentar».
 * La región role="status" existe siempre para que el lector de pantalla anuncie el aviso.
 */
export default function AvisoConexion({ visible, reintentando, onReintentar }) {
  return (
    <div role="status" className="aviso-conexion-region">
      {visible && (
        <div className="aviso-conexion">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v5M12 16.5v.5M12 3l10 18H2z" />
          </svg>
          <p>
            <strong>Sin conexión con el servidor.</strong> Estás viendo los datos locales de la demo y tus reservas se
            guardan solo en este navegador.
          </p>
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => {
              if (!reintentando) onReintentar();
            }}
            aria-disabled={reintentando}
          >
            {reintentando ? 'Conectando…' : 'Reintentar'}
          </button>
        </div>
      )}
    </div>
  );
}
