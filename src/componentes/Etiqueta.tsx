import { StyleSheet, View } from 'react-native';

import type { Colores } from '@/tema/colores';
import { TAMANO_ICONO, type NombreIcono } from '@/tema/iconos';
import { useTema } from '@/tema/useTema';

import { useEnHero } from './Hero';
import { Icono } from './Icono';
import { Texto } from './Texto';

type Props = { children: string; tono?: Extract<keyof Colores, 'muted' | 'gold' | 'ok'>; icono?: NombreIcono };

/**
 * Etiqueta chica (.tag del prototipo) en una píldora de color suave, 13/18 sin mayúsculas forzadas (D-32).
 * Con `icono`, el color nunca va solo: lo acompañan el ícono y el texto.
 */
export function Etiqueta({ children, tono = 'muted', icono }: Props) {
  const { c } = useTema();
  const enHero = useEnHero();
  const fondo = enHero ? 'rgba(255, 255, 255, 0.18)' : tono === 'gold' ? c.goldSoft : tono === 'ok' ? c.accentSoft : c.surfaceAlt;
  const borde = enHero ? 'transparent' : tono === 'muted' ? c.border : 'transparent';
  return (
    <View style={[estilos.tag, { backgroundColor: fondo, borderColor: borde }]}>
      {icono ? <Icono nombre={icono} color={enHero ? c.sobreHero : c[tono]} tamano={TAMANO_ICONO.chico - 4} /> : null}
      <Texto variante="etiqueta" color={tono}>
        {children}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 6,
  },
});
