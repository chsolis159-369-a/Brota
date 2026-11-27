import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Boton, BotonRapido, Campo, Fila, Medalla, Subtitulo } from '@/componentes/controles';
import { Etiqueta } from '@/componentes/Etiqueta';
import { ClimaConsejo } from '@/componentes/hoy';
import { Icono } from '@/componentes/Icono';
import { Logo } from '@/componentes/Logo';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { FOTO_AGENTE } from '@/config/flags';
import { PREGUNTAS_RAPIDAS, responder, type RespuestaAgente } from '@/reglas/agente';
import { diasDeCultivo } from '@/reglas/cultivos';
import { preguntasDeLaRonda, resumenReconocimiento } from '@/reglas/reconocimiento';
import {
  ErrorAgente,
  hayAgenteIA,
  LIMITE_FOTOS_DIARIO,
  preguntarAgenteIA,
  type CultivoContexto,
  type Foto,
  type Reconocimiento,
} from '@/servicios/agenteIA';
import { lluviaManana } from '@/servicios/clima';
import { fotoParaAnalizar } from '@/servicios/fotoAgente';
import { useApp, type MensajeChat } from '@/store/app';
import { useClima } from '@/store/clima';
import { useDatos, type CultivoCompleto } from '@/store/datos';
import { TAMANO_ICONO } from '@/tema/iconos';
import { MEDIDAS, superficie, useTema } from '@/tema/useTema';

/** Contexto de los cultivos para el Agente con IA (solo se manda en Pro; el servidor lo vuelve a verificar). */
function contextoCultivos(cultivos: readonly CultivoCompleto[]): CultivoContexto[] {
  return cultivos.slice(0, 3).map((c) => ({
    nombre: c.nombre,
    tipo: c.tipo,
    ubicacion: c.ubicacion,
    etapa: c.etapa,
    dia: diasDeCultivo(c.fecha),
    registros: c.bitacora.slice(0, 5).map((r) => ({ fecha: r.fecha, tipo: r.tipo, nota: r.nota })),
    medicion: c.mediciones[0]
      ? { ppfd: c.mediciones[0].ppfd, temp: c.mediciones[0].temp, humedad: c.mediciones[0].humedad, alturaCm: c.mediciones[0].alturaCm }
      : null,
  }));
}

/** Arma el texto de una respuesta del agente por reglas, en el orden del prototipo. */
function useTextoRespuesta() {
  const { t } = useTranslation();
  const tips = t('tips', { returnObjects: true }) as string[];
  return (r: RespuestaAgente): string => {
    let s = r.clave === 'masDatos' ? t('agente.respuestas.masDatos', { consejo: tips[r.consejo ?? 0] }) : t(`agente.respuestas.${r.clave}`);
    if (r.lluvia) s += t('agente.lluvia');
    if (r.cultivos) s += t('agente.proCultivos', { plan: t('planes.pro'), n: r.cultivos });
    if (r.ultimo) s += t('agente.proUltimo', r.ultimo);
    return s;
  };
}

/** El historial que se manda al servidor: solo texto; las fotos anteriores quedan marcadas y el reconocimiento, resumido. */
const historialParaServidor = (chat: MensajeChat[]) =>
  chat.slice(1).map((m) => {
    if (m.foto) return { de: m.de, t: `(Foto) ${m.t}`.trim() };
    const resumen = m.reco ? resumenReconocimiento(m.reco) : '';
    return { de: m.de, t: resumen ? `${m.t}\n${resumen}` : m.t };
  });

/**
 * Agente (agenteHTML del prototipo). Con servidor responde con IA (Edge Function `agente`, D-27) y
 * analiza fotos de la planta, hojas, plagas o insectos (D-30); sin servidor o sin conexión, responde
 * con las reglas del prototipo.
 */
export default function Agente() {
  const { t } = useTranslation();
  const { c } = useTema();
  const chat = useApp((s) => s.chat);
  const plan = useApp((s) => s.plan);
  const clima = useClima((s) => s.clima);
  const cultivos = useDatos((s) => s.cultivos);
  const textoRespuesta = useTextoRespuesta();
  const tips = t('tips', { returnObjects: true }) as string[];
  const [pregunta, setPregunta] = useState('');
  const [pensando, setPensando] = useState<false | 'texto' | 'foto'>(false);
  const conIA = hayAgenteIA();
  const conFotos = conIA && FOTO_AGENTE;

  useEffect(() => {
    if (!useApp.getState().chat.length) useApp.getState().reiniciarChat(t('agente.saludo'));
  }, [t]);

  const respuestaPorReglas = (texto: string) =>
    responder(texto, {
      plan,
      lluviaManana: lluviaManana(clima),
      cultivos: cultivos.map((x) => ({ nombre: x.nombre, etapa: x.etapa, ubicacion: x.ubicacion, ultimaNota: x.bitacora[0]?.nota ?? null })),
      totalConsejos: tips.length,
    });

  /**
   * Agrega el mensaje del usuario al chat, manda la pregunta (y la foto, si hay) al servidor y agrega la
   * respuesta. El historial se toma antes de sumar el mensaje nuevo, que va aparte.
   */
  const consultar = async (mensaje: MensajeChat, foto?: Foto) => {
    const chatPrevio = useApp.getState().chat;
    const historial = historialParaServidor(chatPrevio);
    // Una foto nueva empieza otra ronda de reconocimiento.
    const preguntasHechas = foto ? 0 : preguntasDeLaRonda(chatPrevio);
    useApp.getState().agregarAlChat(mensaje);
    const texto = mensaje.t;
    setPensando(foto ? 'foto' : 'texto');
    try {
      const respuesta = await preguntarAgenteIA({
        pregunta: texto,
        historial,
        // El servidor solo los usa si confirma que el usuario es Pro.
        cultivos: plan === 'pro' ? contextoCultivos(cultivos) : [],
        mes: new Date().getMonth() + 1,
        preguntasHechas,
        ...(foto ? { foto } : {}),
      });
      useApp.getState().agregarAlChat({ de: 'agente', t: respuesta.texto, ...(respuesta.reconocimiento ? { reco: respuesta.reconocimiento } : {}) });
    } catch (e) {
      const motivo = e instanceof ErrorAgente ? e.motivo : 'sin_conexion';
      const aviso =
        motivo === 'limite'
          ? t('agente.limite')
          : motivo === 'limite_fotos'
            ? t('agente.foto.limite', { n: LIMITE_FOTOS_DIARIO })
            : foto
              ? t('agente.foto.sinConexion')
              : `${t('agente.sinConexion')} ${textoRespuesta(respuestaPorReglas(texto))}`;
      useApp.getState().agregarAlChat({ de: 'agente', t: aviso });
    } finally {
      setPensando(false);
    }
  };

  const enviar = async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || pensando) return;
    setPregunta('');
    const reglas = respuestaPorReglas(limpio);
    // Sin servidor, o si es una consulta de dosis, consumo o venta: se responde acá, sin gastar una pregunta.
    if (!conIA || reglas.clave === 'negativa') {
      useApp.getState().agregarAlChat({ de: 'vos', t: limpio }, { de: 'agente', t: textoRespuesta(reglas) });
      return;
    }
    await consultar({ de: 'vos', t: limpio });
  };

  const analizarFoto = async (origen: 'camara' | 'galeria') => {
    if (pensando) return;
    const r = await fotoParaAnalizar(origen);
    if (r.tipo === 'cancelada') return;
    if (r.tipo === 'sin_permiso' || r.tipo === 'error') {
      useApp.getState().agregarAlChat({ de: 'agente', t: r.tipo === 'sin_permiso' ? t('agente.foto.sinPermiso') : t('agente.foto.error') });
      return;
    }
    const texto = pregunta.trim();
    if (texto && respuestaPorReglas(texto).clave === 'negativa') {
      setPregunta('');
      useApp.getState().agregarAlChat({ de: 'vos', t: texto, foto: r.foto.uri }, { de: 'agente', t: t('agente.respuestas.negativa') });
      return;
    }
    setPregunta('');
    await consultar({ de: 'vos', t: texto, foto: r.foto.uri }, { tipo: r.foto.tipo, datos: r.foto.base64 });
  };

  return (
    <Pantalla titulo={t('titulos.agente')}>
      <ClimaConsejo ahora={new Date()} />

      {conFotos ? (
        <Tarjeta>
          <View style={estilos.cabeceraFoto}>
            <Medalla icono="camara" tamano={44} />
            <View style={estilos.flex}>
              <Texto variante="subtitulo">{t('agente.foto.titulo')}</Texto>
              <Texto variante="secundario">{t('agente.foto.ayuda')}</Texto>
            </View>
          </View>
          <View style={estilos.botonesFoto}>
            <Boton
              texto={t('agente.foto.sacar')}
              icono="camara"
              onPress={() => void analizarFoto('camara')}
              disabled={!!pensando}
              style={estilos.botonFoto}
              testID="foto-camara"
            />
            <Boton
              texto={t('agente.foto.elegir')}
              icono="galeria"
              variante="fantasma"
              onPress={() => void analizarFoto('galeria')}
              disabled={!!pensando}
              style={estilos.botonFoto}
              testID="foto-galeria"
            />
          </View>
          <Texto variante="secundario">{t('agente.foto.pista')}</Texto>
        </Tarjeta>
      ) : null}

      <Subtitulo>{t('agente.preguntasRapidas')}</Subtitulo>
      <Fila>
        {PREGUNTAS_RAPIDAS.map((p, i) => (
          <BotonRapido key={p} texto={t(`agente.rapidas.${i}`)} onPress={() => void enviar(t(`agente.rapidas.${i}`))} testID={`pregunta-${i}`} />
        ))}
      </Fila>

      <Subtitulo>{t('agente.chat')}</Subtitulo>
      {chat.map((m, i) => (
        <Burbuja key={i} m={m} ultima={i === chat.length - 1} alt={t('agente.foto.alt')} />
      ))}
      {(() => {
        // Opciones de la pregunta de reconocimiento (D-31): solo en el último mensaje del guía.
        const ultimo = chat[chat.length - 1];
        const pregunta = ultimo?.de === 'agente' ? ultimo.reco?.pregunta : null;
        if (!pregunta || pensando) return null;
        return (
          <View style={estilos.opciones}>
            <Fila>
              {pregunta.opciones.map((op, i) => (
                <BotonRapido key={op} texto={op} onPress={() => void enviar(op)} testID={`opcion-${i}`} />
              ))}
              <BotonRapido texto={t('agente.reco.noSe')} onPress={() => void enviar(t('agente.reco.noSe'))} testID="opcion-nose" />
              {conFotos ? (
                <BotonRapido texto={t('agente.reco.mandarFoto')} icono="camara" onPress={() => void analizarFoto('camara')} testID="opcion-foto" />
              ) : null}
            </Fila>
          </View>
        );
      })()}
      {pensando ? (
        <View style={estilos.filaAgente} accessibilityLiveRegion="polite">
          <Logo tamano={28} />
          <View style={[estilos.burbuja, estilos.burbujaAgente, superficie(c)]}>
            <Texto variante="secundario">{pensando === 'foto' ? t('agente.foto.analizando') : t('agente.pensando')}</Texto>
          </View>
        </View>
      ) : null}

      <Campo
        etiqueta={t('agente.placeholder')}
        value={pregunta}
        onChangeText={setPregunta}
        onSubmitEditing={() => void enviar(pregunta)}
        returnKeyType="send"
        style={estilos.campo}
        testID="campo-pregunta"
      />
      <Boton texto={t('agente.enviar')} icono="enviar" onPress={() => void enviar(pregunta)} disabled={!!pensando} testID="enviar-pregunta" />
      <View style={[estilos.pie, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
        <Icono nombre={conIA ? 'ia' : 'info'} color={c.muted} tamano={TAMANO_ICONO.chico} />
        <Texto variante="secundario" style={estilos.flex}>
          {conIA ? t('agente.modoIA') : t('agente.modoReglas')}
        </Texto>
      </View>
    </Pantalla>
  );
}

/** Certeza (D-31) con color, ícono y texto; "Poco seguro" en tono neutro, no de alerta (D-32). */
const CERTEZA = {
  alta: { tono: 'ok', icono: 'tarea' },
  media: { tono: 'gold', icono: 'duda' },
  baja: { tono: 'muted', icono: 'info' },
} as const;

/** Candidatos del reconocimiento, con su certeza, la foto pedida y el aviso de derivar (D-31). */
function TarjetaReconocimiento({ r }: { r: Reconocimiento }) {
  const { t } = useTranslation();
  const { c } = useTema();
  return (
    <View style={[estilos.reco, { borderTopColor: c.border }]}>
      {r.candidatos.length && r.certeza ? (
        <View style={estilos.recoCabecera}>
          <Texto variante="cuerpoFuerte">{t('agente.reco.titulo')}</Texto>
          <Etiqueta tono={CERTEZA[r.certeza].tono} icono={CERTEZA[r.certeza].icono}>
            {t(`agente.reco.certeza.${r.certeza}`)}
          </Etiqueta>
        </View>
      ) : null}
      {r.candidatos.map((x) => {
        const n = Math.round(x.confianza * 100);
        return (
          <View key={x.nombre} style={estilos.candidato} accessible accessibilityLabel={t('agente.reco.a11y', { nombre: x.nombre, n })}>
            <View style={estilos.flex}>
              <Texto variante="cuerpo">{x.nombre}</Texto>
              {x.cientifico ? <Texto variante="secundario">{x.cientifico}</Texto> : null}
            </View>
            <Texto variante="cuerpoFuerte" color="accent">
              {t('agente.reco.confianza', { n })}
            </Texto>
          </View>
        );
      })}
      {r.pedirFoto ? <Texto variante="secundario">{t('agente.reco.pedirFoto', { que: r.pedirFoto })}</Texto> : null}
      {r.derivar ? <Texto variante="secundario">{t('agente.reco.derivar')}</Texto> : null}
    </View>
  );
}

/** Mensaje del chat: los tuyos a la derecha en verde; los del guía a la izquierda, con el logo. */
function Burbuja({ m, ultima, alt }: { m: MensajeChat; ultima: boolean; alt: string }) {
  const { c } = useTema();
  const vos = m.de === 'vos';
  const contenido = (
    <View
      accessibilityLiveRegion={ultima ? 'polite' : 'none'}
      style={[estilos.burbuja, vos ? [estilos.burbujaVos, { backgroundColor: c.accent }] : [estilos.burbujaAgente, superficie(c)]]}>
      {m.foto ? <Image source={{ uri: m.foto }} style={estilos.foto} contentFit="cover" accessibilityLabel={alt} accessible /> : null}
      {m.t ? (
        <Texto variante="cuerpo" color={vos ? 'sobreAccent' : 'fg'}>
          {m.t}
        </Texto>
      ) : null}
      {!vos && m.reco ? <TarjetaReconocimiento r={m.reco} /> : null}
    </View>
  );
  if (vos) return <View style={estilos.filaVos}>{contenido}</View>;
  return (
    <View style={estilos.filaAgente}>
      <Logo tamano={28} />
      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  cabeceraFoto: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  botonesFoto: { gap: 0 },
  botonFoto: { paddingHorizontal: 10 },
  filaVos: { alignItems: 'flex-end', marginBottom: 14 },
  filaAgente: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 14 },
  burbuja: { maxWidth: '86%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: MEDIDAS.radioTarjeta, gap: 10 },
  burbujaVos: { borderBottomRightRadius: 6 },
  burbujaAgente: { borderBottomLeftRadius: 6, flexShrink: 1 },
  foto: { width: 220, maxWidth: '100%', aspectRatio: 4 / 3, borderRadius: 14 },
  campo: { marginTop: 8 },
  pie: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4, padding: 14, borderRadius: MEDIDAS.radioControl, borderWidth: 1 },
  opciones: { marginLeft: 38, marginBottom: 12 },
  reco: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  recoCabecera: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  candidato: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
