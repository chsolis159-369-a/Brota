import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import type { Colores } from '@/tema/colores';
import { TAMANO_ICONO, type NombreIcono } from '@/tema/iconos';
import { FUENTES } from '@/tema/tipografia';
import { MEDIDAS, superficie, useTema } from '@/tema/useTema';

import { useEnHero } from './Hero';
import { Icono } from './Icono';
import { Texto } from './Texto';

/** Opacidad al tocar: la única respuesta visual, sin movimiento (D-32). */
const TOCADO = 0.82;

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
 * Botón de ancho completo (.btn, .btn.ghost, .btn.danger del prototipo), D-32:
 * - primario: plano en accent, sin degradé ni sombra de color; dentro de un bloque destacado, blanco;
 * - fantasma (secundario): fondo neutro con borde;
 * - peligro y peligroLleno (borrar): texto terracota sobre fondo neutro o suave, nunca rojo lleno.
 * El texto puede pasar a dos líneas con letra grande: nunca se corta.
 */
export function Boton({ texto, onPress, variante = 'primario', icono, disabled, testID, style, accessibilityLabel }: BotonProps) {
  const { c } = useTema();
  const enHero = useEnHero();
  let caja: ViewStyle;
  let color: keyof Colores;
  let colorIcono: string;
  if (enHero && (variante === 'primario' || variante === 'fantasma')) {
    const lleno = variante === 'primario';
    caja = { backgroundColor: lleno ? '#FFFFFF' : 'transparent', borderColor: lleno ? '#FFFFFF' : c.sobreHeroSuave };
    color = lleno ? 'heroHasta' : 'sobreHero';
    colorIcono = lleno ? c.heroHasta : c.sobreHero;
  } else if (variante === 'primario') {
    caja = { backgroundColor: c.accent, borderColor: c.accent };
    color = 'sobreAccent';
    colorIcono = c.sobreAccent;
  } else if (variante === 'peligroLleno') {
    caja = { backgroundColor: c.alertSoft, borderColor: c.alert };
    color = 'alert';
    colorIcono = c.alert;
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
      style={({ pressed }) => [estilos.boton, caja, { opacity: disabled ? 0.5 : pressed ? TOCADO : 1 }, style]}>
      <View style={estilos.contenidoBoton}>
        {icono ? <Icono nombre={icono} color={colorIcono} /> : null}
        <Texto variante="boton" color={color} style={estilos.textoBoton}>
          {texto}
        </Texto>
      </View>
    </Pressable>
  );
}

type ChipProps = { texto: string; activo?: boolean; onPress: () => void; testID?: string };

/** Chip seleccionable (.chip con aria-pressed): borde visible y 48 px de alto. */
export function Chip({ texto, activo = false, onPress, testID }: ChipProps) {
  const { c } = useTema();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={({ pressed }) => [
        estilos.chip,
        activo ? { backgroundColor: c.accent, borderColor: c.accent } : { backgroundColor: c.surface, borderColor: c.bordeCampo },
        { opacity: pressed ? TOCADO : 1 },
      ]}>
      <Texto variante={activo ? 'cuerpoFuerte' : 'cuerpo'} color={activo ? 'sobreAccent' : 'fg'} style={estilos.centro}>
        {texto}
      </Texto>
    </Pressable>
  );
}

/** Botón de acción rápida (.quick del prototipo): fondo verde suave con borde verde. */
export function BotonRapido({ texto, onPress, testID, icono }: { texto: string; onPress: () => void; testID?: string; icono?: NombreIcono }) {
  const { c } = useTema();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.rapido, { backgroundColor: c.accentSoft, borderColor: c.accent, opacity: pressed ? TOCADO : 1 }]}>
      {icono ? <Icono nombre={icono} color={c.accent} tamano={TAMANO_ICONO.chico} /> : null}
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

/**
 * Campo de texto (.input), D-32: la etiqueta queda siempre a la vista arriba del campo (antes era el
 * texto de ayuda, que desaparecía al escribir), borde bordeCampo (3:1) y foco visible (verde, 2 px).
 * La etiqueta es también el nombre accesible del campo, así que el lector de pantalla no la repite.
 */
export function Campo({ etiqueta, style, multiline, onFocus, onBlur, ...resto }: CampoProps) {
  const { c } = useTema();
  const [foco, setFoco] = useState(false);
  return (
    <View style={estilos.campoCaja}>
      <Texto variante="secundario" color="fg" style={estilos.etiquetaCampo} accessibilityElementsHidden importantForAccessibility="no">
        {etiqueta}
      </Texto>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor={c.muted}
        multiline={multiline}
        onFocus={(e) => {
          setFoco(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFoco(false);
          onBlur?.(e);
        }}
        style={[
          estilos.campo,
          {
            borderColor: foco ? c.accent : c.bordeCampo,
            borderWidth: foco ? 2 : 1.5,
            backgroundColor: c.surface,
            color: c.fg,
            minHeight: multiline ? 88 : MEDIDAS.toque + 4,
            // Con el borde más grueso, el texto no se mueve.
            paddingHorizontal: foco ? 13.5 : 14,
          },
          style,
        ]}
        {...resto}
      />
    </View>
  );
}

export type Tono = 'accent' | 'gold' | 'alert' | 'info' | 'neutro';

/** Colores de un tono: el del ícono o texto y su fondo suave. */
export function colorTono(c: Colores, tono: Tono): { fuerte: string; suave: string } {
  switch (tono) {
    case 'gold':
      return { fuerte: c.gold, suave: c.goldSoft };
    case 'alert':
      return { fuerte: c.alert, suave: c.alertSoft };
    case 'info':
      return { fuerte: c.info, suave: c.infoSoft };
    case 'neutro':
      return { fuerte: c.muted, suave: c.surfaceAlt };
    default:
      return { fuerte: c.accent, suave: c.accentSoft };
  }
}

/**
 * Ícono dentro de un cuadrado de esquinas redondeadas, sobre el fondo suave de su tono (D-33). Por defecto,
 * en el tono de la marca: el color propio queda para lo que significa algo (clima = información; salud del
 * cultivo = bien, atención o problema). El ícono mide siempre lo mismo, sea cual sea el cuadrado.
 */
export function Medalla({ icono, tono = 'accent', tamano = 40 }: { icono: NombreIcono; tono?: Tono; tamano?: number }) {
  const { c } = useTema();
  const { fuerte, suave } = colorTono(c, tono);
  return (
    <View style={[estilos.medalla, { width: tamano, height: tamano, borderRadius: Math.round(tamano * 0.28), backgroundColor: suave }]}>
      <Icono nombre={icono} color={fuerte} tamano={TAMANO_ICONO.normal} />
    </View>
  );
}

type ItemEstadistica = { valor: string | number; etiqueta: string; texto?: boolean; icono?: NombreIcono; tono?: Tono };

/** Grilla de datos (.stats): con letra grande, los recuadros pasan a la línea siguiente. */
export function Estadisticas({ items }: { items: ItemEstadistica[] }) {
  const { c } = useTema();
  return (
    <View style={estilos.stats}>
      {items.map((it) => (
        <View key={it.etiqueta} style={[estilos.stat, superficie(c)]} accessible>
          {it.icono ? <Medalla icono={it.icono} tono={it.tono} tamano={36} /> : null}
          <Texto variante={it.texto ? 'cuerpoFuerte' : 'numero'} color="fg" style={estilos.valor}>
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

/** Mensaje en verde (.okmsg) o de alerta (.alert): recuadro suave con ícono, nunca rojo lleno. */
export function Mensaje({ children, tipo }: { children: string; tipo: 'ok' | 'alerta' }) {
  const { c } = useTema();
  const enHero = useEnHero();
  const ok = tipo === 'ok';
  const fondo = enHero ? 'rgba(255, 255, 255, 0.16)' : ok ? c.accentSoft : c.alertSoft;
  const colorIcono = enHero ? c.lima : ok ? c.ok : c.alert;
  return (
    <View style={[estilos.mensaje, { backgroundColor: fondo }]}>
      <Icono nombre={ok ? 'tarea' : 'alerta'} color={colorIcono} tamano={TAMANO_ICONO.chico} />
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
      {icono ? <Icono nombre={icono} color={c.accent} /> : null}
      <View style={estilos.flex}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { textAlign: 'center' },
  flex: { flex: 1 },
  boton: {
    minHeight: MEDIDAS.toque + 4,
    borderRadius: MEDIDAS.radioControl,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    marginBottom: 12,
  },
  contenidoBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  textoBoton: { textAlign: 'center', flexShrink: 1 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, minHeight: MEDIDAS.toque, justifyContent: 'center', maxWidth: '100%' },
  rapido: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: MEDIDAS.radioControl,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: MEDIDAS.toque,
  },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6, marginBottom: MEDIDAS.separacion },
  campoCaja: { marginBottom: MEDIDAS.separacion, gap: 6 },
  etiquetaCampo: { fontFamily: FUENTES.textoSemi },
  campo: {
    borderRadius: MEDIDAS.radioControl,
    paddingVertical: 12,
    fontFamily: FUENTES.texto,
    fontSize: 17,
  },
  medalla: { alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: MEDIDAS.separacion },
  stat: { flexGrow: 1, flexBasis: '28%', minWidth: 104, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14, gap: 4 },
  valor: { marginTop: 4 },
  h3: { marginTop: 28, marginBottom: 12 },
  mensaje: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginVertical: 6 },
  expl: { flexDirection: 'row', gap: 12, borderRadius: MEDIDAS.radioControl, paddingVertical: 14, paddingHorizontal: 16, marginTop: 10, marginBottom: MEDIDAS.separacion },
});
