/**
 * Paleta de BROTA: diseño de confianza y confort (D-32), evolución del rediseño D-29.
 * - Claro: papel cálido, verde salvia profundo como único color de acción, terracota para problemas,
 *   ocre para atención y azul pizarra para información (clima).
 * - Oscuro: "verde noche", nunca negro puro ni verde neón, para no encandilar en el indoor.
 * El color siempre significa algo y nunca va solo: lo acompaña un ícono o un texto.
 *
 * Todo texto cumple contraste AA (≥ 4,5) sobre los fondos donde se usa, y el borde de campos y controles
 * (`bordeCampo`) llega a 3:1 (WCAG 1.4.11); lo verifica __tests__/tema.test.ts.
 * `lima` es solo para gráficos (anillos y barras sobre el bloque destacado), no para texto.
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
  /** Bordes decorativos (separadores, tarjetas en oscuro). */
  border: string;
  /** Borde de campos y controles: contraste de 3:1 o más (D-32). */
  bordeCampo: string;
  alert: string;
  alertSoft: string;
  ok: string;
  gold: string;
  goldSoft: string;
  info: string;
  infoSoft: string;
  /** Texto sobre fondo accent (botones primarios, chips activos). */
  sobreAccent: string;
  /** Botón primario: plano desde D-32 (los dos extremos iguales). */
  botonDesde: string;
  botonHasta: string;
  /** Bloque destacado (uno por pantalla): degradé muy sutil. */
  heroDesde: string;
  heroHasta: string;
  sobreHero: string;
  sobreHeroSuave: string;
  lima: string;
  /** Sombra de las tarjetas (boxShadow); vacía en modo oscuro, donde se usa el borde. */
  sombra: string;
  /** Sombra del botón primario: ninguna desde D-32. */
  sombraBoton: string;
};

export const claro: Colores = {
  bg: '#F7F5EF',
  surface: '#FFFFFF',
  surfaceAlt: '#F2EFE7',
  fg: '#1C2620',
  muted: '#56615A',
  accent: '#2D6A4C',
  accentSoft: '#E5EFE8',
  border: '#E3DED3',
  bordeCampo: '#7F8781',
  alert: '#A8452C',
  alertSoft: '#FAE9E3',
  ok: '#2D6A4C',
  gold: '#87580F',
  goldSoft: '#F7EEDC',
  info: '#2E5E83',
  infoSoft: '#E4EDF5',
  sobreAccent: '#FFFFFF',
  botonDesde: '#2D6A4C',
  botonHasta: '#2D6A4C',
  heroDesde: '#2D6A4C',
  heroHasta: '#25573F',
  sobreHero: '#FFFFFF',
  sobreHeroSuave: '#DDEDE3',
  lima: '#C7E6A3',
  sombra: '0 1px 2px rgba(28, 38, 32, 0.05), 0 4px 12px rgba(28, 38, 32, 0.05)',
  sombraBoton: '',
};

export const oscuro: Colores = {
  bg: '#121A16',
  surface: '#1A2420',
  surfaceAlt: '#16201B',
  fg: '#E7EDE9',
  muted: '#A6B2AA',
  accent: '#8CCBA6',
  accentSoft: '#1F3329',
  border: '#2C3B33',
  bordeCampo: '#6C7B72',
  alert: '#F0957D',
  alertSoft: '#3A231D',
  ok: '#8CCBA6',
  gold: '#E3BA68',
  goldSoft: '#352B18',
  info: '#96C0E0',
  infoSoft: '#1B2C39',
  sobreAccent: '#10201A',
  botonDesde: '#8CCBA6',
  botonHasta: '#8CCBA6',
  heroDesde: '#22503B',
  heroHasta: '#1A3F2E',
  sobreHero: '#F3F8F5',
  sobreHeroSuave: '#D2E6DA',
  lima: '#C7E6A3',
  sombra: '',
  sombraBoton: '',
};
