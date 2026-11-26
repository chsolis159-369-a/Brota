/**
 * Geometría de la marca de BROTA (D-28): una plántula de cannabis de costado, saliendo de la tierra,
 * como en la foto de referencia del usuario: tallo fino, dos cotiledones redondeados abiertos a los
 * costados, el primer par de hojas verdaderas (una sola hoja dentada cada una, larga, abierta en V) y el
 * brote nuevo en el centro. Funciones puras: devuelven listas de puntos [x, y] (y crece hacia abajo).
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
function hojaDentada(L, W, { dientes = 9, serr = 0.24, p = 0.72, q = 1.05, t0 = 0.12, t1 = 0.9 } = {}) {
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
function cotiledon(L, W, { p = 1.2, q = 0.5 } = {}) {
  const h = perfil(p, q);
  const lado = [];
  for (let i = 0; i <= 32; i++) lado.push([i / 32, h(i / 32)]);
  return simetrico(lado, L, W);
}

/** Curva una hoja a lo largo de su eje: corre los puntos de costado, más cuanto más cerca de la punta. */
function curvar(pts, L, c) {
  return pts.map(([x, y]) => [x + c * L * Math.pow(Math.max(0, -y) / L, 2), y]);
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
 * Plántula de costado con la base del tallo en (0,0), a ras de la tierra.
 * Ángulos en grados desde la vertical (positivos a la derecha). `curva` > 0 levanta las puntas.
 */
function plantula({
  nodoCot = -165,
  nodoHojas = -240,
  cotiledones = { ang: 82, largo: 210, ancho: 0.26, curva: 0.14 },
  hojas = { ang: 62, largo: 310, ancho: 0.15, curva: 0.08, dientes: 9 },
  brote = [
    [-9, 92],
    [11, 80],
  ],
  grosor = [17, 10],
} = {}) {
  const [gBase, gArriba] = grosor;
  // El pie del tallo termina apenas bajo la tierra: el montículo de adelante lo tapa entero.
  const tallo = [
    [-gBase / 2, 8],
    [-gArriba / 2 - 1, nodoCot],
    [-gArriba / 2, nodoHojas],
    [0, nodoHojas - 8],
    [gArriba / 2, nodoHojas],
    [gArriba / 2 + 1, nodoCot],
    [gBase / 2, 8],
  ];
  // Cada hoja se dibuja apuntando hacia arriba, se curva y se rota a su lado; la del lado izquierdo se
  // curva al revés para que las dos levanten la punta.
  const par = ({ ang, largo, ancho, curva }, forma, y) =>
    [-ang, ang].map((a) => {
      const contorno = mover(curvar(forma(largo, largo * ancho), largo, a > 0 ? -curva : curva), a, ...punta(a, 3, 0, y));
      const eje = mover(curvar([[0, -largo * 0.04], [0, -largo * 0.3], [0, -largo * 0.6], [0, -largo * 0.86]], largo, a > 0 ? -curva : curva), a, ...punta(a, 3, 0, y));
      return { contorno, nervio: eje };
    });
  return {
    tallo,
    cotiledones: par(cotiledones, (L, W) => cotiledon(L, W), nodoCot),
    hojas: par(hojas, (L, W) => hojaDentada(L, W, { dientes: hojas.dientes }), nodoHojas),
    brote: brote.map(([a, L]) => mover(hojaDentada(L, L * 0.17, { dientes: 5, serr: 0.2 }), a, 0, nodoHojas - 4)),
    base: [0, 0],
  };
}

function caja(p) {
  const todos = [...p.tallo, ...p.cotiledones.flatMap((e) => e.contorno), ...p.hojas.flatMap((e) => e.contorno), ...p.brote.flat()];
  const xs = todos.map((q) => q[0]);
  const ys = todos.map((q) => q[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/**
 * Ubica la plántula: centrada en x = cx, con la punta más alta en `arriba` y la base del tallo en
 * `suelo` (la escala sale de esas dos alturas).
 */
function ubicar(p, cx, arriba, suelo) {
  const b = caja(p);
  const k = (suelo - arriba) / (0 - b.y0);
  const dx = cx - ((b.x0 + b.x1) / 2) * k;
  const dy = suelo;
  const t = (pts) => pts.map(([x, y]) => [x * k + dx, y * k + dy]);
  const e = (x) => ({ contorno: t(x.contorno), nervio: t(x.nervio) });
  return {
    escala: k,
    tallo: t(p.tallo),
    cotiledones: p.cotiledones.map(e),
    hojas: p.hojas.map(e),
    brote: p.brote.map(t),
    base: t([p.base])[0],
    ancho: (b.x1 - b.x0) * k,
  };
}

/** Trazo SVG de una lista de puntos. */
const trazo = (pts, cerrar = true) => 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + (cerrar ? 'Z' : '');

module.exports = { r1, plantula, ubicar, trazo };
