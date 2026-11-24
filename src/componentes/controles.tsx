import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { MEDIDAS, useTema } from '@/tema/useTema';
import { FUENTES } from '@/tema/tipografia';

import { Texto } from './Texto';

/** Área táctil extra para llegar a 44 px sin cambiar el tamaño visual. */
const HIT = { top: 6, bottom: 6, left: 4, right: 4 };

type BotonProps = {
  texto: string;
  onPress: () => void;
  variante?: 'primario' | 'fantasma' | 'peligro' | 'peligroLleno';
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/** Botón de ancho completo (.btn, .btn.ghost, .btn.danger del prototipo). */
export function Boton({ texto, onPress, variante = 'primario', disabled, testID, style, accessibilityLabel }: BotonProps) {
  const { c } = useTema();
  const fondo = variante === 'primario' ? c.accent : variante === 'peligroLleno' ? c.alert : 'transparent';
  const borde = variante === 'peligro' || variante === 'peligroLleno' ? c.alert : c.accent;
  const color = variante === 'primario' ? 'sobreAccent' : variante === 'peligro' ? 'alert' : variante === 'peligroLleno' ? 'surface' : 'accent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: fondo, borderColor: borde, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}>
      <Texto variante="cuerpoFuerte" color={color} style={estilos.centro}>
        {texto}
      </Texto>
    </Pressable>
  );
}

type ChipProps = { texto: string; activo?: boolean; onPress: () => void; testID?: string };

/** Chip seleccionable (.chip con aria-pressed). */
export function Chip({ texto, activo = false, onPress, testID }: ChipProps) {
  const { c } = useTema();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={HIT}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={[estilos.chip, { backgroundColor: activo ? c.accent : c.surface, borderColor: activo ? c.accent : c.border }]}>
      <Texto variante="cuerpo" color={activo ? 'sobreAccent' : 'fg'}>
        {texto}
      </Texto>
    </Pressable>
  );
}

/** Botón de acción rápida (.quick del prototipo). */
export function BotonRapido({ texto, onPress, testID }: { texto: string; onPress: () => void; testID?: string }) {
  const { c } = useTema();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.rapido, { borderColor: c.accent, backgroundColor: c.accentSoft, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <Texto variante="cuerpoFuerte" color="accent" style={estilos.centro}>
        {texto}
      </Texto>
    </Pressable>
  );
}

/** Fila que se ajusta en varias líneas (.row). */
export function Fila({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[estilos.fila, style]}>{children}</View>;
}

type CampoProps = TextInputProps & { etiqueta: string };

/** Campo de texto (.input). La etiqueta es el placeholder y el nombre accesible. */
export function Campo({ etiqueta, style, multiline, ...resto }: CampoProps) {
  const { c } = useTema();
  return (
    <TextInput
      placeholder={etiqueta}
      accessibilityLabel={etiqueta}
      placeholderTextColor={c.muted}
      multiline={multiline}
      style={[
        estilos.campo,
        { borderColor: c.border, backgroundColor: c.surface, color: c.fg, minHeight: multiline ? 64 : MEDIDAS.toque },
        style,
      ]}
      {...resto}
    />
  );
}

/** Grilla de tres datos (.stats). */
export function Estadisticas({ items }: { items: { valor: string | number; etiqueta: string; texto?: boolean }[] }) {
  const { c } = useTema();
  return (
    <View style={estilos.stats}>
      {items.map((it) => (
        <View key={it.etiqueta} style={[estilos.stat, { backgroundColor: c.surface, borderColor: c.border }]} accessible>
          <Texto variante={it.texto ? 'cuerpoFuerte' : 'subtitulo'} color="accent" style={estilos.centro}>
            {String(it.valor)}
          </Texto>
          <Texto variante="secundario" style={estilos.centro}>
            {it.etiqueta}
          </Texto>
        </View>
      ))}
    </View>
  );
}

/** Subtítulo de sección (h3). */
export function Subtitulo({ children }: { children: string }) {
  return (
    <Texto variante="subtitulo" style={estilos.h3}>
      {children}
    </Texto>
  );
}

/** Mensaje en verde (.okmsg) o de alerta (.alert). */
export function Mensaje({ children, tipo }: { children: string; tipo: 'ok' | 'alerta' }) {
  return (
    <Texto variante="cuerpoFuerte" color={tipo === 'ok' ? 'ok' : 'alert'} style={estilos.mensaje}>
      {children}
    </Texto>
  );
}

/** Recuadro de explicación (.expl). */
export function Explicacion({ children }: { children: ReactNode }) {
  const { c } = useTema();
  return <View style={[estilos.expl, { backgroundColor: c.accentSoft }]}>{children}</View>;
}

const estilos = StyleSheet.create({
  centro: { textAlign: 'center' },
  boton: {
    minHeight: MEDIDAS.toque,
    borderRadius: MEDIDAS.radioControl,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 13,
    justifyContent: 'center',
    marginBottom: 10,
  },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' },
  rapido: {
    flexGrow: 1,
    flexBasis: '30%',
    borderWidth: 1,
    borderRadius: MEDIDAS.radioControl,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: MEDIDAS.toque,
    justifyContent: 'center',
  },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 12 },
  campo: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 10,
    fontFamily: FUENTES.texto,
    fontSize: 15,
  },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  stat: { flex: 1, borderWidth: 1, borderRadius: MEDIDAS.radioTarjeta, paddingVertical: 10, paddingHorizontal: 8 },
  h3: { marginTop: 18, marginBottom: 8 },
  mensaje: { marginVertical: 4 },
  expl: { borderRadius: MEDIDAS.radioControl, paddingVertical: 12, paddingHorizontal: 14, marginTop: 6, marginBottom: 12 },
});
