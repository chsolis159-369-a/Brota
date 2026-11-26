import { Image } from 'expo-image';

/** Imagen generada por tools/marca/generar-marca.js (512 px, con las esquinas del ícono). */
const LOGO = require('../../assets/images/logo.png');

/**
 * Logo de BROTA (D-28): la plántula de cannabis saliendo de la tierra, con acabado realista, igual que el
 * ícono de la app. Decorativo: el nombre "BROTA" lo acompaña como texto.
 */
export function Logo({ tamano = 40 }: { tamano?: number }) {
  return (
    <Image
      source={LOGO}
      style={{ width: tamano, height: tamano, borderRadius: tamano * 0.225 }}
      contentFit="cover"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
