import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { MEDIDAS, superficie, useTema } from '@/tema/useTema';

/** Tarjeta (.card del prototipo): sombra mínima en claro, borde fino en oscuro, con aire (D-32). */
export function Tarjeta({ children, style }: { children?: ReactNode; style?: ViewStyle }) {
  const { c } = useTema();
  return <View style={[estilos.tarjeta, superficie(c), style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: MEDIDAS.radioTarjeta,
    padding: MEDIDAS.rellenoTarjeta,
    marginBottom: MEDIDAS.separacion,
  },
});
