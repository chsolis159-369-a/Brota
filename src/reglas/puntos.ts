import { PTS_MEDICION, PTS_REGISTRO, TOPE_TAREAS_DIA } from './dominio';

export type DiaLedger = { r: number; m: number };
/** Registros y mediciones con puntos por día, y cultivos propios creados. No baja al borrar un cultivo. */
export type Ledger = { dias: Record<string, DiaLedger>; creados: number };
export type ProgresoModulo = { mejorAciertos: number; mejorPuntos: number };
/** Estado de un examen. La fuente de verdad es el servidor (H4); la app guarda una copia. */
export type EstadoExamen = { aprobado: boolean; mejor: number; pts: number; fecha?: string; dia?: string; n?: number };

export type EstadoPuntos = {
  tareasPorDia: Record<string, string[]>;
  ledger: Ledger;
  progreso: Record<string, ProgresoModulo>;
  examenes: Record<string, EstadoExamen>;
};

export type DificultadTarea = 'facil' | 'media' | 'dificil';

/** Tarea fácil 5, media 10 (medir luz), difícil 15 (drenaje ante lluvia). */
export function ptsTarea(id: string): number {
  return id.startsWith('dren-') ? 15 : id.startsWith('med-') ? 10 : 5;
}

export function dificultadTarea(id: string): DificultadTarea {
  return id.startsWith('dren-') ? 'dificil' : id.startsWith('med-') ? 'media' : 'facil';
}

/** Puntos de tareas de un día, con el tope diario. */
export const ptsTareasDia = (ids: readonly string[]): number =>
  Math.min(TOPE_TAREAS_DIA, ids.reduce((s, id) => s + ptsTarea(id), 0));

export const totalRegistros = (l: Ledger): number => Object.values(l.dias).reduce((s, d) => s + (d.r || 0), 0);
export const totalMediciones = (l: Ledger): number => Object.values(l.dias).reduce((s, d) => s + (d.m || 0), 0);

export const puntosActividad = (e: Pick<EstadoPuntos, 'tareasPorDia' | 'ledger'>): number =>
  Object.values(e.tareasPorDia).reduce((s, ids) => s + ptsTareasDia(ids), 0) +
  totalRegistros(e.ledger) * PTS_REGISTRO +
  totalMediciones(e.ledger) * PTS_MEDICION;

/** Suma de la mejor marca de cada módulo. */
export const puntosAprender = (progreso: EstadoPuntos['progreso']): number =>
  Object.values(progreso).reduce((s, p) => s + p.mejorPuntos, 0);

export const puntosExamenes = (examenes: EstadoPuntos['examenes']): number =>
  Object.values(examenes).reduce((s, x) => s + (x.pts || 0), 0);

export const puntosTotales = (e: EstadoPuntos): number =>
  puntosAprender(e.progreso) + puntosActividad(e) + puntosExamenes(e.examenes);

export const examenFinalAprobado = (examenes: EstadoPuntos['examenes']): boolean => !!examenes.final?.aprobado;
