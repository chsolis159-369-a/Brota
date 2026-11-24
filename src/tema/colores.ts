/**
 * Tokens de color del prototipo (variables CSS de :root), en claro y oscuro.
 *
 * Son los mismos valores del prototipo salvo tres ajustes para cumplir contraste AA (D-14):
 *  - claro.gold   #B8862B → #8A6420 (texto de puntos y estrellas: 3,0 → 4,95 sobre bg)
 *  - claro.muted  #66756B → #606E65 (texto secundario sobre accentSoft: 4,13 → 4,56)
 *  - oscuro.sobreAccent  #FFFFFF → #121A14 (texto de botones sobre accent: 1,95 → 9,08)
 * Las pruebas comparan estos valores con reference/brota-v9-prototipo.html y verifican el contraste.
 */
export type Colores = {
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  accent: string;
  accentSoft: string;
  border: string;
  alert: string;
  ok: string;
  gold: string;
  /** Texto sobre fondo accent (botones primarios, chips activos). */
  sobreAccent: string;
};

export const claro: Colores = {
  bg: '#F4F7F2',
  surface: '#FFFFFF',
  fg: '#1F2A22',
  muted: '#606E65',
  accent: '#2F6B3A',
  accentSoft: '#E3F0E5',
  border: '#D5DED6',
  alert: '#B5552B',
  ok: '#2F6B3A',
  gold: '#8A6420',
  sobreAccent: '#FFFFFF',
};

export const oscuro: Colores = {
  bg: '#121A14',
  surface: '#1B2620',
  fg: '#E6EDE7',
  muted: '#9AAA9E',
  accent: '#8CC79A',
  accentSoft: '#22332A',
  border: '#2E3D33',
  alert: '#E08B63',
  ok: '#8CC79A',
  gold: '#E0B45C',
  sobreAccent: '#121A14',
};

/** Ajustes respecto del prototipo, por modo. Las pruebas los usan para comparar. */
export const AJUSTES_AA = {
  claro: { gold: '#B8862B', muted: '#66756B' },
  oscuro: {},
} as const;
