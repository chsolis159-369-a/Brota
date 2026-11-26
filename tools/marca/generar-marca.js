#!/usr/bin/env node
/**
 * Marca de BROTA (D-28): una plántula de cannabis de costado saliendo de la tierra (tallo fino, dos
 * cotiledones redondeados, el primer par de hojas dentadas en V y el brote del centro), inspirada en la
 * foto de referencia del usuario. Un solo diseño genera todo:
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
const D = require('./dibujo');

const { COLORES, LADO, cuerpo, svg } = D;
const RAIZ = path.join(__dirname, '..', '..');

/** Ícono completo (iOS y Android viejo): la punta de las hojas en y = 200 y la tierra en y = 795. */
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
  'assets/marca/brota-icono.svg': svg(cuerpo(enIcono), { suelo: SUELO_ICONO }),
  'assets/marca/brota-plantula.svg': svg(cuerpo(enGrande)),
};

const PNGS = {
  'assets/images/icon.png': SVGS['assets/marca/brota-icono.svg'],
  'assets/images/android-icon-background.png': svg('', { suelo: SUELO_ADAPTABLE }),
  'assets/images/android-icon-foreground.png': svg(cuerpo(enAdaptable)),
  'assets/images/android-icon-monochrome.png': svg(cuerpo(enAdaptable, { mono: true })),
  'assets/images/splash-icon.png': svg(cuerpo(enAdaptable)),
};

/** Módulo con los trazos del ícono para dibujar el logo dentro de la app. */
function modulo() {
  const u = enIcono;
  const k = u.escala;
  const lista = (xs) => `[\n${xs.map((x) => `  '${x}',`).join('\n')}\n]`;
  const colores = Object.entries(COLORES)
    .map(([c, v]) => `  ${c}: '${v}',`)
    .join('\n');
  const perlita = D.perlitas(SUELO_ICONO)
    .map((p) => `  { cx: ${p.cx}, cy: ${p.cy}, r: ${p.r} },`)
    .join('\n');
  return `/**
 * Trazos de la marca de BROTA (plántula de cannabis de costado saliendo de la tierra, D-28) en un lienzo
 * de ${LADO} × ${LADO}. Archivo generado por tools/marca/generar-marca.js: no se edita a mano.
 */
export const LIENZO = ${LADO};

export const COLORES_MARCA = {
${colores}
} as const;

export const BRILLO = { cy: ${D.brilloCy(SUELO_ICONO)}, opacidad: ${D.OPACIDAD_BRILLO} } as const;

export const TIERRA = '${D.tierra(SUELO_ICONO)}';

export const PERLITA = [
${perlita}
] as const;

export const OPACIDAD_PERLITA = ${D.OPACIDAD_PERLITA};

export const TALLO = '${trazo(u.tallo)}';

export const COTILEDONES: readonly string[] = ${lista(u.cotiledones.map((e) => trazo(e.contorno)))};

export const NERVIOS_COTILEDON: readonly string[] = ${lista(u.cotiledones.map((e) => trazo(e.nervio, false)))};

export const HOJAS: readonly string[] = ${lista(u.hojas.map((e) => trazo(e.contorno)))};

export const NERVIOS_HOJA: readonly string[] = ${lista(u.hojas.map((e) => trazo(e.nervio, false)))};

export const BROTE: readonly string[] = ${lista(u.brote.map((p) => trazo(p)))};

export const MONTICULO = '${D.monticuloD(u)}';

export const TRAZO = {
  borde: ${r1(D.GROSOR_BORDE * k)},
  opacidadBorde: ${D.OPACIDAD_BORDE},
  nervio: ${r1(D.GROSOR_NERVIO * k)},
  opacidadNervioHoja: ${D.OPACIDAD_NERVIO_HOJA},
  opacidadNervioCotiledon: ${D.OPACIDAD_NERVIO_COTILEDON},
} as const;
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
