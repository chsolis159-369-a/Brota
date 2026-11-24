/**
 * Agente por reglas del prototipo (responder). Es el modo sin conexión hasta que el Agente con IA
 * (H5) esté disponible, y sus reglas se conservan en la IA: solo cultivo; nunca dosis, consumo ni
 * venta; ante un problema grave, consultar a un especialista; el historial del cultivo, solo en Pro.
 * Devuelve claves: los textos están en i18n (agente.respuestas.*).
 */
import type { Plan } from './dominio';
import { LLUVIA_DRENAJE } from './actividad';

export const REGLAS_AGENTE = [
  ['negativa', ['dosis', 'consumo', 'fumar', 'vender', 'venta']],
  ['amarillas', ['amarill']],
  ['plagas', ['plaga', 'pulgón', 'pulgon', 'araña', 'mosca', 'trips', 'oídio', 'oidio']],
  ['diagnostico', ['diagnóstic', 'diagnostic', 'mancha', 'puntas', 'quemad', 'marchit']],
  [
    'nutrientes',
    ['nutriente', 'fertiliz', 'npk', 'abono', 'carencia', 'deficiencia', 'nitrógeno', 'nitrogeno', 'fósforo', 'fosforo', 'potasio', 'calcio', 'magnesio', 'hierro'],
  ],
  ['inerte', ['inerte', 'perlita', 'vermiculita', 'coco', 'lana de roca', 'leca']],
  ['hidro', ['hidro', 'ph', 'ec', 'solución', 'solucion', 'nft', 'dwc']],
  ['dli', ['dli', 'integral de luz', 'horas de luz', 'fotoperiodo']],
  ['germinacion', ['germin', 'semilla', 'almácigo', 'almacigo', 'trasplant', 'endurec']],
  ['calendario', ['helada', 'frío', 'frio', 'calendario', 'cuándo sembrar', 'cuando sembrar', 'época de siembra', 'epoca de siembra']],
  ['huerta', ['huerta', 'compost', 'suelo', 'rotación', 'rotacion', 'asociación', 'asociacion', 'albahaca']],
  ['riego', ['riego', 'regar', 'agua']],
  ['luz', ['luz', 'luces', 'led', 'ppfd', 'altura']],
] as const;

export type ClaveRespuesta = (typeof REGLAS_AGENTE)[number][0] | 'masDatos';

/** Preguntas rápidas del prototipo. */
export const PREGUNTAS_RAPIDAS = ['Hojas amarillas', 'Plagas', 'Nutrientes', 'Sustrato inerte', 'Hidroponía y pH', 'Huerta y compost', 'Luz LED'] as const;

/**
 * Coincidencia por inicio de palabra. Las palabras de 3 letras o menos (y "venta") tienen que coincidir
 * completas: así "ec" no se activa con "perfecto" ni "venta" con "ventana".
 */
export function coincide(texto: string, palabra: string): boolean {
  const completa = palabra.length <= 3 || palabra === 'venta';
  return new RegExp('(^|[^a-záéíóúñ])' + palabra + (completa ? '($|[^a-záéíóúñ])' : '')).test(texto);
}

export type RespuestaAgente = {
  clave: ClaveRespuesta;
  /** Para 'masDatos': índice del consejo del día. */
  consejo?: number;
  /** Agregar el aviso de drenaje por lluvia prevista. */
  lluvia: boolean;
  /** Solo en Pro: cantidad de cultivos tenidos en cuenta. */
  cultivos?: number;
  /** Solo en Pro: último registro del primer cultivo. */
  ultimo?: { nombre: string; etapa: string; nota: string };
};

export function responder(
  pregunta: string,
  contexto: {
    plan: Plan;
    lluviaManana: number | null;
    /** Cultivos en el orden de la app (el primero es el más nuevo). */
    cultivos: readonly { nombre: string; etapa: string; ubicacion: string; ultimaNota: string | null }[];
    /** Cantidad de consejos disponibles y fecha, para elegir el del día. */
    totalConsejos: number;
    ahora?: Date;
  },
): RespuestaAgente {
  const x = pregunta.toLowerCase();
  const regla = REGLAS_AGENTE.find(([, palabras]) => palabras.some((w) => coincide(x, w)));
  const ahora = contexto.ahora ?? new Date();
  const r: RespuestaAgente = regla
    ? { clave: regla[0], lluvia: false }
    : { clave: 'masDatos', consejo: ahora.getDate() % contexto.totalConsejos, lluvia: false };
  r.lluvia =
    contexto.lluviaManana !== null && contexto.lluviaManana >= LLUVIA_DRENAJE && contexto.cultivos.some((c) => c.ubicacion === 'exterior');
  if (contexto.plan !== 'gratis' && contexto.cultivos.length) {
    r.cultivos = contexto.cultivos.length;
    const primero = contexto.cultivos[0]!;
    if (primero.ultimaNota) r.ultimo = { nombre: primero.nombre, etapa: primero.etapa, nota: primero.ultimaNota };
  }
  return r;
}
