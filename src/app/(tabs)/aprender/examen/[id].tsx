import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useAprendizaje, useTextoMotivoExamen } from '@/componentes/aprender';
import { Boton, Chip } from '@/componentes/controles';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { MODULOS, preguntasDe } from '@/contenido';
import { EXAMENES, intentosHoy, modulosExamen } from '@/reglas/aprendizaje';
import { APROBAR_EXAMEN, INTENTOS_DIA } from '@/reglas/dominio';

/**
 * Ficha de un examen (exInfoHTML del prototipo). Los exámenes se rinden en el servidor (H4):
 * hasta entonces el botón queda deshabilitado con un aviso (D-25).
 */
export default function FichaExamen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const a = useAprendizaje();
  const motivo = useTextoMotivoExamen();
  const ex = EXAMENES.find((x) => x.id === id);
  if (!ex) return <Pantalla />;

  const d = a.disponibleExamen(ex);
  const reg = a.datos.examenes[ex.id];
  const total = modulosExamen(ex, MODULOS, a.plan).reduce((s, m) => s + preguntasDe(m).length, 0);
  const n = Math.min(ex.n, total);
  const pct = Math.round(APROBAR_EXAMEN * 100);

  return (
    <Pantalla>
      <View style={estilos.subnav}>
        <Chip texto={t('examenes.volver')} onPress={() => router.back()} />
      </View>
      <Texto variante="titulo" style={estilos.titulo}>
        {t(`examenes.${ex.id}.t`)}
      </Texto>
      <Tarjeta>
        <Texto variante="secundario">{t(`examenes.${ex.id}.d`)}</Texto>
        {[
          t('examenes.reglas.preguntas', { n, total }),
          t('examenes.reglas.tiempo', { min: n }),
          t('examenes.reglas.nota', { pct }),
          t('examenes.reglas.intentos', { n: INTENTOS_DIA, hoy: intentosHoy(reg) }),
          ex.pts ? t('examenes.reglas.puntos', { pts: ex.pts }) : t('examenes.reglas.maestro'),
        ].map((linea) => (
          <View key={linea} style={estilos.item}>
            <Texto variante="cuerpo">•</Texto>
            <Texto variante="cuerpo" style={estilos.flex}>
              {linea}
            </Texto>
          </View>
        ))}
      </Tarjeta>
      {d.ok ? (
        <>
          <Boton texto={t('examenes.empezar')} onPress={() => {}} disabled testID="empezar-examen" />
          <Texto variante="secundario">{t('examenes.proximamente')}</Texto>
        </>
      ) : (
        <>
          <Tarjeta>
            <Texto variante="secundario">{motivo(d.motivo)}</Texto>
          </Tarjeta>
          {d.motivo.tipo === 'pro' ? <Boton texto={t('planes.verPlanes')} onPress={() => router.navigate('/plan')} /> : null}
        </>
      )}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  subnav: { flexDirection: 'row', marginBottom: 4 },
  titulo: { marginTop: 8, marginBottom: 12 },
  item: { flexDirection: 'row', gap: 8, marginTop: 8 },
  flex: { flex: 1 },
});
