import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CANNABIS_HABILITADO, FOTO_AGENTE } from '@/config/flags';
import { CONTENIDO, GLOSARIO, MODULOS, moduloPorId, preguntasDe } from '@/contenido';

const { auditar } = require('../tools/auditoria-contenido.js') as {
  auditar: (c: unknown) => { errores: string[]; resumen: { visibles: number; cannabis: number; preguntas: number } | null };
};
const { extraer } = require('../tools/extraer-contenido.js') as { extraer: () => unknown };

const archivo = () => JSON.parse(readFileSync(join(__dirname, '..', 'content', 'modulos.json'), 'utf8'));

describe('contenido', () => {
  it('cannabis sigue apagado; el análisis de fotos por IA está prendido (D-30)', () => {
    expect(CANNABIS_HABILITADO).toBe(false);
    expect(FOTO_AGENTE).toBe(true);
  });

  it('se carga tal cual está en content/modulos.json', () => {
    expect(CONTENIDO).toEqual(archivo());
  });

  it('content/modulos.json sigue igual al prototipo', () => {
    expect(archivo()).toEqual(extraer());
  });

  it('muestra 17 módulos, sin cannabis', () => {
    expect(MODULOS).toHaveLength(17);
    expect(MODULOS.some((m) => m.cat === 'cannabis')).toBe(false);
    expect(CONTENIDO.modulos.filter((m) => m.cat === 'cannabis')).toHaveLength(3);
  });

  it('16 módulos son de Gratis y diagnóstico es Pro', () => {
    expect(MODULOS.filter((m) => !m.pro)).toHaveLength(16);
    expect(moduloPorId('diagnostico')?.pro).toBe(true);
  });

  it('cada módulo visible tiene 7 preguntas', () => {
    MODULOS.forEach((m) => expect(preguntasDe(m)).toHaveLength(7));
  });

  it('un módulo de cannabis no se puede abrir por id', () => {
    expect(moduloPorId('cann-legal')).toBeUndefined();
  });

  it('glosario de 31 términos', () => {
    expect(GLOSARIO).toHaveLength(31);
    expect(GLOSARIO[0]).toEqual(['PPFD', 'Luz útil que llega a una superficie, en µmol/m²/s.']);
  });
});

describe('auditoría de contenido', () => {
  it('el contenido real pasa sin errores', () => {
    const { errores, resumen } = auditar(archivo());
    expect(errores).toEqual([]);
    expect(resumen).toMatchObject({ visibles: 17, cannabis: 3, preguntas: 128 });
  });

  const casos: [string, (c: ReturnType<typeof archivo>) => void, string][] = [
    ['correcta repetida entre las incorrectas', (c) => { c.modulos[0].quiz[0].no[0] = c.modulos[0].quiz[0].ok; }, 'más de una correcta'],
    ['opciones incorrectas repetidas', (c) => { c.modulos[0].quiz[0].no[1] = c.modulos[0].quiz[0].no[0]; }, 'no son distintas'],
    ['dificultad fuera de 1 a 3', (c) => { c.modulos[1].banco[0].d = 4; }, 'dificultad inválida'],
    ['sin explicación', (c) => { c.modulos[2].quiz[1].e = '  '; }, 'sin explicación'],
    ['"todas las anteriores"', (c) => { c.modulos[3].quiz[2].no[1] = 'Todas las anteriores'; }, 'anteriores'],
    ['"ninguna de las anteriores"', (c) => { c.modulos[3].quiz[2].no[1] = 'Ninguna de las anteriores'; }, 'anteriores'],
    ['solo 2 incorrectas', (c) => { c.modulos[4].quiz[0].no.pop(); }, 'exactamente 3'],
    ['sin respuesta correcta', (c) => { delete c.modulos[4].quiz[0].ok; }, 'sin respuesta correcta'],
    ['enunciado duplicado', (c) => { c.modulos[5].banco[0].p = c.modulos[0].quiz[0].p; }, 'duplicado'],
    ['un módulo de menos', (c) => { c.modulos.splice(16, 1); }, 'módulos visibles'],
    ['prerrequisito inexistente', (c) => { c.modulos[3].pre = ['nada']; }, 'inexistente'],
    ['ciclo de prerrequisitos', (c) => { c.modulos[0].pre = ['compost']; }, 'ciclo'],
    ['término de glosario repetido', (c) => { c.glosario.push(['PPFD', 'otra']); }, 'término duplicado'],
    ['lección vacía', (c) => { c.modulos[0].lec[0].x = ''; }, 'texto vacío'],
    ['categoría desconocida', (c) => { c.modulos[0].cat = 'frutales'; }, 'categoría desconocida'],
    ['formato viejo con o/r', (c) => { c.modulos[0].quiz[0].o = ['a', 'b', 'c']; }, 'formato viejo'],
  ];

  it.each(casos)('detecta: %s', (_nombre, romper, mensaje) => {
    const c = archivo();
    romper(c);
    const { errores } = auditar(c);
    expect(errores.join('\n')).toContain(mensaje);
  });
});
