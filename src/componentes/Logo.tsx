import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { COLORES_MARCA as M, COTILEDONES, FOLIOLOS, GROSOR_NERVIO, GROSOR_PECIOLO, LIENZO, NERVIOS, OPACIDAD_NERVIO, PECIOLOS, SUELO, TALLO } from '@/tema/marca';

/** Radio de las esquinas del ícono, como en iOS (≈ 22 % del lado). */
const RADIO = 230;

/**
 * Logo de BROTA (D-28): la plántula de cannabis sobre el fondo verde, igual que el ícono de la app.
 * Decorativo: el nombre "BROTA" lo acompaña como texto.
 */
export function Logo({ tamano = 40 }: { tamano?: number }) {
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
        <RadialGradient id="brillo" cx="512" cy="430" r="420" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={M.brillo} stopOpacity={0.3} />
          <Stop offset="1" stopColor={M.brillo} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="hoja" x1="0" y1="200" x2="0" y2="760" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={M.hojaClara} />
          <Stop offset="1" stopColor={M.hojaOscura} />
        </LinearGradient>
        <LinearGradient id="cotiledon" x1="0" y1="420" x2="0" y2="720" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={M.cotiledonClaro} />
          <Stop offset="1" stopColor={M.cotiledonOscuro} />
        </LinearGradient>
      </Defs>
      <Rect width={LIENZO} height={LIENZO} rx={RADIO} fill="url(#fondo)" />
      <Rect width={LIENZO} height={LIENZO} rx={RADIO} fill="url(#brillo)" />
      <Ellipse cx={SUELO.cx} cy={SUELO.cy} rx={SUELO.rx} ry={SUELO.ry} fill={M.suelo} fillOpacity={SUELO.opacidad} />
      <Path d={TALLO} fill={M.tallo} />
      {PECIOLOS.map((d) => (
        <Path key={d} d={d} stroke={M.tallo} strokeWidth={GROSOR_PECIOLO} strokeLinecap="round" fill="none" />
      ))}
      {COTILEDONES.map((d) => (
        <Path key={d} d={d} fill="url(#cotiledon)" />
      ))}
      {FOLIOLOS.map((d) => (
        <Path key={d} d={d} fill="url(#hoja)" />
      ))}
      {NERVIOS.map((d) => (
        <Path key={d} d={d} stroke={M.nervio} strokeOpacity={OPACIDAD_NERVIO} strokeWidth={GROSOR_NERVIO} strokeLinecap="round" fill="none" />
      ))}
    </Svg>
  );
}
