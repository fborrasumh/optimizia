/* ══ LABORATORIOS VISUALES (lógica pura; el dibujo está en app.js) ══
   · POLI: programa entero en 2 variables (máx c·x, Ax ≤ b, x ≥ 0 entera): región lineal, puntos enteros, envolvente convexa,
     cortes propuestos por el estudiante (validez comprobada contra TODOS los puntos enteros), cortes de Chvátal-Gomory
     a partir de multiplicadores u ≥ 0, y ramificación y acotación con su árbol (y predicción previa del estudiante).
   · COTAS: la «carrera de cotas» de tres métodos de descomposición sobre una misma instancia.
   · RESUELTOS: ejemplos resueltos con retirada gradual (los huecos aumentan si aciertas; se mantienen si fallas). ══ */
const POLI = [
  {id: 'P1', c: [5, 4], A: [[6, 4], [1, 2]], b: [24, 6], nom: L3('Producción con dos recursos', 'Production with two resources', 'Produção com dois recursos')},
  {id: 'P2', c: [0, 1], A: [[3, 2], [-3, 2]], b: [6, 0], nom: L3('El ejemplo clásico de Gomory', 'The classic Gomory example', 'O exemplo clássico de Gomory')},
  {id: 'P3', c: [2, 3], A: [[1, 3], [3, 2]], b: [9.5, 12.5], nom: L3('Dos restricciones fraccionarias', 'Two fractional constraints', 'Duas restrições fracionárias')},
  {id: 'P4', c: [1, 1], A: [[2, 5], [5, 2], [1, -1]], b: [16, 16, 2.5], nom: L3('Un rombo con muchos vértices fraccionarios', 'A rhombus with many fractional vertices', 'Um losango com muitos vértices fracionários')}
];
const POLI_BY = Object.fromEntries(POLI.map(p => [p.id, p]));
const CAJA = 8;
const filasPoli = (pr, cortes = []) => [...pr.A.map((a, i) => ({a, b: pr.b[i]})), ...cortes.map(c => ({a: c.a, b: c.b, corte: true}))];
function verticesPoli(filas) {
  const L = [...filas, {a: [-1, 0], b: 0}, {a: [0, -1], b: 0}, {a: [1, 0], b: CAJA}, {a: [0, 1], b: CAJA}];
  const dentro = p => L.every(f => f.a[0] * p[0] + f.a[1] * p[1] <= f.b + 1e-9);
  const pts = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const [a1, a2] = L[i].a, [b1, b2] = L[j].a, det = a1 * b2 - a2 * b1; if (Math.abs(det) < 1e-12) continue;
    const p = [(L[i].b * b2 - a2 * L[j].b) / det, (a1 * L[j].b - L[i].b * b1) / det];
    if (dentro(p) && !pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-9)) pts.push(p);
  }
  const cx = pts.reduce((s, p) => s + p[0], 0) / (pts.length || 1), cy = pts.reduce((s, p) => s + p[1], 0) / (pts.length || 1);
  return pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
}
const enterosPoli = filas => { const out = []; for (let x = 0; x <= CAJA; x++) for (let y = 0; y <= CAJA; y++) if (filas.every(f => f.a[0] * x + f.a[1] * y <= f.b + 1e-9)) out.push([x, y]); return out; };
function envolvente(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
function analizaPoli(id, cortes = []) {
  const pr = POLI_BY[id], F = filasPoli(pr, cortes), V = verticesPoli(F), E = enterosPoli(filasPoli(pr));
  const val = p => pr.c[0] * p[0] + pr.c[1] * p[1];
  const lp = V.reduce((m, p) => !m || val(p) > val(m) + 1e-9 ? p : m, null);
  const ip = E.reduce((m, p) => !m || val(p) > val(m) + 1e-9 ? p : m, null);
  const V0 = verticesPoli(filasPoli(pr)), lp0 = V0.reduce((m, p) => !m || val(p) > val(m) + 1e-9 ? p : m, null);
  const zLP = val(lp), zIP = val(ip), zLP0 = val(lp0);
  return {pr, filas: F, V, E, H: envolvente(E), lp, ip, zLP, zIP, zLP0, cerrado: zLP0 - zIP > 1e-9 ? (zLP0 - zLP) / (zLP0 - zIP) : 1, entero: Math.abs(lp[0] - Math.round(lp[0])) < 1e-9 && Math.abs(lp[1] - Math.round(lp[1])) < 1e-9};
}
/* validez de un corte a·x ≤ b: no puede eliminar ningún punto entero factible */
function validaCorte(id, a, b) { const E = enterosPoli(filasPoli(POLI_BY[id])); const malo = E.find(p => a[0] * p[0] + a[1] * p[1] > b + 1e-9); return malo ? {ok: false, punto: malo} : {ok: true}; }
/* corte de Chvátal-Gomory: ⌊uᵀA⌋ x ≤ ⌊uᵀb⌋ con u ≥ 0 (válido porque x ≥ 0) */
function corteCG(id, u, cortes = []) {
  const F = filasPoli(POLI_BY[id], cortes);
  if (u.length !== F.length || u.some(x => !(x >= 0))) return null;
  const a = [0, 1].map(k => Math.floor(F.reduce((s, f, i) => s + u[i] * f.a[k], 0) + 1e-9)), b = Math.floor(F.reduce((s, f, i) => s + u[i] * f.b, 0) + 1e-9);
  return {a, b};
}
/* ramificación y acotación en 2D con su árbol (cortes incluidos) */
function bbPoli(id, cortes = []) {
  const pr = POLI_BY[id], F = filasPoli(pr, cortes);
  const P = {n: 2, c: [-pr.c[0], -pr.c[1]], filas: F.map(f => ({a: [[0, f.a[0]], [1, f.a[1]]], s: '<=', b: f.b})), lb: [0, 0], ub: [CAJA, CAJA], ent: [true, true]};
  const r = resuelveMIP(P, {arbol: true});
  return {nodos: r.nodos, z: -r.z, x: r.x, arbol: r.arbol.map(n => ({...n, z: n.z === undefined ? undefined : -n.z}))};
}

/* ── CARRERA DE COTAS ── */
function uflCotas(sem) {
  const rnd = rndDe(`${sem}|cotas-ufl`), m = 6, n = 15, P = coordsAleat(rnd, m), C = coordsAleat(rnd, n);
  return {m, n, f: Array.from({length: m}, () => 6 + Math.floor(rnd() * 10)), c: P.map(p => C.map(q => dist(p, q)))};
}
function uflLP(I) {   // relajación lineal de la formulación fuerte (cota que alcanza la lagrangiana, por Geoffrion)
  const {m, n, f, c} = I, nv = m + m * n, X = (i, j) => m + i * n + j;
  const filas = [];
  for (let j = 0; j < n; j++) filas.push({a: Array.from({length: m}, (_, i) => [X(i, j), 1]), s: '=', b: 1});
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) filas.push({a: [[X(i, j), 1], [i, -1]], s: '<=', b: 0});
  const cc = Array(nv).fill(0); f.forEach((v, i) => cc[i] = v); for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) cc[X(i, j)] = c[i][j];
  return resuelveLP({n: nv, c: cc, filas, lb: Array(nv).fill(0), ub: Array(nv).fill(1)}).z;
}
function subgradienteUFL(I, {paso = 2, cada = 30, iters = 150} = {}) {
  const {m, n, f, c} = I;
  const L = lam => { let v = lam.reduce((a, b) => a + b, 0); const y = Array(m).fill(0), x = Array.from({length: m}, () => Array(n).fill(0)); for (let i = 0; i < m; i++) { let r = f[i]; for (let j = 0; j < n; j++) r += Math.min(0, c[i][j] - lam[j]); if (r < 0) { v += r; y[i] = 1; for (let j = 0; j < n; j++) x[i][j] = c[i][j] - lam[j] < 0 ? 1 : 0; } } return {v, y, x}; };
  const heur = y => { const A = y.map((v, i) => v ? i : -1).filter(i => i >= 0); const Ab = A.length ? A : [0]; return Ab.reduce((s, i) => s + f[i], 0) + Array.from({length: n}, (_, j) => Math.min(...Ab.map(i => c[i][j]))).reduce((a, b) => a + b, 0); };
  let lam = Array.from({length: n}, (_, j) => Math.min(...c.map(r => r[j]))), LB = -Infinity, UB = Infinity, t0 = paso;
  const serie = [];
  for (let k = 0; k < iters; k++) {
    const r = L(lam); LB = Math.max(LB, r.v); UB = Math.min(UB, heur(r.y));
    serie.push({k, L: r.v, LB, UB});
    const g = Array.from({length: n}, (_, j) => 1 - r.x.reduce((s, row) => s + row[j], 0)); const g2 = g.reduce((s, v) => s + v * v, 0);
    if (!g2) break;
    const t = t0 * (UB - r.v) / g2; lam = lam.map((v, j) => v + t * g[j]); if (k % cada === cada - 1) t0 /= 2;
  }
  return serie;
}
function patronMochila(val, pes, cap) {   // mochila entera sin límite con reconstrucción del patrón
  const best = Array(cap + 1).fill(0), el = Array(cap + 1).fill(-1);
  for (let c = 1; c <= cap; c++) { best[c] = best[c - 1]; el[c] = -1; val.forEach((v, k) => { if (pes[k] <= c && best[c - pes[k]] + v > best[c] + 1e-12) { best[c] = best[c - pes[k]] + v; el[c] = k; } }); }
  const a = Array(pes.length).fill(0); let c = cap; while (c > 0) { if (el[c] < 0) c--; else { a[el[c]]++; c -= pes[el[c]]; } }
  return {v: best[cap], a};
}
const CS_NB = {W: 100, w: [45, 36, 31, 14], d: [97, 610, 395, 211]};   // la instancia del cuaderno 2
function columnasCS(I = CS_NB, maxIt = 50) {
  const {W, w, d} = I, K = w.length;
  const pats = w.map((x, k) => w.map((_, j) => j === k ? Math.floor(W / x) : 0));
  const serie = [];
  for (let it = 1; it <= maxIt; it++) {
    const P = {n: pats.length, c: pats.map(() => 1), filas: Array.from({length: K}, (_, k) => ({a: pats.map((p, q) => [q, p[k]]), s: '>=', b: d[k]})), lb: pats.map(() => 0), ub: pats.map(() => Infinity)};
    const r = resuelveLP(P); const pi = r.y; const pr = patronMochila(pi, w, W);
    serie.push({it, z: r.z, LB: r.z / Math.max(1, pr.v), rc: 1 - pr.v, a: pr.a, pi});
    if (1 - pr.v > -1e-9) break;
    pats.push(pr.a);
  }
  return serie;
}
function cflBenders(sem) {
  const rnd = rndDe(`${sem}|cotas-cfl`), m = 4, n = 8;
  const d = Array.from({length: n}, () => 5 + Math.floor(rnd() * 16)), D = d.reduce((a, b) => a + b);
  const I = {m, n, d, Q: Array.from({length: m}, () => Math.ceil(D * (0.35 + rnd() * 0.3))), F: Array.from({length: m}, () => 80 + Math.floor(rnd() * 80)), c: Array.from({length: m}, () => Array.from({length: n}, () => 1 + Math.floor(rnd() * 12)))};
  return I;
}
function transporte(I, y) {   // subproblema de Benders: duales u (demanda, ≥ 0) y v (capacidad, ≤ 0)
  const {m, n, d, Q, c} = I, X = (i, j) => i * n + j;
  const filas = [...Array.from({length: n}, (_, j) => ({a: Array.from({length: m}, (_, i) => [X(i, j), 1]), s: '>=', b: d[j]})), ...Array.from({length: m}, (_, i) => ({a: Array.from({length: n}, (_, j) => [X(i, j), 1]), s: '<=', b: Q[i] * y[i]}))];
  const r = resuelveLP({n: m * n, c: c.flat(), filas});
  return r.estado === 'optimo' ? {z: r.z, u: r.y.slice(0, n), v: r.y.slice(n)} : null;
}
function bendersCFL(I, maxIt = 40) {
  const {m, n, d, Q, F} = I, D = d.reduce((a, b) => a + b);
  const todas = []; for (let s = 0; s < 1 << m; s++) { const y = Array.from({length: m}, (_, i) => s >> i & 1); if (y.reduce((a, v, i) => a + v * Q[i], 0) >= D) todas.push(y); }
  const cortes = [], serie = []; let UB = Infinity;
  for (let it = 1; it <= maxIt; it++) {
    let best = null;   // maestro por enumeración (m pequeño): mín F·y + η, η ≥ cada corte
    for (const y of todas) { const eta = Math.max(0, ...cortes.map(([u, v]) => u.reduce((s, x, j) => s + x * d[j], 0) + v.reduce((s, x, i) => s + x * Q[i] * y[i], 0))); const z = y.reduce((s, v, i) => s + v * F[i], 0) + eta; if (!best || z < best.z - 1e-9) best = {y, z}; }
    const sub = transporte(I, best.y); UB = Math.min(UB, best.y.reduce((s, v, i) => s + v * F[i], 0) + sub.z);
    serie.push({it, LB: best.z, UB, y: best.y});
    if (UB - best.z < 1e-6) break;
    cortes.push([sub.u, sub.v]);
  }
  return serie;
}
function cflOptimo(I) {   // contraste: modelo completo con el solver de ramificación
  const {m, n, d, Q, F, c} = I, X = (i, j) => m + i * n + j, nv = m + m * n;
  const filas = [...Array.from({length: n}, (_, j) => ({a: Array.from({length: m}, (_, i) => [X(i, j), 1]), s: '>=', b: d[j]})), ...Array.from({length: m}, (_, i) => ({a: [...Array.from({length: n}, (_, j) => [X(i, j), 1]), [i, -Q[i]]], s: '<=', b: 0}))];
  const cc = Array(nv).fill(0); F.forEach((v, i) => cc[i] = v); for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) cc[X(i, j)] = c[i][j];
  return resuelveMIP({n: nv, c: cc, filas, lb: Array(nv).fill(0), ub: [...Array(m).fill(1), ...Array(m * n).fill(Infinity)], ent: [...Array(m).fill(true), ...Array(m * n).fill(false)]}).z;
}

/* ── EJEMPLOS RESUELTOS CON RETIRADA GRADUAL ── */
const RES_SUB = {v: [12, 9, 14, 7, 10], w: [4, 3, 6, 2, 5], C: 10, lam0: 3, t: 0.1, iters: 6};
function filasSubgrad(E = RES_SUB) {
  let lam = E.lam0; const out = [];
  for (let k = 0; k < E.iters; k++) {
    const x = E.v.map((v, i) => v - lam * E.w[i] > 1e-12 ? 1 : 0);
    const L = lam * E.C + E.v.reduce((s, v, i) => s + Math.max(0, v - lam * E.w[i]), 0);
    const g = E.C - x.reduce((s, xi, i) => s + xi * E.w[i], 0);
    const sig = Math.max(0, lam - E.t * g);
    out.push({k: k + 1, lam: Math.round(lam * 1e4) / 1e4, x: x.map((xi, i) => xi ? i + 1 : 0).filter(Boolean).join(',') || '—', L: Math.round(L * 1e4) / 1e4, g, sig: Math.round(sig * 1e4) / 1e4});
    lam = sig;
  }
  return out;
}
const RES_CG = {W: 20, w: [9, 7, 4], d: [10, 14, 20]};
const filasCG = () => columnasCS(RES_CG).map(s => ({it: s.it, pi: s.pi.map(x => Math.round(x * 1e4) / 1e4).join('; '), a: s.a.join(','), rc: Math.round(s.rc * 1e4) / 1e4, z: Math.round(s.z * 1e4) / 1e4}));
/* qué columnas quedan en blanco en cada fila según el nivel de retirada */
const RES_DEF = {
  sub: {cols: ['lam', 'x', 'L', 'g', 'sig'], orden: ['sig', 'g', 'L', 'x'], filas: () => filasSubgrad()},
  cg: {cols: ['it', 'pi', 'a', 'rc', 'z'], orden: ['rc', 'a'], filas: filasCG}
};
const huecosDe = (def, nivel) => def.orden.slice(0, nivel);
function compruebaCelda(col, resp, valor) {
  if (col === 'x' || col === 'a') { const norm = s => String(s).replace(/[\s—-]/g, '').replace(/;/g, ','); return norm(resp) === norm(valor) || (valor === '—' && /^(|0|ninguno|none|nenhum)$/i.test(String(resp).trim())); }
  const v = leeNum(resp); return !Number.isNaN(v) && Math.abs(v - valor) <= Math.max(0.006, 0.005 * Math.abs(valor));
}
if (typeof module !== 'undefined') module.exports = {...(module.exports || {}), POLI, analizaPoli, validaCorte, corteCG, bbPoli, uflCotas, uflLP, subgradienteUFL, columnasCS, cflBenders, bendersCFL, cflOptimo, transporte, filasSubgrad, filasCG, RES_DEF, huecosDe, compruebaCelda, patronMochila, CS_NB};
