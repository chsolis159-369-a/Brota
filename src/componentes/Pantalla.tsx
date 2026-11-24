import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MEDIDAS, useTema } from '@/tema/useTema';

import { Encabezado } from './Encabezado';
import { Texto } from './Texto';

type Props = { titulo?: string; children?: ReactNode };

/** Columna centrada de hasta 420 px con el encabezado de BROTA, como el prototipo. */
export function Pantalla({ titulo, children }: Props) {
  const { c } = useTema();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.raiz, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        <View style={estilos.columna}>
          <Encabezado />
          {titulo ? (
            <Texto variante="titulo" style={estilos.titulo}>
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
  scroll: { paddingHorizontal: MEDIDAS.margen, paddingBottom: 24 },
  columna: { width: '100%', maxWidth: MEDIDAS.anchoMaximo, alignSelf: 'center' },
  titulo: { marginTop: 8, marginBottom: 12 },
});
