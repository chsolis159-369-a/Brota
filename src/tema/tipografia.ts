import type { TextStyle } from 'react-native';

/** Familias cargadas con useFonts en el layout raíz (Fraunces para títulos, Nunito Sans para texto). */
export const FUENTES = {
  titulo: 'Fraunces_600SemiBold',
  texto: 'NunitoSans_400Regular',
  textoSemi: 'NunitoSans_600SemiBold',
  textoBold: 'NunitoSans_700Bold',
} as const;

/** Escala tipográfica del rediseño (D-29): títulos en Fraunces más grandes y números destacados. */
export const TEXTO = {
  marca: { fontFamily: FUENTES.titulo, fontSize: 22, lineHeight: 26, letterSpacing: 1.2 },
  titulo: { fontFamily: FUENTES.titulo, fontSize: 22, lineHeight: 28 },
  tituloGrande: { fontFamily: FUENTES.titulo, fontSize: 30, lineHeight: 36 },
  /** Títulos de sección (h3). */
  seccion: { fontFamily: FUENTES.titulo, fontSize: 20, lineHeight: 26 },
  subtitulo: { fontFamily: FUENTES.textoBold, fontSize: 17, lineHeight: 22 },
  /** Valores de las estadísticas. */
  numero: { fontFamily: FUENTES.titulo, fontSize: 24, lineHeight: 30 },
  /** Valor principal de una tarjeta destacada. */
  numeroGrande: { fontFamily: FUENTES.titulo, fontSize: 32, lineHeight: 38 },
  cuerpo: { fontFamily: FUENTES.texto, fontSize: 15, lineHeight: 22 },
  cuerpoFuerte: { fontFamily: FUENTES.textoBold, fontSize: 15, lineHeight: 22 },
  boton: { fontFamily: FUENTES.textoBold, fontSize: 16, lineHeight: 22 },
  secundario: { fontFamily: FUENTES.texto, fontSize: 13, lineHeight: 19 },
  etiqueta: { fontFamily: FUENTES.textoBold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
  pestana: { fontFamily: FUENTES.texto, fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;

export type VarianteTexto = keyof typeof TEXTO;
