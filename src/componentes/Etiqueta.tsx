import { StyleSheet, View } from 'react-native';

import type { Colores } from '@/tema/colores';
import { useTema } from '@/tema/useTema';

import { useEnHero } from './Hero';
import { Texto } from './Texto';

type Props = { children: string; tono?: Extract<keyof Colores, 'muted' | 'gold' | 'ok'> };

/** Etiqueta chica en mayúsculas (.tag del prototipo), en una píldora de color suave. */
export function Etiqueta({ children, tono = 'muted' }: Props) {
  const { c } = useTema();
  const enHero = useEnHero();
  const fondo = enHero ? 'rgba(255, 255, 255, 0.18)' : tono === 'gold' ? c.goldSoft : tono === 'ok' ? c.accentSoft : c.surfaceAlt;
  const borde = enHero ? 'transparent' : tono === 'muted' ? c.border : 'transparent';
  return (
    <View style={[estilos.tag, { backgroundColor: fondo, borderColor: borde }]}>
      <Texto variante="etiqueta" color={tono}>
        {children}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 6,
  },
});
