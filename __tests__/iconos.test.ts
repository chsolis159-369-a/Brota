import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PESTANAS } from '@/config/pestanas';
import { ICONOS } from '@/tema/iconos';

const MODULOS = join(__dirname, '..', 'node_modules');

/** Versión de SF Symbols en la que aparece cada nombre, según los tipos de sf-symbols-typescript. */
function versionesSF(): Map<string, number> {
  const texto = readFileSync(join(MODULOS, 'sf-symbols-typescript', 'dist', 'index.d.ts'), 'utf8');
  const versiones = new Map<string, number>();
  for (const bloque of texto.split(/export type SFSymbols(?=\d)/).slice(1)) {
    const version = Number(bloque.slice(0, bloque.indexOf(' ')).replace('_', '.'));
    for (const m of bloque.matchAll(/'([^']+)'/g)) if (!versiones.has(m[1]!)) versiones.set(m[1]!, version);
  }
  return versiones;
}

/** Nombres de Material Symbols que dibuja expo-symbols en Android. */
const MATERIAL = JSON.parse(readFileSync(join(MODULOS, 'expo-symbols', 'build', 'android', 'symbols.json'), 'utf8')) as Record<string, number>;

// iOS 16.4, el mínimo de la app (Expo SDK 58), trae SF Symbols 4.2: un símbolo más nuevo no se ve.
const SF_MAXIMA = 4.2;

const ios = [...Object.values(ICONOS).map((d) => d.ios), ...PESTANAS.map((p) => p.sf)];
const android = [...Object.values(ICONOS).map((d) => d.android), ...PESTANAS.map((p) => p.md)];

describe('Íconos (D-33)', () => {
  test('en iOS, todos existen en SF Symbols 4.2 o anterior', () => {
    const versiones = versionesSF();
    const fuera = ios.filter((n) => !((versiones.get(n) ?? Infinity) <= SF_MAXIMA));
    expect(fuera).toEqual([]);
  });

  test('en Android, todos existen en Material Symbols', () => {
    expect(android.filter((n) => !(n in MATERIAL))).toEqual([]);
  });

  test('un solo estilo: de línea, sin rellenos', () => {
    expect(ios.filter((n) => n.includes('.fill'))).toEqual([]);
  });

  test('cada pestaña tiene un ícono distinto', () => {
    expect(new Set(PESTANAS.map((p) => p.sf)).size).toBe(PESTANAS.length);
    expect(new Set(PESTANAS.map((p) => p.md)).size).toBe(PESTANAS.length);
  });
});
