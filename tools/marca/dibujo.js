/**
 * Dibujo de la marca de BROTA (D-28) en SVG: la plántula de costado saliendo de la tierra, sobre un fondo
 * verde oscuro con un brillo detrás de las hojas, como en la foto de referencia del usuario.
 */
const { r1, trazo } = require('./geometria');

const LADO = 1024;

/** Colores de la marca (también los usa la app, vía src/tema/marca.ts). */
const COLORES = {
  fondoDesde: '#1F5C3D',
  fondoHasta: '#0A2117',
  brillo: '#4ADE80',
  sueloClaro: '#4A3424',
  sueloOscuro: '#1A120C',
  perlita: '#EDE9DF',
  talloClaro: '#C4EE96',
  talloOscuro: '#7DBF52',
  cotiledonClaro: '#CFF494',
  cotiledonOscuro: '#5FAE3E',
  hojaClara: '#DDFAA0',
  hojaOscura: '#6CC24A',
  nervioCotiledon: '#3F8F2E',
  nervioHoja: '#F4FFD8',
  borde: '#F1FFD2',
};

/** Medidas del trazo (en la escala de la plántula sin ubicar). */
const GROSOR_BORDE = 3.5;
const OPACIDAD_BORDE = 0.38;
const GROSOR_NERVIO = 4.5;
const OPACIDAD_NERVIO_HOJA = 0.75;
const OPACIDAD_NERVIO_COTILEDON = 0.3;

/** Granitos de perlita sobre la tierra: [x relativo al ancho, cm bajo el horizonte, radio]. */
const PERLITA = [
  [0.22, 58, 10],
  [0.4, 124, 11],
  [0.66, 84, 9],
  [0.82, 140, 10],
  [0.12, 160, 8],
  [0.58, 190, 9],
];

function defs(conFondo, suelo) {
  return `<defs>
  ${
    conFondo
      ? `<linearGradient id="fondo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORES.fondoDesde}"/><stop offset="1" stop-color="${COLORES.fondoHasta}"/></linearGradient>
  <radialGradient id="brillo" cx="512" cy="${brilloCy(suelo)}" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${COLORES.brillo}" stop-opacity="${OPACIDAD_BRILLO}"/><stop offset="1" stop-color="${COLORES.brillo}" stop-opacity="0"/></radialGradient>`
      : ''
  }
  <linearGradient id="suelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORES.sueloClaro}"/><stop offset="1" stop-color="${COLORES.sueloOscuro}"/></linearGradient>
  <linearGradient id="tallo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${COLORES.talloClaro}"/><stop offset="1" stop-color="${COLORES.talloOscuro}"/></linearGradient>
  <linearGradient id="cotiledon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLORES.cotiledonClaro}"/><stop offset="1" stop-color="${COLORES.cotiledonOscuro}"/></linearGradient>
  <linearGradient id="hoja" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLORES.hojaClara}"/><stop offset="1" stop-color="${COLORES.hojaOscura}"/></linearGradient>
</defs>`;
}

const OPACIDAD_PERLITA = 0.7;
const OPACIDAD_BRILLO = 0.32;

/** Horizonte de tierra: una loma suave que llega a `suelo` en el centro y baja hacia los costados. */
const tierra = (suelo) => `M0 ${r1(suelo + 46)}Q512 ${r1(suelo - 46)} 1024 ${r1(suelo + 46)}L1024 1024L0 1024Z`;

/** Centro del brillo, detrás de las hojas. */
const brilloCy = (suelo) => r1(suelo - 330);

/** Granitos de perlita ubicados bajo el horizonte. */
const perlitas = (suelo) => PERLITA.map(([x, dy, r]) => ({ cx: r1(x * LADO), cy: r1(suelo + 40 + dy), r }));

/** Fondo completo: degradé, brillo detrás de las hojas, tierra y perlita. */
function fondo(suelo, conPerlita = true) {
  const perlita = (conPerlita ? perlitas(suelo) : [])
    .map((p) => `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${COLORES.perlita}" fill-opacity="${OPACIDAD_PERLITA}"/>`)
    .join('');
  return `<rect width="${LADO}" height="${LADO}" fill="url(#fondo)"/><rect width="${LADO}" height="${LADO}" fill="url(#brillo)"/><path d="${tierra(suelo)}" fill="url(#suelo)"/>${perlita}`;
}

/** Montículo de tierra que tapa la base del tallo (va adelante de la plántula). */
function monticuloD(u) {
  const [x, y] = u.base;
  const a = 88 * u.escala;
  const h = 15 * u.escala;
  return `M${r1(x - a)} ${r1(y + h)}Q${r1(x)} ${r1(y - h * 1.6)} ${r1(x + a)} ${r1(y + h)}Z`;
}

const monticulo = (u, mono) => `<path d="${monticuloD(u)}" fill="${mono ? '#FFFFFF' : 'url(#suelo)'}"/>`;

/** Plántula ya ubicada (ver geometria.ubicar). `mono`: todo blanco, para el ícono monocromático. */
function cuerpo(u, { mono = false } = {}) {
  const k = u.escala;
  const borde = mono ? '' : ` stroke="${COLORES.borde}" stroke-opacity="${OPACIDAD_BORDE}" stroke-width="${r1(GROSOR_BORDE * k)}" stroke-linejoin="round"`;
  const linea = (pts, color, opacidad) =>
    `<path d="${trazo(pts, false)}" stroke="${color}" stroke-opacity="${opacidad}" stroke-width="${r1(GROSOR_NERVIO * k)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const relleno = (id) => (mono ? '#FFFFFF' : `url(#${id})`);
  return [
    `<path d="${trazo(u.tallo)}" fill="${relleno('tallo')}"/>`,
    ...u.cotiledones.map((e) => `<path d="${trazo(e.contorno)}" fill="${relleno('cotiledon')}"${borde}/>`),
    mono ? '' : u.cotiledones.map((e) => linea(e.nervio, COLORES.nervioCotiledon, OPACIDAD_NERVIO_COTILEDON)).join(''),
    ...u.hojas.map((e) => `<path d="${trazo(e.contorno)}" fill="${relleno('hoja')}"${borde}/>`),
    mono ? '' : u.hojas.map((e) => linea(e.nervio, COLORES.nervioHoja, OPACIDAD_NERVIO_HOJA)).join(''),
    ...u.brote.map((p) => `<path d="${trazo(p)}" fill="${relleno('hoja')}"${borde}/>`),
    monticulo(u, mono),
  ].join('\n');
}

/**
 * SVG de 1024 × 1024. `fondo`: altura del horizonte de tierra para dibujar el fondo completo (ícono y
 * fondo del ícono adaptable); sin fondo, la plántula queda sobre transparente.
 */
const svg = (contenido, { suelo = null, perlita = true } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}">\n${defs(suelo !== null, suelo ?? 0)}\n${suelo !== null ? fondo(suelo, perlita) : ''}\n${contenido}\n</svg>\n`;

module.exports = {
  LADO,
  COLORES,
  PERLITA,
  GROSOR_BORDE,
  OPACIDAD_BORDE,
  GROSOR_NERVIO,
  OPACIDAD_NERVIO_HOJA,
  OPACIDAD_NERVIO_COTILEDON,
  OPACIDAD_PERLITA,
  OPACIDAD_BRILLO,
  tierra,
  brilloCy,
  perlitas,
  monticuloD,
  cuerpo,
  svg,
};
