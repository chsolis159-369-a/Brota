import { Text, type TextProps } from 'react-native';

import type { Colores } from '@/tema/colores';
import { TEXTO, type VarianteTexto } from '@/tema/tipografia';
import { useTema } from '@/tema/useTema';

type Props = TextProps & {
  variante?: VarianteTexto;
  /** Token de color del tema. Por defecto: fg (o muted para "secundario"). */
  color?: keyof Colores;
};

const TITULOS: VarianteTexto[] = ['marca', 'titulo', 'tituloGrande', 'subtitulo'];

/** Texto con la escala del prototipo. Respeta el tamaño de letra del sistema (allowFontScaling). */
export function Texto({ variante = 'cuerpo', color, style, accessibilityRole, ...resto }: Props) {
  const { c } = useTema();
  const tono = color ?? (variante === 'secundario' ? 'muted' : 'fg');
  return (
    <Text
      accessibilityRole={accessibilityRole ?? (TITULOS.includes(variante) ? 'header' : undefined)}
      style={[TEXTO[variante], { color: c[tono] }, style]}
      {...resto}
    />
  );
}
