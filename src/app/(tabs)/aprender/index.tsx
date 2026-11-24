import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAprendizaje, useTextoMotivoExamen } from '@/componentes/aprender';
import { Boton, Chip, Fila } from '@/componentes/controles';
import { Etiqueta } from '@/componentes/Etiqueta';
import { Barra } from '@/componentes/graficos';
import { useTextoMotivoModulo } from '@/componentes/hoy';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { MODULOS } from '@/contenido';
import type { Categoria } from '@/contenido/tipos';
import { EXAMENES, moduloAprobado, modulosDelPlan } from '@/reglas/aprendizaje';
import { APROBAR_EXAMEN, MAX_PTS_MODULO } from '@/reglas/dominio';
import { NIVELES } from '@/reglas/niveles';
import { estrellas } from '@/reglas/test';
import { MEDIDAS, useTema } from '@/tema/useTema';

const CATEGORIAS: ('todas' | Exclude<Categoria, 'cannabis'>)[] = ['todas', 'huerta', 'nutricion', 'hidro', 'inerte', 'luz', 'plagas'];

/** Aprender (aprenderHTML del prototipo): nivel, módulos por categoría y exámenes. */
export default function Aprender() {
  const { t } = useTranslation();
  const { c } = useTema();
  const router = useRouter();
  const a = useAprendizaje();
  const motivoModulo = useTextoMotivoModulo();
  const [sec, setSec] = useState<'modulos' | 'examenes'>('modulos');
  const [cat, setCat] = useState<(typeof CATEGORIAS)[number]>('todas');

  const { nivel, puntos } = a;
  const m = nivel.mensaje;
  const textoNivel =
    m.tipo === 'pendiente'
      ? t('aprender.pendiente')
      : m.tipo === 'faltan'
        ? t('aprender.faltan', { n: m.puntos, nivel: m.nivel }) + (m.hastaMaestro ? t('aprender.hastaMaestro') : '') + '.'
        : t('aprender.maximo');
  const delPlan = modulosDelPlan(MODULOS, a.plan);
  const aprobados = delPlan.filter((x) => moduloAprobado(a.datos.progreso, x.id)).length;
  const lista = MODULOS.filter((x) => cat === 'todas' || x.cat === cat);

  return (
    <Pantalla titulo={t('titulos.aprender')}>
      <Tarjeta>
        <View style={estilos.nivel}>
          <View>
            <Texto variante="secundario">{t('aprender.tuNivel')}</Texto>
            <Texto variante="titulo" style={estilos.nivelNombre}>
              {nivel.nivel.t}
            </Texto>
          </View>
          <Texto variante="cuerpo">
            <Texto variante="cuerpoFuerte">{String(puntos)}</Texto> {t('aprender.pts')}
          </Texto>
        </View>
        <Barra valor={nivel.pct / 100} />
        <Texto variante="secundario">{textoNivel}</Texto>
        <Texto variante="secundario" style={estilos.resumen}>
          {t('aprender.resumen', { a: aprobados, n: delPlan.length, e: a.examenesAprobados, t: EXAMENES.length })}
        </Texto>
      </Tarjeta>

      <View style={estilos.niveles}>
        {NIVELES.map((n, k) => (
          <View key={n.t} style={[estilos.nv, { borderColor: nivel.idx >= k ? c.gold : c.border }]}>
            <Texto variante="secundario" color={nivel.idx >= k ? 'fg' : 'muted'} style={nivel.idx >= k ? estilos.negrita : null}>
              {t('aprender.nivelChip', { t: n.t, min: n.min })}
            </Texto>
          </View>
        ))}
      </View>

      <Fila>
        <Chip texto={t('aprender.modulos')} activo={sec === 'modulos'} onPress={() => setSec('modulos')} testID="sec-modulos" />
        <Chip texto={t('aprender.examenes')} activo={sec === 'examenes'} onPress={() => setSec('examenes')} testID="sec-examenes" />
      </Fila>

      {sec === 'examenes' ? (
        <ListaExamenes />
      ) : (
        <>
          <Fila>
            {CATEGORIAS.map((k) => (
              <Chip key={k} texto={t(`categorias.${k}`)} activo={cat === k} onPress={() => setCat(k)} />
            ))}
          </Fila>
          {lista.map((mod) => {
            const dis = a.disponibleModulo(mod.id);
            const prog = a.datos.progreso[mod.id];
            const hecho = prog !== undefined;
            const apr = moduloAprobado(a.datos.progreso, mod.id);
            const pts = prog?.mejorPuntos ?? 0;
            const estado = dis.ok
              ? hecho
                ? (apr ? t('aprender.aprobadoPrefijo') : t('aprender.sinAprobarPrefijo')) + t('aprender.mejor', { pts, max: MAX_PTS_MODULO })
                : t('aprender.sinIntentar', { max: MAX_PTS_MODULO })
              : motivoModulo(dis.motivo);
            return (
              <Pressable
                key={mod.id}
                accessibilityRole="button"
                accessibilityState={{ disabled: !dis.ok }}
                testID={`modulo-${mod.id}`}
                onPress={() => {
                  if (dis.ok) router.push({ pathname: '/aprender/modulo/[id]', params: { id: mod.id } });
                  else if (dis.motivo.tipo === 'pro') router.navigate('/plan');
                }}
                style={[estilos.tarjeta, { backgroundColor: c.surface, borderColor: c.border, opacity: dis.ok ? 1 : 0.55 }]}>
                <View style={estilos.nivel}>
                  <View style={estilos.titulo}>
                    <Texto variante="cuerpoFuerte" style={estilos.encoger}>
                      {mod.t}
                    </Texto>
                    {mod.pro ? <Etiqueta tono="gold">{t('comun.pro')}</Etiqueta> : null}
                  </View>
                  <Texto variante="cuerpo" color="gold" style={estilos.estrellas}>
                    {dis.ok ? estrellas(hecho ? prog.mejorAciertos : 0) : t('aprender.bloqueado')}
                  </Texto>
                </View>
                <Texto variante="secundario">{mod.d}</Texto>
                <Texto variante="secundario">{estado}</Texto>
                <Barra valor={dis.ok && hecho ? pts / MAX_PTS_MODULO : 0} />
              </Pressable>
            );
          })}
          <Boton texto={t('aprender.glosario')} variante="fantasma" onPress={() => router.push('/aprender/glosario')} testID="glosario" />
        </>
      )}
    </Pantalla>
  );
}

/** Lista de exámenes (examenesListaHTML del prototipo). */
function ListaExamenes() {
  const { t } = useTranslation();
  const { c } = useTema();
  const router = useRouter();
  const a = useAprendizaje();
  const motivo = useTextoMotivoExamen();
  return (
    <>
      <Tarjeta>
        <Texto variante="cuerpoFuerte">{t('examenes.titulo')}</Texto>
        <Texto variante="secundario" style={estilos.resumen}>
          {t('examenes.intro', { pct: Math.round(APROBAR_EXAMEN * 100) })}
        </Texto>
      </Tarjeta>
      {EXAMENES.map((ex) => {
        const d = a.disponibleExamen(ex);
        const reg = a.datos.examenes[ex.id];
        const apr = !!reg?.aprobado;
        const estado = apr
          ? t('examenes.estadoAprobado', { pct: Math.round(reg.mejor * 100) })
          : reg?.mejor
            ? t('examenes.estadoMejor', { pct: Math.round(reg.mejor * 100) }) + (d.ok ? '' : ' · ' + motivo(d.motivo))
            : d.ok
              ? t('examenes.estadoDisponible')
              : motivo(d.motivo);
        return (
          <Pressable
            key={ex.id}
            accessibilityRole="button"
            testID={`examen-${ex.id}`}
            onPress={() => router.push({ pathname: '/aprender/examen/[id]', params: { id: ex.id } })}
            style={[estilos.tarjeta, { backgroundColor: c.surface, borderColor: c.border, opacity: d.ok || apr ? 1 : 0.55 }]}>
            <View style={estilos.nivel}>
              <View style={estilos.titulo}>
                <Texto variante="cuerpoFuerte" style={estilos.encoger}>
                  {t(`examenes.${ex.id}.t`)}
                </Texto>
                {ex.pro ? <Etiqueta tono="gold">{t('comun.pro')}</Etiqueta> : null}
              </View>
              <Texto variante="cuerpo" color="gold">
                {apr ? '★' : ''}
              </Texto>
            </View>
            <Texto variante="secundario">{t(`examenes.${ex.id}.d`)}</Texto>
            <Texto variante="secundario">{estado}</Texto>
          </Pressable>
        );
      })}
    </>
  );
}

const estilos = StyleSheet.create({
  nivel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  nivelNombre: { fontSize: 18, lineHeight: 22 },
  resumen: { marginTop: 6 },
  niveles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  nv: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  negrita: { fontFamily: 'NunitoSans_700Bold' },
  tarjeta: { borderWidth: 1, borderRadius: MEDIDAS.radioTarjeta, padding: 14, marginBottom: 10, minHeight: MEDIDAS.toque },
  titulo: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' },
  encoger: { flexShrink: 1 },
  estrellas: { letterSpacing: 2 },
});
