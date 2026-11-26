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
 * de golpe al valle. Para que no parezca recortada: cada mitad tiene su ancho (la hoja se ve un poco de
 * costado), el borde ondula apenas y los dientes varían en tamaño y separación.
 * Devuelve el contorno, las dos mitades y las nervaduras que van del nervio a cada diente.
 */
function hojaDentada(L, W, { dientes = 9, serr = 0.22, p = 0.82, q = 0.95, t0 = 0.1, t1 = 0.9, anchoDer = 1, anchoIzq = 1, ondula = 0.05, rnd = null } = {}) {
  const h = perfil(p, q);
  const r = rnd ?? (() => 0.5);
  const fase = r() * Math.PI * 2;
  const onda = (t, signo) => 1 + ondula * Math.sin(2 * Math.PI * 1.4 * t + fase + (signo > 0 ? 0 : 1.7));
  // Posiciones de los dientes con un poco de desorden (sin cruzarse).
  const marcas = [];
  for (let k = 0; k <= dientes; k++) marcas.push(t0 + ((t1 - t0) * k) / dientes);
  for (let k = 1; k < dientes; k++) marcas[k] += ((t1 - t0) / dientes) * (r() - 0.5) * 0.35;
  const lado = (signo) => {
    const pts = [];
    const puntas = [];
    for (let i = 0; i < 6; i++) pts.push([(t0 * i) / 6, h((t0 * i) / 6)]);
    for (let k = 0; k < dientes; k++) {
      const a = marcas[k];
      const b = marcas[k + 1];
      const v = 0.8 + r() * 0.4;
      pts.push([a, h(a) * (1 - serr * v) * onda(a, signo)]);
      const tp = a + 0.8 * (b - a);
      pts.push([tp, h(tp) * (1 + serr * 0.12) * onda(tp, signo)]);
      puntas.push([tp, h(tp) * onda(tp, signo)]);
    }
    for (let i = 0; i <= 6; i++) {
      const t = t1 + ((1 - t1) * i) / 6;
      pts.push([t, h(t) * (i === 0 ? 1 - serr : 1)]);
    }
    return { pts, puntas };
  };
  const ld = lado(1);
  const li = lado(-1);
  const der = ld.pts.map(([t, w]) => [W * anchoDer * w, -L * t]);
  const izq = li.pts.map(([t, w]) => [-W * anchoIzq * w, -L * t]);
  const contorno = der.concat(izq.slice(0, -1).reverse());
  const vena = (signo, ancho) => ([t, w]) => [
    [0, -L * (t - 0.11)],
    [signo * W * ancho * w * 0.9, -L * t],
  ];
  const venas = [
    ...ld.puntas.filter(([t]) => t > 0.18 && t < 0.86).map(vena(1, anchoDer)),
    ...li.puntas.filter(([t]) => t > 0.18 && t < 0.86).map(vena(-1, anchoIzq)),
  ];
  return { contorno, mitadDer: der.concat(ejeBajando(L)), mitadIzq: izq.concat(ejeBajando(L)), venas };
}

/** Cotiledón: hoja lisa y ovalada, angosta en la base y de punta redonda, con mitades de distinto ancho. */
function cotiledon(L, W, { p = 1.2, q = 0.5, anchoDer = 1, anchoIzq = 1 } = {}) {
  const h = perfil(p, q);
  const lado = [];
  for (let i = 0; i <= 32; i++) lado.push([i / 32, h(i / 32)]);
  const der = lado.map(([t, w]) => [W * anchoDer * w, -L * t]);
  const izq = lado.map(([t, w]) => [-W * anchoIzq * w, -L * t]);
  return { contorno: der.concat(izq.slice(0, -1).reverse()), mitadDer: der.concat(ejeBajando(L)), mitadIzq: izq.concat(ejeBajando(L)), venas: [] };
}

/**
 * Curva una hoja a lo largo de su eje: `levanta` corre la punta hacia un costado (más cuanto más cerca de
 * la punta) y `arco` la abomba en el medio. El signo lo pone quien la ubica, según el lado.
 */
function curvar(pts, L, levanta, arco) {
  return pts.map(([x, y]) => {
    const t = Math.min(1, Math.max(0, -y / L));
    return [x + L * (levanta * t * t + arco * Math.sin(Math.PI * t)), y];
  });
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
 * Plántula de costado con la base del tallo en (0,0), a ras de la tierra, como en la foto de referencia.
 * Cada hoja tiene sus propios valores (nada es un espejo perfecto): ángulo en grados desde la vertical
 * (positivo a la derecha), largo, ancho relativo, `levanta` (> 0: la punta sube; < 0: cae) y `arco`
 * (> 0: se abomba hacia arriba).
 */
function plantula({
  nodoCot = -165,
  nodoHojas = -256,
  cotiledones = [
    { ang: -70, largo: 182, ancho: 0.29, levanta: -0.08, arco: 0.04 },
    { ang: 73, largo: 189, ancho: 0.285, levanta: -0.09, arco: 0.035 },
  ],
  hojas = [
    { ang: -50, largo: 292, ancho: 0.195, levanta: -0.07, arco: 0.05, dientes: 11 },
    { ang: 47, largo: 304, ancho: 0.19, levanta: -0.06, arco: 0.055, dientes: 12 },
  ],
  brote = [
    { ang: -5, largo: 128, levanta: -0.1 },
    { ang: 8, largo: 112, levanta: -0.12 },
  ],
  grosor = [19, 14],
  inclinacion = 0.035,
  semilla = 7,
} = {}) {
  const rnd = azar(semilla);
  const [gBase, gArriba] = grosor;
  // Tallo con una leve inclinación (nada crece a plomo). El pie termina apenas bajo la tierra.
  const H = -nodoHojas;
  const centro = (y) => inclinacion * H * Math.pow(Math.max(0, -y) / H, 2);
  const alturas = [8, 0, -40, -80, -120, nodoCot, -200, nodoHojas];
  const ancho = (y) => gBase + (gArriba - gBase) * Math.min(1, Math.max(0, -y / H));
  const tallo = [
    ...alturas.map((y) => [centro(y) - ancho(y) / 2, y]),
    [centro(nodoHojas), nodoHojas - 8],
    ...alturas
      .slice()
      .reverse()
      .map((y) => [centro(y) + ancho(y) / 2, y]),
  ];
  // Cada hoja se dibuja apuntando hacia arriba, se curva y se rota a su lado. Del lado derecho, "arriba"
  // es -x en las coordenadas de la hoja; del izquierdo, +x. La mitad de arriba es la iluminada y, como la
  // hoja se ve un poco de costado, la más ancha.
  const ubicarHoja = (hacer, e, y) => {
    const a = e.ang;
    const signo = a > 0 ? -1 : 1;
    const partes = hacer(a > 0 ? { anchoIzq: 1, anchoDer: 0.88 } : { anchoIzq: 0.88, anchoDer: 1 });
    const [ox, oy] = punta(a, 3, centro(y), y);
    const tf = (pts) => mover(curvar(pts, e.largo, signo * (e.levanta ?? 0), signo * (e.arco ?? 0)), a, ox, oy);
    return {
      contorno: tf(partes.contorno),
      mitadLuz: tf(a > 0 ? partes.mitadIzq : partes.mitadDer),
      mitadSombra: tf(a > 0 ? partes.mitadDer : partes.mitadIzq),
      venas: partes.venas.map(tf),
      nervio: tf(Array.from({ length: 10 }, (_, i) => [0, -e.largo * (0.03 + (0.85 * i) / 9)])),
      base: tf([[0, 0]])[0],
      puntaHoja: tf([[0, -e.largo]])[0],
      // Brillo de los cotiledones: un poco más allá de la mitad, sobre la mitad iluminada.
      brillo: tf([[signo * e.largo * 0.07, -e.largo * 0.6]])[0],
    };
  };
  return {
    tallo,
    cotiledones: cotiledones.map((e) => ubicarHoja((anchos) => cotiledon(e.largo, e.largo * e.ancho, anchos), e, nodoCot)),
    hojas: hojas.map((e) => ubicarHoja((anchos) => hojaDentada(e.largo, e.largo * e.ancho, { dientes: e.dientes, rnd, ...anchos }), e, nodoHojas)),
    brote: brote.map((e) => ubicarHoja((anchos) => hojaDentada(e.largo, e.largo * 0.2, { dientes: 6, serr: 0.2, ondula: 0.03, rnd, ...anchos }), e, nodoHojas - 4)),
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
function detallesTierra(suelo, { terrones = 60, perlitas = 10, fibras = 14, semilla = 23 } = {}) {
  const rnd = azar(semilla);
  const lista = (n, rMin, rMax, margen) =>
    Array.from({ length: n }, () => {
      const x = rnd() * 1024;
      const arriba = arcoTierra(x, suelo) + margen;
      const y = arriba + rnd() * (1024 - arriba);
      const r = rMin + rnd() * (rMax - rMin);
      const lados = 7 + Math.floor(rnd() * 3);
      const forma = Array.from({ length: lados }, (_, i) => {
        const ang = (i / lados) * Math.PI * 2;
        const rr = r * (0.65 + rnd() * 0.6);
        return [r1(x + Math.cos(ang) * rr * 1.25), r1(y + Math.sin(ang) * rr * 0.8)];
      });
      return { x: r1(x), y: r1(y), rx: r1(r * (1 + rnd() * 0.6)), ry: r1(r * (0.55 + rnd() * 0.3)), giro: r1(rnd() * 180 - 90), claro: rnd() < 0.45, forma };
    });
  const fibra = () => {
    const x = rnd() * 1024;
    const y = arcoTierra(x, suelo) + 18 + rnd() * (1024 - arcoTierra(x, suelo) - 18);
    const largo = 18 + rnd() * 30;
    const ang = rnd() * Math.PI;
    const dx = Math.cos(ang) * largo;
    const dy = Math.sin(ang) * largo * 0.5;
    return { x1: r1(x), y1: r1(y), cx: r1(x + dx / 2 + (rnd() - 0.5) * 14), cy: r1(y + dy / 2 + (rnd() - 0.5) * 10), x2: r1(x + dx), y2: r1(y + dy) };
  };
  return { terrones: lista(terrones, 5, 18, 12), perlitas: lista(perlitas, 8, 15, 22), fibras: Array.from({ length: fibras }, fibra) };
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
