import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { moduloPorId } from '@/contenido';
import type { Tarea } from '@/reglas/actividad';
import { LOGROS, type IdLogro, type MotivoModulo, type Recomendacion } from '@/reglas/aprendizaje';
import { nivelPorPuntos } from '@/reglas/niveles';
import { descripcionClima } from '@/servicios/clima';
import { useClima } from '@/store/clima';
import { MEDIDAS, superficie, useTema } from '@/tema/useTema';

import { Boton, Explicacion, Medalla } from './controles';
import { Icono } from './Icono';
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
      style={({ pressed }) => [estilos.tarea, superficie(c), tarea.hecha ? { backgroundColor: c.accentSoft } : null, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <View style={[estilos.check, { borderColor: c.accent, backgroundColor: tarea.hecha ? c.accent : 'transparent' }]}>
        {tarea.hecha ? <Icono nombre="check" color={c.sobreAccent} tamano={16} /> : null}
      </View>
      <Texto
        variante="cuerpo"
        color={tarea.hecha ? 'muted' : 'fg'}
        style={[estilos.flex, tarea.hecha ? estilos.tachado : null]}>
        {texto}
      </Texto>
      <View style={[estilos.pts, { backgroundColor: c.accentSoft }]}>
        <Texto variante="secundario" color="accent" style={estilos.ptsTexto}>
          {t('tareas.puntos', { pts: tarea.puntos, dificultad: t(`tareas.dificultad.${tarea.dificultad}`) })}
        </Texto>
      </View>
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
            style={[estilos.badge, ok ? { borderColor: c.accentSoft, borderStyle: 'solid', backgroundColor: c.accentSoft } : { borderColor: c.bordeCampo, backgroundColor: c.surfaceAlt }]}>
            <Icono nombre={ok ? 'logro' : 'bloqueado'} color={ok ? c.accent : c.muted} />
            <Texto variante={ok ? 'cuerpoFuerte' : 'secundario'} color={ok ? 'fg' : 'muted'} style={estilos.flex}>
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
  const porque = t('tipsPorque', { returnObjects: true }) as string[];
  const dias = t('clima.diasSemana', { returnObjects: true }) as string[];
  const i = ahora.getDate() % tips.length;
  const tip = tips[i];
  return (
    <Tarjeta>
      {clima ? (
        <>
          <View style={estilos.climaFila}>
            <Medalla icono={descripcionClima(clima.hoy.codigo)} tono="info" tamano={48} />
            <View style={estilos.flex}>
              <Texto variante="secundario">{t('clima.hoyEn', { ciudad })}</Texto>
              <View style={estilos.climaGrados}>
                <Texto variante="numeroGrande">{t('clima.grados', { t: clima.hoy.t })}</Texto>
                <Texto variante="secundario">{t(`clima.desc.${descripcionClima(clima.hoy.codigo)}`)}</Texto>
              </View>
            </View>
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
      <Explicacion icono="consejo">
        <Texto variante="cuerpo">
          <Texto variante="cuerpoFuerte">{t('clima.consejoDelDia')}</Texto> {tip}
        </Texto>
        {porque[i] ? (
          <Texto variante="secundario" color="fg" style={estilos.porque}>
            <Texto variante="secundario" color="fg" style={estilos.negrita}>
              {t('clima.porQue')}
            </Texto>{' '}
            {porque[i]}
          </Texto>
        ) : null}
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
      onPress={() => router.navigate({ pathname: '/aprender/modulo/[id]', params: { id } })}
      style={estilos.botonTarjeta}
      testID={`empezar-${id}`}
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
          <Boton
            texto={t('recomendacion.verExamen')}
            variante="fantasma"
            onPress={() => router.navigate({ pathname: '/aprender/examen/[id]', params: { id: r.examen!.id } })}
            style={estilos.botonTarjeta}
          />
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
    gap: 12,
    borderRadius: MEDIDAS.radioTarjeta,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    minHeight: 56,
  },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tachado: { textDecorationLine: 'line-through' },
  pts: { flexShrink: 0, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ptsTexto: { fontFamily: 'NunitoSans_700Bold' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 12,
    minHeight: 56,
  },
  climaFila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  climaGrados: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  dias: { marginTop: 10 },
  motivo: { marginTop: 6 },
  porque: { marginTop: 8 },
  negrita: { fontFamily: 'NunitoSans_700Bold' },
  botonTarjeta: { marginTop: 8, marginBottom: 0 },
});
