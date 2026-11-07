/* ══ LABORATORIO DE MODELADO: corrector de formulaciones y contraejemplos (lógica pura) ══
   Corrector: la formulación del estudiante y la de referencia se resuelven en N instancias aleatorias (semilla personal).
   · Correcta = mismo óptimo entero en todas.   · Fuerza = gap de su relajación lineal frente al de la referencia.
   · Si falla, se enseña la instancia concreta y, si comparte nombres de variables, qué restricción rechaza la solución buena
     o qué regla real viola la suya.
   Contraejemplos: el estudiante construye una solución; el código comprueba que el modelo defectuoso la acepta (o la rechaza)
   y que la regla real dice lo contrario. ══ */
const R2 = x => Math.round(x * 100) / 100;
const coordsAleat = (rnd, k) => Array.from({length: k}, () => [Math.round(rnd() * 100), Math.round(rnd() * 100)]);
const dist = (a, b) => Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) / 10);
const FORM = [
  {id: 'F_mochila', ra: 'RA1', b: -0.3, conjuntos: {i: 'n'}, fuerza: false,
    titulo: L3('Mochila 0-1', '0-1 knapsack', 'Mochila 0-1'),
    enun: L3('Elige objetos de valor total máximo sin superar la capacidad. Cada objeto se coge entero o no se coge.', 'Choose items of maximum total value without exceeding the capacity. Each item is either taken whole or not at all.', 'Escolha objetos de valor total máximo sem ultrapassar a capacidade. Cada objeto é levado inteiro ou não é levado.'),
    datosTxt: L3('Índice i = objetos (1..n). Datos: v[i] valor, w[i] peso, C capacidad.', 'Index i = items (1..n). Data: v[i] value, w[i] weight, C capacity.', 'Índice i = objetos (1..n). Dados: v[i] valor, w[i] peso, C capacidade.'),
    gen(rnd) { const n = 5 + Math.floor(rnd() * 2), v = Array.from({length: n}, () => 3 + Math.floor(rnd() * 18)), w = Array.from({length: n}, () => 2 + Math.floor(rnd() * 9)); return {n, v, w, C: Math.round(w.reduce((a, b) => a + b) * 0.5)}; },
    ref: 'var y[i] bin\nmax sum{i} v[i]*y[i]\ncap: sum{i} w[i]*y[i] <= C',
    plantilla: '# variables, objetivo y restricciones\nvar y[i] bin\nmax ',
    desc: {cap: L3('la carga no puede superar la capacidad', 'the load cannot exceed the capacity', 'a carga não pode ultrapassar a capacidade')}},
  {id: 'F_ufl', ra: 'RA2', b: 0.4, conjuntos: {i: 'm', j: 'n'}, fuerza: true,
    titulo: L3('Localización sin capacidades', 'Uncapacitated facility location', 'Localização sem capacidades'),
    enun: L3('Decide qué plantas abrir y desde cuál se sirve a cada cliente, minimizando costes fijos de apertura más costes de servicio. Cada cliente se sirve una vez (puede repartirse entre plantas abiertas). Busca la formulación MÁS FUERTE.', 'Decide which plants to open and from which one each customer is served, minimising fixed opening costs plus service costs. Each customer is served once (it may be split among open plants). Look for the STRONGEST formulation.', 'Decida que fábricas abrir e a partir de qual se serve cada cliente, minimizando custos fixos de abertura mais custos de serviço. Cada cliente é servido uma vez (pode repartir-se entre fábricas abertas). Procure a formulação MAIS FORTE.'),
    datosTxt: L3('Índices i = plantas (1..m), j = clientes (1..n). Datos: f[i] coste fijo, c[i,j] coste de servir todo el cliente j desde i.', 'Indices i = plants (1..m), j = customers (1..n). Data: f[i] fixed cost, c[i,j] cost of serving all of customer j from i.', 'Índices i = fábricas (1..m), j = clientes (1..n). Dados: f[i] custo fixo, c[i,j] custo de servir todo o cliente j a partir de i.'),
    gen(rnd) { const m = 3, n = 4 + Math.floor(rnd() * 2), P = coordsAleat(rnd, m), C = coordsAleat(rnd, n); return {m, n, f: Array.from({length: m}, () => 4 + Math.floor(rnd() * 6)), c: P.map(p => C.map(q => dist(p, q)))}; },
    ref: 'var y[i] bin\nvar x[i,j] cont 0 1\nmin sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]\nasig{j}: sum{i} x[i,j] = 1\nenlace{i,j}: x[i,j] <= y[i]',
    plantilla: 'var y[i] bin\nvar x[i,j] cont 0 1\nmin ',
    desc: {asig: L3('cada cliente debe quedar servido exactamente una vez', 'each customer must be served exactly once', 'cada cliente deve ser servido exatamente uma vez'), enlace: L3('no se puede servir desde una planta cerrada', 'you cannot serve from a closed plant', 'não se pode servir a partir de uma fábrica fechada')}},
  {id: 'F_cfl', ra: 'RA2', b: 0.8, conjuntos: {i: 'm', j: 'n'}, fuerza: true,
    titulo: L3('Localización con capacidades', 'Capacitated facility location', 'Localização com capacidades'),
    enun: L3('Como la anterior, pero cada planta abierta tiene capacidad Q[i] y cada cliente una demanda d[j]. Busca la formulación más fuerte (pista: ¿basta con la restricción de capacidad para enlazar x con y?).', 'Like the previous one, but each open plant has capacity Q[i] and each customer a demand d[j]. Look for the strongest formulation (hint: is the capacity constraint enough to link x with y?).', 'Como a anterior, mas cada fábrica aberta tem capacidade Q[i] e cada cliente uma procura d[j]. Procure a formulação mais forte (pista: basta a restrição de capacidade para ligar x com y?).'),
    datosTxt: L3('Índices i = plantas, j = clientes. Datos: f[i], c[i,j] (coste de servir todo j desde i), d[j] demanda, Q[i] capacidad.', 'Indices i = plants, j = customers. Data: f[i], c[i,j] (cost of serving all of j from i), d[j] demand, Q[i] capacity.', 'Índices i = fábricas, j = clientes. Dados: f[i], c[i,j] (custo de servir todo j a partir de i), d[j] procura, Q[i] capacidade.'),
    gen(rnd) { const m = 3, n = 4 + Math.floor(rnd() * 2), P = coordsAleat(rnd, m), C = coordsAleat(rnd, n); const d = Array.from({length: n}, () => 2 + Math.floor(rnd() * 7)), D = d.reduce((a, b) => a + b); return {m, n, f: Array.from({length: m}, () => 5 + Math.floor(rnd() * 8)), c: P.map(p => C.map(q => dist(p, q))), d, Q: Array.from({length: m}, () => Math.ceil(D * (0.4 + rnd() * 0.3)))}; },
    ref: 'var y[i] bin\nvar x[i,j] cont 0 1\nmin sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]\nasig{j}: sum{i} x[i,j] = 1\ncap{i}: sum{j} d[j]*x[i,j] <= Q[i]*y[i]\nenlace{i,j}: x[i,j] <= y[i]',
    plantilla: 'var y[i] bin\nvar x[i,j] cont 0 1\nmin ',
    desc: {asig: L3('cada cliente debe quedar servido exactamente una vez', 'each customer must be served exactly once', 'cada cliente deve ser servido exatamente uma vez'), cap: L3('una planta no puede servir más que su capacidad, y nada si está cerrada', 'a plant cannot serve more than its capacity, and nothing if closed', 'uma fábrica não pode servir mais do que a sua capacidade, e nada se estiver fechada'), enlace: L3('no se puede servir desde una planta cerrada', 'you cannot serve from a closed plant', 'não se pode servir a partir de uma fábrica fechada')}},
  {id: 'F_pmed', ra: 'RA1', b: 0.5, conjuntos: {i: 'm', j: 'n'}, fuerza: true,
    titulo: L3('p-mediana', 'p-median', 'p-mediana'),
    enun: L3('Abre exactamente p centros entre m candidatos y asigna cada cliente a un centro abierto, minimizando la suma de costes de asignación (no hay costes fijos).', 'Open exactly p centres among m candidates and assign each customer to an open centre, minimising the sum of assignment costs (there are no fixed costs).', 'Abra exatamente p centros entre m candidatos e afete cada cliente a um centro aberto, minimizando a soma dos custos de afetação (não há custos fixos).'),
    datosTxt: L3('Índices i = candidatos (1..m), j = clientes (1..n). Datos: c[i,j] coste, p número de centros.', 'Indices i = candidates (1..m), j = customers (1..n). Data: c[i,j] cost, p number of centres.', 'Índices i = candidatos (1..m), j = clientes (1..n). Dados: c[i,j] custo, p número de centros.'),
    gen(rnd) { const m = 4, n = 5, P = coordsAleat(rnd, m), C = coordsAleat(rnd, n); return {m, n, p: 2, c: P.map(q => C.map(r => dist(q, r)))}; },
    ref: 'var y[i] bin\nvar x[i,j] cont 0 1\nmin sum{i,j} c[i,j]*x[i,j]\nasig{j}: sum{i} x[i,j] = 1\nabre: sum{i} y[i] = p\nenlace{i,j}: x[i,j] <= y[i]',
    plantilla: 'var y[i] bin\nvar x[i,j] cont 0 1\nmin ',
    desc: {asig: L3('cada cliente debe quedar asignado una vez', 'each customer must be assigned once', 'cada cliente deve ficar afetado uma vez'), abre: L3('se abren exactamente p centros', 'exactly p centres are opened', 'abrem-se exatamente p centros'), enlace: L3('solo se asigna a centros abiertos', 'customers are only assigned to open centres', 'só se afeta a centros abertos')}}
];
const FORM_BY = Object.fromEntries(FORM.map(f => [f.id, f]));
const N_JUEZ = 8;
function gapRel(zI, zL, sentido) { if (zI === undefined || zL === undefined) return null; const d = sentido === 'min' ? zI - zL : zL - zI; return Math.max(0, d) / Math.max(1e-9, Math.abs(zI)); }
/* juzga(): {ok, error?, fallo?, gapAlu, gapRef, fuerte, nVars, nFilas, nInst} */
function juzga(idEj, texto, semilla) {
  const ej = FORM_BY[idEj]; const rnd = rndDe(`${semilla}|${idEj}|juez`);
  let gA = 0, gR = 0, nA = 0, info = null;
  for (let k = 0; k < N_JUEZ; k++) {
    const datos = ej.gen(rnd);
    let mA; try { mA = compila(texto, ej, datos); } catch (e) { return {ok: false, error: e.dsl || {linea: 0, cod: 'interno', args: [e.message]}}; }
    const mR = compila(ej.ref, ej, datos);
    if (mA.sentido !== mR.sentido) return {ok: false, fallo: {cod: 'sentido', esperado: mR.sentido}, datos};
    info = {nVars: mA.nVars, nFilas: mA.nFilas};
    const rA = resuelveModelo(mA), rR = resuelveModelo(mR);
    const mismos = mA.claves.length === mR.claves.length && mA.claves.every(c => mR.claves.includes(c));
    const asigDe = (m, r) => Object.fromEntries(m.claves.map((c, j) => [c, r.x[j]]));
    if (rA.estado !== 'optimo') {
      const f = {cod: rA.estado === 'no_acotado' ? 'noAcotado' : rA.estado.startsWith('limite') ? 'limite' : 'infactible', k, datos, zRef: rR.z};
      if (mismos && rA.estado === 'infactible') f.rechaza = violaciones(mA, asigDe(mR, rR)).filter(v => v.tipo === 'fila').map(v => v.nom);
      return {ok: false, fallo: f, ...info};
    }
    if (Math.abs(rA.z - rR.z) > 1e-6 * Math.max(1, Math.abs(rR.z))) {
      const mejorQueRef = mR.sentido === 'min' ? rA.z < rR.z : rA.z > rR.z;
      const f = {cod: mejorQueRef ? 'permisivo' : 'restrictivo', k, datos, zAlu: rA.z, zRef: rR.z, solAlu: mA.claves.map((c, j) => [c, rA.x[j]]).filter(([, v]) => Math.abs(v) > 1e-7)};
      if (mismos && mejorQueRef) f.viola = [...new Set(violaciones(mR, asigDe(mA, rA)).filter(v => v.tipo === 'fila').map(v => v.nom.replace(/\[.*$/, '')))];
      if (mismos && !mejorQueRef) f.rechaza = violaciones(mA, asigDe(mR, rR)).filter(v => v.tipo === 'fila').map(v => v.nom);
      return {ok: false, fallo: f, ...info};
    }
    if (ej.fuerza) { const lA = resuelveModelo(mA, {relajado: true}), lR = resuelveModelo(mR, {relajado: true}); const a = gapRel(rA.z, lA.z, mA.sentido), b = gapRel(rR.z, lR.z, mR.sentido); if (a !== null && b !== null) { gA += a; gR += b; nA++; } }
  }
  const gapAlu = nA ? gA / nA : null, gapRef = nA ? gR / nA : null;
  return {ok: true, gapAlu, gapRef, fuerte: !ej.fuerza || gapAlu <= gapRef + 0.005, nInst: N_JUEZ, ...info};
}
/* ── contraejemplos ── */
const CX = [
  {id: 'X_bigm', ra: 'RA2', b: 0.2, modo: 'rechaza', conjuntos: {i: 'm', j: 'n'}, datos: {m: 2, n: 4, f: [6, 5], c: [[1, 2, 3, 4], [4, 3, 2, 1]]},
    titulo: L3('Una big-M demasiado pequeña', 'A big-M that is too small', 'Um big-M demasiado pequeno'),
    enun: L3('Este modelo de localización sin capacidades usa Σⱼ xᵢⱼ ≤ 2·yᵢ (M = 2) con 4 clientes. Encuentra una solución VÁLIDA en la realidad (cada cliente servido una vez, solo desde plantas abiertas) que el modelo RECHAZA.', 'This uncapacitated location model uses Σⱼ xᵢⱼ ≤ 2·yᵢ (M = 2) with 4 customers. Find a solution that is VALID in reality (each customer served once, only from open plants) that the model REJECTS.', 'Este modelo de localização sem capacidades usa Σⱼ xᵢⱼ ≤ 2·yᵢ (M = 2) com 4 clientes. Encontre uma solução VÁLIDA na realidade (cada cliente servido uma vez, só a partir de fábricas abertas) que o modelo REJEITA.'),
    modelo: 'var y[i] bin\nvar x[i,j] cont 0 1\nmin sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]\nasig{j}: sum{i} x[i,j] = 1\nenlace{i}: sum{j} x[i,j] <= 2*y[i]',
    regla: a => [0, 1, 2, 3].every(j => Math.abs(a[`x[1,${j + 1}]`] + a[`x[2,${j + 1}]`] - 1) < 1e-6) && [0, 1].every(i => [0, 1, 2, 3].every(j => a[`x[${i + 1},${j + 1}]`] <= a[`y[${i + 1}]`] + 1e-6)) && [1, 2].every(i => a[`y[${i}]`] === 0 || a[`y[${i}]`] === 1),
    pista: L3('¿Qué pasa si una sola planta abierta sirve a los cuatro clientes?', 'What happens if a single open plant serves all four customers?', 'O que acontece se uma única fábrica aberta servir os quatro clientes?')},
  {id: 'X_asig', ra: 'RA1', b: -0.4, modo: 'acepta', conjuntos: {i: 'm', j: 'n'}, datos: {m: 2, n: 3, f: [6, 5], c: [[1, 2, 3], [3, 2, 1]]},
    titulo: L3('Una igualdad convertida en desigualdad', 'An equality turned into an inequality', 'Uma igualdade convertida em desigualdade'),
    enun: L3('En este modelo alguien escribió la asignación como Σᵢ xᵢⱼ ≤ 1. Encuentra una solución que el modelo ACEPTA pero que en la realidad NO es válida (cada cliente debe quedar servido).', 'In this model someone wrote the assignment as Σᵢ xᵢⱼ ≤ 1. Find a solution that the model ACCEPTS but that is NOT valid in reality (every customer must be served).', 'Neste modelo alguém escreveu a afetação como Σᵢ xᵢⱼ ≤ 1. Encontre uma solução que o modelo ACEITA mas que NÃO é válida na realidade (cada cliente deve ser servido).'),
    modelo: 'var y[i] bin\nvar x[i,j] cont 0 1\nmin sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]\nasig{j}: sum{i} x[i,j] <= 1\nenlace{i,j}: x[i,j] <= y[i]',
    regla: a => [0, 1, 2].every(j => Math.abs(a[`x[1,${j + 1}]`] + a[`x[2,${j + 1}]`] - 1) < 1e-6) && [0, 1].every(i => [0, 1, 2].every(j => a[`x[${i + 1},${j + 1}]`] <= a[`y[${i + 1}]`] + 1e-6)),
    pista: L3('Piensa en lo más barato posible para el modelo.', 'Think of the cheapest possible thing for the model.', 'Pense no mais barato possível para o modelo.')},
  {id: 'X_disy', ra: 'RA1', b: 0.6, modo: 'acepta', conjuntos: {}, datos: {M: 20},
    titulo: L3('Una disyunción mal modelada', 'A badly modelled disjunction', 'Uma disjunção mal modelada'),
    enun: L3('Debe cumplirse AL MENOS UNA: x1 + x2 ≤ 4, o bien x1 − x2 ≥ 2. El modelo usa la misma z en las dos. Encuentra una solución que el modelo ACEPTA pero que no cumple ninguna de las dos.', 'AT LEAST ONE must hold: x1 + x2 ≤ 4, or x1 − x2 ≥ 2. The model uses the same z in both. Find a solution the model ACCEPTS but that satisfies neither.', 'Deve verificar-se PELO MENOS UMA: x1 + x2 ≤ 4, ou x1 − x2 ≥ 2. O modelo usa o mesmo z nas duas. Encontre uma solução que o modelo ACEITA mas que não cumpre nenhuma das duas.'),
    modelo: 'var x1 cont 0 10\nvar x2 cont 0 10\nvar z bin\nmax x1 + x2\nd1: x1 + x2 - 4 <= M*z\nd2: 2 - x1 + x2 <= M*z',
    regla: a => a.x1 + a.x2 <= 4 + 1e-6 || a.x1 - a.x2 >= 2 - 1e-6,
    pista: L3('¿Qué permite el modelo cuando z = 1?', 'What does the model allow when z = 1?', 'O que permite o modelo quando z = 1?')},
  {id: 'X_cub', ra: 'RA2', b: 0.3, modo: 'rechaza', conjuntos: {i: 'n'}, datos: {n: 3, v: [10, 7, 6], w: [5, 4, 3], C: 8},
    titulo: L3('Una «cubierta» que no lo es', 'A “cover” that is not one', 'Uma «cobertura» que não o é'),
    enun: L3('Mochila con pesos 5, 4, 3 y capacidad 8. Alguien añadió x1 + x3 ≤ 1 creyendo que es una desigualdad de cubierta. Demuestra que no es válida: encuentra una solución FACTIBLE de la mochila que esa desigualdad RECHAZA.', 'Knapsack with weights 5, 4, 3 and capacity 8. Someone added x1 + x3 ≤ 1 believing it is a cover inequality. Show it is not valid: find a FEASIBLE knapsack solution that this inequality REJECTS.', 'Mochila com pesos 5, 4, 3 e capacidade 8. Alguém acrescentou x1 + x3 ≤ 1 julgando que é uma desigualdade de cobertura. Demonstre que não é válida: encontre uma solução ADMISSÍVEL da mochila que essa desigualdade REJEITA.'),
    modelo: 'var x[i] bin\nmax sum{i} v[i]*x[i]\ncap: sum{i} w[i]*x[i] <= C\ncubierta: x[1] + x[3] <= 1',
    regla: a => [1, 2, 3].every(i => a[`x[${i}]`] === 0 || a[`x[${i}]`] === 1) && 5 * a['x[1]'] + 4 * a['x[2]'] + 3 * a['x[3]'] <= 8,
    pista: L3('¿Caben juntos los objetos 1 y 3?', 'Do items 1 and 3 fit together?', 'Cabem juntos os objetos 1 e 3?')}
];
const CX_BY = Object.fromEntries(CX.map(c => [c.id, c]));
function modeloCX(id) { const c = CX_BY[id]; return compila(c.modelo, {conjuntos: c.conjuntos}, c.datos); }
/* compruebaCX(): {ok, motivo, viol:[nombres]} — motivo ∈ ok | modeloRechaza | modeloAcepta | reglaInvalida | reglaValida */
function compruebaCX(id, asig) {
  const c = CX_BY[id], m = modeloCX(id);
  const a = Object.fromEntries(m.claves.map(k => [k, +(asig[k] ?? 0)]));
  const viol = violaciones(m, a), regla = !!c.regla(a);
  if (c.modo === 'acepta') { if (viol.length) return {ok: false, motivo: 'modeloRechaza', viol: viol.map(v => v.nom)}; if (regla) return {ok: false, motivo: 'reglaValida'}; return {ok: true, motivo: 'ok'}; }
  if (!regla) return {ok: false, motivo: 'reglaInvalida'};
  if (!viol.length) return {ok: false, motivo: 'modeloAcepta'};
  return {ok: true, motivo: 'ok', viol: viol.map(v => v.nom)};
}
/* ítems de laboratorio (cuentan para el modelo de dominio; no los elige la ruta de práctica) */
const LAB_ITEMS = [
  ...FORM.map(f => ({id: f.id, ra: 'RA1', b: f.b, tipo: 'lab', bloom: 'aplicar'})),
  ...FORM.filter(f => f.fuerza).map(f => ({id: f.id + '_f', ra: 'RA2', b: f.b + 0.3, tipo: 'lab', bloom: 'evaluar'})),
  ...CX.map(c => ({id: c.id, ra: c.ra, b: c.b, tipo: 'lab', bloom: 'analizar'}))
];
if (typeof module !== 'undefined') module.exports = {...(module.exports || {}), FORM, CX, juzga, compruebaCX, modeloCX, LAB_ITEMS, gapRel};
