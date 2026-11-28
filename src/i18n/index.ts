import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import esAR from './es-AR.json';
import fr from './fr.json';
import it from './it.json';
import zhCN from './zh-CN.json';

/** Idioma por defecto. Los demás se eligen en Configuración (D-35). */
export const IDIOMA_POR_DEFECTO = 'es-AR';

/**
 * Idiomas de la app (D-36), cada uno con su nombre en su propio idioma. El contenido de los módulos
 * (content/modulos.json) queda en español.
 */
export const IDIOMAS = [
  { codigo: 'es-AR', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
  { codigo: 'it', nombre: 'Italiano' },
  { codigo: 'fr', nombre: 'Français' },
  { codigo: 'zh-CN', nombre: '中文' },
] as const;

export type Idioma = (typeof IDIOMAS)[number]['codigo'];

export const RECURSOS = {
  'es-AR': { translation: esAR },
  en: { translation: en },
  it: { translation: it },
  fr: { translation: fr },
  'zh-CN': { translation: zhCN },
} as const;

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: RECURSOS,
  lng: IDIOMA_POR_DEFECTO,
  fallbackLng: IDIOMA_POR_DEFECTO,
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
