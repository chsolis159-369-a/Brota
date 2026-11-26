/**
 * Geometría de la marca de BROTA (D-28): una plántula de cannabis de costado, saliendo de la tierra,
 * como en la foto de referencia del usuario: tallo fino, dos cotiledones redondeados abiertos a los
 * costados, el primer par de hojas verdaderas (una sola hoja dentada cada una, larga, abierta en V) y el
 * brote nuevo en el centro. Para un acabado realista, cada hoja trae sus dos mitades (el pliegue del
 * nervio), las nervaduras laterales y los puntos para los degradés de luz.
 * Funciones puras y deterministas: devuelven listas de puntos [x, y] (y crece hacia abajo).
 */

const r1 = (n) => Math.round(n * 10) / 10;

/** Azar con semilla fija (mulberry32): el dibujo sale siempre igual. */
function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Perfil del borde de una hoja: 0 en la base y en la punta, 1 en lo más ancho. */
function perfil(p, q) {
  const f = (t) => Math.pow(Math.sin(Math.PI * Math.pow(t, p)), q);
  let max = 0;
  for (let i = 0; i <= 400; i++) max = Math.max(max, f(i / 400));
  return (t) => f(Math.min(1, Math.max(0, t))) / max;
}

/** Puntos del eje (nervio central) de la punta a la base, para cerrar cada mitad de la hoja. */
const ejeBajando = (L, n = 14) => Array.from({ length: n + 1 }, (_, i) => [0, -L * (1 - i / n)]);

/**
 * Hoja dentada con la base en (0,0) y la punta en (0,-L), separada en sus dos mitades. Los dientes miran
 * hacia la punta, como en la hoja de cannabis: el borde sube despacio hasta la punta del diente y vuelve
 * de golpe al valle. Devuelve el contorno, las dos mitades y las nervaduras que van del nervio a cada diente.
 */
function hojaDentada(L, W, { dientes = 9, serr = 0.24, p = 0.72, q = 1.05, t0 = 0.12, t1 = 0.9, rnd = null } = {}) {
  const h = perfil(p, q);
  const lado = [];
  const puntas = [];
  for (let i = 0; i < 6; i++) lado.push([(t0 * i) / 6, h((t0 * i) / 6)]);
  const dt = (t1 - t0) / dientes;
  for (let k = 0; k < dientes; k++) {
    // Un poco de variación en cada diente para que no parezca hecho con regla.
    const v = rnd ? 0.85 + rnd() * 0.3 : 1;
    const a = t0 + k * dt;
    lado.push([a, h(a) * (1 - serr * v)]);
    const tp = a + 0.8 * dt;
    lado.push([tp, h(tp) * (1 + serr * 0.12)]);
    puntas.push([tp, h(tp)]);
  }
  for (let i = 0; i <= 6; i++) {
    const t = t1 + ((1 - t1) * i) / 6;
    lado.push([t, h(t) * (i === 0 ? 1 - serr : 1)]);
  }
  const der = lado.map(([t, w]) => [W * w, -L * t]);
  const izq = lado.map(([t, w]) => [-W * w, -L * t]);
  const contorno = der.concat(izq.slice(0, -1).reverse());
  const venas = puntas
    .filter(([t]) => t > 0.18 && t < 0.86)
    .flatMap(([t, w]) => [
      [
        [0, -L * (t - 0.11)],
        [W * w * 0.9, -L * t],
      ],
      [
        [0, -L * (t - 0.11)],
        [-W * w * 0.9, -L * t],
      ],
    ]);
  return { contorno, mitadDer: der.concat(ejeBajando(L)), mitadIzq: izq.concat(ejeBajando(L)), venas };
}

/** Cotiledón: hoja lisa y ovalada, angosta en la base y de punta redonda. */
function cotiledon(L, W, { p = 1.2, q = 0.5 } = {}) {
  const h = perfil(p, q);
  const lado = [];
  for (let i = 0; i <= 32; i++) lado.push([i / 32, h(i / 32)]);
  const der = lado.map(([t, w]) => [W * w, -L * t]);
  const izq = lado.map(([t, w]) => [-W * w, -L * t]);
  return { contorno: der.concat(izq.slice(0, -1).reverse()), mitadDer: der.concat(ejeBajando(L)), mitadIzq: izq.concat(ejeBajando(L)), venas: [] };
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
  semilla = 7,
} = {}) {
  const rnd = azar(semilla);
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
  // curva al revés para que las dos levanten la punta. `arriba` dice qué mitad mira hacia la luz.
  const ubicarHoja = (partes, a, largo, curva, y) => {
    const c = a > 0 ? -curva : curva;
    const [ox, oy] = punta(a, 3, 0, y);
    const tf = (pts) => mover(curvar(pts, largo, c), a, ox, oy);
    return {
      contorno: tf(partes.contorno),
      mitadLuz: tf(a > 0 ? partes.mitadIzq : partes.mitadDer),
      mitadSombra: tf(a > 0 ? partes.mitadDer : partes.mitadIzq),
      venas: partes.venas.map(tf),
      nervio: tf([
        [0, -largo * 0.03],
        [0, -largo * 0.3],
        [0, -largo * 0.6],
        [0, -largo * 0.88],
      ]),
      base: tf([[0, 0]])[0],
      puntaHoja: tf([[0, -largo]])[0],
      // Brillo de los cotiledones: un poco más allá de la mitad, sobre la mitad iluminada.
      brillo: tf([[a > 0 ? -largo * 0.07 : largo * 0.07, -largo * 0.6]])[0],
    };
  };
  const par = ({ ang, largo, ancho, curva, dientes }, hacer, y) => [-ang, ang].map((a) => ubicarHoja(hacer(largo, largo * ancho, dientes), a, largo, curva, y));
  return {
    tallo,
    cotiledones: par(cotiledones, (L, W) => cotiledon(L, W), nodoCot),
    hojas: par(hojas, (L, W, n) => hojaDentada(L, W, { dientes: n, rnd }), nodoHojas),
    brote: brote.map(([a, L]) => ubicarHoja(hojaDentada(L, L * 0.17, { dientes: 5, serr: 0.2 }), a, L, 0, nodoHojas - 4)),
    base: [0, 0],
  };
}

function caja(p) {
  const todos = [...p.tallo, ...p.cotiledones.flatMap((e) => e.contorno), ...p.hojas.flatMap((e) => e.contorno), ...p.brote.flatMap((e) => e.contorno)];
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
  const pt = ([x, y]) => [x * k + dx, y * k + dy];
  const e = (x) => ({
    contorno: t(x.contorno),
    mitadLuz: t(x.mitadLuz),
    mitadSombra: t(x.mitadSombra),
    venas: x.venas.map(t),
    nervio: t(x.nervio),
    base: pt(x.base),
    puntaHoja: pt(x.puntaHoja),
    brillo: pt(x.brillo),
  });
  return {
    escala: k,
    tallo: t(p.tallo),
    cotiledones: p.cotiledones.map(e),
    hojas: p.hojas.map(e),
    brote: p.brote.map(e),
    base: pt(p.base),
  };
}

/**
 * Tierra con el borde irregular: una loma suave que llega a `suelo` en el centro, con ondulaciones y
 * terrones chicos, de x0 a x1. Devuelve los puntos del borde (izquierda a derecha).
 */
/** Altura del borde de la tierra en x: `suelo` en el centro y `alto` más abajo en los costados. */
const arcoTierra = (x, suelo, alto = 46) => suelo + alto * Math.pow((2 * x) / 1024 - 1, 2);

function bordeTierra(suelo, { x0 = 0, x1 = 1024, alto = 52, semilla = 11 } = {}) {
  const rnd = azar(semilla);
  const n = 64;
  const pts = [];
  let ruido = 0;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    ruido = ruido * 0.6 + (rnd() - 0.5) * 9;
    const terron = rnd() < 0.26 ? -rnd() * 13 : 0;
    pts.push([x, arcoTierra(x, suelo, alto) + ruido + terron]);
  }
  return pts;
}

/** Terrones y granitos de perlita repartidos bajo el borde de la tierra (semilla fija). */
function detallesTierra(suelo, { terrones = 70, perlitas = 11, semilla = 23 } = {}) {
  const rnd = azar(semilla);
  const lista = (n, rMin, rMax, margen) =>
    Array.from({ length: n }, () => {
      const x = rnd() * 1024;
      const arriba = arcoTierra(x, suelo) + margen;
      const y = arriba + rnd() * (1024 - arriba);
      const r = rMin + rnd() * (rMax - rMin);
      return { x: r1(x), y: r1(y), rx: r1(r * (1 + rnd() * 0.6)), ry: r1(r * (0.55 + rnd() * 0.3)), giro: r1(rnd() * 180 - 90), claro: rnd() < 0.45 };
    });
  return { terrones: lista(terrones, 4, 16, 14), perlitas: lista(perlitas, 6, 13, 22) };
}

/** Trazo SVG de una lista de puntos. */
const trazo = (pts, cerrar = true) => 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + (cerrar ? 'Z' : '');

/** Trazo suave (curvas cuadráticas por los puntos medios) para bordes orgánicos. */
function trazoSuave(pts, cerrar = true) {
  if (pts.length < 3) return trazo(pts, cerrar);
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += `Q${r1(x)} ${r1(y)} ${r1((x + nx) / 2)} ${r1((y + ny) / 2)}`;
  }
  const u = pts[pts.length - 1];
  d += `L${r1(u[0])} ${r1(u[1])}`;
  return d + (cerrar ? 'Z' : '');
}

module.exports = { r1, azar, plantula, ubicar, bordeTierra, detallesTierra, trazo, trazoSuave };
