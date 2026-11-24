import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PESTANAS, pestanaDeshabilitada } from '@/config/pestanas';
import i18n from '@/i18n';
import esAR from '@/i18n/es-AR.json';

const HTML = readFileSync(join(__dirname, '..', 'reference', 'brota-v9-prototipo.html'), 'utf8');

/**
 * Textos que no están en el prototipo porque reemplazan limitaciones del prototipo web o cubren
 * casos que el prototipo no tenía (DECISIONS D-12 y D-19). Todo texto nuevo tiene que figurar acá.
 */
const NUEVOS = new Set([
  'clima.sinPronostico',
  'clima.desc.niebla',
  'clima.desc.nieve',
  'clima.desc.tormenta',
  'clima.diasSemana.1',
  'clima.diasSemana.2',
  'clima.diasSemana.3',
  'cultivo.fotos.ayuda',
  'cultivo.fotos.agregar',
]);

/** Hojas de un objeto de textos, con su clave completa. */
function hojas(obj: unknown, prefijo = ''): [string, string][] {
  if (typeof obj === 'string') return [[prefijo, obj]];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => hojas(v, prefijo ? `${prefijo}.${k}` : k));
}

describe('textos', () => {
  it('es-AR es el idioma por defecto', () => {
    expect(i18n.language).toBe('es-AR');
    expect(i18n.t('titulos.cultivos')).toBe('Mis cultivos');
  });

  it('los textos nuevos existen', () => {
    const claves = new Set(hojas(esAR).map(([k]) => k));
    NUEVOS.forEach((k) => expect(claves.has(k)).toBe(true));
  });

  it.each(hojas(esAR).filter(([k]) => !NUEVOS.has(k)))('"%s" sale del prototipo', (_clave, texto) => {
    // Los fragmentos fijos (sin {{variables}}) tienen que aparecer tal cual en el prototipo.
    texto
      .split(/\{\{[^}]+\}\}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .forEach((fragmento) => expect(HTML).toContain(fragmento));
  });

  it('pestañas en el orden del prototipo', () => {
    const proto = "const tabs = [['hoy', 'Hoy'], ['cultivos', 'Cultivos'], ['agente', 'Agente'], ['aprender', 'Aprender'], ['plan', 'Plan']];";
    expect(HTML).toContain(proto);
    expect(PESTANAS.map((p) => i18n.t(`pestanas.${p.clave}`))).toEqual(['Hoy', 'Cultivos', 'Agente', 'Aprender', 'Plan']);
  });

  it('con un examen en curso solo queda habilitada Aprender', () => {
    expect(PESTANAS.filter((p) => pestanaDeshabilitada(p.ruta, true)).map((p) => p.clave)).toEqual(['hoy', 'cultivos', 'agente', 'plan']);
    expect(PESTANAS.some((p) => pestanaDeshabilitada(p.ruta, false))).toBe(false);
  });
});
