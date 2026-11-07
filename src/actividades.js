/* ══ ACTIVIDADES CON INSTANCIA PERSONAL: entregas de los cuadernos, torneo semanal y misiones (lógica pura) ══
   · Cada estudiante recibe sus datos (semilla personal). El cuaderno los resuelve con OR-Tools y devuelve una ENTREGA;
     la app recalcula la respuesta con su propio solver y la valida. Así el profesorado tiene entregas individuales verificadas.
   · Torneo: una instancia de TSP por semana ISO, igual para toda la clase; la app comprueba la ruta y la compara con la
     cota de Held-Karp (no hace falta servidor: el profesorado agrega las entregas).
   · Misiones: casos abiertos tipo examen; las partes numéricas las corrige el código, la justificación la comenta la IA
     con una rúbrica (sin nota) y la confirma el profesorado. ══ */
const ACT_ITEMS = [
  {id: 'NB1', ra: 'RA2', b: 0.6, tipo: 'act', bloom: 'aplicar'}, {id: 'NB2', ra: 'RA4', b: 0.9, tipo: 'act', bloom: 'aplicar'}, {id: 'NB3', ra: 'RA5', b: 0.6, tipo: 'act', bloom: 'evaluar'},
  {id: 'TORNEO', ra: 'RA5', b: 0.8, tipo: 'act', bloom: 'evaluar'},
  {id: 'M1', ra: 'RA3', b: 0.8, tipo: 'act', bloom: 'evaluar'}, {id: 'M2', ra: 'RA3', b: 0.8, tipo: 'act', bloom: 'evaluar'}, {id: 'M3', ra: 'RA5', b: 0.9, tipo: 'act', bloom: 'evaluar'},
  {id: 'POLI_corte', ra: 'RA2', b: 0.5, tipo: 'act', bloom: 'crear'}, {id: 'POLI_pred', ra: 'RA1', b: 0.3, tipo: 'act', bloom: 'analizar'},
  {id: 'RES_sub', ra: 'RA4', b: 0.4, tipo: 'act', bloom: 'aplicar'}, {id: 'RES_cg', ra: 'RA4', b: 0.6, tipo: 'act', bloom: 'aplicar'}
];
const distTSP = P => P.map(p => P.map(q => Math.round(Math.hypot(p[0] - q[0], p[1] - q[1]))));
const longitud = (D, t) => t.reduce((s, v, k) => s + D[v][t[(k + 1) % t.length]], 0);
const esPermutacion = (t, n) => Array.isArray(t) && t.length === n && new Set(t).size === n && t.every(v => Number.isInteger(v) && v >= 0 && v < n);
/* cota de Held-Karp: 1-árbol con penalizaciones ajustadas por subgradiente (mismo algoritmo que el cuaderno 3) */
function heldKarp(D, UB, iters = 300) {
  const N = D.length;
  const arbol = pen => {
    const Dp = (i, j) => D[i][j] + pen[i] + pen[j], grado = Array(N).fill(0); let coste = 0;
    const mejor = new Map(); for (let j = 2; j < N; j++) mejor.set(j, [Dp(1, j), 1]);
    while (mejor.size) { let j = -1, cj = Infinity; for (const [k, [c]] of mejor) if (c < cj || (c === cj && k < j)) { cj = c; j = k; } const pj = mejor.get(j)[1]; mejor.delete(j); coste += cj; grado[j]++; grado[pj]++; for (const [k, [c]] of mejor) if (Dp(j, k) < c) mejor.set(k, [Dp(j, k), j]); }
    const dos = [...Array(N).keys()].slice(1).sort((a, b) => Dp(0, a) - Dp(0, b) || a - b).slice(0, 2); for (const j of dos) { coste += Dp(0, j); grado[j]++; }
    grado[0] = 2; return {v: coste - 2 * pen.reduce((a, b) => a + b, 0), grado};
  };
  let pen = Array(N).fill(0), LB = -Infinity, paso = 1;
  for (let k = 0; k < iters; k++) { const {v, grado} = arbol(pen); LB = Math.max(LB, v); const sg = grado.map(g => g - 2), s2 = sg.reduce((s, x) => s + x * x, 0); if (!s2) break; const t = paso * (UB - v) / s2; pen = pen.map((p, i) => p + t * sg[i]); if (k % 40 === 39) paso /= 2; }
  return LB;
}
function vecinoProximoTSP(D) { const n = D.length, t = [0], lib = new Set([...Array(n).keys()].slice(1)); while (lib.size) { const u = t.at(-1); let b = -1; for (const v of lib) if (b < 0 || D[u][v] < D[u][b]) b = v; t.push(b); lib.delete(b); } return t; }
function dosOpt(D, t0) { const t = t0.slice(), n = t.length; let mejora = true; while (mejora) { mejora = false; for (let i = 0; i < n - 1; i++) for (let k = i + 2; k < (i ? n : n - 1); k++) { const a = t[i], b = t[i + 1], c = t[k], e = t[(k + 1) % n]; if (D[a][c] + D[b][e] - D[a][b] - D[c][e] < 0) { const seg = t.slice(i + 1, k + 1).reverse(); t.splice(i + 1, seg.length, ...seg); mejora = true; } } } return t; }
/* ── instancias personales de los cuadernos ── */
function instanciaNB(k, sem) {
  const rnd = rndDe(`${sem}|NB${k}`);
  if (k === 1) { const m = 6, n = 15, P = coordsAleat(rnd, m), C = coordsAleat(rnd, n); return {cuaderno: 1, semilla: sem, m, n, f: Array.from({length: m}, () => 4 + Math.floor(rnd() * 8)), c: P.map(p => C.map(q => dist(p, q)))}; }
  if (k === 2) { const w = [...new Set(Array.from({length: 6}, () => 12 + Math.floor(rnd() * 37)))].slice(0, 4); while (w.length < 4) w.push(13 + w.length * 7); const cs = {W: 100, w, d: w.map(() => 20 + Math.floor(rnd() * 300))}; const bd = cflBenders(sem + '|NB2'); return {cuaderno: 2, semilla: sem, corte: cs, cfl: bd}; }
  const N = 25; return {cuaderno: 3, semilla: sem, ciudades: coordsAleat(rnd, N)};
}
const UFL_DEBIL = 'var y[i] bin\nvar x[i,j] cont 0 1\nmin sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]\nasig{j}: sum{i} x[i,j] = 1\nenlace{i}: sum{j} x[i,j] <= n*y[i]';
function solucionNB(I) {   // lo que la app espera de cada cuaderno, calculado con su propio solver
  if (I.cuaderno === 1) { const ej = FORM_BY.F_ufl, datos = {m: I.m, n: I.n, f: I.f, c: I.c}; const mF = compila(ej.ref, ej, datos), mD = compila(UFL_DEBIL, ej, datos); return {z_ip: resuelveModelo(mF).z, z_lp_debil: resuelveModelo(mD, {relajado: true}).z, z_lp_fuerte: resuelveModelo(mF, {relajado: true}).z}; }
  if (I.cuaderno === 2) return {z_lp_corte: columnasCS(I.corte).at(-1).z, z_cfl: cflOptimo(I.cfl)};
  const D = distTSP(I.ciudades), t = dosOpt(D, vecinoProximoTSP(D)); return {cota_hk: heldKarp(D, longitud(D, t)), referencia: longitud(D, t)};
}
/* entrega: {app, cuaderno, semilla, res:{…}} → [{clave, ok, esperado, dado}] */
const cercaRel = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(b));
function verificaEntrega(ent, sem) {
  if (!ent || ent.app !== 'optimizia' || ![1, 2, 3].includes(ent.cuaderno)) return {error: 'formato'};
  if (ent.semilla !== sem) return {error: 'semilla'};
  const I = instanciaNB(ent.cuaderno, sem), sol = solucionNB(I), res = ent.res || {};
  if (ent.cuaderno === 3) {
    const D = distTSP(I.ciudades), t = res.ruta;
    if (!esPermutacion(t, D.length)) return {error: 'ruta', items: [{clave: 'ruta', ok: false}]};
    const L = longitud(D, t), okL = res.longitud === undefined || res.longitud === L, gap = 100 * (L - sol.cota_hk) / L;
    return {items: [{clave: 'ruta', ok: true, dado: L}, {clave: 'longitud', ok: okL, esperado: L, dado: res.longitud}, {clave: 'gap', ok: gap <= 5, dado: gap, esperado: 5}], L, LB: sol.cota_hk, gap};
  }
  return {items: Object.entries(sol).map(([k, v]) => ({clave: k, ok: typeof res[k] === 'number' && cercaRel(res[k], v), esperado: v, dado: res[k]}))};
}
/* ── torneo semanal ── */
function semanaISO(d = new Date()) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dia = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dia); const ini = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - ini) / 864e5 + 1) / 7)).padStart(2, '0')}`; }
const _cacheTorneo = {};
function torneo(semana) {
  if (_cacheTorneo[semana]) return _cacheTorneo[semana];
  const P = coordsAleat(rndDe(`torneo|${semana}`), 30), D = distTSP(P), ref = dosOpt(D, vecinoProximoTSP(D));
  return (_cacheTorneo[semana] = {semana, ciudades: P, D, ref: longitud(D, ref), LB: heldKarp(D, longitud(D, ref))});
}
function verificaTorneo(semana, ruta) { const T = torneo(semana); if (!esPermutacion(ruta, T.D.length)) return {ok: false}; const L = longitud(T.D, ruta); return {ok: true, L, gap: 100 * (L - T.LB) / L, LB: T.LB, ref: T.ref}; }
/* lectura tolerante de una ruta o una entrega pegada: JSON, lista de Python o números separados */
function leeRuta(txt) { const m = String(txt).match(/\[([\d\s,]+)\]/); const s = m ? m[1] : String(txt); const v = s.split(/[\s,;]+/).filter(Boolean).map(Number); return v.every(Number.isInteger) ? v : null; }
function leeEntrega(txt) { const s = String(txt || ''); const i = s.indexOf('{'), j = s.lastIndexOf('}'); if (i < 0 || j < i) return null; try { return JSON.parse(s.slice(i, j + 1).replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null').replace(/'/g, '"')); } catch { return null; } }

/* ── misiones (casos abiertos tipo examen) ── */
function cflSolucion(I) {
  const {m, n, d, Q, F, c} = I, X = (i, j) => m + i * n + j, nv = m + m * n;
  const filas = [...Array.from({length: n}, (_, j) => ({a: Array.from({length: m}, (_, i) => [X(i, j), 1]), s: '>=', b: d[j]})), ...Array.from({length: m}, (_, i) => ({a: [...Array.from({length: n}, (_, j) => [X(i, j), 1]), [i, -Q[i]]], s: '<=', b: 0}))];
  const cc = Array(nv).fill(0); F.forEach((v, i) => cc[i] = v); for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) cc[X(i, j)] = c[i][j];
  const r = resuelveMIP({n: nv, c: cc, filas, lb: Array(nv).fill(0), ub: [...Array(m).fill(1), ...Array(m * n).fill(Infinity)], ent: [...Array(m).fill(true), ...Array(m * n).fill(false)]});
  return {z: r.z, abiertas: r.x.slice(0, m).map((v, i) => v > 0.5 ? i + 1 : 0).filter(Boolean)};
}
function costeConAbiertas(I, abiertas) { const y = Array.from({length: I.m}, (_, i) => abiertas.includes(i + 1) ? 1 : 0); if (y.reduce((s, v, i) => s + v * I.Q[i], 0) < I.d.reduce((a, b) => a + b)) return null; const t = transporte(I, y); return t ? y.reduce((s, v, i) => s + v * I.F[i], 0) + t.z : null; }
const MISIONES = [
  {id: 'M1', ra: 'RA3', ico: 'building',
    titulo: L3('Centros de distribución en el Baix Vinalopó', 'Distribution centres in the Baix Vinalopó', 'Centros de distribuição no Baix Vinalopó'),
    caso: L3('Una cooperativa (ficticia) quiere abrir almacenes para servir a 8 puntos de venta. Cada almacén tiene un coste fijo anual F[i] y una capacidad Q[i]; cada punto, una demanda d[j]; servir una unidad de i a j cuesta c[i,j]. Se puede repartir la demanda de un punto entre varios almacenes.', 'A (fictitious) cooperative wants to open warehouses to serve 8 points of sale. Each warehouse has an annual fixed cost F[i] and a capacity Q[i]; each point, a demand d[j]; serving one unit from i to j costs c[i,j]. A point’s demand may be split among several warehouses.', 'Uma cooperativa (fictícia) quer abrir armazéns para servir 8 pontos de venda. Cada armazém tem um custo fixo anual F[i] e uma capacidade Q[i]; cada ponto, uma procura d[j]; servir uma unidade de i para j custa c[i,j]. A procura de um ponto pode repartir-se entre vários armazéns.'),
    datos: sem => cflBenders(sem + '|M1'),
    preguntas: [
      {id: 'met', tipo: 'mc', q: L3('¿Cómo lo resolverías de forma exacta?', 'How would you solve it exactly?', 'Como o resolveria de forma exata?'), ops: [L3('Programación entera mixta: binaria por almacén y continuas de transporte (o Benders, porque fijados los almacenes queda un problema de transporte)', 'Mixed-integer programming: one binary per warehouse and continuous transport variables (or Benders, because once the warehouses are fixed a transport problem remains)', 'Programação inteira mista: binária por armazém e contínuas de transporte (ou Benders, porque fixados os armazéns fica um problema de transporte)'), L3('Recocido simulado sobre las rutas', 'Simulated annealing over routes', 'Recozimento simulado sobre as rotas'), L3('Programación lineal sin variables enteras', 'Linear programming without integer variables', 'Programação linear sem variáveis inteiras'), L3('Generación de columnas con un patrón por almacén', 'Column generation with one pattern per warehouse', 'Geração de colunas com um padrão por armazém')], ok: 0},
      {id: 'z', tipo: 'num', q: L3('Coste total óptimo (fijos + transporte).', 'Optimal total cost (fixed + transport).', 'Custo total ótimo (fixos + transporte).'), sol: I => cflSolucion(I).z},
      {id: 'abre', tipo: 'conj', q: L3('¿Qué almacenes abres? (números separados por comas)', 'Which warehouses do you open? (numbers separated by commas)', 'Que armazéns abre? (números separados por vírgulas)')},
      {id: 'just', tipo: 'texto', q: L3('Justifica en pocas líneas el método y qué te asegura que la solución es óptima.', 'Justify in a few lines the method and what guarantees that the solution is optimal.', 'Justifique em poucas linhas o método e o que lhe garante que a solução é ótima.')}],
    rubrica: [{id: 'c1', t: L3('Identifica las variables binarias de apertura y las continuas de transporte', 'Identifies the binary opening variables and the continuous transport variables', 'Identifica as variáveis binárias de abertura e as contínuas de transporte')}, {id: 'c2', t: L3('Explica cómo se garantiza la optimalidad (cotas, gap nulo, solver exacto)', 'Explains how optimality is guaranteed (bounds, zero gap, exact solver)', 'Explica como se garante a otimalidade (limites, gap nulo, solver exato)')}, {id: 'c3', t: L3('Menciona la estructura aprovechable (Benders o la fuerza de la formulación con x ≤ y)', 'Mentions the exploitable structure (Benders or the strength of the formulation with x ≤ y)', 'Menciona a estrutura aproveitável (Benders ou a força da formulação com x ≤ y)')}]},
  {id: 'M2', ra: 'RA3', ico: 'grid',
    titulo: L3('Bobinas de papel', 'Paper rolls', 'Bobinas de papel'),
    caso: L3('Una papelera (ficticia) corta bobinas de ancho W en piezas de cuatro anchos con pedidos d[k]. Quiere usar el menor número de bobinas. Los patrones de corte posibles son muchísimos.', 'A (fictitious) paper mill cuts rolls of width W into pieces of four widths with orders d[k]. It wants to use the smallest number of rolls. The possible cutting patterns are very many.', 'Uma fábrica de papel (fictícia) corta bobinas de largura W em peças de quatro larguras com encomendas d[k]. Quer usar o menor número de bobinas. Os padrões de corte possíveis são muitíssimos.'),
    datos: sem => instanciaNB(2, sem + '|M2').corte,
    preguntas: [
      {id: 'met', tipo: 'mc', q: L3('¿Qué método aprovecha esta estructura?', 'Which method exploits this structure?', 'Que método aproveita esta estrutura?'), ops: [L3('Benders, con los patrones como variables complicantes', 'Benders, with the patterns as complicating variables', 'Benders, com os padrões como variáveis complicantes'), L3('Generación de columnas: maestro con pocos patrones y mochila como subproblema de precios', 'Column generation: master with few patterns and a knapsack as pricing subproblem', 'Geração de colunas: mestre com poucos padrões e mochila como subproblema de preços'), L3('Enumerar todos los patrones y resolver de golpe', 'Enumerate all patterns and solve in one go', 'Enumerar todos os padrões e resolver de uma vez'), L3('Búsqueda tabú sin cota', 'Tabu search without a bound', 'Pesquisa tabu sem limite')], ok: 1},
      {id: 'z', tipo: 'num', q: L3('Valor óptimo de la relajación lineal (bobinas, dos decimales).', 'Optimal value of the linear relaxation (rolls, two decimals).', 'Valor ótimo da relaxação linear (bobinas, duas casas decimais).'), sol: I => columnasCS(I).at(-1).z},
      {id: 'cota', tipo: 'num', q: L3('¿Cuántas bobinas harán falta como mínimo, seguro?', 'How many rolls will be needed at least, for sure?', 'Quantas bobinas serão precisas no mínimo, de certeza?'), sol: I => Math.ceil(columnasCS(I).at(-1).z - 1e-9)},
      {id: 'just', tipo: 'texto', q: L3('Justifica el método y explica qué falta para garantizar el óptimo entero.', 'Justify the method and explain what is missing to guarantee the integer optimum.', 'Justifique o método e explique o que falta para garantir o ótimo inteiro.')}],
    rubrica: [{id: 'c1', t: L3('Relaciona el número enorme de patrones con la generación de columnas', 'Relates the huge number of patterns to column generation', 'Relaciona o número enorme de padrões com a geração de colunas')}, {id: 'c2', t: L3('Explica el subproblema de precios (mochila con los duales) y el criterio de parada', 'Explains the pricing subproblem (knapsack with the duals) and the stopping criterion', 'Explica o subproblema de preços (mochila com os duais) e o critério de paragem')}, {id: 'c3', t: L3('Distingue la cota de la relajación de la solución entera (redondeo o branch-and-price)', 'Distinguishes the relaxation bound from the integer solution (rounding or branch-and-price)', 'Distingue o limite da relaxação da solução inteira (arredondamento ou branch-and-price)')}]},
  {id: 'M3', ra: 'RA5', ico: 'compass',
    titulo: L3('Ruta de reparto en bicicleta', 'Bicycle delivery route', 'Rota de entregas de bicicleta'),
    caso: L3('Un repartidor (ficticio) debe visitar 12 comercios y volver al punto de partida recorriendo la menor distancia. Se necesita una buena solución hoy y saber cuánto podría mejorarse.', 'A (fictitious) courier must visit 12 shops and return to the starting point covering the smallest distance. A good solution is needed today, and knowing how much it could be improved.', 'Um estafeta (fictício) deve visitar 12 lojas e regressar ao ponto de partida percorrendo a menor distância. É preciso uma boa solução hoje e saber quanto poderia melhorar-se.'),
    datos: sem => ({ciudades: coordsAleat(rndDe(`${sem}|M3`), 12)}),
    preguntas: [
      {id: 'met', tipo: 'mc', q: L3('¿Qué enfoque propones?', 'Which approach do you propose?', 'Que abordagem propõe?'), ops: [L3('Una metaheurística (2-opt, GLS…) y una cota inferior para medir el gap', 'A metaheuristic (2-opt, GLS…) and a lower bound to measure the gap', 'Uma meta-heurística (2-opt, GLS…) e um limite inferior para medir o gap'), L3('Vecino más próximo: es óptimo', 'Nearest neighbour: it is optimal', 'Vizinho mais próximo: é ótimo'), L3('Enumerar todas las rutas', 'Enumerate all routes', 'Enumerar todas as rotas'), L3('Relajación lineal redondeada', 'Rounded linear relaxation', 'Relaxação linear arredondada')], ok: 0},
      {id: 'ruta', tipo: 'ruta', q: L3('Tu ruta: los 12 comercios en orden, del 0 al 11 (por ejemplo, del cuaderno 3).', 'Your route: the 12 shops in order, from 0 to 11 (for example, from notebook 3).', 'A sua rota: as 12 lojas por ordem, de 0 a 11 (por exemplo, do caderno 3).')},
      {id: 'just', tipo: 'texto', q: L3('¿Cómo la has obtenido y qué puedes garantizar sobre su calidad?', 'How did you obtain it and what can you guarantee about its quality?', 'Como a obteve e o que pode garantir sobre a sua qualidade?')}],
    rubrica: [{id: 'c1', t: L3('Describe una heurística constructiva y una mejora local o metaheurística', 'Describes a constructive heuristic and a local improvement or metaheuristic', 'Descreve uma heurística construtiva e uma melhoria local ou meta-heurística')}, {id: 'c2', t: L3('Usa una cota inferior para acotar el gap', 'Uses a lower bound to bound the gap', 'Usa um limite inferior para limitar o gap')}, {id: 'c3', t: L3('No afirma optimalidad sin demostrarla', 'Does not claim optimality without proving it', 'Não afirma otimalidade sem a demonstrar')}]}
];
const MISION_BY = Object.fromEntries(MISIONES.map(m => [m.id, m]));
function corrigeMision(id, sem, resp) {
  const M = MISION_BY[id], I = M.datos(sem), out = {};
  for (const q of M.preguntas) {
    const r = resp[q.id];
    if (q.tipo === 'mc') out[q.id] = {ok: +r === q.ok};
    else if (q.tipo === 'num') { const v = leeNum(r), s = q.sol(I); out[q.id] = {ok: !Number.isNaN(v) && Math.abs(v - s) <= Math.max(0.011, 0.002 * Math.abs(s)), sol: s}; }
    else if (q.tipo === 'conj') { const set = String(r || '').split(/[\s,;]+/).filter(Boolean).map(Number).filter(Number.isInteger); const opt = cflSolucion(I); const coste = set.length ? costeConAbiertas(I, set) : null; out[q.id] = {ok: coste !== null && Math.abs(coste - opt.z) < 1e-6, sol: opt.abiertas, coste}; }
    else if (q.tipo === 'ruta') { const t = leeRuta(r), D = distTSP(I.ciudades); if (!t || !esPermutacion(t, D.length)) out[q.id] = {ok: false, invalida: true}; else { const L = longitud(D, t), LB = heldKarp(D, L); out[q.id] = {ok: 100 * (L - LB) / L <= 5, L, LB, gap: 100 * (L - LB) / L}; } }
  }
  return out;
}
if (typeof module !== 'undefined') module.exports = {...(module.exports || {}), instanciaNB, solucionNB, verificaEntrega, torneo, verificaTorneo, semanaISO, heldKarp, distTSP, longitud, leeRuta, leeEntrega, MISIONES, corrigeMision, cflSolucion, costeConAbiertas, ACT_ITEMS, dosOpt, vecinoProximoTSP};
