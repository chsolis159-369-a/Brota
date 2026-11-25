import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { degrade, MEDIDAS, useTema } from '@/tema/useTema';

/** Verdadero dentro de una tarjeta destacada: textos y botones cambian a sus versiones claras. */
const ContextoHero = createContext(false);

export const useEnHero = () => useContext(ContextoHero);

/**
 * Tarjeta destacada con el degradé verde de la marca (D-29): resumen de Hoy, nivel en Aprender y plan
 * Pro. Los textos de adentro usan sobreHero, que cumple contraste AA sobre todo el degradé.
 */
export function Hero({ children, style, testID }: { children?: ReactNode; style?: ViewStyle; testID?: string }) {
  const { c } = useTema();
  return (
    <ContextoHero.Provider value>
      <View
        testID={testID}
        style={[
          estilos.hero,
          { backgroundColor: c.heroHasta, backgroundImage: degrade(c.heroDesde, c.heroHasta), boxShadow: c.sombra ? '0 10px 24px rgba(10, 66, 39, 0.28)' : undefined },
          style,
        ]}>
        {children}
      </View>
    </ContextoHero.Provider>
  );
}

const estilos = StyleSheet.create({
  hero: { borderRadius: MEDIDAS.radioTarjeta + 4, padding: 18, marginBottom: 14, overflow: 'hidden' },
});
