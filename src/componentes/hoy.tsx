import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { moduloPorId } from '@/contenido';
import type { Tarea } from '@/reglas/actividad';
import { LOGROS, type IdLogro, type MotivoModulo, type Recomendacion } from '@/reglas/aprendizaje';
import { nivelPorPuntos } from '@/reglas/niveles';
import { descripcionClima } from '@/servicios/clima';
import { useClima } from '@/store/clima';
import { MEDIDAS, useTema } from '@/tema/useTema';

import { Boton, Explicacion } from './controles';
import { Tarjeta } from './Tarjeta';
import { Texto } from './Texto';

/** Texto del motivo de bloqueo de un módulo. */
export function useTextoMotivoModulo() {
  const { t } = useTranslation();
  return (m: MotivoModulo): string => {
    switch (m.tipo) {
      case 'puntos':
        return t('motivos.puntos', { nivel: nivelPorPuntos(m.req).t, req: m.req });
      case 'pre':
        return t('motivos.pre', { lista: m.ids.map((id) => moduloPorId(id)?.t ?? id).join(', ') });
      default:
        return t(`motivos.${m.tipo}`);
    }
  };
}

/** Fila de tarea del día (.task). Se marca y desmarca. */
export function FilaTarea({ tarea, onPress }: { tarea: Tarea; onPress: () => void }) {
  const { t } = useTranslation();
  const { c } = useTema();
  const texto = t(`tareas.${tarea.tipo}`, { nombre: tarea.cultivoNombre });
  return (
    <Pressable
      onPress={onPress}
      testID={`tarea-${tarea.id}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: tarea.hecha }}
      accessibilityLabel={`${texto}. ${t('tareas.puntos', { pts: tarea.puntos, dificultad: t(`tareas.dificultad.${tarea.dificultad}`) })}`}
      style={[estilos.tarea, { backgroundColor: tarea.hecha ? c.accentSoft : c.surface, borderColor: c.border }]}>
      <View style={[estilos.check, { borderColor: c.accent, backgroundColor: tarea.hecha ? c.accent : 'transparent' }]}>
        {tarea.hecha ? (
          <Texto variante="cuerpoFuerte" color="sobreAccent">
            ✓
          </Texto>
        ) : null}
      </View>
      <Texto
        variante="cuerpo"
        color={tarea.hecha ? 'muted' : 'fg'}
        style={[estilos.flex, tarea.hecha ? estilos.tachado : null]}>
        {texto}
      </Texto>
      <Texto variante="secundario" color="gold" style={estilos.pts}>
        {t('tareas.puntos', { pts: tarea.puntos, dificultad: t(`tareas.dificultad.${tarea.dificultad}`) })}
      </Texto>
    </Pressable>
  );
}

/** Grilla de logros (.badges). */
export function Logros({ obtenidos }: { obtenidos: Record<IdLogro, boolean> }) {
  const { t } = useTranslation();
  const { c } = useTema();
  return (
    <View style={estilos.badges}>
      {LOGROS.map((id) => {
        const ok = obtenidos[id];
        return (
          <View
            key={id}
            accessible
            accessibilityState={{ checked: ok }}
            style={[estilos.badge, ok ? { borderColor: c.gold, borderStyle: 'solid', backgroundColor: c.surface } : { borderColor: c.border }]}>
            <Texto variante={ok ? 'cuerpoFuerte' : 'secundario'} color={ok ? 'fg' : 'muted'} style={estilos.centro}>
              {t(`logros.${id}`)}
            </Texto>
          </View>
        );
      })}
    </View>
  );
}

/** Clima y consejo del día (consejoHTML del prototipo). */
export function ClimaConsejo({ ahora }: { ahora: Date }) {
  const { t } = useTranslation();
  const { clima, ciudad } = useClima();
  const tips = t('tips', { returnObjects: true }) as string[];
  const dias = t('clima.diasSemana', { returnObjects: true }) as string[];
  const tip = tips[ahora.getDate() % tips.length];
  return (
    <Tarjeta>
      {clima ? (
        <>
          <Texto variante="secundario">{t('clima.hoyEn', { ciudad })}</Texto>
          <View style={estilos.climaFila}>
            <Texto variante="subtitulo">{t('clima.grados', { t: clima.hoy.t })}</Texto>
            <Texto variante="secundario">{t(`clima.desc.${descripcionClima(clima.hoy.codigo)}`)}</Texto>
          </View>
          <Texto variante="secundario">{t('clima.lluviaViento', { lluvia: clima.hoy.lluvia, viento: clima.hoy.viento })}</Texto>
          <Texto variante="secundario" style={estilos.dias}>
            {clima.dias
              .map((d) => t('clima.dia', { dia: dias[new Date(d.fecha + 'T12:00:00').getDay()], t: t('clima.grados', { t: d.max }), lluvia: d.lluvia }))
              .join(' · ')}
          </Texto>
        </>
      ) : (
        <Texto variante="secundario">{t('clima.sinPronostico')}</Texto>
      )}
      <Explicacion>
        <Texto variante="cuerpo">
          <Texto variante="cuerpoFuerte">{t('clima.consejoDelDia')}</Texto> {tip}
        </Texto>
      </Explicacion>
    </Tarjeta>
  );
}

/** Tarjetas de recomendación de Hoy (recomendacionHTML del prototipo). */
export function TarjetasRecomendacion({ r, intentado }: { r: Recomendacion; intentado: (id: string) => boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const motivo = useTextoMotivoModulo();
  const empezar = (id: string) => (
    <Boton
      texto={intentado(id) ? t('recomendacion.retomar') : t('recomendacion.empezar')}
      onPress={() => router.navigate('/aprender')}
      style={estilos.botonTarjeta}
    />
  );
  return (
    <>
      {r.propio ? (
        <Tarjeta>
          <Texto variante="secundario">{t('recomendacion.propio')}</Texto>
          <Texto variante="cuerpoFuerte">{r.propio.modulo.t}</Texto>
          <Texto variante="secundario">{r.propio.modulo.d}</Texto>
          {r.propio.disponible.ok ? (
            empezar(r.propio.modulo.id)
          ) : (
            <Texto variante="secundario" style={estilos.motivo}>
              {t('recomendacion.bloqueado', { motivo: motivo(r.propio.disponible.motivo) })}
            </Texto>
          )}
        </Tarjeta>
      ) : null}
      {r.otro ? (
        <Tarjeta>
          <Texto variante="secundario">{t(`recomendacion.${r.otro.titulo}`)}</Texto>
          <Texto variante="cuerpoFuerte">{r.otro.modulo.t}</Texto>
          <Texto variante="secundario">{r.otro.modulo.d}</Texto>
          {empezar(r.otro.modulo.id)}
        </Tarjeta>
      ) : null}
      {r.examen ? (
        <Tarjeta>
          <Texto variante="secundario">{t('recomendacion.yaPodesRendir')}</Texto>
          <Texto variante="cuerpoFuerte">{t(`examenes.${r.examen.id}.t`)}</Texto>
          <Texto variante="secundario">{t(`examenes.${r.examen.id}.d`)}</Texto>
          <Boton texto={t('recomendacion.verExamen')} variante="fantasma" onPress={() => router.navigate('/aprender')} style={estilos.botonTarjeta} />
        </Tarjeta>
      ) : null}
    </>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  centro: { textAlign: 'center' },
  tarea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: MEDIDAS.radioTarjeta,
    padding: 12,
    marginBottom: 8,
    minHeight: MEDIDAS.toque,
  },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tachado: { textDecorationLine: 'line-through' },
  pts: { fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { width: '48.5%', borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 10, justifyContent: 'center' },
  climaFila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  dias: { marginTop: 6 },
  motivo: { marginTop: 6 },
  botonTarjeta: { marginTop: 8, marginBottom: 0 },
});
