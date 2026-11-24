/**
 * Fechas en hora local con el formato del prototipo.
 * Puras: reciben la fecha para poder probarlas y usarlas en el servidor.
 */

const p2 = (n: number) => String(n).padStart(2, '0');

/** AAAA-MM-DD en hora local (fmtFecha del prototipo). */
export function fmtFecha(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** Día de hoy, AAAA-MM-DD (hoyStr del prototipo). */
export function hoyStr(ahora: Date = new Date()): string {
  return fmtFecha(ahora);
}

/** AAAA-MM-DD HH:MM en hora local (ahora() del prototipo): fecha de registros y mediciones. */
export function fechaHora(ahora: Date = new Date()): string {
  return `${fmtFecha(ahora)} ${p2(ahora.getHours())}:${p2(ahora.getMinutes())}`;
}

/** Fecha local a partir de "AAAA-MM-DD" (ignora la hora si viene). */
export function parseFecha(s: string): Date {
  const [y = 0, m = 1, d = 1] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Días enteros entre una fecha y hoy (diasDesde del prototipo). */
export function diasDesde(s: string, ahora: Date = new Date()): number {
  return Math.round((parseFecha(hoyStr(ahora)).getTime() - parseFecha(s).getTime()) / 86400000);
}
