import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AJUSTES_AA, claro, oscuro, type Colores } from '@/tema/colores';

const HTML = readFileSync(join(__dirname, '..', 'reference', 'brota-v9-prototipo.html'), 'utf8');
const NOMBRES: Record<string, keyof Colores> = {
  '--bg': 'bg',
  '--surface': 'surface',
  '--fg': 'fg',
  '--muted': 'muted',
  '--accent': 'accent',
  '--accent-soft': 'accentSoft',
  '--border': 'border',
  '--alert': 'alert',
  '--ok': 'ok',
  '--gold': 'gold',
};

/** Variables de color de un bloque CSS del prototipo. */
function tokens(bloque: string): Partial<Colores> {
  const r: Partial<Colores> = {};
  for (const [, nombre, valor] of bloque.matchAll(/(--[a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)) {
    const k = NOMBRES[nombre!];
    if (k) r[k] = valor!.toUpperCase();
  }
  return r;
}

const bloqueClaro = HTML.slice(HTML.indexOf(':root {', HTML.indexOf('<title>BROTA</title>')), HTML.indexOf('@media (prefers-color-scheme: dark)'));
const bloqueOscuro = HTML.slice(HTML.indexOf(':root[data-theme="dark"]'), HTML.indexOf('body {', HTML.indexOf(':root[data-theme="dark"]')));

const L = (h: string) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
const contraste = (a: string, b: string) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

describe('tokens de color', () => {
  it('modo claro: iguales al prototipo salvo los ajustes AA documentados', () => {
    const proto = tokens(bloqueClaro);
    expect(Object.keys(proto)).toHaveLength(10);
    const esperado = { ...proto };
    const app: Partial<Colores> = { ...claro };
    for (const [k, original] of Object.entries(AJUSTES_AA.claro)) {
      expect(esperado[k as keyof Colores]).toBe(original);
      delete esperado[k as keyof Colores];
      delete app[k as keyof Colores];
    }
    expect(app).toMatchObject(esperado);
  });

  it('modo oscuro: iguales al prototipo', () => {
    const proto = tokens(bloqueOscuro);
    expect(Object.keys(proto)).toHaveLength(10);
    expect(oscuro).toMatchObject(proto);
  });

  describe.each([
    ['claro', claro],
    ['oscuro', oscuro],
  ] as const)('contraste AA en modo %s', (_modo, c) => {
    const pares: [keyof Colores, keyof Colores][] = [
      ['fg', 'bg'],
      ['fg', 'surface'],
      ['fg', 'accentSoft'],
      ['muted', 'bg'],
      ['muted', 'surface'],
      ['muted', 'accentSoft'],
      ['accent', 'bg'],
      ['accent', 'surface'],
      ['accent', 'accentSoft'],
      ['alert', 'bg'],
      ['alert', 'surface'],
      ['ok', 'surface'],
      ['gold', 'bg'],
      ['gold', 'surface'],
      ['sobreAccent', 'accent'],
    ];
    it.each(pares)('%s sobre %s ≥ 4,5', (texto, fondo) => {
      expect(contraste(c[texto], c[fondo])).toBeGreaterThanOrEqual(4.5);
    });
  });
});
