import type { Modulo } from '@/contenido/tipos';
import { diasActivos, racha, tareasDelDia } from '@/reglas/actividad';
import { logros, recomendacion } from '@/reglas/aprendizaje';
import { saludCultivo } from '@/reglas/cultivos';
import type { PerfilCultivo, Plan } from '@/reglas/dominio';
import { hoyStr } from '@/reglas/fechas';
import { nivelActual } from '@/reglas/niveles';
import {
  examenFinalAprobado,
  ptsTareasDia,
  puntosTotales,
  totalMediciones,
  totalRegistros,
  type EstadoExamen,
  type Ledger,
  type ProgresoModulo,
} from '@/reglas/puntos';

import type { CultivoCompleto } from './datos';

type Entrada = {
  plan: Plan;
  perfil: PerfilCultivo | null;
  cultivos: readonly CultivoCompleto[];
  tareasPorDia: Record<string, string[]>;
  ledger: Ledger;
  estudio: readonly string[];
  progreso: Record<string, ProgresoModulo>;
  examenes: Record<string, EstadoExamen>;
};

/** Datos calculados de la pantalla Hoy a partir del estado guardado. Puro. */
export function resumenHoy(
  e: Entrada,
  opciones: { lluviaManana: number | null; modulos: readonly Modulo[]; cannabisHabilitado: boolean },
  ahora: Date = new Date(),
) {
  const dia = hoyStr(ahora);
  const hechas = e.tareasPorDia[dia] ?? [];
  const tareas = tareasDelDia(e.cultivos, opciones.lluviaManana, hechas);
  const puntos = puntosTotales(e);
  const finalAprobado = examenFinalAprobado(e.examenes);
  const fechasPropias = e.cultivos
    .filter((c) => !c.ejemplo)
    .flatMap((c) => [...c.bitacora.map((r) => r.fecha), ...c.mediciones.map((m) => m.fecha)]);
  const r = racha(diasActivos({ tareasPorDia: e.tareasPorDia, estudio: e.estudio, ledger: e.ledger, fechasPropias }), ahora);
  return {
    tareas,
    hechas: tareas.filter((t) => t.hecha).length,
    ptsTareasHoy: ptsTareasDia(hechas),
    puntos,
    nivel: nivelActual(puntos, finalAprobado),
    racha: r,
    logros: logros({
      totalRegistros: totalRegistros(e.ledger),
      totalMediciones: totalMediciones(e.ledger),
      racha: r,
      creados: e.ledger.creados,
      progreso: e.progreso,
      examenes: e.examenes,
    }),
    recomendacion: recomendacion(
      e.perfil,
      { plan: e.plan, puntos, progreso: e.progreso, examenes: e.examenes, cannabisHabilitado: opciones.cannabisHabilitado },
      opciones.modulos,
      ahora,
    ),
  };
}

/** Salud de un cultivo a partir de sus datos completos. */
export const saludDe = (c: CultivoCompleto, ahora: Date = new Date()) =>
  saludCultivo({ ubicacion: c.ubicacion, etapa: c.etapa, ultimaMedicion: c.mediciones[0] ?? null, bitacora: c.bitacora }, ahora);
