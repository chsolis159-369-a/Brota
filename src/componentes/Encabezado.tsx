import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { VERSION_PRUEBA } from '@/config/flags';
import { useApp } from '@/store/app';
import { MEDIDAS, useTema } from '@/tema/useTema';

import { Etiqueta } from './Etiqueta';
import { Icono } from './Icono';
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
      <View style={[estilos.plan, { backgroundColor: c.surface, borderColor: c.border }]}>
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

/**
 * Botón de Configuración (D-35), a la derecha del título de cada pestaña (en el encabezado no entra junto
 * al plan). Se desactiva durante un examen, como las otras pestañas.
 */
export function BotonAjustes() {
  const { t } = useTranslation();
  const { c } = useTema();
  const examenEnCurso = useApp((s) => s.examenEnCurso);
  return (
    <Pressable
      onPress={() => router.push('/configuracion')}
      disabled={examenEnCurso}
      accessibilityRole="button"
      accessibilityLabel={t('configuracion.abrir')}
      accessibilityState={{ disabled: examenEnCurso }}
      testID="abrir-configuracion"
      style={({ pressed }) => [estilos.ajustes, { borderColor: c.border, backgroundColor: c.surface, opacity: examenEnCurso ? 0.4 : pressed ? 0.7 : 1 }]}>
      <Icono nombre="ajustes" color={c.fg} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: {
    paddingTop: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
    rowGap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  plan: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, borderWidth: 1, borderRadius: 999, paddingLeft: 14, paddingRight: 6, paddingVertical: 5 },
  nombrePlan: { fontFamily: 'NunitoSans_600SemiBold' },
  ajustes: { width: MEDIDAS.toque, height: MEDIDAS.toque, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
