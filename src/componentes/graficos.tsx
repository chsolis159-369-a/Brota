import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { ETAPAS, type Etapa } from '@/reglas/dominio';
import { ZONA_VPD } from '@/reglas/mediciones';
import { useTema } from '@/tema/useTema';

/** Anillo de progreso de tareas del día. Decorativo: el texto "X de N" lo acompaña. */
export function Anillo({ progreso }: { progreso: number }) {
  const { c } = useTema();
  const r = 26;
  const C = 2 * Math.PI * r;
  return (
    <Svg width={72} height={72} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={32} cy={32} r={r} stroke={c.border} strokeWidth={7} fill="none" />
      <Circle
        cx={32}
        cy={32}
        r={r}
        stroke={c.accent}
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${(C * progreso).toFixed(1)} ${C.toFixed(1)}`}
        transform="rotate(-90 32 32)"
      />
    </Svg>
  );
}

/** Segmentos de etapas (.seg): marcados hasta la etapa actual. */
export function SegmentosEtapa({ etapa }: { etapa: Etapa }) {
  const { c } = useTema();
  const idx = ETAPAS.indexOf(etapa);
  return (
    <View style={estilos.seg} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {ETAPAS.map((e, i) => (
        <View key={e} style={[estilos.segItem, { backgroundColor: i <= idx ? c.accent : c.border }]} />
      ))}
    </View>
  );
}

/** Punto de estado (.dot ok / aviso / alerta). */
export function Punto({ nivel }: { nivel: 'ok' | 'aviso' | 'alerta' }) {
  const { c } = useTema();
  const color = nivel === 'ok' ? c.ok : nivel === 'alerta' ? c.alert : c.gold;
  return <View style={[estilos.punto, { backgroundColor: color }]} />;
}

/** Barra de progreso (.bar), de 0 a 1. */
export function Barra({ valor }: { valor: number }) {
  const { c } = useTema();
  return (
    <View style={[estilos.barra, { backgroundColor: c.border }]}>
      <View style={[estilos.barraLlena, { backgroundColor: c.accent, width: `${Math.max(0, Math.min(1, valor)) * 100}%` }]} />
    </View>
  );
}

/** Medidor de VPD (.gauge) con la zona orientativa marcada. Escala de 0 a 2 kPa. */
export function MedidorVPD({ valor }: { valor: number }) {
  const { c } = useTema();
  const pos = Math.min(valor / 2, 1) * 100;
  const a = (ZONA_VPD[0] / 2) * 100;
  const b = (ZONA_VPD[1] / 2) * 100;
  return (
    <View style={[estilos.gauge, { backgroundColor: c.border }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[estilos.banda, { backgroundColor: c.accentSoft, left: `${a}%`, width: `${b - a}%` }]} />
      <View style={[estilos.marca, { backgroundColor: c.fg, left: `${pos}%` }]} />
    </View>
  );
}

/** Evolución del PPFD (del más viejo al más nuevo), escala de 0 a 1000. */
export function SparkPPFD({ valores, etiqueta }: { valores: number[]; etiqueta: string }) {
  const { c } = useTema();
  if (valores.length < 2) return null;
  const W = 300;
  const H = 70;
  const max = 1000;
  const pts = valores.map((v, i) => [i * (W / (valores.length - 1)), H - (Math.min(v, max) / max) * H] as const);
  return (
    <Svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} width="100%" height={H + 8} accessibilityRole="image" accessibilityLabel={etiqueta} style={estilos.spark}>
      <Polyline
        points={pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
        fill="none"
        stroke={c.accent}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <Circle key={i} cx={p[0]} cy={p[1]} r={4} fill={c.accent} />
      ))}
    </Svg>
  );
}

const estilos = StyleSheet.create({
  seg: { flexDirection: 'row', gap: 4, marginVertical: 8 },
  segItem: { flex: 1, height: 6, borderRadius: 999 },
  punto: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  barra: { height: 8, borderRadius: 999, overflow: 'hidden', marginVertical: 8 },
  barraLlena: { height: '100%', borderRadius: 999 },
  gauge: { height: 10, borderRadius: 999, marginTop: 12, marginBottom: 6 },
  banda: { position: 'absolute', top: 0, bottom: 0, borderRadius: 999 },
  marca: { position: 'absolute', top: -4, width: 4, height: 18, borderRadius: 2, marginLeft: -2 },
  spark: { marginTop: 8 },
});
