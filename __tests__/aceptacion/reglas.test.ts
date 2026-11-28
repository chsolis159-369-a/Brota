/**
 * Aceptación: comprobaciones de reference/pruebas-prototipo-v9.js portadas a src/reglas (mismos nombres).
 * Secciones de H2: constantes, niveles, tareas, racha, logros, desbloqueo, exámenes (habilitación) y mediciones.
 */
import { MODULOS, moduloPorId } from '@/contenido';
import { diasActivos, racha, tareasDelDia } from '@/reglas/actividad';
import { EXAMENES, examenDisponible, logros, moduloDisponible, modulosDelPlan, modulosExamen, recomendacion } from '@/reglas/aprendizaje';
import { diasDeCultivo, proximoPaso, saludCultivo } from '@/reglas/cultivos';
import * as D from '@/reglas/dominio';
import { evaluarAltura, evaluarPPFD, numero, vpd } from '@/reglas/mediciones';
import { NIVELES, maestroPendiente, nivelActual, progresoNivel } from '@/reglas/niveles';
import { dificultadTarea, ptsTarea, ptsTareasDia, puntosActividad, puntosTotales, type EstadoExamen, type ProgresoModulo } from '@/reglas/puntos';

const AHORA = new Date(2026, 10, 23, 10, 0, 0);
const titulo = (id: string) => moduloPorId(id)!.t;
const aprobados = (ids: string[], aciertos = 2): Record<string, ProgresoModulo> =>
  Object.fromEntries(ids.map((id) => [id, { mejorAciertos: aciertos, mejorPuntos: 50 }]));
const disp = (id: string, e: Partial<{ plan: D.Plan; puntos: number; progreso: Record<string, ProgresoModulo> }> = {}) =>
  moduloDisponible(moduloPorId(id) ?? MODULOS[0]!, { plan: 'gratis', puntos: 0, progreso: {}, cannabisHabilitado: false, ...e }, MODULOS);
const EJEMPLOS = [
  { id: '1', nombre: 'Albahaca 1', ubicacion: 'interior' as const },
  { id: '2', nombre: 'Tomates del patio', ubicacion: 'exterior' as const },
];

describe('Contenido y constantes', () => {
  it.each([
    ['PREGS_TEST = 3', D.PREGS_TEST, 3],
    ['APROBAR_MODULO = 2', D.APROBAR_MODULO, 2],
    ['BONUS_PERFECTO = 15', D.BONUS_PERFECTO, 15],
    ['TOPE_TAREAS_DIA = 40', D.TOPE_TAREAS_DIA, 40],
    ['TOPE_REG_DIA = 5', D.TOPE_REG_DIA, 5],
    ['TOPE_MED_DIA = 2', D.TOPE_MED_DIA, 2],
    ['INTENTOS_DIA = 3', D.INTENTOS_DIA, 3],
    ['APROBAR_EXAMEN = 0.8', D.APROBAR_EXAMEN, 0.8],
    ['Maestro requiere el Examen final', D.MAESTRO_REQUIERE_EXAMEN, true],
    ['Límite Gratis: 3 cultivos propios (D-34)', D.LIMITE_GRATIS, 3],
  ])('%s', (_n, valor, esperado) => expect(valor).toBe(esperado));

  it('16 módulos con test sin pagar', () => expect(modulosDelPlan(MODULOS, 'gratis')).toHaveLength(16));
  it('Máximo por módulo: 75 pts', () => expect(D.MAX_PTS_MODULO).toBe(75));
});

describe('Niveles', () => {
  it('Seis niveles con sus mínimos', () => {
    expect(NIVELES.map((n) => [n.t, n.min])).toEqual([
      ['Inexperto', 0], ['Aprendiz', 60], ['Aprendiz avanzado', 180], ['Cultivador', 350], ['Cultivador experto', 600], ['Maestro de cultivo', 900],
    ]);
  });
  it.each([
    [0, 'Inexperto'], [59, 'Inexperto'], [60, 'Aprendiz'], [179, 'Aprendiz'], [180, 'Aprendiz avanzado'],
    [350, 'Cultivador'], [600, 'Cultivador experto'], [900, 'Cultivador experto'],
  ])('%i pts sin final: %s', (pts, nivel) => expect(nivelActual(pts, false).t).toBe(nivel));
  it('Maestro pendiente con 900 pts y sin final', () => {
    expect(maestroPendiente(900, false)).toBe(true);
    expect(maestroPendiente(899, false)).toBe(false);
  });
  it('900 pts con final aprobado: Maestro de cultivo', () => {
    expect(nivelActual(900, true).t).toBe('Maestro de cultivo');
    expect(maestroPendiente(900, true)).toBe(false);
  });
  it('El final sin los puntos no da Maestro', () => expect(nivelActual(600, true).t).toBe('Cultivador experto'));
  it('Mensajes de la tarjeta de nivel', () => {
    expect(progresoNivel(0, false).mensaje).toEqual({ tipo: 'faltan', puntos: 60, nivel: 'Aprendiz', hastaMaestro: false });
    expect(progresoNivel(600, false).mensaje).toEqual({ tipo: 'faltan', puntos: 300, nivel: 'Maestro de cultivo', hastaMaestro: true });
    expect(progresoNivel(900, false).mensaje).toEqual({ tipo: 'pendiente' });
    expect(progresoNivel(900, true).mensaje).toEqual({ tipo: 'maximo' });
    expect(progresoNivel(120, false).pct).toBe(50);
  });
  it('Puntos totales = aprender + actividad + exámenes', () => {
    expect(
      puntosTotales({
        progreso: { suelo: { mejorAciertos: 3, mejorPuntos: 75 } },
        tareasPorDia: { '2026-11-20': ['riego-1'] },
        ledger: { dias: { '2026-11-20': { r: 1, m: 1 } }, creados: 0 },
        examenes: { suelo: { aprobado: true, pts: 40, mejor: 0.9 } },
      }),
    ).toBe(75 + 5 + 2 + 4 + 40);
  });
});

describe('Tareas diarias', () => {
  it('Tareas fáciles (riego y observación): 5 pts', () => expect([ptsTarea('riego-1'), ptsTarea('obs-1')]).toEqual([5, 5]));
  it('Tarea media (medir luz): 10 pts', () => expect(ptsTarea('med-1')).toBe(10));
  it('Tarea difícil (drenaje ante lluvia): 15 pts', () => expect(ptsTarea('dren-1')).toBe(15));
  it('Etiquetas Fácil, Media y Difícil', () =>
    expect([dificultadTarea('riego-1'), dificultadTarea('med-1'), dificultadTarea('dren-1')]).toEqual(['facil', 'media', 'dificil']));
  it('Tope de 40 pts de tareas por día', () => expect(ptsTareasDia(['dren-1', 'dren-2', 'dren-3'])).toBe(40));
  it('El tope es por día, no total', () => {
    const ids = ['dren-1', 'dren-2', 'dren-3'];
    expect(puntosActividad({ tareasPorDia: { a: ids, b: ids }, ledger: { dias: {}, creados: 0 } })).toBe(80);
  });
  it('Interior: riego, observación y medición', () => {
    expect(tareasDelDia(EJEMPLOS, 70, []).filter((t) => t.id.endsWith('-1')).map((t) => t.id)).toEqual(['riego-1', 'obs-1', 'med-1']);
  });
  it('Exterior con lluvia ≥ 60 %: drenaje', () => expect(tareasDelDia(EJEMPLOS, 60, []).some((t) => t.id === 'dren-2')).toBe(true));
  it('Exterior sin lluvia: sin drenaje', () => {
    expect(tareasDelDia(EJEMPLOS, 59, []).some((t) => t.tipo === 'dren')).toBe(false);
    expect(tareasDelDia(EJEMPLOS, null, []).some((t) => t.tipo === 'dren')).toBe(false);
  });
  it('Marca las hechas', () => {
    const t = tareasDelDia(EJEMPLOS, 0, ['obs-2']);
    expect(t.filter((x) => x.hecha).map((x) => x.id)).toEqual(['obs-2']);
  });
});

describe('Racha', () => {
  const vacio = { tareasPorDia: {}, estudio: [], ledger: { dias: {}, creados: 0 }, fechasPropias: [] };
  const r = (e: Partial<Parameters<typeof diasActivos>[0]>) => racha(diasActivos({ ...vacio, ...e }), AHORA);
  it('Sin actividad: racha 0', () => expect(r({})).toBe(0));
  it('Una tarea hoy: racha 1', () => expect(r({ tareasPorDia: { '2026-11-23': ['riego-1'] } })).toBe(1));
  it('Actividad ayer y hoy: racha 2', () => expect(r({ tareasPorDia: { '2026-11-22': ['a'], '2026-11-23': ['a'] } })).toBe(2));
  it('Solo ayer: la racha sigue en 1 (hoy todavía no la corta)', () => expect(r({ tareasPorDia: { '2026-11-22': ['a'] } })).toBe(1));
  it('Un día sin actividad corta la racha', () => expect(r({ tareasPorDia: { '2026-11-21': ['a'], '2026-11-23': ['a'] } })).toBe(1));
  it('Un registro o una medición con puntos cuentan', () => expect(r({ ledger: { dias: { '2026-11-23': { r: 0, m: 1 } }, creados: 0 } })).toBe(1));
  it('Estudio (tests y exámenes) cuenta', () => expect(r({ estudio: ['2026-11-23', '2026-11-22'] })).toBe(2));
  it('La bitácora de cultivos propios cuenta', () => expect(r({ fechasPropias: ['2026-11-23 08:00'] })).toBe(1));
  it('Desmarcar la única tarea del día deja la racha en 0', () => expect(r({ tareasPorDia: { '2026-11-23': [] } })).toBe(0));
  it('Cruza el cambio de mes', () => {
    expect(racha(new Set(['2026-11-30', '2026-12-01']), new Date(2026, 11, 1, 9))).toBe(2);
  });
});

describe('Logros', () => {
  const base = { totalRegistros: 0, totalMediciones: 0, racha: 0, creados: 0, progreso: {}, examenes: {} as Record<string, EstadoExamen> };
  it('Ocho logros en orden', () =>
    expect(Object.keys(logros(base))).toEqual(['primero', 'constante', 'led', 'cultivador', 'explorador', 'test', 'examen', 'maestro']));
  it('Al empezar no hay logros', () => expect(Object.values(logros(base)).some(Boolean)).toBe(false));
  it('Primer registro', () => expect(logros({ ...base, totalRegistros: 1 }).primero).toBe(true));
  it('Primera medición de luz', () => expect(logros({ ...base, totalMediciones: 1 }).led).toBe(true));
  it('Cultivador: 3 cultivos creados, aunque se borren', () => expect(logros({ ...base, creados: 3 }).cultivador).toBe(true));
  it('Explorador: 3 módulos aprobados', () => {
    expect(logros({ ...base, progreso: aprobados(['suelo', 'germinacion']) }).explorador).toBe(false);
    expect(logros({ ...base, progreso: aprobados(['suelo', 'germinacion', 'luz']) }).explorador).toBe(true);
  });
  it('Test perfecto', () => expect(logros({ ...base, progreso: aprobados(['suelo'], 3) }).test).toBe(true));
  it('Primer examen aprobado y Examen final aprobado', () => {
    const l1 = logros({ ...base, examenes: { suelo: { aprobado: true, pts: 40, mejor: 0.9 } } });
    expect([l1.examen, l1.maestro]).toEqual([true, false]);
    expect(logros({ ...base, examenes: { final: { aprobado: true, pts: 0, mejor: 0.9 } } }).maestro).toBe(true);
  });
  it('Constante: 3 días seguidos', () => expect(logros({ ...base, racha: 3 }).constante).toBe(true));
});

describe('Módulos: desbloqueo', () => {
  it('Módulo con req 0 y sin prerrequisitos: disponible', () => expect(disp('suelo').ok).toBe(true));
  it('Bloqueado por puntos, con motivo', () => expect(disp('hidro-intro')).toEqual({ ok: false, motivo: { tipo: 'puntos', req: 60 } }));
  it('Con 60 pts se desbloquea', () => expect(disp('hidro-intro', { puntos: 60 }).ok).toBe(true));
  it('Bloqueado por prerrequisito sin aprobar', () => expect(disp('compost', { puntos: 60 })).toEqual({ ok: false, motivo: { tipo: 'pre', ids: ['suelo'] } }));
  it('Prerrequisito aprobado con 2 de 3 desbloquea', () => expect(disp('compost', { puntos: 60, progreso: aprobados(['suelo']) }).ok).toBe(true));
  it('Con 1 acierto el prerrequisito no cuenta', () => expect(disp('compost', { puntos: 60, progreso: aprobados(['suelo'], 1) }).ok).toBe(false));
  it('Diagnóstico en Gratis: "Disponible en el plan Pro"', () =>
    expect(disp('diagnostico', { puntos: 900, progreso: aprobados(['plagas', 'nutrientes']) })).toEqual({ ok: false, motivo: { tipo: 'pro' } }));
  it('Diagnóstico en Pro exige 350 pts y sus prerrequisitos', () => {
    expect(disp('diagnostico', { plan: 'pro' })).toEqual({ ok: false, motivo: { tipo: 'puntos', req: 350 } });
    expect(disp('diagnostico', { plan: 'pro', puntos: 350 })).toEqual({ ok: false, motivo: { tipo: 'pre', ids: ['plagas', 'nutrientes'] } });
    expect(disp('diagnostico', { plan: 'pro', puntos: 350, progreso: aprobados(['plagas', 'nutrientes']) }).ok).toBe(true);
  });
  it('Gratis ve 16 módulos de su plan y Pro 17', () => {
    expect(modulosDelPlan(MODULOS, 'gratis')).toHaveLength(16);
    expect(modulosDelPlan(MODULOS, 'pro')).toHaveLength(17);
  });
});

describe('Exámenes: configuración y habilitación', () => {
  const ex = (id: string) => EXAMENES.find((x) => x.id === id)!;
  const e = (o: Partial<{ plan: D.Plan; progreso: Record<string, ProgresoModulo>; examenes: Record<string, EstadoExamen> }> = {}) => ({
    plan: 'gratis' as D.Plan, progreso: {}, examenes: {}, ...o,
  });
  const SEIS = ['suelo', 'siembra', 'hidro', 'inerte', 'luz', 'plagas'];
  it('Seis exámenes en Gratis y el final Pro (D-34)', () =>
    expect(EXAMENES.map((x) => [x.id, x.n, x.pts])).toEqual([
      ['suelo', 12, 40], ['siembra', 10, 40], ['hidro', 12, 40], ['inerte', 10, 40], ['luz', 12, 40], ['plagas', 10, 40], ['final', 30, 0],
    ]));
  it('Final: Pro, exige los seis y todo el temario', () => expect([ex('final').pro, ex('final').pre, ex('final').cats]).toEqual([true, SEIS, null]));
  it('Huerta se reparte en dos exámenes sin repetir módulos', () => {
    expect(modulosExamen(ex('suelo'), MODULOS, 'gratis').map((m) => m.id)).toEqual(['suelo', 'rotacion', 'compost']);
    expect(modulosExamen(ex('siembra'), MODULOS, 'gratis').map((m) => m.id)).toEqual(['germinacion', 'calendario']);
  });
  it('Entre los seis cubren los 16 módulos de Gratis, cada uno una vez', () => {
    const ids = SEIS.flatMap((id) => modulosExamen(ex(id), MODULOS, 'gratis').map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(modulosDelPlan(MODULOS, 'gratis').map((m) => m.id).sort());
  });
  it('Cada examen tiene en el banco más preguntas que las que sortea', () => {
    for (const x of EXAMENES.filter((y) => !y.pro)) {
      const banco = modulosExamen(x, MODULOS, 'gratis').reduce((s, m) => s + m.quiz.length + m.banco.length, 0);
      expect(banco).toBeGreaterThan(x.n);
    }
  });
  it('Bloqueado si falta aprobar un módulo del bloque', () => {
    const d = examenDisponible(ex('suelo'), e(), MODULOS, AHORA);
    expect(d.ok).toBe(false);
    expect(!d.ok && d.motivo.tipo).toBe('modulos');
  });
  it('Habilitado con todos los módulos del bloque aprobados', () => {
    const ids = modulosExamen(ex('suelo'), MODULOS, 'gratis').map((m) => m.id);
    expect(examenDisponible(ex('suelo'), e({ progreso: aprobados(ids) }), MODULOS, AHORA).ok).toBe(true);
  });
  it('En Pro, Plagas exige también diagnóstico', () => {
    const ids = modulosExamen(ex('plagas'), MODULOS, 'gratis').map((m) => m.id);
    expect(examenDisponible(ex('plagas'), e({ progreso: aprobados(ids) }), MODULOS, AHORA).ok).toBe(true);
    expect(examenDisponible(ex('plagas'), e({ plan: 'pro', progreso: aprobados(ids) }), MODULOS, AHORA)).toEqual({
      ok: false, motivo: { tipo: 'modulos', ids: ['diagnostico'] },
    });
  });
  it('Final en Gratis: "Disponible en el plan Pro"', () => expect(examenDisponible(ex('final'), e(), MODULOS, AHORA)).toEqual({ ok: false, motivo: { tipo: 'pro' } }));
  it('Final en Pro sin los seis exámenes', () => {
    const todos = aprobados(MODULOS.map((m) => m.id));
    expect(examenDisponible(ex('final'), e({ plan: 'pro', progreso: todos }), MODULOS, AHORA)).toEqual({
      ok: false, motivo: { tipo: 'preExamenes', ids: SEIS },
    });
  });
  it('Tres intentos por día; el cuarto se bloquea', () => {
    const ids = modulosExamen(ex('suelo'), MODULOS, 'gratis').map((m) => m.id);
    const estado = (n: number, dia = '2026-11-23') => e({ progreso: aprobados(ids), examenes: { suelo: { aprobado: false, mejor: 0, pts: 0, dia, n } } });
    expect(examenDisponible(ex('suelo'), estado(2), MODULOS, AHORA).ok).toBe(true);
    expect(examenDisponible(ex('suelo'), estado(3), MODULOS, AHORA)).toEqual({ ok: false, motivo: { tipo: 'agotado' } });
    expect(examenDisponible(ex('suelo'), estado(3, '2026-11-22'), MODULOS, AHORA).ok).toBe(true);
  });
});

describe('Onboarding y recomendación', () => {
  const e = { plan: 'gratis' as D.Plan, puntos: 0, progreso: {}, examenes: {}, cannabisHabilitado: false };
  it('Recomienda un módulo de su forma de cultivar y otro libre', () => {
    const r = recomendacion('hidro', e, MODULOS, AHORA);
    expect(r.propio?.modulo.id).toBe('hidro-intro');
    expect(r.propio?.disponible).toEqual({ ok: false, motivo: { tipo: 'puntos', req: 60 } });
    expect(r.otro?.titulo).toBe('mientrasTanto');
    expect(r.otro?.modulo.id).toBe('suelo');
    expect(r.examen).toBeNull();
  });
  it('Si el propio está libre no ofrece otro', () => {
    const r = recomendacion('huerta', e, MODULOS, AHORA);
    expect([r.propio?.modulo.id, r.propio?.disponible.ok, r.otro]).toEqual(['suelo', true, null]);
  });
  it('Sin perfil: "Siguiente módulo para aprobar"', () => {
    const r = recomendacion(null, e, MODULOS, AHORA);
    expect([r.propio, r.otro?.titulo, r.otro?.modulo.id]).toEqual([null, 'siguiente', 'suelo']);
  });
  it('Ofrece el examen habilitado', () => {
    const ids = modulosExamen(EXAMENES[0]!, MODULOS, 'gratis').map((m) => m.id);
    expect(recomendacion(null, { ...e, progreso: aprobados(ids) }, MODULOS, AHORA).examen?.id).toBe('suelo');
  });
  it('Interior con LED recomienda luz', () => expect(recomendacion('interior', e, MODULOS, AHORA).propio?.modulo.id).toBe('luz'));
  it('Títulos de los prerrequisitos para el motivo', () => expect(titulo('suelo')).toBe('Suelo, compost y acolchado'));
});

describe('Mediciones: VPD y PPFD', () => {
  it('VPD a 25 °C y 60 %: 1,27 kPa', () => expect(vpd(25, 60)).toBe(1.27));
  it('VPD sin datos: null', () => expect([vpd(null, 60), vpd(25, null)]).toEqual([null, null]));
  it('PPFD bajo para la etapa', () => expect(evaluarPPFD('Crecimiento', 200)).toEqual({ estado: 'poca', min: 300, max: 600 }));
  it('PPFD alto para la etapa', () => expect(evaluarPPFD('Siembra', 400)).toEqual({ estado: 'mucha', min: 150, max: 300 }));
  it('PPFD en rango', () => expect(evaluarPPFD('Floración', 700)).toEqual({ estado: 'ok', min: 500, max: 900 }));
  it('Cosecha no tiene rango de PPFD', () => expect(evaluarPPFD('Cosecha', 700)).toBeNull());
  it('Lámpara a menos de 20 cm: alerta', () => expect([evaluarAltura(19), evaluarAltura(20), evaluarAltura(null)]).toEqual([{ ok: false }, { ok: true }, null]));
  it('Números con punto o coma', () => expect([numero('24'), numero('24,5'), numero(' 3.5 '), numero(''), numero('abc')]).toEqual([24, 24.5, 3.5, null, null]));
  const c = (o: Partial<Parameters<typeof saludCultivo>[0]>) => ({ ubicacion: 'interior' as const, etapa: 'Crecimiento' as const, ultimaMedicion: null, bitacora: [], ...o });
  it('Salud del cultivo: alerta por luz fuera de rango (interior)', () =>
    expect(saludCultivo(c({ ultimaMedicion: { ppfd: 900, alturaCm: null } }), AHORA)).toEqual({ nivel: 'alerta', motivo: 'luz' }));
  it('Exterior no se alerta por la luz', () =>
    expect(saludCultivo(c({ ubicacion: 'exterior', ultimaMedicion: { ppfd: 900, alturaCm: 5 } }), AHORA).nivel).toBe('aviso'));
  it('Salud del cultivo: aviso sin registros hace 3 días', () =>
    expect(saludCultivo(c({ bitacora: [{ fecha: '2026-11-20 10:00', tipo: 'Riego' }] }), AHORA)).toEqual({ nivel: 'aviso', motivo: 'diasSinRegistro', dias: 3 }));
  it('Salud: sin registros y en orden', () => {
    expect(saludCultivo(c({}), AHORA)).toEqual({ nivel: 'aviso', motivo: 'sinRegistros' });
    expect(saludCultivo(c({ bitacora: [{ fecha: '2026-11-22 10:00', tipo: 'Poda' }] }), AHORA)).toEqual({ nivel: 'ok', motivo: 'enOrden' });
  });
  it('Próximo paso', () => {
    expect(proximoPaso(c({}), AHORA).tipo).toBe('primerRegistro');
    expect(proximoPaso(c({ bitacora: [{ fecha: '2026-11-22 10:00', tipo: 'Poda' }] }), AHORA).tipo).toBe('regar');
    expect(proximoPaso(c({ bitacora: [{ fecha: '2026-11-22 10:00', tipo: 'Riego' }] }), AHORA).tipo).toBe('alDia');
    expect(proximoPaso(c({ etapa: 'Cosecha', bitacora: [{ fecha: '2026-11-22 10:00', tipo: 'Riego' }] }), AHORA).tipo).toBe('cosecha');
    expect(proximoPaso(c({ ultimaMedicion: { ppfd: 10, alturaCm: null } }), AHORA).tipo).toBe('alerta');
  });
  it('Día de cultivo: el de siembra es el 1', () => expect([diasDeCultivo('2026-11-23', AHORA), diasDeCultivo('2026-11-01', AHORA), diasDeCultivo('2026-12-01', AHORA)]).toEqual([1, 23, 1]));
});
