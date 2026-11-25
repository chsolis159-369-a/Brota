/**
 * Paleta de BROTA (D-29, rediseño visual pedido por el usuario): el verde esmeralda de la marca (D-28)
 * con acentos lima, ámbar y celeste. Reemplaza los colores del prototipo, que sigue siendo la fuente de
 * los textos y del comportamiento. Mantiene los nombres de los tokens del prototipo y suma los del
 * rediseño (degradés, superficies suaves y sombras).
 *
 * Todo texto cumple contraste AA (≥ 4,5) sobre los fondos donde se usa; lo verifica __tests__/tema.test.ts.
 * `lima` es solo para gráficos (anillos y barras sobre el degradé), no para texto.
 */
export type Colores = {
  bg: string;
  surface: string;
  /** Campos y zonas secundarias dentro de una tarjeta. */
  surfaceAlt: string;
  fg: string;
  muted: string;
  accent: string;
  accentSoft: string;
  border: string;
  alert: string;
  alertSoft: string;
  ok: string;
  gold: string;
  goldSoft: string;
  info: string;
  infoSoft: string;
  /** Texto sobre fondo accent (botones primarios, chips activos). */
  sobreAccent: string;
  /** Degradé del botón primario (el texto es sobreAccent). */
  botonDesde: string;
  botonHasta: string;
  /** Degradé de las tarjetas destacadas (resumen de Hoy, nivel, plan Pro). */
  heroDesde: string;
  heroHasta: string;
  sobreHero: string;
  sobreHeroSuave: string;
  lima: string;
  /** Sombra de las tarjetas (boxShadow); vacía en modo oscuro, donde se usa el borde. */
  sombra: string;
  /** Sombra del botón primario. */
  sombraBoton: string;
};

export const claro: Colores = {
  bg: '#F2F6F3',
  surface: '#FFFFFF',
  surfaceAlt: '#F6FAF7',
  fg: '#0F2418',
  muted: '#53685A',
  accent: '#147A3B',
  accentSoft: '#E3F4E8',
  border: '#DCE7DF',
  alert: '#C2410C',
  alertSoft: '#FDEDE4',
  ok: '#147A3B',
  gold: '#93560A',
  goldSoft: '#FEF3C7',
  info: '#0369A1',
  infoSoft: '#E0F2FE',
  sobreAccent: '#FFFFFF',
  botonDesde: '#168342',
  botonHasta: '#0E6630',
  heroDesde: '#147A3B',
  heroHasta: '#0A4227',
  sobreHero: '#FFFFFF',
  sobreHeroSuave: '#E3F9EA',
  lima: '#BEF264',
  sombra: '0 1px 2px rgba(15, 36, 24, 0.06), 0 8px 20px rgba(15, 36, 24, 0.07)',
  sombraBoton: '0 6px 14px rgba(20, 122, 59, 0.28)',
};

export const oscuro: Colores = {
  bg: '#08130D',
  surface: '#102019',
  surfaceAlt: '#0C1913',
  fg: '#E8F3EC',
  muted: '#9CB5A6',
  accent: '#4ADE80',
  accentSoft: '#143322',
  border: '#21392B',
  alert: '#FB923C',
  alertSoft: '#3A1E0E',
  ok: '#4ADE80',
  gold: '#FBBF24',
  goldSoft: '#3A2C0A',
  info: '#7DD3FC',
  infoSoft: '#0B2A3A',
  sobreAccent: '#052E16',
  botonDesde: '#5EE88E',
  botonHasta: '#34C46A',
  heroDesde: '#166534',
  heroHasta: '#0A3A22',
  sobreHero: '#FFFFFF',
  sobreHeroSuave: '#CDEFD8',
  lima: '#BEF264',
  sombra: '',
  sombraBoton: '',
};
