import type { Etapa } from './dominio';

/** PPFD recomendado por etapa (µmol/m²/s). Cosecha no tiene rango. */
export const PPFD: Partial<Record<Etapa, readonly [number, number]>> = {
  Siembra: [150, 300],
  Crecimiento: [300, 600],
  Floración: [500, 900],
};

/** Zona orientativa de VPD en kPa. */
export const ZONA_VPD = [0.8, 1.2] as const;

/** Altura mínima de la lámpara sobre la planta, en cm. */
export const ALTURA_MINIMA = 20;

export type EvaluacionPPFD = { estado: 'poca' | 'mucha' | 'ok'; min: number; max: number };

export function evaluarPPFD(etapa: Etapa, v: number | null): EvaluacionPPFD | null {
  const r = PPFD[etapa];
  if (!r || v === null) return null;
  const [min, max] = r;
  return { estado: v < min ? 'poca' : v > max ? 'mucha' : 'ok', min, max };
}

export function evaluarAltura(a: number | null): { ok: boolean } | null {
  if (a === null) return null;
  return { ok: a >= ALTURA_MINIMA };
}

/** Déficit de presión de vapor en kPa, con 2 decimales (fórmula del prototipo). */
export function vpd(t: number | null, h: number | null): number | null {
  if (t === null || h === null) return null;
  return +(0.61078 * Math.exp((17.27 * t) / (t + 237.3)) * (1 - h / 100)).toFixed(2);
}

/**
 * Número de un campo de texto, como num() del prototipo (parseFloat), aceptando coma decimal
 * porque el teclado numérico en español la usa. Vacío o inválido: null.
 */
export function numero(v: string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).trim().replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}
