import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Boton, BotonRapido, Campo, Chip, Estadisticas, Fila, Medalla, Mensaje, Subtitulo } from '@/componentes/controles';
import { datosSalud, useTextoProximo, useTextoSalud } from '@/componentes/cultivo';
import { Etiqueta } from '@/componentes/Etiqueta';
import { Vacio } from '@/componentes/estados';
import { MedidorVPD, Punto, SparkPPFD } from '@/componentes/graficos';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { diasDeCultivo, proximoPaso, saludCultivo } from '@/reglas/cultivos';
import { ETAPAS, TIPOS_REGISTRO, TOPE_MED_DIA, TOPE_REG_DIA, type TipoRegistro } from '@/reglas/dominio';
import { diasDesde, hoyStr } from '@/reglas/fechas';
import { evaluarAltura, evaluarPPFD, vpd } from '@/reglas/mediciones';
import { elegirFoto } from '@/servicios/fotos';
import { useDatos, type CultivoCompleto, type FormMedicion } from '@/store/datos';
import { MEDIDAS, superficie, useTema } from '@/tema/useTema';

const CAMPOS: (keyof FormMedicion)[] = ['watts', 'altura', 'horas', 'ppfd', 'temp', 'humedad'];
const medicionVacia = (): FormMedicion => ({ watts: '', altura: '', horas: '', ppfd: '', temp: '', humedad: '' });

/** Detalle de un cultivo (detalleHTML del prototipo). */
export default function DetalleCultivo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cultivo = useDatos((s) => s.cultivos.find((c) => c.id === id));
  if (!cultivo) return <Pantalla />;
  return <Detalle c={cultivo} />;
}

function Detalle({ c }: { c: CultivoCompleto }) {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const datos = useDatos();
  const textoSalud = useTextoSalud();
  const textoProximo = useTextoProximo();
  const [nota, setNota] = useState('');
  const [med, setMed] = useState<FormMedicion>(medicionVacia);
  const [filtro, setFiltro] = useState<'Todas' | TipoRegistro>('Todas');
  const [confirmar, setConfirmar] = useState(false);
  const ahora = new Date();

  const salud = saludCultivo(datosSalud(c), ahora);
  const paso = proximoPaso(datosSalud(c), ahora);
  const idxEtapa = ETAPAS.indexOf(c.etapa);
  const riegos = c.bitacora.filter((r) => r.tipo === 'Riego').length;
  const ultDias = c.bitacora[0] ? diasDesde(c.bitacora[0].fecha, ahora) : null;
  const bitacora = filtro === 'Todas' ? c.bitacora : c.bitacora.filter((r) => r.tipo === filtro);
  const hoyDia = datos.ledger.dias[hoyStr(ahora)] ?? { r: 0, m: 0 };
  const interior = c.ubicacion === 'interior';

  const registrar = async (tipo: TipoRegistro) => {
    await datos.registrar(c.id, tipo, nota);
    setNota('');
  };
  const guardarMedicion = async () => {
    if (await datos.medir(c.id, med)) setMed({ ...med, ppfd: '', altura: '' });
  };
  const agregarFoto = async () => {
    const uri = await elegirFoto();
    if (uri) await datos.agregarFoto(c.id, uri);
  };
  const eliminar = async () => {
    router.back();
    await datos.eliminarCultivo(c.id);
  };

  return (
    <Pantalla>
      <View style={estilos.subnav}>
        <Chip texto={t('cultivo.volver')} onPress={() => router.back()} testID="volver-cultivos" />
        <View style={estilos.estado}>
          <Punto nivel={salud.nivel} />
          <Texto variante="secundario">{textoSalud(salud)}</Texto>
        </View>
      </View>
      <View style={estilos.titulo}>
        <Texto variante="titulo">{c.nombre}</Texto>
        {c.ejemplo ? <Etiqueta>{t('comun.ejemplo')}</Etiqueta> : null}
      </View>
      <Texto variante="secundario">
        {t('cultivo.info', { tipo: c.tipo, ubicacion: t(`cultivos.ubicaciones.${c.ubicacion}`), dia: diasDeCultivo(c.fecha, ahora), fecha: c.fecha.slice(0, 10) })}
      </Texto>

      <Tarjeta style={{ ...estilos.proximo, borderLeftColor: tema.c.accent }}>
        <Texto variante="secundario">{t('cultivo.proximoPaso')}</Texto>
        <Texto variante="cuerpoFuerte">{textoProximo(paso)}</Texto>
        <Texto variante="secundario" style={estilos.guia}>
          {t(`cultivo.guia.${c.etapa}`)}
        </Texto>
      </Tarjeta>

      <Estadisticas
        items={[
          { valor: c.bitacora.length, etiqueta: t('cultivo.stats.registros'), icono: 'registros' },
          { valor: riegos, etiqueta: t('cultivo.stats.riegos'), icono: 'Riego' },
          {
            valor: ultDias === null ? '-' : ultDias === 0 ? t('cultivo.stats.hoy') : ultDias,
            etiqueta: ultDias === 1 ? t('cultivo.stats.diaDesde') : t('cultivo.stats.diasDesde'),
            icono: 'tiempo',
          },
        ]}
      />

      <Subtitulo>{t('cultivo.etapa')}</Subtitulo>
      <View style={estilos.etapas}>
        {ETAPAS.map((e, i) => {
          const actual = i === idxEtapa;
          const pasada = i < idxEtapa;
          return (
            <Pressable
              key={e}
              accessibilityRole="button"
              accessibilityState={{ selected: actual }}
              onPress={() => void datos.cambiarEtapa(c.id, e)}
              style={[
                estilos.etapa,
                { borderColor: actual || pasada ? tema.c.accent : tema.c.bordeCampo, backgroundColor: actual ? tema.c.accent : tema.c.surface },
              ]}>
              <Texto variante={actual ? 'cuerpoFuerte' : 'cuerpo'} color={actual ? 'sobreAccent' : pasada ? 'accent' : 'fg'} style={estilos.centro}>
                {(pasada ? '✓ ' : '') + t(`etapas.${e}`)}
              </Texto>
            </Pressable>
          );
        })}
      </View>

      <Subtitulo>{t('cultivo.registroRapido')}</Subtitulo>
      <Campo etiqueta={t('cultivo.detalle')} value={nota} onChangeText={setNota} multiline numberOfLines={2} testID="campo-nota" />
      <Fila>
        {TIPOS_REGISTRO.map((tipo) => (
          <BotonRapido key={tipo} texto={t(`tiposRegistro.${tipo}`)} icono={tipo} onPress={() => void registrar(tipo)} testID={`registro-${tipo}`} />
        ))}
      </Fila>
      <Texto variante="secundario">
        {t('cultivo.puntosRegistro', { r: hoyDia.r, tope: TOPE_REG_DIA }) + (interior ? t('cultivo.puntosMedicion', { m: hoyDia.m, tope: TOPE_MED_DIA }) : '')}
      </Texto>

      {interior ? (
        <LuzYAmbiente c={c} med={med} setMed={setMed} guardar={() => void guardarMedicion()} />
      ) : (
        <Tarjeta style={estilos.separado}>
          <Texto variante="secundario">{t('cultivo.exterior')}</Texto>
        </Tarjeta>
      )}

      <Subtitulo>{t('cultivo.fotos.titulo')}</Subtitulo>
      <Tarjeta>
        <Texto variante="secundario">{t('cultivo.fotos.ayuda')}</Texto>
        <Boton texto={t('cultivo.fotos.agregar')} variante="fantasma" onPress={() => void agregarFoto()} style={estilos.botonFoto} />
        {c.fotos.length >= 2 ? (
          <View style={estilos.fotos}>
            <Figura uri={c.fotos[c.fotos.length - 1]!.uri} alt={t('cultivo.fotos.altPrimera')} pie={t('cultivo.fotos.primera', { fecha: c.fotos[c.fotos.length - 1]!.fecha })} />
            <Figura uri={c.fotos[0]!.uri} alt={t('cultivo.fotos.altUltima')} pie={t('cultivo.fotos.ultima', { fecha: c.fotos[0]!.fecha })} />
          </View>
        ) : null}
        <View style={estilos.fotos}>
          {c.fotos.map((f) => (
            <Figura key={f.id} uri={f.uri} alt={t('cultivo.fotos.alt')} pie={f.fecha} />
          ))}
        </View>
      </Tarjeta>

      <Subtitulo>{t('cultivo.bitacora')}</Subtitulo>
      <Fila>
        {(['Todas', ...TIPOS_REGISTRO] as const).map((tipo) => (
          <Chip key={tipo} texto={tipo === 'Todas' ? t('cultivo.todas') : t(`tiposRegistro.${tipo}`)} activo={filtro === tipo} onPress={() => setFiltro(tipo)} />
        ))}
      </Fila>
      {bitacora.length === 0 ? (
        <Vacio icono="registros">{t('cultivo.sinRegistros') + (filtro === 'Todas' ? t('cultivo.sinRegistrosTodas') : t('cultivo.sinRegistrosTipo'))}</Vacio>
      ) : (
        bitacora.map((r) => (
          <View key={r.id} style={[estilos.entrada, superficie(tema.c)]} accessible>
            <Medalla icono={r.tipo} tamano={36} />
            <View style={estilos.flex}>
              <Texto variante="secundario">{t('cultivo.entrada', { fecha: r.fecha, tipo: t(`tiposRegistro.${r.tipo}`) })}</Texto>
              <Texto variante="cuerpo">{r.nota}</Texto>
            </View>
          </View>
        ))
      )}

      <Subtitulo>{t('cultivo.zonaPeligro')}</Subtitulo>
      <Boton texto={confirmar ? t('comun.cancelar') : t('cultivo.eliminar')} variante={confirmar ? 'fantasma' : 'peligro'} onPress={() => setConfirmar(!confirmar)} testID="eliminar-cultivo" />
      {confirmar ? <Boton texto={t('cultivo.confirmarEliminar')} variante="peligroLleno" onPress={() => void eliminar()} testID="confirmar-eliminar" /> : null}
    </Pantalla>
  );
}

function LuzYAmbiente({ c, med, setMed, guardar }: { c: CultivoCompleto; med: FormMedicion; setMed: (m: FormMedicion) => void; guardar: () => void }) {
  const { t } = useTranslation();
  const u = c.mediciones[0];
  const pp = u ? evaluarPPFD(c.etapa, u.ppfd) : null;
  const al = u ? evaluarAltura(u.alturaCm) : null;
  const v = u ? vpd(u.temp, u.humedad) : null;
  const ppfds = c.mediciones.map((m) => m.ppfd).filter((x): x is number => x !== null).reverse();
  return (
    <>
      <Subtitulo>{t('cultivo.luzYAmbiente')}</Subtitulo>
      <Tarjeta>
        <Texto variante="secundario" style={estilos.ayudaMedicion}>
          {t('cultivo.medicionAyuda')}
        </Texto>
        {CAMPOS.map((k) => (
          <Campo key={k} etiqueta={t(`cultivo.campos.${k}`)} value={med[k]} onChangeText={(x) => setMed({ ...med, [k]: x })} keyboardType="decimal-pad" testID={`medicion-${k}`} />
        ))}
        <Boton texto={t('cultivo.guardarMedicion')} onPress={guardar} testID="guardar-medicion" />
      </Tarjeta>
      {u ? (
        <Tarjeta>
          <Texto variante="cuerpoFuerte">{t('cultivo.ultimaMedicion')}</Texto>
          {pp ? <Mensaje tipo={pp.estado === 'ok' ? 'ok' : 'alerta'}>{t(`cultivo.ppfd.${pp.estado}`, { etapa: c.etapa.toLowerCase(), min: pp.min, max: pp.max })}</Mensaje> : null}
          {al ? <Mensaje tipo={al.ok ? 'ok' : 'alerta'}>{t(al.ok ? 'cultivo.altura.ok' : 'cultivo.altura.cerca')}</Mensaje> : null}
          {v !== null ? (
            <>
              <MedidorVPD valor={v} />
              <Texto variante="secundario">{t('cultivo.vpd', { v })}</Texto>
            </>
          ) : null}
          {ppfds.length >= 2 ? (
            <>
              <SparkPPFD valores={ppfds} etiqueta={t('cultivo.evolucionPPFD')} />
              <Texto variante="secundario">{t('cultivo.ppfdRegistrado', { valores: ppfds.join(' → ') })}</Texto>
            </>
          ) : null}
        </Tarjeta>
      ) : null}
    </>
  );
}

function Figura({ uri, alt, pie }: { uri: string; alt: string; pie: string }) {
  return (
    <View style={estilos.figura}>
      <Image source={{ uri }} style={estilos.imagen} contentFit="cover" accessibilityLabel={alt} accessible />
      <Texto variante="secundario">{pie}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  centro: { textAlign: 'center' },
  subnav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  estado: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  titulo: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  proximo: { borderLeftWidth: 5, marginTop: 12 },
  guia: { marginTop: 6 },
  etapas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 12 },
  etapa: { flexGrow: 1, flexBasis: '45%', borderWidth: 1.5, borderRadius: MEDIDAS.radioControl, padding: 12, minHeight: MEDIDAS.toque + 4, justifyContent: 'center' },
  separado: { marginTop: 12 },
  ayudaMedicion: { marginBottom: 8 },
  botonFoto: { marginTop: 8 },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  figura: { width: '48.5%', gap: 4 },
  imagen: { width: '100%', aspectRatio: 1, borderRadius: 14 },
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: MEDIDAS.radioTarjeta, padding: 16, marginBottom: 12 },
});
