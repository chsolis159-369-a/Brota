import type { SQLiteDatabase } from 'expo-sqlite';

export {
  ETAPAS,
  PERFILES,
  TIPOS_REGISTRO,
  UBICACIONES,
  type Etapa,
  type PerfilCultivo,
  type TipoRegistro,
  type Ubicacion,
} from '@/reglas/dominio';

/**
 * Lo que los repositorios usan de una base SQLite. En la app es la de expo-sqlite;
 * en las pruebas, un adaptador sobre node:sqlite con la misma forma.
 */
export type BaseDatos = Pick<
  SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'withTransactionAsync'
>;
