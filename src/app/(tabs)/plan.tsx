import * as Clipboard from 'expo-clipboard';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Boton, Campo, Chip, Fila, Mensaje, Subtitulo } from '@/componentes/controles';
import { Etiqueta } from '@/componentes/Etiqueta';
import { Icono } from '@/componentes/Icono';
import { Pantalla } from '@/componentes/Pantalla';
import { Tarjeta } from '@/componentes/Tarjeta';
import { Texto } from '@/componentes/Texto';
import { VERSION_APP } from '@/config/flags';
import { MODULOS } from '@/contenido';
import { EXAMENES, moduloAprobado, modulosDelPlan } from '@/reglas/aprendizaje';
import { LIMITE_GRATIS, type Plan } from '@/reglas/dominio';
import { hoyStr } from '@/reglas/fechas';
import { erroresRecientes } from '@/servicios/errores';
import { useApp } from '@/store/app';
import { useDatos } from '@/store/datos';
import { TAMANO_ICONO, type NombreIcono } from '@/tema/iconos';
import { MEDIDAS, superficie, useTema } from '@/tema/useTema';

/** Plan (planHTML del prototipo): planes, opinión de la prueba, privacidad y borrado de datos. */
export default function PantallaPlan() {
  const { t } = useTranslation();
  const plan = useApp((s) => s.plan);
  const [confirmar, setConfirmar] = useState(false);
  const [verPrivacidad, setVerPrivacidad] = useState(false);

  const elegir = async (p: Plan, ciclo: 'mensual' | 'anual' = 'mensual') => {
    useApp.getState().setCiclo(ciclo);
    await useDatos.getState().elegirPlanLocal(p);
  };
  const itemsGratis = [
    t('planes.itemsGratis.cultivos', { n: LIMITE_GRATIS }),
    t('planes.itemsGratis.bitacora'),
    t('planes.itemsGratis.tareas'),
    t('planes.itemsGratis.modulos', { n: modulosDelPlan(MODULOS, 'gratis').length }),
    t('planes.itemsGratis.examenes'),
    t('planes.itemsGratis.agente'),
  ];

  return (
    <Pantalla titulo={t('titulos.plan')}>
      <CajaPlan nombre={t('planes.gratis')} precio={t('planes.precioGratis')} items={itemsGratis} activo={plan === 'gratis'}>
        {plan === 'gratis' ? (
          <Mensaje tipo="ok">{t('planes.actual')}</Mensaje>
        ) : (
          <Boton texto={t('planes.elegir', { plan: t('planes.gratis') })} onPress={() => void elegir('gratis')} />
        )}
      </CajaPlan>
      <CajaPlan
        destacada
        nombre={t('planes.pro')}
        etiqueta={t('planes.recomendado')}
        precio={t('planes.precioPro')}
        items={t('planes.itemsPro', { returnObjects: true }) as string[]}
        activo={plan === 'pro'}>
        {plan === 'pro' ? (
          <Mensaje tipo="ok">{t('planes.actual')}</Mensaje>
        ) : (
          <>
            <Boton texto={t('planes.elegirMensual')} onPress={() => void elegir('pro', 'mensual')} testID="elegir-pro-mensual" />
            <Boton texto={t('planes.elegirAnual')} variante="fantasma" onPress={() => void elegir('pro', 'anual')} />
          </>
        )}
      </CajaPlan>

      <Opinion />
      <Texto variante="secundario">{t('planes.cobroLocal')}</Texto>

      <Subtitulo>{t('privacidad.titulo')}</Subtitulo>
      {verPrivacidad ? (
        <Tarjeta>
          <Texto variante="cuerpoFuerte">{t('privacidad.tusDatos')}</Texto>
          <Texto variante="secundario" style={estilos.parrafo}>
            {t('privacidad.version')}
          </Texto>
          {(t('privacidad.items', { returnObjects: true }) as string[]).map((item) => (
            <ItemPlan key={item} texto={item} icono="privacidad" />
          ))}
          <Boton texto={t('privacidad.ocultar')} variante="fantasma" onPress={() => setVerPrivacidad(false)} style={estilos.arriba} />
        </Tarjeta>
      ) : (
        <Boton texto={t('privacidad.ver')} variante="fantasma" onPress={() => setVerPrivacidad(true)} />
      )}

      {confirmar ? (
        <Tarjeta style={estilos.arriba}>
          <Texto variante="cuerpo">{t('privacidad.confirmarTexto')}</Texto>
          <Boton
            texto={t('privacidad.confirmar')}
            variante="peligro"
            onPress={() => {
              setConfirmar(false);
              void useDatos.getState().borrarTodo();
            }}
            style={estilos.arriba}
            testID="confirmar-borrado"
          />
          <Boton texto={t('comun.cancelar')} variante="fantasma" onPress={() => setConfirmar(false)} />
        </Tarjeta>
      ) : (
        <EnlaceBorrar texto={t('privacidad.borrar')} onPress={() => setConfirmar(true)} />
      )}
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

/**
 * Caja de un plan. Gratis y Pro con la misma tarjeta (D-32): precios claros, sin bloque destacado ni
 * colores de urgencia. El plan actual se marca con un borde verde.
 */
function CajaPlan(p: { nombre: string; etiqueta?: string; precio: string; items: string[]; activo: boolean; destacada?: boolean; children: ReactNode }) {
  const { c } = useTema();
  const contenido = (
    <>
      <View style={estilos.cabecera}>
        {p.destacada ? <Icono nombre="pro" color={c.accent} /> : null}
        <Texto variante="subtitulo">{p.nombre}</Texto>
        {p.etiqueta ? <Etiqueta tono="ok">{p.etiqueta}</Etiqueta> : null}
      </View>
      <Texto variante="titulo" style={estilos.precio}>
        {p.precio}
      </Texto>
      {p.items.map((item) => (
        <ItemPlan key={item} texto={item} />
      ))}
      <View style={estilos.arriba}>{p.children}</View>
    </>
  );
  return <View style={[estilos.caja, superficie(c), p.activo ? { borderWidth: 2, borderColor: c.accent } : null]}>{contenido}</View>;
}

function ItemPlan({ texto, icono = 'tarea' }: { texto: string; icono?: NombreIcono }) {
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

/** Opinión de la prueba (opinionHTML del prototipo): se copia y se pega donde se indique. */
function Opinion() {
  const { t } = useTranslation();
  const plan = useApp((s) => s.plan);
  const ciclo = useApp((s) => s.ciclo);
  const { cultivos, progreso, examenes } = useDatos();
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [copiada, setCopiada] = useState(false);

  const delPlan = modulosDelPlan(MODULOS, plan);
  const errores = erroresRecientes();
  const texto = [
    `BROTA ${VERSION_APP} · ${hoyStr()}`,
    t('opinion.plan', { plan: plan === 'gratis' ? t('planes.gratis') : t('planes.pro') + t(`opinion.${ciclo}`) }),
    t('opinion.calificacion', { c: estrellas ? `${estrellas}/5` : t('opinion.sinCalificar') }),
    t('opinion.cultivos', { n: cultivos.filter((c) => !c.ejemplo).length }),
    t('opinion.modulos', { a: delPlan.filter((m) => moduloAprobado(progreso, m.id)).length, n: delPlan.length }),
    t('opinion.examenes', { a: EXAMENES.filter((x) => examenes[x.id]?.aprobado).length, n: EXAMENES.length }),
    t('opinion.errores', { e: errores.length ? errores.join(' | ') : t('opinion.ninguno') }),
    '',
    t('opinion.comentario'),
    comentario.trim() || t('opinion.sinComentario'),
  ].join('\n');

  return (
    <>
      <Subtitulo>{t('opinion.titulo')}</Subtitulo>
      <Tarjeta>
        <Texto variante="secundario">{t('opinion.pregunta')}</Texto>
        <Fila>
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip key={n} texto={String(n)} activo={estrellas === n} onPress={() => setEstrellas(n)} />
          ))}
        </Fila>
        <Campo etiqueta={t('opinion.placeholder')} value={comentario} onChangeText={setComentario} multiline numberOfLines={3} />
        <Boton
          texto={t('opinion.copiar')}
          onPress={() => {
            void Clipboard.setStringAsync(texto).then(() => setCopiada(true));
          }}
          testID="copiar-opinion"
        />
        <Texto variante="secundario">{t('opinion.aviso')}</Texto>
        <Texto variante="secundario" selectable style={[estilos.opinion, copiada ? estilos.copiada : null]}>
          {texto}
        </Texto>
      </Tarjeta>
    </>
  );
}

const estilos = StyleSheet.create({
  caja: { borderRadius: MEDIDAS.radioTarjeta, padding: MEDIDAS.rellenoTarjeta, marginBottom: MEDIDAS.separacion },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  precio: { marginTop: 6, marginBottom: 10 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  flex: { flex: 1 },
  arriba: { marginTop: 8 },
  parrafo: { marginVertical: 6 },
  opinion: { marginTop: 10, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  copiada: { opacity: 0.85 },
  enlace: { alignSelf: 'flex-start', minHeight: MEDIDAS.toque, justifyContent: 'center', marginTop: 16, paddingVertical: 4 },
  subrayado: { textDecorationLine: 'underline' },
});
