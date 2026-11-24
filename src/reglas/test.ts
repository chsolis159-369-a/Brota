import type { Dificultad, Modulo, Pregunta } from '@/contenido/tipos';

import { APROBAR_MODULO, BONUS_PERFECTO, PREGS_TEST } from './dominio';

/** Generador de números al azar en [0, 1). Inyectable para pruebas. */
export type Azar = () => number;

/** Mezcla de Fisher–Yates (barajar del prototipo). No modifica el arreglo original. */
export function barajar<T>(arr: readonly T[], azar: Azar = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Pregunta lista para mostrar: las 4 opciones mezcladas y el índice de la correcta. */
export type PreguntaArmada = {
  d: Dificultad;
  p: string;
  /** Las 4 opciones en el orden en que se muestran. */
  o: string[];
  /** Índice de la correcta en `o`. */
  r: number;
  e: string;
  mod: string;
};

/** Mezcla las opciones en cada aparición: la posición de la correcta no se puede memorizar. */
export function armarPregunta(q: Pregunta, mod: string, azar: Azar = Math.random): PreguntaArmada {
  const todas = barajar([{ t: q.ok, c: true }, ...q.no.map((t) => ({ t, c: false }))], azar);
  return { d: q.d, p: q.p, o: todas.map((x) => x.t), r: todas.findIndex((x) => x.c), e: q.e, mod };
}

/**
 * Test de módulo: una pregunta de cada dificultad (1, 2 y 3), sacada de las 7 del módulo y distinta
 * de las del intento anterior cuando hay otra disponible (armarTest del prototipo).
 */
export function armarTest(m: Modulo, vistasAntes: readonly string[] = [], azar: Azar = Math.random): PreguntaArmada[] {
  const pool = [...m.quiz, ...m.banco];
  return ([1, 2, 3] as const).map((d) => {
    const candidatas = pool.filter((q) => q.d === d);
    const nuevas = candidatas.filter((q) => !vistasAntes.includes(q.p));
    const base = nuevas.length ? nuevas : candidatas;
    const q = base[Math.floor(azar() * base.length)]!;
    return armarPregunta(q, m.id, azar);
  });
}

/** Puntos de un acierto: 10 × dificultad. */
export const puntosPregunta = (d: Dificultad): number => d * 10;

export type ResultadoTest = {
  aciertos: number;
  /** Puntos por aciertos, sin bonus. */
  puntos: number;
  /** +15 si todas fueron correctas. */
  bonus: number;
  /** puntos + bonus: lo que se compara con la mejor marca. */
  total: number;
  aprobado: boolean;
  perfecto: boolean;
};

/** Corrige un test a partir de las respuestas elegidas (índices) en el mismo orden que las preguntas. */
export function corregirTest(preguntas: readonly PreguntaArmada[], respuestas: readonly number[]): ResultadoTest {
  let aciertos = 0;
  let puntos = 0;
  preguntas.forEach((q, i) => {
    if (respuestas[i] === q.r) {
      aciertos++;
      puntos += puntosPregunta(q.d);
    }
  });
  const perfecto = aciertos === preguntas.length && preguntas.length === PREGS_TEST;
  const bonus = perfecto ? BONUS_PERFECTO : 0;
  return { aciertos, puntos, bonus, total: puntos + bonus, aprobado: aciertos >= APROBAR_MODULO, perfecto };
}

/** Mensaje del resultado según los aciertos (resultadoHTML del prototipo). */
export type MensajeResultado = 'perfecto' | 'aprobado' | 'unAcierto' | 'ninguno';

export function mensajeResultado(r: ResultadoTest): MensajeResultado {
  if (r.perfecto) return 'perfecto';
  if (r.aprobado) return 'aprobado';
  return r.aciertos === 1 ? 'unAcierto' : 'ninguno';
}

/** Estrellas de 0 a total, como el prototipo (★★☆). */
export const estrellas = (n: number, total = PREGS_TEST): string => {
  const k = Math.max(0, Math.min(total, Math.trunc(n)));
  return '★'.repeat(k) + '☆'.repeat(total - k);
};
