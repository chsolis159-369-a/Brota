import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Lo que los repositorios usan de una base SQLite. En la app es la de expo-sqlite;
 * en las pruebas, un adaptador sobre node:sqlite con la misma forma.
 */
export type BaseDatos = Pick<
  SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'withTransactionAsync'
>;

export const ETAPAS = ['Siembra', 'Crecimiento', 'Floración', 'Cosecha'] as const;
export type Etapa = (typeof ETAPAS)[number];

export const UBICACIONES = ['interior', 'exterior'] as const;
export type Ubicacion = (typeof UBICACIONES)[number];

export const TIPOS_REGISTRO = ['Riego', 'Fertilizante', 'Poda', 'Plaga', 'Observación'] as const;
export type TipoRegistro = (typeof TIPOS_REGISTRO)[number];

export const PERFILES = ['huerta', 'hidro', 'interior', 'exterior'] as const;
export type PerfilCultivo = (typeof PERFILES)[number];
