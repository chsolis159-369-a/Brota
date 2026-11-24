import type { BaseDatos, Etapa, TipoRegistro, Ubicacion } from './tipos';

/** Cultivos de ejemplo del prototipo (función ejemplo()), con su bitácora y mediciones. Textos sin cambios. */
export const CULTIVOS_EJEMPLO: readonly {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: Ubicacion;
  etapa: Etapa;
  fecha: string;
  bitacora: { fecha: string; tipo: TipoRegistro; nota: string }[];
  condiciones: { fecha: string; watts: number; alturaCm: number; horas: number; ppfd: number; temp: number; humedad: number }[];
}[] = [
  {
    id: 'ejemplo-1',
    nombre: 'Albahaca 1',
    tipo: 'Albahaca',
    ubicacion: 'interior',
    etapa: 'Crecimiento',
    fecha: '2026-09-20',
    bitacora: [{ fecha: '2026-11-03 09:10', tipo: 'Riego', nota: 'Riego ligero; tierra seca a 3 cm' }],
    condiciones: [
      { fecha: '2026-11-03 20:00', watts: 100, alturaCm: 35, horas: 18, ppfd: 420, temp: 24, humedad: 60 },
      { fecha: '2026-10-30 20:00', watts: 100, alturaCm: 30, horas: 18, ppfd: 280, temp: 23, humedad: 58 },
    ],
  },
  {
    id: 'ejemplo-2',
    nombre: 'Tomates del patio',
    tipo: 'Tomate cherry',
    ubicacion: 'exterior',
    etapa: 'Floración',
    fecha: '2026-08-10',
    bitacora: [{ fecha: '2026-10-31 08:00', tipo: 'Poda', nota: 'Quité brotes laterales' }],
    condiciones: [],
  },
];

/**
 * Primera apertura: crea el perfil y siembra los cultivos de ejemplo. Si el perfil ya existe no hace nada.
 * Devuelve true si inicializó.
 */
export async function inicializarDatos(db: BaseDatos, ahora: Date = new Date()): Promise<boolean> {
  const existe = await db.getFirstAsync<{ id: number }>('SELECT id FROM perfil WHERE id = 1');
  if (existe) return false;
  await db.withTransactionAsync(async () => {
    const iso = ahora.toISOString();
    await db.runAsync('INSERT INTO perfil (id, actualizado_en) VALUES (1, ?)', iso);
    // El primero del prototipo queda arriba: se le da el creado_en más nuevo.
    for (const [i, c] of CULTIVOS_EJEMPLO.entries()) {
      const creado = new Date(ahora.getTime() - i).toISOString();
      await db.runAsync(
        'INSERT INTO cultivos (id, nombre, tipo, ubicacion, etapa, fecha, ejemplo, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
        [c.id, c.nombre, c.tipo, c.ubicacion, c.etapa, c.fecha, creado, creado],
      );
      for (const [k, r] of c.bitacora.entries()) {
        await db.runAsync(
          'INSERT INTO registros (id, cultivo_id, fecha, tipo, nota, creado_en) VALUES (?, ?, ?, ?, ?, ?)',
          [`${c.id}-r${k}`, c.id, r.fecha, r.tipo, r.nota, creado],
        );
      }
      for (const [k, m] of c.condiciones.entries()) {
        await db.runAsync(
          'INSERT INTO mediciones (id, cultivo_id, fecha, watts, altura_cm, horas, ppfd, temp, humedad, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [`${c.id}-m${k}`, c.id, m.fecha, m.watts, m.alturaCm, m.horas, m.ppfd, m.temp, m.humedad, creado],
        );
      }
    }
  });
  return true;
}

/**
 * Borra todos los datos del dispositivo: cultivos (con bitácora, mediciones y fotos), tareas, ledger,
 * estudio y progreso. El perfil vuelve al plan Gratis con 0 cultivos creados. No vuelve a sembrar ejemplos.
 * (El borrado en el servidor y de los archivos de fotos se suma en H6.)
 */
export async function borrarTodosLosDatos(db: BaseDatos, ahora: Date = new Date()): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM fotos;
      DELETE FROM mediciones;
      DELETE FROM registros;
      DELETE FROM cultivos;
      DELETE FROM tareas_hechas;
      DELETE FROM ledger_dias;
      DELETE FROM estudio_dias;
      DELETE FROM progreso_modulos;
    `);
    await db.runAsync("UPDATE perfil SET plan = 'gratis', cultivos_creados = 0, actualizado_en = ? WHERE id = 1", ahora.toISOString());
  });
}
