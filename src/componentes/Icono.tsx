import { SymbolView } from 'expo-symbols';
import { Platform, useWindowDimensions } from 'react-native';

import { ICONOS, TAMANO_ICONO, type NombreIcono } from '@/tema/iconos';

type Props = { nombre: NombreIcono; color: string; tamano?: number };

/** Ícono decorativo (SF Symbols en iOS, Material Symbols en Android). Los lectores de pantalla lo saltean. */
export function Icono({ nombre, color, tamano = TAMANO_ICONO.normal }: Props) {
  const { ios, android } = ICONOS[nombre];
  const { fontScale } = useWindowDimensions();
  // En Android, expo-symbols dibuja el ícono como un carácter de una fuente: con la letra del sistema
  // agrandada crece más que su caja y se corta. Se compensa para que mida siempre `tamano` (D-32).
  const escala = Platform.OS === 'android' && fontScale > 0 ? fontScale : 1;
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={tamano / escala}
      style={{ width: tamano, height: tamano }}
      tintColor={color}
      type="monochrome"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
