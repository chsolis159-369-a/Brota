import type { BaseDatos } from '../tipos';

/** Mejor marca de un módulo. Aciertos y puntos se guardan por separado, como en el prototipo. */
export type ProgresoModulo = { mejorAciertos: number; mejorPuntos: number };

type Fila = { modulo_id: string; mejor_aciertos: number; mejor_puntos: number };

export async function leerProgreso(db: BaseDatos): Promise<Record<string, ProgresoModulo>> {
  const filas = await db.getAllAsync<Fila>('SELECT modulo_id, mejor_aciertos, mejor_puntos FROM progreso_modulos');
  const progreso: Record<string, ProgresoModulo> = {};
  for (const f of filas) progreso[f.modulo_id] = { mejorAciertos: f.mejor_aciertos, mejorPuntos: f.mejor_puntos };
  return progreso;
}

/**
 * Guarda el resultado de un test: conserva la mejor cantidad de aciertos y el mejor puntaje,
 * cada uno por su lado. Devuelve la marca anterior y la nueva.
 */
export async function registrarResultadoTest(
  db: BaseDatos,
  moduloId: string,
  aciertos: number,
  puntos: number,
  ahora: Date = new Date(),
): Promise<{ antes: ProgresoModulo | null; despues: ProgresoModulo }> {
  let antes: ProgresoModulo | null = null;
  let despues: ProgresoModulo = { mejorAciertos: aciertos, mejorPuntos: puntos };
  await db.withTransactionAsync(async () => {
    const f = await db.getFirstAsync<Fila>(
      'SELECT modulo_id, mejor_aciertos, mejor_puntos FROM progreso_modulos WHERE modulo_id = ?',
      moduloId,
    );
    antes = f ? { mejorAciertos: f.mejor_aciertos, mejorPuntos: f.mejor_puntos } : null;
    despues = {
      mejorAciertos: Math.max(aciertos, f?.mejor_aciertos ?? 0),
      mejorPuntos: Math.max(puntos, f?.mejor_puntos ?? 0),
    };
    await db.runAsync(
      `INSERT INTO progreso_modulos (modulo_id, mejor_aciertos, mejor_puntos, actualizado_en) VALUES (?, ?, ?, ?)
       ON CONFLICT (modulo_id) DO UPDATE SET mejor_aciertos = excluded.mejor_aciertos,
         mejor_puntos = excluded.mejor_puntos, actualizado_en = excluded.actualizado_en`,
      [moduloId, despues.mejorAciertos, despues.mejorPuntos, ahora.toISOString()],
    );
  });
  return { antes, despues };
}
