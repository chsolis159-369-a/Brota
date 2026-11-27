import { SymbolView } from 'expo-symbols';

import { ICONOS, TAMANO_ICONO, type NombreIcono } from '@/tema/iconos';

type Props = { nombre: NombreIcono; color: string; tamano?: number };

/** Ícono decorativo (SF Symbols en iOS, Material Symbols en Android). Los lectores de pantalla lo saltean. */
export function Icono({ nombre, color, tamano = TAMANO_ICONO.normal }: Props) {
  const { ios, android } = ICONOS[nombre];
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={tamano}
      tintColor={color}
      type="monochrome"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
