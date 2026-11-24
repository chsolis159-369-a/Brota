#!/usr/bin/env node
/*
 * Pruebas del prototipo BROTA v9 (reference/brota-v9-prototipo.html).
 *
 * Reconstruidas a partir del prototipo: el archivo original de 147 comprobaciones no existe.
 * Cada prueba carga el prototipo REAL en un contexto aislado de Node (vm) con un DOM mínimo,
 * un localStorage en memoria y un reloj controlable, y verifica su comportamiento usando
 * sus propias funciones y acciones (act), como lo haría un usuario.
 *
 * Secciones: contenido y constantes, niveles, tareas, ledger, racha, logros, módulos, test de módulo,
 * exámenes (habilitación, intentos, sorteo, puntaje, flujo, recarga), constancia, plan, agente,
 * mediciones, borrado y onboarding.
 *
 * "Discrepancias": reglas de la especificación que el prototipo NO cumple. Se informan aparte y no
 * hacen fallar la corrida. En la app (src/reglas) tienen que cumplirse. Ver DECISIONS.md.
 *
 * Uso: node reference/pruebas-prototipo-v9.js   (sale con código 1 si alguna comprobación falla)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(__dirname, 'brota-v9-prototipo.html'), 'utf8');
const CODIGO = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('const MODULOS'));
if (!CODIGO) throw new Error('No encontré el script del prototipo');

const BASE = new Date(2026, 10, 23, 10, 0, 0).getTime(); // 23/11/2026 10:00, hora local
const DIA = 86400000;
const MIN = 60000;

/* ---------- Arnés ---------- */
const reloj = t => `var __reloj = { t: ${t} };
(function () {
  var D = Date;
  function F(...a) { if (!new.target) return D(); return a.length ? new D(...a) : new D(__reloj.t); }
  F.now = function () { return __reloj.t; }; F.parse = D.parse; F.UTC = D.UTC; F.prototype = D.prototype;
  Date = F;
})();
`;
const LETS = ['progreso', 'tareasPorDia', 'progresoPts', 'trial', 'ledger', 'estudio', 'examenes'];
const CONSTS = ['S', 'ETAPAS', 'PPFD', 'TIPOS_REG', 'CATS', 'MODULOS', 'GLOSARIO', 'TIPS', 'LOGROS', 'NIVELES', 'VERSION_APP',
  'VERSION_PRUEBA', 'CANNABIS_HABILITADO', 'PREGS_TEST', 'APROBAR_MODULO', 'BONUS_PERFECTO', 'TOPE_TAREAS_DIA', 'TOPE_REG_DIA',
  'TOPE_MED_DIA', 'INTENTOS_DIA', 'APROBAR_EXAMEN', 'MAESTRO_REQUIERE_EXAMEN', 'EXAMENES', 'LIMITE_GRATIS', 'N_GRATIS', 'PLANES',
  'modDe', 'puntosMod', 'maxPtsMod', 'puntosAprender', 'totalBitacora', 'totalCondiciones', 'ptsTareasDia', 'puntosActividad',
  'puntosExamenes', 'puntosTotales', 'examenFinalAprobado', 'nivelIdx', 'topeNivel', 'maestroPendiente', 'nivelActual',
  'siguienteNivel', 'esPro', 'visibles', 'modulosPlan', 'moduloAprobado', 'hoyLedger', 'ptsTareasHoy', 'exDe', 'modulosExamen',
  'poolExamen', 'cantPreguntas', 'tiempoLimite', 'intentosHoy', 'fmtTiempo', 'restoExamen', 'ACTS_EXAMEN', 'PLANTILLAS'];
const EXPORTAR = `\nglobalThis.__P = {
${LETS.map(k => `  get ${k}() { return ${k}; }, set ${k}(v) { ${k} = v; },`).join('\n')}
${CONSTS.map(k => `  ${k},`).join('\n')}
};\n`;

function cargar({ almacen = new Map(), t = BASE } = {}) {
  const app = { innerHTML: '' };
  const ctx = {
    console,
    setInterval: () => ({ unref() {} }),
    localStorage: {
      getItem: k => (almacen.has(k) ? almacen.get(k) : null),
      setItem: (k, v) => { almacen.set(k, String(v)); },
      removeItem: k => { almacen.delete(k); },
    },
    document: { getElementById: id => (id === 'app' ? app : null), addEventListener() {} },
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    window: { addEventListener() {} },
    FileReader: function () {},
  };
  vm.createContext(ctx);
  vm.runInContext(reloj(t) + CODIGO + EXPORTAR, ctx, { filename: 'brota-v9-prototipo.html' });
  const exp = ctx.__P;
  const P = new Proxy({}, {
    get: (_, k) => (k in exp ? exp[k] : ctx[k]),
    set: (_, k, v) => { if (k in exp) exp[k] = v; else ctx[k] = v; return true; },
  });
  const r = {
    get t() { return ctx.__reloj.t; },
    set t(v) { ctx.__reloj.t = v; },
    avanzar(ms) { ctx.__reloj.t += ms; },
  };
  return { P, almacen, app, reloj: r };
}

/* ---------- Ayudas ---------- */
const json = x => JSON.stringify(x);
function eq(a, b, msg) {
  if (!Object.is(a, b) && json(a) !== json(b)) throw new Error(`${msg ? msg + ': ' : ''}esperaba ${json(b)}, obtuve ${json(a)}`);
}
function ok(c, msg) { if (!c) throw new Error(msg || 'condición falsa'); }
function contiene(txt, sub, msg) { if (!String(txt).includes(sub)) throw new Error(`${msg ? msg + ': ' : ''}no contiene ${json(sub)}`); }
function noContiene(txt, sub, msg) { if (String(txt).includes(sub)) throw new Error(`${msg ? msg + ': ' : ''}contiene ${json(sub)}`); }

const visiblesDe = (P, cats) => P.MODULOS.filter(m => m.cat !== 'cannabis' && (!cats || cats.includes(m.cat)));
const sumarPuntos = (P, n) => { P.progresoPts['cann-legal'] = n; }; // módulo oculto: suma puntos sin aprobar nada visible
const aprobar = (P, ids, aciertos = 2) => ids.forEach(id => { P.progreso[id] = aciertos; });
const fin = P => { P.S.onboarded = true; };
function crearCultivo(P, nombre = 'Mi planta', ub = 'interior') {
  P.S.f.nombre = nombre; P.S.f.ub = ub;
  const antes = P.S.cultivos.length;
  P.act('crear');
  return P.S.cultivos.length > antes ? P.S.cultivos[0] : null;
}
function registrar(P, c, tipo = 'Riego', veces = 1) { P.act('abrir', c.id); for (let i = 0; i < veces; i++) P.act('quick', tipo); }
function medir(P, c, valores = { ppfd: '400' }, veces = 1) {
  P.act('abrir', c.id);
  for (let i = 0; i < veces; i++) { Object.assign(P.S.f, valores); P.act('condAdd'); }
}
function hacerTest(P, id, aciertos) {
  P.iniciarQuiz(id);
  const pregs = P.S.apr.pregs;
  pregs.forEach((q, i) => { P.act('resp', String(aciertos[i] ? q.r : (q.r + 1) % 4)); P.act('pregSig'); });
  return pregs;
}
function habilitar(P, id) {
  const ex = P.exDe(id);
  if (ex.pro) P.S.plan = 'pro';
  (ex.pre || []).forEach(p => { P.examenes[p] = { mejor: 0.9, aprobado: true, pts: 40, hist: [], dia: '', n: 0, fecha: '2026-11-20' }; });
  aprobar(P, P.modulosExamen(ex).map(m => m.id));
}
function empezar(P, id) { P.act('exInfo', id); P.act('exStart'); return P.S.ex; }
function responderExamen(P, elegir) {
  while (P.S.ex && P.S.ex.fase === 'curso') {
    const e = P.S.ex; const q = e.preguntas[e.i];
    P.act('exSel', String(elegir(q, e.i)));
    P.act('exOk');
  }
  return P.S.ex;
}
const bien = q => q.r;
const mal = q => (q.r + 1) % 4;
const contar = (arr, f) => arr.reduce((acc, x) => { const k = f(x); acc[k] = (acc[k] || 0) + 1; return acc; }, {});

/* ---------- Registro de pruebas ---------- */
const PRUEBAS = [];
let seccion = '';
const grupo = s => { seccion = s; };
const prueba = (nombre, fn) => PRUEBAS.push({ seccion, nombre, fn, tipo: 'prueba' });
const discrepancia = (nombre, fn) => PRUEBAS.push({ seccion: 'Discrepancias con la especificación', nombre, fn, tipo: 'discrepancia' });

/* =====================================================================
 * 1. Contenido y constantes
 * ===================================================================== */
grupo('Contenido y constantes');
prueba('PREGS_TEST = 3', () => eq(cargar().P.PREGS_TEST, 3));
prueba('APROBAR_MODULO = 2', () => eq(cargar().P.APROBAR_MODULO, 2));
prueba('BONUS_PERFECTO = 15', () => eq(cargar().P.BONUS_PERFECTO, 15));
prueba('TOPE_TAREAS_DIA = 40', () => eq(cargar().P.TOPE_TAREAS_DIA, 40));
prueba('TOPE_REG_DIA = 5', () => eq(cargar().P.TOPE_REG_DIA, 5));
prueba('TOPE_MED_DIA = 2', () => eq(cargar().P.TOPE_MED_DIA, 2));
prueba('INTENTOS_DIA = 3', () => eq(cargar().P.INTENTOS_DIA, 3));
prueba('APROBAR_EXAMEN = 0.8', () => eq(cargar().P.APROBAR_EXAMEN, 0.8));
prueba('Maestro requiere el Examen final', () => eq(cargar().P.MAESTRO_REQUIERE_EXAMEN, true));
prueba('Cannabis deshabilitado', () => eq(cargar().P.CANNABIS_HABILITADO, false));
prueba('Versión de prueba activa', () => eq(cargar().P.VERSION_PRUEBA, true));
prueba('Límite Gratis: 2 cultivos propios', () => eq(cargar().P.LIMITE_GRATIS, 2));
prueba('16 módulos con test sin pagar', () => eq(cargar().P.N_GRATIS, 16));
prueba('17 módulos visibles y 3 de cannabis', () => {
  const { P } = cargar();
  eq(visiblesDe(P).length, 17); eq(P.MODULOS.filter(m => m.cat === 'cannabis').length, 3);
});
prueba('128 preguntas en total', () => {
  const { P } = cargar();
  eq(P.MODULOS.reduce((s, m) => s + m.quiz.length + m.banco.length, 0), 128);
});
prueba('Cada módulo visible tiene 7 preguntas con las tres dificultades', () => {
  const { P } = cargar();
  visiblesDe(P).forEach(m => {
    const pool = [...m.quiz, ...m.banco];
    eq(pool.length, 7, m.id);
    [1, 2, 3].forEach(d => ok(pool.some(q => q.d === d), `${m.id} sin dificultad ${d}`));
  });
});
prueba('Diagnóstico es el único módulo visible Pro', () => {
  const { P } = cargar();
  eq(visiblesDe(P).filter(m => m.pro).map(m => m.id), ['diagnostico']);
});
prueba('content/modulos.json coincide con el prototipo', () => {
  const { P } = cargar();
  const c = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content', 'modulos.json'), 'utf8'));
  eq(json(c.modulos), json(P.MODULOS)); eq(json(c.glosario), json(P.GLOSARIO));
});
prueba('visibles() oculta cannabis', () => {
  const { P } = cargar();
  ok(P.visibles().every(m => m.cat !== 'cannabis'));
});
prueba('Aprender no muestra la categoría cannabis', () => {
  const { P } = cargar(); fin(P);
  noContiene(P.aprenderHTML(), 'Cannabis (Pro)');
});
prueba('Glosario con 31 términos', () => eq(cargar().P.GLOSARIO.length, 31));

/* =====================================================================
 * 2. Niveles
 * ===================================================================== */
grupo('Niveles');
prueba('Seis niveles con sus mínimos', () => {
  eq(cargar().P.NIVELES.map(n => [n.t, n.min]), [['Inexperto', 0], ['Aprendiz', 60], ['Aprendiz avanzado', 180], ['Cultivador', 350], ['Cultivador experto', 600], ['Maestro de cultivo', 900]]);
});
prueba('0 y 59 pts: Inexperto', () => { const { P } = cargar(); eq(P.nivelActual(0).t, 'Inexperto'); eq(P.nivelActual(59).t, 'Inexperto'); });
prueba('60 pts: Aprendiz', () => eq(cargar().P.nivelActual(60).t, 'Aprendiz'));
prueba('179 Aprendiz y 180 Aprendiz avanzado', () => { const { P } = cargar(); eq(P.nivelActual(179).t, 'Aprendiz'); eq(P.nivelActual(180).t, 'Aprendiz avanzado'); });
prueba('350 pts: Cultivador', () => eq(cargar().P.nivelActual(350).t, 'Cultivador'));
prueba('600 pts: Cultivador experto', () => eq(cargar().P.nivelActual(600).t, 'Cultivador experto'));
prueba('900 pts sin Examen final: Cultivador experto', () => eq(cargar().P.nivelActual(900).t, 'Cultivador experto'));
prueba('Maestro pendiente con 900 pts y sin final', () => { const { P } = cargar(); eq(P.maestroPendiente(900), true); eq(P.maestroPendiente(899), false); });
prueba('900 pts con final aprobado: Maestro de cultivo', () => {
  const { P } = cargar(); P.examenes.final = { aprobado: true, mejor: 0.9, pts: 0 };
  eq(P.nivelActual(900).t, 'Maestro de cultivo'); eq(P.maestroPendiente(900), false);
});
prueba('El final sin los puntos no da Maestro', () => {
  const { P } = cargar(); P.examenes.final = { aprobado: true, mejor: 0.9, pts: 0 };
  eq(P.nivelActual(600).t, 'Cultivador experto');
});
prueba('Aviso de Maestro pendiente en Aprender', () => {
  const { P } = cargar(); fin(P); sumarPuntos(P, 900);
  contiene(P.aprenderHTML(), 'Tenés los puntos para Maestro de cultivo. Para obtenerlo, aprobá el Examen final (Pro).');
});
prueba('Con 0 pts: "Te faltan 60 puntos para Aprendiz."', () => {
  const { P } = cargar(); fin(P); contiene(P.aprenderHTML(), 'Te faltan 60 puntos para Aprendiz.');
});
prueba('Con 600 pts avisa que Maestro exige el final', () => {
  const { P } = cargar(); fin(P); sumarPuntos(P, 600);
  contiene(P.aprenderHTML(), 'Te faltan 300 puntos para Maestro de cultivo y aprobar el Examen final (Pro).');
});
prueba('Con final y 900 pts: "Llegaste al nivel máximo."', () => {
  const { P } = cargar(); fin(P); sumarPuntos(P, 900); P.examenes.final = { aprobado: true, mejor: 0.9, pts: 0 };
  contiene(P.aprenderHTML(), 'Llegaste al nivel máximo.');
});
prueba('Puntos totales = aprender + actividad + exámenes', () => {
  const { P } = cargar();
  P.progresoPts.suelo = 75; P.tareasPorDia['2026-11-20'] = ['riego-1']; P.ledger.dias['2026-11-20'] = { r: 1, m: 1 };
  P.examenes.huerta = { aprobado: true, pts: 40, mejor: 0.9 };
  eq(P.puntosTotales(), 75 + 5 + 2 + 4 + 40);
});

/* =====================================================================
 * 3. Tareas diarias
 * ===================================================================== */
grupo('Tareas diarias');
prueba('Tareas fáciles (riego y observación): 5 pts', () => { const { P } = cargar(); eq(P.ptsTarea('riego-1'), 5); eq(P.ptsTarea('obs-1'), 5); });
prueba('Tarea media (medir luz): 10 pts', () => eq(cargar().P.ptsTarea('med-1'), 10));
prueba('Tarea difícil (drenaje ante lluvia): 15 pts', () => eq(cargar().P.ptsTarea('dren-1'), 15));
prueba('Etiquetas Fácil, Media y Difícil', () => {
  const { P } = cargar();
  eq([P.dificultadTarea('riego-1'), P.dificultadTarea('med-1'), P.dificultadTarea('dren-1')], ['Fácil', 'Media', 'Difícil']);
});
prueba('Tope de 40 pts de tareas por día', () => eq(cargar().P.ptsTareasDia(['dren-1', 'dren-2', 'dren-3']), 40));
prueba('El tope es por día, no total', () => {
  const { P } = cargar();
  P.tareasPorDia['2026-11-21'] = ['dren-1', 'dren-2', 'dren-3']; P.tareasPorDia['2026-11-22'] = ['dren-1', 'dren-2', 'dren-3'];
  eq(P.puntosActividad(), 80);
});
prueba('Interior: riego, observación y medición', () => {
  const { P } = cargar();
  eq(P.tareasHoy().filter(t => t.id.endsWith('-1')).map(t => t.id), ['riego-1', 'obs-1', 'med-1']);
});
prueba('Exterior con lluvia ≥ 60 %: drenaje', () => {
  const { P } = cargar(); P.S.clima.dias[0].lluvia = 60;
  ok(P.tareasHoy().some(t => t.id === 'dren-2'));
});
prueba('Exterior sin lluvia: sin drenaje', () => {
  const { P } = cargar(); P.S.clima.dias[0].lluvia = 59;
  ok(!P.tareasHoy().some(t => t.id.startsWith('dren-')));
});
prueba('Texto de la tarea de drenaje', () => {
  const { P } = cargar();
  eq(P.tareasHoy().find(t => t.id === 'dren-2').texto, 'Revisar el drenaje de Tomates del patio (mañana hay lluvia)');
});
prueba('Marcar y desmarcar una tarea', () => {
  const { P } = cargar(); P.act('tarea', 'riego-1');
  ok(P.tareasHoy().find(t => t.id === 'riego-1').hecha); eq(P.ptsTareasHoy(), 5);
  P.act('tarea', 'riego-1'); ok(!P.tareasHoy().find(t => t.id === 'riego-1').hecha); eq(P.ptsTareasHoy(), 0);
});
prueba('Hoy muestra el tope de tareas', () => {
  const { P } = cargar(); fin(P); P.act('tarea', 'riego-1');
  contiene(P.hoyHTML(), 'Tareas de hoy: 5 de 40 pts posibles por día. Registros, mediciones y estudio suman aparte.');
});
prueba('Las tareas de ayer no figuran hechas hoy', () => {
  const { P, reloj } = cargar(); P.act('tarea', 'riego-1'); reloj.avanzar(DIA);
  ok(P.tareasHoy().every(t => !t.hecha));
});
prueba('Sin cultivos: invita a crear el primero', () => {
  const { P } = cargar(); fin(P); P.S.cultivos = [];
  contiene(P.hoyHTML(), 'Todavía no tenés cultivos. Creá uno para recibir tareas diarias.');
});

/* =====================================================================
 * 4. Bitácora, mediciones y ledger
 * ===================================================================== */
grupo('Bitácora, mediciones y ledger');
prueba('Un registro suma 2 pts', () => {
  const { P } = cargar(); const c = crearCultivo(P); registrar(P, c); eq(P.puntosActividad(), 2);
});
prueba('Máximo 5 registros con puntos por día', () => {
  const { P } = cargar(); const c = crearCultivo(P); registrar(P, c, 'Riego', 7);
  eq(c.bitacora.length, 7); eq(P.totalBitacora(), 5); eq(P.puntosActividad(), 10);
});
prueba('Al día siguiente los registros vuelven a sumar', () => {
  const { P, reloj } = cargar(); const c = crearCultivo(P); registrar(P, c, 'Riego', 6); reloj.avanzar(DIA); registrar(P, c);
  eq(P.totalBitacora(), 6);
});
prueba('Registro rápido sin nota', () => {
  const { P } = cargar(); const c = crearCultivo(P); registrar(P, c, 'Poda');
  eq(c.bitacora[0].nota, 'Registro rápido: poda'); eq(c.bitacora[0].tipo, 'Poda');
});
prueba('Registro con nota', () => {
  const { P } = cargar(); const c = crearCultivo(P); P.act('abrir', c.id); P.S.f.nota = '  Hojas nuevas  '; P.act('quick', 'Observación');
  eq(c.bitacora[0].nota, 'Hojas nuevas'); eq(P.S.f.nota, '');
});
prueba('Fecha del registro con hora', () => {
  const { P } = cargar(); const c = crearCultivo(P); registrar(P, c);
  eq(c.bitacora[0].fecha, '2026-11-23 10:00');
});
prueba('Una medición suma 4 pts', () => {
  const { P } = cargar(); const c = crearCultivo(P); medir(P, c); eq(P.puntosActividad(), 4);
});
prueba('Máximo 2 mediciones con puntos por día', () => {
  const { P } = cargar(); const c = crearCultivo(P); medir(P, c, { ppfd: '400' }, 3);
  eq(c.condiciones.length, 3); eq(P.totalCondiciones(), 2); eq(P.puntosActividad(), 8);
});
prueba('Una medición sin valores no se guarda ni suma', () => {
  const { P } = cargar(); const c = crearCultivo(P); medir(P, c, { watts: '', altura: '', horas: '', ppfd: '', temp: '', humedad: '' });
  eq(c.condiciones.length, 0); eq(P.puntosActividad(), 0);
});
prueba('Una medición con un solo valor se guarda', () => {
  const { P } = cargar(); const c = crearCultivo(P); medir(P, c, { temp: '24' });
  eq(c.condiciones.length, 1); eq(c.condiciones[0].temp, 24); eq(c.condiciones[0].ppfd, null);
});
prueba('Guardar medición limpia PPFD y altura, conserva el resto', () => {
  const { P } = cargar(); const c = crearCultivo(P); medir(P, c, { watts: '100', altura: '30', ppfd: '400', temp: '24' });
  eq([P.S.f.ppfd, P.S.f.altura, P.S.f.watts, P.S.f.temp], ['', '', '100', '24']);
});
prueba('Crear un cultivo suma a cultivos creados', () => {
  const { P } = cargar(); crearCultivo(P); eq(P.ledger.creados, 1);
});
prueba('Borrar un cultivo no resta puntos', () => {
  const { P } = cargar(); const c = crearCultivo(P); registrar(P, c, 'Riego', 3); medir(P, c, { ppfd: '400' }, 2);
  eq(P.puntosActividad(), 14);
  P.act('confEliminar', c.id); P.act('eliminarOK', c.id);
  ok(!P.S.cultivos.some(x => x.id === c.id)); eq(P.puntosActividad(), 14);
});
prueba('Borrar un cultivo no resta cultivos creados', () => {
  const { P } = cargar(); const c = crearCultivo(P); P.act('eliminarOK', c.id); eq(P.ledger.creados, 1);
});
prueba('migrarLedger aplica los topes diarios', () => {
  const { P } = cargar();
  P.S.cultivos = [{ id: 'x', nombre: 'X', tipo: 'T', ubicacion: 'interior', etapa: 'Siembra', fecha: '2026-11-01',
    bitacora: Array.from({ length: 7 }, () => ({ fecha: '2026-11-10 08:00', tipo: 'Riego', nota: 'n' })),
    condiciones: Array.from({ length: 3 }, () => ({ fecha: '2026-11-10 09:00', ppfd: 300 })) }];
  eq(json(P.migrarLedger().dias['2026-11-10']), json({ r: 5, m: 2 }));
});
prueba('migrarLedger separa por día', () => {
  const { P } = cargar();
  P.S.cultivos = [{ id: 'x', nombre: 'X', tipo: 'T', ubicacion: 'interior', etapa: 'Siembra', fecha: '2026-11-01',
    bitacora: [{ fecha: '2026-11-10 08:00', tipo: 'Riego', nota: 'n' }, { fecha: '2026-11-11 08:00', tipo: 'Riego', nota: 'n' }], condiciones: [] }];
  const l = P.migrarLedger(); eq(l.dias['2026-11-10'].r, 1); eq(l.dias['2026-11-11'].r, 1);
});
prueba('migrarLedger ignora los cultivos de ejemplo', () => {
  const { P } = cargar(); const l = P.migrarLedger(); eq(json(l), json({ dias: {}, creados: 0 }));
});
prueba('migrarLedger cuenta los cultivos propios como creados', () => {
  const { P } = cargar();
  P.S.cultivos.push({ id: 'a', nombre: 'A', tipo: 'T', ubicacion: 'interior', etapa: 'Siembra', fecha: '2026-11-01', bitacora: [], condiciones: [] });
  eq(P.migrarLedger().creados, 1);
});
prueba('Sin ledger guardado se reconstruye al cargar', () => {
  const almacen = new Map();
  almacen.set('bv_cultivos', json([{ id: 'a', nombre: 'A', tipo: 'T', ubicacion: 'interior', etapa: 'Siembra', fecha: '2026-11-01',
    bitacora: Array.from({ length: 6 }, () => ({ fecha: '2026-11-05 08:00', tipo: 'Riego', nota: 'n' })), condiciones: [] }]));
  const { P } = cargar({ almacen }); eq(P.ledger.dias['2026-11-05'].r, 5); eq(P.puntosActividad(), 10);
});
prueba('Un ledger corrupto se reemplaza por la migración', () => {
  const almacen = new Map([['bv_ledger', json({ dias: 5 })]]);
  eq(json(cargar({ almacen }).P.ledger), json({ dias: {}, creados: 0 }));
});
prueba('Un ledger sin "creados" queda en 0', () => {
  const almacen = new Map([['bv_ledger', json({ dias: {} })]]);
  eq(cargar({ almacen }).P.ledger.creados, 0);
});
prueba('La bitácora de ejemplo no da puntos al empezar', () => {
  const { P } = cargar(); eq(P.totalBitacora(), 0); eq(P.puntosTotales(), 0);
});
prueba('Los cultivos de ejemplo no cuentan para el límite', () => {
  const { P } = cargar(); eq(P.S.cultivos.length, 2); eq(P.cultivosPropios(), 0);
});
prueba('El detalle muestra los topes de hoy', () => {
  const { P } = cargar(); const c = crearCultivo(P); registrar(P, c, 'Riego', 2);
  contiene(P.detalleHTML(c), 'Cada registro suma 2 pts (hoy 2 de 5). Cada medición de luz suma 4 pts (hoy 0 de 2).');
});

/* =====================================================================
 * 5. Racha
 * ===================================================================== */
grupo('Racha');
prueba('Sin actividad: racha 0', () => eq(cargar().P.racha(), 0));
prueba('Una tarea hoy: racha 1', () => { const { P } = cargar(); P.act('tarea', 'riego-1'); eq(P.racha(), 1); });
prueba('Actividad ayer y hoy: racha 2', () => {
  const { P } = cargar(); P.tareasPorDia['2026-11-22'] = ['riego-1']; P.act('tarea', 'riego-1'); eq(P.racha(), 2);
});
prueba('Solo ayer: la racha sigue en 1 (hoy todavía no la corta)', () => {
  const { P } = cargar(); P.tareasPorDia['2026-11-22'] = ['riego-1']; eq(P.racha(), 1);
});
prueba('Un día sin actividad corta la racha', () => {
  const { P } = cargar(); P.tareasPorDia['2026-11-21'] = ['riego-1']; P.act('tarea', 'riego-1'); eq(P.racha(), 1);
});
prueba('Un registro cuenta para la racha', () => { const { P } = cargar(); registrar(P, crearCultivo(P)); eq(P.racha(), 1); });
prueba('Una medición cuenta para la racha', () => { const { P } = cargar(); medir(P, crearCultivo(P)); eq(P.racha(), 1); });
prueba('Terminar un test de módulo cuenta para la racha', () => { const { P } = cargar(); hacerTest(P, 'suelo', [false, false, false]); eq(P.racha(), 1); });
prueba('Empezar un examen cuenta para la racha', () => { const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); eq(P.racha(), 1); });
prueba('Desmarcar la única tarea del día deja la racha en 0', () => {
  const { P } = cargar(); P.act('tarea', 'riego-1'); P.act('tarea', 'riego-1'); eq(P.racha(), 0);
});

/* =====================================================================
 * 6. Logros
 * ===================================================================== */
grupo('Logros');
const logros = P => Object.fromEntries(P.LOGROS.map(([id, , f]) => [id, f()]));
prueba('Ocho logros en orden', () => {
  eq(cargar().P.LOGROS.map(l => l[0]), ['primero', 'constante', 'led', 'cultivador', 'explorador', 'test', 'examen', 'maestro']);
});
prueba('Al empezar no hay logros (los ejemplos no dan logros)', () => ok(Object.values(logros(cargar().P)).every(v => !v)));
prueba('Primer registro', () => { const { P } = cargar(); registrar(P, crearCultivo(P)); ok(logros(P).primero); });
prueba('Primera medición de luz', () => { const { P } = cargar(); medir(P, crearCultivo(P)); ok(logros(P).led); });
prueba('Cultivador: 3 cultivos creados, aunque se borren', () => {
  const { P } = cargar(); P.S.plan = 'pro';
  const cs = [crearCultivo(P, 'A'), crearCultivo(P, 'B'), crearCultivo(P, 'C')];
  cs.forEach(c => P.act('eliminarOK', c.id)); ok(logros(P).cultivador);
});
prueba('Explorador: 3 módulos aprobados', () => {
  const { P } = cargar(); aprobar(P, ['suelo', 'germinacion']); ok(!logros(P).explorador); aprobar(P, ['luz']); ok(logros(P).explorador);
});
prueba('Test perfecto', () => { const { P } = cargar(); hacerTest(P, 'suelo', [true, true, true]); ok(logros(P).test); });
prueba('Primer examen aprobado y Examen final aprobado', () => {
  const { P } = cargar(); P.examenes.huerta = { aprobado: true, pts: 40 };
  ok(logros(P).examen); ok(!logros(P).maestro);
  P.examenes.final = { aprobado: true, pts: 0 }; ok(logros(P).maestro);
});
prueba('Constante: 3 días seguidos', () => {
  const { P } = cargar(); P.tareasPorDia['2026-11-21'] = ['a']; P.tareasPorDia['2026-11-22'] = ['a']; P.act('tarea', 'riego-1');
  ok(logros(P).constante);
});

/* =====================================================================
 * 7. Módulos: desbloqueo
 * ===================================================================== */
grupo('Módulos: desbloqueo');
prueba('Módulo con req 0 y sin prerrequisitos: disponible', () => eq(cargar().P.moduloDisponible(cargar().P.modDe('suelo')).ok, true));
prueba('Bloqueado por puntos, con motivo', () => {
  const { P } = cargar();
  eq(json(P.moduloDisponible(P.modDe('hidro-intro'))), json({ ok: false, motivo: 'Se desbloquea al llegar a Aprendiz (60 pts)' }));
});
prueba('Con 60 pts se desbloquea', () => { const { P } = cargar(); sumarPuntos(P, 60); ok(P.moduloDisponible(P.modDe('hidro-intro')).ok); });
prueba('Bloqueado por prerrequisito sin aprobar', () => {
  const { P } = cargar(); sumarPuntos(P, 60);
  eq(P.moduloDisponible(P.modDe('compost')).motivo, 'Primero aprobá: ' + P.modDe('suelo').t);
});
prueba('Prerrequisito aprobado con 2 de 3 desbloquea', () => {
  const { P } = cargar(); sumarPuntos(P, 60); aprobar(P, ['suelo']); ok(P.moduloDisponible(P.modDe('compost')).ok);
});
prueba('Con 1 acierto el prerrequisito no cuenta', () => {
  const { P } = cargar(); sumarPuntos(P, 60); aprobar(P, ['suelo'], 1); ok(!P.moduloDisponible(P.modDe('compost')).ok);
});
prueba('Diagnóstico en Gratis: "Disponible en el plan Pro"', () => {
  const { P } = cargar(); sumarPuntos(P, 900); aprobar(P, ['plagas', 'nutrientes']);
  eq(P.moduloDisponible(P.modDe('diagnostico')).motivo, 'Disponible en el plan Pro');
});
prueba('Diagnóstico en Pro exige 350 pts y sus prerrequisitos', () => {
  const { P } = cargar(); P.S.plan = 'pro';
  eq(P.moduloDisponible(P.modDe('diagnostico')).motivo, 'Se desbloquea al llegar a Cultivador (350 pts)');
  sumarPuntos(P, 350);
  eq(P.moduloDisponible(P.modDe('diagnostico')).motivo, 'Primero aprobá: ' + ['plagas', 'nutrientes'].map(id => P.modDe(id).t).join(', '));
  aprobar(P, ['plagas', 'nutrientes']); ok(P.moduloDisponible(P.modDe('diagnostico')).ok);
});
prueba('Cannabis: "Próximamente: sujeto a revisión legal"', () => {
  const { P } = cargar(); P.S.plan = 'pro';
  eq(P.moduloDisponible(P.modDe('cann-legal')).motivo, 'Próximamente: sujeto a revisión legal');
});
prueba('Un módulo bloqueado no se abre', () => {
  const { P } = cargar(); P.act('aprMod', 'hidro-intro'); eq(P.S.apr.vista, 'lista');
});
prueba('Las lecciones avanzan y la última abre el test', () => {
  const { P } = cargar(); P.act('aprMod', 'suelo'); eq(P.S.apr.vista, 'modulo');
  const n = P.modDe('suelo').lec.length;
  for (let i = 1; i < n; i++) { P.act('lecSig'); eq(P.S.apr.lec, i); }
  P.act('lecSig'); eq(P.S.apr.vista, 'quiz'); eq(P.S.apr.pregs.length, 3);
});
prueba('La última lección explica cómo se aprueba', () => {
  const { P } = cargar(); P.act('aprMod', 'rotacion'); P.act('lecSig');
  contiene(P.moduloHTML(), 'Para aprobar el módulo tenés que acertar 2 de 3. Podés repetir el test: las preguntas cambian.');
  contiene(P.moduloHTML(), 'Hacer el test (3 preguntas)');
});
prueba('Aprender marca los módulos bloqueados', () => {
  const { P } = cargar(); fin(P); contiene(P.aprenderHTML(), 'Se desbloquea al llegar a Aprendiz (60 pts)');
});
prueba('Gratis ve 16 módulos de su plan y Pro 17', () => {
  const { P } = cargar(); eq(P.modulosPlan().length, 16); P.S.plan = 'pro'; eq(P.modulosPlan().length, 17);
});

/* =====================================================================
 * 8. Test de módulo
 * ===================================================================== */
grupo('Test de módulo');
prueba('3 preguntas, una de cada dificultad en orden', () => {
  const { P } = cargar(); eq(P.armarTest(P.modDe('suelo')).map(q => q.d), [1, 2, 3]);
});
prueba('Las preguntas salen del módulo', () => {
  const { P } = cargar(); const m = P.modDe('vpd'); const textos = [...m.quiz, ...m.banco].map(q => q.p);
  P.armarTest(m).forEach(q => { eq(q.mod, 'vpd'); ok(textos.includes(q.p)); });
});
prueba('Cada pregunta trae 4 opciones', () => {
  const { P } = cargar(); P.armarTest(P.modDe('luz')).forEach(q => eq(q.o.length, 4));
});
prueba('La correcta es la opción "ok" y están todas las opciones', () => {
  const { P } = cargar();
  P.MODULOS.forEach(m => [...m.quiz, ...m.banco].forEach(orig => {
    const q = P.armarPregunta(orig);
    eq(q.o[q.r], orig.ok); eq([...q.o].sort(), [orig.ok, ...orig.no].sort());
  }));
});
prueba('La posición de la correcta cambia en cada aparición', () => {
  const { P } = cargar(); const q = P.modDe('suelo').quiz[0];
  const pos = contar(Array.from({ length: 800 }, () => P.armarPregunta(q).r), x => x);
  [0, 1, 2, 3].forEach(i => ok(pos[i] > 120 && pos[i] < 280, `posición ${i}: ${pos[i]} de 800`));
});
prueba('Evita las preguntas del intento anterior cuando hay otras', () => {
  const { P } = cargar(); const m = P.modDe('suelo');
  for (let k = 0; k < 50; k++) {
    const a = P.armarTest(m); const b = P.armarTest(m);
    ok(a[1].p !== b[1].p && a[2].p !== b[2].p, 'repitió una pregunta de dificultad 2 o 3');
  }
});
prueba('La básica se repite si es la única de dificultad 1', () => {
  const { P } = cargar(); const m = P.modDe('suelo');
  eq(P.armarTest(m)[0].p, P.armarTest(m)[0].p);
});
prueba('Cada acierto suma 10 × dificultad', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [false, false, true]); eq(P.S.apr.puntos, 30); eq(P.puntosMod('suelo'), 30);
});
prueba('Test perfecto: 60 + 15 = 75 pts', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [true, true, true]); eq(P.puntosMod('suelo'), 75); eq(P.S.apr.bonus, 15);
});
prueba('Máximo por módulo: 75 pts', () => eq(cargar().P.maxPtsMod(), 75));
prueba('Aprueba con 2 de 3', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [true, true, false]); ok(P.moduloAprobado(P.modDe('suelo'))); eq(P.puntosMod('suelo'), 30);
});
prueba('No aprueba con 1 de 3', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [true, false, false]); ok(!P.moduloAprobado(P.modDe('suelo')));
});
prueba('Solo cuenta la mejor marca', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [true, true, true]); hacerTest(P, 'suelo', [false, false, true]);
  eq(P.puntosMod('suelo'), 75); eq(P.S.apr.gan, 0); eq(P.progreso.suelo, 3);
});
prueba('Mejorar la marca suma solo la diferencia', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [false, false, true]); hacerTest(P, 'suelo', [true, true, true]);
  eq(P.S.apr.gan, 45); eq(P.puntosMod('suelo'), 75);
});
prueba('Mejor marca de aciertos y de puntos se guardan por separado', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [false, true, true]); hacerTest(P, 'suelo', [true, true, false]);
  eq(P.progreso.suelo, 2); eq(P.puntosMod('suelo'), 50);
});
prueba('Responder dos veces no cambia la respuesta', () => {
  const { P } = cargar(); P.iniciarQuiz('suelo'); const q = P.S.apr.pregs[0];
  P.act('resp', String(q.r)); P.act('resp', String((q.r + 1) % 4)); eq(P.S.apr.resp, q.r); eq(P.S.apr.aciertos, 1);
});
prueba('Sin responder no avanza', () => {
  const { P } = cargar(); P.iniciarQuiz('suelo'); P.act('pregSig'); eq(P.S.apr.q, 0);
});
prueba('Etiquetas de dificultad del test', () => {
  const { P } = cargar(); P.iniciarQuiz('suelo'); contiene(P.quizHTML(), 'Básica · 10 pts');
  const q = P.S.apr.pregs[0]; P.act('resp', String(q.r)); P.act('pregSig'); contiene(P.quizHTML(), 'Intermedia · 20 pts');
  const q2 = P.S.apr.pregs[1]; P.act('resp', String(q2.r)); P.act('pregSig'); contiene(P.quizHTML(), 'Trampa · 30 pts');
});
prueba('Correcto o "Casi." con la explicación', () => {
  const { P } = cargar(); P.iniciarQuiz('suelo'); const q = P.S.apr.pregs[0];
  P.act('resp', String((q.r + 1) % 4)); contiene(P.quizHTML(), '<strong>Casi.</strong>'); contiene(P.quizHTML(), q.e.slice(0, 20));
});
prueba('Resultado perfecto', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [true, true, true]); contiene(P.resultadoHTML(), 'Perfecto. Ganaste el bonus de 15 puntos.');
});
prueba('Resultado aprobado', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [true, true, false]); contiene(P.resultadoHTML(), 'Aprobaste. Repasá la pregunta que fallaste.');
});
prueba('Resultado 1 de 3', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [true, false, false]);
  contiene(P.resultadoHTML(), 'Todavía no aprobás: necesitás 2 de 3. Volvé a leer las lecciones.');
});
prueba('Resultado 0 de 3', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [false, false, false]);
  contiene(P.resultadoHTML(), 'No pasa nada. Necesitás 2 de 3 para aprobar: leé el módulo otra vez y probá de nuevo.');
});
prueba('El resultado aclara que solo cuenta la mejor marca', () => {
  const { P } = cargar(); hacerTest(P, 'suelo', [true, true, true]);
  contiene(P.resultadoHTML(), 'Solo cuenta tu mejor resultado en cada módulo: repetir el test sirve para aprender, no para sumar de más.');
});

/* =====================================================================
 * 9. Exámenes: configuración y habilitación
 * ===================================================================== */
grupo('Exámenes: configuración y habilitación');
prueba('Cuatro exámenes', () => eq(cargar().P.EXAMENES.map(e => e.id), ['huerta', 'hidro', 'luzplagas', 'final']));
prueba('Huerta: 12 preguntas, +40, categoría huerta', () => {
  const e = cargar().P.exDe('huerta'); eq([e.t, e.n, e.pts, e.cats], ['Examen de Huerta', 12, 40, ['huerta']]);
});
prueba('Hidroponía y nutrición: 15 preguntas, +40', () => {
  const e = cargar().P.exDe('hidro'); eq([e.t, e.n, e.pts, e.cats], ['Examen de Hidroponía y nutrición', 15, 40, ['nutricion', 'hidro', 'inerte']]);
});
prueba('Luz, ambiente y plagas: 15 preguntas, +40', () => {
  const e = cargar().P.exDe('luzplagas'); eq([e.t, e.n, e.pts, e.cats], ['Examen de Luz, ambiente y plagas', 15, 40, ['luz', 'plagas']]);
});
prueba('Final: 30 preguntas, 0 pts, Pro, exige los tres', () => {
  const e = cargar().P.exDe('final'); eq([e.t, e.n, e.pts, e.pro, e.cats, e.pre], ['Examen final BROTA', 30, 0, true, null, ['huerta', 'hidro', 'luzplagas']]);
});
prueba('Un minuto por pregunta', () => {
  const { P } = cargar(); P.S.plan = 'pro';
  P.EXAMENES.forEach(e => eq(P.tiempoLimite(e), e.n, e.id));
});
prueba('El final no incluye cannabis', () => {
  const { P } = cargar(); P.S.plan = 'pro'; ok(P.poolExamen(P.exDe('final')).every(q => P.modDe(q.mod).cat !== 'cannabis'));
  eq(P.poolExamen(P.exDe('final')).length, 119);
});
prueba('Pool de Huerta: 5 módulos, 35 preguntas', () => {
  const { P } = cargar(); eq(P.modulosExamen(P.exDe('huerta')).length, 5); eq(P.poolExamen(P.exDe('huerta')).length, 35);
});
prueba('Luz y plagas: Gratis sin diagnóstico, Pro con diagnóstico', () => {
  const { P } = cargar(); const ex = P.exDe('luzplagas');
  ok(!P.modulosExamen(ex).some(m => m.id === 'diagnostico')); P.S.plan = 'pro'; ok(P.modulosExamen(ex).some(m => m.id === 'diagnostico'));
});
prueba('Bloqueado si falta aprobar un módulo del bloque', () => {
  const { P } = cargar(); const d = P.examenDisponible(P.exDe('huerta'));
  eq(d.ok, false); ok(d.motivo.startsWith('Aprobá antes el test de: '));
});
prueba('Habilitado con todos los módulos del bloque aprobados', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); ok(P.examenDisponible(P.exDe('huerta')).ok);
});
prueba('En Pro, Luz y plagas exige también diagnóstico', () => {
  const { P } = cargar(); aprobar(P, visiblesDe(P, ['luz', 'plagas']).filter(m => !m.pro).map(m => m.id));
  ok(P.examenDisponible(P.exDe('luzplagas')).ok); P.S.plan = 'pro';
  eq(P.examenDisponible(P.exDe('luzplagas')).motivo, 'Aprobá antes el test de: ' + P.modDe('diagnostico').t);
});
prueba('Final en Gratis: "Disponible en el plan Pro"', () => {
  const { P } = cargar(); const d = P.examenDisponible(P.exDe('final')); eq([d.ok, d.pro, d.motivo], [false, true, 'Disponible en el plan Pro']);
});
prueba('Final en Pro sin los tres exámenes', () => {
  const { P } = cargar(); P.S.plan = 'pro'; aprobar(P, visiblesDe(P).map(m => m.id));
  eq(P.examenDisponible(P.exDe('final')).motivo, 'Primero aprobá: Examen de Huerta, Examen de Hidroponía y nutrición, Examen de Luz, ambiente y plagas');
});
prueba('Final habilitado en Pro con todo aprobado', () => {
  const { P } = cargar(); habilitar(P, 'final'); ok(P.examenDisponible(P.exDe('final')).ok);
});
prueba('Ficha del examen: preguntas al azar', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); P.act('exInfo', 'huerta');
  contiene(P.exInfoHTML(), '12 preguntas elegidas al azar entre 35: cada intento es distinto.');
});
prueba('Ficha del examen: tiempo, nota e intentos', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); P.act('exInfo', 'huerta'); const h = P.exInfoHTML();
  contiene(h, 'Tiempo: 12 minutos. Si se acaba, se corrige lo que respondiste.');
  contiene(h, 'Se aprueba con 80 % o más. Cada acierto suma según su dificultad, cada error resta un tercio de ese valor y "No lo sé" no suma ni resta.');
  contiene(h, 'No se puede volver atrás. Tenés 3 intentos por día (hoy llevás 0).');
  contiene(h, 'La primera vez que aprobás ganás +40 puntos.');
});
prueba('Ficha del final: habilita Maestro y constancia', () => {
  const { P } = cargar(); habilitar(P, 'final'); P.act('exInfo', 'final');
  contiene(P.exInfoHTML(), 'Al aprobar se habilita el nivel Maestro de cultivo y la constancia.');
});
prueba('Final bloqueado en Gratis ofrece "Ver planes"', () => {
  const { P } = cargar(); P.act('exInfo', 'final'); contiene(P.exInfoHTML(), 'data-v="plan">Ver planes');
});
prueba('Lista de exámenes explica la nota', () => {
  const { P } = cargar(); fin(P); P.act('aprSec', 'examenes');
  contiene(P.aprenderHTML(), 'Cada acierto suma según su dificultad, cada error resta un tercio y "No lo sé" no resta. Se aprueba con 80 %.');
});

/* =====================================================================
 * 10. Exámenes: intentos
 * ===================================================================== */
grupo('Exámenes: intentos');
prueba('El intento cuenta al empezar', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); eq(P.intentosHoy('huerta'), 1);
});
prueba('Tres intentos por día; el cuarto se bloquea', () => {
  const { P } = cargar(); habilitar(P, 'huerta');
  for (let i = 0; i < 3; i++) { ok(empezar(P, 'huerta'), `intento ${i + 1}`); P.act('exSalir'); P.act('exSalirOk'); }
  eq(P.intentosHoy('huerta'), 3); ok(!P.iniciarExamen('huerta'));
  eq(P.examenDisponible(P.exDe('huerta')).motivo, 'Ya hiciste 3 intentos hoy. Volvé mañana y repasá los módulos.');
});
prueba('Al día siguiente se reinician los intentos', () => {
  const { P, reloj } = cargar(); habilitar(P, 'huerta');
  for (let i = 0; i < 3; i++) { empezar(P, 'huerta'); P.act('exSalir'); P.act('exSalirOk'); }
  reloj.avanzar(DIA); eq(P.intentosHoy('huerta'), 0); ok(P.iniciarExamen('huerta')); eq(P.intentosHoy('huerta'), 1);
});
prueba('Los intentos son por examen', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); habilitar(P, 'hidro'); empezar(P, 'huerta');
  eq(P.intentosHoy('hidro'), 0);
});
prueba('Salir pierde el intento y no guarda resultado', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); P.act('exSalir');
  contiene(P.examenHTML(), 'Este intento ya cuenta entre tus 3 de hoy y no se guarda el resultado.');
  P.act('exSalirOk'); eq(P.S.ex, null); eq(P.intentosHoy('huerta'), 1); eq(P.examenes.huerta.hist.length, 0);
});
prueba('"Seguir con el examen" cancela la salida', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); P.act('exSalir'); P.act('exSalirNo');
  eq(P.S.ex.confirmaSalir, false); eq(P.S.ex.fase, 'curso');
});
prueba('No se puede empezar un examen con otro en curso', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); habilitar(P, 'hidro'); empezar(P, 'huerta');
  ok(!P.iniciarExamen('hidro')); eq(P.S.ex.id, 'huerta');
});

/* =====================================================================
 * 11. Exámenes: sorteo estratificado
 * ===================================================================== */
grupo('Exámenes: sorteo estratificado');
prueba('Huerta: 12 preguntas distintas', () => {
  const { P } = cargar(); const s = P.sortearExamen(P.exDe('huerta')); eq(s.length, 12); eq(new Set(s.map(q => q.p)).size, 12);
});
prueba('Huerta: 2 básicas, 5 intermedias y 5 trampa', () => {
  const { P } = cargar(); const c = contar(P.sortearExamen(P.exDe('huerta')), q => q.d); eq([c[1], c[2], c[3]], [2, 5, 5]);
});
prueba('Hidroponía y nutrición: 3, 6 y 6', () => {
  const { P } = cargar(); const c = contar(P.sortearExamen(P.exDe('hidro')), q => q.d); eq([c[1], c[2], c[3]], [3, 6, 6]);
});
prueba('Luz, ambiente y plagas: 3, 6 y 6', () => {
  const { P } = cargar(); const c = contar(P.sortearExamen(P.exDe('luzplagas')), q => q.d); eq([c[1], c[2], c[3]], [3, 6, 6]);
});
prueba('Final: 6, 12 y 12', () => {
  const { P } = cargar(); P.S.plan = 'pro'; const c = contar(P.sortearExamen(P.exDe('final')), q => q.d); eq([c[1], c[2], c[3]], [6, 12, 12]);
});
prueba('Reparto parejo entre módulos (diferencia máxima 1)', () => {
  const { P } = cargar(); P.S.plan = 'pro';
  ['huerta', 'hidro', 'luzplagas', 'final'].forEach(id => {
    for (let k = 0; k < 20; k++) {
      const ex = P.exDe(id); const c = contar(P.sortearExamen(ex), q => q.mod);
      const n = P.modulosExamen(ex).map(m => c[m.id] || 0);
      ok(Math.max(...n) - Math.min(...n) <= 1, `${id}: ${json(c)}`);
    }
  });
});
prueba('Las preguntas pertenecen al bloque', () => {
  const { P } = cargar(); const ids = P.modulosExamen(P.exDe('hidro')).map(m => m.id);
  ok(P.sortearExamen(P.exDe('hidro')).every(q => ids.includes(q.mod)));
});
prueba('Prioriza preguntas no vistas en el intento anterior', () => {
  const { P } = cargar(); const ex = P.exDe('huerta');
  for (let k = 0; k < 30; k++) {
    const a = P.sortearExamen(ex); P.S.vistasEx.huerta = a.map(q => q.p);
    const b = P.sortearExamen(ex); eq(b.filter(q => P.S.vistasEx.huerta.includes(q.p)).length, 0);
    P.S.vistasEx.huerta = [];
  }
});
prueba('Las opciones del examen se mezclan y la correcta es la "ok"', () => {
  const { P } = cargar();
  P.sortearExamen(P.exDe('huerta')).forEach(q => {
    const orig = [...P.modDe(q.mod).quiz, ...P.modDe(q.mod).banco].find(x => x.p === q.p);
    eq(q.o.length, 4); eq(q.o[q.r], orig.ok);
  });
});
prueba('Las preguntas guardan dificultad, módulo y explicación', () => {
  const { P } = cargar(); P.sortearExamen(P.exDe('huerta')).forEach(q => ok([1, 2, 3].includes(q.d) && q.mod && q.e));
});

/* =====================================================================
 * 12. Exámenes: puntaje
 * ===================================================================== */
grupo('Exámenes: puntaje');
const examenFalso = (ds, resp) => ({ preguntas: ds.map((d, i) => ({ d, r: 0, mod: i % 2 ? 'luz' : 'suelo' })), resp });
prueba('Acierto suma la dificultad', () => eq(cargar().P.puntuarExamen(examenFalso([3], [0])).pct, 1));
prueba('Error resta un tercio de la dificultad', () => {
  const r = cargar().P.puntuarExamen(examenFalso([3, 3], [0, 1])); eq(+r.pct.toFixed(4), +((3 - 1) / 6).toFixed(4));
});
prueba('"No lo sé" no suma ni resta', () => eq(cargar().P.puntuarExamen(examenFalso([2, 2], [0, -1])).pct, 0.5));
prueba('Sin responder no suma ni resta', () => eq(cargar().P.puntuarExamen(examenFalso([2, 2], [0])).pct, 0.5));
prueba('Porcentaje = max(0, neto) / suma de dificultades', () => {
  const r = cargar().P.puntuarExamen(examenFalso([1, 2, 3], [0, 0, 1])); eq(+r.pct.toFixed(6), +((1 + 2 - 1) / 6).toFixed(6));
});
prueba('Neto negativo da 0 %', () => eq(cargar().P.puntuarExamen(examenFalso([3, 3], [1, 1])).pct, 0));
prueba('Aprueba con 80 % exacto', () => {
  const r = cargar().P.puntuarExamen(examenFalso([1, 1, 1, 1, 1], [0, 0, 0, 0, -1])); eq(r.pct, 0.8); eq(r.aprobado, true);
});
prueba('No aprueba por debajo de 80 %', () => {
  const r = cargar().P.puntuarExamen(examenFalso([2, 2, 2, 2, 2, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, -1, -1, -1, -1]));
  eq(+r.pct.toFixed(4), +(11 / 15).toFixed(4)); eq(r.aprobado, false);
});
prueba('Los errores pueden hacer reprobar aunque los aciertos lleguen a 80 %', () => {
  const r = cargar().P.puntuarExamen(examenFalso(Array(10).fill(3), [0, 0, 0, 0, 0, 0, 0, 0, 1, 1]));
  eq(+r.pct.toFixed(4), +(22 / 30).toFixed(4)); eq(r.aprobado, false);
});
prueba('Cuenta aciertos, errores y sin responder', () => {
  const r = cargar().P.puntuarExamen(examenFalso([1, 1, 1, 1], [0, 1, -1])); eq([r.ac, r.er, r.nc], [1, 1, 2]);
});
prueba('Agrupa aciertos por módulo', () => {
  const r = cargar().P.puntuarExamen(examenFalso([1, 1, 1, 1], [0, 0, 1, 1]));
  eq(json(r.mods), json({ suelo: { ac: 1, n: 2 }, luz: { ac: 1, n: 2 } }));
});

/* =====================================================================
 * 13. Exámenes: flujo
 * ===================================================================== */
grupo('Exámenes: flujo');
prueba('Empezar abre el examen con vencimiento de n minutos', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); const e = empezar(P, 'huerta');
  eq([e.fase, e.i, e.preguntas.length, e.fin - e.inicio], ['curso', 0, 12, 12 * MIN]);
});
prueba('Durante el examen las otras pestañas quedan deshabilitadas', () => {
  const { P, app } = cargar(); fin(P); habilitar(P, 'huerta'); empezar(P, 'huerta'); P.draw();
  ['hoy', 'cultivos', 'agente', 'plan'].forEach(t => ok(new RegExp(`data-v="${t}"\\s+disabled`).test(app.innerHTML), t));
  ok(/data-v="aprender" aria-current="page"/.test(app.innerHTML));
});
prueba('Durante el examen se ignoran las acciones de otras pantallas', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); P.S.tab = 'aprender';
  P.act('tab', 'hoy'); P.act('tarea', 'riego-1'); eq(P.S.tab, 'aprender'); eq(P.ptsTareasHoy(), 0);
});
prueba('Solo hay acciones para avanzar: no se vuelve atrás', () => eq(cargar().P.ACTS_EXAMEN, ['exSel', 'exOk', 'exSalir', 'exSalirNo', 'exSalirOk']));
prueba('Confirmar sin elegir no avanza', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); P.act('exOk'); eq(P.S.ex.i, 0);
  contiene(P.examenHTML(), 'disabled');
});
prueba('Muestra "No lo sé (no suma ni resta)"', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); contiene(P.examenHTML(), 'No lo sé (no suma ni resta)');
});
prueba('Todo bien: 100 % y aprobado', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); const e = responderExamen(P, bien);
  eq([e.fase, e.res.pct, e.res.aprobado, e.porTiempo], ['resultado', 1, true, false]);
});
prueba('Aprobar por primera vez suma +40', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); const e = responderExamen(P, bien);
  eq(e.pts, 40); eq(P.puntosExamenes(), 40); eq(P.examenes.huerta.fecha, '2026-11-23');
  contiene(P.exResultadoHTML(), '+40 pts por aprobar por primera vez');
});
prueba('Aprobar de nuevo no suma más', () => {
  const { P } = cargar(); habilitar(P, 'huerta');
  empezar(P, 'huerta'); responderExamen(P, bien); P.act('exLista');
  empezar(P, 'huerta'); const e = responderExamen(P, bien); eq(e.pts, 0); eq(P.puntosExamenes(), 40);
});
prueba('Reprobar no suma puntos y guarda la mejor marca', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta');
  const e = responderExamen(P, (q, i) => (i < 6 ? q.r : -1));
  eq(e.res.aprobado, false); eq(P.puntosExamenes(), 0); eq(P.examenes.huerta.mejor, +e.res.pct.toFixed(3));
});
prueba('El historial guarda hasta 10 intentos', () => {
  const { P, reloj } = cargar(); habilitar(P, 'huerta');
  for (let i = 0; i < 12; i++) { if (i % 3 === 0 && i) reloj.avanzar(DIA); empezar(P, 'huerta'); responderExamen(P, () => -1); P.act('exLista'); }
  eq(P.examenes.huerta.hist.length, 10);
});
prueba('Al vencer el tiempo se corrige lo respondido', () => {
  const { P, reloj } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta');
  for (let i = 0; i < 3; i++) { P.act('exSel', String(P.S.ex.preguntas[P.S.ex.i].r)); P.act('exOk'); }
  reloj.avanzar(12 * MIN); P.exTick();
  eq([P.S.ex.fase, P.S.ex.porTiempo, P.S.ex.res.ac, P.S.ex.res.nc], ['resultado', true, 3, 9]);
  contiene(P.exResultadoHTML(), 'Se acabó el tiempo: se corrigió lo que alcanzaste a responder.');
});
prueba('Con tiempo restante el examen sigue', () => {
  const { P, reloj } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); reloj.avanzar(12 * MIN - 1000); P.exTick();
  eq(P.S.ex.fase, 'curso'); eq(P.restoExamen(), 1);
});
prueba('Una acción después del vencimiento termina el examen', () => {
  const { P, reloj } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); reloj.avanzar(13 * MIN);
  P.act('exSel', '0'); eq(P.S.ex.fase, 'resultado'); eq(P.S.ex.porTiempo, true);
});
prueba('Resultado: aciertos, errores y sin responder', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta');
  responderExamen(P, (q, i) => (i < 8 ? q.r : i < 10 ? (q.r + 1) % 4 : -1));
  contiene(P.exResultadoHTML(), '8 aciertos · 2 errores · 2 sin responder (de 12)'); contiene(P.exResultadoHTML(), 'Mínimo para aprobar: 80 %');
});
prueba('Módulos flojos (< 70 %) para repasar', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta');
  const e = responderExamen(P, q => (q.mod === 'suelo' ? (q.r + 1) % 4 : q.r));
  const h = P.exResultadoHTML(); contiene(h, '<h3>Para repasar</h3>'); contiene(h, 'data-act="exRepasar" data-v="suelo"');
  Object.keys(e.res.mods).filter(id => id !== 'suelo').forEach(id => noContiene(h, `data-act="exRepasar" data-v="${id}"`));
});
prueba('Repasar abre el módulo flojo', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); responderExamen(P, mal);
  P.act('exRepasar', 'suelo'); eq([P.S.ex, P.S.apr.vista, P.S.apr.mod], [null, 'modulo', 'suelo']);
});
prueba('Revisión: falladas con la correcta y la explicación', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); const e = responderExamen(P, (q, i) => (i === 0 ? (q.r + 1) % 4 : q.r));
  const q = e.preguntas[0]; const h = P.exResultadoHTML();
  contiene(h, 'Preguntas para repasar'); contiene(h, 'Correcta: '); eq((h.match(/class="rev /g) || []).length, 1);
  contiene(h, q.e.slice(0, 25).replace(/"/g, '&quot;'));
});
prueba('"Ver todas las preguntas" alterna la revisión completa', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); responderExamen(P, bien);
  contiene(P.exResultadoHTML(), 'No tuviste errores.'); P.act('exTodo');
  contiene(P.exResultadoHTML(), 'Todas las preguntas'); eq((P.exResultadoHTML().match(/class="rev /g) || []).length, 12);
  contiene(P.exResultadoHTML(), 'Ver solo las que fallé');
});
prueba('Sin respuesta figura como "Sin responder"', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); responderExamen(P, () => -1);
  contiene(P.exResultadoHTML(), 'Tu respuesta: Sin responder');
});
prueba('Temporizador en mm:ss', () => {
  const { P } = cargar(); eq([P.fmtTiempo(125), P.fmtTiempo(0), P.fmtTiempo(-3), P.fmtTiempo(59.2)], ['02:05', '00:00', '00:00', '01:00']);
});
prueba('El final aprobado da 0 pts y habilita Maestro', () => {
  const { P } = cargar(); habilitar(P, 'final'); sumarPuntos(P, 900);
  eq(P.nivelActual(P.puntosTotales()).t, 'Cultivador experto');
  empezar(P, 'final'); const e = responderExamen(P, bien);
  eq([e.preguntas.length, e.pts, P.examenFinalAprobado()], [30, 0, true]); eq(P.nivelActual(P.puntosTotales()).t, 'Maestro de cultivo');
  contiene(P.exResultadoHTML(), 'Habilitaste el nivel Maestro de cultivo (si ya tenés los puntos) y tu constancia.');
});
prueba('Al terminar un test se ofrece el examen habilitado', () => {
  const { P } = cargar(); aprobar(P, P.modulosExamen(P.exDe('huerta')).map(m => m.id).filter(id => id !== 'suelo'));
  hacerTest(P, 'suelo', [true, true, false]); contiene(P.resultadoHTML(), 'Ya podés rendir: Examen de Huerta');
});

/* =====================================================================
 * 14. Exámenes: recarga
 * ===================================================================== */
grupo('Exámenes: recarga');
function enCurso() {
  const a = cargar(); habilitar(a.P, 'huerta'); empezar(a.P, 'huerta');
  a.P.act('exSel', String(a.P.S.ex.preguntas[0].r)); a.P.act('exOk'); a.P.guardar();
  return a;
}
prueba('El examen en curso se retoma al recargar', () => {
  const a = enCurso(); const b = cargar({ almacen: a.almacen, t: a.reloj.t + MIN });
  eq([b.P.S.ex.fase, b.P.S.ex.i, b.P.S.ex.resp.length], ['curso', 1, 1]); eq(json(b.P.S.ex.preguntas), json(a.P.S.ex.preguntas));
});
prueba('Al recargar se mantiene el vencimiento original', () => {
  const a = enCurso(); const b = cargar({ almacen: a.almacen, t: a.reloj.t + 5 * MIN });
  eq(b.P.S.ex.fin, a.P.S.ex.fin); eq(b.P.restoExamen(), 7 * 60);
});
prueba('Al recargar con el tiempo vencido se corrige', () => {
  const a = enCurso(); const b = cargar({ almacen: a.almacen, t: a.reloj.t + 20 * MIN }); fin(b.P); b.P.draw();
  eq([b.P.S.ex.fase, b.P.S.ex.porTiempo, b.P.S.ex.res.ac], ['resultado', true, 1]);
});
prueba('Un examen guardado con preguntas inválidas se descarta', () => {
  const a = enCurso(); const ex = JSON.parse(a.almacen.get('bv_excurso')); ex.preguntas[0].o = ex.preguntas[0].o.slice(0, 3);
  a.almacen.set('bv_excurso', json(ex)); eq(cargar({ almacen: a.almacen }).P.S.ex, null);
});
prueba('Un examen guardado con un módulo inexistente se descarta', () => {
  const a = enCurso(); const ex = JSON.parse(a.almacen.get('bv_excurso')); ex.preguntas[0].mod = 'nada';
  a.almacen.set('bv_excurso', json(ex)); eq(cargar({ almacen: a.almacen }).P.S.ex, null);
});
prueba('Un examen guardado de un id desconocido se descarta', () => {
  const a = enCurso(); const ex = JSON.parse(a.almacen.get('bv_excurso')); ex.id = 'otro';
  a.almacen.set('bv_excurso', json(ex)); eq(cargar({ almacen: a.almacen }).P.S.ex, null);
});
prueba('El resultado del examen se conserva al recargar', () => {
  const a = cargar(); habilitar(a.P, 'huerta'); empezar(a.P, 'huerta'); responderExamen(a.P, bien); a.P.guardar();
  const b = cargar({ almacen: a.almacen }); eq([b.P.S.ex.fase, b.P.S.ex.res.pct], ['resultado', 1]);
});
prueba('Los intentos del día persisten al recargar', () => {
  const a = enCurso(); eq(cargar({ almacen: a.almacen }).P.intentosHoy('huerta'), 1);
});
prueba('Progreso, puntos, ledger y exámenes persisten', () => {
  const a = cargar(); const c = crearCultivo(a.P); registrar(a.P, c, 'Riego', 2); hacerTest(a.P, 'suelo', [true, true, true]);
  a.P.examenes.huerta = { mejor: 0.85, aprobado: true, pts: 40, hist: [], dia: '', n: 0 }; a.P.guardar();
  const b = cargar({ almacen: a.almacen });
  eq(json([b.P.progreso, b.P.progresoPts, b.P.ledger, b.P.examenes]), json([a.P.progreso, a.P.progresoPts, a.P.ledger, a.P.examenes]));
  eq(b.P.puntosTotales(), a.P.puntosTotales());
});
prueba('Las fotos no se guardan en el almacenamiento', () => {
  const a = cargar(); const c = crearCultivo(a.P); c.fotos = [{ src: 'data:image/png;base64,AAAA', fecha: '2026-11-23 10:00' }]; a.P.guardar();
  ok(JSON.parse(a.almacen.get('bv_cultivos')).every(x => x.fotos.length === 0));
});

/* =====================================================================
 * 15. Constancia
 * ===================================================================== */
grupo('Constancia');
const conFinal = P => { P.examenes.final = { mejor: 0.873, aprobado: true, pts: 0, fecha: '2026-11-23', hist: [], dia: '', n: 1 }; };
prueba('Sin el final aprobado no hay constancia', () => {
  const { P } = cargar(); P.act('constancia'); ok(P.S.apr.vista !== 'constancia');
});
prueba('Texto de la constancia', () => {
  const { P } = cargar(); conFinal(P); sumarPuntos(P, 900);
  eq(P.constanciaTexto(), ['BROTA · Constancia del Examen final', 'Nombre: (sin nombre)', 'Resultado: 87 % (mínimo 80 %)',
    'Fecha de aprobación: 2026-11-23', 'Nivel actual: Maestro de cultivo', '',
    'Aviso: es un reconocimiento interno de la app BROTA. No es un título oficial ni tiene validez académica o legal.'].join('\n'));
});
prueba('El nombre es opcional y se incluye si se escribe', () => {
  const { P } = cargar(); conFinal(P); P.S.f.nombreConst = '  Ana Pérez '; contiene(P.constanciaTexto(), 'Nombre: Ana Pérez\n');
});
prueba('Pantalla de constancia', () => {
  const { P } = cargar(); conFinal(P); P.act('constancia'); eq(P.S.apr.vista, 'constancia');
  const h = P.constanciaHTML(); contiene(h, 'Tu constancia'); contiene(h, 'Tu nombre (opcional)');
  contiene(h, 'Es un reconocimiento interno de BROTA: no tiene validez oficial.');
});

/* =====================================================================
 * 16. Plan y paywall
 * ===================================================================== */
grupo('Plan y paywall');
prueba('Gratis permite 2 cultivos propios', () => {
  const { P } = cargar(); ok(crearCultivo(P, 'A')); ok(crearCultivo(P, 'B')); eq(P.cultivosPropios(), 2);
});
prueba('El tercero se bloquea en Gratis', () => {
  const { P } = cargar(); fin(P); crearCultivo(P, 'A'); crearCultivo(P, 'B');
  eq(crearCultivo(P, 'C'), null); ok(P.limiteAlcanzado());
  contiene(P.cultivosHTML(), 'Llegaste al límite del plan Gratis'); contiene(P.cultivosHTML(), 'Incluye 2 cultivos propios. Pro es ilimitado.');
});
prueba('Pro no tiene límite de cultivos', () => {
  const { P } = cargar(); P.S.plan = 'pro'; for (let i = 0; i < 5; i++) ok(crearCultivo(P, 'C' + i)); eq(P.limiteAlcanzado(), false);
});
prueba('Un cultivo sin nombre no se crea', () => { const { P } = cargar(); eq(crearCultivo(P, '   '), null); });
prueba('Un cultivo sin tipo queda "Sin especificar"', () => { const { P } = cargar(); eq(crearCultivo(P).tipo, 'Sin especificar'); });
prueba('Exportar solo en Pro', () => {
  const { P } = cargar(); const c = P.S.cultivos[0]; eq(P.exportHTML(c), ''); P.S.plan = 'pro'; contiene(P.exportHTML(c), 'Generar texto de la bitácora');
});
prueba('Texto exportado de la bitácora', () => {
  const { P } = cargar(); const t = P.textoExport(P.S.cultivos[0]).split('\n');
  eq(t.slice(0, 5), ['BROTA · Albahaca 1 (Albahaca, interior)', 'Etapa actual: Crecimiento · Desde: 2026-09-20', '', 'BITÁCORA', '2026-11-03 09:10 | Riego | Riego ligero; tierra seca a 3 cm']);
  eq(t[7], '2026-11-03 20:00 | PPFD 420 | Altura 35 cm | Temp 24 °C | HR 60 %');
});
prueba('Planes visibles: Gratis y Pro (Business oculto)', () => {
  const { P } = cargar(); const h = P.planHTML(); contiene(h, '<strong>Gratis</strong>'); contiene(h, '<strong>Pro</strong>'); noContiene(h, 'Business');
});
prueba('Precios', () => {
  const { P } = cargar(); eq(P.PLANES.gratis.precio, 'US$ 0'); eq(P.PLANES.pro.precio, 'US$ 5.99 / mes · o US$ 49.99 / año (ahorrás cerca de 30 %)');
});
prueba('Lo que incluye Gratis', () => {
  eq(cargar().P.PLANES.gratis.items, ['Hasta 2 cultivos propios', 'Bitácora y registro rápido', 'Tareas diarias, logros y racha',
    '16 módulos con test: huerta, nutrición, hidroponía, sustrato inerte, luz y plagas', '3 exámenes con nota y repaso de errores', 'Agente con consejos generales']);
});
prueba('Lo que incluye Pro', () => {
  eq(cargar().P.PLANES.pro.items, ['Todo lo de Gratis, con cultivos ilimitados', 'Módulo de diagnóstico avanzado de plagas y carencias',
    'Examen final con constancia y nivel Maestro de cultivo', 'Exportar la bitácora como texto para copiar', 'Agente que usa el historial de cada cultivo']);
});
prueba('Botones Pro mensual y anual', () => {
  const h = cargar().P.planHTML(); contiene(h, 'Elegir Pro mensual · US$ 5.99'); contiene(h, 'Elegir Pro anual · US$ 49.99');
});
prueba('Elegir Pro anual', () => {
  const { P } = cargar(); P.act('setPlan', 'pro-anual'); eq([P.S.plan, P.S.ciclo], ['pro', 'anual']);
});
prueba('Prueba de 14 días (local en el prototipo)', () => {
  const { P, reloj } = cargar(); fin(P); P.act('trial'); eq(P.S.plan, 'pro'); eq(P.trial.fin, '2026-12-07');
  reloj.avanzar(14 * DIA); P.draw(); eq(P.S.plan, 'pro'); reloj.avanzar(DIA); P.draw(); eq(P.S.plan, 'gratis');
});
prueba('Encabezado: "Plan gratis · Prueba"', () => {
  const { P, app } = cargar(); fin(P); P.draw(); contiene(app.innerHTML, 'Plan gratis · <span class="tag">Prueba</span>');
});

/* =====================================================================
 * 17. Agente por reglas
 * ===================================================================== */
grupo('Agente por reglas');
const NEGATIVA = 'Solo puedo orientarte sobre cultivo. No doy información sobre dosis, consumo ni venta.';
prueba('Dosis, consumo o venta: se niega', () => {
  const { P } = cargar(); ['¿Qué dosis uso?', 'consumo', 'quiero vender', 'la venta'].forEach(q => ok(P.responder(q).startsWith(NEGATIVA), q));
});
prueba('"ventana" no activa la regla de venta', () => ok(!cargar().P.responder('abrí la ventana').startsWith(NEGATIVA)));
prueba('"perfecto" no activa la regla de EC', () => ok(cargar().P.responder('quedó perfecto').startsWith('Contame un poco más')));
prueba('Hojas amarillas: sugiere un especialista', () => contiene(cargar().P.responder('Hojas amarillas'), 'consultá a un especialista'));
prueba('Plagas: sugiere un especialista si avanza', () => contiene(cargar().P.responder('tengo pulgones'), 'un especialista puede recomendarte'));
prueba('Gratis no usa el historial del cultivo', () => noContiene(cargar().P.responder('riego'), 'tu último registro fue'));
prueba('Pro usa el historial del cultivo', () => {
  const { P } = cargar(); P.S.plan = 'pro'; const r = P.responder('riego');
  contiene(r, '(Plan Pro: tengo en cuenta tus 2 cultivo(s).)'); contiene(r, 'En Albahaca 1 (Crecimiento), tu último registro fue: "Riego ligero; tierra seca a 3 cm".');
});
prueba('Con lluvia prevista avisa del drenaje', () => contiene(cargar().P.responder('riego'), 'Hay lluvia prevista para mañana: revisá el drenaje de tus plantas de exterior.'));
prueba('Sin coincidencias pide más datos', () => ok(cargar().P.responder('hola').startsWith('Contame un poco más: qué tipo de planta es, en qué etapa está y qué observás.')));
prueba('Siete preguntas rápidas', () => {
  const h = cargar().P.agenteHTML();
  ['Hojas amarillas', 'Plagas', 'Nutrientes', 'Sustrato inerte', 'Hidroponía y pH', 'Huerta y compost', 'Luz LED'].forEach(p => contiene(h, `data-v="${p}"`));
});
prueba('Sin análisis de fotos en la versión de prueba', () => noContiene(cargar().P.agenteHTML(), 'Analizar una foto'));

/* =====================================================================
 * 18. Mediciones: VPD y PPFD
 * ===================================================================== */
grupo('Mediciones: VPD y PPFD');
prueba('VPD a 25 °C y 60 %: 1,27 kPa', () => eq(cargar().P.vpd(25, 60), 1.27));
prueba('VPD sin datos: null', () => { const { P } = cargar(); eq(P.vpd(null, 60), null); eq(P.vpd(25, null), null); });
prueba('PPFD bajo para la etapa', () => {
  eq(cargar().P.evaluarPPFD('Crecimiento', 200).m, 'Poca luz para crecimiento (recomendado 300–600). Acercá la lámpara o subí la potencia.');
});
prueba('PPFD alto para la etapa', () => {
  eq(cargar().P.evaluarPPFD('Siembra', 400).m, 'Demasiada luz para siembra (recomendado 150–300). Alejá la lámpara para evitar estrés lumínico.');
});
prueba('PPFD en rango', () => eq(cargar().P.evaluarPPFD('Floración', 700).m, 'Intensidad dentro del rango recomendado (500–900).'));
prueba('Cosecha no tiene rango de PPFD', () => eq(cargar().P.evaluarPPFD('Cosecha', 700), null));
prueba('Lámpara a menos de 20 cm: alerta', () => {
  const { P } = cargar(); eq(P.evaluarAltura(19).ok, false); eq(P.evaluarAltura(20).ok, true);
});
prueba('Salud del cultivo: alerta por luz fuera de rango (interior)', () => {
  const { P } = cargar(); const c = crearCultivo(P); medir(P, c, { ppfd: '900' });
  eq(P.saludCultivo(c).texto, 'Revisá la luz: hay una medición fuera de rango');
});
prueba('Salud del cultivo: aviso sin registros hace 3 días', () => {
  const { P, reloj } = cargar(); const c = crearCultivo(P); registrar(P, c); reloj.avanzar(3 * DIA);
  eq(P.saludCultivo(c).texto, 'Sin registros hace 3 días');
});

/* =====================================================================
 * 19. Borrado de cuenta
 * ===================================================================== */
grupo('Borrado de cuenta');
prueba('Pide confirmación con el texto del prototipo', () => {
  const { P } = cargar(); P.act('borrar');
  contiene(P.planHTML(), 'Se eliminan cultivos, bitácora, progreso, exámenes y tareas de este dispositivo. No se puede deshacer.');
});
prueba('Cancelar no borra', () => {
  const { P } = cargar(); P.act('borrar'); P.act('borrarNo'); eq(P.S.cultivos.length, 2);
});
prueba('Borra cultivos, progreso, ledger, exámenes y tareas', () => {
  const { P } = cargar(); P.S.plan = 'pro'; const c = crearCultivo(P); registrar(P, c); P.act('tarea', 'riego-1');
  hacerTest(P, 'suelo', [true, true, true]); P.examenes.huerta = { aprobado: true, pts: 40 };
  P.act('borrar'); P.act('borrarOK');
  eq(json([P.S.cultivos, P.S.plan, P.progreso, P.progresoPts, P.tareasPorDia, P.ledger, P.estudio, P.examenes]),
    json([[], 'gratis', {}, {}, {}, { dias: {}, creados: 0 }, {}, {}]));
  eq(P.puntosTotales(), 0);
});
prueba('Borra un examen en curso', () => {
  const { P } = cargar(); habilitar(P, 'huerta'); empezar(P, 'huerta'); P.act('exSalir'); P.act('exSalirOk');
  P.act('borrar'); P.act('borrarOK'); eq(P.S.ex, null);
});

/* =====================================================================
 * 20. Onboarding y recomendación
 * ===================================================================== */
grupo('Onboarding y recomendación');
prueba('Cuatro pasos; el último pide la forma de cultivar', () => {
  const { P } = cargar(); contiene(P.onboardingHTML(), 'Bienvenido a BROTA');
  P.act('next'); P.act('next'); P.act('next'); contiene(P.onboardingHTML(), '¿Qué cultivás?'); contiene(P.onboardingHTML(), 'Interior con LED');
  contiene(P.onboardingHTML(), '>Empezar<');
});
prueba('"Empezar" termina el onboarding', () => {
  const { P } = cargar(); for (let i = 0; i < 4; i++) P.act('next'); eq(P.S.onboarded, true);
});
prueba('El perfil se guarda', () => {
  const { P, almacen } = cargar(); P.act('perfil', 'hidro'); eq(almacen.get('bv_perfil'), '"hidro"');
});
prueba('Recomienda un módulo de su forma de cultivar y otro libre', () => {
  const { P } = cargar(); P.S.perfil = 'hidro'; const h = P.recomendacionHTML();
  contiene(h, 'Recomendado para tu forma de cultivar'); contiene(h, 'Se desbloquea al llegar a Aprendiz (60 pts). Sumá puntos con tareas, registros y otros módulos.');
  contiene(h, 'Mientras tanto, para sumar puntos');
});

/* =====================================================================
 * Discrepancias: la especificación dice "Los cultivos de ejemplo no dan puntos ni logros".
 * En el prototipo, registrar o medir en un cultivo de ejemplo sí suma al ledger.
 * ===================================================================== */
discrepancia('Un registro en un cultivo de ejemplo no suma puntos', () => {
  const { P } = cargar(); registrar(P, P.S.cultivos[0]); eq(P.puntosActividad(), 0);
});
discrepancia('Una medición en un cultivo de ejemplo no suma puntos', () => {
  const { P } = cargar(); medir(P, P.S.cultivos[0]); eq(P.puntosActividad(), 0);
});
discrepancia('Un registro en un cultivo de ejemplo no da el logro "Primer registro"', () => {
  const { P } = cargar(); registrar(P, P.S.cultivos[0]); eq(logros(P).primero, false);
});

/* ---------- Ejecución ---------- */
function correr() {
  let fallas = 0; let actual = '';
  const confirmadas = []; const resueltas = [];
  for (const p of PRUEBAS) {
    let error = null;
    try { p.fn(); } catch (e) { error = e; }
    if (p.tipo === 'discrepancia') { (error ? confirmadas : resueltas).push(p.nombre); continue; }
    if (p.seccion !== actual) { actual = p.seccion; console.log(`\n${actual}`); }
    if (error) { fallas++; console.log(`  ✗ ${p.nombre}\n      ${error.message}`); } else console.log(`  ✓ ${p.nombre}`);
  }
  const total = PRUEBAS.filter(p => p.tipo === 'prueba').length;
  console.log(`\nDiscrepancias con la especificación (no hacen fallar la corrida):`);
  confirmadas.forEach(n => console.log(`  ! el prototipo no cumple: ${n}`));
  resueltas.forEach(n => console.log(`  ? ya no hay discrepancia: ${n}`));
  console.log(`\n${total - fallas} de ${total} comprobaciones OK${fallas ? ` · ${fallas} con error` : ''}.`);
  process.exit(fallas ? 1 : 0);
}

if (require.main === module) correr();
module.exports = { cargar, PRUEBAS };
