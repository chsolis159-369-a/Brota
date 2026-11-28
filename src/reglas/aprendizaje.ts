import type { Categoria, Modulo } from '@/contenido/tipos';

import { APROBAR_MODULO, INTENTOS_DIA, PREGS_TEST, type PerfilCultivo, type Plan } from './dominio';
import { hoyStr } from './fechas';
import type { EstadoExamen, ProgresoModulo } from './puntos';

/* ---------- Módulos ---------- */

export const moduloAprobado = (progreso: Record<string, ProgresoModulo>, id: string): boolean =>
  (progreso[id]?.mejorAciertos ?? 0) >= APROBAR_MODULO;

/** Módulos de los que el plan tiene test (Gratis: 16; Pro: 17). */
export const modulosDelPlan = (modulos: readonly Modulo[], plan: Plan): Modulo[] =>
  modulos.filter((m) => m.cat !== 'cannabis' && (!m.pro || plan === 'pro'));

export type MotivoModulo =
  | { tipo: 'cannabis' }
  | { tipo: 'pro' }
  | { tipo: 'puntos'; req: number }
  | { tipo: 'pre'; ids: string[] };

export type Disponibilidad<M> = { ok: true } | { ok: false; motivo: M };

/** Desbloqueo de un módulo: cannabis apagado, Pro, puntos mínimos (req) y prerrequisitos aprobados (pre). */
export function moduloDisponible(
  m: Modulo,
  e: { plan: Plan; puntos: number; progreso: Record<string, ProgresoModulo>; cannabisHabilitado: boolean },
  modulos: readonly Modulo[],
): Disponibilidad<MotivoModulo> {
  if (m.cat === 'cannabis' && !e.cannabisHabilitado) return { ok: false, motivo: { tipo: 'cannabis' } };
  if (m.pro && e.plan !== 'pro') return { ok: false, motivo: { tipo: 'pro' } };
  if ((m.req || 0) > e.puntos) return { ok: false, motivo: { tipo: 'puntos', req: m.req } };
  const pendientes = (m.pre ?? []).filter((id) => modulos.some((x) => x.id === id) && !moduloAprobado(e.progreso, id));
  if (pendientes.length) return { ok: false, motivo: { tipo: 'pre', ids: pendientes } };
  return { ok: true };
}

/* ---------- Exámenes ---------- */

export type IdExamen = 'suelo' | 'siembra' | 'hidro' | 'inerte' | 'luz' | 'plagas' | 'final';

export type Examen = {
  id: IdExamen;
  /** Categorías del bloque; null = todo el temario (sin cannabis). */
  cats: readonly Categoria[] | null;
  /** Si está, el bloque son estos módulos (para partir una categoría grande en dos exámenes). */
  mods?: readonly string[];
  /** Cantidad de preguntas (y minutos). */
  n: number;
  /** Puntos la primera vez que se aprueba. */
  pts: number;
  pro?: boolean;
  /** Exámenes que hay que aprobar antes. */
  pre?: readonly IdExamen[];
};

/**
 * Seis exámenes en el plan Gratis (D-34, pedido del usuario; el prototipo tenía tres) y el final Pro.
 * Cada bloque tiene al menos 14 preguntas en el banco para sortear 10 o 12 sin repetir.
 */
export const EXAMENES: readonly Examen[] = [
  { id: 'suelo', cats: ['huerta'], mods: ['suelo', 'compost', 'rotacion'], n: 12, pts: 40 },
  { id: 'siembra', cats: ['huerta'], mods: ['germinacion', 'calendario'], n: 10, pts: 40 },
  { id: 'hidro', cats: ['hidro', 'nutricion'], n: 12, pts: 40 },
  { id: 'inerte', cats: ['inerte'], n: 10, pts: 40 },
  { id: 'luz', cats: ['luz'], n: 12, pts: 40 },
  { id: 'plagas', cats: ['plagas'], n: 10, pts: 40 },
  { id: 'final', cats: null, n: 30, pts: 0, pro: true, pre: ['suelo', 'siembra', 'hidro', 'inerte', 'luz', 'plagas'] },
];

/** Módulos de un examen a los que el plan da acceso. */
export const modulosExamen = (ex: Examen, modulos: readonly Modulo[], plan: Plan): Modulo[] =>
  modulosDelPlan(modulos, plan).filter((m) => (ex.mods ? ex.mods.includes(m.id) : !ex.cats || ex.cats.includes(m.cat)));

export const intentosHoy = (estado: EstadoExamen | undefined, ahora: Date = new Date()): number =>
  estado && estado.dia === hoyStr(ahora) ? (estado.n ?? 0) : 0;

export type MotivoExamen =
  | { tipo: 'pro' }
  | { tipo: 'preExamenes'; ids: IdExamen[] }
  | { tipo: 'modulos'; ids: string[] }
  | { tipo: 'agotado' };

/** Un examen se habilita con su plan, los exámenes previos y todos los módulos del bloque aprobados. */
export function examenDisponible(
  ex: Examen,
  e: { plan: Plan; progreso: Record<string, ProgresoModulo>; examenes: Record<string, EstadoExamen> },
  modulos: readonly Modulo[],
  ahora: Date = new Date(),
): Disponibilidad<MotivoExamen> {
  if (ex.pro && e.plan !== 'pro') return { ok: false, motivo: { tipo: 'pro' } };
  const faltan = (ex.pre ?? []).filter((id) => !e.examenes[id]?.aprobado);
  if (faltan.length) return { ok: false, motivo: { tipo: 'preExamenes', ids: [...faltan] } };
  const sin = modulosExamen(ex, modulos, e.plan).filter((m) => !moduloAprobado(e.progreso, m.id));
  if (sin.length) return { ok: false, motivo: { tipo: 'modulos', ids: sin.map((m) => m.id) } };
  if (intentosHoy(e.examenes[ex.id], ahora) >= INTENTOS_DIA) return { ok: false, motivo: { tipo: 'agotado' } };
  return { ok: true };
}

/* ---------- Recomendación de Hoy ---------- */

/** Categoría de los primeros módulos según la forma de cultivar. */
export const CAT_PERFIL: Record<PerfilCultivo, Categoria> = { huerta: 'huerta', hidro: 'hidro', interior: 'luz', exterior: 'huerta' };

export type Recomendacion = {
  /** Primer módulo pendiente de su forma de cultivar, esté o no desbloqueado. */
  propio: { modulo: Modulo; disponible: Disponibilidad<MotivoModulo> } | null;
  /** Otro módulo libre para sumar puntos (si el propio no está libre). */
  otro: { modulo: Modulo; titulo: 'mientrasTanto' | 'siguiente' } | null;
  /** Primer examen habilitado y no aprobado. */
  examen: Examen | null;
};

export function recomendacion(
  perfil: PerfilCultivo | null,
  e: { plan: Plan; puntos: number; progreso: Record<string, ProgresoModulo>; examenes: Record<string, EstadoExamen>; cannabisHabilitado: boolean },
  modulos: readonly Modulo[],
  ahora: Date = new Date(),
): Recomendacion {
  const pendientes = modulosDelPlan(modulos, e.plan).filter((m) => !moduloAprobado(e.progreso, m.id));
  const libres = pendientes.filter((m) => moduloDisponible(m, e, modulos).ok);
  const cat = perfil ? CAT_PERFIL[perfil] : null;
  const propioMod = cat ? pendientes.find((m) => m.cat === cat) : undefined;
  const propio = propioMod ? { modulo: propioMod, disponible: moduloDisponible(propioMod, e, modulos) } : null;
  const propioLibre = !!propio && propio.disponible.ok;
  const otroMod = propioLibre ? undefined : libres.find((m) => !propio || m.id !== propio.modulo.id);
  const examen = EXAMENES.find((x) => examenDisponible(x, e, modulos, ahora).ok && !e.examenes[x.id]?.aprobado) ?? null;
  return {
    propio,
    otro: otroMod ? { modulo: otroMod, titulo: propio ? 'mientrasTanto' : 'siguiente' } : null,
    examen,
  };
}

/* ---------- Logros ---------- */

export const LOGROS = ['primero', 'constante', 'led', 'cultivador', 'explorador', 'test', 'examen', 'maestro'] as const;
export type IdLogro = (typeof LOGROS)[number];

export function logros(e: {
  totalRegistros: number;
  totalMediciones: number;
  racha: number;
  creados: number;
  progreso: Record<string, ProgresoModulo>;
  examenes: Record<string, EstadoExamen>;
}): Record<IdLogro, boolean> {
  const aprobados = Object.keys(e.progreso).filter((id) => moduloAprobado(e.progreso, id)).length;
  return {
    primero: e.totalRegistros > 0,
    constante: e.racha >= 3,
    led: e.totalMediciones > 0,
    cultivador: e.creados >= 3,
    explorador: aprobados >= 3,
    test: Object.values(e.progreso).some((p) => p.mejorAciertos >= PREGS_TEST),
    examen: Object.values(e.examenes).some((x) => x.aprobado),
    maestro: !!e.examenes.final?.aprobado,
  };
}
