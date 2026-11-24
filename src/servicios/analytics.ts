/**
 * Eventos de producto (CLAUDE.md > Métricas). En H6 se conecta PostHog; hasta entonces los eventos
 * van a los receptores registrados (en desarrollo, la consola; en pruebas, una lista).
 */
export const EVENTOS = [
  'onboarding_completo',
  'cultivo_creado',
  'registro_creado',
  'modulo_test_fin',
  'examen_inicio',
  'examen_fin',
  'paywall_visto',
  'trial_iniciado',
  'compra_ok',
] as const;

export type Evento = (typeof EVENTOS)[number];
export type Propiedades = Record<string, string | number | boolean | null>;
type Receptor = (evento: Evento, props: Propiedades) => void;

const receptores = new Set<Receptor>();

export function registrarEvento(evento: Evento, props: Propiedades = {}): void {
  for (const r of receptores) {
    try {
      r(evento, props);
    } catch {
      // Un receptor que falla no debe romper la app.
    }
  }
}

/** Agrega un receptor y devuelve la función para quitarlo. */
export function escucharEventos(r: Receptor): () => void {
  receptores.add(r);
  return () => receptores.delete(r);
}
