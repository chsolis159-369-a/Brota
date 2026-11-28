import { Appearance } from 'react-native';
import { create } from 'zustand';

import i18n, { IDIOMA_POR_DEFECTO, IDIOMAS, type Idioma } from '@/i18n';

/**
 * Preferencias del dispositivo (D-35): idioma, tamaño de letra y modo de pantalla. Se guardan en el
 * almacén clave-valor de expo-sqlite, que se lee de forma sincrónica: así la app abre ya con el idioma y
 * el modo elegidos. No son datos del usuario: "Borrar mi cuenta" no las cambia.
 */

export type TamanoLetra = 'normal' | 'grande' | 'muyGrande';
export type ModoTema = 'sistema' | 'claro' | 'oscuro';

export const TAMANOS_LETRA: readonly TamanoLetra[] = ['normal', 'grande', 'muyGrande'];
export const MODOS_TEMA: readonly ModoTema[] = ['sistema', 'claro', 'oscuro'];

/** Cuánto crece el texto de la app con cada tamaño (se suma al tamaño de letra del sistema). */
export const ESCALA_LETRA: Record<TamanoLetra, number> = { normal: 1, grande: 1.15, muyGrande: 1.3 };

const CLAVES = { idioma: 'brota.idioma', tamanoLetra: 'brota.tamanoLetra', tema: 'brota.tema' } as const;

type Almacen = { leer: (clave: string) => string | null; guardar: (clave: string, valor: string) => void };

/** Almacén persistente; si el módulo nativo no está (pruebas), uno en memoria. */
function crearAlmacen(): Almacen {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Storage } = require('expo-sqlite/kv-store') as typeof import('expo-sqlite/kv-store');
    Storage.getItemSync(CLAVES.idioma);
    return { leer: (k) => Storage.getItemSync(k), guardar: (k, v) => Storage.setItemSync(k, v) };
  } catch {
    const memoria = new Map<string, string>();
    return { leer: (k) => memoria.get(k) ?? null, guardar: (k, v) => void memoria.set(k, v) };
  }
}

const almacen = crearAlmacen();

const elegido = <T extends string>(valor: string | null, opciones: readonly T[], porDefecto: T): T =>
  opciones.includes(valor as T) ? (valor as T) : porDefecto;

/** El modo elegido se aplica a toda la app (y a los componentes nativos) con Appearance. */
function aplicarTema(tema: ModoTema) {
  try {
    Appearance.setColorScheme(tema === 'claro' ? 'light' : tema === 'oscuro' ? 'dark' : 'auto');
  } catch {
    // Sin módulo nativo (pruebas): useColorScheme sigue al sistema.
  }
}

function aplicarIdioma(idioma: Idioma) {
  if (i18n.language !== idioma) void i18n.changeLanguage(idioma);
}

type EstadoPreferencias = {
  idioma: Idioma;
  tamanoLetra: TamanoLetra;
  tema: ModoTema;
  setIdioma: (idioma: Idioma) => void;
  setTamanoLetra: (tamano: TamanoLetra) => void;
  setTema: (tema: ModoTema) => void;
};

export const usePreferencias = create<EstadoPreferencias>()((set) => ({
  idioma: elegido(almacen.leer(CLAVES.idioma), IDIOMAS.map((x) => x.codigo), IDIOMA_POR_DEFECTO),
  tamanoLetra: elegido(almacen.leer(CLAVES.tamanoLetra), TAMANOS_LETRA, 'normal'),
  tema: elegido(almacen.leer(CLAVES.tema), MODOS_TEMA, 'sistema'),
  setIdioma: (idioma) => {
    almacen.guardar(CLAVES.idioma, idioma);
    aplicarIdioma(idioma);
    set({ idioma });
  },
  setTamanoLetra: (tamanoLetra) => {
    almacen.guardar(CLAVES.tamanoLetra, tamanoLetra);
    set({ tamanoLetra });
  },
  setTema: (tema) => {
    almacen.guardar(CLAVES.tema, tema);
    aplicarTema(tema);
    set({ tema });
  },
}));

/** Aplica el idioma y el modo guardados. Se llama una vez al abrir la app. */
export function aplicarPreferencias() {
  const { idioma, tema } = usePreferencias.getState();
  aplicarIdioma(idioma);
  if (tema !== 'sistema') aplicarTema(tema);
}

/** Escala del texto según el tamaño de letra elegido. */
export const useEscalaLetra = (): number => usePreferencias((s) => ESCALA_LETRA[s.tamanoLetra]);
