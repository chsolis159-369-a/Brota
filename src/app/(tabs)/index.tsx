import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { CANNABIS_HABILITADO } from '@/config/flags';
import { MODULOS } from '@/contenido';
import { Boton, Estadisticas, Mensaje, Subtitulo } from '@/componentes/controles';
import { TarjetaCultivo } from '@/componentes/cultivo';
import { Anillo } from '@/componentes/graficos';
import { Vacio } from '@/componentes/estados';
import { Hero } from '@/componentes/Hero';
import { ClimaConsejo, FilaTarea, Logros, TarjetasRecomendacion } from '@/componentes/hoy';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { TOPE_TAREAS_DIA } from '@/reglas/dominio';
import { lluviaManana } from '@/servicios/clima';
import { useApp } from '@/store/app';
import { useClima } from '@/store/clima';
import { useDatos } from '@/store/datos';
import { resumenHoy } from '@/store/derivados';

export default function Hoy() {
  const { t } = useTranslation();
  const router = useRouter();
  const datos = useDatos();
  const plan = useApp((s) => s.plan);
  const clima = useClima((s) => s.clima);
  const ahora = new Date();

  useFocusEffect(
    useCallback(() => {
      void useClima.getState().actualizar();
    }, []),
  );

  const r = resumenHoy(
    { ...datos, plan, perfil: datos.perfil.perfil },
    { lluviaManana: lluviaManana(clima), modulos: MODULOS, cannabisHabilitado: CANNABIS_HABILITADO },
    ahora,
  );
  const total = r.tareas.length;
  const abrirCultivo = (id: string) => router.push({ pathname: '/cultivos/[id]', params: { id } });

  return (
    <Pantalla titulo={t('titulos.hoy')}>
      <Hero style={estilos.hero} testID="resumen-hoy">
        <Anillo progreso={total ? r.hechas / total : 0} tamano={84} />
        <View accessible style={estilos.flex}>
          <Texto variante="numeroGrande">{t('hoy.hechasDe', { hechas: r.hechas, total })}</Texto>
          <Texto variante="cuerpo" color="muted">
            {t('hoy.tareasDeHoy')}
          </Texto>
        </View>
      </Hero>

      <TarjetasRecomendacion r={r.recomendacion} intentado={(id) => datos.progreso[id] !== undefined} />

      <Estadisticas
        items={[
          { valor: r.puntos, etiqueta: t('hoy.puntos'), icono: 'puntos' },
          { valor: r.racha, etiqueta: t('hoy.diasSeguidos'), icono: 'racha' },
          { valor: t(`niveles.${r.nivel.t}`), etiqueta: t('hoy.nivel'), texto: true, icono: 'nivel' },
        ]}
      />

      <Subtitulo>{t('hoy.tituloTareas')}</Subtitulo>
      {total === 0 ? (
        <Tarjeta>
          <Vacio icono="cultivo">{t('hoy.sinCultivos')}</Vacio>
          <Boton texto={t('hoy.crearPrimero')} onPress={() => router.navigate({ pathname: '/cultivos', params: { crear: '1' } })} style={estilos.boton} />
        </Tarjeta>
      ) : (
        r.tareas.map((tarea) => <FilaTarea key={tarea.id} tarea={tarea} onPress={() => void datos.alternarTarea(tarea.id)} />)
      )}
      {total > 0 && r.hechas === total ? <Mensaje tipo="ok">{t('hoy.todasHechas')}</Mensaje> : null}
      {total > 0 ? <Texto variante="secundario">{t('hoy.topeTareas', { pts: r.ptsTareasHoy, tope: TOPE_TAREAS_DIA })}</Texto> : null}

      <Subtitulo>{t('hoy.tusCultivos')}</Subtitulo>
      {datos.cultivos.map((c) => (
        <TarjetaCultivo key={c.id} c={c} ahora={ahora} onPress={() => abrirCultivo(c.id)} />
      ))}

      <Subtitulo>{t('hoy.logros')}</Subtitulo>
      <Logros obtenidos={r.logros} />

      <Subtitulo>{t('hoy.climaYConsejo')}</Subtitulo>
      <ClimaConsejo ahora={ahora} />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flex: { flex: 1 },
  boton: { marginTop: 8, marginBottom: 0 },
});
