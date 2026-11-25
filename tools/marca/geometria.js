/**
 * Geometría de la marca de BROTA (D-28): plántula de cannabis con cotiledones y hojas palmeadas de
 * foliolos dentados. Funciones puras: devuelven listas de puntos [x, y] (y crece hacia abajo).
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
 * Foliolo con la base en (0,0) y la punta en (0,-L). Los dientes miran hacia la punta, como en la hoja
 * de cannabis: el borde sube despacio hasta la punta del diente y vuelve de golpe al valle.
 */
function foliolo(L, W, { dientes = 11, serr = 0.17, p = 0.72, q = 1.2, t0 = 0.12, t1 = 0.92 } = {}) {
  const h = perfil(p, q);
  const lado = [];
  for (let i = 0; i < 6; i++) lado.push([(t0 * i) / 6, h((t0 * i) / 6)]);
  const dt = (t1 - t0) / dientes;
  for (let k = 0; k < dientes; k++) {
    const a = t0 + k * dt;
    lado.push([a, h(a) * (1 - serr)]);
    const tp = a + 0.8 * dt;
    lado.push([tp, h(tp) * (1 + serr * 0.15)]);
  }
  for (let i = 0; i <= 6; i++) {
    const t = t1 + ((1 - t1) * i) / 6;
    lado.push([t, h(t) * (i === 0 ? 1 - serr : 1)]);
  }
  return simetrico(lado, L, W);
}

/** Cotiledón: hoja lisa y ovalada, de punta redonda. */
function cotiledon(L, W, { p = 1.15, q = 0.55 } = {}) {
  const h = perfil(p, q);
  const lado = [];
  for (let i = 0; i <= 28; i++) lado.push([i / 28, h(i / 28)]);
  return simetrico(lado, L, W);
}

/** Rota en sentido horario `ang` grados (0 = hacia arriba) y traslada a (x, y). */
function mover(pts, ang, x, y) {
  const a = (ang * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
}

const punta = (ang, largo, x, y) => mover([[0, -largo]], ang, x, y)[0];

const FOLIOLOS = {
  3: [
    [0, 1],
    [-34, 0.78],
    [34, 0.78],
  ],
  5: [
    [0, 1],
    [-31, 0.8],
    [31, 0.8],
    [-62, 0.44],
    [62, 0.44],
  ],
  7: [
    [0, 1],
    [-25, 0.86],
    [25, 0.86],
    [-52, 0.62],
    [52, 0.62],
    [-80, 0.34],
    [80, 0.34],
  ],
};

/** Hoja palmeada: foliolos en abanico desde el extremo del pecíolo. */
function hojaPalmeada(ang, x, y, L, { n = 5, ancho = 0.13, dientes = 11 } = {}) {
  return FOLIOLOS[n].map(([d, k]) => ({
    contorno: mover(foliolo(L * k, L * k * ancho, { dientes: Math.max(5, Math.round(dientes * Math.sqrt(k))) }), ang + d, x, y),
    nervio: [[x, y], punta(ang + d, L * k * 0.88, x, y)],
  }));
}

/**
 * Plántula en coordenadas propias (base del tallo en 0,0).
 * - par: par de hojas opuestas de `n` foliolos y un brote en el ápice.
 * - central: una hoja de `n` foliolos de frente, arriba del tallo.
 */
function plantula({ forma = 'par', n = 5, angulo = 47, largoHoja = 232, anchoFoliolo = 0.13, nodoCot = -92, nodoHojas = -188, apice = -232, cot = [104, 40, 62] } = {}) {
  const tallo = [
    [-12, 10],
    [-8.5, nodoCot],
    [-7, apice + 6],
    [0, apice - 4],
    [7, apice + 6],
    [8.5, nodoCot],
    [12, 10],
  ];
  const [largoCot, anchoCot, angCot] = cot;
  const cotiledones = [-angCot, angCot].map((ang) => mover(cotiledon(largoCot, anchoCot), ang, 0, nodoCot));
  let hojas;
  let peciolos;
  if (forma === 'par') {
    const pecioloL = 26;
    hojas = [-angulo, angulo].flatMap((ang) => {
      const [px, py] = punta(ang, pecioloL, 0, nodoHojas);
      return hojaPalmeada(ang, px, py, largoHoja, { n });
    });
    peciolos = [-angulo, angulo].map((ang) => [[0, nodoHojas], punta(ang, pecioloL + 6, 0, nodoHojas)]);
    hojas = hojas.concat(hojaPalmeada(0, 0, apice + 2, largoHoja * 0.35, { n: 3, ancho: 0.15, dientes: 6 }));
  } else {
    hojas = hojaPalmeada(0, 0, apice + 4, largoHoja, { n, ancho: anchoFoliolo });
    peciolos = [];
  }
  return { tallo, cotiledones, hojas, peciolos, suelo: { cx: 0, cy: 16, rx: 170, ry: 22 } };
}

function caja(p) {
  const todos = [
    ...p.tallo,
    ...p.cotiledones.flat(),
    ...p.hojas.flatMap((h) => h.contorno),
    [p.suelo.cx - p.suelo.rx, p.suelo.cy + p.suelo.ry],
    [p.suelo.cx + p.suelo.rx, p.suelo.cy - p.suelo.ry],
  ];
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
  return {
    escala: k,
    tallo: t(p.tallo),
    cotiledones: p.cotiledones.map(t),
    hojas: p.hojas.map((h) => ({ contorno: t(h.contorno), nervio: t(h.nervio) })),
    peciolos: p.peciolos.map(t),
    suelo: { cx: p.suelo.cx * k + dx, cy: p.suelo.cy * k + dy, rx: p.suelo.rx * k, ry: p.suelo.ry * k },
  };
}

/** Trazo SVG de una lista de puntos. */
const trazo = (pts, cerrar = true) => 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + (cerrar ? 'Z' : '');

module.exports = { r1, plantula, ubicar, trazo };
