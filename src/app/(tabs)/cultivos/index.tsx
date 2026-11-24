import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Boton, Campo, Chip, Estadisticas, Fila, Subtitulo } from '@/componentes/controles';
import { TarjetaCultivo, datosSalud } from '@/componentes/cultivo';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { limiteAlcanzado, PLANTILLAS, saludCultivo } from '@/reglas/cultivos';
import { ETAPAS, UBICACIONES, type Etapa, type Ubicacion } from '@/reglas/dominio';
import { hoyStr } from '@/reglas/fechas';
import { useApp } from '@/store/app';
import { useDatos } from '@/store/datos';
import { MEDIDAS, useTema } from '@/tema/useTema';

const FILTROS = ['todos', 'interior', 'exterior', 'alertas'] as const;
type Filtro = (typeof FILTROS)[number];

type Form = { nombre: string; tipo: string; ubicacion: Ubicacion; etapa: Etapa; fecha: string; plantilla?: string };
const formVacio = (): Form => ({ nombre: '', tipo: '', ubicacion: 'interior', etapa: 'Siembra', fecha: hoyStr() });

/** Lista de cultivos (cultivosHTML del prototipo). */
export default function Cultivos() {
  const { t } = useTranslation();
  const { c: colores } = useTema();
  const router = useRouter();
  const { crear } = useLocalSearchParams<{ crear?: string }>();
  const cultivos = useDatos((s) => s.cultivos);
  const plan = useApp((s) => s.plan);
  const [creandoLocal, setCreandoLocal] = useState(false);
  const [form, setForm] = useState<Form>(formVacio);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const ahora = new Date();

  // Desde Hoy ("Crear mi primer cultivo") se llega con ?crear=1 y el formulario abierto.
  const creando = creandoLocal || crear === '1';
  const setCreando = (v: boolean) => {
    setCreandoLocal(v);
    if (!v && crear) router.setParams({ crear: undefined });
  };

  const propios = cultivos.filter((c) => !c.ejemplo).length;
  const lleno = limiteAlcanzado(plan, propios);
  const alerta = (c: (typeof cultivos)[number]) => saludCultivo(datosSalud(c), ahora).nivel === 'alerta';
  const lista = cultivos.filter((c) => filtro === 'todos' || (filtro === 'alertas' ? alerta(c) : c.ubicacion === filtro));
  const hay = cultivos.length > 0;

  const guardar = async () => {
    const r = await useDatos.getState().crearCultivo(form);
    if (r.ok) {
      setForm(formVacio());
      setCreando(false);
    }
  };

  return (
    <Pantalla titulo={t('titulos.cultivos')}>
      {hay ? (
        <Estadisticas
          items={[
            { valor: cultivos.length, etiqueta: t('cultivos.stats.cultivos') },
            { valor: cultivos.filter((c) => c.etapa === 'Cosecha').length, etiqueta: t('cultivos.stats.enCosecha') },
            { valor: cultivos.filter(alerta).length, etiqueta: t('cultivos.stats.conAlertas') },
          ]}
        />
      ) : null}

      {lleno ? (
        <Tarjeta>
          <Texto variante="cuerpoFuerte">{t('cultivos.limiteTitulo')}</Texto>
          <Texto variante="secundario" style={estilos.parrafo}>
            {t('cultivos.limiteTexto')}
          </Texto>
          <Boton texto={t('planes.verPlanes')} onPress={() => router.navigate('/plan')} testID="ver-planes-limite" />
        </Tarjeta>
      ) : (
        <Boton
          texto={creando ? t('comun.cancelar') : t('cultivos.nuevo')}
          variante={creando ? 'fantasma' : 'primario'}
          onPress={() => setCreando(!creando)}
          testID="nuevo-cultivo"
        />
      )}

      {creando && !lleno ? (
        <Tarjeta>
          <Campo etiqueta={t('cultivos.form.nombre')} value={form.nombre} onChangeText={(nombre) => setForm({ ...form, nombre })} testID="campo-nombre" />
          <Campo etiqueta={t('cultivos.form.tipo')} value={form.tipo} onChangeText={(tipo) => setForm({ ...form, tipo })} testID="campo-tipo" />
          <Texto variante="secundario">{t('cultivos.form.ubicacion')}</Texto>
          <Fila>
            {UBICACIONES.map((u) => (
              <Chip key={u} texto={t(`cultivos.ubicaciones.${u}`)} activo={form.ubicacion === u} onPress={() => setForm({ ...form, ubicacion: u })} testID={`ubicacion-${u}`} />
            ))}
          </Fila>
          <Texto variante="secundario">{t('cultivos.form.etapa')}</Texto>
          <Fila>
            {ETAPAS.map((e) => (
              <Chip key={e} texto={t(`etapas.${e}`)} activo={form.etapa === e} onPress={() => setForm({ ...form, etapa: e })} />
            ))}
          </Fila>
          <Campo etiqueta={t('cultivos.form.fecha')} value={form.fecha} onChangeText={(fecha) => setForm({ ...form, fecha })} autoCapitalize="none" />
          <Boton texto={t('cultivos.form.guardar')} onPress={() => void guardar()} testID="guardar-cultivo" />
        </Tarjeta>
      ) : null}

      {hay ? (
        <>
          <Fila style={estilos.filtros}>
            {FILTROS.map((f) => (
              <Chip key={f} texto={t(`cultivos.filtros.${f}`)} activo={filtro === f} onPress={() => setFiltro(f)} />
            ))}
          </Fila>
          {lista.length ? (
            lista.map((c) => <TarjetaCultivo key={c.id} c={c} ahora={ahora} onPress={() => router.push({ pathname: '/cultivos/[id]', params: { id: c.id } })} />)
          ) : (
            <Texto variante="secundario">{t('cultivos.sinCoincidencias')}</Texto>
          )}
        </>
      ) : (
        <>
          <Texto variante="secundario">{t('cultivos.vacio')}</Texto>
          {!creando ? (
            <>
              <Subtitulo>{t('cultivos.empezarRapido')}</Subtitulo>
              <View style={estilos.plantillas}>
                {PLANTILLAS.map((p) => (
                  <Pressable
                    key={p.nombre}
                    accessibilityRole="button"
                    onPress={() => {
                      setForm({ nombre: p.nombre, tipo: p.tipo, ubicacion: p.ubicacion, etapa: 'Siembra', fecha: hoyStr(), plantilla: p.nombre });
                      setCreando(true);
                    }}
                    style={[estilos.plantilla, { backgroundColor: colores.surface, borderColor: colores.border }]}>
                    <Texto variante="cuerpoFuerte">{p.nombre}</Texto>
                    <Texto variante="secundario">{t('cultivos.plantilla', { tipo: p.tipo, ubicacion: p.ubicacion })}</Texto>
                  </Pressable>
                ))}
              </View>
              <Texto variante="secundario">{t('cultivos.oCrea')}</Texto>
            </>
          ) : null}
        </>
      )}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  parrafo: { marginVertical: 6 },
  filtros: { marginTop: 10 },
  plantillas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  plantilla: { width: '48.5%', borderWidth: 1, borderRadius: MEDIDAS.radioTarjeta, padding: 12, gap: 4, minHeight: MEDIDAS.toque },
});
