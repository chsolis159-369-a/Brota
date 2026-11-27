import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { degrade, MEDIDAS, useTema } from '@/tema/useTema';

/** Verdadero dentro de un bloque destacado: textos y botones cambian a sus versiones claras. */
const ContextoHero = createContext(false);

export const useEnHero = () => useContext(ContextoHero);

/**
 * Bloque destacado (como máximo uno por pantalla, D-32): verde de la marca con un degradé muy sutil, sin
 * sombras de color. Lo usan el resumen de Hoy y el nivel en Aprender. Los textos de adentro usan
 * sobreHero, que cumple contraste AA sobre todo el degradé.
 */
export function Hero({ children, style, testID }: { children?: ReactNode; style?: ViewStyle; testID?: string }) {
  const { c } = useTema();
  return (
    <ContextoHero.Provider value>
      <View
        testID={testID}
        style={[estilos.hero, { backgroundColor: c.heroHasta, backgroundImage: degrade(c.heroDesde, c.heroHasta, 180), boxShadow: c.sombra || undefined }, style]}>
        {children}
      </View>
    </ContextoHero.Provider>
  );
}

const estilos = StyleSheet.create({
  hero: { borderRadius: MEDIDAS.radioTarjeta, padding: MEDIDAS.rellenoTarjeta, marginBottom: MEDIDAS.separacion, overflow: 'hidden' },
});
