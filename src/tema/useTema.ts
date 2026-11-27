import { useColorScheme, type ViewStyle } from 'react-native';

import { claro, oscuro, type Colores } from './colores';

export type Tema = { modo: 'claro' | 'oscuro'; c: Colores };

/** Tema según el modo del sistema, como el prototipo (prefers-color-scheme). */
export function useTema(): Tema {
  const esquema = useColorScheme();
  return esquema === 'dark' ? { modo: 'oscuro', c: oscuro } : { modo: 'claro', c: claro };
}

/** Medidas compartidas (D-32: más aire y objetivos táctiles más grandes). */
export const MEDIDAS = {
  margen: 20,
  radioTarjeta: 20,
  radioControl: 14,
  /** Relleno interno de las tarjetas. */
  rellenoTarjeta: 20,
  /** Separación entre tarjetas. */
  separacion: 16,
  /** Ancho máximo de la columna: líneas cortas, cómodas de leer. */
  anchoMaximo: 440,
  /** Objetivo táctil mínimo (accesibilidad). */
  toque: 48,
} as const;

/**
 * Superficie de tarjeta: en claro, fondo blanco con sombra suave; en oscuro, borde (las sombras no se
 * ven sobre fondos oscuros).
 */
export function superficie(c: Colores): ViewStyle {
  return c.sombra ? { backgroundColor: c.surface, boxShadow: c.sombra } : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border };
}

/** Degradé diagonal para fondos (estilo `backgroundImage` de React Native). */
export const degrade = (desde: string, hasta: string, angulo = 135) => `linear-gradient(${angulo}deg, ${desde} 0%, ${hasta} 100%)`;
