import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAprendizaje, useTextoMotivoExamen } from '@/componentes/aprender';
import { Boton, Chip, Fila, Medalla } from '@/componentes/controles';
import { Etiqueta } from '@/componentes/Etiqueta';
import { Barra } from '@/componentes/graficos';
import { Hero } from '@/componentes/Hero';
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
import { MEDIDAS, superficie, useTema } from '@/tema/useTema';

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
      <Hero>
        <View style={estilos.nivel}>
          <View style={estilos.encoger}>
            <Texto variante="secundario">{t('aprender.tuNivel')}</Texto>
            <Texto variante="titulo" style={estilos.nivelNombre}>
              {nivel.nivel.t}
            </Texto>
          </View>
          <Texto variante="cuerpo">
            <Texto variante="numero">{String(puntos)}</Texto> {t('aprender.pts')}
          </Texto>
        </View>
        <Barra valor={nivel.pct / 100} />
        <Texto variante="secundario">{textoNivel}</Texto>
        <Texto variante="secundario" style={estilos.resumen}>
          {t('aprender.resumen', { a: aprobados, n: delPlan.length, e: a.examenesAprobados, t: EXAMENES.length })}
        </Texto>
      </Hero>

      <View style={estilos.niveles}>
        {NIVELES.map((n, k) => (
          <View key={n.t} style={[estilos.nv, nivel.idx >= k ? { borderColor: c.accentSoft, backgroundColor: c.accentSoft } : { borderColor: c.border, backgroundColor: c.surface }]}>
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
                style={({ pressed }) => [estilos.tarjeta, superficie(c), { opacity: dis.ok ? 1 : 0.6, transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
                <View style={estilos.nivel}>
                  <Medalla icono={dis.ok ? mod.cat : 'bloqueado'} tono={dis.ok ? 'accent' : 'neutro'} />
                  <View style={[estilos.titulo, estilos.flex]}>
                    <Texto variante="subtitulo" style={estilos.encoger}>
                      {mod.t}
                    </Texto>
                    {mod.pro ? <Etiqueta tono="gold">{t('comun.pro')}</Etiqueta> : null}
                  </View>
                  <Texto variante={dis.ok ? 'cuerpo' : 'secundario'} color={dis.ok ? 'gold' : 'muted'} style={dis.ok ? estilos.estrellas : null}>
                    {dis.ok ? estrellas(hecho ? prog.mejorAciertos : 0) : t('aprender.bloqueado')}
                  </Texto>
                </View>
                <Texto variante="secundario">{mod.d}</Texto>
                <Texto variante="secundario">{estado}</Texto>
                {dis.ok ? <Barra valor={hecho ? pts / MAX_PTS_MODULO : 0} /> : null}
              </Pressable>
            );
          })}
          <Boton texto={t('aprender.glosario')} variante="fantasma" icono="glosario" onPress={() => router.push('/aprender/glosario')} testID="glosario" />
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
            style={({ pressed }) => [estilos.tarjeta, superficie(c), { opacity: d.ok || apr ? 1 : 0.6, transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
            <View style={estilos.nivel}>
              <Medalla icono={apr ? 'logro' : ex.pro ? 'pro' : 'examen'} tono={d.ok || apr ? 'accent' : 'neutro'} />
              <View style={[estilos.titulo, estilos.flex]}>
                <Texto variante="subtitulo" style={estilos.encoger}>
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
  nivelNombre: { fontSize: 24, lineHeight: 30 },
  resumen: { marginTop: 6 },
  niveles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  nv: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  negrita: { fontFamily: 'NunitoSans_700Bold' },
  flex: { flex: 1 },
  tarjeta: { borderRadius: MEDIDAS.radioTarjeta, padding: MEDIDAS.rellenoTarjeta, marginBottom: MEDIDAS.separacion, minHeight: MEDIDAS.toque, gap: 6 },
  titulo: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' },
  encoger: { flexShrink: 1 },
  estrellas: { letterSpacing: 2 },
});
