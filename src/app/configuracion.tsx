import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Boton, Chip, Fila, Subtitulo } from '@/componentes/controles';
import { Icono } from '@/componentes/Icono';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { VERSION_APP } from '@/config/flags';
import { IDIOMA_POR_DEFECTO, IDIOMAS } from '@/i18n';
import { PERFILES } from '@/reglas/dominio';
import { useApp } from '@/store/app';
import { useDatos } from '@/store/datos';
import { MODOS_TEMA, TAMANOS_LETRA, usePreferencias } from '@/store/preferencias';
import { TAMANO_ICONO, type NombreIcono } from '@/tema/iconos';
import { MEDIDAS, useTema } from '@/tema/useTema';

/**
 * Configuración (D-35, pedido del usuario): idioma, tamaño de letra, modo de pantalla, perfil (con el
 * borrado de la cuenta, D-26), privacidad y términos. Se abre con el engranaje del encabezado.
 */
export default function PantallaConfiguracion() {
  const { t } = useTranslation();
  const router = useRouter();
  const { idioma, tamanoLetra, tema, setIdioma, setTamanoLetra, setTema } = usePreferencias();
  const perfil = useDatos((s) => s.perfil.perfil);
  const plan = useApp((s) => s.plan);
  const [confirmar, setConfirmar] = useState(false);
  const [verPrivacidad, setVerPrivacidad] = useState(false);
  const [verTerminos, setVerTerminos] = useState(false);

  const volver = <Boton texto={t('configuracion.volver')} variante="fantasma" onPress={() => router.back()} style={estilos.volver} testID="volver-configuracion" />;

  return (
    <Pantalla titulo={t('configuracion.titulo')} cabecera={volver}>
      <Subtitulo>{t('configuracion.idioma')}</Subtitulo>
      <Tarjeta>
        <Fila>
          {IDIOMAS.map((x) => (
            <Chip key={x.codigo} texto={x.nombre} activo={idioma === x.codigo} onPress={() => setIdioma(x.codigo)} testID={`idioma-${x.codigo}`} />
          ))}
        </Fila>
        {idioma !== IDIOMA_POR_DEFECTO ? <Texto variante="secundario">{t('configuracion.idiomaNota')}</Texto> : null}
      </Tarjeta>

      <Subtitulo>{t('configuracion.letra')}</Subtitulo>
      <Tarjeta>
        <Fila>
          {TAMANOS_LETRA.map((x) => (
            <Chip key={x} texto={t(`configuracion.letras.${x}`)} activo={tamanoLetra === x} onPress={() => setTamanoLetra(x)} testID={`letra-${x}`} />
          ))}
        </Fila>
        <Texto variante="cuerpo">{t('configuracion.letraEjemplo')}</Texto>
      </Tarjeta>

      <Subtitulo>{t('configuracion.tema')}</Subtitulo>
      <Tarjeta>
        <Fila>
          {MODOS_TEMA.map((x) => (
            <Chip key={x} texto={t(`configuracion.temas.${x}`)} activo={tema === x} onPress={() => setTema(x)} testID={`tema-${x}`} />
          ))}
        </Fila>
        <Texto variante="secundario">{t('configuracion.temaAyuda')}</Texto>
      </Tarjeta>

      <Subtitulo>{t('configuracion.perfil')}</Subtitulo>
      <Tarjeta>
        <Texto variante="cuerpoFuerte">{t('configuracion.formaCultivar')}</Texto>
        <Fila>
          {PERFILES.map((p) => (
            <Chip key={p} texto={t(`onboarding.perfiles.${p}`)} activo={perfil === p} onPress={() => void useDatos.getState().elegirPerfil(p)} />
          ))}
        </Fila>
        <Texto variante="secundario">{t('configuracion.formaAyuda')}</Texto>
        <View style={estilos.separador} />
        <Texto variante="cuerpo">{t('configuracion.planActual', { plan: plan === 'gratis' ? t('planes.gratis') : t('planes.pro') })}</Texto>
        <Boton texto={t('planes.verPlanes')} variante="fantasma" onPress={() => router.navigate('/plan')} style={estilos.arriba} />
        {confirmar ? (
          <View style={estilos.arriba}>
            <Texto variante="cuerpo">{t('privacidad.confirmarTexto')}</Texto>
            <Boton
              texto={t('privacidad.confirmar')}
              variante="peligro"
              onPress={async () => {
                setConfirmar(false);
                await useDatos.getState().borrarTodo();
                router.back();
              }}
              style={estilos.arriba}
              testID="confirmar-borrado"
            />
            <Boton texto={t('comun.cancelar')} variante="fantasma" onPress={() => setConfirmar(false)} />
          </View>
        ) : (
          <EnlaceBorrar texto={t('privacidad.borrar')} onPress={() => setConfirmar(true)} />
        )}
      </Tarjeta>

      <Subtitulo>{t('configuracion.documentos')}</Subtitulo>
      {verPrivacidad ? (
        <Tarjeta>
          <Texto variante="cuerpoFuerte">{t('privacidad.tusDatos')}</Texto>
          <Texto variante="secundario" style={estilos.parrafo}>
            {t('privacidad.version')}
          </Texto>
          {(t('privacidad.items', { returnObjects: true }) as string[]).map((item) => (
            <Item key={item} texto={item} icono="privacidad" />
          ))}
          <Boton texto={t('privacidad.ocultar')} variante="fantasma" onPress={() => setVerPrivacidad(false)} style={estilos.arriba} />
        </Tarjeta>
      ) : (
        <Boton texto={t('privacidad.ver')} variante="fantasma" onPress={() => setVerPrivacidad(true)} />
      )}
      {verTerminos ? (
        <Tarjeta style={estilos.arriba}>
          <Texto variante="cuerpoFuerte">{t('terminos.titulo')}</Texto>
          <Texto variante="secundario" style={estilos.parrafo}>
            {t('terminos.version')}
          </Texto>
          {(t('terminos.items', { returnObjects: true }) as string[]).map((item) => (
            <Item key={item} texto={item} icono="terminos" />
          ))}
          <Boton texto={t('privacidad.ocultar')} variante="fantasma" onPress={() => setVerTerminos(false)} style={estilos.arriba} />
        </Tarjeta>
      ) : (
        <Boton texto={t('terminos.ver')} variante="fantasma" onPress={() => setVerTerminos(true)} style={estilos.arriba} testID="ver-terminos" />
      )}

      <Texto variante="secundario" style={estilos.version}>
        {t('configuracion.version', { v: VERSION_APP })}
      </Texto>
    </Pantalla>
  );
}

/**
 * Borrar la cuenta como enlace chico y discreto, para que no se toque sin querer (pedido del usuario, D-26).
 * Mantiene un área táctil de 44 px y siempre pide confirmación.
 */
function EnlaceBorrar({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" testID="borrar-cuenta" style={estilos.enlace}>
      <Texto variante="secundario" color="alert" style={estilos.subrayado}>
        {texto}
      </Texto>
    </Pressable>
  );
}

function Item({ texto, icono }: { texto: string; icono: NombreIcono }) {
  const { c } = useTema();
  return (
    <View style={estilos.item}>
      <Icono nombre={icono} color={c.accent} tamano={TAMANO_ICONO.chico} />
      <Texto variante="cuerpo" style={estilos.flex}>
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  volver: { alignSelf: 'flex-start', marginTop: 16 },
  arriba: { marginTop: 8 },
  parrafo: { marginVertical: 6 },
  separador: { height: 1, marginVertical: 12 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  flex: { flex: 1 },
  enlace: { alignSelf: 'flex-start', minHeight: MEDIDAS.toque, justifyContent: 'center', marginTop: 12, paddingVertical: 4 },
  subrayado: { textDecorationLine: 'underline' },
  version: { marginTop: 24, textAlign: 'center' },
});
