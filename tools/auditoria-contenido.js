#!/usr/bin/env node
/*
 * Auditoría de content/modulos.json. Corre como `npm run lint:contenido` y sale con código 1 si hay errores.
 *
 * Verifica:
 *  - Cantidades: 17 módulos visibles, 3 de cannabis y 128 preguntas.
 *  - Módulos: id único, categoría conocida, req >= 0, título, descripción y lecciones sin campos vacíos,
 *    prerrequisitos que existen y sin ciclos, 7 preguntas por módulo visible (3 de quiz + 4 de banco),
 *    quiz con una pregunta de cada dificultad.
 *  - Preguntas: dificultad 1 a 3, enunciado, una sola respuesta correcta (`ok`) y 3 incorrectas (`no`),
 *    4 opciones distintas, explicación, nunca "todas/ninguna de las anteriores", sin enunciados duplicados.
 *  - Glosario: pares [término, definición] sin vacíos ni términos repetidos.
 *  - Exámenes: cada bloque tiene preguntas suficientes para su sorteo.
 *
 * Uso: node tools/auditoria-contenido.js [ruta/a/modulos.json]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ESPERADO = { visibles: 17, cannabis: 3, preguntas: 128, preguntasPorModulo: 7, quiz: 3, banco: 4 };
const CATEGORIAS = ['huerta', 'nutricion', 'hidro', 'inerte', 'luz', 'plagas', 'cannabis'];
const EXAMENES = [
  { id: 'huerta', cats: ['huerta'], n: 12 },
  { id: 'hidro', cats: ['nutricion', 'hidro', 'inerte'], n: 15 },
  { id: 'luzplagas', cats: ['luz', 'plagas'], n: 15, soloGratis: true },
  { id: 'final', cats: null, n: 30 },
];
const PROHIBIDAS = /\b(todas|ninguna|todos|ninguno)\s+(de\s+)?(las|los)\s+anteriores\b/i;

const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
const textoOk = s => typeof s === 'string' && s.trim().length > 0;

function auditar(contenido) {
  const errores = [];
  const err = (donde, msg) => errores.push(`${donde}: ${msg}`);

  if (!contenido || typeof contenido !== 'object') {
    return { errores: ['raíz: el archivo no es un objeto JSON'], resumen: null };
  }
  const { modulos, glosario } = contenido;
  if (!Array.isArray(modulos)) err('raíz', 'falta el arreglo "modulos"');
  if (!Array.isArray(glosario)) err('raíz', 'falta el arreglo "glosario"');
  if (errores.length) return { errores, resumen: null };

  // ---------- Módulos ----------
  const ids = new Set();
  const enunciados = new Map();
  let totalPreguntas = 0;

  modulos.forEach((m, i) => {
    const dm = `módulo[${i}]${m && m.id ? ' ' + m.id : ''}`;
    if (!m || typeof m !== 'object') return err(dm, 'no es un objeto');
    if (!textoOk(m.id)) err(dm, 'id vacío');
    else if (ids.has(m.id)) err(dm, 'id duplicado');
    else ids.add(m.id);
    if (!CATEGORIAS.includes(m.cat)) err(dm, `categoría desconocida "${m.cat}"`);
    if (typeof m.req !== 'number' || !Number.isFinite(m.req) || m.req < 0) err(dm, 'req debe ser un número >= 0');
    if (!textoOk(m.t)) err(dm, 'título vacío');
    if (!textoOk(m.d)) err(dm, 'descripción vacía');
    if (m.pro !== undefined && typeof m.pro !== 'boolean') err(dm, 'pro debe ser booleano');
    if (m.aviso !== undefined && !textoOk(m.aviso)) err(dm, 'aviso vacío');
    if (m.pre !== undefined && (!Array.isArray(m.pre) || m.pre.some(p => !textoOk(p)))) err(dm, 'pre debe ser una lista de ids');

    if (!Array.isArray(m.lec) || m.lec.length === 0) err(dm, 'sin lecciones');
    else m.lec.forEach((l, k) => {
      if (!l || !textoOk(l.t)) err(`${dm} lección ${k + 1}`, 'título vacío');
      if (!l || !textoOk(l.x)) err(`${dm} lección ${k + 1}`, 'texto vacío');
    });

    const quiz = Array.isArray(m.quiz) ? m.quiz : (err(dm, 'falta "quiz"'), []);
    const banco = Array.isArray(m.banco) ? m.banco : (err(dm, 'falta "banco"'), []);
    const pool = [...quiz.map((q, k) => [q, `quiz ${k + 1}`]), ...banco.map((q, k) => [q, `banco ${k + 1}`])];
    totalPreguntas += pool.length;

    if (quiz.length !== ESPERADO.quiz) err(dm, `quiz debe tener ${ESPERADO.quiz} preguntas (tiene ${quiz.length})`);
    else if (quiz.map(q => q && q.d).sort().join() !== '1,2,3') err(dm, 'el quiz debe tener una pregunta de cada dificultad (1, 2 y 3)');

    if (m.cat !== 'cannabis') {
      if (banco.length !== ESPERADO.banco) err(dm, `banco debe tener ${ESPERADO.banco} preguntas (tiene ${banco.length})`);
      if (pool.length !== ESPERADO.preguntasPorModulo) err(dm, `debe tener ${ESPERADO.preguntasPorModulo} preguntas (tiene ${pool.length})`);
      [1, 2, 3].forEach(d => { if (!pool.some(([q]) => q && q.d === d)) err(dm, `sin preguntas de dificultad ${d} para el test`); });
    }

    pool.forEach(([q, dondeQ]) => {
      const dq = `${dm} ${dondeQ}`;
      if (!q || typeof q !== 'object') return err(dq, 'no es un objeto');
      if (!Number.isInteger(q.d) || q.d < 1 || q.d > 3) err(dq, `dificultad inválida (${q.d}); debe ser 1, 2 o 3`);
      if (!textoOk(q.p)) err(dq, 'enunciado vacío');
      if (!textoOk(q.e)) err(dq, 'sin explicación');
      if ('o' in q || 'r' in q) err(dq, 'usa el formato viejo (o/r); debe usar ok/no');
      if (!textoOk(q.ok)) err(dq, 'sin respuesta correcta (ok)');
      if (!Array.isArray(q.no) || q.no.length !== 3) err(dq, 'debe tener exactamente 3 opciones incorrectas (no)');
      else if (q.no.some(o => !textoOk(o))) err(dq, 'hay una opción incorrecta vacía');
      const opciones = [q.ok, ...(Array.isArray(q.no) ? q.no : [])].filter(textoOk);
      if (opciones.length === 4 && new Set(opciones.map(norm)).size !== 4) {
        err(dq, Array.isArray(q.no) && q.no.some(o => norm(o) === norm(q.ok))
          ? 'la respuesta correcta también figura como incorrecta (más de una correcta)'
          : 'las 4 opciones no son distintas');
      }
      if (opciones.some(o => PROHIBIDAS.test(o))) err(dq, 'usa "todas/ninguna de las anteriores"');
      if (textoOk(q.p)) {
        const k = norm(q.p);
        if (enunciados.has(k)) err(dq, `enunciado duplicado (igual que ${enunciados.get(k)})`);
        else enunciados.set(k, dq);
      }
    });
  });

  // Prerrequisitos: existen, no se apuntan a sí mismos y no hay ciclos.
  const porId = new Map(modulos.filter(m => m && m.id).map(m => [m.id, m]));
  modulos.forEach(m => (m && Array.isArray(m.pre) ? m.pre : []).forEach(p => {
    if (p === m.id) err(`módulo ${m.id}`, 'es prerrequisito de sí mismo');
    else if (!porId.has(p)) err(`módulo ${m.id}`, `prerrequisito inexistente "${p}"`);
  }));
  const estado = new Map();
  const visitar = (id, camino) => {
    if (estado.get(id) === 'listo') return;
    if (estado.get(id) === 'visitando') { err(`módulo ${id}`, `ciclo de prerrequisitos: ${[...camino, id].join(' → ')}`); return; }
    estado.set(id, 'visitando');
    ((porId.get(id) || {}).pre || []).filter(p => porId.has(p)).forEach(p => visitar(p, [...camino, id]));
    estado.set(id, 'listo');
  };
  porId.forEach((_, id) => visitar(id, []));

  // Cantidades globales.
  const visibles = modulos.filter(m => m && m.cat !== 'cannabis');
  const cannabis = modulos.filter(m => m && m.cat === 'cannabis');
  if (visibles.length !== ESPERADO.visibles) err('raíz', `debe haber ${ESPERADO.visibles} módulos visibles (hay ${visibles.length})`);
  if (cannabis.length !== ESPERADO.cannabis) err('raíz', `debe haber ${ESPERADO.cannabis} módulos de cannabis (hay ${cannabis.length})`);
  if (totalPreguntas !== ESPERADO.preguntas) err('raíz', `debe haber ${ESPERADO.preguntas} preguntas (hay ${totalPreguntas})`);

  // Exámenes: preguntas suficientes en cada bloque.
  EXAMENES.forEach(ex => {
    const mods = visibles.filter(m => (!ex.cats || ex.cats.includes(m.cat)) && !(ex.soloGratis && m.pro));
    const n = mods.reduce((s, m) => s + (m.quiz || []).length + (m.banco || []).length, 0);
    if (n < ex.n) err(`examen ${ex.id}`, `necesita ${ex.n} preguntas y el bloque tiene ${n}`);
  });

  // ---------- Glosario ----------
  const terminos = new Set();
  glosario.forEach((g, i) => {
    const dg = `glosario[${i}]`;
    if (!Array.isArray(g) || g.length !== 2) return err(dg, 'debe ser un par [término, definición]');
    if (!textoOk(g[0])) err(dg, 'término vacío');
    if (!textoOk(g[1])) err(`${dg} ${g[0]}`, 'definición vacía');
    if (textoOk(g[0])) {
      const k = norm(g[0]);
      if (terminos.has(k)) err(`${dg} ${g[0]}`, 'término duplicado');
      terminos.add(k);
    }
  });

  return {
    errores,
    resumen: { modulos: modulos.length, visibles: visibles.length, cannabis: cannabis.length, preguntas: totalPreguntas, glosario: glosario.length },
  };
}

function main() {
  const ruta = path.resolve(process.argv[2] || path.join(__dirname, '..', 'content', 'modulos.json'));
  let contenido;
  try {
    contenido = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (e) {
    console.error(`No pude leer ${ruta}: ${e.message}`);
    process.exit(1);
  }
  const { errores, resumen } = auditar(contenido);
  if (resumen) {
    console.log(`Contenido: ${resumen.visibles} módulos visibles + ${resumen.cannabis} de cannabis, ${resumen.preguntas} preguntas, ${resumen.glosario} términos de glosario.`);
  }
  if (errores.length) {
    console.error(`\n${errores.length} error(es):`);
    errores.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }
  console.log('Auditoría de contenido: OK');
}

if (require.main === module) main();

module.exports = { auditar };
