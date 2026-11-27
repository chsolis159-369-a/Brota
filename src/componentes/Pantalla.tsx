import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MEDIDAS, useTema } from '@/tema/useTema';

import { Encabezado } from './Encabezado';
import { Texto } from './Texto';

type Props = { titulo?: string; children?: ReactNode };

/** Columna centrada con el encabezado de BROTA sobre un fondo liso y cálido (D-32). */
export function Pantalla({ titulo, children }: Props) {
  const { c } = useTema();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.raiz, { backgroundColor: c.bg }]}>
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
  scroll: { paddingHorizontal: MEDIDAS.margen, paddingBottom: 40 },
  columna: { width: '100%', maxWidth: MEDIDAS.anchoMaximo, alignSelf: 'center' },
  titulo: { marginTop: 12, marginBottom: MEDIDAS.separacion },
});
