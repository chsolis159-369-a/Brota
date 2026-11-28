import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import esAR from './es-AR.json';

/** Idioma por defecto. Los demás se eligen en Configuración (D-35). */
export const IDIOMA_POR_DEFECTO = 'es-AR';

/** Idiomas de la app, cada uno con su nombre en su propio idioma. */
export const IDIOMAS = [
  { codigo: 'es-AR', nombre: 'Español' },
] as const;

export type Idioma = (typeof IDIOMAS)[number]['codigo'];

export const RECURSOS = {
  'es-AR': { translation: esAR },
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
