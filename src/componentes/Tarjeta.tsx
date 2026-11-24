import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { MEDIDAS, useTema } from '@/tema/useTema';

/** Tarjeta (.card del prototipo). */
export function Tarjeta({ children, style }: { children?: ReactNode; style?: ViewStyle }) {
  const { c } = useTema();
  return <View style={[estilos.tarjeta, { backgroundColor: c.surface, borderColor: c.border }, style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderWidth: 1,
    borderRadius: MEDIDAS.radioTarjeta,
    padding: 14,
    marginBottom: 10,
  },
});
