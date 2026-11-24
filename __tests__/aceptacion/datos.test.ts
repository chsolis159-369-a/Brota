/**
 * Aceptación sobre la capa de datos real (store + repositorios + SQLite): ledger, límites y cultivos de ejemplo.
 * Nombres tomados de reference/pruebas-prototipo-v9.js.
 */
import { CULTIVOS_EJEMPLO, inicializarDatos, migrar } from '@/db';
import { escucharEventos, type Evento } from '@/servicios/analytics';
import { useDatos, type FormCultivo, type FormMedicion } from '@/store/datos';
import { resumenHoy } from '@/store/derivados';
import { MODULOS } from '@/contenido';
import { puntosActividad, puntosTotales, totalMediciones, totalRegistros } from '@/reglas/puntos';

import { abrirBaseDePrueba } from '../ayudas/sqlite-node';

let reloj = new Date(2026, 10, 23, 10, 0, 0).getTime();
const ahora = () => new Date(reloj);
const avanzarDias = (n: number) => { reloj += n * 86400000; };
const S = () => useDatos.getState();
const FORM: FormCultivo = { nombre: 'Mi planta', tipo: '', ubicacion: 'interior', etapa: 'Siembra', fecha: '2026-11-23' };
const MED: FormMedicion = { watts: '', altura: '', horas: '', ppfd: '400', temp: '', humedad: '' };
const VACIA: FormMedicion = { watts: '', altura: '', horas: '', ppfd: '', temp: '', humedad: '' };

async function nuevo(nombre = 'Mi planta') {
  const r = await S().crearCultivo({ ...FORM, nombre });
  if (!r.ok) throw new Error(r.error);
  return r.id;
}
const actividad = () => puntosActividad(S());

beforeEach(async () => {
  reloj = new Date(2026, 10, 23, 10, 0, 0).getTime();
  const db = abrirBaseDePrueba();
  await migrar(db);
  await inicializarDatos(db, ahora());
  await S().cargar(db, { ahora });
});

describe('Bitácora, mediciones y ledger', () => {
  it('Un registro suma 2 pts', async () => {
    const id = await nuevo();
    await S().registrar(id, 'Riego', '');
    expect(actividad()).toBe(2);
  });

  it('Máximo 5 registros con puntos por día', async () => {
    const id = await nuevo();
    for (let i = 0; i < 7; i++) await S().registrar(id, 'Riego', '');
    expect(S().cultivos.find((c) => c.id === id)?.bitacora).toHaveLength(7);
    expect([totalRegistros(S().ledger), actividad()]).toEqual([5, 10]);
  });

  it('Al día siguiente los registros vuelven a sumar', async () => {
    const id = await nuevo();
    for (let i = 0; i < 6; i++) await S().registrar(id, 'Riego', '');
    avanzarDias(1);
    await S().registrar(id, 'Riego', '');
    expect(totalRegistros(S().ledger)).toBe(6);
  });

  it('Registro rápido sin nota', async () => {
    const id = await nuevo();
    await S().registrar(id, 'Poda', '   ');
    expect(S().cultivos.find((c) => c.id === id)?.bitacora[0]).toMatchObject({ nota: 'Registro rápido: poda', tipo: 'Poda', fecha: '2026-11-23 10:00' });
  });

  it('Registro con nota', async () => {
    const id = await nuevo();
    await S().registrar(id, 'Observación', '  Hojas nuevas  ');
    expect(S().cultivos.find((c) => c.id === id)?.bitacora[0]?.nota).toBe('Hojas nuevas');
  });

  it('Una medición suma 4 pts', async () => {
    const id = await nuevo();
    expect(await S().medir(id, MED)).toBe(true);
    expect(actividad()).toBe(4);
  });

  it('Máximo 2 mediciones con puntos por día', async () => {
    const id = await nuevo();
    for (let i = 0; i < 3; i++) await S().medir(id, MED);
    expect(S().cultivos.find((c) => c.id === id)?.mediciones).toHaveLength(3);
    expect([totalMediciones(S().ledger), actividad()]).toEqual([2, 8]);
  });

  it('Una medición sin valores no se guarda ni suma', async () => {
    const id = await nuevo();
    expect(await S().medir(id, VACIA)).toBe(false);
    expect(S().cultivos.find((c) => c.id === id)?.mediciones).toHaveLength(0);
    expect(actividad()).toBe(0);
  });

  it('Una medición con un solo valor se guarda', async () => {
    const id = await nuevo();
    await S().medir(id, { ...VACIA, temp: '24' });
    expect(S().cultivos.find((c) => c.id === id)?.mediciones[0]).toMatchObject({ temp: 24, ppfd: null });
  });

  it('Crear un cultivo suma a cultivos creados', async () => {
    await nuevo();
    expect(S().ledger.creados).toBe(1);
  });

  it('Borrar un cultivo no resta puntos', async () => {
    const id = await nuevo();
    for (let i = 0; i < 3; i++) await S().registrar(id, 'Riego', '');
    for (let i = 0; i < 2; i++) await S().medir(id, MED);
    expect(actividad()).toBe(14);
    await S().eliminarCultivo(id);
    expect(S().cultivos.some((c) => c.id === id)).toBe(false);
    expect(actividad()).toBe(14);
    expect(S().ledger.creados).toBe(1);
  });

  it('La bitácora de ejemplo no da puntos al empezar', () => {
    expect(S().cultivos.filter((c) => c.ejemplo)).toHaveLength(CULTIVOS_EJEMPLO.length);
    expect(puntosTotales(S())).toBe(0);
  });

  it('Borrar un cultivo borra los archivos de sus fotos', async () => {
    const borrados: string[] = [];
    const db = abrirBaseDePrueba();
    await migrar(db);
    await inicializarDatos(db, ahora());
    await S().cargar(db, { ahora, borrarArchivo: (u) => borrados.push(u) });
    const id = await nuevo();
    await S().agregarFoto(id, 'file:///fotos/a.jpg');
    await S().eliminarCultivo(id);
    expect(borrados).toEqual(['file:///fotos/a.jpg']);
  });
});

describe('Plan y paywall', () => {
  it('Gratis permite 2 cultivos propios', async () => {
    await nuevo('A');
    await nuevo('B');
    expect(S().cultivos.filter((c) => !c.ejemplo)).toHaveLength(2);
  });

  it('El tercero se bloquea en Gratis', async () => {
    await nuevo('A');
    await nuevo('B');
    expect(await S().crearCultivo({ ...FORM, nombre: 'C' })).toEqual({ ok: false, error: 'limite' });
  });

  it('Los de ejemplo no cuentan para el límite', async () => {
    expect(S().cultivos.filter((c) => c.ejemplo)).toHaveLength(2);
    await expect(nuevo('A')).resolves.toBeTruthy();
  });

  it('Un cultivo sin nombre no se crea', async () => {
    expect(await S().crearCultivo({ ...FORM, nombre: '   ' })).toEqual({ ok: false, error: 'nombre' });
  });

  it('Un cultivo sin tipo queda "Sin especificar"', async () => {
    const id = await nuevo();
    expect(S().cultivos.find((c) => c.id === id)?.tipo).toBe('Sin especificar');
  });
});

describe('Eventos', () => {
  it('cultivo_creado, registro_creado y onboarding_completo', async () => {
    const vistos: Evento[] = [];
    const quitar = escucharEventos((e) => vistos.push(e));
    await S().elegirPerfil('hidro');
    await S().completarOnboarding();
    const id = await nuevo();
    await S().registrar(id, 'Riego', '');
    quitar();
    expect(vistos).toEqual(['onboarding_completo', 'cultivo_creado', 'registro_creado']);
    expect(S().perfil).toMatchObject({ onboarded: true, perfil: 'hidro' });
  });
});

describe('Tareas', () => {
  it('Marcar y desmarcar una tarea', async () => {
    await S().alternarTarea('riego-ejemplo-1');
    const r = resumenHoy({ ...S(), plan: 'gratis', perfil: null }, { lluviaManana: 0, modulos: MODULOS, cannabisHabilitado: false }, ahora());
    expect([r.hechas, r.ptsTareasHoy, r.racha]).toEqual([1, 5, 1]);
    await S().alternarTarea('riego-ejemplo-1');
    expect(S().tareasPorDia).toEqual({});
  });
});

describe('Discrepancias con la especificación (D-11: en la app tienen que cumplirse)', () => {
  it('Un registro en un cultivo de ejemplo no suma puntos', async () => {
    await S().registrar('ejemplo-1', 'Riego', '');
    expect(actividad()).toBe(0);
    expect(S().cultivos.find((c) => c.id === 'ejemplo-1')?.bitacora).toHaveLength(2);
  });

  it('Una medición en un cultivo de ejemplo no suma puntos', async () => {
    await S().medir('ejemplo-1', MED);
    expect(actividad()).toBe(0);
  });

  it('Un registro en un cultivo de ejemplo no da el logro "Primer registro"', async () => {
    await S().registrar('ejemplo-1', 'Riego', '');
    const r = resumenHoy({ ...S(), plan: 'gratis', perfil: null }, { lluviaManana: 0, modulos: MODULOS, cannabisHabilitado: false }, ahora());
    expect(r.logros.primero).toBe(false);
    expect(r.racha).toBe(0);
  });
});
