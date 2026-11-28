/** Tipos y constantes del dominio, compartidos por la app, la base y (H4) las Edge Functions. Sin dependencias. */

export const ETAPAS = ['Siembra', 'Crecimiento', 'Floración', 'Cosecha'] as const;
export type Etapa = (typeof ETAPAS)[number];

export const UBICACIONES = ['interior', 'exterior'] as const;
export type Ubicacion = (typeof UBICACIONES)[number];

export const TIPOS_REGISTRO = ['Riego', 'Fertilizante', 'Poda', 'Plaga', 'Observación'] as const;
export type TipoRegistro = (typeof TIPOS_REGISTRO)[number];

/** Forma de cultivar elegida en el onboarding. */
export const PERFILES = ['huerta', 'hidro', 'interior', 'exterior'] as const;
export type PerfilCultivo = (typeof PERFILES)[number];

export type Plan = 'gratis' | 'pro';

/* ---------- Constantes de puntaje del prototipo v9 ---------- */
export const PREGS_TEST = 3;
export const APROBAR_MODULO = 2;
export const BONUS_PERFECTO = 15;
export const TOPE_TAREAS_DIA = 40;
export const TOPE_REG_DIA = 5;
export const TOPE_MED_DIA = 2;
export const INTENTOS_DIA = 3;
export const APROBAR_EXAMEN = 0.8;
export const MAESTRO_REQUIERE_EXAMEN = true;
/** Cultivos propios en el plan Gratis (D-34: 3, pedido del usuario; el prototipo tenía 2). */
export const LIMITE_GRATIS = 3;
/** Preguntas por día al Agente en Gratis (D-34). El servidor aplica el mismo límite (LIMITE_DIARIO). */
export const PREGUNTAS_AGENTE_GRATIS = 6;

export const PTS_REGISTRO = 2;
export const PTS_MEDICION = 4;
/** Una pregunta de cada dificultad (10 + 20 + 30) más el bonus por test perfecto. */
export const MAX_PTS_MODULO = 60 + BONUS_PERFECTO;
