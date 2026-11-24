import type { BaseDatos } from '../tipos';

/* ---------- Tareas hechas (tareasPorDia del prototipo) ---------- */

export async function tareasHechas(db: BaseDatos, dia: string): Promise<string[]> {
  const filas = await db.getAllAsync<{ tarea_id: string }>(
    'SELECT tarea_id FROM tareas_hechas WHERE dia = ? ORDER BY rowid',
    dia,
  );
  return filas.map((f) => f.tarea_id);
}

/** Todas las tareas hechas, agrupadas por día. */
export async function todasLasTareas(db: BaseDatos): Promise<Record<string, string[]>> {
  const filas = await db.getAllAsync<{ dia: string; tarea_id: string }>(
    'SELECT dia, tarea_id FROM tareas_hechas ORDER BY dia, rowid',
  );
  const porDia: Record<string, string[]> = {};
  for (const f of filas) (porDia[f.dia] ??= []).push(f.tarea_id);
  return porDia;
}

/** Marca o desmarca una tarea del día. Devuelve true si quedó hecha. */
export async function alternarTarea(db: BaseDatos, dia: string, tareaId: string): Promise<boolean> {
  const borrada = await db.runAsync('DELETE FROM tareas_hechas WHERE dia = ? AND tarea_id = ?', [dia, tareaId]);
  if (borrada.changes > 0) return false;
  await db.runAsync('INSERT INTO tareas_hechas (dia, tarea_id) VALUES (?, ?)', [dia, tareaId]);
  return true;
}

/* ---------- Ledger de puntos por día (no se pierde al borrar un cultivo) ---------- */

export type DiaLedger = { r: number; m: number };
export type Ledger = { dias: Record<string, DiaLedger>; creados: number };

export async function leerLedger(db: BaseDatos): Promise<Ledger> {
  const filas = await db.getAllAsync<{ dia: string; r: number; m: number }>('SELECT dia, r, m FROM ledger_dias');
  const perfil = await db.getFirstAsync<{ cultivos_creados: number }>('SELECT cultivos_creados FROM perfil WHERE id = 1');
  const dias: Record<string, DiaLedger> = {};
  for (const f of filas) dias[f.dia] = { r: f.r, m: f.m };
  return { dias, creados: perfil?.cultivos_creados ?? 0 };
}

const SUMAR = {
  r: 'UPDATE ledger_dias SET r = r + 1 WHERE dia = ? AND r < ?',
  m: 'UPDATE ledger_dias SET m = m + 1 WHERE dia = ? AND m < ?',
} as const;

/**
 * Suma un registro (r) o una medición (m) con puntos al día, sin pasar el tope.
 * Es atómico: dos llamadas simultáneas no pueden superar el tope. Devuelve true si sumó.
 */
export async function sumarAlLedger(db: BaseDatos, dia: string, tipo: 'r' | 'm', tope: number): Promise<boolean> {
  await db.runAsync('INSERT OR IGNORE INTO ledger_dias (dia) VALUES (?)', dia);
  const res = await db.runAsync(SUMAR[tipo], [dia, tope]);
  return res.changes > 0;
}

/* ---------- Días con estudio (tests de módulo y exámenes; cuentan para la racha) ---------- */

export async function marcarEstudio(db: BaseDatos, dia: string): Promise<void> {
  await db.runAsync('INSERT OR IGNORE INTO estudio_dias (dia) VALUES (?)', dia);
}

export async function diasDeEstudio(db: BaseDatos): Promise<string[]> {
  const filas = await db.getAllAsync<{ dia: string }>('SELECT dia FROM estudio_dias ORDER BY dia');
  return filas.map((f) => f.dia);
}
