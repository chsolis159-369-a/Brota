import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton, Chip, Fila } from '@/componentes/controles';
import { Logo } from '@/componentes/Logo';
import { Texto } from '@/componentes/Texto';
import { PERFILES } from '@/reglas/dominio';
import { useDatos } from '@/store/datos';
import { MEDIDAS, useTema } from '@/tema/useTema';

/** Onboarding de 4 pasos; el último elige la forma de cultivar (onboardingHTML del prototipo). */
export default function Onboarding() {
  const { t } = useTranslation();
  const { c } = useTema();
  const router = useRouter();
  const perfil = useDatos((s) => s.perfil.perfil);
  const [paso, setPaso] = useState(0);
  const pasos = t('onboarding.pasos', { returnObjects: true }) as { t: string; x: string }[];
  const ultimo = paso === pasos.length - 1;
  const actual = pasos[paso]!;

  const siguiente = async () => {
    if (!ultimo) return setPaso(paso + 1);
    await useDatos.getState().completarOnboarding();
    router.replace('/');
  };

  return (
    <SafeAreaView style={[estilos.raiz, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.columna}>
          <View style={estilos.marca}>
            <View style={[estilos.logo, { boxShadow: c.sombra || undefined }]}>
              <Logo tamano={104} />
            </View>
            <Texto variante="marca" color="accent" style={estilos.nombre}>
              {t('marca')}
            </Texto>
          </View>
          <Texto variante="tituloGrande" style={estilos.titulo}>
            {actual.t}
          </Texto>
          <Texto variante="cuerpo">{actual.x}</Texto>
          {ultimo ? (
            <Fila style={estilos.chips}>
              {PERFILES.map((p) => (
                <Chip
                  key={p}
                  texto={t(`onboarding.perfiles.${p}`)}
                  activo={perfil === p}
                  onPress={() => void useDatos.getState().elegirPerfil(p)}
                  testID={`perfil-${p}`}
                />
              ))}
            </Fila>
          ) : null}
          <View style={estilos.puntos} accessibilityLabel={`${paso + 1} / ${pasos.length}`}>
            {pasos.map((_, k) => (
              <View key={k} style={[estilos.punto, k === paso ? { backgroundColor: c.accent, width: 24 } : { backgroundColor: c.border }]} />
            ))}
          </View>
          <Boton texto={ultimo ? t('onboarding.empezar') : t('onboarding.siguiente')} onPress={() => void siguiente()} testID="onboarding-siguiente" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: MEDIDAS.margen },
  columna: { width: '100%', maxWidth: MEDIDAS.anchoMaximo, alignSelf: 'center', paddingVertical: 32 },
  marca: { alignItems: 'center', gap: 14 },
  logo: { borderRadius: 24 },
  nombre: { fontSize: 26, lineHeight: 32, letterSpacing: 3 },
  titulo: { marginTop: 32, marginBottom: 12 },
  chips: { marginTop: 8 },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 24 },
  punto: { width: 8, height: 8, borderRadius: 4 },
});
