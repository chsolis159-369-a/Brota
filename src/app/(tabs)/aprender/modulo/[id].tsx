import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAprendizaje } from '@/componentes/aprender';
import { Boton, Chip, Explicacion, Mensaje } from '@/componentes/controles';
import { Barra } from '@/componentes/graficos';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { MODULOS, moduloPorId } from '@/contenido';
import type { Modulo } from '@/contenido/tipos';
import { EXAMENES, moduloAprobado } from '@/reglas/aprendizaje';
import { APROBAR_MODULO, BONUS_PERFECTO, MAX_PTS_MODULO, PREGS_TEST } from '@/reglas/dominio';
import {
  armarTest,
  corregirTest,
  estrellas,
  mensajeResultado,
  puntosPregunta,
  type PreguntaArmada,
  type ResultadoTest,
} from '@/reglas/test';
import { useDatos } from '@/store/datos';
import { MEDIDAS, useTema } from '@/tema/useTema';

type Fase =
  | { tipo: 'leccion'; i: number }
  | { tipo: 'test'; pregs: PreguntaArmada[]; q: number; resp: number | null; respuestas: number[] }
  | { tipo: 'resultado'; pregs: PreguntaArmada[]; r: ResultadoTest; gan: number; mejor: number };

/** Módulo: lecciones, test y resultado (moduloHTML, quizHTML y resultadoHTML del prototipo). */
export default function PantallaModulo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = moduloPorId(id);
  const a = useAprendizaje();
  if (!m || !a.disponibleModulo(m.id).ok) return <Pantalla />;
  return <Contenido key={m.id} m={m} />;
}

function Contenido({ m }: { m: Modulo }) {
  const [fase, setFase] = useState<Fase>({ tipo: 'leccion', i: 0 });
  const empezarTest = () => {
    const pregs = armarTest(m, useDatos.getState().vistasTest[m.id] ?? []);
    useDatos.getState().recordarVistas(m.id, pregs.map((q) => q.p));
    setFase({ tipo: 'test', pregs, q: 0, resp: null, respuestas: [] });
  };
  if (fase.tipo === 'leccion') return <Lecciones m={m} i={fase.i} setI={(i) => setFase({ tipo: 'leccion', i })} empezarTest={empezarTest} />;
  if (fase.tipo === 'test') return <Test m={m} fase={fase} setFase={setFase} />;
  return <Resultado m={m} fase={fase} repetir={empezarTest} />;
}

function Lecciones({ m, i, setI, empezarTest }: { m: Modulo; i: number; setI: (i: number) => void; empezarTest: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const l = m.lec[i]!;
  const ultima = i === m.lec.length - 1;
  return (
    <Pantalla>
      <View style={estilos.subnav}>
        <Chip texto={t('aprender.volverModulos')} onPress={() => router.back()} />
        <Texto variante="secundario">{t('aprender.leccion', { i: i + 1, n: m.lec.length })}</Texto>
      </View>
      <Texto variante="secundario">{m.t}</Texto>
      {m.aviso ? (
        <Explicacion>
          <Texto variante="cuerpo">{m.aviso}</Texto>
        </Explicacion>
      ) : null}
      <Texto variante="titulo" style={estilos.titulo}>
        {l.t}
      </Texto>
      <Tarjeta>
        <Texto variante="cuerpo" style={estilos.leccion}>
          {l.x}
        </Texto>
      </Tarjeta>
      <Barra valor={(i + 1) / m.lec.length} />
      {ultima ? (
        <Texto variante="secundario" style={estilos.nota}>
          {t('aprender.comoAprobar', { a: APROBAR_MODULO, n: PREGS_TEST })}
        </Texto>
      ) : null}
      <Boton
        texto={ultima ? t('aprender.hacerTest', { n: PREGS_TEST }) : t('aprender.siguienteLeccion')}
        onPress={() => (ultima ? empezarTest() : setI(i + 1))}
        testID="leccion-siguiente"
      />
    </Pantalla>
  );
}

function Test({ m, fase, setFase }: { m: Modulo; fase: Extract<Fase, { tipo: 'test' }>; setFase: (f: Fase) => void }) {
  const { t } = useTranslation();
  const { c } = useTema();
  const router = useRouter();
  const { pregs, q, resp } = fase;
  const preg = pregs[q]!;
  const n = pregs.length;
  const respondida = resp !== null;

  const responder = (idx: number) => {
    if (!respondida) setFase({ ...fase, resp: idx, respuestas: [...fase.respuestas, idx] });
  };
  const siguiente = async () => {
    if (!respondida) return;
    if (q < n - 1) return setFase({ ...fase, q: q + 1, resp: null });
    const r = corregirTest(pregs, fase.respuestas);
    const { gan, mejor } = await useDatos.getState().terminarTest(m.id, r);
    setFase({ tipo: 'resultado', pregs, r, gan, mejor });
  };

  return (
    <Pantalla>
      <View style={estilos.subnav}>
        <Chip texto={t('test.salir')} onPress={() => router.back()} />
        <Texto variante="secundario">{t('test.pregunta', { i: q + 1, n })}</Texto>
      </View>
      <Barra valor={q / n} />
      <Texto variante="secundario">{t('test.etiqueta', { dificultad: t(`test.dificultad.${preg.d}`), pts: puntosPregunta(preg.d) })}</Texto>
      <Texto variante="subtitulo" style={estilos.pregunta} accessibilityRole="header">
        {preg.p}
      </Texto>
      {preg.o.map((op, idx) => {
        const esCorrecta = respondida && idx === preg.r;
        const esMal = respondida && idx === resp && idx !== preg.r;
        return (
          <Pressable
            key={op}
            onPress={() => responder(idx)}
            accessibilityRole="button"
            accessibilityState={{ selected: resp === idx, disabled: respondida }}
            testID={`opcion-${idx}`}
            style={[
              estilos.opcion,
              {
                backgroundColor: esCorrecta ? c.accentSoft : c.surface,
                borderColor: esCorrecta ? c.ok : esMal ? c.alert : c.border,
              },
            ]}>
            <Texto variante="cuerpo">{op}</Texto>
          </Pressable>
        );
      })}
      {respondida ? (
        <>
          <View accessibilityLiveRegion="polite">
            <Explicacion>
              <Texto variante="cuerpo">
                <Texto variante="cuerpoFuerte">{resp === preg.r ? t('test.correcto') : t('test.casi')}</Texto> {preg.e}
              </Texto>
            </Explicacion>
          </View>
          <Boton texto={q < n - 1 ? t('test.siguiente') : t('test.verPuntaje')} onPress={() => void siguiente()} testID="test-siguiente" />
        </>
      ) : null}
    </Pantalla>
  );
}

function Resultado({ m, fase, repetir }: { m: Modulo; fase: Extract<Fase, { tipo: 'resultado' }>; repetir: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const a = useAprendizaje();
  const { r, pregs } = fase;
  const n = pregs.length;
  const tipo = mensajeResultado(r);
  const mensaje =
    tipo === 'perfecto'
      ? t('test.mensajes.perfecto', { bonus: BONUS_PERFECTO })
      : tipo === 'aprobado'
        ? t('test.mensajes.aprobado')
        : t(`test.mensajes.${tipo}`, { a: APROBAR_MODULO, n });
  const siguiente = MODULOS.find((x) => x.id !== m.id && !moduloAprobado(a.datos.progreso, x.id) && a.disponibleModulo(x.id).ok);
  const examen = EXAMENES.find((ex) => a.disponibleExamen(ex).ok && !a.datos.examenes[ex.id]?.aprobado);

  return (
    <Pantalla>
      <Tarjeta style={estilos.resultado}>
        <Texto variante="secundario" style={estilos.centro}>
          {t('test.resultado', { modulo: m.t })}
        </Texto>
        <Texto variante="titulo" color="gold" style={[estilos.centro, estilos.estrellas]} accessibilityLabel={`${r.aciertos} / ${n}`}>
          {estrellas(r.aciertos, n)}
        </Texto>
        <Texto variante="titulo" style={estilos.centro}>
          {t('test.aciertos', { a: r.aciertos, n })}
        </Texto>
        <View style={estilos.centrado}>
          <Mensaje tipo={r.aprobado ? 'ok' : 'alerta'}>{r.aprobado ? t('test.aprobado') : t('test.sinAprobar')}</Mensaje>
          <Mensaje tipo="ok">{t('test.puntosNuevos', { gan: fase.gan, mejor: fase.mejor, max: MAX_PTS_MODULO })}</Mensaje>
        </View>
        <Texto variante="secundario" style={estilos.centro}>
          {t('test.mejorMarca')}
        </Texto>
        <Texto variante="cuerpo" style={[estilos.centro, estilos.mensaje]}>
          {mensaje}
        </Texto>
      </Tarjeta>
      <Boton texto={t('test.repetir')} onPress={repetir} testID="repetir-test" />
      {examen ? (
        <Boton
          texto={t('test.yaPodesRendir', { examen: t(`examenes.${examen.id}.t`) })}
          onPress={() => router.replace({ pathname: '/aprender/examen/[id]', params: { id: examen.id } })}
        />
      ) : null}
      {siguiente ? (
        <Boton
          texto={t('test.seguirCon', { modulo: siguiente.t })}
          variante="fantasma"
          onPress={() => router.replace({ pathname: '/aprender/modulo/[id]', params: { id: siguiente.id } })}
        />
      ) : null}
      <Boton texto={t('test.volver')} variante="fantasma" onPress={() => router.back()} testID="volver-modulos" />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  subnav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  titulo: { marginTop: 8, marginBottom: 12 },
  leccion: { fontSize: 16, lineHeight: 26 },
  nota: { marginBottom: 8 },
  pregunta: { fontSize: 18, lineHeight: 24, marginTop: 4, marginBottom: 12 },
  opcion: { borderWidth: 1, borderRadius: MEDIDAS.radioControl, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8, minHeight: MEDIDAS.toque },
  resultado: { paddingVertical: 24, alignItems: 'stretch' },
  centro: { textAlign: 'center' },
  centrado: { alignItems: 'center' },
  estrellas: { fontSize: 28, lineHeight: 36, marginVertical: 10, letterSpacing: 2 },
  mensaje: { marginTop: 8 },
});
