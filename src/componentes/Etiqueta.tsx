import { StyleSheet, View } from 'react-native';

import type { Colores } from '@/tema/colores';
import { useTema } from '@/tema/useTema';

import { Texto } from './Texto';

type Props = { children: string; tono?: Extract<keyof Colores, 'muted' | 'gold' | 'ok'> };

/** Etiqueta chica en mayúsculas (.tag del prototipo). */
export function Etiqueta({ children, tono = 'muted' }: Props) {
  const { c } = useTema();
  return (
    <View style={[estilos.tag, { borderColor: tono === 'muted' ? c.border : c[tono] }]}>
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
    paddingVertical: 2,
    marginLeft: 6,
  },
});
