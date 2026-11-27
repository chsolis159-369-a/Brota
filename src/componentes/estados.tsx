import type { ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NombreIcono } from '@/tema/iconos';
import { MEDIDAS, useTema } from '@/tema/useTema';

import { Medalla } from './controles';
import { Texto } from './Texto';

/**
 * Estados de carga y vacío (D-32): bloques grises suaves en lugar de una pantalla vacía, y vacíos con un
 * ícono neutro y el texto que ya existe. Sin animaciones: nada que apure ni distraiga.
 */

/** Bloque gris suave que ocupa el lugar de un contenido que todavía no llegó. */
export function Bloque({ alto, ancho = '100%', radio = 10 }: { alto: number; ancho?: DimensionValue; radio?: number }) {
  const { c } = useTema();
  return <View style={{ height: alto, width: ancho, borderRadius: radio, backgroundColor: c.border }} />;
}

/** Varias líneas grises, como un párrafo que se está cargando. */
export function LineasCargando({ lineas = 3 }: { lineas?: number }) {
  return (
    <View style={estilos.lineas} accessibilityState={{ busy: true }}>
      {Array.from({ length: lineas }, (_, i) => (
        <Bloque key={i} alto={14} ancho={i === lineas - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}

/** Pantalla mientras se cargan los datos locales: la forma de la pantalla, en gris suave. */
export function PantallaCargando() {
  const { c } = useTema();
  return (
    <SafeAreaView style={[estilos.raiz, { backgroundColor: c.bg }]} accessibilityState={{ busy: true }}>
      <View style={estilos.columna}>
        <View style={estilos.encabezado}>
          <Bloque alto={36} ancho={36} radio={9} />
          <Bloque alto={22} ancho={96} />
          <View style={estilos.flex} />
          <Bloque alto={30} ancho={120} radio={999} />
        </View>
        <Bloque alto={32} ancho="40%" />
        <Bloque alto={112} radio={MEDIDAS.radioTarjeta} />
        <Bloque alto={88} radio={MEDIDAS.radioTarjeta} />
        <Bloque alto={88} radio={MEDIDAS.radioTarjeta} />
      </View>
    </SafeAreaView>
  );
}

/** Estado vacío: un ícono neutro y el texto que ya existe. */
export function Vacio({ icono, children }: { icono: NombreIcono; children: ReactNode }) {
  return (
    <View style={estilos.vacio}>
      <Medalla icono={icono} tono="neutro" />
      <Texto variante="secundario" style={estilos.flex}>
        {children}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  flex: { flex: 1 },
  columna: { width: '100%', maxWidth: MEDIDAS.anchoMaximo, alignSelf: 'center', padding: MEDIDAS.margen, gap: MEDIDAS.separacion },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  lineas: { gap: 10, paddingVertical: 6 },
  vacio: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
});
