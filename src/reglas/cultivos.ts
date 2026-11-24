import { LIMITE_GRATIS, type Etapa, type Plan, type TipoRegistro, type Ubicacion } from './dominio';
import { diasDesde } from './fechas';
import { evaluarAltura, evaluarPPFD } from './mediciones';

/** Tipo que se guarda si el usuario no lo completa. */
export const TIPO_SIN_ESPECIFICAR = 'Sin especificar';

/** Plantillas para empezar rápido: nombre, descripción y ubicación. */
export const PLANTILLAS: readonly { nombre: string; tipo: string; ubicacion: Ubicacion }[] = [
  { nombre: 'Albahaca', tipo: 'Hierba aromática', ubicacion: 'exterior' },
  { nombre: 'Lechuga', tipo: 'Hortaliza de hoja', ubicacion: 'interior' },
  { nombre: 'Tomate cherry', tipo: 'Hortaliza de fruto', ubicacion: 'exterior' },
  { nombre: 'Microverdes', tipo: 'Brotes', ubicacion: 'interior' },
];

/** El plan Gratis permite 2 cultivos propios; los de ejemplo no cuentan. */
export const limiteAlcanzado = (plan: Plan, propios: number): boolean => plan === 'gratis' && propios >= LIMITE_GRATIS;

/** Valida y limpia un cultivo nuevo. Sin nombre no se crea (null). */
export function prepararNuevoCultivo(f: {
  nombre: string;
  tipo: string;
  ubicacion?: Ubicacion;
  etapa?: Etapa;
  fecha: string;
}): { nombre: string; tipo: string; ubicacion: Ubicacion; etapa: Etapa; fecha: string } | null {
  const nombre = f.nombre.trim();
  if (!nombre) return null;
  return {
    nombre,
    tipo: f.tipo.trim() || TIPO_SIN_ESPECIFICAR,
    ubicacion: f.ubicacion ?? 'interior',
    etapa: f.etapa ?? 'Siembra',
    fecha: f.fecha.trim(),
  };
}

/** Nota de un registro: la escrita o "Registro rápido: <tipo>". */
export const notaRegistro = (tipo: TipoRegistro, nota: string): string =>
  nota.trim() || 'Registro rápido: ' + tipo.toLowerCase();

/** Día de cultivo (el día de siembra es el día 1). */
export const diasDeCultivo = (fecha: string, ahora: Date = new Date()): number => Math.max(1, diasDesde(fecha.slice(0, 10), ahora) + 1);

export type Salud =
  | { nivel: 'alerta'; motivo: 'luz' }
  | { nivel: 'aviso'; motivo: 'sinRegistros' }
  | { nivel: 'aviso'; motivo: 'diasSinRegistro'; dias: number }
  | { nivel: 'ok'; motivo: 'enOrden' };

type DatosSalud = {
  ubicacion: Ubicacion;
  etapa: Etapa;
  /** Última medición (la más nueva) o null. */
  ultimaMedicion: { ppfd: number | null; alturaCm: number | null } | null;
  /** Bitácora de la más nueva a la más vieja. */
  bitacora: readonly { fecha: string; tipo: TipoRegistro }[];
};

/** Estado del cultivo (saludCultivo del prototipo). */
export function saludCultivo(c: DatosSalud, ahora: Date = new Date()): Salud {
  const u = c.ultimaMedicion;
  if (u && c.ubicacion === 'interior') {
    const pp = evaluarPPFD(c.etapa, u.ppfd);
    const al = evaluarAltura(u.alturaCm);
    if ((pp && pp.estado !== 'ok') || (al && !al.ok)) return { nivel: 'alerta', motivo: 'luz' };
  }
  const ultimo = c.bitacora[0];
  if (!ultimo) return { nivel: 'aviso', motivo: 'sinRegistros' };
  const d = diasDesde(ultimo.fecha, ahora);
  if (d >= 3) return { nivel: 'aviso', motivo: 'diasSinRegistro', dias: d };
  return { nivel: 'ok', motivo: 'enOrden' };
}

export type ProximoPaso =
  | { tipo: 'alerta'; salud: Salud }
  | { tipo: 'primerRegistro' }
  | { tipo: 'regar' }
  | { tipo: 'cosecha' }
  | { tipo: 'alDia' };

/** Próximo paso sugerido (proximoPaso del prototipo). */
export function proximoPaso(c: DatosSalud, ahora: Date = new Date()): ProximoPaso {
  const s = saludCultivo(c, ahora);
  if (s.nivel === 'alerta') return { tipo: 'alerta', salud: s };
  if (!c.bitacora.length) return { tipo: 'primerRegistro' };
  const riego = c.bitacora.find((r) => r.tipo === 'Riego');
  if (!riego || diasDesde(riego.fecha, ahora) >= 3) return { tipo: 'regar' };
  if (c.etapa === 'Cosecha') return { tipo: 'cosecha' };
  return { tipo: 'alDia' };
}

/** Registros y mediciones en cultivos de ejemplo no suman puntos ni logros (D-11). */
export const sumaPuntos = (cultivo: { ejemplo: boolean }): boolean => !cultivo.ejemplo;
