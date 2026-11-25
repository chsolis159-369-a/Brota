/**
 * Dibujo de la marca de BROTA (D-28) en SVG: colores, degradés y cuerpo de la plántula vista desde arriba.
 */
const { r1, trazo } = require('./geometria');

const LADO = 1024;

/** Colores de la marca (también los usa la app, vía src/tema/marca.ts). */
const COLORES = {
  fondoDesde: '#1B4A33',
  fondoHasta: '#061710',
  brillo: '#4ADE80',
  cotiledonClaro: '#C9F28E',
  cotiledonOscuro: '#68BC45',
  hojaClara: '#E4FBA6',
  hojaOscura: '#7FCD4C',
  nervioCotiledon: '#3F8F2E',
  nervioHoja: '#F4FFD8',
  borde: '#F1FFD2',
  centro: '#BDEE84',
  sombra: '#021A0D',
};

/**
 * Fondos probados para el ícono. Se eligió "tierra": verde muy oscuro, como la tierra de la foto de
 * referencia, para que la plántula resalte. "marca" es el esmeralda de las tarjetas destacadas.
 */
const FONDOS = {
  tierra: [COLORES.fondoDesde, COLORES.fondoHasta],
  marca: ['#1E9E58', '#0A4227'],
};

function defs(fondo) {
  const f = fondo ? FONDOS[fondo] : null;
  return `<defs>
  ${
    f
      ? `<linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${f[0]}"/><stop offset="1" stop-color="${f[1]}"/></linearGradient>
  <radialGradient id="brillo" cx="512" cy="500" r="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${COLORES.brillo}" stop-opacity="0.30"/><stop offset="1" stop-color="${COLORES.brillo}" stop-opacity="0"/></radialGradient>`
      : ''
  }
  <linearGradient id="cotiledon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLORES.cotiledonClaro}"/><stop offset="1" stop-color="${COLORES.cotiledonOscuro}"/></linearGradient>
  <linearGradient id="hoja" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLORES.hojaClara}"/><stop offset="1" stop-color="${COLORES.hojaOscura}"/></linearGradient>
</defs>`;
}

/** Medidas del trazo (en la escala de la plántula sin ubicar). */
const GROSOR_BORDE = 4;
const OPACIDAD_BORDE = 0.4;
const GROSOR_NERVIO = 5;
const OPACIDAD_NERVIO_HOJA = 0.75;
const OPACIDAD_NERVIO_COTILEDON = 0.3;
/** Sombra dura debajo de las hojas, corrida hacia abajo a la derecha. */
const SOMBRA = { dx: 9, dy: 14, opacidad: 0.3 };

/** Plántula ya ubicada (ver geometria.ubicar). `mono`: todo blanco, para el ícono monocromático. */
function cuerpo(u, { mono = false, sombra = true } = {}) {
  const k = u.escala;
  const formas = [...u.cotiledones.map((e) => e.contorno), ...u.hojas.map((e) => e.contorno)];
  const borde = mono ? '' : ` stroke="${COLORES.borde}" stroke-opacity="${OPACIDAD_BORDE}" stroke-width="${r1(GROSOR_BORDE * k)}" stroke-linejoin="round"`;
  const linea = (pts, color, opacidad) =>
    `<path d="${trazo(pts, false)}" stroke="${color}" stroke-opacity="${opacidad}" stroke-width="${r1(GROSOR_NERVIO * k)}" stroke-linecap="round" fill="none"/>`;
  return [
    mono || !sombra
      ? ''
      : `<g transform="translate(${r1(SOMBRA.dx * k)} ${r1(SOMBRA.dy * k)})" fill="${COLORES.sombra}" fill-opacity="${SOMBRA.opacidad}">${formas.map((p) => `<path d="${trazo(p)}"/>`).join('')}</g>`,
    ...u.cotiledones.map((e) => `<path d="${trazo(e.contorno)}" fill="${mono ? '#FFFFFF' : 'url(#cotiledon)'}"${borde}/>`),
    mono ? '' : u.cotiledones.map((e) => linea(e.nervio, COLORES.nervioCotiledon, OPACIDAD_NERVIO_COTILEDON)).join(''),
    ...u.hojas.map((e) => `<path d="${trazo(e.contorno)}" fill="${mono ? '#FFFFFF' : 'url(#hoja)'}"${borde}/>`),
    mono ? '' : u.hojas.map((e) => linea(e.nervio, COLORES.nervioHoja, OPACIDAD_NERVIO_HOJA)).join(''),
    ...u.brote.map((p) => `<path d="${trazo(p)}" fill="${mono ? '#FFFFFF' : 'url(#hoja)'}"/>`),
    `<circle cx="${r1(u.centro.cx)}" cy="${r1(u.centro.cy)}" r="${r1(u.centro.r)}" fill="${mono ? '#FFFFFF' : COLORES.centro}"/>`,
  ].join('\n');
}

const fondoSVG = () => `<rect width="${LADO}" height="${LADO}" fill="url(#fondo)"/><rect width="${LADO}" height="${LADO}" fill="url(#brillo)"/>`;

const svg = (contenido, { fondo = null } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}">\n${defs(fondo)}\n${fondo ? fondoSVG() : ''}\n${contenido}\n</svg>\n`;

module.exports = {
  LADO,
  COLORES,
  FONDOS,
  GROSOR_BORDE,
  OPACIDAD_BORDE,
  GROSOR_NERVIO,
  OPACIDAD_NERVIO_HOJA,
  OPACIDAD_NERVIO_COTILEDON,
  SOMBRA,
  cuerpo,
  svg,
};
