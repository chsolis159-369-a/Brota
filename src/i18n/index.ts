import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import esAR from './es-AR.json';

/** Idioma por defecto y único por ahora. Para sumar otro: agregar el JSON y elegirlo con expo-localization. */
export const IDIOMA_POR_DEFECTO = 'es-AR';

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
