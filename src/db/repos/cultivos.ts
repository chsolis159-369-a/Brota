import { nuevoId } from '@/util/id';

import type { BaseDatos, Etapa, Ubicacion } from '../tipos';

export type Cultivo = {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: Ubicacion;
  etapa: Etapa;
  /** Fecha de siembra, AAAA-MM-DD. */
  fecha: string;
  /** Cultivo de ejemplo del prototipo: no cuenta para el límite ni da puntos (D-11). */
  ejemplo: boolean;
  creadoEn: string;
};

export type NuevoCultivo = Pick<Cultivo, 'nombre' | 'tipo' | 'ubicacion' | 'etapa' | 'fecha'>;

type Fila = {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: Ubicacion;
  etapa: Etapa;
  fecha: string;
  ejemplo: number;
  creado_en: string;
};

const COLUMNAS = 'id, nombre, tipo, ubicacion, etapa, fecha, ejemplo, creado_en';

const mapear = (f: Fila): Cultivo => ({
  id: f.id,
  nombre: f.nombre,
  tipo: f.tipo,
  ubicacion: f.ubicacion,
  etapa: f.etapa,
  fecha: f.fecha,
  ejemplo: f.ejemplo === 1,
  creadoEn: f.creado_en,
});

/** Del más nuevo al más viejo, como el prototipo (los nuevos se agregan arriba). */
export async function listarCultivos(db: BaseDatos): Promise<Cultivo[]> {
  const filas = await db.getAllAsync<Fila>(`SELECT ${COLUMNAS} FROM cultivos ORDER BY creado_en DESC`);
  return filas.map(mapear);
}

export async function obtenerCultivo(db: BaseDatos, id: string): Promise<Cultivo | null> {
  const f = await db.getFirstAsync<Fila>(`SELECT ${COLUMNAS} FROM cultivos WHERE id = ?`, id);
  return f ? mapear(f) : null;
}

/** Crea un cultivo propio y suma uno a "cultivos creados" (no baja al borrar). */
export async function crearCultivo(db: BaseDatos, nuevo: NuevoCultivo, ahora: Date = new Date()): Promise<Cultivo> {
  const iso = ahora.toISOString();
  const cultivo: Cultivo = { ...nuevo, id: nuevoId(), ejemplo: false, creadoEn: iso };
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO cultivos (id, nombre, tipo, ubicacion, etapa, fecha, ejemplo, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
      [cultivo.id, cultivo.nombre, cultivo.tipo, cultivo.ubicacion, cultivo.etapa, cultivo.fecha, iso, iso],
    );
    await db.runAsync('UPDATE perfil SET cultivos_creados = cultivos_creados + 1, actualizado_en = ? WHERE id = 1', iso);
  });
  return cultivo;
}

export async function cambiarEtapa(db: BaseDatos, id: string, etapa: Etapa, ahora: Date = new Date()): Promise<void> {
  await db.runAsync('UPDATE cultivos SET etapa = ?, actualizado_en = ? WHERE id = ?', [etapa, ahora.toISOString(), id]);
}

/** Borra el cultivo con su bitácora, mediciones y fotos. El ledger y los puntos no cambian. */
export async function eliminarCultivo(db: BaseDatos, id: string): Promise<void> {
  await db.runAsync('DELETE FROM cultivos WHERE id = ?', id);
}

/** Cultivos propios actuales (los de ejemplo no cuentan para el límite del plan Gratis). */
export async function contarCultivosPropios(db: BaseDatos): Promise<number> {
  const f = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM cultivos WHERE ejemplo = 0');
  return f?.n ?? 0;
}
