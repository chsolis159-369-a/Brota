import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { VERSION_PRUEBA } from '@/config/flags';
import { useApp } from '@/store/app';

import { Etiqueta } from './Etiqueta';
import { Texto } from './Texto';

/** "BROTA" y el plan actual, con la etiqueta "Prueba" en la versión pública de prueba. */
export function Encabezado() {
  const { t } = useTranslation();
  const plan = useApp((s) => s.plan);
  const etiqueta = plan === 'gratis' ? t('encabezado.planGratis') : t('planes.pro');
  return (
    <View style={estilos.fila}>
      <Texto variante="marca" color="accent" accessibilityRole="header">
        {t('marca')}
      </Texto>
      <View style={estilos.plan}>
        <Texto variante="secundario">{etiqueta}</Texto>
        {VERSION_PRUEBA ? (
          <>
            <Texto variante="secundario" accessibilityElementsHidden importantForAccessibility="no">
              {' · '}
            </Texto>
            <Etiqueta>{t('encabezado.prueba')}</Etiqueta>
          </>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  plan: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
});
