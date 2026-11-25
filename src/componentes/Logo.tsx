import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BROTE, CENTRO, COLORES_MARCA as M, COTILEDONES, HOJAS, LIENZO, NERVIOS_COTILEDON, NERVIOS_HOJA, SOMBRA, TRAZO } from '@/tema/marca';

/** Radio de las esquinas del ícono, como en iOS (≈ 22 % del lado). */
const RADIO = 230;

/**
 * Logo de BROTA (D-28): la plántula de cannabis vista desde arriba sobre el fondo verde oscuro, igual
 * que el ícono de la app. Decorativo: el nombre "BROTA" lo acompaña como texto.
 */
export function Logo({ tamano = 40 }: { tamano?: number }) {
  const formas = [...COTILEDONES, ...HOJAS];
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${LIENZO} ${LIENZO}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={M.fondoDesde} />
          <Stop offset="1" stopColor={M.fondoHasta} />
        </LinearGradient>
        <RadialGradient id="brillo" cx="512" cy="500" r="430" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={M.brillo} stopOpacity={0.3} />
          <Stop offset="1" stopColor={M.brillo} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="cotiledon" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={M.cotiledonClaro} />
          <Stop offset="1" stopColor={M.cotiledonOscuro} />
        </LinearGradient>
        <LinearGradient id="hoja" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={M.hojaClara} />
          <Stop offset="1" stopColor={M.hojaOscura} />
        </LinearGradient>
      </Defs>
      <Rect width={LIENZO} height={LIENZO} rx={RADIO} fill="url(#fondo)" />
      <Rect width={LIENZO} height={LIENZO} rx={RADIO} fill="url(#brillo)" />
      <G transform={`translate(${SOMBRA.dx} ${SOMBRA.dy})`} fill={M.sombra} fillOpacity={SOMBRA.opacidad}>
        {formas.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
      {COTILEDONES.map((d) => (
        <Path key={d} d={d} fill="url(#cotiledon)" stroke={M.borde} strokeOpacity={TRAZO.opacidadBorde} strokeWidth={TRAZO.borde} strokeLinejoin="round" />
      ))}
      {NERVIOS_COTILEDON.map((d) => (
        <Path key={d} d={d} stroke={M.nervioCotiledon} strokeOpacity={TRAZO.opacidadNervioCotiledon} strokeWidth={TRAZO.nervio} strokeLinecap="round" fill="none" />
      ))}
      {HOJAS.map((d) => (
        <Path key={d} d={d} fill="url(#hoja)" stroke={M.borde} strokeOpacity={TRAZO.opacidadBorde} strokeWidth={TRAZO.borde} strokeLinejoin="round" />
      ))}
      {NERVIOS_HOJA.map((d) => (
        <Path key={d} d={d} stroke={M.nervioHoja} strokeOpacity={TRAZO.opacidadNervioHoja} strokeWidth={TRAZO.nervio} strokeLinecap="round" fill="none" />
      ))}
      {BROTE.map((d) => (
        <Path key={d} d={d} fill="url(#hoja)" />
      ))}
      <Circle cx={CENTRO.cx} cy={CENTRO.cy} r={CENTRO.r} fill={M.centro} />
    </Svg>
  );
}
