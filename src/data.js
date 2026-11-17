// Datos iniciales de la demo: el servidor los usa para llenar la base SQLite la primera vez
// y el frontend los usa como respaldo si el servidor no responde.
// Capacidades y clases basadas en la oferta 2/2026 de los labs 236-41 a 236-46.
// Descripciones, software y equipamiento son ilustrativos.

export const SEMESTRE = '2/2026';

// Configuración por defecto de las reservas (patrón «Formulario de configuración»).
// El servidor la guarda en la tabla «configuracion»; sin servidor se usan estos valores.
export const CONFIGURACION_POR_DEFECTO = {
  horaApertura: '07:00',
  horaCierre: '22:45',
  duracionMaximaHoras: 4,
  anticipacionMaximaDias: 60,
};

// Índice 1 = lunes … 6 = sábado (igual que dia_semana en la base de datos).
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const TIPOS_RESERVA = [
  { valor: 'EXAMEN', etiqueta: 'Examen' },
  { valor: 'PRACTICA', etiqueta: 'Práctica' },
  { valor: 'RECUPERACION', etiqueta: 'Recuperación' },
  { valor: 'EVENTO', etiqueta: 'Evento' },
];

export const laboratorios = [
  {
    codigo: '236-41',
    capacidad: 44,
    estado: 'DISPONIBLE',
    ubicacion: 'Módulo 236, 4to piso',
    descripcion: 'Laboratorio de uso general con la mayor carga de clases del piso: programación, bases de datos y ensamblador.',
    software: ['Visual Studio Code', 'NetBeans', 'PostgreSQL', 'Python 3', 'emu8086'],
  },
  {
    codigo: '236-42',
    capacidad: 40,
    estado: 'MANTENIMIENTO',
    motivoMantenimiento: 'Reemplazo de las PCs 41 y 42, dadas de baja.',
    ubicacion: 'Módulo 236, 4to piso',
    descripcion: 'Usado por las materias de ingeniería de software y talleres de grado.',
    software: ['Visual Studio Code', 'StarUML', 'PostgreSQL', 'Git'],
  },
  {
    codigo: '236-43',
    capacidad: 25,
    estado: 'DISPONIBLE',
    ubicacion: 'Módulo 236, 4to piso',
    descripcion: 'El laboratorio más pequeño del piso. Ideal para grupos reducidos de redes y auditoría.',
    software: ['Packet Tracer', 'Wireshark', 'Visual Studio Code', 'QGIS'],
  },
  {
    codigo: '236-44',
    capacidad: 40,
    estado: 'DISPONIBLE',
    ubicacion: 'Módulo 236, 4to piso',
    descripcion: 'Laboratorio de Programación I y Tecnología Web por las mañanas.',
    software: ['Visual Studio Code', 'Node.js', 'PHP', 'PostgreSQL', 'Git'],
  },
  {
    codigo: '236-45',
    capacidad: 44,
    estado: 'DISPONIBLE',
    ubicacion: 'Módulo 236, 4to piso',
    descripcion: 'Laboratorio amplio para materias introductorias, compiladores y computación gráfica.',
    software: ['Visual Studio Code', 'Python 3', 'SWI-Prolog', 'Blender'],
  },
  {
    codigo: '236-46',
    capacidad: 40,
    estado: 'DISPONIBLE',
    ubicacion: 'Módulo 236, 4to piso',
    descripcion: 'Laboratorio para arquitectura del software, inteligencia artificial y sistemas operativos.',
    software: ['Visual Studio Code', 'Python 3', 'Jupyter', 'VirtualBox'],
  },
];

// Clases de ejemplo: dia 1 = lunes … 6 = sábado.
export const clases = [
  // 236-41
  { id: 'c01', lab: '236-41', sigla: 'INF221', materia: 'Programación Ensamblador', grupo: 'SA', docente: 'Vallet Vallet Corrado', dia: 1, inicio: '07:00', fin: '08:30' },
  { id: 'c02', lab: '236-41', sigla: 'INF312', materia: 'Bases de Datos I', grupo: 'SA', docente: 'Veizaga Gonzales Josué Obed', dia: 1, inicio: '08:30', fin: '10:00' },
  { id: 'c03', lab: '236-41', sigla: 'INF513', materia: 'Tecnología Web', grupo: 'SA', docente: 'Balcázar Veizaga Evans', dia: 1, inicio: '15:15', fin: '16:45' },
  { id: 'c04', lab: '236-41', sigla: 'INF120', materia: 'Programación I', grupo: 'SB', docente: 'Mollo Mamani Alberto', dia: 2, inicio: '07:00', fin: '09:15' },
  { id: 'c05', lab: '236-41', sigla: 'INF342', materia: 'Sistemas de Información I', grupo: 'SA', docente: 'Garzón Cuéllar Angélica', dia: 2, inicio: '09:15', fin: '11:30' },
  { id: 'c06', lab: '236-41', sigla: 'INF513', materia: 'Tecnología Web', grupo: 'SA', docente: 'Balcázar Veizaga Evans', dia: 3, inicio: '15:15', fin: '16:45' },
  { id: 'c07', lab: '236-41', sigla: 'MAT101', materia: 'Cálculo I', grupo: 'Z2', docente: 'Abarca Sota Nancy', dia: 4, inicio: '09:15', fin: '11:30' },
  { id: 'c08', lab: '236-41', sigla: 'INF110', materia: 'Introducción a la Informática', grupo: 'SZ', docente: 'Contreras Villegas Juan Carlos Alberto', dia: 5, inicio: '07:00', fin: '08:30' },
  // 236-42 (en mantenimiento)
  { id: 'c09', lab: '236-42', sigla: 'INF422', materia: 'Ingeniería de Software I', grupo: 'SB', docente: 'Martínez Canedo Rolando Antonio', dia: 1, inicio: '15:15', fin: '16:45' },
  { id: 'c10', lab: '236-42', sigla: 'INF512', materia: 'Ingeniería de Software II', grupo: 'SB', docente: 'Martínez Canedo Rolando Antonio', dia: 2, inicio: '18:15', fin: '20:30' },
  { id: 'c11', lab: '236-42', sigla: 'INF511', materia: 'Taller de Grado I', grupo: 'SA', docente: 'Martínez Canedo Rolando Antonio', dia: 4, inicio: '20:30', fin: '22:45' },
  // 236-43
  { id: 'c12', lab: '236-43', sigla: 'RDS210', materia: 'Análisis de Circuitos', grupo: 'SB', docente: 'Monrroy Dipp Víctor Fernando', dia: 1, inicio: '07:00', fin: '08:30' },
  { id: 'c13', lab: '236-43', sigla: 'INF110', materia: 'Introducción a la Informática', grupo: 'SS', docente: 'Zuna Villagómez Ricardo', dia: 1, inicio: '16:45', fin: '18:15' },
  { id: 'c14', lab: '236-43', sigla: 'INF220', materia: 'Estructura de Datos I', grupo: 'SA', docente: 'López Winnipeg Mario Milton', dia: 2, inicio: '07:00', fin: '09:15' },
  { id: 'c15', lab: '236-43', sigla: 'RDS511', materia: 'Gestión y Administración de Redes', grupo: 'SA', docente: 'Vargas Peña Leonardo', dia: 3, inicio: '08:30', fin: '10:00' },
  { id: 'c16', lab: '236-43', sigla: 'INF462', materia: 'Auditoría Informática', grupo: 'SA', docente: 'Vargas Peña Leonardo', dia: 3, inicio: '10:00', fin: '11:30' },
  { id: 'c17', lab: '236-43', sigla: 'INF442', materia: 'Sistemas de Información Geográfica', grupo: 'SA', docente: 'Pérez Ferreira Ubaldo', dia: 5, inicio: '18:15', fin: '19:45' },
  // 236-44
  { id: 'c18', lab: '236-44', sigla: 'INF120', materia: 'Programación I', grupo: 'SA', docente: 'Balcázar Veizaga Evans', dia: 1, inicio: '07:00', fin: '08:30' },
  { id: 'c19', lab: '236-44', sigla: 'INF513', materia: 'Tecnología Web', grupo: 'SC', docente: 'Balcázar Veizaga Evans', dia: 2, inicio: '07:00', fin: '09:15' },
  { id: 'c20', lab: '236-44', sigla: 'INF120', materia: 'Programación I', grupo: 'SA', docente: 'Balcázar Veizaga Evans', dia: 3, inicio: '07:00', fin: '08:30' },
  { id: 'c21', lab: '236-44', sigla: 'INF513', materia: 'Tecnología Web', grupo: 'SC', docente: 'Balcázar Veizaga Evans', dia: 4, inicio: '07:00', fin: '09:15' },
  { id: 'c22', lab: '236-44', sigla: 'INF210', materia: 'Programación II', grupo: 'SD', docente: 'López Negretty Mary Dunnia', dia: 4, inicio: '18:15', fin: '20:30' },
  { id: 'c23', lab: '236-44', sigla: 'INF120', materia: 'Programación I', grupo: 'SA', docente: 'Balcázar Veizaga Evans', dia: 5, inicio: '07:00', fin: '08:30' },
  // 236-45
  { id: 'c24', lab: '236-45', sigla: 'INF110', materia: 'Introducción a la Informática', grupo: 'SB', docente: 'Zuna Villagómez Ricardo', dia: 1, inicio: '10:00', fin: '11:30' },
  { id: 'c25', lab: '236-45', sigla: 'INF310', materia: 'Estructuras de Datos II', grupo: 'SX', docente: 'Vargas Yapura Edwin', dia: 2, inicio: '20:30', fin: '22:45' },
  { id: 'c26', lab: '236-45', sigla: 'INF329', materia: 'Compiladores', grupo: 'SA', docente: 'Barroso Viruez Gino', dia: 3, inicio: '11:30', fin: '13:00' },
  { id: 'c27', lab: '236-45', sigla: 'INF318', materia: 'Programación Lógica y Funcional', grupo: 'SA', docente: 'Barroso Viruez Gino', dia: 4, inicio: '18:15', fin: '20:30' },
  { id: 'c28', lab: '236-45', sigla: 'ELC102', materia: 'Programación Gráfica', grupo: 'SA', docente: 'Peinado Pereira Miguel Jesús', dia: 6, inicio: '08:30', fin: '11:30' },
  // 236-46
  { id: 'c29', lab: '236-46', sigla: 'INF552', materia: 'Arquitectura del Software', grupo: 'SA', docente: 'Veizaga Gonzales Josué Obed', dia: 1, inicio: '07:00', fin: '08:30' },
  { id: 'c30', lab: '236-46', sigla: 'INF418', materia: 'Inteligencia Artificial', grupo: 'SA', docente: 'Vargas Yapura Edwin', dia: 2, inicio: '18:15', fin: '20:30' },
  { id: 'c31', lab: '236-46', sigla: 'INF120', materia: 'Programación I', grupo: 'SC', docente: 'Peinado Pereira Miguel Jesús', dia: 3, inicio: '16:45', fin: '18:15' },
  { id: 'c32', lab: '236-46', sigla: 'INF210', materia: 'Programación II', grupo: 'SC', docente: 'Contreras Villegas Juan Carlos Alberto', dia: 4, inicio: '07:00', fin: '09:15' },
  { id: 'c33', lab: '236-46', sigla: 'INF323', materia: 'Sistemas Operativos I', grupo: 'SC', docente: 'Barroso Viruez Gino', dia: 5, inicio: '08:30', fin: '10:00' },
];

// Las respuestas usan la configuración vigente (horario, duración y anticipación máximas).
export function crearPreguntasFrecuentes(configuracion = CONFIGURACION_POR_DEFECTO) {
  const { horaApertura, horaCierre, duracionMaximaHoras, anticipacionMaximaDias } = configuracion;
  return [
    {
      pregunta: '¿Con cuánta anticipación puedo reservar un laboratorio?',
      respuesta: `Puedes reservar desde hoy y hasta con ${anticipacionMaximaDias} ${anticipacionMaximaDias === 1 ? 'día' : 'días'} de anticipación, de lunes a sábado, entre las ${horaApertura} y las ${horaCierre}. Cada reserva puede durar hasta ${duracionMaximaHoras} h. El formulario no acepta fechas pasadas ni domingos.`,
    },
    {
      pregunta: '¿Puedo reservar en el horario de una clase?',
      respuesta:
        'No. Si el horario que eliges se cruza con una clase del laboratorio, el formulario te dice con qué materia choca. Revisa la pestaña Horario antes de elegir la hora.',
    },
    {
      pregunta: '¿Qué pasa si el laboratorio está en mantenimiento?',
      respuesta:
        'Mientras un laboratorio está en mantenimiento no recibe reservas. Su tarjeta lo indica con la etiqueta «Mantenimiento». Elige otro laboratorio disponible del piso.',
    },
    {
      pregunta: '¿Cómo cancelo una reserva?',
      respuesta:
        'Entra a «Mis reservas» y presiona «Cancelar reserva». Te pediremos confirmación antes de liberar el laboratorio, porque la cancelación no se puede deshacer.',
    },
  ];
}

// ---- Utilidades de fecha (formato local AAAA-MM-DD, sin desfase por zona horaria) ----

function dosDigitos(n) {
  return String(n).padStart(2, '0');
}

export function aISO(fecha) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

export function hoyISO() {
  return aISO(new Date());
}

export function desdeISO(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

const formatoFechaLarga = new Intl.DateTimeFormat('es-BO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatearFecha(iso) {
  return formatoFechaLarga.format(desdeISO(iso));
}

const formatoFechaCorta = new Intl.DateTimeFormat('es-BO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatearFechaCorta(iso) {
  return formatoFechaCorta.format(desdeISO(iso));
}

// Suma (o resta) días a una fecha ISO y devuelve otra fecha ISO.
export function sumarDias(iso, dias) {
  const fecha = desdeISO(iso);
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
}

// «07:30» → 450 minutos desde la medianoche.
export function minutosDelDia(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// 450 → «07:30».
export function horaDesdeMinutos(total) {
  return `${dosDigitos(Math.floor(total / 60))}:${dosDigitos(total % 60)}`;
}

// Dos reservas de ejemplo para que «Mis reservas» no empiece vacía.
// Las fechas se calculan desde hoy para que nunca queden en el pasado.
export function reservasDeEjemplo() {
  const fechaEn = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // sin domingos
    return aISO(d);
  };
  return [
      {
        id: 'ejemplo-1',
        lab: '236-44',
        fecha: fechaEn(2),
        horaInicio: '10:00',
        horaFin: '11:30',
        tipo: 'EXAMEN',
        motivo: 'Examen parcial de Programación I, grupo SA.',
      },
      {
        id: 'ejemplo-2',
        lab: '236-41',
        fecha: fechaEn(5),
        horaInicio: '13:00',
        horaFin: '14:30',
        tipo: 'PRACTICA',
        motivo: 'Práctica de consultas SQL para Bases de Datos I.',
      },
  ];
}
