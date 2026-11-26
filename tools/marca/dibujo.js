/**
 * Dibujo de la marca de BROTA (D-28) en SVG, con acabado realista: la plántula de costado saliendo de la
 * tierra, como en la foto de referencia del usuario. Luz desde arriba a la izquierda; las hojas plegadas
 * en su nervio (una mitad más iluminada), nervaduras, sombra interior en los bordes y pelusa; fondo verde
 * desenfocado como en la foto; tierra con grano, terrones y perlita que tapa la base del tallo.
 */
const { bordeTierra, detallesTierra, r1, trazo, trazoSuave } = require('./geometria');

const LADO = 1024;

/** Colores de la marca. */
const COLORES = {
  fondoDesde: '#2D6B47',
  fondoHasta: '#0B2318',
  follaje: ['#5FA868', '#3F8A52', '#7CC077', '#2E7046'],
  brillo: '#8FE39A',
  sueloClaro: '#4D3727',
  sueloOscuro: '#140D08',
  perlita: '#F4F1EA',
  perlitaSombra: '#BDB6A8',
  talloClaro: '#D3F2AA',
  talloOscuro: '#6AA845',
  hojaBase: '#4E9634',
  hojaMedio: '#88CE55',
  hojaPunta: '#C6EF87',
  sombraBase: '#468C2F',
  sombraMedio: '#7AC14B',
  sombraPunta: '#B2E57A',
  cotBase: '#3F7F2A',
  cotMedio: '#6CB044',
  cotPunta: '#8FCB5E',
  bordeHoja: '#2F6E1F',
  nervio: '#EFFFD0',
  pelusa: '#F3FFDC',
};

/** Manchas de follaje desenfocado del fondo: [x, y, radio, índice de color, opacidad]. */
const FOLLAJE = [
  [120, 150, 150, 0, 0.55],
  [880, 120, 170, 1, 0.5],
  [960, 430, 120, 2, 0.35],
  [60, 470, 130, 3, 0.5],
  [520, 60, 120, 2, 0.3],
  [300, 330, 90, 1, 0.3],
  [760, 330, 100, 0, 0.3],
];

const deg = (id, [x1, y1], [x2, y2], stops) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`;

/** Contorno de la tierra (borde irregular hasta abajo del lienzo). */
const contornoTierra = (suelo) => trazoSuave([...bordeTierra(suelo), [LADO, LADO], [0, LADO]]);

/** Filtros, degradés fijos y el recorte de la tierra. */
function defsFijos(suelo) {
  return `
  <linearGradient id="fondo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORES.fondoDesde}"/><stop offset="1" stop-color="${COLORES.fondoHasta}"/></linearGradient>
  <radialGradient id="brillo" cx="512" cy="${r1(suelo - 330)}" r="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${COLORES.brillo}" stop-opacity="0.28"/><stop offset="1" stop-color="${COLORES.brillo}" stop-opacity="0"/></radialGradient>
  <radialGradient id="vineta" cx="512" cy="470" r="720" gradientUnits="userSpaceOnUse"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>
  <linearGradient id="suelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORES.sueloClaro}"/><stop offset="1" stop-color="${COLORES.sueloOscuro}"/></linearGradient>
  <radialGradient id="perlita" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="${COLORES.perlita}"/><stop offset="1" stop-color="${COLORES.perlitaSombra}"/></radialGradient>
  <radialGradient id="parche"><stop offset="0.55" stop-color="#FFFFFF"/><stop offset="1" stop-color="#000000"/></radialGradient>
  <clipPath id="recorteTierra"><path d="${contornoTierra(suelo)}"/></clipPath>
  <filter id="desenfoqueFondo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="34"/></filter>
  <filter id="desenfoqueSombra" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="desenfoqueBrillo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="desenfoqueBorde" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="desenfoqueTerron" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.3"/></filter>
  <filter id="pelusa" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1"/></filter>
  <filter id="grano" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="4" seed="5" result="ruido"/>
    <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.035  0 0 0 0 0.02  2.4 0 0 0 -1.15"/>
  </filter>
  <filter id="granoClaro" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="9" result="ruido"/>
    <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.34  0 0 0 0 0.24  0 2.6 0 0 -1.45"/>
  </filter>`;
}

/** Degradés de luz de cada hoja: de la base (más oscura) a la punta (más clara). */
function defsHojas(u) {
  const partes = [];
  const C = COLORES;
  const hoja = (id, e, luz, sombra) => {
    partes.push(deg(`${id}Luz`, e.base, e.puntaHoja, [['0', luz[0]], ['0.45', luz[1]], ['1', luz[2]]]));
    if (sombra) partes.push(deg(`${id}Sombra`, e.base, e.puntaHoja, [['0', sombra[0]], ['0.45', sombra[1]], ['1', sombra[2]]]));
  };
  const luzHoja = [C.hojaBase, C.hojaMedio, C.hojaPunta];
  const sombraHoja = [C.sombraBase, C.sombraMedio, C.sombraPunta];
  u.cotiledones.forEach((e, i) => hoja(`cot${i}`, e, [C.cotBase, C.cotMedio, C.cotPunta], null));
  u.hojas.forEach((e, i) => hoja(`hoja${i}`, e, luzHoja, sombraHoja));
  u.brote.forEach((e, i) => hoja(`brote${i}`, e, luzHoja, sombraHoja));
  const [bx] = u.base;
  const g = 9 * u.escala;
  partes.push(deg('tallo', [bx - g, 0], [bx + g, 0], [['0', C.talloClaro], ['0.55', '#9BD46E'], ['1', C.talloOscuro]]));
  // El tallo se oscurece cerca de la tierra.
  const [, by] = u.base;
  partes.push(`<linearGradient id="talloSombra" gradientUnits="userSpaceOnUse" x1="0" y1="${r1(by - 160 * u.escala)}" x2="0" y2="${r1(by)}"><stop offset="0" stop-color="#2F5A1E" stop-opacity="0"/><stop offset="1" stop-color="#2F5A1E" stop-opacity="0.6"/></linearGradient>`);
  u.cotiledones.concat(u.hojas, u.brote).forEach((e, i) => partes.push(`<clipPath id="forma${i}"><path d="${trazo(e.contorno)}"/></clipPath>`));
  return partes.join('\n  ');
}

/** Fondo: degradé, follaje desenfocado y brillo detrás de la plántula. */
function fondo() {
  const manchas = FOLLAJE.map(([x, y, r, c, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${COLORES.follaje[c]}" fill-opacity="${o}"/>`).join('');
  return `<rect width="${LADO}" height="${LADO}" fill="url(#fondo)"/><g filter="url(#desenfoqueFondo)">${manchas}</g><rect width="${LADO}" height="${LADO}" fill="url(#brillo)"/>`;
}

/** Capas de la tierra (color, grano, terrones y perlita), en coordenadas absolutas para que coincidan siempre. */
function capasTierra(suelo, { perlita = true } = {}) {
  const { terrones, perlitas } = detallesTierra(suelo);
  const terron = (t) =>
    `<ellipse cx="${t.x}" cy="${t.y}" rx="${t.rx}" ry="${t.ry}" transform="rotate(${t.giro} ${t.x} ${t.y})" fill="${t.claro ? '#6E5039' : '#0E0906'}" fill-opacity="${t.claro ? 0.35 : 0.6}"/>`;
  const grano = (t) =>
    `<ellipse cx="${r1(t.x + 2)}" cy="${r1(t.y + t.ry * 0.7)}" rx="${t.rx}" ry="${r1(t.ry * 0.6)}" fill="#000" fill-opacity="0.45"/><ellipse cx="${t.x}" cy="${t.y}" rx="${r1(t.rx * 0.8)}" ry="${t.ry}" transform="rotate(${t.giro} ${t.x} ${t.y})" fill="url(#perlita)"/>`;
  return `<rect width="${LADO}" height="${LADO}" fill="url(#suelo)"/>
  <rect width="${LADO}" height="${LADO}" filter="url(#grano)" opacity="0.9"/>
  <rect width="${LADO}" height="${LADO}" filter="url(#granoClaro)" opacity="0.6"/>
  <g filter="url(#desenfoqueTerron)">${terrones.map(terron).join('')}</g>
  ${perlita ? perlitas.map(grano).join('') : ''}
  <path d="${trazoSuave(bordeTierra(suelo), false)}" fill="none" stroke="#7A5A40" stroke-opacity="0.45" stroke-width="3"/>`;
}

/** Tierra de todo el ancho. */
const tierra = (suelo, opciones) => `<g clip-path="url(#recorteTierra)">${capasTierra(suelo, opciones)}</g>`;

/** Terrón de tierra alrededor de la base del tallo, con el borde esfumado (frente del ícono adaptable y pantalla de carga). */
function parcheTierra(u) {
  const [bx, by] = u.base;
  const k = u.escala;
  return `<mask id="mascaraParche" maskUnits="userSpaceOnUse" x="0" y="0" width="${LADO}" height="${LADO}"><ellipse cx="${r1(bx)}" cy="${r1(by + 26 * k)}" rx="${r1(150 * k)}" ry="${r1(62 * k)}" fill="url(#parche)"/></mask>
<g mask="url(#mascaraParche)">${tierra(by, { perlita: true })}</g>`;
}

/** Sombra de contacto donde el tallo entra en la tierra. */
const sombraContacto = (u) => {
  const [bx, by] = u.base;
  const k = u.escala;
  return `<ellipse cx="${r1(bx)}" cy="${r1(by + 2 * k)}" rx="${r1(46 * k)}" ry="${r1(12 * k)}" fill="#000" fill-opacity="0.55" filter="url(#desenfoqueSombra)"/>`;
};

/** Una hoja: dos mitades (o un solo degradé), nervaduras, nervio, sombra interior en el borde y pelusa. */
function hoja(e, id, recorte, k, { venas = true, pliegue = true, brillo = false, sombraBorde = 0.45 } = {}) {
  const partes = pliegue
    ? [`<path d="${trazo(e.mitadSombra)}" fill="url(#${id}Sombra)"/>`, `<path d="${trazo(e.mitadLuz)}" fill="url(#${id}Luz)"/>`]
    : [`<path d="${trazo(e.contorno)}" fill="url(#${id}Luz)"/>`];
  if (brillo) {
    const [bx, by] = e.brillo;
    const [x0, y0] = e.base;
    const [x1, y1] = e.puntaHoja;
    const giro = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const largo = Math.hypot(x1 - x0, y1 - y0);
    partes.push(
      `<ellipse cx="${r1(bx)}" cy="${r1(by)}" rx="${r1(largo * 0.3)}" ry="${r1(largo * 0.1)}" transform="rotate(${r1(giro)} ${r1(bx)} ${r1(by)})" fill="#F4FFE0" fill-opacity="0.22" filter="url(#desenfoqueBrillo)" clip-path="url(#${recorte})"/>`,
    );
  }
  if (venas && e.venas.length) {
    partes.push(
      e.venas
        .map((v) => `<path d="${trazo(v, false)}" stroke="${COLORES.nervio}" stroke-opacity="0.3" stroke-width="${r1(1.8 * k)}" stroke-linecap="round" fill="none"/>`)
        .join(''),
    );
  }
  partes.push(
    // Canaleta del nervio: una línea oscura más ancha debajo de la clara.
    `<path d="${trazo(e.nervio, false)}" stroke="${COLORES.bordeHoja}" stroke-opacity="${venas ? 0.3 : 0.15}" stroke-width="${r1((venas ? 7.5 : 5) * k)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    `<path d="${trazo(e.nervio, false)}" stroke="${COLORES.nervio}" stroke-opacity="${venas ? 0.7 : 0.25}" stroke-width="${r1((venas ? 4 : 3) * k)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    // Sombra interior: el borde un poco más oscuro, como el volumen de una hoja real.
    `<g clip-path="url(#${recorte})"><path d="${trazo(e.contorno)}" fill="none" stroke="${COLORES.bordeHoja}" stroke-opacity="${sombraBorde}" stroke-width="${r1(9 * k)}" filter="url(#desenfoqueBorde)"/></g>`,
    `<path d="${trazo(e.contorno)}" fill="none" stroke="${COLORES.pelusa}" stroke-opacity="0.22" stroke-width="${r1(2 * k)}" stroke-linejoin="round" filter="url(#pelusa)"/>`,
  );
  return partes.join('\n');
}

/** Siluetas de la plántula (para la sombra y el ícono monocromático). */
const formas = (u) => [u.tallo, ...u.cotiledones.map((e) => e.contorno), ...u.hojas.map((e) => e.contorno), ...u.brote.map((e) => e.contorno)];

/** La plántula ya ubicada (ver geometria.ubicar), sin la tierra. */
function planta(u) {
  const k = u.escala;
  const nc = u.cotiledones.length;
  const nh = u.hojas.length;
  return [
    `<path d="${trazo(u.tallo)}" fill="url(#tallo)"/>`,
    `<path d="${trazo(u.tallo)}" fill="url(#talloSombra)"/>`,
    `<path d="${trazo(u.tallo)}" fill="none" stroke="${COLORES.pelusa}" stroke-opacity="0.35" stroke-width="${r1(2 * k)}" filter="url(#pelusa)"/>`,
    ...u.cotiledones.map((e, i) => hoja(e, `cot${i}`, `forma${i}`, k, { venas: false, pliegue: false, brillo: true, sombraBorde: 0.18 })),
    ...u.hojas.map((e, i) => hoja(e, `hoja${i}`, `forma${nc + i}`, k)),
    ...u.brote.map((e, i) => hoja(e, `brote${i}`, `forma${nc + nh + i}`, k, { venas: false })),
  ].join('\n');
}

/** Sombra suave de la plántula sobre el fondo (da profundidad). */
const sombraPlanta = (u) =>
  `<g transform="translate(${r1(6 * u.escala)} ${r1(12 * u.escala)})" fill="#061109" fill-opacity="0.3" filter="url(#desenfoqueSombra)">${formas(u)
    .map((p) => `<path d="${trazo(p)}"/>`)
    .join('')}</g>`;

/**
 * SVG de 1024 × 1024.
 * - `u`: la plántula ubicada (o null para el fondo del ícono adaptable).
 * - `suelo`: altura de la tierra para dibujar el fondo y la tierra de todo el ancho (ícono y fondo del
 *   ícono adaptable). Sin `suelo` va sobre transparente, con un terrón alrededor del tallo.
 * - `mono`: silueta blanca (ícono monocromático). `redondeado`: esquinas del ícono (logo de la app).
 */
function svg(u, { suelo = null, mono = false, redondeado = false } = {}) {
  const ref = suelo ?? (u ? u.base[1] : 760);
  const defs = `<defs>${defsFijos(ref)}${u && !mono ? `\n  ${defsHojas(u)}` : ''}${redondeado ? `\n  <clipPath id="esquinas"><rect width="${LADO}" height="${LADO}" rx="230"/></clipPath>` : ''}\n</defs>`;
  let escena;
  if (mono) {
    const [bx, by] = u.base;
    const k = u.escala;
    escena = [...formas(u).map((p) => `<path d="${trazo(p)}" fill="#FFFFFF"/>`), `<ellipse cx="${r1(bx)}" cy="${r1(by + 6 * k)}" rx="${r1(110 * k)}" ry="${r1(18 * k)}" fill="#FFFFFF"/>`].join('\n');
  } else if (suelo !== null) {
    escena = [fondo(), u ? sombraPlanta(u) + planta(u) : '', tierra(suelo), u ? sombraContacto(u) : '', `<rect width="${LADO}" height="${LADO}" fill="url(#vineta)"/>`].join('\n');
  } else {
    escena = [planta(u), parcheTierra(u), sombraContacto(u)].join('\n');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}">\n${defs}\n${redondeado ? `<g clip-path="url(#esquinas)">${escena}</g>` : escena}\n</svg>\n`;
}

module.exports = { LADO, COLORES, svg };
