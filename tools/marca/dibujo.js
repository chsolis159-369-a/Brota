/**
 * Dibujo de la marca de BROTA (D-28) en SVG: colores, degradés y cuerpo de la plántula.
 */
const { r1, trazo } = require('./geometria');

const LADO = 1024;

/** Colores de la marca (también los usa la app, vía src/tema/marca.ts). */
const COLORES = {
  fondoDesde: '#1E9E58',
  fondoHasta: '#0A4227',
  brillo: '#4ADE80',
  hojaClara: '#DCFCA0',
  hojaOscura: '#4ADE80',
  cotiledonClaro: '#ECFDF5',
  cotiledonOscuro: '#A7F3D0',
  tallo: '#A7F3D0',
  nervio: '#15803D',
  suelo: '#04230F',
};

function defs(conFondo) {
  return `<defs>
  ${
    conFondo
      ? `<linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLORES.fondoDesde}"/><stop offset="1" stop-color="${COLORES.fondoHasta}"/></linearGradient>
  <radialGradient id="brillo" cx="512" cy="430" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${COLORES.brillo}" stop-opacity="0.30"/><stop offset="1" stop-color="${COLORES.brillo}" stop-opacity="0"/></radialGradient>`
      : ''
  }
  <linearGradient id="hoja" x1="0" y1="200" x2="0" y2="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${COLORES.hojaClara}"/><stop offset="1" stop-color="${COLORES.hojaOscura}"/></linearGradient>
  <linearGradient id="cotiledon" x1="0" y1="420" x2="0" y2="720" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${COLORES.cotiledonClaro}"/><stop offset="1" stop-color="${COLORES.cotiledonOscuro}"/></linearGradient>
</defs>`;
}

const GROSOR_PECIOLO = 10;
const GROSOR_NERVIO = 3;
const OPACIDAD_NERVIO = 0.26;
const OPACIDAD_SUELO = 0.32;

/** Plántula ya ubicada (ver geometria.ubicar). `mono`: todo blanco, para el ícono monocromático. */
function cuerpo(u, { mono = false } = {}) {
  const c = (relleno) => (mono ? '#FFFFFF' : relleno);
  return [
    mono ? '' : `<ellipse cx="${r1(u.suelo.cx)}" cy="${r1(u.suelo.cy)}" rx="${r1(u.suelo.rx)}" ry="${r1(u.suelo.ry)}" fill="${COLORES.suelo}" fill-opacity="${OPACIDAD_SUELO}"/>`,
    `<path d="${trazo(u.tallo)}" fill="${c(COLORES.tallo)}"/>`,
    ...u.peciolos.map((p) => `<path d="${trazo(p, false)}" stroke="${c(COLORES.tallo)}" stroke-width="${r1(GROSOR_PECIOLO * u.escala)}" stroke-linecap="round" fill="none"/>`),
    ...u.cotiledones.map((p) => `<path d="${trazo(p)}" fill="${c('url(#cotiledon)')}"/>`),
    ...u.hojas.map((h) => `<path d="${trazo(h.contorno)}" fill="${c('url(#hoja)')}"/>`),
    mono
      ? ''
      : u.hojas
          .map((h) => `<path d="${trazo(h.nervio, false)}" stroke="${COLORES.nervio}" stroke-opacity="${OPACIDAD_NERVIO}" stroke-width="${r1(GROSOR_NERVIO * u.escala)}" stroke-linecap="round" fill="none"/>`)
          .join(''),
  ].join('\n');
}

const FONDO = `<rect width="${LADO}" height="${LADO}" fill="url(#fondo)"/><rect width="${LADO}" height="${LADO}" fill="url(#brillo)"/>`;

const svg = (contenido, { conFondo = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}">\n${defs(conFondo)}\n${contenido}\n</svg>\n`;

module.exports = { LADO, COLORES, GROSOR_PECIOLO, GROSOR_NERVIO, OPACIDAD_NERVIO, OPACIDAD_SUELO, cuerpo, svg, FONDO };
