import type { BaseDatos } from './tipos';

/**
 * Migraciones en orden. La posición i lleva la base de la versión i a la i+1 (PRAGMA user_version).
 * Nunca se edita una migración ya publicada: se agrega una nueva al final.
 */
export const MIGRACIONES: readonly string[] = [
  // v1: datos locales del prototipo (cultivos, bitácora, mediciones, fotos, tareas, ledger, estudio, progreso, perfil)
  `
  CREATE TABLE perfil (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    onboarded INTEGER NOT NULL DEFAULT 0,
    perfil TEXT CHECK (perfil IN ('huerta', 'hidro', 'interior', 'exterior')),
    plan TEXT NOT NULL DEFAULT 'gratis' CHECK (plan IN ('gratis', 'pro')),
    cultivos_creados INTEGER NOT NULL DEFAULT 0 CHECK (cultivos_creados >= 0),
    actualizado_en TEXT NOT NULL
  );

  CREATE TABLE cultivos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
    tipo TEXT NOT NULL,
    ubicacion TEXT NOT NULL CHECK (ubicacion IN ('interior', 'exterior')),
    etapa TEXT NOT NULL CHECK (etapa IN ('Siembra', 'Crecimiento', 'Floración', 'Cosecha')),
    fecha TEXT NOT NULL,
    ejemplo INTEGER NOT NULL DEFAULT 0 CHECK (ejemplo IN (0, 1)),
    creado_en TEXT NOT NULL,
    actualizado_en TEXT NOT NULL
  );

  CREATE TABLE registros (
    id TEXT PRIMARY KEY,
    cultivo_id TEXT NOT NULL REFERENCES cultivos (id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Riego', 'Fertilizante', 'Poda', 'Plaga', 'Observación')),
    nota TEXT NOT NULL,
    creado_en TEXT NOT NULL
  );
  CREATE INDEX registros_por_cultivo ON registros (cultivo_id, fecha DESC, creado_en DESC);

  CREATE TABLE mediciones (
    id TEXT PRIMARY KEY,
    cultivo_id TEXT NOT NULL REFERENCES cultivos (id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    watts REAL,
    altura_cm REAL,
    horas REAL,
    ppfd REAL,
    temp REAL,
    humedad REAL,
    creado_en TEXT NOT NULL,
    CHECK (watts IS NOT NULL OR altura_cm IS NOT NULL OR horas IS NOT NULL
      OR ppfd IS NOT NULL OR temp IS NOT NULL OR humedad IS NOT NULL)
  );
  CREATE INDEX mediciones_por_cultivo ON mediciones (cultivo_id, fecha DESC, creado_en DESC);

  CREATE TABLE fotos (
    id TEXT PRIMARY KEY,
    cultivo_id TEXT NOT NULL REFERENCES cultivos (id) ON DELETE CASCADE,
    uri TEXT NOT NULL,
    fecha TEXT NOT NULL,
    creado_en TEXT NOT NULL
  );
  CREATE INDEX fotos_por_cultivo ON fotos (cultivo_id, creado_en DESC);

  CREATE TABLE tareas_hechas (
    dia TEXT NOT NULL,
    tarea_id TEXT NOT NULL,
    PRIMARY KEY (dia, tarea_id)
  );

  CREATE TABLE ledger_dias (
    dia TEXT PRIMARY KEY,
    r INTEGER NOT NULL DEFAULT 0 CHECK (r >= 0),
    m INTEGER NOT NULL DEFAULT 0 CHECK (m >= 0)
  );

  CREATE TABLE estudio_dias (
    dia TEXT PRIMARY KEY
  );

  CREATE TABLE progreso_modulos (
    modulo_id TEXT PRIMARY KEY,
    mejor_aciertos INTEGER NOT NULL CHECK (mejor_aciertos >= 0),
    mejor_puntos INTEGER NOT NULL CHECK (mejor_puntos >= 0),
    actualizado_en TEXT NOT NULL
  );
  `,
];

export const VERSION_BD = MIGRACIONES.length;

/** Aplica las migraciones pendientes, cada una en su transacción. Devuelve la versión final. */
export async function migrar(db: BaseDatos): Promise<number> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = fila?.user_version ?? 0;
  if (version > MIGRACIONES.length) {
    throw new Error(`La base está en la versión ${version} y esta app solo conoce hasta la ${MIGRACIONES.length}`);
  }
  while (version < MIGRACIONES.length) {
    const sql = MIGRACIONES[version]!;
    const siguiente = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${siguiente}`);
    });
    version = siguiente;
  }
  return version;
}
