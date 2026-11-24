import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Boton, BotonRapido, Campo, Fila, Subtitulo } from '@/componentes/controles';
import { ClimaConsejo } from '@/componentes/hoy';
import { Pantalla } from '@/componentes/Pantalla';
import { Texto } from '@/componentes/Texto';
import { PREGUNTAS_RAPIDAS, responder, type RespuestaAgente } from '@/reglas/agente';
import { diasDeCultivo } from '@/reglas/cultivos';
import { ErrorAgente, hayAgenteIA, preguntarAgenteIA, type CultivoContexto } from '@/servicios/agenteIA';
import { lluviaManana } from '@/servicios/clima';
import { useApp } from '@/store/app';
import { useClima } from '@/store/clima';
import { useDatos, type CultivoCompleto } from '@/store/datos';
import { MEDIDAS, useTema } from '@/tema/useTema';

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

/**
 * Agente (agenteHTML del prototipo). Con servidor responde con IA (Edge Function `agente`, D-27);
 * sin servidor o sin conexión, con las reglas del prototipo.
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
  const [pensando, setPensando] = useState(false);
  const conIA = hayAgenteIA();

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
    const historial = useApp.getState().chat.slice(1);
    useApp.getState().agregarAlChat({ de: 'vos', t: limpio });
    setPensando(true);
    try {
      const respuesta = await preguntarAgenteIA({
        pregunta: limpio,
        historial,
        // El servidor solo los usa si confirma que el usuario es Pro.
        cultivos: plan === 'pro' ? contextoCultivos(cultivos) : [],
        mes: new Date().getMonth() + 1,
      });
      useApp.getState().agregarAlChat({ de: 'agente', t: respuesta });
    } catch (e) {
      const motivo = e instanceof ErrorAgente ? e.motivo : 'sin_conexion';
      useApp.getState().agregarAlChat({
        de: 'agente',
        t: motivo === 'limite' ? t('agente.limite') : `${t('agente.sinConexion')} ${textoRespuesta(reglas)}`,
      });
    } finally {
      setPensando(false);
    }
  };

  return (
    <Pantalla titulo={t('titulos.agente')}>
      <ClimaConsejo ahora={new Date()} />
      <Subtitulo>{t('agente.preguntasRapidas')}</Subtitulo>
      <Fila>
        {PREGUNTAS_RAPIDAS.map((p, i) => (
          <BotonRapido key={p} texto={t(`agente.rapidas.${i}`)} onPress={() => void enviar(t(`agente.rapidas.${i}`))} testID={`pregunta-${i}`} />
        ))}
      </Fila>
      <Subtitulo>{t('agente.chat')}</Subtitulo>
      {chat.map((m, i) => (
        <View
          key={i}
          accessibilityLiveRegion={i === chat.length - 1 ? 'polite' : 'none'}
          style={[
            estilos.burbuja,
            m.de === 'vos'
              ? { backgroundColor: c.accentSoft, alignSelf: 'flex-end' }
              : { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, alignSelf: 'flex-start' },
          ]}>
          <Texto variante="cuerpo">{m.t}</Texto>
        </View>
      ))}
      {pensando ? (
        <View
          accessibilityLiveRegion="polite"
          style={[estilos.burbuja, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, alignSelf: 'flex-start' }]}>
          <Texto variante="secundario">{t('agente.pensando')}</Texto>
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
      <Boton texto={t('agente.enviar')} onPress={() => void enviar(pregunta)} disabled={pensando} testID="enviar-pregunta" />
      <Texto variante="secundario">{conIA ? t('agente.modoIA') : t('agente.modoReglas')}</Texto>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  burbuja: { maxWidth: '85%', paddingVertical: 10, paddingHorizontal: 12, borderRadius: MEDIDAS.radioTarjeta, marginBottom: 8 },
  campo: { marginTop: 8 },
});
