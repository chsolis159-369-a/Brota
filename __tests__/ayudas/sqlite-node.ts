import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { BaseDatos } from '@/db/tipos';

type Parametros = SQLInputValue[] | Record<string, SQLInputValue>;

/** Acepta las mismas formas de parámetros que expo-sqlite: variádicos, un arreglo o un objeto con nombres. */
function normalizar(params: unknown[]): Parametros {
  if (params.length === 1 && Array.isArray(params[0])) return params[0] as SQLInputValue[];
  const unico = params[0];
  if (params.length === 1 && unico !== null && typeof unico === 'object' && !(unico instanceof Uint8Array)) {
    return unico as Record<string, SQLInputValue>;
  }
  return params as SQLInputValue[];
}

/**
 * Base SQLite real en memoria (node:sqlite) con la forma de expo-sqlite que usan los repositorios.
 * Permite probar SQL, restricciones y transacciones sin módulos nativos.
 */
export function abrirBaseDePrueba(): BaseDatos & { cerrar: () => void } {
  const db = new DatabaseSync(':memory:');
  const preparar = (sql: string, params: unknown[]) => {
    const st = db.prepare(sql);
    const p = normalizar(params);
    return {
      run: () => (Array.isArray(p) ? st.run(...p) : st.run(p)),
      all: () => (Array.isArray(p) ? st.all(...p) : st.all(p)),
      get: () => (Array.isArray(p) ? st.get(...p) : st.get(p)),
    };
  };
  const api = {
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, ...params: unknown[]) {
      const r = preparar(sql, params).run();
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getAllAsync(sql: string, ...params: unknown[]) {
      return preparar(sql, params).all().map((fila) => ({ ...fila }));
    },
    async getFirstAsync(sql: string, ...params: unknown[]) {
      const fila = preparar(sql, params).get();
      return fila ? { ...fila } : null;
    },
    async withTransactionAsync(tarea: () => Promise<void>) {
      db.exec('BEGIN');
      try {
        await tarea();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    cerrar: () => db.close(),
  };
  return api as unknown as BaseDatos & { cerrar: () => void };
}
