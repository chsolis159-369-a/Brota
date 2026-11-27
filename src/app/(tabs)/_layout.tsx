import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { Platform, useWindowDimensions } from 'react-native';

import { PESTANAS, pestanaDeshabilitada } from '@/config/pestanas';
import { PantallaCargando } from '@/componentes/estados';
import { useApp } from '@/store/app';
import { useDatos } from '@/store/datos';
import { useTema } from '@/tema/useTema';

export default function PestanasLayout() {
  const { t } = useTranslation();
  const { c } = useTema();
  const { fontScale } = useWindowDimensions();
  // Las etiquetas de las pestañas crecen con la letra del sistema hasta 1,35 veces: más, y no entran las
  // cinco ("Culti…"). Los íconos las acompañan y el resto de la app crece sin límite (D-32).
  const tamEtiqueta = Platform.OS === 'android' && fontScale > 1.35 ? (13 * 1.35) / fontScale : 13;
  const examenEnCurso = useApp((s) => s.examenEnCurso);
  const listo = useDatos((s) => s.listo);
  const onboarded = useDatos((s) => s.perfil.onboarded);

  if (!listo) return <PantallaCargando />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs
      backgroundColor={c.surface}
      indicatorColor={c.accentSoft}
      labelVisibilityMode="labeled"
      iconColor={{ default: c.muted, selected: c.accent }}
      labelStyle={{ default: { color: c.muted, fontSize: tamEtiqueta }, selected: { color: c.accent, fontSize: tamEtiqueta } }}>
      {PESTANAS.map((p) => (
        <NativeTabs.Trigger key={p.ruta} name={p.ruta} disabled={pestanaDeshabilitada(p.ruta, examenEnCurso)}>
          <NativeTabs.Trigger.Label>{t(`pestanas.${p.clave}`)}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={p.sf} md={p.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
