import { create } from 'zustand';

import {
  actualizarPerfil,
  agregarFoto as agregarFotoBD,
  alternarTarea as alternarTareaBD,
  borrarTodosLosDatos,
  cambiarEtapa as cambiarEtapaBD,
  contarCultivosPropios,
  crearCultivo as crearCultivoBD,
  crearMedicion,
  crearRegistro,
  diasDeEstudio,
  eliminarCultivo as eliminarCultivoBD,
  leerLedger,
  leerProgreso,
  listarCultivos,
  listarFotos,
  listarMediciones,
  listarRegistros,
  marcarEstudio,
  medicionVacia,
  obtenerPerfil,
  registrarResultadoTest,
  sumarAlLedger,
  todasLasTareas,
  type BaseDatos,
  type Cultivo,
  type Foto,
  type Medicion,
  type Perfil,
  type Registro,
} from '@/db';
import { limiteAlcanzado, notaRegistro, prepararNuevoCultivo, sumaPuntos } from '@/reglas/cultivos';
import { TOPE_MED_DIA, TOPE_REG_DIA, type Etapa, type PerfilCultivo, type Plan, type TipoRegistro, type Ubicacion } from '@/reglas/dominio';
import type { ResultadoTest } from '@/reglas/test';
import { fechaHora, hoyStr } from '@/reglas/fechas';
import { numero } from '@/reglas/mediciones';
import type { EstadoExamen, Ledger, ProgresoModulo } from '@/reglas/puntos';
import { registrarEvento } from '@/servicios/analytics';

import { useApp } from './app';

export type CultivoCompleto = Cultivo & {
  /** De la más nueva a la más vieja. */
  bitacora: Registro[];
  mediciones: Medicion[];
  fotos: Foto[];
};

export type FormCultivo = { nombre: string; tipo: string; ubicacion: Ubicacion; etapa: Etapa; fecha: string; plantilla?: string };
export type FormMedicion = { watts: string; altura: string; horas: string; ppfd: string; temp: string; humedad: string };

type Dependencias = {
  /** Borra el archivo de una foto (en la app, expo-file-system). */
  borrarArchivo?: (uri: string) => void;
  /** Reloj inyectable para pruebas. */
  ahora?: () => Date;
};

type EstadoDatos = {
  listo: boolean;
  perfil: Perfil;
  cultivos: CultivoCompleto[];
  tareasPorDia: Record<string, string[]>;
  ledger: Ledger;
  estudio: string[];
  progreso: Record<string, ProgresoModulo>;
  /** Copia local del estado de exámenes (la fuente de verdad será el servidor, H4). */
  examenes: Record<string, EstadoExamen>;

  cargar: (db: BaseDatos, deps?: Dependencias) => Promise<void>;
  recargar: () => Promise<void>;
  elegirPerfil: (perfil: PerfilCultivo) => Promise<void>;
  completarOnboarding: () => Promise<void>;
  crearCultivo: (f: FormCultivo) => Promise<{ ok: true; id: string } | { ok: false; error: 'nombre' | 'limite' }>;
  cambiarEtapa: (id: string, etapa: Etapa) => Promise<void>;
  eliminarCultivo: (id: string) => Promise<void>;
  registrar: (cultivoId: string, tipo: TipoRegistro, nota: string) => Promise<void>;
  medir: (cultivoId: string, f: FormMedicion) => Promise<boolean>;
  agregarFoto: (cultivoId: string, uri: string) => Promise<void>;
  alternarTarea: (tareaId: string) => Promise<void>;
  /** Preguntas del último test de cada módulo (para no repetirlas). Solo en memoria, como el prototipo. */
  vistasTest: Record<string, string[]>;
  recordarVistas: (moduloId: string, preguntas: string[]) => void;
  /** Guarda el resultado de un test: mejor marca, día de estudio y evento. Devuelve los puntos nuevos. */
  terminarTest: (moduloId: string, r: ResultadoTest) => Promise<{ gan: number; mejor: number }>;
  /** Cambio de plan solo en el teléfono (versión de prueba, D-25). */
  elegirPlanLocal: (plan: Plan) => Promise<void>;
  /** Borra todos los datos del dispositivo, incluidas las fotos. */
  borrarTodo: () => Promise<void>;
};

const PERFIL_INICIAL: Perfil = { onboarded: false, perfil: null, plan: 'gratis', cultivosCreados: 0 };

let db: BaseDatos | null = null;
let deps: Required<Dependencias> = { borrarArchivo: () => {}, ahora: () => new Date() };

function base(): BaseDatos {
  if (!db) throw new Error('La base de datos no está cargada');
  return db;
}

async function leerTodo(bd: BaseDatos) {
  const cultivos = await listarCultivos(bd);
  const completos = await Promise.all(
    cultivos.map(async (c) => ({
      ...c,
      bitacora: await listarRegistros(bd, c.id),
      mediciones: await listarMediciones(bd, c.id),
      fotos: await listarFotos(bd, c.id),
    })),
  );
  return {
    perfil: (await obtenerPerfil(bd)) ?? PERFIL_INICIAL,
    cultivos: completos,
    tareasPorDia: await todasLasTareas(bd),
    ledger: await leerLedger(bd),
    estudio: await diasDeEstudio(bd),
    progreso: await leerProgreso(bd),
  };
}

export const useDatos = create<EstadoDatos>()((set, get) => ({
  listo: false,
  perfil: PERFIL_INICIAL,
  cultivos: [],
  tareasPorDia: {},
  ledger: { dias: {}, creados: 0 },
  estudio: [],
  progreso: {},
  examenes: {},

  async cargar(bd, d = {}) {
    db = bd;
    deps = { borrarArchivo: d.borrarArchivo ?? (() => {}), ahora: d.ahora ?? (() => new Date()) };
    await get().recargar();
  },

  async recargar() {
    const datos = await leerTodo(base());
    useApp.getState().setPlan(datos.perfil.plan);
    set({ ...datos, listo: true });
  },

  async elegirPerfil(perfil) {
    await actualizarPerfil(base(), { perfil }, deps.ahora());
    await get().recargar();
  },

  async completarOnboarding() {
    await actualizarPerfil(base(), { onboarded: true }, deps.ahora());
    registrarEvento('onboarding_completo', { perfil: get().perfil.perfil });
    await get().recargar();
  },

  async crearCultivo(f) {
    const bd = base();
    const nuevo = prepararNuevoCultivo(f);
    if (!nuevo) return { ok: false, error: 'nombre' };
    if (limiteAlcanzado(get().perfil.plan, await contarCultivosPropios(bd))) return { ok: false, error: 'limite' };
    const c = await crearCultivoBD(bd, nuevo, deps.ahora());
    registrarEvento('cultivo_creado', { ubicacion: c.ubicacion, etapa: c.etapa, plantilla: f.plantilla ?? null });
    await get().recargar();
    return { ok: true, id: c.id };
  },

  async cambiarEtapa(id, etapa) {
    await cambiarEtapaBD(base(), id, etapa, deps.ahora());
    await get().recargar();
  },

  async eliminarCultivo(id) {
    const fotos = get().cultivos.find((c) => c.id === id)?.fotos ?? [];
    await eliminarCultivoBD(base(), id);
    fotos.forEach((f) => deps.borrarArchivo(f.uri));
    await get().recargar();
  },

  async registrar(cultivoId, tipo, nota) {
    const bd = base();
    const cultivo = get().cultivos.find((c) => c.id === cultivoId);
    if (!cultivo) return;
    const ahora = deps.ahora();
    await crearRegistro(bd, { cultivoId, fecha: fechaHora(ahora), tipo, nota: notaRegistro(tipo, nota) }, ahora);
    if (sumaPuntos(cultivo)) await sumarAlLedger(bd, hoyStr(ahora), 'r', TOPE_REG_DIA);
    registrarEvento('registro_creado', { tipo, ejemplo: cultivo.ejemplo });
    await get().recargar();
  },

  async medir(cultivoId, f) {
    const bd = base();
    const cultivo = get().cultivos.find((c) => c.id === cultivoId);
    if (!cultivo) return false;
    const valores = {
      watts: numero(f.watts),
      alturaCm: numero(f.altura),
      horas: numero(f.horas),
      ppfd: numero(f.ppfd),
      temp: numero(f.temp),
      humedad: numero(f.humedad),
    };
    if (medicionVacia(valores)) return false;
    const ahora = deps.ahora();
    await crearMedicion(bd, { cultivoId, fecha: fechaHora(ahora), ...valores }, ahora);
    if (sumaPuntos(cultivo)) await sumarAlLedger(bd, hoyStr(ahora), 'm', TOPE_MED_DIA);
    await get().recargar();
    return true;
  },

  async agregarFoto(cultivoId, uri) {
    const ahora = deps.ahora();
    await agregarFotoBD(base(), { cultivoId, uri, fecha: fechaHora(ahora) }, ahora);
    await get().recargar();
  },

  async alternarTarea(tareaId) {
    await alternarTareaBD(base(), hoyStr(deps.ahora()), tareaId);
    await get().recargar();
  },

  vistasTest: {},
  recordarVistas(moduloId, preguntas) {
    set({ vistasTest: { ...get().vistasTest, [moduloId]: preguntas } });
  },

  async terminarTest(moduloId, r) {
    const bd = base();
    const ahora = deps.ahora();
    const { antes, despues } = await registrarResultadoTest(bd, moduloId, r.aciertos, r.total, ahora);
    await marcarEstudio(bd, hoyStr(ahora));
    registrarEvento('modulo_test_fin', { modulo: moduloId, aciertos: r.aciertos, aprobado: r.aprobado, puntos: r.total });
    await get().recargar();
    return { gan: Math.max(0, r.total - (antes?.mejorPuntos ?? 0)), mejor: despues.mejorPuntos };
  },

  async elegirPlanLocal(plan) {
    await actualizarPerfil(base(), { plan }, deps.ahora());
    await get().recargar();
  },

  async borrarTodo() {
    const fotos = get().cultivos.flatMap((c) => c.fotos.map((f) => f.uri));
    await borrarTodosLosDatos(base(), deps.ahora());
    fotos.forEach((u) => deps.borrarArchivo(u));
    set({ vistasTest: {} });
    await get().recargar();
  },
}));

/** Reloj de la capa de datos (inyectable en pruebas). */
export const ahoraDatos = (): Date => deps.ahora();
