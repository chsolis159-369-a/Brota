/**
 * Idiomas (D-36): cada traducción tiene las mismas claves que es-AR, las mismas variables ({{n}}) y las
 * mismas listas; ningún texto queda vacío.
 */
import i18n, { IDIOMAS, RECURSOS } from '@/i18n';

type Hoja = [clave: string, texto: string];

function hojas(obj: unknown, prefijo = ''): Hoja[] {
  if (typeof obj === 'string') return [[prefijo, obj]];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => hojas(v, prefijo ? `${prefijo}.${k}` : k));
}

const variables = (texto: string) => [...texto.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

const base = new Map(hojas(RECURSOS['es-AR'].translation));
const otros = IDIOMAS.filter((x) => x.codigo !== 'es-AR');

describe('idiomas', () => {
  it('cinco idiomas: español, inglés, italiano, francés y chino', () => {
    expect(IDIOMAS.map((x) => x.codigo)).toEqual(['es-AR', 'en', 'it', 'fr', 'zh-CN']);
  });

  describe.each(otros.map((x) => [x.codigo]))('%s', (codigo) => {
    const traduccion = new Map(hojas(RECURSOS[codigo as keyof typeof RECURSOS].translation));

    it('tiene las mismas claves que es-AR', () => {
      expect([...traduccion.keys()].sort()).toEqual([...base.keys()].sort());
    });

    it('conserva las variables de cada texto y no deja textos vacíos', () => {
      const distintos = [...base].filter(([k, t]) => JSON.stringify(variables(t)) !== JSON.stringify(variables(traduccion.get(k) ?? '')));
      expect(distintos.map(([k]) => k)).toEqual([]);
      expect([...traduccion].filter(([, t]) => !t.trim()).map(([k]) => k)).toEqual([]);
    });

    it('se puede elegir y traduce las pestañas', async () => {
      await i18n.changeLanguage(codigo);
      expect(i18n.t('pestanas.hoy')).not.toBe('Hoy');
      await i18n.changeLanguage('es-AR');
      expect(i18n.t('pestanas.hoy')).toBe('Hoy');
    });
  });
});
