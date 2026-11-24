import { diasDesde, fechaHora, fmtFecha, hoyStr, parseFecha } from '@/reglas/fechas';

describe('fechas (formato del prototipo)', () => {
  const d = new Date(2026, 0, 5, 7, 3);

  it('fmtFecha y hoyStr: AAAA-MM-DD en hora local', () => {
    expect(fmtFecha(d)).toBe('2026-01-05');
    expect(hoyStr(d)).toBe('2026-01-05');
  });

  it('fechaHora: AAAA-MM-DD HH:MM', () => {
    expect(fechaHora(d)).toBe('2026-01-05 07:03');
  });

  it('parseFecha ignora la hora', () => {
    expect(parseFecha('2026-11-23 18:45')).toEqual(new Date(2026, 10, 23));
  });

  it('diasDesde cuenta días enteros, aunque cruce un cambio de mes', () => {
    const hoy = new Date(2026, 11, 2, 23, 59);
    expect(diasDesde('2026-12-02', hoy)).toBe(0);
    expect(diasDesde('2026-11-29 08:00', hoy)).toBe(3);
  });
});
