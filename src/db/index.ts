import type { SQLiteDatabase } from 'expo-sqlite';

import { inicializarDatos } from './inicio';
import { migrar } from './migraciones';

export * from './inicio';
export * from './migraciones';
export * from './repos/actividad';
export * from './repos/bitacora';
export * from './repos/cultivos';
export * from './repos/perfil';
export * from './repos/progreso';
export * from './tipos';

export const NOMBRE_BD = 'brota.db';

/** onInit de SQLiteProvider: modo WAL, migraciones y datos iniciales. */
export async function prepararBaseDatos(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrar(db);
  await inicializarDatos(db);
}
