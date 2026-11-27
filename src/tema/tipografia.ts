import type { TextStyle } from 'react-native';

/** Familias cargadas con useFonts en el layout raíz (Fraunces para títulos, Nunito Sans para texto). */
export const FUENTES = {
  titulo: 'Fraunces_600SemiBold',
  texto: 'NunitoSans_400Regular',
  textoSemi: 'NunitoSans_600SemiBold',
  textoBold: 'NunitoSans_700Bold',
} as const;

/**
 * Escala tipográfica de confort (D-32): cuerpo 17/26, secundario 15/22, botón 17/24 y etiqueta 13/18 sin
 * mayúsculas forzadas. Fraunces solo de 20 px para arriba (títulos y números destacados).
 */
export const TEXTO = {
  marca: { fontFamily: FUENTES.titulo, fontSize: 22, lineHeight: 28, letterSpacing: 1.2 },
  titulo: { fontFamily: FUENTES.titulo, fontSize: 22, lineHeight: 30 },
  tituloGrande: { fontFamily: FUENTES.titulo, fontSize: 30, lineHeight: 38 },
  /** Títulos de sección (h3). */
  seccion: { fontFamily: FUENTES.titulo, fontSize: 21, lineHeight: 28 },
  subtitulo: { fontFamily: FUENTES.textoBold, fontSize: 18, lineHeight: 25 },
  /** Valores de las estadísticas. */
  numero: { fontFamily: FUENTES.titulo, fontSize: 24, lineHeight: 31 },
  /** Valor principal de un bloque destacado. */
  numeroGrande: { fontFamily: FUENTES.titulo, fontSize: 32, lineHeight: 40 },
  cuerpo: { fontFamily: FUENTES.texto, fontSize: 17, lineHeight: 26 },
  cuerpoFuerte: { fontFamily: FUENTES.textoBold, fontSize: 17, lineHeight: 26 },
  boton: { fontFamily: FUENTES.textoBold, fontSize: 17, lineHeight: 24 },
  secundario: { fontFamily: FUENTES.texto, fontSize: 15, lineHeight: 22 },
  etiqueta: { fontFamily: FUENTES.textoBold, fontSize: 13, lineHeight: 18 },
  pestana: { fontFamily: FUENTES.texto, fontSize: 13, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export type VarianteTexto = keyof typeof TEXTO;
