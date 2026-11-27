import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { claro, oscuro, type Colores } from '@/tema/colores';

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

const SOMBRAS: (keyof Colores)[] = ['sombra', 'sombraBoton'];
const HEX = /^#[0-9A-F]{6}$/;

describe('paleta de confianza y confort (D-32, sobre D-29)', () => {
  it('claro y oscuro tienen los mismos tokens, en hexadecimal', () => {
    expect(Object.keys(oscuro).sort()).toEqual(Object.keys(claro).sort());
    for (const tema of [claro, oscuro]) {
      for (const [k, v] of Object.entries(tema)) if (!SOMBRAS.includes(k as keyof Colores)) expect(v).toMatch(HEX);
    }
  });

  it('en oscuro no hay sombras (se usa el borde)', () => {
    expect(oscuro.sombra).toBe('');
    expect(claro.sombra).not.toBe('');
  });

  describe.each([
    ['claro', claro],
    ['oscuro', oscuro],
  ] as const)('contraste AA del texto en modo %s', (_modo, c) => {
    const pares: [keyof Colores, keyof Colores][] = [
      ['fg', 'bg'],
      ['fg', 'surface'],
      ['fg', 'surfaceAlt'],
      ['fg', 'accentSoft'],
      ['fg', 'goldSoft'],
      ['fg', 'alertSoft'],
      ['fg', 'infoSoft'],
      ['muted', 'bg'],
      ['muted', 'surface'],
      ['muted', 'surfaceAlt'],
      ['muted', 'accentSoft'],
      ['accent', 'bg'],
      ['accent', 'surface'],
      ['accent', 'surfaceAlt'],
      ['accent', 'accentSoft'],
      ['alert', 'bg'],
      ['alert', 'surface'],
      ['alert', 'alertSoft'],
      ['ok', 'surface'],
      ['ok', 'accentSoft'],
      ['gold', 'bg'],
      ['gold', 'surface'],
      ['gold', 'goldSoft'],
      ['info', 'surface'],
      ['info', 'infoSoft'],
      ['sobreAccent', 'accent'],
      ['sobreAccent', 'botonDesde'],
      ['sobreAccent', 'botonHasta'],
      ['sobreHero', 'heroDesde'],
      ['sobreHero', 'heroHasta'],
      ['sobreHeroSuave', 'heroDesde'],
      ['sobreHeroSuave', 'heroHasta'],
      ['surface', 'alert'],
    ];
    it.each(pares)('%s sobre %s ≥ 4,5', (texto, fondo) => {
      expect(contraste(c[texto], c[fondo])).toBeGreaterThanOrEqual(4.5);
    });

    it('el botón blanco de las tarjetas destacadas (texto heroHasta) ≥ 4,5', () => {
      expect(contraste(c.heroHasta, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    });

    it.each(['surface', 'surfaceAlt', 'bg'] as const)('el borde de campos y controles sobre %s ≥ 3 (WCAG 1.4.11)', (fondo) => {
      expect(contraste(c.bordeCampo, c[fondo])).toBeGreaterThanOrEqual(3);
    });

    it('el lima de los gráficos sobre el degradé ≥ 3 (objetos gráficos)', () => {
      expect(contraste(c.lima, c.heroDesde)).toBeGreaterThanOrEqual(3);
      expect(contraste(c.lima, c.heroHasta)).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('marca (D-28)', () => {
  it('los íconos y los trazos generados están al día con tools/marca', () => {
    const salida = execFileSync('node', [join(__dirname, '..', 'tools', 'marca', 'generar-marca.js'), '--check'], { encoding: 'utf8' });
    expect(salida).toContain('Marca al día.');
  });

  it('el logo de la app, los íconos y la pantalla de carga están generados', () => {
    for (const f of ['logo', 'icon', 'android-icon-background', 'android-icon-foreground', 'android-icon-monochrome', 'splash-icon']) {
      expect(existsSync(join(__dirname, '..', 'assets', 'images', `${f}.png`))).toBe(true);
    }
  });
});
