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
  sueloClaro: '#5E3F29',
  sueloOscuro: '#170F09',
  perlita: '#F4F1EA',
  perlitaSombra: '#BDB6A8',
  talloClaro: '#D3F2AA',
  talloOscuro: '#6AA845',
  hojaBase: '#3F8A2B',
  hojaMedio: '#74BC45',
  hojaPunta: '#B2E176',
  sombraBase: '#367A24',
  sombraMedio: '#64AA3A',
  sombraPunta: '#9ACF62',
  cotBase: '#356F22',
  cotMedio: '#5C9E36',
  cotPunta: '#7DBA4F',
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

/** Contorno de la tierra: el borde irregular suavizado y las esquinas de abajo en ángulo recto. */
const contornoTierra = (suelo) => `${trazoSuave(bordeTierra(suelo), false)}L${LADO} ${LADO}L0 ${LADO}Z`;

/** Filtros, degradés fijos y el recorte de la tierra. */
function defsFijos(suelo) {
  return `
  <linearGradient id="fondo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORES.fondoDesde}"/><stop offset="1" stop-color="${COLORES.fondoHasta}"/></linearGradient>
  <radialGradient id="brillo" cx="512" cy="${r1(suelo - 330)}" r="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${COLORES.brillo}" stop-opacity="0.28"/><stop offset="1" stop-color="${COLORES.brillo}" stop-opacity="0"/></radialGradient>
  <radialGradient id="vineta" cx="512" cy="470" r="720" gradientUnits="userSpaceOnUse"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>
  <linearGradient id="suelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORES.sueloClaro}"/><stop offset="1" stop-color="${COLORES.sueloOscuro}"/></linearGradient>
  <radialGradient id="perlita" cx="0.36" cy="0.3" r="0.78"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="${COLORES.perlita}"/><stop offset="0.85" stop-color="${COLORES.perlitaSombra}"/><stop offset="1" stop-color="#8E877A"/></radialGradient>
  <radialGradient id="terron" cx="0.4" cy="0.3" r="0.85"><stop offset="0" stop-color="#5E4430"/><stop offset="0.6" stop-color="#2E2015"/><stop offset="1" stop-color="#110B06"/></radialGradient>
  <radialGradient id="parche"><stop offset="0.55" stop-color="#FFFFFF"/><stop offset="1" stop-color="#000000"/></radialGradient>
  <clipPath id="recorteTierra"><path d="${contornoTierra(suelo)}"/></clipPath>
  <filter id="desenfoqueLejos" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter>
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
  </filter>
  <!-- Relieve iluminado: un mapa de alturas de ruido, iluminado desde arriba a la izquierda, multiplica el
       color. Da a la tierra sus grumos y a las hojas su superficie, con luz y sombra en cada detalle. -->
  <filter id="tierraRelieve" filterUnits="userSpaceOnUse" x="0" y="0" width="${LADO}" height="${LADO}" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="5" seed="12" result="alturas"/>
    <feDiffuseLighting in="alturas" surfaceScale="13" diffuseConstant="1.72" lighting-color="#FFFFFF" result="luz"><feDistantLight azimuth="225" elevation="42"/></feDiffuseLighting>
    <feSpecularLighting in="alturas" surfaceScale="13" specularConstant="0.45" specularExponent="22" lighting-color="#FFF4E6" result="brilloTierra"><feDistantLight azimuth="225" elevation="42"/></feSpecularLighting>
    <feComposite in="luz" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="sombreado"/>
    <feComposite in="brilloTierra" in2="sombreado" operator="arithmetic" k1="0" k2="0.35" k3="1" k4="0" result="conBrillo"/>
    <feComposite in="conBrillo" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="hojaRelieve" filterUnits="userSpaceOnUse" x="0" y="0" width="${LADO}" height="${LADO}" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.34 0.24" numOctaves="2" seed="4" result="alturas"/>
    <feDiffuseLighting in="alturas" surfaceScale="0.9" diffuseConstant="1.16" lighting-color="#FFFFFF" result="luz"><feDistantLight azimuth="225" elevation="62"/></feDiffuseLighting>
    <feSpecularLighting in="alturas" surfaceScale="0.9" specularConstant="0.4" specularExponent="24" lighting-color="#F6FFE8" result="brilloHoja"><feDistantLight azimuth="225" elevation="62"/></feSpecularLighting>
    <feComposite in="luz" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="sombreado"/>
    <feComposite in="brilloHoja" in2="sombreado" operator="arithmetic" k1="0" k2="0.1" k3="1" k4="0" result="conBrillo"/>
    <feComposite in="conBrillo" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="perlitaRelieve" filterUnits="userSpaceOnUse" x="0" y="0" width="${LADO}" height="${LADO}" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="21" result="alturas"/>
    <feDiffuseLighting in="alturas" surfaceScale="1.2" diffuseConstant="1.12" lighting-color="#FFFFFF" result="luz"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>
    <feComposite in="luz" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="sombreado"/>
    <feComposite in="sombreado" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="cotRelieve" filterUnits="userSpaceOnUse" x="0" y="0" width="${LADO}" height="${LADO}" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.5 0.4" numOctaves="2" seed="6" result="alturas"/>
    <feDiffuseLighting in="alturas" surfaceScale="0.8" diffuseConstant="1.14" lighting-color="#FFFFFF" result="luz"><feDistantLight azimuth="225" elevation="65"/></feDiffuseLighting>
    <feComposite in="luz" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="sombreado"/>
    <feComposite in="sombreado" in2="SourceAlpha" operator="in"/>
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
  u.cotiledones.forEach((e, i) => hoja(`cot${i}`, e, [C.cotBase, C.cotMedio, C.cotPunta], ['#30651F', '#538F31', '#71A947']));
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
  const { perlitas, fibras } = detallesTierra(suelo);
  const fibra = (f) => `<path d="M${f.x1} ${f.y1}Q${f.cx} ${f.cy} ${f.x2} ${f.y2}" fill="none" stroke="#8A6A4C" stroke-opacity="0.45" stroke-width="1.6" stroke-linecap="round"/>`;
  const grano = (t) => {
    const r = r1((t.rx + t.ry) * 0.55);
    return `<ellipse cx="${r1(t.x + 2)}" cy="${r1(t.y + r * 0.55)}" rx="${r1(r * 1.05)}" ry="${r1(r * 0.55)}" fill="#000" fill-opacity="0.55" filter="url(#desenfoqueTerron)"/><circle cx="${t.x}" cy="${t.y}" r="${r}" fill="url(#perlita)" filter="url(#perlitaRelieve)"/>`;
  };
  return `<rect width="${LADO}" height="${LADO}" fill="url(#suelo)" filter="url(#tierraRelieve)"/>
  <rect width="${LADO}" height="${LADO}" filter="url(#grano)" opacity="0.45"/>
  <rect width="${LADO}" height="${LADO}" filter="url(#granoClaro)" opacity="0.3"/>
  ${fibras.map(fibra).join('')}
  ${perlita ? perlitas.map(grano).join('') : ''}
  <path d="${trazoSuave(bordeTierra(suelo), false)}" fill="none" stroke="#7A5A40" stroke-opacity="0.12" stroke-width="2"/>`;
}

/** Tierra lejana: la misma tierra más arriba, desenfocada y un poco más oscura, detrás de la plántula. */
function tierraLejana(suelo) {
  const lejos = suelo - 150;
  return `<clipPath id="recorteLejana"><path d="${contornoTierra(lejos)}"/></clipPath>
<g filter="url(#desenfoqueLejos)"><g clip-path="url(#recorteLejana)">${capasTierra(lejos, { perlita: true })}<rect width="${LADO}" height="${LADO}" fill="#000" fill-opacity="0.22"/></g></g>`;
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
function hoja(e, id, recorte, k, { venas = true, pliegue = true, brillo = false, sombraBorde = 0.45, pelos = 0.22, relieve = 'hojaRelieve' } = {}) {
  // Superficie con relieve iluminado (la textura de la hoja).
  const relleno = pliegue
    ? `<path d="${trazo(e.mitadSombra)}" fill="url(#${id}Sombra)"/><path d="${trazo(e.mitadLuz)}" fill="url(#${id}Luz)"/>`
    : `<path d="${trazo(e.contorno)}" fill="url(#${id}Luz)"/>`;
  const partes = [`<g filter="url(#${relieve})">${relleno}</g>`];
  if (brillo) {
    const [bx, by] = e.brillo;
    const [x0, y0] = e.base;
    const [x1, y1] = e.puntaHoja;
    const giro = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const largo = Math.hypot(x1 - x0, y1 - y0);
    partes.push(
      `<ellipse cx="${r1(bx)}" cy="${r1(by)}" rx="${r1(largo * 0.3)}" ry="${r1(largo * 0.1)}" transform="rotate(${r1(giro)} ${r1(bx)} ${r1(by)})" fill="#F4FFE0" fill-opacity="0.14" filter="url(#desenfoqueBrillo)" clip-path="url(#${recorte})"/>`,
    );
  }
  if (venas && e.venas.length) {
    partes.push(
      e.venas
        .map((v) => `<path d="${trazo(v, false)}" stroke="${COLORES.nervio}" stroke-opacity="0.26" stroke-width="${r1(1.7 * k)}" stroke-linecap="round" fill="none"/>`)
        .join(''),
    );
  }
  partes.push(
    // Canaleta del nervio: una línea oscura más ancha debajo de la clara.
    `<path d="${trazo(e.nervio, false)}" stroke="${COLORES.bordeHoja}" stroke-opacity="${venas ? 0.3 : 0.15}" stroke-width="${r1((venas ? 7.5 : 5) * k)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    `<path d="${trazo(e.nervio, false)}" stroke="${COLORES.nervio}" stroke-opacity="${venas ? 0.38 : 0.2}" stroke-width="${r1((venas ? 3.2 : 2.6) * k)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    // Sombra interior: el borde un poco más oscuro, como el volumen de una hoja real.
    `<g clip-path="url(#${recorte})"><path d="${trazo(e.contorno)}" fill="none" stroke="${COLORES.bordeHoja}" stroke-opacity="${sombraBorde}" stroke-width="${r1(9 * k)}" filter="url(#desenfoqueBorde)"/></g>`,
    `<path d="${trazo(e.contorno)}" fill="none" stroke="${COLORES.pelusa}" stroke-opacity="0.22" stroke-width="${r1(2 * k)}" stroke-linejoin="round" filter="url(#pelusa)"/>`,
    pelitos(densificar(e.contorno, 3 * k), k, { cada: 1, largo: 2.2, ancho: 0.55, opacidad: pelos }),
  );
  return partes.join('\n');
}

/** Agrega puntos intermedios a un contorno cerrado, cada `paso` como máximo. */
function densificar(pts, paso) {
  const salida = [];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / paso));
    for (let j = 0; j < n; j++) salida.push([x1 + ((x2 - x1) * j) / n, y1 + ((y2 - y1) * j) / n]);
  }
  return salida;
}

/**
 * Pelitos (tricomas) a lo largo de un contorno: trazos cortos y claros hacia afuera, como la pelusa del
 * tallo y de los bordes de la foto. Deterministas: dependen solo de la posición de cada punto.
 */
function pelitos(pts, k, { cada = 2, largo = 5, ancho = 0.9, opacidad = 0.35 } = {}) {
  let cx = 0;
  let cy = 0;
  for (const [x, y] of pts) {
    cx += x / pts.length;
    cy += y / pts.length;
  }
  const trazos = [];
  for (let i = 0; i < pts.length; i += cada) {
    const [x, y] = pts[i];
    const [ax, ay] = pts[(i + pts.length - 1) % pts.length];
    const [bx, by] = pts[(i + 1) % pts.length];
    let nx = by - ay;
    let ny = -(bx - ax);
    const n = Math.hypot(nx, ny) || 1;
    nx /= n;
    ny /= n;
    // Hacia afuera de la forma.
    if (nx * (x - cx) + ny * (y - cy) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const variacion = 0.6 + ((Math.abs(Math.sin(x * 12.9898 + y * 78.233)) * 43758.5453) % 1) * 0.8;
    const l = largo * k * variacion;
    // Inclinación variable, un poco hacia arriba, como los pelos que buscan la luz.
    const giro = (variacion - 1) * 0.9;
    const gx = nx * Math.cos(giro) - ny * Math.sin(giro);
    const gy = nx * Math.sin(giro) + ny * Math.cos(giro);
    trazos.push(`M${r1(x)} ${r1(y)}l${r1(gx * l)} ${r1(gy * l - l * 0.3)}`);
  }
  return `<path d="${trazos.join('')}" stroke="${COLORES.pelusa}" stroke-opacity="${opacidad}" stroke-width="${r1(ancho * k)}" stroke-linecap="round" fill="none"/>`;
}

/** Siluetas de la plántula (para la sombra y el ícono monocromático). */
const formas = (u) => [u.tallo, ...u.cotiledones.map((e) => e.contorno), ...u.hojas.map((e) => e.contorno), ...u.brote.map((e) => e.contorno)];

/** La plántula ya ubicada (ver geometria.ubicar), sin la tierra. */
function planta(u) {
  const k = u.escala;
  const nc = u.cotiledones.length;
  const nh = u.hojas.length;
  return [
    `<g filter="url(#hojaRelieve)"><path d="${trazo(u.tallo)}" fill="url(#tallo)"/></g>`,
    `<path d="${trazo(u.tallo)}" fill="url(#talloSombra)"/>`,
    `<path d="${trazo(u.tallo)}" fill="none" stroke="${COLORES.pelusa}" stroke-opacity="0.35" stroke-width="${r1(2 * k)}" filter="url(#pelusa)"/>`,
    pelitos(densificar(u.tallo, 3.5 * k), k, { cada: 1, largo: 3.4, ancho: 0.65, opacidad: 0.34 }),
    ...u.cotiledones.map((e, i) => hoja(e, `cot${i}`, `forma${i}`, k, { venas: false, pliegue: true, brillo: true, sombraBorde: 0.18, pelos: 0.18, relieve: 'cotRelieve' })),
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
    escena = [fondo(), tierraLejana(suelo), u ? sombraPlanta(u) + planta(u) : '', tierra(suelo), u ? sombraContacto(u) : '', `<rect width="${LADO}" height="${LADO}" fill="url(#vineta)"/>`].join('\n');
  } else {
    escena = [planta(u), parcheTierra(u), sombraContacto(u)].join('\n');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}">\n${defs}\n${redondeado ? `<g clip-path="url(#esquinas)">${escena}</g>` : escena}\n</svg>\n`;
}

module.exports = { LADO, COLORES, svg };
