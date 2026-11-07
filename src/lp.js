/* ══ SOLVER LP/MIP en el navegador (sin librerías, sin red) para instancias pequeñas ══
   resuelveLP(P): símplex de dos fases en tableau denso (regla de Dantzig con paso a Bland si hay degeneración),
                  devuelve también los duales de cada fila (convención de GLOP: en minimización, fila ≥ → dual ≥ 0; fila ≤ → dual ≤ 0).
   resuelveMIP(P): ramificación y acotación en profundidad sobre la relajación, con registro opcional del árbol.
   P = {n, c[n] (se MINIMIZA c·x + k), k, filas:[{a:[[j,coef],…], s:'<='|'>='|'=', b}], lb[n], ub[n], ent[n] (bool)}
   Contrastado con GLOP y SCIP de OR-Tools en tests/test_lp.* (instancias aleatorias). ══ */
const LP_EPS = 1e-9;
function resuelveLP(P) {
  const n = P.n, lb0 = P.lb || [], ub0 = P.ub || [];
  /* 1 · variables de trabajo x' ≥ 0: x = lb + x'  |  x = ub − x'  |  x = x⁺ − x⁻ */
  const mapa = [], cotasSup = []; let nc = 0;
  for (let j = 0; j < n; j++) {
    const lb = lb0[j] ?? 0, ub = ub0[j] ?? Infinity;
    if (ub < lb - 1e-12) return {estado: 'infactible'};
    if (lb > -Infinity) { mapa.push({p: nc, sg: 1, off: lb}); if (ub < Infinity) cotasSup.push([nc, ub - lb]); nc++; }
    else if (ub < Infinity) { mapa.push({p: nc, sg: -1, off: ub}); nc++; }
    else { mapa.push({p: nc, q: nc + 1, sg: 1, off: 0}); nc += 2; }
  }
  const filas = [];
  for (const f of P.filas) {
    const a = new Map(); let b = f.b;
    for (const [j, v] of f.a) { if (!v) continue; const m = mapa[j]; b -= v * m.off; a.set(m.p, (a.get(m.p) || 0) + v * m.sg); if (m.q !== undefined) a.set(m.q, (a.get(m.q) || 0) - v); }
    filas.push({a, s: f.s, b, orig: true});
  }
  for (const [p, u] of cotasSup) filas.push({a: new Map([[p, 1]]), s: '<=', b: u, orig: false});
  const cost = new Float64Array(nc); let k = P.k || 0;
  for (let j = 0; j < n; j++) { const m = mapa[j], cj = P.c[j] || 0; k += cj * m.off; cost[m.p] += cj * m.sg; if (m.q !== undefined) cost[m.q] -= cj; }
  /* 2 · normalizar b ≥ 0 y montar el tableau: [estructurales | holguras de ≥ | identidad (holgura ≤ o artificial)] */
  const m = filas.length; const flip = new Array(m).fill(false), tipo = [];
  filas.forEach((f, i) => { if (f.b < 0) { flip[i] = true; f.b = -f.b; for (const [c, v] of f.a) f.a.set(c, -v); f.s = f.s === '<=' ? '>=' : f.s === '>=' ? '<=' : '='; } tipo.push(f.s); });
  const nSur = tipo.filter(s => s === '>=').length, idIni = nc + nSur, N = idIni + m, W = N + 1;
  const T = new Float64Array(m * W), base = new Int32Array(m), artif = new Uint8Array(N);
  let sc = nc;
  filas.forEach((f, i) => { const r = i * W; for (const [c, v] of f.a) T[r + c] = v; if (f.s === '>=') T[r + sc++] = -1; T[r + idIni + i] = 1; T[r + N] = f.b; base[i] = idIni + i; if (f.s !== '<=') artif[idIni + i] = 1; });
  const obj = new Float64Array(W);
  const pivota = (r, c) => {
    const rr = r * W, pv = T[rr + c];
    for (let j = 0; j < W; j++) T[rr + j] /= pv;
    for (let i = 0; i < m; i++) { if (i === r) continue; const ri = i * W, f = T[ri + c]; if (Math.abs(f) > 1e-14) for (let j = 0; j < W; j++) T[ri + j] -= f * T[rr + j]; }
    const f = obj[c]; if (Math.abs(f) > 1e-14) for (let j = 0; j < W; j++) obj[j] -= f * T[rr + j];
    base[r] = c;
  };
  const simplex = permitida => {
    let degen = 0, it = 0;
    for (;;) {
      if (++it > 50000) return 'limite';
      let c = -1;
      if (degen < 40) { let mejor = -LP_EPS; for (let j = 0; j < N; j++) if (permitida(j) && obj[j] < mejor) { mejor = obj[j]; c = j; } }
      else for (let j = 0; j < N; j++) if (permitida(j) && obj[j] < -LP_EPS) { c = j; break; }
      if (c < 0) return 'optimo';
      let r = -1, rat = Infinity;
      for (let i = 0; i < m; i++) { const a = T[i * W + c]; if (a > LP_EPS) { const q = T[i * W + N] / a; if (q < rat - 1e-12 || (Math.abs(q - rat) <= 1e-12 && base[i] < base[r])) { rat = q; r = i; } } }
      if (r < 0) return 'no_acotado';
      degen = rat < 1e-12 ? degen + 1 : 0;
      pivota(r, c);
    }
  };
  /* 3 · fase 1: minimizar la suma de artificiales */
  for (let j = 0; j < N; j++) obj[j] = artif[j] ? 1 : 0; obj[N] = 0;
  for (let i = 0; i < m; i++) if (artif[base[i]]) for (let j = 0; j < W; j++) obj[j] -= T[i * W + j];
  if (simplex(() => true) === 'limite') return {estado: 'limite'};
  if (-obj[N] > 1e-7) return {estado: 'infactible'};
  for (let i = 0; i < m; i++) if (artif[base[i]]) { for (let j = 0; j < idIni; j++) if (Math.abs(T[i * W + j]) > 1e-9) { pivota(i, j); break; } }
  /* 4 · fase 2 */
  for (let j = 0; j < W; j++) obj[j] = 0; for (let j = 0; j < nc; j++) obj[j] = cost[j];
  for (let i = 0; i < m; i++) { const cb = base[i] < nc ? cost[base[i]] : 0; if (cb) for (let j = 0; j < W; j++) obj[j] -= cb * T[i * W + j]; }
  const est = simplex(j => !artif[j]);
  if (est !== 'optimo') return {estado: est};
  const xp = new Float64Array(nc); for (let i = 0; i < m; i++) if (base[i] < nc) xp[base[i]] = T[i * W + N];
  const x = mapa.map(mm => mm.off + mm.sg * xp[mm.p] - (mm.q !== undefined ? xp[mm.q] : 0));
  const z = x.reduce((s, v, j) => s + (P.c[j] || 0) * v, P.k || 0);
  const y = []; for (let i = 0; i < m; i++) if (filas[i].orig) { const yi = -obj[idIni + i]; y.push(flip[i] ? -yi : yi); }
  return {estado: 'optimo', x, z, y};
}
const esEnt = v => Math.abs(v - Math.round(v)) <= 1e-6;
function resuelveMIP(P, {maxNodos = 20000, arbol = false} = {}) {
  const n = P.n, ent = P.ent || [];
  let mejor = null, nodos = 0; const nodosArbol = [];
  const pila = [{lb: (P.lb || []).slice(), ub: (P.ub || []).slice(), id: 0, padre: null, rama: null, cota: -Infinity}]; let sig = 1;
  while (pila.length) {
    if (nodos >= maxNodos) return {estado: mejor ? 'limite_factible' : 'limite', z: mejor?.z, x: mejor?.x, nodos, arbol: nodosArbol};
    let iSel = pila.length - 1;   // en profundidad hasta tener una solución entera; después, el nodo con mejor cota del padre
    if (mejor) for (let i = 0; i < pila.length; i++) if (pila[i].cota < pila[iSel].cota - 1e-12) iSel = i;
    const nd = pila.splice(iSel, 1)[0]; nodos++;
    const r = resuelveLP({...P, lb: nd.lb, ub: nd.ub});
    const reg = {id: nd.id, padre: nd.padre, rama: nd.rama, z: r.z, x: r.x, estado: ''};
    if (r.estado === 'no_acotado') { if (arbol) nodosArbol.push({...reg, estado: 'no_acotado'}); return {estado: 'no_acotado', nodos, arbol: nodosArbol}; }
    if (r.estado !== 'optimo') { if (arbol) nodosArbol.push({...reg, estado: 'infactible'}); continue; }
    if (mejor && r.z >= mejor.z - 1e-9) { if (arbol) nodosArbol.push({...reg, estado: 'podado'}); continue; }
    let jb = -1, fb = 0;
    for (let j = 0; j < n; j++) if (ent[j] && !esEnt(r.x[j])) { const f = Math.abs(r.x[j] - Math.floor(r.x[j]) - 0.5); if (jb < 0 || f < fb - 1e-12) { jb = j; fb = f; } }
    if (jb < 0) { mejor = {z: r.z, x: r.x.map((v, j) => ent[j] ? Math.round(v) : v)}; if (arbol) nodosArbol.push({...reg, estado: 'entero'}); continue; }
    if (arbol) nodosArbol.push({...reg, estado: 'ramifica', var: jb});
    const v = r.x[jb], ubA = nd.ub.slice(), lbB = nd.lb.slice(); ubA[jb] = Math.floor(v); lbB[jb] = Math.ceil(v);
    pila.push({lb: lbB, ub: nd.ub.slice(), id: sig++, padre: nd.id, rama: [jb, '>=', Math.ceil(v)], cota: r.z});
    pila.push({lb: nd.lb.slice(), ub: ubA, id: sig++, padre: nd.id, rama: [jb, '<=', Math.floor(v)], cota: r.z});
  }
  return mejor ? {estado: 'optimo', z: mejor.z, x: mejor.x, nodos, arbol: nodosArbol} : {estado: 'infactible', nodos, arbol: nodosArbol};
}
const relaja = P => ({...P, ent: []});
if (typeof module !== 'undefined') module.exports = {...(module.exports || {}), resuelveLP, resuelveMIP};
