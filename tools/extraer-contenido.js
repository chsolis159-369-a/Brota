#!/usr/bin/env node
/*
 * Extrae el contenido educativo (MODULOS y GLOSARIO) del prototipo v9 a content/modulos.json.
 *
 * En el prototipo ambos bloques son JSON puro, así que se leen con JSON.parse, sin evaluar código.
 * Fidelidad: el script vuelve a serializar lo extraído con el mismo formato del prototipo
 * (JSON.stringify con indentación de 1 espacio) y exige que coincida byte a byte con el texto original.
 * Si no coincide, falla y no escribe nada.
 *
 * Uso: node tools/extraer-contenido.js [--check]
 *   --check  no escribe; verifica que content/modulos.json siga igual al prototipo.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PROTOTIPO = path.join(RAIZ, 'reference', 'brota-v9-prototipo.html');
const DESTINO = path.join(RAIZ, 'content', 'modulos.json');

function bloque(html, nombre) {
  const inicio = html.indexOf(`const ${nombre} = `);
  if (inicio < 0) throw new Error(`No encontré "const ${nombre} = " en el prototipo`);
  const desde = inicio + `const ${nombre} = `.length;
  const fin = html.indexOf('\n];', desde);
  if (fin < 0) throw new Error(`No encontré el cierre de ${nombre}`);
  const texto = html.slice(desde, fin + 2); // incluye "\n]"
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch (e) {
    throw new Error(`${nombre} no es JSON válido: ${e.message}`);
  }
  const reserializado = JSON.stringify(datos, null, 1);
  if (reserializado !== texto) {
    throw new Error(`${nombre}: la reserialización no coincide byte a byte con el prototipo; la extracción no sería fiel`);
  }
  return datos;
}

function versionApp(html) {
  const m = html.match(/const VERSION_APP = '([^']+)'/);
  if (!m) throw new Error('No encontré VERSION_APP en el prototipo');
  return m[1];
}

function extraer() {
  const html = fs.readFileSync(PROTOTIPO, 'utf8');
  return {
    fuente: 'reference/brota-v9-prototipo.html',
    version: versionApp(html),
    modulos: bloque(html, 'MODULOS'),
    glosario: bloque(html, 'GLOSARIO'),
  };
}

function main() {
  const contenido = extraer();
  const salida = JSON.stringify(contenido, null, 1) + '\n';
  if (process.argv.includes('--check')) {
    const actual = fs.existsSync(DESTINO) ? fs.readFileSync(DESTINO, 'utf8') : '';
    if (actual !== salida) {
      console.error('content/modulos.json difiere del prototipo. Corré: node tools/extraer-contenido.js');
      process.exit(1);
    }
    console.log('content/modulos.json coincide con el prototipo.');
    return;
  }
  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(DESTINO, salida, 'utf8');
  const preguntas = contenido.modulos.reduce((s, m) => s + m.quiz.length + (m.banco || []).length, 0);
  console.log(`Escrito ${path.relative(RAIZ, DESTINO)}: ${contenido.modulos.length} módulos, ${preguntas} preguntas, ${contenido.glosario.length} términos (versión ${contenido.version}).`);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('ERROR: ' + e.message);
    process.exit(1);
  }
}

module.exports = { extraer };
