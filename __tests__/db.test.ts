import {
  CULTIVOS_EJEMPLO,
  MIGRACIONES,
  VERSION_BD,
  actualizarPerfil,
  agregarFoto,
  alternarTarea,
  borrarTodosLosDatos,
  cambiarEtapa,
  contarCultivosPropios,
  crearCultivo,
  crearMedicion,
  crearRegistro,
  diasDeEstudio,
  eliminarCultivo,
  inicializarDatos,
  leerLedger,
  leerProgreso,
  listarCultivos,
  listarFotos,
  listarMediciones,
  listarRegistros,
  marcarEstudio,
  migrar,
  obtenerCultivo,
  obtenerPerfil,
  registrarResultadoTest,
  sumarAlLedger,
  tareasHechas,
  todasLasTareas,
  type NuevoCultivo,
} from '@/db';

import { abrirBaseDePrueba } from './ayudas/sqlite-node';

const AHORA = new Date(2026, 10, 23, 10, 0, 0);
const NUEVO: NuevoCultivo = { nombre: 'Mi planta', tipo: 'Lechuga', ubicacion: 'interior', etapa: 'Siembra', fecha: '2026-11-23' };
const SIN_VALORES = { watts: null, alturaCm: null, horas: null, ppfd: null, temp: null, humedad: null };

async function baseLista() {
  const db = abrirBaseDePrueba();
  await migrar(db);
  await inicializarDatos(db, AHORA);
  return db;
}

describe('migraciones', () => {
  it('lleva una base vacía a la última versión', async () => {
    const db = abrirBaseDePrueba();
    expect(await migrar(db)).toBe(VERSION_BD);
    expect(await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')).toEqual({ user_version: MIGRACIONES.length });
  });

  it('es idempotente', async () => {
    const db = abrirBaseDePrueba();
    await migrar(db);
    expect(await migrar(db)).toBe(VERSION_BD);
  });

  it('crea las tablas de datos locales', async () => {
    const db = abrirBaseDePrueba();
    await migrar(db);
    const tablas = (await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")).map((t) => t.name);
    expect(tablas).toEqual(
      expect.arrayContaining(['perfil', 'cultivos', 'registros', 'mediciones', 'fotos', 'tareas_hechas', 'ledger_dias', 'estudio_dias', 'progreso_modulos']),
    );
  });

  it('rechaza una base de una versión más nueva', async () => {
    const db = abrirBaseDePrueba();
    await db.execAsync(`PRAGMA user_version = ${VERSION_BD + 1}`);
    await expect(migrar(db)).rejects.toThrow('solo conoce hasta');
  });
});

describe('inicio', () => {
  it('crea el perfil en Gratis y siembra los cultivos de ejemplo del prototipo', async () => {
    const db = await baseLista();
    expect(await obtenerPerfil(db)).toEqual({ onboarded: false, perfil: null, plan: 'gratis', cultivosCreados: 0 });
    const cultivos = await listarCultivos(db);
    expect(cultivos.map((c) => [c.nombre, c.tipo, c.ubicacion, c.etapa, c.fecha, c.ejemplo])).toEqual([
      ['Albahaca 1', 'Albahaca', 'interior', 'Crecimiento', '2026-09-20', true],
      ['Tomates del patio', 'Tomate cherry', 'exterior', 'Floración', '2026-08-10', true],
    ]);
  });

  it('siembra la bitácora y las mediciones de ejemplo', async () => {
    const db = await baseLista();
    expect(await listarRegistros(db, 'ejemplo-1')).toEqual([
      { id: 'ejemplo-1-r0', cultivoId: 'ejemplo-1', fecha: '2026-11-03 09:10', tipo: 'Riego', nota: 'Riego ligero; tierra seca a 3 cm' },
    ]);
    expect((await listarMediciones(db, 'ejemplo-1')).map((m) => [m.fecha, m.ppfd, m.alturaCm])).toEqual([
      ['2026-11-03 20:00', 420, 35],
      ['2026-10-30 20:00', 280, 30],
    ]);
    expect(await listarRegistros(db, 'ejemplo-2')).toHaveLength(1);
  });

  it('no vuelve a sembrar si ya inicializó', async () => {
    const db = await baseLista();
    expect(await inicializarDatos(db, AHORA)).toBe(false);
    expect(await listarCultivos(db)).toHaveLength(CULTIVOS_EJEMPLO.length);
  });

  it('los cultivos de ejemplo no cuentan como propios ni como creados', async () => {
    const db = await baseLista();
    expect(await contarCultivosPropios(db)).toBe(0);
    expect((await leerLedger(db)).creados).toBe(0);
  });
});

describe('perfil', () => {
  it('actualiza onboarding, forma de cultivar y plan', async () => {
    const db = await baseLista();
    await actualizarPerfil(db, { onboarded: true, perfil: 'hidro', plan: 'pro' });
    expect(await obtenerPerfil(db)).toMatchObject({ onboarded: true, perfil: 'hidro', plan: 'pro' });
  });

  it('rechaza un plan o una forma de cultivar desconocidos', async () => {
    const db = await baseLista();
    await expect(db.runAsync("UPDATE perfil SET plan = 'business' WHERE id = 1")).rejects.toThrow();
    await expect(db.runAsync("UPDATE perfil SET perfil = 'otro' WHERE id = 1")).rejects.toThrow();
  });
});

describe('cultivos', () => {
  it('crea un cultivo propio arriba de la lista y suma a creados', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO, new Date(AHORA.getTime() + 1000));
    expect(c).toMatchObject({ ...NUEVO, ejemplo: false });
    expect((await listarCultivos(db))[0]?.id).toBe(c.id);
    expect(await contarCultivosPropios(db)).toBe(1);
    expect((await obtenerPerfil(db))?.cultivosCreados).toBe(1);
  });

  it('cambia la etapa', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO);
    await cambiarEtapa(db, c.id, 'Floración');
    expect((await obtenerCultivo(db, c.id))?.etapa).toBe('Floración');
  });

  it('rechaza nombre vacío, etapa o ubicación inválidas', async () => {
    const db = await baseLista();
    await expect(crearCultivo(db, { ...NUEVO, nombre: '   ' })).rejects.toThrow();
    await expect(crearCultivo(db, { ...NUEVO, etapa: 'Otoño' as never })).rejects.toThrow();
    await expect(crearCultivo(db, { ...NUEVO, ubicacion: 'balcón' as never })).rejects.toThrow();
    expect((await obtenerPerfil(db))?.cultivosCreados).toBe(0);
  });

  it('borrar un cultivo borra su bitácora, mediciones y fotos, pero no el ledger ni los creados', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO);
    await crearRegistro(db, { cultivoId: c.id, fecha: '2026-11-23 10:00', tipo: 'Riego', nota: 'n' });
    await crearMedicion(db, { cultivoId: c.id, fecha: '2026-11-23 10:00', ...SIN_VALORES, ppfd: 400 });
    await agregarFoto(db, { cultivoId: c.id, uri: 'file:///foto.jpg', fecha: '2026-11-23 10:00' });
    await sumarAlLedger(db, '2026-11-23', 'r', 5);
    await eliminarCultivo(db, c.id);
    expect(await obtenerCultivo(db, c.id)).toBeNull();
    for (const tabla of ['registros', 'mediciones', 'fotos']) {
      expect(await db.getFirstAsync(`SELECT COUNT(*) AS n FROM ${tabla} WHERE cultivo_id = ?`, c.id)).toEqual({ n: 0 });
    }
    expect(await leerLedger(db)).toEqual({ dias: { '2026-11-23': { r: 1, m: 0 } }, creados: 1 });
  });
});

describe('bitácora', () => {
  it('lista los registros del más nuevo al más viejo', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO);
    await crearRegistro(db, { cultivoId: c.id, fecha: '2026-11-22 08:00', tipo: 'Riego', nota: 'viejo' }, AHORA);
    await crearRegistro(db, { cultivoId: c.id, fecha: '2026-11-23 08:00', tipo: 'Poda', nota: 'nuevo' }, AHORA);
    await crearRegistro(db, { cultivoId: c.id, fecha: '2026-11-23 08:00', tipo: 'Plaga', nota: 'mismo minuto, después' }, new Date(AHORA.getTime() + 1));
    expect((await listarRegistros(db, c.id)).map((r) => r.nota)).toEqual(['mismo minuto, después', 'nuevo', 'viejo']);
  });

  it('rechaza un tipo de registro desconocido', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO);
    await expect(crearRegistro(db, { cultivoId: c.id, fecha: '2026-11-23 08:00', tipo: 'Cosecha' as never, nota: 'n' })).rejects.toThrow();
  });

  it('una medición sin ningún valor no se guarda', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO);
    expect(await crearMedicion(db, { cultivoId: c.id, fecha: '2026-11-23 10:00', ...SIN_VALORES })).toBeNull();
    expect(await listarMediciones(db, c.id)).toEqual([]);
  });

  it('la base también rechaza una medición vacía', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO);
    await expect(
      db.runAsync("INSERT INTO mediciones (id, cultivo_id, fecha, creado_en) VALUES ('x', ?, '2026-11-23 10:00', '2026-11-23')", c.id),
    ).rejects.toThrow();
  });

  it('guarda una medición con un solo valor', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO);
    const m = await crearMedicion(db, { cultivoId: c.id, fecha: '2026-11-23 10:00', ...SIN_VALORES, temp: 24 });
    expect(m).toMatchObject({ temp: 24, ppfd: null });
    expect(await listarMediciones(db, c.id)).toEqual([m]);
  });

  it('lista las fotos de la más nueva a la más vieja', async () => {
    const db = await baseLista();
    const c = await crearCultivo(db, NUEVO);
    await agregarFoto(db, { cultivoId: c.id, uri: 'file:///1.jpg', fecha: '2026-11-01 10:00' }, AHORA);
    await agregarFoto(db, { cultivoId: c.id, uri: 'file:///2.jpg', fecha: '2026-11-08 10:00' }, new Date(AHORA.getTime() + 1));
    expect((await listarFotos(db, c.id)).map((f) => f.uri)).toEqual(['file:///2.jpg', 'file:///1.jpg']);
  });
});

describe('actividad', () => {
  it('marca y desmarca tareas por día', async () => {
    const db = await baseLista();
    expect(await alternarTarea(db, '2026-11-23', 'riego-1')).toBe(true);
    expect(await alternarTarea(db, '2026-11-23', 'obs-1')).toBe(true);
    expect(await tareasHechas(db, '2026-11-23')).toEqual(['riego-1', 'obs-1']);
    expect(await alternarTarea(db, '2026-11-23', 'riego-1')).toBe(false);
    expect(await tareasHechas(db, '2026-11-23')).toEqual(['obs-1']);
    await alternarTarea(db, '2026-11-24', 'riego-1');
    expect(await todasLasTareas(db)).toEqual({ '2026-11-23': ['obs-1'], '2026-11-24': ['riego-1'] });
  });

  it('el ledger respeta el tope diario de registros', async () => {
    const db = await baseLista();
    const sumas = [];
    for (let i = 0; i < 7; i++) sumas.push(await sumarAlLedger(db, '2026-11-23', 'r', 5));
    expect(sumas).toEqual([true, true, true, true, true, false, false]);
    expect((await leerLedger(db)).dias['2026-11-23']).toEqual({ r: 5, m: 0 });
  });

  it('el ledger respeta el tope diario de mediciones, por separado', async () => {
    const db = await baseLista();
    for (let i = 0; i < 3; i++) await sumarAlLedger(db, '2026-11-23', 'm', 2);
    await sumarAlLedger(db, '2026-11-23', 'r', 5);
    expect((await leerLedger(db)).dias['2026-11-23']).toEqual({ r: 1, m: 2 });
  });

  it('el tope es por día', async () => {
    const db = await baseLista();
    for (let i = 0; i < 6; i++) await sumarAlLedger(db, '2026-11-23', 'r', 5);
    expect(await sumarAlLedger(db, '2026-11-24', 'r', 5)).toBe(true);
    expect((await leerLedger(db)).dias).toEqual({ '2026-11-23': { r: 5, m: 0 }, '2026-11-24': { r: 1, m: 0 } });
  });

  it('registra días de estudio una sola vez', async () => {
    const db = await baseLista();
    await marcarEstudio(db, '2026-11-23');
    await marcarEstudio(db, '2026-11-23');
    await marcarEstudio(db, '2026-11-22');
    expect(await diasDeEstudio(db)).toEqual(['2026-11-22', '2026-11-23']);
  });
});

describe('progreso de módulos', () => {
  it('guarda la primera marca', async () => {
    const db = await baseLista();
    expect(await registrarResultadoTest(db, 'suelo', 2, 50)).toEqual({ antes: null, despues: { mejorAciertos: 2, mejorPuntos: 50 } });
  });

  it('solo cuenta la mejor marca, aciertos y puntos por separado', async () => {
    const db = await baseLista();
    await registrarResultadoTest(db, 'suelo', 2, 50);
    const r = await registrarResultadoTest(db, 'suelo', 2, 30);
    expect(r).toEqual({ antes: { mejorAciertos: 2, mejorPuntos: 50 }, despues: { mejorAciertos: 2, mejorPuntos: 50 } });
    await registrarResultadoTest(db, 'suelo', 3, 75);
    await registrarResultadoTest(db, 'luz', 1, 30);
    expect(await leerProgreso(db)).toEqual({ suelo: { mejorAciertos: 3, mejorPuntos: 75 }, luz: { mejorAciertos: 1, mejorPuntos: 30 } });
  });
});

describe('borrado', () => {
  it('borra todos los datos del dispositivo y vuelve a Gratis', async () => {
    const db = await baseLista();
    await actualizarPerfil(db, { onboarded: true, plan: 'pro' });
    const c = await crearCultivo(db, NUEVO);
    await crearRegistro(db, { cultivoId: c.id, fecha: '2026-11-23 10:00', tipo: 'Riego', nota: 'n' });
    await alternarTarea(db, '2026-11-23', 'riego-1');
    await sumarAlLedger(db, '2026-11-23', 'r', 5);
    await marcarEstudio(db, '2026-11-23');
    await registrarResultadoTest(db, 'suelo', 3, 75);
    await borrarTodosLosDatos(db);
    expect(await listarCultivos(db)).toEqual([]);
    expect(await todasLasTareas(db)).toEqual({});
    expect(await leerLedger(db)).toEqual({ dias: {}, creados: 0 });
    expect(await diasDeEstudio(db)).toEqual([]);
    expect(await leerProgreso(db)).toEqual({});
    expect(await obtenerPerfil(db)).toMatchObject({ plan: 'gratis', cultivosCreados: 0 });
    expect(await inicializarDatos(db)).toBe(false);
  });
});
