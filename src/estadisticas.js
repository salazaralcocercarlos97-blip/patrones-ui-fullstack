// Cálculos del panel del encargado (Panel de control y Reportes), hechos con los datos ya
// cargados en el navegador: laboratorios, clases, reservas y configuración.
//
// Ocupación semanal de un laboratorio =
//   (horas de clase por semana + horas reservadas en los próximos 7 días)
//   ÷ horas de atención de la semana (6 días × horario configurado, ej. 07:00–22:45 = 94,5 h).
// Se usa «los próximos 7 días» como semana de referencia porque contiene cada día hábil una vez.
import { CONFIGURACION_POR_DEFECTO, DIAS, TIPOS_RESERVA, desdeISO, hoyISO, minutosDelDia, sumarDias } from './data.js';

export const DIAS_HABILES = [1, 2, 3, 4, 5, 6];

export function horas(inicio, fin) {
  return (minutosDelDia(fin) - minutosDelDia(inicio)) / 60;
}

const formatoHoras = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 });
export function formatearHoras(valor) {
  return `${formatoHoras.format(valor)} h`;
}

export function horasAtencionPorDia(configuracion = CONFIGURACION_POR_DEFECTO) {
  return Math.max(0, horas(configuracion.horaApertura, configuracion.horaCierre));
}

export function reservasProximos7Dias(reservas, hoy = hoyISO()) {
  const limite = sumarDias(hoy, 7);
  return reservas.filter((r) => r.fecha >= hoy && r.fecha < limite);
}

// Una fila por laboratorio: horas de clase, horas reservadas, horas disponibles y porcentaje.
export function ocupacionPorLaboratorio({ laboratorios, clases, reservas, configuracion }) {
  const disponibles = horasAtencionPorDia(configuracion) * DIAS_HABILES.length;
  const semana = reservasProximos7Dias(reservas);
  return laboratorios.map((lab) => {
    const horasClase = clases.filter((c) => c.lab === lab.codigo).reduce((suma, c) => suma + horas(c.inicio, c.fin), 0);
    const horasReserva = semana
      .filter((r) => r.lab === lab.codigo)
      .reduce((suma, r) => suma + horas(r.horaInicio, r.horaFin), 0);
    const ocupadas = horasClase + horasReserva;
    return {
      codigo: lab.codigo,
      estado: lab.estado,
      horasClase,
      horasReserva,
      ocupadas,
      disponibles,
      porcentaje: disponibles > 0 ? Math.min(100, Math.round((ocupadas / disponibles) * 100)) : 0,
    };
  });
}

export function promedio(valores) {
  if (valores.length === 0) return 0;
  return Math.round(valores.reduce((suma, valor) => suma + valor, 0) / valores.length);
}

export function reservasPorTipo(reservas) {
  return TIPOS_RESERVA.map((tipo) => ({
    clave: tipo.valor,
    etiqueta: tipo.etiqueta,
    valor: reservas.filter((r) => r.tipo === tipo.valor).length,
  }));
}

export function reservasPorLaboratorio(reservas, laboratorios) {
  return laboratorios.map((lab) => ({
    clave: lab.codigo,
    etiqueta: `Lab ${lab.codigo}`,
    valor: reservas.filter((r) => r.lab === lab.codigo).length,
  }));
}

// Una fila por día hábil (lunes a sábado), sumando todos los laboratorios.
export function ocupacionPorDia({ laboratorios, clases, reservas, configuracion }) {
  const disponiblesPorDia = horasAtencionPorDia(configuracion) * laboratorios.length;
  const semana = reservasProximos7Dias(reservas);
  const codigos = new Set(laboratorios.map((lab) => lab.codigo));
  return DIAS_HABILES.map((dia) => {
    const clasesDia = clases.filter((c) => c.dia === dia && codigos.has(c.lab));
    const reservasDia = semana.filter((r) => desdeISO(r.fecha).getDay() === dia && codigos.has(r.lab));
    const horasClase = clasesDia.reduce((suma, c) => suma + horas(c.inicio, c.fin), 0);
    const horasReserva = reservasDia.reduce((suma, r) => suma + horas(r.horaInicio, r.horaFin), 0);
    return {
      dia,
      nombre: DIAS[dia],
      clases: clasesDia.length,
      horasClase,
      reservas: reservasDia.length,
      horasReserva,
      disponibles: disponiblesPorDia,
      porcentaje: disponiblesPorDia > 0 ? Math.min(100, Math.round(((horasClase + horasReserva) / disponiblesPorDia) * 100)) : 0,
    };
  });
}
