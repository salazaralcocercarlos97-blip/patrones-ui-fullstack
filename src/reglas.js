// Reglas de validación de una reserva, COMPARTIDAS entre frontend y backend.
// - El formulario (ReservaForm.jsx) las usa para la validación en línea: ayuda al usuario.
// - El servidor (server/app.js) las vuelve a aplicar antes de guardar: es la última palabra,
//   porque cualquiera podría saltarse el navegador y llamar a la API directamente.
// - El horario de atención, la duración máxima y la anticipación máxima salen de la
//   configuración vigente (contexto.configuracion), que el encargado cambia en el panel.
//   Si no llega ninguna, se usan los valores por defecto de data.js.
// Este archivo es JavaScript puro (sin JSX) para que Node también pueda importarlo.
import {
  CONFIGURACION_POR_DEFECTO,
  DIAS,
  TIPOS_RESERVA,
  desdeISO,
  formatearFecha,
  horaDesdeMinutos,
  hoyISO,
  minutosDelDia,
  sumarDias,
} from './data.js';

export const MOTIVO_MINIMO = 10;
export const MOTIVO_MAXIMO = 200;
export const ORDEN_CAMPOS = ['fecha', 'horaInicio', 'horaFin', 'horario', 'tipo', 'motivo'];

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function fechaReal(iso) {
  if (!FORMATO_FECHA.test(iso)) return false;
  const fecha = desdeISO(iso);
  const [anio, mes, dia] = iso.split('-').map(Number);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

// Configuración vigente: la que llega en el contexto, completada con los valores por defecto.
export function configuracionDe(contexto = {}) {
  return { ...CONFIGURACION_POR_DEFECTO, ...(contexto.configuracion || {}) };
}

// Última fecha que se puede reservar hoy (hoy + anticipación máxima).
export function fechaMaximaReserva(configuracion = CONFIGURACION_POR_DEFECTO) {
  return sumarDias(hoyISO(), Number(configuracion.anticipacionMaximaDias));
}

// Devuelve el mensaje de error de un campo, o null si está bien.
// contexto = { laboratorio, clases, reservas, configuracion }
export function validarCampo(campo, valores, contexto) {
  const { fecha, horaInicio, horaFin, tipo, motivo } = valores;
  const { horaApertura, horaCierre, duracionMaximaHoras, anticipacionMaximaDias } = configuracionDe(contexto);

  switch (campo) {
    case 'fecha': {
      if (!fecha) return 'Indica la fecha de la reserva.';
      if (!fechaReal(fecha)) return 'Escribe una fecha válida (AAAA-MM-DD).';
      if (fecha < hoyISO()) return 'Esa fecha ya pasó. Elige hoy o un día posterior.';
      const maxima = fechaMaximaReserva({ anticipacionMaximaDias });
      if (fecha > maxima)
        return `Puedes reservar con hasta ${anticipacionMaximaDias} ${Number(anticipacionMaximaDias) === 1 ? 'día' : 'días'} de anticipación (hasta el ${formatearFecha(maxima)}).`;
      if (desdeISO(fecha).getDay() === 0) return 'Los domingos el laboratorio está cerrado. Elige de lunes a sábado.';
      return null;
    }

    case 'horaInicio':
      if (!horaInicio) return 'Indica la hora de inicio.';
      if (!FORMATO_HORA.test(horaInicio)) return 'Escribe la hora de inicio con el formato HH:MM.';
      if (horaInicio < horaApertura || horaInicio >= horaCierre)
        return `El laboratorio atiende de ${horaApertura} a ${horaCierre}. Elige una hora dentro de ese rango.`;
      return null;

    case 'horaFin': {
      if (!horaFin) return 'Indica la hora de fin.';
      if (!FORMATO_HORA.test(horaFin)) return 'Escribe la hora de fin con el formato HH:MM.';
      if (horaInicio && horaFin <= horaInicio) return `La hora de fin debe ser posterior a la de inicio (${horaInicio}).`;
      if (horaFin > horaCierre) return `El laboratorio cierra a las ${horaCierre}. Elige una hora de fin anterior.`;
      if (horaInicio && FORMATO_HORA.test(horaInicio)) {
        const maximoMinutos = Number(duracionMaximaHoras) * 60;
        if (minutosDelDia(horaFin) - minutosDelDia(horaInicio) > maximoMinutos) {
          const finMaximo = horaDesdeMinutos(Math.min(minutosDelDia(horaInicio) + maximoMinutos, minutosDelDia(horaCierre)));
          return `Una reserva puede durar hasta ${duracionMaximaHoras} h. Elige una hora de fin hasta las ${finMaximo}.`;
        }
      }
      return null;
    }

    case 'horario': {
      // Solo se revisa el choque cuando fecha y horas ya son válidas por separado.
      if (['fecha', 'horaInicio', 'horaFin'].some((c) => validarCampo(c, valores, contexto))) return null;
      const dia = desdeISO(fecha).getDay();
      const codigo = contexto.laboratorio.codigo;
      const clase = contexto.clases.find(
        (c) => c.lab === codigo && c.dia === dia && c.inicio < horaFin && horaInicio < c.fin,
      );
      if (clase)
        return `Ese horario choca con ${clase.sigla} ${clase.grupo} (${DIAS[dia].toLowerCase()} ${clase.inicio}–${clase.fin}). Elige otra hora.`;
      const reserva = contexto.reservas.find(
        (r) => r.lab === codigo && r.fecha === fecha && r.horaInicio < horaFin && horaInicio < r.horaFin,
      );
      if (reserva)
        return `Ya hay una reserva en este laboratorio de ${reserva.horaInicio} a ${reserva.horaFin} ese día. Elige otra hora.`;
      return null;
    }

    case 'tipo':
      if (!tipo) return 'Elige el tipo de reserva.';
      if (!TIPOS_RESERVA.some((t) => t.valor === tipo)) return 'Elige un tipo de reserva de la lista.';
      return null;

    case 'motivo': {
      const largo = motivo.trim().length;
      if (largo === 0) return `Cuéntanos el motivo de la reserva (mínimo ${MOTIVO_MINIMO} caracteres).`;
      if (largo < MOTIVO_MINIMO) return `Escribe al menos ${MOTIVO_MINIMO} caracteres (llevas ${largo}).`;
      if (largo > MOTIVO_MAXIMO) return `El motivo puede tener hasta ${MOTIVO_MAXIMO} caracteres (llevas ${largo}).`;
      return null;
    }

    default:
      return null;
  }
}

// Valida la reserva completa. Devuelve { campo: mensaje } (vacío si todo está bien).
// La clave «general» se usa para errores que no son de un campo (lab en mantenimiento).
export function validarReserva(valores, contexto) {
  const errores = {};
  if (contexto.laboratorio.estado === 'MANTENIMIENTO') {
    errores.general = `El laboratorio ${contexto.laboratorio.codigo} está en mantenimiento y no recibe reservas.`;
  }
  ORDEN_CAMPOS.forEach((campo) => {
    const mensaje = validarCampo(campo, valores, contexto);
    if (mensaje) errores[campo] = mensaje;
  });
  return errores;
}
