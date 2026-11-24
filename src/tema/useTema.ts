import { useColorScheme } from 'react-native';

import { claro, oscuro, type Colores } from './colores';

export type Tema = { modo: 'claro' | 'oscuro'; c: Colores };

/** Tema según el modo del sistema, como el prototipo (prefers-color-scheme). */
export function useTema(): Tema {
  const esquema = useColorScheme();
  return esquema === 'dark' ? { modo: 'oscuro', c: oscuro } : { modo: 'claro', c: claro };
}

/** Medidas compartidas del prototipo. */
export const MEDIDAS = {
  margen: 16,
  radioTarjeta: 14,
  radioControl: 12,
  anchoMaximo: 420,
  /** Objetivo táctil mínimo (accesibilidad). */
  toque: 44,
} as const;
