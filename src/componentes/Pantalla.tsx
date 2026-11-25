import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MEDIDAS, useTema } from '@/tema/useTema';

import { Encabezado } from './Encabezado';
import { Texto } from './Texto';

type Props = { titulo?: string; children?: ReactNode };

/** Columna centrada con el encabezado de BROTA y un degradé suave de la marca arriba (D-29). */
export function Pantalla({ titulo, children }: Props) {
  const { c } = useTema();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.raiz, { backgroundColor: c.bg }]}>
      <View
        pointerEvents="none"
        style={[estilos.brillo, { backgroundImage: `linear-gradient(180deg, ${c.accentSoft} 0%, ${c.bg} 100%)` }]}
      />
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        <View style={estilos.columna}>
          <Encabezado />
          {titulo ? (
            <Texto variante="tituloGrande" style={estilos.titulo}>
              {titulo}
            </Texto>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  brillo: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  scroll: { paddingHorizontal: MEDIDAS.margen, paddingBottom: 32 },
  columna: { width: '100%', maxWidth: MEDIDAS.anchoMaximo, alignSelf: 'center' },
  titulo: { marginTop: 10, marginBottom: 14 },
});
