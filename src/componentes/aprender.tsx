import { useTranslation } from 'react-i18next';

import { CANNABIS_HABILITADO } from '@/config/flags';
import { MODULOS, moduloPorId } from '@/contenido';
import {
  EXAMENES,
  examenDisponible,
  moduloDisponible,
  type Examen,
  type MotivoExamen,
} from '@/reglas/aprendizaje';
import { INTENTOS_DIA } from '@/reglas/dominio';
import { progresoNivel } from '@/reglas/niveles';
import { examenFinalAprobado, puntosTotales } from '@/reglas/puntos';
import { useApp } from '@/store/app';
import { useDatos } from '@/store/datos';

/** Estado de aprendizaje calculado: puntos, nivel y funciones de disponibilidad. */
export function useAprendizaje() {
  const datos = useDatos();
  const plan = useApp((s) => s.plan);
  const puntos = puntosTotales(datos);
  const finalAprobado = examenFinalAprobado(datos.examenes);
  const contexto = { plan, puntos, progreso: datos.progreso, examenes: datos.examenes, cannabisHabilitado: CANNABIS_HABILITADO };
  return {
    datos,
    plan,
    puntos,
    nivel: progresoNivel(puntos, finalAprobado),
    disponibleModulo: (id: string) => {
      const m = moduloPorId(id);
      return m ? moduloDisponible(m, contexto, MODULOS) : ({ ok: false, motivo: { tipo: 'cannabis' } } as const);
    },
    disponibleExamen: (ex: Examen) => examenDisponible(ex, contexto, MODULOS),
    examenesAprobados: EXAMENES.filter((x) => datos.examenes[x.id]?.aprobado).length,
  };
}

/** Texto del motivo por el que un examen no está disponible. */
export function useTextoMotivoExamen() {
  const { t } = useTranslation();
  return (m: MotivoExamen): string => {
    switch (m.tipo) {
      case 'pro':
        return t('examenes.motivos.pro');
      case 'preExamenes':
        return t('examenes.motivos.preExamenes', { lista: m.ids.map((id) => t(`examenes.${id}.t`)).join(', ') });
      case 'modulos':
        return t('examenes.motivos.modulos', { lista: m.ids.map((id) => moduloPorId(id)?.t ?? id).join(', ') });
      case 'agotado':
        return t('examenes.motivos.agotado', { n: INTENTOS_DIA });
    }
  };
}
