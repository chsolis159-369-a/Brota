import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { VERSION_PRUEBA } from '@/config/flags';
import { useApp } from '@/store/app';
import { superficie, useTema } from '@/tema/useTema';

import { Etiqueta } from './Etiqueta';
import { Logo } from './Logo';
import { Texto } from './Texto';

/** Logo y "BROTA", y el plan actual con la etiqueta "Prueba" en la versión pública de prueba. */
export function Encabezado() {
  const { t } = useTranslation();
  const { c } = useTema();
  const plan = useApp((s) => s.plan);
  const etiqueta = plan === 'gratis' ? t('encabezado.planGratis') : t('planes.pro');
  return (
    <View style={estilos.fila}>
      <View style={estilos.marca}>
        <Logo tamano={36} />
        <Texto variante="marca" color="accent" accessibilityRole="header">
          {t('marca')}
        </Texto>
      </View>
      <View style={[estilos.plan, superficie(c)]}>
        <Texto variante="secundario" color="fg" style={estilos.nombrePlan}>
          {etiqueta}
        </Texto>
        {VERSION_PRUEBA ? (
          <>
            <Texto variante="secundario" accessibilityElementsHidden importantForAccessibility="no">
              {' · '}
            </Texto>
            <Etiqueta tono="gold">{t('encabezado.prueba')}</Etiqueta>
          </>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  plan: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, borderRadius: 999, paddingLeft: 12, paddingRight: 6, paddingVertical: 5 },
  nombrePlan: { fontFamily: 'NunitoSans_600SemiBold' },
});
