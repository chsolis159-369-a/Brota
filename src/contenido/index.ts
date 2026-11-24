import datos from '@content/modulos.json';

import { CANNABIS_HABILITADO } from '@/config/flags';

import type { Contenido, Modulo, Pregunta, TerminoGlosario } from './tipos';

export type { Categoria, Contenido, Dificultad, Leccion, Modulo, Pregunta, TerminoGlosario } from './tipos';

/**
 * Contenido educativo tal cual viene del prototipo. La estructura la garantiza
 * `npm run lint:contenido`, así que acá solo se le da tipo.
 */
export const CONTENIDO = datos as unknown as Contenido;

/** Módulos visibles en esta versión: sin cannabis mientras CANNABIS_HABILITADO sea false. */
export const MODULOS: readonly Modulo[] = CONTENIDO.modulos.filter(
  (m) => m.cat !== 'cannabis' || CANNABIS_HABILITADO,
);

export const GLOSARIO: readonly TerminoGlosario[] = CONTENIDO.glosario;

export function moduloPorId(id: string): Modulo | undefined {
  return MODULOS.find((m) => m.id === id);
}

/** Las 7 preguntas de un módulo (quiz + banco). */
export function preguntasDe(m: Modulo): Pregunta[] {
  return [...m.quiz, ...m.banco];
}
