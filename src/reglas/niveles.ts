import { MAESTRO_REQUIERE_EXAMEN } from './dominio';

/** Niveles del prototipo por puntos totales. Maestro exige además el Examen final. */
export const NIVELES = [
  { min: 0, t: 'Inexperto' },
  { min: 60, t: 'Aprendiz' },
  { min: 180, t: 'Aprendiz avanzado' },
  { min: 350, t: 'Cultivador' },
  { min: 600, t: 'Cultivador experto' },
  { min: 900, t: 'Maestro de cultivo' },
] as const;

export type Nivel = (typeof NIVELES)[number];

const ULTIMO = NIVELES.length - 1;

/** Índice del nivel que corresponde solo por puntos. */
export const nivelIdx = (pts: number): number => NIVELES.reduce((idx, n, k) => (pts >= n.min ? k : idx), 0);

/** Último nivel alcanzable: sin el final aprobado, el tope es Cultivador experto. */
export const topeNivel = (finalAprobado: boolean): number =>
  MAESTRO_REQUIERE_EXAMEN && !finalAprobado ? ULTIMO - 1 : ULTIMO;

export const nivelActual = (pts: number, finalAprobado: boolean): Nivel =>
  NIVELES[Math.min(nivelIdx(pts), topeNivel(finalAprobado))]!;

export const siguienteNivel = (pts: number, finalAprobado: boolean): Nivel | undefined =>
  NIVELES[Math.min(nivelIdx(pts), topeNivel(finalAprobado)) + 1];

/** Tiene los puntos de Maestro pero le falta el Examen final. */
export const maestroPendiente = (pts: number, finalAprobado: boolean): boolean =>
  MAESTRO_REQUIERE_EXAMEN && nivelIdx(pts) === ULTIMO && !finalAprobado;

/** Nivel al que corresponden unos puntos, sin tope (para "Se desbloquea al llegar a…"). */
export const nivelPorPuntos = (pts: number): Nivel => NIVELES[nivelIdx(pts)]!;

export type MensajeNivel =
  | { tipo: 'pendiente' }
  | { tipo: 'faltan'; puntos: number; nivel: string; hastaMaestro: boolean }
  | { tipo: 'maximo' };

/** Datos de la tarjeta de nivel de Aprender: nivel, barra y mensaje. */
export function progresoNivel(pts: number, finalAprobado: boolean) {
  const idx = Math.min(nivelIdx(pts), topeNivel(finalAprobado));
  const nivel = NIVELES[idx]!;
  const prox = NIVELES[idx + 1];
  const pend = maestroPendiente(pts, finalAprobado);
  const pct = prox && !pend ? Math.round(((pts - nivel.min) / (prox.min - nivel.min)) * 100) : 100;
  const mensaje: MensajeNivel = pend
    ? { tipo: 'pendiente' }
    : prox
      ? { tipo: 'faltan', puntos: prox.min - pts, nivel: prox.t, hastaMaestro: idx + 1 === ULTIMO && MAESTRO_REQUIERE_EXAMEN }
      : { tipo: 'maximo' };
  return { idx, nivel, pct, mensaje };
}
