import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { diasDeCultivo, proximoPaso, saludCultivo, type ProximoPaso, type Salud } from '@/reglas/cultivos';
import type { CultivoCompleto } from '@/store/datos';
import { MEDIDAS, useTema } from '@/tema/useTema';

import { Etiqueta } from './Etiqueta';
import { Punto, SegmentosEtapa } from './graficos';
import { Texto } from './Texto';

/** Texto del estado de un cultivo. */
export function useTextoSalud() {
  const { t } = useTranslation();
  return (s: Salud) => (s.motivo === 'diasSinRegistro' ? t('cultivos.salud.diasSinRegistro', { dias: s.dias }) : t(`cultivos.salud.${s.motivo}`));
}

/** Texto del próximo paso de un cultivo. */
export function useTextoProximo() {
  const { t } = useTranslation();
  const salud = useTextoSalud();
  return (p: ProximoPaso) => (p.tipo === 'alerta' ? salud(p.salud) : t(`cultivos.proximo.${p.tipo}`));
}

export const datosSalud = (c: CultivoCompleto) => ({
  ubicacion: c.ubicacion,
  etapa: c.etapa,
  ultimaMedicion: c.mediciones[0] ?? null,
  bitacora: c.bitacora,
});

/** Tarjeta de un cultivo (tarjetaCultivo del prototipo). */
export function TarjetaCultivo({ c, onPress, ahora }: { c: CultivoCompleto; onPress: () => void; ahora: Date }) {
  const { t } = useTranslation();
  const tema = useTema();
  const textoProximo = useTextoProximo();
  const paso = proximoPaso(datosSalud(c), ahora);
  const nivel = saludCultivo(datosSalud(c), ahora).nivel;
  const ultimo = c.bitacora[0];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      testID={`cultivo-${c.nombre}`}
      style={({ pressed }) => [estilos.tarjeta, { backgroundColor: tema.c.surface, borderColor: tema.c.border, opacity: pressed ? 0.85 : 1 }]}>
      <View style={estilos.cabecera}>
        <Texto variante="cuerpoFuerte" style={estilos.nombre}>
          {c.nombre}
        </Texto>
        <Etiqueta>{t('cultivos.dia', { n: diasDeCultivo(c.fecha, ahora) })}</Etiqueta>
        {c.ejemplo ? <Etiqueta>{t('comun.ejemplo')}</Etiqueta> : null}
      </View>
      <Texto variante="secundario">{t('cultivos.linea', { tipo: c.tipo, ubicacion: t(`cultivos.ubicaciones.${c.ubicacion}`), etapa: t(`etapas.${c.etapa}`) })}</Texto>
      <SegmentosEtapa etapa={c.etapa} />
      <View style={estilos.prox}>
        <Punto nivel={nivel} />
        <Texto variante="cuerpoFuerte" style={estilos.flex}>
          {textoProximo(paso)}
        </Texto>
      </View>
      <Texto variante="secundario" style={estilos.ultimo}>
        {ultimo ? t('cultivos.ultimo', { nota: ultimo.nota }) : t('cultivos.sinRegistros')}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: MEDIDAS.radioTarjeta, padding: 14, marginBottom: 10 },
  cabecera: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  nombre: { flexShrink: 1, marginRight: 'auto' },
  prox: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  flex: { flex: 1 },
  ultimo: { marginTop: 4 },
});
