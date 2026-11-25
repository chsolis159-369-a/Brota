import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { MEDIDAS, superficie, useTema } from '@/tema/useTema';

/** Tarjeta (.card del prototipo): blanca con sombra suave en claro, con borde en oscuro (D-29). */
export function Tarjeta({ children, style }: { children?: ReactNode; style?: ViewStyle }) {
  const { c } = useTema();
  return <View style={[estilos.tarjeta, superficie(c), style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: MEDIDAS.radioTarjeta,
    padding: 16,
    marginBottom: 12,
  },
});
