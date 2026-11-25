import { Text, type TextProps } from 'react-native';

import type { Colores } from '@/tema/colores';
import { TEXTO, type VarianteTexto } from '@/tema/tipografia';
import { useTema } from '@/tema/useTema';

import { useEnHero } from './Hero';

type Props = TextProps & {
  variante?: VarianteTexto;
  /** Token de color del tema. Por defecto: fg (o muted para "secundario"). */
  color?: keyof Colores;
};

const TITULOS: VarianteTexto[] = ['marca', 'titulo', 'tituloGrande', 'seccion', 'subtitulo'];

/** Texto con la escala del rediseño. Respeta el tamaño de letra del sistema (allowFontScaling). */
export function Texto({ variante = 'cuerpo', color, style, accessibilityRole, ...resto }: Props) {
  const { c } = useTema();
  const enHero = useEnHero();
  const tono = color ?? (variante === 'secundario' ? 'muted' : 'fg');
  // Sobre el degradé de una tarjeta destacada todo el texto es claro (secundario, un poco más suave).
  const valor = enHero ? (tono === 'muted' ? c.sobreHeroSuave : c.sobreHero) : c[tono];
  return (
    <Text
      accessibilityRole={accessibilityRole ?? (TITULOS.includes(variante) ? 'header' : undefined)}
      style={[TEXTO[variante], { color: valor }, style]}
      {...resto}
    />
  );
}
