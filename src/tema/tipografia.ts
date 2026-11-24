import type { TextStyle } from 'react-native';

/** Familias cargadas con useFonts en el layout raíz (Fraunces para títulos, Nunito Sans para texto). */
export const FUENTES = {
  titulo: 'Fraunces_600SemiBold',
  texto: 'NunitoSans_400Regular',
  textoSemi: 'NunitoSans_600SemiBold',
  textoBold: 'NunitoSans_700Bold',
} as const;

/** Escala tomada del CSS del prototipo (body 15px/1.5, h2 22px, h3 16px, .muted 13px, .brand 24px). */
export const TEXTO = {
  marca: { fontFamily: FUENTES.titulo, fontSize: 24, lineHeight: 28, letterSpacing: 0.5 },
  titulo: { fontFamily: FUENTES.titulo, fontSize: 22, lineHeight: 26 },
  tituloGrande: { fontFamily: FUENTES.titulo, fontSize: 28, lineHeight: 34 },
  subtitulo: { fontFamily: FUENTES.textoSemi, fontSize: 16, lineHeight: 21 },
  cuerpo: { fontFamily: FUENTES.texto, fontSize: 15, lineHeight: 22 },
  cuerpoFuerte: { fontFamily: FUENTES.textoSemi, fontSize: 15, lineHeight: 22 },
  secundario: { fontFamily: FUENTES.texto, fontSize: 13, lineHeight: 19 },
  etiqueta: { fontFamily: FUENTES.textoSemi, fontSize: 11, lineHeight: 14, letterSpacing: 0.66, textTransform: 'uppercase' },
  pestana: { fontFamily: FUENTES.texto, fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;

export type VarianteTexto = keyof typeof TEXTO;
