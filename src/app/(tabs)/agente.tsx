import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Boton, BotonRapido, Campo, Fila, Subtitulo } from '@/componentes/controles';
import { ClimaConsejo } from '@/componentes/hoy';
import { Pantalla } from '@/componentes/Pantalla';
import { Texto } from '@/componentes/Texto';
import { PREGUNTAS_RAPIDAS, responder, type RespuestaAgente } from '@/reglas/agente';
import { lluviaManana } from '@/servicios/clima';
import { useApp } from '@/store/app';
import { useClima } from '@/store/clima';
import { useDatos } from '@/store/datos';
import { MEDIDAS, useTema } from '@/tema/useTema';

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

/** Agente (agenteHTML del prototipo). Sin conexión responde con reglas; en H5, con IA (D-25). */
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

  useEffect(() => {
    if (!useApp.getState().chat.length) useApp.getState().reiniciarChat(t('agente.saludo'));
  }, [t]);

  const enviar = (texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return;
    const r = responder(limpio, {
      plan,
      lluviaManana: lluviaManana(clima),
      cultivos: cultivos.map((x) => ({ nombre: x.nombre, etapa: x.etapa, ubicacion: x.ubicacion, ultimaNota: x.bitacora[0]?.nota ?? null })),
      totalConsejos: tips.length,
    });
    useApp.getState().agregarAlChat({ de: 'vos', t: limpio }, { de: 'agente', t: textoRespuesta(r) });
    setPregunta('');
  };

  return (
    <Pantalla titulo={t('titulos.agente')}>
      <ClimaConsejo ahora={new Date()} />
      <Subtitulo>{t('agente.preguntasRapidas')}</Subtitulo>
      <Fila>
        {PREGUNTAS_RAPIDAS.map((p, i) => (
          <BotonRapido key={p} texto={t(`agente.rapidas.${i}`)} onPress={() => enviar(t(`agente.rapidas.${i}`))} testID={`pregunta-${i}`} />
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
      <Campo
        etiqueta={t('agente.placeholder')}
        value={pregunta}
        onChangeText={setPregunta}
        onSubmitEditing={() => enviar(pregunta)}
        returnKeyType="send"
        style={estilos.campo}
        testID="campo-pregunta"
      />
      <Boton texto={t('agente.enviar')} onPress={() => enviar(pregunta)} testID="enviar-pregunta" />
      <Texto variante="secundario">{t('agente.modoReglas')}</Texto>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  burbuja: { maxWidth: '85%', paddingVertical: 10, paddingHorizontal: 12, borderRadius: MEDIDAS.radioTarjeta, marginBottom: 8 },
  campo: { marginTop: 8 },
});
