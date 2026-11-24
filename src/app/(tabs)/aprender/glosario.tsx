import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/componentes/controles';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { GLOSARIO } from '@/contenido';

/** Glosario (glosarioHTML del prototipo). */
export default function Glosario() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pantalla>
      <View style={estilos.subnav}>
        <Chip texto={t('aprender.volverAprender')} onPress={() => router.back()} />
      </View>
      <Texto variante="titulo" style={estilos.titulo}>
        {t('aprender.glosario')}
      </Texto>
      {GLOSARIO.map(([termino, definicion]) => (
        <Tarjeta key={termino}>
          <Texto variante="cuerpoFuerte">{termino}</Texto>
          <Texto variante="secundario">{definicion}</Texto>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  subnav: { flexDirection: 'row', marginBottom: 4 },
  titulo: { marginTop: 8, marginBottom: 12 },
});
