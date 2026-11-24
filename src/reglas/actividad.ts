import type { Ubicacion } from './dominio';
import { fmtFecha } from './fechas';
import { dificultadTarea, ptsTarea, type DificultadTarea, type Ledger } from './puntos';

/* ---------- Tareas diarias (generadas a partir de los cultivos) ---------- */

export type TipoTarea = 'riego' | 'obs' | 'med' | 'dren';

export type Tarea = {
  id: string;
  tipo: TipoTarea;
  cultivoNombre: string;
  puntos: number;
  dificultad: DificultadTarea;
  hecha: boolean;
};

/** Con 60 % o más de probabilidad de lluvia mañana, los cultivos de exterior suman la tarea de drenaje. */
export const LLUVIA_DRENAJE = 60;

/**
 * Tareas de hoy, como el prototipo: por cultivo, revisar la humedad y observar el envés;
 * en interior, medir luz y temperatura; en exterior con lluvia prevista, revisar el drenaje.
 */
export function tareasDelDia(
  cultivos: readonly { id: string; nombre: string; ubicacion: Ubicacion }[],
  lluviaManana: number | null,
  hechas: readonly string[],
): Tarea[] {
  const lista: { id: string; tipo: TipoTarea; cultivoNombre: string }[] = [];
  for (const c of cultivos) {
    lista.push({ id: 'riego-' + c.id, tipo: 'riego', cultivoNombre: c.nombre });
    lista.push({ id: 'obs-' + c.id, tipo: 'obs', cultivoNombre: c.nombre });
    if (c.ubicacion === 'interior') lista.push({ id: 'med-' + c.id, tipo: 'med', cultivoNombre: c.nombre });
    if (c.ubicacion === 'exterior' && lluviaManana !== null && lluviaManana >= LLUVIA_DRENAJE) {
      lista.push({ id: 'dren-' + c.id, tipo: 'dren', cultivoNombre: c.nombre });
    }
  }
  return lista.map((t) => ({ ...t, puntos: ptsTarea(t.id), dificultad: dificultadTarea(t.id), hecha: hechas.includes(t.id) }));
}

/* ---------- Racha ---------- */

/**
 * Días con actividad: tareas, estudio (tests y exámenes), registros o mediciones con puntos,
 * y fechas de la bitácora y mediciones de los cultivos propios.
 */
export function diasActivos(e: {
  tareasPorDia: Record<string, readonly string[]>;
  estudio: readonly string[];
  ledger: Ledger;
  fechasPropias: readonly string[];
}): Set<string> {
  const dias = new Set<string>();
  for (const [dia, ids] of Object.entries(e.tareasPorDia)) if (ids.length) dias.add(dia);
  for (const dia of e.estudio) dias.add(dia);
  for (const [dia, d] of Object.entries(e.ledger.dias)) if ((d.r || 0) + (d.m || 0) > 0) dias.add(dia);
  for (const f of e.fechasPropias) dias.add(f.slice(0, 10));
  return dias;
}

/** Días seguidos con actividad hasta hoy. Si hoy todavía no hubo actividad, cuenta desde ayer. */
export function racha(dias: ReadonlySet<string>, ahora: Date = new Date()): number {
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  if (!dias.has(fmtFecha(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dias.has(fmtFecha(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
