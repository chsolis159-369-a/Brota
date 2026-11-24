/**
 * Aceptación: secciones "Test de módulo" y "Agente por reglas" de reference/pruebas-prototipo-v9.js,
 * portadas a src/reglas (mismos nombres). La mejor marca se prueba sobre la capa de datos real.
 */
import { MODULOS, moduloPorId, preguntasDe } from '@/contenido';
import type { Modulo } from '@/contenido/tipos';
import { inicializarDatos, migrar } from '@/db';
import { PREGUNTAS_RAPIDAS, coincide, responder } from '@/reglas/agente';
import { MAX_PTS_MODULO } from '@/reglas/dominio';
import { armarPregunta, armarTest, corregirTest, estrellas, mensajeResultado, type PreguntaArmada } from '@/reglas/test';
import { escucharEventos } from '@/servicios/analytics';
import { useDatos } from '@/store/datos';

import { abrirBaseDePrueba } from '../ayudas/sqlite-node';

const suelo = moduloPorId('suelo')!;
/** Respuestas: true = elegir la correcta, false = una incorrecta. */
const responderCon = (pregs: PreguntaArmada[], aciertos: boolean[]) => pregs.map((q, i) => (aciertos[i] ? q.r : (q.r + 1) % 4));
const corregir = (m: Modulo, aciertos: boolean[]) => {
  const pregs = armarTest(m);
  return corregirTest(pregs, responderCon(pregs, aciertos));
};

describe('Test de módulo', () => {
  it('3 preguntas, una de cada dificultad en orden', () => expect(armarTest(suelo).map((q) => q.d)).toEqual([1, 2, 3]));

  it('Las preguntas salen del módulo', () => {
    const m = moduloPorId('vpd')!;
    const textos = preguntasDe(m).map((q) => q.p);
    armarTest(m).forEach((q) => {
      expect(q.mod).toBe('vpd');
      expect(textos).toContain(q.p);
    });
  });

  it('Cada pregunta trae 4 opciones', () => armarTest(moduloPorId('luz')!).forEach((q) => expect(q.o).toHaveLength(4)));

  it('La correcta es la opción "ok" y están todas las opciones', () => {
    MODULOS.forEach((m) =>
      preguntasDe(m).forEach((orig) => {
        const q = armarPregunta(orig, m.id);
        expect(q.o[q.r]).toBe(orig.ok);
        expect([...q.o].sort()).toEqual([orig.ok, ...orig.no].sort());
      }),
    );
  });

  it('La posición de la correcta cambia en cada aparición', () => {
    const q = suelo.quiz[0]!;
    const pos = [0, 0, 0, 0];
    for (let k = 0; k < 800; k++) pos[armarPregunta(q, 'suelo').r]!++;
    pos.forEach((n) => {
      expect(n).toBeGreaterThan(120);
      expect(n).toBeLessThan(280);
    });
  });

  it('Evita las preguntas del intento anterior cuando hay otras', () => {
    for (let k = 0; k < 50; k++) {
      const a = armarTest(suelo);
      const b = armarTest(suelo, a.map((q) => q.p));
      expect(b[1]!.p).not.toBe(a[1]!.p);
      expect(b[2]!.p).not.toBe(a[2]!.p);
    }
  });

  it('La básica se repite si es la única de dificultad 1', () => {
    const a = armarTest(suelo);
    expect(armarTest(suelo, a.map((q) => q.p))[0]!.p).toBe(a[0]!.p);
  });

  it('Cada acierto suma 10 × dificultad', () => expect(corregir(suelo, [false, false, true])).toMatchObject({ aciertos: 1, puntos: 30, bonus: 0, total: 30 }));
  it('Test perfecto: 60 + 15 = 75 pts', () => expect(corregir(suelo, [true, true, true])).toMatchObject({ puntos: 60, bonus: 15, total: 75 }));
  it('Máximo por módulo: 75 pts', () => expect(MAX_PTS_MODULO).toBe(75));
  it('Aprueba con 2 de 3', () => expect(corregir(suelo, [true, true, false])).toMatchObject({ aprobado: true, total: 30 }));
  it('No aprueba con 1 de 3', () => expect(corregir(suelo, [true, false, false]).aprobado).toBe(false));

  it('Mensajes del resultado', () => {
    expect(mensajeResultado(corregir(suelo, [true, true, true]))).toBe('perfecto');
    expect(mensajeResultado(corregir(suelo, [true, true, false]))).toBe('aprobado');
    expect(mensajeResultado(corregir(suelo, [true, false, false]))).toBe('unAcierto');
    expect(mensajeResultado(corregir(suelo, [false, false, false]))).toBe('ninguno');
  });

  it('Estrellas', () => expect([estrellas(0), estrellas(2), estrellas(3), estrellas(5)]).toEqual(['☆☆☆', '★★☆', '★★★', '★★★']));

  describe('mejor marca (capa de datos)', () => {
    beforeEach(async () => {
      const db = abrirBaseDePrueba();
      await migrar(db);
      await inicializarDatos(db);
      await useDatos.getState().cargar(db);
    });

    it('Solo cuenta la mejor marca', async () => {
      await useDatos.getState().terminarTest('suelo', corregir(suelo, [true, true, true]));
      const r = await useDatos.getState().terminarTest('suelo', corregir(suelo, [false, false, true]));
      expect(r).toEqual({ gan: 0, mejor: 75 });
      expect(useDatos.getState().progreso.suelo).toEqual({ mejorAciertos: 3, mejorPuntos: 75 });
    });

    it('Mejorar la marca suma solo la diferencia', async () => {
      await useDatos.getState().terminarTest('suelo', corregir(suelo, [false, false, true]));
      expect(await useDatos.getState().terminarTest('suelo', corregir(suelo, [true, true, true]))).toEqual({ gan: 45, mejor: 75 });
    });

    it('Mejor marca de aciertos y de puntos se guardan por separado', async () => {
      await useDatos.getState().terminarTest('suelo', corregir(suelo, [false, true, true]));
      await useDatos.getState().terminarTest('suelo', corregir(suelo, [true, true, false]));
      expect(useDatos.getState().progreso.suelo).toEqual({ mejorAciertos: 2, mejorPuntos: 50 });
    });

    it('Terminar un test cuenta para la racha y registra modulo_test_fin', async () => {
      const eventos: string[] = [];
      const quitar = escucharEventos((e) => eventos.push(e));
      await useDatos.getState().terminarTest('suelo', corregir(suelo, [true, true, false]));
      quitar();
      expect(useDatos.getState().estudio).toHaveLength(1);
      expect(eventos).toEqual(['modulo_test_fin']);
    });
  });
});

describe('Agente por reglas', () => {
  const contexto = (o: Partial<Parameters<typeof responder>[1]> = {}): Parameters<typeof responder>[1] => ({
    plan: 'gratis',
    lluviaManana: 0,
    cultivos: [
      { nombre: 'Albahaca 1', etapa: 'Crecimiento', ubicacion: 'interior', ultimaNota: 'Riego ligero; tierra seca a 3 cm' },
      { nombre: 'Tomates del patio', etapa: 'Floración', ubicacion: 'exterior', ultimaNota: 'Quité brotes laterales' },
    ],
    totalConsejos: 7,
    ...o,
  });

  it('Dosis, consumo o venta: se niega', () => {
    ['¿Qué dosis uso?', 'consumo', 'quiero vender', 'la venta'].forEach((q) => expect(responder(q, contexto()).clave).toBe('negativa'));
  });
  it('"ventana" no activa la regla de venta', () => expect(responder('abrí la ventana', contexto()).clave).not.toBe('negativa'));
  it('"perfecto" no activa la regla de EC', () => expect(responder('quedó perfecto', contexto()).clave).toBe('masDatos'));
  it('Hojas amarillas: regla de hojas amarillas', () => expect(responder('Hojas amarillas', contexto()).clave).toBe('amarillas'));
  it('Plagas: regla de plagas', () => expect(responder('tengo pulgones', contexto()).clave).toBe('plagas'));
  it('Gratis no usa el historial del cultivo', () => {
    const r = responder('riego', contexto());
    expect(r.cultivos).toBeUndefined();
    expect(r.ultimo).toBeUndefined();
  });
  it('Pro usa el historial del cultivo', () => {
    expect(responder('riego', contexto({ plan: 'pro' }))).toMatchObject({
      cultivos: 2,
      ultimo: { nombre: 'Albahaca 1', etapa: 'Crecimiento', nota: 'Riego ligero; tierra seca a 3 cm' },
    });
  });
  it('Con lluvia prevista avisa del drenaje', () => {
    expect(responder('riego', contexto({ lluviaManana: 70 })).lluvia).toBe(true);
    expect(responder('riego', contexto({ lluviaManana: 70, cultivos: [] })).lluvia).toBe(false);
  });
  it('Sin coincidencias pide más datos con el consejo del día', () => {
    expect(responder('hola', contexto({ ahora: new Date(2026, 10, 23) }))).toMatchObject({ clave: 'masDatos', consejo: 23 % 7 });
  });
  it('Siete preguntas rápidas', () => expect(PREGUNTAS_RAPIDAS).toHaveLength(7));
  it('Cada pregunta rápida tiene su regla', () => {
    expect(PREGUNTAS_RAPIDAS.map((p) => responder(p, contexto()).clave)).toEqual([
      'amarillas', 'plagas', 'nutrientes', 'inerte', 'hidro', 'huerta', 'luz',
    ]);
  });
  it('Palabras cortas solo completas', () => {
    expect(coincide('medí el ec ayer', 'ec')).toBe(true);
    expect(coincide('perfecto', 'ec')).toBe(false);
    expect(coincide('la ventana', 'venta')).toBe(false);
  });
});
