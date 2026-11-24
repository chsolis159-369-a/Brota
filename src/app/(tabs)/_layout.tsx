import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';

import { PESTANAS, pestanaDeshabilitada } from '@/config/pestanas';
import { useApp } from '@/store/app';
import { useDatos } from '@/store/datos';
import { useTema } from '@/tema/useTema';

export default function PestanasLayout() {
  const { t } = useTranslation();
  const { c } = useTema();
  const examenEnCurso = useApp((s) => s.examenEnCurso);
  const listo = useDatos((s) => s.listo);
  const onboarded = useDatos((s) => s.perfil.onboarded);

  if (!listo) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs
      backgroundColor={c.surface}
      indicatorColor={c.accentSoft}
      labelVisibilityMode="labeled"
      iconColor={{ default: c.muted, selected: c.accent }}
      labelStyle={{ default: { color: c.muted }, selected: { color: c.accent } }}>
      {PESTANAS.map((p) => (
        <NativeTabs.Trigger key={p.ruta} name={p.ruta} disabled={pestanaDeshabilitada(p.ruta, examenEnCurso)}>
          <NativeTabs.Trigger.Label>{t(`pestanas.${p.clave}`)}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={p.sf} md={p.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
