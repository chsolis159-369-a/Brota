/**
 * diseno/DESIGN.md describe el sistema de diseño de src/tema y se actualiza junto con él: esta prueba falla
 * si la tabla de colores no coincide con src/tema/colores.ts (mismos tokens y mismos valores en claro y oscuro).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { claro, oscuro, type Colores } from '@/tema/colores';

const doc = readFileSync(join(__dirname, '..', 'diseno', 'DESIGN.md'), 'utf8');

/** Filas de la tabla de colores: | `token` | #claro | #oscuro | uso | */
const filas = new Map(
  [...doc.matchAll(/^\|\s*`(\w+)`\s*\|\s*(#[0-9A-Fa-f]{6})\s*\|\s*(#[0-9A-Fa-f]{6})\s*\|/gm)].map((m) => [m[1]!, { claro: m[2]!, oscuro: m[3]! }]),
);

const esHex = (v: string) => /^#[0-9A-F]{6}$/i.test(v);
const tokensHex = (Object.keys(claro) as (keyof Colores)[]).filter((k) => esHex(claro[k]));

describe('diseno/DESIGN.md', () => {
  it('tiene una fila por cada color del código', () => {
    expect([...filas.keys()].sort()).toEqual([...tokensHex].sort());
  });

  it.each(tokensHex)('%s coincide en claro y en oscuro', (token) => {
    expect(filas.get(token)).toEqual({ claro: claro[token].toUpperCase(), oscuro: oscuro[token].toUpperCase() });
  });

  it('describe las sombras tal como están en el código', () => {
    expect(doc).toContain(claro.sombra);
    expect(oscuro.sombra).toBe('');
    expect(claro.sombraBoton).toBe('');
  });
});
