/** Pestañas del prototipo, en orden. Íconos: SF Symbols (iOS) y Material (Android); el prototipo no tiene íconos (D-16). */
export const PESTANAS = [
  { ruta: 'index', clave: 'hoy', sf: 'sun.max', md: 'today' },
  { ruta: 'cultivos', clave: 'cultivos', sf: 'leaf', md: 'eco' },
  { ruta: 'agente', clave: 'agente', sf: 'bubble.left.and.bubble.right', md: 'forum' },
  { ruta: 'aprender', clave: 'aprender', sf: 'book', md: 'menu_book' },
  { ruta: 'plan', clave: 'plan', sf: 'star', md: 'star' },
] as const;

/** Con un examen en curso, solo Aprender queda habilitada (como en el prototipo). */
export const PESTANA_EXAMEN = 'aprender';

export function pestanaDeshabilitada(ruta: string, examenEnCurso: boolean): boolean {
  return examenEnCurso && ruta !== PESTANA_EXAMEN;
}
