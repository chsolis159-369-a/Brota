/** Reconocimiento con fotos y preguntas en el chat del Agente (D-31): ronda de preguntas y resumen para el historial. */
import { preguntasDeLaRonda, resumenReconocimiento } from '@/reglas/reconocimiento';
import type { Reconocimiento } from '@/servicios/agenteIA';

const reco = (pregunta: boolean): Reconocimiento => ({
  candidatos: [{ nombre: 'Oídio', cientifico: 'Erysiphales', tipo: 'hongo', confianza: 0.62 }],
  certeza: 'media',
  pregunta: pregunta ? { texto: '¿Arriba o abajo de la hoja?', opciones: ['Arriba', 'Abajo'] } : null,
  pedirFoto: null,
  derivar: false,
});

describe('ronda de preguntas', () => {
  it('cuenta solo las preguntas desde la última foto', () => {
    expect(
      preguntasDeLaRonda([
        { de: 'agente', t: 'Hola' },
        { de: 'agente', t: 'a', reco: reco(true) },
        { de: 'vos', t: '', foto: 'file:///hoja.jpg' },
        { de: 'agente', t: 'b', reco: reco(true) },
        { de: 'vos', t: 'Arriba' },
        { de: 'agente', t: 'c', reco: reco(false) },
      ]),
    ).toBe(1);
  });

  it('sin fotos cuenta todo el chat y no pasa del máximo', () => {
    expect(preguntasDeLaRonda([])).toBe(0);
    expect(preguntasDeLaRonda(Array.from({ length: 9 }, () => ({ de: 'agente' as const, t: 'x', reco: reco(true) })))).toBe(5);
  });
});

describe('resumen para el historial', () => {
  it('lleva candidatos, pregunta, opciones y foto pedida', () => {
    expect(resumenReconocimiento(reco(true))).toBe('(Candidatos: Oídio 62 %. Pregunta: ¿Arriba o abajo de la hoja? Opciones: Arriba / Abajo.)');
    expect(resumenReconocimiento({ ...reco(false), pedirFoto: 'el envés de la hoja' })).toBe('(Candidatos: Oídio 62 %. Foto pedida: el envés de la hoja.)');
  });

  it('sin nada para resumir, vacío', () => {
    expect(resumenReconocimiento({ candidatos: [], certeza: null, pregunta: null, pedirFoto: null, derivar: true })).toBe('');
  });
});
