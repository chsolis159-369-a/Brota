/**
 * Pestañas del prototipo, en orden. Íconos: SF Symbols (iOS) y Material Symbols (Android); el prototipo no
 * tiene íconos (D-16). De línea, con la misma idea en las dos plataformas y un peso visual parejo (D-33).
 */
export const PESTANAS = [
  { ruta: 'index', clave: 'hoy', sf: 'calendar', md: 'today' },
  { ruta: 'cultivos', clave: 'cultivos', sf: 'leaf', md: 'psychiatry' },
  { ruta: 'agente', clave: 'agente', sf: 'ellipsis.bubble', md: 'sms' },
  { ruta: 'aprender', clave: 'aprender', sf: 'graduationcap', md: 'school' },
  { ruta: 'plan', clave: 'plan', sf: 'rosette', md: 'workspace_premium' },
] as const;

/** Con un examen en curso, solo Aprender queda habilitada (como en el prototipo). */
export const PESTANA_EXAMEN = 'aprender';

export function pestanaDeshabilitada(ruta: string, examenEnCurso: boolean): boolean {
  return examenEnCurso && ruta !== PESTANA_EXAMEN;
}
