import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import {
  BRILLO,
  BROTE,
  COLORES_MARCA as M,
  COTILEDONES,
  HOJAS,
  LIENZO,
  MONTICULO,
  NERVIOS_COTILEDON,
  NERVIOS_HOJA,
  OPACIDAD_PERLITA,
  PERLITA,
  TALLO,
  TIERRA,
  TRAZO,
} from '@/tema/marca';

/** Radio de las esquinas del ícono, como en iOS (≈ 22 % del lado). */
const RADIO = 230;

/**
 * Logo de BROTA (D-28): la plántula de cannabis de costado saliendo de la tierra, igual que el ícono de
 * la app. Decorativo: el nombre "BROTA" lo acompaña como texto.
 */
export function Logo({ tamano = 40 }: { tamano?: number }) {
  const borde = { stroke: M.borde, strokeOpacity: TRAZO.opacidadBorde, strokeWidth: TRAZO.borde, strokeLinejoin: 'round' as const };
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${LIENZO} ${LIENZO}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Defs>
        <ClipPath id="recorte">
          <Rect width={LIENZO} height={LIENZO} rx={RADIO} />
        </ClipPath>
        <LinearGradient id="fondo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={M.fondoDesde} />
          <Stop offset="1" stopColor={M.fondoHasta} />
        </LinearGradient>
        <RadialGradient id="brillo" cx="512" cy={BRILLO.cy} r="420" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={M.brillo} stopOpacity={BRILLO.opacidad} />
          <Stop offset="1" stopColor={M.brillo} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="suelo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={M.sueloClaro} />
          <Stop offset="1" stopColor={M.sueloOscuro} />
        </LinearGradient>
        <LinearGradient id="tallo" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={M.talloClaro} />
          <Stop offset="1" stopColor={M.talloOscuro} />
        </LinearGradient>
        <LinearGradient id="cotiledon" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={M.cotiledonClaro} />
          <Stop offset="1" stopColor={M.cotiledonOscuro} />
        </LinearGradient>
        <LinearGradient id="hoja" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={M.hojaClara} />
          <Stop offset="1" stopColor={M.hojaOscura} />
        </LinearGradient>
      </Defs>
      <G clipPath="url(#recorte)">
        <Rect width={LIENZO} height={LIENZO} fill="url(#fondo)" />
        <Rect width={LIENZO} height={LIENZO} fill="url(#brillo)" />
        <Path d={TIERRA} fill="url(#suelo)" />
        {PERLITA.map((p) => (
          <Circle key={`${p.cx}-${p.cy}`} cx={p.cx} cy={p.cy} r={p.r} fill={M.perlita} fillOpacity={OPACIDAD_PERLITA} />
        ))}
        <Path d={TALLO} fill="url(#tallo)" />
        {COTILEDONES.map((d) => (
          <Path key={d} d={d} fill="url(#cotiledon)" {...borde} />
        ))}
        {NERVIOS_COTILEDON.map((d) => (
          <Path key={d} d={d} stroke={M.nervioCotiledon} strokeOpacity={TRAZO.opacidadNervioCotiledon} strokeWidth={TRAZO.nervio} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}
        {HOJAS.map((d) => (
          <Path key={d} d={d} fill="url(#hoja)" {...borde} />
        ))}
        {NERVIOS_HOJA.map((d) => (
          <Path key={d} d={d} stroke={M.nervioHoja} strokeOpacity={TRAZO.opacidadNervioHoja} strokeWidth={TRAZO.nervio} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}
        {BROTE.map((d) => (
          <Path key={d} d={d} fill="url(#hoja)" {...borde} />
        ))}
        <Path d={MONTICULO} fill="url(#suelo)" />
      </G>
    </Svg>
  );
}
