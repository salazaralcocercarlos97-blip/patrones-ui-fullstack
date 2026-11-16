// Capa de acceso al backend: todas las llamadas fetch a /api pasan por aquí.
// Si el servidor no responde en 5 s, o responde con error, se lanza un ErrorApi
// que App.jsx usa para decidir si pasa al modo de respaldo (datos locales).

const TIEMPO_MAXIMO_MS = 5000;

export class ErrorApi extends Error {
  constructor(mensaje, { estado = 0, errores = null } = {}) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado; // 0 = sin conexión
    this.errores = errores; // { campo: mensaje } cuando el servidor rechaza los datos
  }
}

async function pedir(ruta, opciones = {}) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      ...opciones,
      signal: controlador.signal,
      headers: { 'Content-Type': 'application/json', ...opciones.headers },
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor.');
  } finally {
    clearTimeout(temporizador);
  }

  if (respuesta.status === 204) return null;

  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    // La respuesta no trae JSON (por ejemplo, el proxy de Vite cuando el backend está apagado).
  }

  if (!respuesta.ok) {
    throw new ErrorApi(cuerpo?.error || `El servidor respondió con un error (${respuesta.status}).`, {
      estado: respuesta.status,
      errores: cuerpo?.errores || null,
    });
  }
  if (cuerpo === null) throw new ErrorApi('El servidor respondió sin datos.', { estado: respuesta.status });
  return cuerpo;
}

export async function obtenerDatos() {
  const [laboratorios, clases, reservas] = await Promise.all([
    pedir('/laboratorios'),
    pedir('/clases'),
    pedir('/reservas'),
  ]);
  return { laboratorios, clases, reservas };
}

export function crearReserva(reserva) {
  return pedir('/reservas', { method: 'POST', body: JSON.stringify(reserva) });
}

export function cancelarReserva(id) {
  return pedir(`/reservas/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
