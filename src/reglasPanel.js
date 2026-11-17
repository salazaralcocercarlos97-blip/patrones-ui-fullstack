// Reglas de validación del panel del encargado, COMPARTIDAS entre frontend y backend:
// - Laboratorio (patrón «Formulario CRUD»): LaboratorioForm.jsx las usa para la validación en
//   línea y server/app.js las vuelve a aplicar en POST y PUT /api/laboratorios.
// - Configuración (patrón «Formulario de configuración»): ConfiguracionForm.jsx y
//   PUT /api/configuracion.
// Los valores pueden llegar como texto (formulario) o como número (JSON de la API): por eso
// todo se convierte a texto antes de revisarlo. JavaScript puro, sin JSX, para que Node lo importe.
import { FORMATO_HORA } from './reglas.js';

// ---------- Laboratorio ----------

export const FORMATO_CODIGO_LAB = /^236-\d{2}$/;
export const CAPACIDAD_MINIMA = 1;
export const CAPACIDAD_MAXIMA = 100;
export const UBICACION_MAXIMA = 80;
export const DESCRIPCION_MINIMA = 10;
export const DESCRIPCION_MAXIMA = 300;
export const MOTIVO_MANTENIMIENTO_MINIMO = 10;
export const MOTIVO_MANTENIMIENTO_MAXIMO = 200;
export const SOFTWARE_MAXIMO = 15;
export const NOMBRE_SOFTWARE_MAXIMO = 40;

export const ESTADOS_LAB = [
  { valor: 'DISPONIBLE', etiqueta: 'Disponible' },
  { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento' },
];

export const ORDEN_CAMPOS_LAB = ['codigo', 'capacidad', 'estado', 'ubicacion', 'motivoMantenimiento', 'descripcion', 'software'];

function comoTexto(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

// «VS Code, Git ,  Python» → ['VS Code', 'Git', 'Python']. También acepta un arreglo.
export function separarSoftware(valor) {
  const lista = Array.isArray(valor) ? valor : comoTexto(valor).split(',');
  return lista.map((nombre) => comoTexto(nombre)).filter(Boolean);
}

// contexto = { codigosExistentes: ['236-41', …], esNuevo: true|false }
export function validarCampoLaboratorio(campo, valores, contexto = {}) {
  const { codigosExistentes = [], esNuevo = true } = contexto;

  switch (campo) {
    case 'codigo': {
      const codigo = comoTexto(valores.codigo);
      if (!esNuevo) return null; // el código no se cambia al editar
      if (!codigo) return 'Indica el código del laboratorio (por ejemplo, 236-47).';
      if (!FORMATO_CODIGO_LAB.test(codigo)) return 'Usa el formato 236-NN: «236-», un guion y dos dígitos (por ejemplo, 236-47).';
      if (codigosExistentes.includes(codigo)) return `Ya existe un laboratorio con el código ${codigo}. Elige otro número.`;
      return null;
    }

    case 'capacidad': {
      const texto = comoTexto(valores.capacidad);
      if (!texto) return 'Indica cuántas PCs de estudiante tiene.';
      if (!/^\d+$/.test(texto)) return 'Escribe un número entero, sin decimales.';
      const capacidad = Number(texto);
      if (capacidad < CAPACIDAD_MINIMA || capacidad > CAPACIDAD_MAXIMA)
        return `La capacidad debe estar entre ${CAPACIDAD_MINIMA} y ${CAPACIDAD_MAXIMA} PCs.`;
      return null;
    }

    case 'estado':
      if (!ESTADOS_LAB.some((estado) => estado.valor === valores.estado)) return 'Elige el estado del laboratorio.';
      return null;

    case 'ubicacion': {
      const largo = comoTexto(valores.ubicacion).length;
      if (largo === 0) return 'Indica dónde está el laboratorio (por ejemplo, Módulo 236, 4to piso).';
      if (largo > UBICACION_MAXIMA) return `La ubicación puede tener hasta ${UBICACION_MAXIMA} caracteres (llevas ${largo}).`;
      return null;
    }

    case 'descripcion': {
      const largo = comoTexto(valores.descripcion).length;
      if (largo === 0) return `Describe el laboratorio en una o dos frases (mínimo ${DESCRIPCION_MINIMA} caracteres).`;
      if (largo < DESCRIPCION_MINIMA) return `Escribe al menos ${DESCRIPCION_MINIMA} caracteres (llevas ${largo}).`;
      if (largo > DESCRIPCION_MAXIMA) return `La descripción puede tener hasta ${DESCRIPCION_MAXIMA} caracteres (llevas ${largo}).`;
      return null;
    }

    case 'motivoMantenimiento': {
      if (valores.estado !== 'MANTENIMIENTO') return null;
      const largo = comoTexto(valores.motivoMantenimiento).length;
      if (largo === 0) return 'Explica por qué está en mantenimiento: los estudiantes verán este motivo.';
      if (largo < MOTIVO_MANTENIMIENTO_MINIMO) return `Escribe al menos ${MOTIVO_MANTENIMIENTO_MINIMO} caracteres (llevas ${largo}).`;
      if (largo > MOTIVO_MANTENIMIENTO_MAXIMO)
        return `El motivo puede tener hasta ${MOTIVO_MANTENIMIENTO_MAXIMO} caracteres (llevas ${largo}).`;
      return null;
    }

    case 'software': {
      const lista = separarSoftware(valores.software);
      if (lista.length === 0) return 'Escribe al menos un programa. Separa varios con comas.';
      if (lista.length > SOFTWARE_MAXIMO) return `Puedes registrar hasta ${SOFTWARE_MAXIMO} programas (llevas ${lista.length}).`;
      const largo = lista.find((nombre) => nombre.length > NOMBRE_SOFTWARE_MAXIMO);
      if (largo) return `«${largo.slice(0, 20)}…» es muy largo: cada programa puede tener hasta ${NOMBRE_SOFTWARE_MAXIMO} caracteres.`;
      const vistos = new Set();
      const repetido = lista.find((nombre) => {
        const clave = nombre.toLowerCase();
        if (vistos.has(clave)) return true;
        vistos.add(clave);
        return false;
      });
      if (repetido) return `«${repetido}» está repetido. Escríbelo una sola vez.`;
      return null;
    }

    default:
      return null;
  }
}

// Valida el laboratorio completo. Devuelve { campo: mensaje } (vacío si todo está bien).
export function validarLaboratorio(valores, contexto) {
  const errores = {};
  ORDEN_CAMPOS_LAB.forEach((campo) => {
    const mensaje = validarCampoLaboratorio(campo, valores, contexto);
    if (mensaje) errores[campo] = mensaje;
  });
  return errores;
}

// Datos ya validados → objeto limpio, igual al que devuelve la API.
export function normalizarLaboratorio(valores) {
  const estado = valores.estado;
  return {
    codigo: comoTexto(valores.codigo),
    capacidad: Number(comoTexto(valores.capacidad)),
    estado,
    ubicacion: comoTexto(valores.ubicacion),
    descripcion: comoTexto(valores.descripcion),
    motivoMantenimiento: estado === 'MANTENIMIENTO' ? comoTexto(valores.motivoMantenimiento) : null,
    software: separarSoftware(valores.software),
  };
}

// ---------- Configuración de las reservas ----------

export const DURACION_MINIMA_HORAS = 1;
export const DURACION_MAXIMA_HORAS = 8;
export const ANTICIPACION_MINIMA_DIAS = 1;
export const ANTICIPACION_MAXIMA_DIAS = 180;

export const ORDEN_CAMPOS_CONFIGURACION = ['horaApertura', 'horaCierre', 'duracionMaximaHoras', 'anticipacionMaximaDias'];

function validarEntero(texto, minimo, maximo, unidad) {
  if (!texto) return `Indica un número de ${unidad}, entre ${minimo} y ${maximo}.`;
  if (!/^\d+$/.test(texto)) return 'Escribe un número entero, sin decimales.';
  const numero = Number(texto);
  if (numero < minimo || numero > maximo) return `Debe estar entre ${minimo} y ${maximo} ${unidad}.`;
  return null;
}

export function validarCampoConfiguracion(campo, valores) {
  const horaApertura = comoTexto(valores.horaApertura);
  const horaCierre = comoTexto(valores.horaCierre);

  switch (campo) {
    case 'horaApertura':
      if (!horaApertura) return 'Indica la hora de apertura.';
      if (!FORMATO_HORA.test(horaApertura)) return 'Escribe la hora con el formato HH:MM (por ejemplo, 07:00).';
      return null;

    case 'horaCierre':
      if (!horaCierre) return 'Indica la hora de cierre.';
      if (!FORMATO_HORA.test(horaCierre)) return 'Escribe la hora con el formato HH:MM (por ejemplo, 22:45).';
      if (FORMATO_HORA.test(horaApertura) && horaCierre <= horaApertura)
        return `La hora de cierre debe ser posterior a la de apertura (${horaApertura}).`;
      return null;

    case 'duracionMaximaHoras':
      return validarEntero(comoTexto(valores.duracionMaximaHoras), DURACION_MINIMA_HORAS, DURACION_MAXIMA_HORAS, 'horas');

    case 'anticipacionMaximaDias':
      return validarEntero(
        comoTexto(valores.anticipacionMaximaDias),
        ANTICIPACION_MINIMA_DIAS,
        ANTICIPACION_MAXIMA_DIAS,
        'días',
      );

    default:
      return null;
  }
}

export function validarConfiguracion(valores) {
  const errores = {};
  ORDEN_CAMPOS_CONFIGURACION.forEach((campo) => {
    const mensaje = validarCampoConfiguracion(campo, valores);
    if (mensaje) errores[campo] = mensaje;
  });
  return errores;
}

export function normalizarConfiguracion(valores) {
  return {
    horaApertura: comoTexto(valores.horaApertura),
    horaCierre: comoTexto(valores.horaCierre),
    duracionMaximaHoras: Number(comoTexto(valores.duracionMaximaHoras)),
    anticipacionMaximaDias: Number(comoTexto(valores.anticipacionMaximaDias)),
  };
}
