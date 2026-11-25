#!/usr/bin/env node
/**
 * Marca de BROTA (D-28): una plántula de cannabis (cotiledones y una hoja palmeada de 7 foliolos
 * dentados). Un solo diseño genera todo:
 *  - src/tema/marca.ts           trazos para el logo dentro de la app (react-native-svg)
 *  - assets/marca/*.svg          originales vectoriales (ícono y plántula sola)
 *  - assets/images/*.png         ícono de la app, ícono adaptable de Android (fondo, frente y
 *                                monocromático) y la imagen de la pantalla de carga
 *
 * Uso: node tools/marca/generar-marca.js                  escribe todo
 *      node tools/marca/generar-marca.js --check          falla si algo generado quedó desactualizado
 *      node tools/marca/generar-marca.js --vista <dir>    solo PNG de vista previa en otra carpeta
 */
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const { plantula, r1, trazo, ubicar } = require('./geometria');
const { COLORES, FONDO, GROSOR_NERVIO, GROSOR_PECIOLO, LADO, OPACIDAD_NERVIO, OPACIDAD_SUELO, cuerpo, svg } = require('./dibujo');

const RAIZ = path.join(__dirname, '..', '..');

/** La variante elegida (C4 en la hoja de contactos): hoja central de 7 foliolos y tallo corto. */
const FORMA = { forma: 'central', n: 7, largoHoja: 320, anchoFoliolo: 0.16, nodoCot: -74, apice: -165, cot: [124, 50, 66] };

// Ícono completo (iOS y Android viejo): plántula grande sobre el fondo.
const enIcono = ubicar(plantula(FORMA), 512, 520, 700, 640);
// Ícono adaptable de Android y pantalla de carga (Android 12+ recorta ambos en un círculo de 2/3 del
// lado): la plántula, con la sombra del suelo, entra en ese círculo.
const enAdaptable = ubicar(plantula(FORMA), 512, 518, 520, 510);
// Original vectorial de la plántula sola, ocupando casi todo el lienzo.
const enGrande = ubicar(plantula(FORMA), 512, 512, 900, 900);

const SVGS = {
  'assets/marca/brota-icono.svg': svg(FONDO + cuerpo(enIcono), { conFondo: true }),
  'assets/marca/brota-plantula.svg': svg(cuerpo(enGrande)),
};

const PNGS = {
  'assets/images/icon.png': SVGS['assets/marca/brota-icono.svg'],
  'assets/images/android-icon-background.png': svg(FONDO, { conFondo: true }),
  'assets/images/android-icon-foreground.png': svg(cuerpo(enAdaptable)),
  'assets/images/android-icon-monochrome.png': svg(cuerpo(enAdaptable, { mono: true })),
  'assets/images/splash-icon.png': svg(cuerpo(enAdaptable)),
};

/** Módulo con los trazos del ícono para dibujar el logo dentro de la app. */
function modulo() {
  const u = enIcono;
  const lista = (xs) => `[\n${xs.map((x) => `  '${x}',`).join('\n')}\n]`;
  const colores = Object.entries(COLORES)
    .map(([k, v]) => `  ${k}: '${v}',`)
    .join('\n');
  return `/**
 * Trazos de la marca de BROTA (plántula de cannabis, D-28) en un lienzo de ${LADO} × ${LADO}.
 * Archivo generado por tools/marca/generar-marca.js: no se edita a mano.
 */
export const LIENZO = ${LADO};

export const COLORES_MARCA = {
${colores}
} as const;

export const TALLO = '${trazo(u.tallo)}';

export const PECIOLOS: readonly string[] = ${lista(u.peciolos.map((p) => trazo(p, false)))};

export const GROSOR_PECIOLO = ${r1(GROSOR_PECIOLO * u.escala)};

export const COTILEDONES: readonly string[] = ${lista(u.cotiledones.map((p) => trazo(p)))};

export const FOLIOLOS: readonly string[] = ${lista(u.hojas.map((h) => trazo(h.contorno)))};

export const NERVIOS: readonly string[] = ${lista(u.hojas.map((h) => trazo(h.nervio, false)))};

export const GROSOR_NERVIO = ${r1(GROSOR_NERVIO * u.escala)};

export const OPACIDAD_NERVIO = ${OPACIDAD_NERVIO};

export const SUELO = { cx: ${r1(u.suelo.cx)}, cy: ${r1(u.suelo.cy)}, rx: ${r1(u.suelo.rx)}, ry: ${r1(u.suelo.ry)}, opacidad: ${OPACIDAD_SUELO} } as const;
`;
}

function png(svgTexto) {
  return new Resvg(svgTexto, { fitTo: { mode: 'width', value: LADO }, font: { loadSystemFonts: false } }).render().asPng();
}

// Vista previa sin tocar el proyecto (los transparentes van sobre un fondo para poder verlos).
const iVista = process.argv.indexOf('--vista');
if (iVista > 0) {
  const dir = process.argv[iVista + 1];
  fs.mkdirSync(dir, { recursive: true });
  for (const [rel, svgTexto] of Object.entries(PNGS)) {
    const nombre = path.basename(rel);
    const fondoVista = nombre.includes('monochrome') ? '#3A4A40' : nombre.includes('foreground') || nombre.includes('splash') ? COLORES.fondoHasta : null;
    const conFondo = fondoVista ? svgTexto.replace('<defs>', `<rect width="${LADO}" height="${LADO}" fill="${fondoVista}"/><defs>`) : svgTexto;
    fs.writeFileSync(path.join(dir, nombre), png(conFondo));
  }
  console.log(`Vista previa en ${dir}`);
  process.exit(0);
}

const check = process.argv.includes('--check');
const textos = { ...SVGS, 'src/tema/marca.ts': modulo() };
let desactualizados = 0;
for (const [rel, contenido] of Object.entries(textos)) {
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
  if (desactualizados) {
    console.error('Corré: node tools/marca/generar-marca.js');
    process.exit(1);
  }
  console.log('Marca al día.');
} else {
  for (const [rel, svgTexto] of Object.entries(PNGS)) {
    fs.writeFileSync(path.join(RAIZ, rel), png(svgTexto));
    console.log(`Escrito: ${rel}`);
  }
}
