import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MEDIDAS, useTema } from '@/tema/useTema';

import { BotonAjustes, Encabezado } from './Encabezado';
import { Texto } from './Texto';

/** `cabecera`: reemplaza el encabezado de BROTA (por ejemplo, el botón para volver de Configuración). */
type Props = { titulo?: string; cabecera?: ReactNode; children?: ReactNode };

/** Columna centrada con el encabezado de BROTA sobre un fondo liso y cálido (D-32). */
export function Pantalla({ titulo, cabecera, children }: Props) {
  const { c } = useTema();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.raiz, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        <View style={estilos.columna}>
          {cabecera ?? <Encabezado />}
          {titulo ? (
            <View style={estilos.filaTitulo}>
              <Texto variante="tituloGrande" style={estilos.titulo}>
                {titulo}
              </Texto>
              {/* Configuración se abre desde el título de las pestañas, no desde su propia pantalla. */}
              {cabecera ? null : <BotonAjustes />}
            </View>
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
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, marginBottom: MEDIDAS.separacion },
  titulo: { flex: 1 },
});
