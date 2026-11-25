import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import type { Colores } from '@/tema/colores';
import type { NombreIcono } from '@/tema/iconos';
import { FUENTES } from '@/tema/tipografia';
import { degrade, MEDIDAS, superficie, useTema } from '@/tema/useTema';

import { useEnHero } from './Hero';
import { Icono } from './Icono';
import { Texto } from './Texto';

/** Área táctil extra para llegar a 44 px sin cambiar el tamaño visual. */
const HIT = { top: 6, bottom: 6, left: 4, right: 4 };

type BotonProps = {
  texto: string;
  onPress: () => void;
  variante?: 'primario' | 'fantasma' | 'peligro' | 'peligroLleno';
  icono?: NombreIcono;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/**
 * Botón de ancho completo (.btn, .btn.ghost, .btn.danger del prototipo). El primario lleva el degradé
 * de la marca; dentro de una tarjeta destacada, el primario es blanco y el fantasma tiene borde blanco.
 */
export function Boton({ texto, onPress, variante = 'primario', icono, disabled, testID, style, accessibilityLabel }: BotonProps) {
  const { c } = useTema();
  const enHero = useEnHero();
  let caja: ViewStyle;
  let color: keyof Colores;
  let colorIcono: string;
  if (enHero && (variante === 'primario' || variante === 'fantasma')) {
    const lleno = variante === 'primario';
    caja = { backgroundColor: lleno ? '#FFFFFF' : 'transparent', borderColor: lleno ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)' };
    color = lleno ? 'heroHasta' : 'sobreHero';
    colorIcono = lleno ? c.heroHasta : c.sobreHero;
  } else if (variante === 'primario') {
    caja = { backgroundColor: c.accent, backgroundImage: degrade(c.botonDesde, c.botonHasta), borderColor: 'transparent', boxShadow: disabled ? undefined : c.sombraBoton || undefined };
    color = 'sobreAccent';
    colorIcono = c.sobreAccent;
  } else if (variante === 'peligroLleno') {
    caja = { backgroundColor: c.alert, borderColor: c.alert };
    color = 'surface';
    colorIcono = c.surface;
  } else {
    const peligro = variante === 'peligro';
    caja = { backgroundColor: c.surface, borderColor: peligro ? c.alert : c.accent };
    color = peligro ? 'alert' : 'accent';
    colorIcono = peligro ? c.alert : c.accent;
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [estilos.boton, caja, { opacity: disabled ? 0.45 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}>
      <View style={estilos.contenidoBoton}>
        {icono ? <Icono nombre={icono} color={colorIcono} tamano={20} /> : null}
        <Texto variante="boton" color={color} style={estilos.centro}>
          {texto}
        </Texto>
      </View>
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
      style={[estilos.chip, activo ? { backgroundColor: c.accent, borderColor: c.accent } : { backgroundColor: c.surface, borderColor: c.border }]}>
      <Texto variante={activo ? 'cuerpoFuerte' : 'cuerpo'} color={activo ? 'sobreAccent' : 'fg'}>
        {texto}
      </Texto>
    </Pressable>
  );
}

/** Botón de acción rápida (.quick del prototipo). */
export function BotonRapido({ texto, onPress, testID, icono }: { texto: string; onPress: () => void; testID?: string; icono?: NombreIcono }) {
  const { c } = useTema();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.rapido, { backgroundColor: c.accentSoft, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      {icono ? <Icono nombre={icono} color={c.accent} tamano={18} /> : null}
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
        { borderColor: c.border, backgroundColor: c.surfaceAlt, color: c.fg, minHeight: multiline ? 72 : 48 },
        style,
      ]}
      {...resto}
    />
  );
}

export type Tono = 'accent' | 'gold' | 'alert' | 'info';

/** Colores de un tono: el del ícono o texto y su fondo suave. */
export function colorTono(c: Colores, tono: Tono): { fuerte: string; suave: string } {
  switch (tono) {
    case 'gold':
      return { fuerte: c.gold, suave: c.goldSoft };
    case 'alert':
      return { fuerte: c.alert, suave: c.alertSoft };
    case 'info':
      return { fuerte: c.info, suave: c.infoSoft };
    default:
      return { fuerte: c.accent, suave: c.accentSoft };
  }
}

/** Círculo de color con un ícono adentro. */
export function Medalla({ icono, tono = 'accent', tamano = 36 }: { icono: NombreIcono; tono?: Tono; tamano?: number }) {
  const { c } = useTema();
  const { fuerte, suave } = colorTono(c, tono);
  return (
    <View style={[estilos.medalla, { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: suave }]}>
      <Icono nombre={icono} color={fuerte} tamano={Math.round(tamano * 0.55)} />
    </View>
  );
}

type ItemEstadistica = { valor: string | number; etiqueta: string; texto?: boolean; icono?: NombreIcono; tono?: Tono };

/** Grilla de tres datos (.stats), cada uno con su ícono de color. */
export function Estadisticas({ items }: { items: ItemEstadistica[] }) {
  const { c } = useTema();
  return (
    <View style={estilos.stats}>
      {items.map((it) => (
        <View key={it.etiqueta} style={[estilos.stat, superficie(c)]} accessible>
          {it.icono ? <Medalla icono={it.icono} tono={it.tono} tamano={32} /> : null}
          <Texto variante={it.texto ? 'cuerpoFuerte' : 'numero'} color="fg" numberOfLines={2} style={estilos.valor}>
            {String(it.valor)}
          </Texto>
          <Texto variante="secundario">{it.etiqueta}</Texto>
        </View>
      ))}
    </View>
  );
}

/** Subtítulo de sección (h3). */
export function Subtitulo({ children }: { children: string }) {
  return (
    <Texto variante="seccion" style={estilos.h3}>
      {children}
    </Texto>
  );
}

/** Mensaje en verde (.okmsg) o de alerta (.alert), en una píldora de color suave. */
export function Mensaje({ children, tipo }: { children: string; tipo: 'ok' | 'alerta' }) {
  const { c } = useTema();
  const enHero = useEnHero();
  const ok = tipo === 'ok';
  const fondo = enHero ? 'rgba(255, 255, 255, 0.16)' : ok ? c.accentSoft : c.alertSoft;
  const colorIcono = enHero ? c.lima : ok ? c.ok : c.alert;
  return (
    <View style={[estilos.mensaje, { backgroundColor: fondo }]}>
      <Icono nombre={ok ? 'tarea' : 'alerta'} color={colorIcono} tamano={18} />
      <Texto variante="cuerpoFuerte" color={ok ? 'ok' : 'alert'} style={estilos.flex}>
        {children}
      </Texto>
    </View>
  );
}

/** Recuadro de explicación (.expl), con un ícono opcional a la izquierda. */
export function Explicacion({ children, icono }: { children: ReactNode; icono?: NombreIcono }) {
  const { c } = useTema();
  return (
    <View style={[estilos.expl, { backgroundColor: c.accentSoft }]}>
      {icono ? <Icono nombre={icono} color={c.accent} tamano={20} /> : null}
      <View style={estilos.flex}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { textAlign: 'center' },
  flex: { flex: 1 },
  boton: {
    minHeight: 50,
    borderRadius: MEDIDAS.radioControl,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 10,
  },
  contenidoBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, minHeight: 38, justifyContent: 'center' },
  rapido: {
    flexGrow: 1,
    flexBasis: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: MEDIDAS.radioControl,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: MEDIDAS.toque,
  },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 12 },
  campo: {
    borderWidth: 1,
    borderRadius: MEDIDAS.radioControl,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontFamily: FUENTES.texto,
    fontSize: 15,
  },
  medalla: { alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  stat: { flex: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 12, gap: 4 },
  valor: { marginTop: 4 },
  h3: { marginTop: 22, marginBottom: 10 },
  mensaje: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, marginVertical: 4 },
  expl: { flexDirection: 'row', gap: 10, borderRadius: MEDIDAS.radioControl, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8, marginBottom: 12 },
});
