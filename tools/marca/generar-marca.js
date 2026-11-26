#!/usr/bin/env node
/**
 * Marca de BROTA (D-28): una plántula de cannabis de costado saliendo de la tierra, con acabado realista,
 * inspirada en la foto de referencia del usuario. Un solo diseño genera todo:
 *  - assets/marca/*.svg          originales vectoriales (ícono y plántula sola)
 *  - assets/images/logo.png      logo de la app (encabezado, bienvenida y avatar del guía)
 *  - assets/images/*.png         ícono de la app, ícono adaptable de Android (fondo, frente y
 *                                monocromático) y la imagen de la pantalla de carga
 *
 * Uso: node tools/marca/generar-marca.js                  escribe todo
 *      node tools/marca/generar-marca.js --check          falla si los SVG generados quedaron desactualizados
 *      node tools/marca/generar-marca.js --vista <dir>    solo PNG de vista previa en otra carpeta
 */
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const { plantula, ubicar } = require('./geometria');
const { COLORES, LADO, svg } = require('./dibujo');

const RAIZ = path.join(__dirname, '..', '..');

/** Ícono completo (iOS, Android viejo y logo de la app): hojas desde y = 200 y tierra en y = 795. */
const SUELO_ICONO = 795;
const enIcono = ubicar(plantula(), 512, 200, SUELO_ICONO);
/**
 * Ícono adaptable de Android y pantalla de carga (Android 12+ recorta ambos en un círculo de 2/3 del
 * lado; la zona segura es un círculo de 66/108 del lado): la plántula entra en esa zona. La tierra va en
 * la capa de fondo, a la misma altura.
 */
const SUELO_ADAPTABLE = 728;
const enAdaptable = ubicar(plantula(), 512, 350, SUELO_ADAPTABLE);
/** Original vectorial de la plántula sola, ocupando casi todo el lienzo. */
const enGrande = ubicar(plantula(), 512, 70, 960);

const SVGS = {
  'assets/marca/brota-icono.svg': svg(enIcono, { suelo: SUELO_ICONO }),
  'assets/marca/brota-plantula.svg': svg(enGrande),
};

/** [svg, ancho en px] de cada PNG. */
const PNGS = {
  'assets/images/icon.png': [SVGS['assets/marca/brota-icono.svg'], LADO],
  'assets/images/logo.png': [svg(enIcono, { suelo: SUELO_ICONO, redondeado: true }), 512],
  'assets/images/android-icon-background.png': [svg(null, { suelo: SUELO_ADAPTABLE }), LADO],
  'assets/images/android-icon-foreground.png': [svg(enAdaptable), LADO],
  'assets/images/android-icon-monochrome.png': [svg(enAdaptable, { mono: true }), LADO],
  'assets/images/splash-icon.png': [svg(enAdaptable), LADO],
};

function png(svgTexto, ancho) {
  return new Resvg(svgTexto, { fitTo: { mode: 'width', value: ancho }, font: { loadSystemFonts: false } }).render().asPng();
}

// Vista previa sin tocar el proyecto (los transparentes van sobre un fondo para poder verlos).
const iVista = process.argv.indexOf('--vista');
if (iVista > 0) {
  const dir = process.argv[iVista + 1];
  fs.mkdirSync(dir, { recursive: true });
  for (const [rel, [svgTexto, ancho]] of Object.entries(PNGS)) {
    const nombre = path.basename(rel);
    const fondoVista = nombre.includes('monochrome') ? '#3A4A40' : nombre.includes('foreground') || nombre.includes('splash') ? COLORES.fondoHasta : null;
    const conFondo = fondoVista ? svgTexto.replace('<defs>', `<rect width="${LADO}" height="${LADO}" fill="${fondoVista}"/><defs>`) : svgTexto;
    fs.writeFileSync(path.join(dir, nombre), png(conFondo, ancho));
  }
  console.log(`Vista previa en ${dir}`);
  process.exit(0);
}

const check = process.argv.includes('--check');
let desactualizados = 0;
for (const [rel, contenido] of Object.entries(SVGS)) {
  const destino = path.join(RAIZ, rel);
  const actual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
  if (actual === contenido) continue;
  if (check) {
    console.error(`Desactualizado: ${rel}`);
    desactualizados++;
    continue;
  }
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, contenido);
  console.log(`Escrito: ${rel}`);
}
if (check) {
  for (const rel of Object.keys(PNGS)) {
    if (!fs.existsSync(path.join(RAIZ, rel))) {
      console.error(`Falta: ${rel}`);
      desactualizados++;
    }
  }
  if (desactualizados) {
    console.error('Corré: node tools/marca/generar-marca.js');
    process.exit(1);
  }
  console.log('Marca al día.');
} else {
  for (const [rel, [svgTexto, ancho]] of Object.entries(PNGS)) {
    fs.writeFileSync(path.join(RAIZ, rel), png(svgTexto, ancho));
    console.log(`Escrito: ${rel}`);
  }
}
