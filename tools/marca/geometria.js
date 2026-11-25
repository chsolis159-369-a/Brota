/**
 * Geometría de la marca de BROTA (D-28): una plántula de cannabis vista desde arriba, como en la foto de
 * referencia del usuario: dos cotiledones lisos y ovalados, el primer par de hojas verdaderas (una sola
 * hoja dentada cada una, con su nervio) y el brote del centro. Funciones puras: devuelven listas de
 * puntos [x, y] (y crece hacia abajo).
 */

const r1 = (n) => Math.round(n * 10) / 10;

/** Perfil del borde de una hoja: 0 en la base y en la punta, 1 en lo más ancho. */
function perfil(p, q) {
  const f = (t) => Math.pow(Math.sin(Math.PI * Math.pow(t, p)), q);
  let max = 0;
  for (let i = 0; i <= 400; i++) max = Math.max(max, f(i / 400));
  return (t) => f(Math.min(1, Math.max(0, t))) / max;
}

/** Contorno simétrico a partir de una lista [t, ancho relativo] del lado derecho (base → punta). */
function simetrico(lado, L, W) {
  const der = lado.map(([t, w]) => [W * w, -L * t]);
  const izq = lado
    .slice(0, -1)
    .reverse()
    .map(([t, w]) => [-W * w, -L * t]);
  return der.concat(izq);
}

/**
 * Hoja dentada con la base en (0,0) y la punta en (0,-L). Los dientes miran hacia la punta, como en la
 * hoja de cannabis: el borde sube despacio hasta la punta del diente y vuelve de golpe al valle.
 */
function hojaDentada(L, W, { dientes = 8, serr = 0.22, p = 0.78, q = 0.95, t0 = 0.16, t1 = 0.9 } = {}) {
  const h = perfil(p, q);
  const lado = [];
  for (let i = 0; i < 6; i++) lado.push([(t0 * i) / 6, h((t0 * i) / 6)]);
  const dt = (t1 - t0) / dientes;
  for (let k = 0; k < dientes; k++) {
    const a = t0 + k * dt;
    lado.push([a, h(a) * (1 - serr)]);
    const tp = a + 0.8 * dt;
    lado.push([tp, h(tp) * (1 + serr * 0.12)]);
  }
  for (let i = 0; i <= 6; i++) {
    const t = t1 + ((1 - t1) * i) / 6;
    lado.push([t, h(t) * (i === 0 ? 1 - serr : 1)]);
  }
  return simetrico(lado, L, W);
}

/** Cotiledón: hoja lisa y ovalada, angosta en la base y de punta redonda. */
function cotiledon(L, W, { p = 1.3, q = 0.55 } = {}) {
  const h = perfil(p, q);
  const lado = [];
  for (let i = 0; i <= 32; i++) lado.push([i / 32, h(i / 32)]);
  return simetrico(lado, L, W);
}

/** Rota en sentido horario `ang` grados (0 = hacia arriba) y traslada a (x, y). */
function mover(pts, ang, x, y) {
  const a = (ang * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
}

const punta = (ang, largo, x = 0, y = 0) => mover([[0, -largo]], ang, x, y)[0];

/**
 * Plántula vista desde arriba, centrada en (0,0).
 * - cotiledones: [ángulo, largo] de cada uno; ancho relativo `anchoCot`.
 * - hojas: [ángulo, largo] de cada hoja verdadera; ancho relativo `anchoHoja`.
 * - brote: hojitas nuevas del centro, cruzadas con las verdaderas.
 */
function plantula({
  cotiledones = [
    [-74, 330],
    [106, 320],
  ],
  anchoCot = 0.3,
  hojas = [
    [22, 250],
    [-166, 232],
  ],
  anchoHoja = 0.24,
  dientes = 6,
  brote = [
    [-62, 70],
    [122, 64],
  ],
  centro = 20,
} = {}) {
  const base = 12;
  const elemento = (forma, ang, L) => ({
    contorno: mover(forma, ang, ...punta(ang, base)),
    nervio: [punta(ang, base + L * 0.06), punta(ang, base + L * 0.86)],
  });
  return {
    cotiledones: cotiledones.map(([ang, L]) => elemento(cotiledon(L, L * anchoCot), ang, L)),
    hojas: hojas.map(([ang, L]) => elemento(hojaDentada(L, L * anchoHoja, { dientes }), ang, L)),
    brote: brote.map(([ang, L]) => mover(hojaDentada(L, L * 0.22, { dientes: 4, serr: 0.18 }), ang, 0, 0)),
    centro: { cx: 0, cy: 0, r: centro },
  };
}

function caja(p) {
  const todos = [...p.cotiledones.flatMap((e) => e.contorno), ...p.hojas.flatMap((e) => e.contorno), ...p.brote.flat()];
  const xs = todos.map((q) => q[0]);
  const ys = todos.map((q) => q[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Ubica la plántula para que su caja quede centrada en (cx, cy) dentro del ancho y alto máximos. */
function ubicar(p, cx, cy, maxAncho, maxAlto) {
  const b = caja(p);
  const k = Math.min(maxAncho / (b.x1 - b.x0), maxAlto / (b.y1 - b.y0));
  const dx = cx - ((b.x0 + b.x1) / 2) * k;
  const dy = cy - ((b.y0 + b.y1) / 2) * k;
  const t = (pts) => pts.map(([x, y]) => [x * k + dx, y * k + dy]);
  const e = (x) => ({ contorno: t(x.contorno), nervio: t(x.nervio) });
  return {
    escala: k,
    cotiledones: p.cotiledones.map(e),
    hojas: p.hojas.map(e),
    brote: p.brote.map(t),
    centro: { cx: p.centro.cx * k + dx, cy: p.centro.cy * k + dy, r: p.centro.r * k },
  };
}

/** Trazo SVG de una lista de puntos. */
const trazo = (pts, cerrar = true) => 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + (cerrar ? 'Z' : '');

module.exports = { r1, plantula, ubicar, trazo };
