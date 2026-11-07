/* ══ LENGUAJE DE MODELADO de OptimizIA (pequeño, estilo AMPL) ══
     # comentario
     var y[i] bin                 (bin | int | cont; cotas opcionales: var x[i,j] cont 0 1 · var t cont 0 inf)
     min sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]          (o max …)
     asig{j}: sum{i} x[i,j] = 1                             (restricción con nombre, para cada j)
     enlace{i,j}: x[i,j] <= y[i]
   · Los índices (i, j, k…) recorren los conjuntos del ejercicio; «sum{i}» se aplica al término que le sigue (o a un paréntesis).
   · Datos: los del ejercicio (f[i], c[i,j], d[j], Q[i], C, n…). Índices numéricos explícitos empiezan en 1 (x[1,2]).
   · Solo modelos LINEALES: el producto de dos variables es un error.
   compila(texto, ej, datos) → {vars:[{nom,lb,ub,ent}], P (para resuelveLP/MIP, minimización), sentido, filas:[{nom,…}]}
   Los errores son objetos {linea, cod, args} que la interfaz traduce. ══ */
function errDSL(linea, cod, ...args) { const e = new Error(cod); e.dsl = {linea, cod, args}; return e; }
function tokeniza(s, linea) {
  const out = []; let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '#') break;
    const dos = s.slice(i, i + 2);
    if (dos === '<=' || dos === '>=' || dos === '==') { out.push({t: 'op', v: dos === '==' ? '=' : dos}); i += 2; continue; }
    if (ch === '≤' || ch === '≥') { out.push({t: 'op', v: ch === '≤' ? '<=' : '>='}); i++; continue; }
    if ('=<>'.includes(ch)) { if (ch !== '=') throw errDSL(linea, 'opEstricto', ch); out.push({t: 'op', v: '='}); i++; continue; }
    if ('[]{}(),:+-*/'.includes(ch)) { out.push({t: ch}); i++; continue; }
    if (ch === '·' || ch === '×') { out.push({t: '*'}); i++; continue; }
    if (ch === '−' || ch === '–') { out.push({t: '-'}); i++; continue; }
    if (ch === 'Σ' || ch === '∑') { out.push({t: 'id', v: 'sum'}); i++; continue; }
    let m = s.slice(i).match(/^\d+(?:[.,]\d+)?(?:e[+-]?\d+)?/i);
    if (m) { out.push({t: 'num', v: parseFloat(m[0].replace(',', '.'))}); i += m[0].length; continue; }
    m = s.slice(i).match(/^[A-Za-z_À-ɏ][\wÀ-ɏ]*/);
    if (m) { out.push({t: 'id', v: m[0]}); i += m[0].length; continue; }
    throw errDSL(linea, 'caracter', ch);
  }
  return out;
}
/* ── analizador ── */
function Parser(toks, linea) { this.t = toks; this.p = 0; this.linea = linea; }
Parser.prototype.ver = function (k = 0) { return this.t[this.p + k]; };
Parser.prototype.toma = function (tipo, v) { const x = this.t[this.p]; if (!x || x.t !== tipo || (v !== undefined && x.v !== v)) throw errDSL(this.linea, 'esperaba', v || tipo, x ? (x.v ?? x.t) : '⏎'); this.p++; return x; };
Parser.prototype.es = function (tipo, v) { const x = this.t[this.p]; return x && x.t === tipo && (v === undefined || x.v === v); };
Parser.prototype.indices = function () {   // {i, j} o {i in I, j in J}
  this.toma('{'); const ids = [];
  for (;;) { ids.push(this.toma('id').v); if (this.es('id', 'in')) { this.p++; this.toma('id'); } if (this.es(',')) { this.p++; continue; } break; }
  this.toma('}'); return ids;
};
Parser.prototype.expr = function () {
  let sg = 1; if (this.es('+')) this.p++; else if (this.es('-')) { this.p++; sg = -1; }
  const terms = [{sg, t: this.term()}];
  while (this.es('+') || this.es('-')) { const s = this.ver().t === '+' ? 1 : -1; this.p++; terms.push({sg: s, t: this.term()}); }
  return {k: 'suma', terms};
};
Parser.prototype.term = function () {
  const fs = [this.factor()];
  while (this.es('*') || this.es('/')) { const op = this.ver().t; this.p++; const f = this.factor(); fs.push(op === '/' ? {k: 'div', f} : f); }
  return {k: 'prod', fs};
};
Parser.prototype.factor = function () {
  const x = this.ver(); if (!x) throw errDSL(this.linea, 'finInesperado');
  if (x.t === 'num') { this.p++; return {k: 'num', v: x.v}; }
  if (x.t === '(') { this.p++; const e = this.expr(); this.toma(')'); return e; }
  if (x.t === '-') { this.p++; return {k: 'neg', f: this.factor()}; }
  if (x.t === 'id' && x.v === 'sum') { this.p++; const ids = this.indices(); return {k: 'sum', ids, cuerpo: this.term()}; }
  if (x.t === 'id') {
    this.p++; const idx = [];
    if (this.es('[')) { this.p++; for (;;) { const y = this.ver(); if (y?.t === 'num') { idx.push({n: y.v}); this.p++; } else idx.push({i: this.toma('id').v}); if (this.es(',')) { this.p++; continue; } break; } this.toma(']'); }
    return {k: 'ref', nom: x.v, idx};
  }
  throw errDSL(this.linea, 'inesperado', x.v ?? x.t);
};
/* ── evaluación a forma lineal {c: Map(clave → coef), k: constante} ── */
const lin = (k = 0) => ({c: new Map(), k});
function linSuma(a, b, s = 1) { const r = {c: new Map(a.c), k: a.k + s * b.k}; for (const [v, x] of b.c) r.c.set(v, (r.c.get(v) || 0) + s * x); return r; }
function linEscala(a, f) { const r = {c: new Map(), k: a.k * f}; for (const [v, x] of a.c) r.c.set(v, x * f); return r; }
function Modelo(ej, datos) { this.ej = ej; this.datos = datos; this.vars = new Map(); this.decl = {}; this.filas = []; this.obj = null; this.sentido = null; }
Modelo.prototype.tam = function (ix, linea) { const n = this.ej.conjuntos[ix]; if (n === undefined) throw errDSL(linea, 'indiceDesconocido', ix, Object.keys(this.ej.conjuntos).join(', ')); return typeof n === 'number' ? n : this.datos[n]; };
Modelo.prototype.claveVar = function (nom, vals) { return vals.length ? `${nom}[${vals.map(v => v + 1).join(',')}]` : nom; };
Modelo.prototype.evalua = function (nodo, env, linea) {
  switch (nodo.k) {
    case 'num': return lin(nodo.v);
    case 'neg': return linEscala(this.evalua(nodo.f, env, linea), -1);
    case 'suma': return nodo.terms.reduce((acc, t) => linSuma(acc, this.evalua(t.t, env, linea), t.sg), lin());
    case 'prod': {
      let r = lin(1);
      for (const f of nodo.fs) {
        if (f.k === 'div') { const d = this.evalua(f.f, env, linea); if (d.c.size) throw errDSL(linea, 'noLineal'); if (d.k === 0) throw errDSL(linea, 'divCero'); r = linEscala(r, 1 / d.k); continue; }
        const e = this.evalua(f, env, linea);
        if (r.c.size && e.c.size) throw errDSL(linea, 'noLineal');
        r = r.c.size ? linEscala(r, e.k) : e.c.size ? linEscala(e, r.k) : lin(r.k * e.k);
      }
      return r;
    }
    case 'sum': {
      let acc = lin();
      const rec = (d, en) => { if (d === nodo.ids.length) { acc = linSuma(acc, this.evalua(nodo.cuerpo, en, linea)); return; } const ix = nodo.ids[d]; if (ix in env) throw errDSL(linea, 'indiceRepetido', ix); const n = this.tam(ix, linea); for (let v = 0; v < n; v++) rec(d + 1, {...en, [ix]: v}); };
      rec(0, env); return acc;
    }
    case 'ref': {
      const vals = nodo.idx.map(x => { if (x.n !== undefined) return x.n - 1; if (!(x.i in env)) throw errDSL(linea, 'indiceLibre', x.i, nodo.nom); return env[x.i]; });
      if (this.decl[nodo.nom]) {
        const d = this.decl[nodo.nom];
        if (d.dims.length !== vals.length) throw errDSL(linea, 'dimVar', nodo.nom, d.dims.length);
        vals.forEach((v, q) => { if (v < 0 || v >= this.tam(d.dims[q], linea)) throw errDSL(linea, 'fueraRango', nodo.nom); });
        const r = lin(); r.c.set(this.claveVar(nodo.nom, vals), 1); return r;
      }
      if (nodo.nom in this.datos) {
        let v = this.datos[nodo.nom];
        for (const q of vals) { if (!Array.isArray(v) || q < 0 || q >= v.length) throw errDSL(linea, 'dimDato', nodo.nom); v = v[q]; }
        if (typeof v !== 'number') throw errDSL(linea, 'dimDato', nodo.nom);
        return lin(v);
      }
      if (nodo.nom in this.ej.conjuntos && !vals.length && typeof this.ej.conjuntos[nodo.nom] !== 'undefined') throw errDSL(linea, 'nombreDesconocido', nodo.nom, this.nombresDisponibles());
      throw errDSL(linea, 'nombreDesconocido', nodo.nom, this.nombresDisponibles());
    }
  }
  throw errDSL(linea, 'inesperado', nodo.k);
};
Modelo.prototype.nombresDisponibles = function () { return [...Object.keys(this.decl), ...Object.keys(this.datos).filter(k => !k.startsWith('_'))].join(', '); };
const TIPOS = {bin: 'bin', binaria: 'bin', binary: 'bin', binaria_: 'bin', int: 'int', entera: 'int', integer: 'int', cont: 'cont', continua: 'cont', continuous: 'cont', real: 'cont'};
function compila(texto, ej, datos) {
  const M = new Modelo(ej, datos);
  const lineas = String(texto || '').split('\n');
  lineas.forEach((raw, li) => {
    const linea = li + 1; const toks = tokeniza(raw, linea); if (!toks.length) return;
    const P = new Parser(toks, linea);
    const a = toks[0];
    if (a.t === 'id' && a.v === 'var') {
      P.p++; const nom = P.toma('id').v; const dims = [];
      if (P.es('[')) { P.p++; for (;;) { dims.push(P.toma('id').v); if (P.es(',')) { P.p++; continue; } break; } P.toma(']'); }
      dims.forEach(d => M.tam(d, linea));
      let tipo = 'cont'; if (P.es('id') && TIPOS[P.ver().v.toLowerCase()]) tipo = TIPOS[P.toma('id').v.toLowerCase()];
      let lb = tipo === 'bin' ? 0 : 0, ub = tipo === 'bin' ? 1 : Infinity;
      const leeCota = () => { let s = 1; if (P.es('-')) { P.p++; s = -1; } if (P.es('id') && /^inf/i.test(P.ver().v)) { P.p++; return s * Infinity; } return s * P.toma('num').v; };
      if (P.ver()) { lb = leeCota(); if (P.ver()) ub = leeCota(); }
      if (P.ver()) throw errDSL(linea, 'sobra', P.ver().v ?? P.ver().t);
      if (M.decl[nom] || nom in datos) throw errDSL(linea, 'nombreRepetido', nom);
      M.decl[nom] = {dims, tipo, lb, ub, linea};
      const rec = (d, vals) => { if (d === dims.length) { M.vars.set(M.claveVar(nom, vals), {lb, ub, ent: tipo !== 'cont', nom}); return; } for (let v = 0; v < M.tam(dims[d], linea); v++) rec(d + 1, [...vals, v]); };
      rec(0, []); return;
    }
    if (a.t === 'id' && (a.v === 'min' || a.v === 'max' || a.v === 'minimize' || a.v === 'maximize' || a.v === 'minimizar' || a.v === 'maximizar')) {
      if (M.obj) throw errDSL(linea, 'dosObjetivos');
      P.p++; if (P.es(':')) P.p++;
      M.sentido = a.v.startsWith('min') ? 'min' : 'max'; M.obj = M.evalua(P.expr(), {}, linea);
      if (P.ver()) throw errDSL(linea, 'sobra', P.ver().v ?? P.ver().t); return;
    }
    /* restricción: nombre{índices}: expr op expr   (el nombre y los índices son opcionales: «{j}: …» o directamente «expr op expr») */
    let nom = 'r' + linea, ids = [];
    if (a.t === 'id' && a.v !== 'sum' && !M.decl[a.v] && !(a.v in datos) && (P.ver(1)?.t === ':' || P.ver(1)?.t === '{')) { nom = a.v; P.p++; }
    if (P.es('{')) ids = P.indices();
    if (P.es(':')) P.p++;
    const lhs = P.expr(); const op = P.toma('op').v; const rhs = P.expr();
    if (P.ver()) throw errDSL(linea, 'sobra', P.ver().v ?? P.ver().t);
    const rec = (d, env) => {
      if (d === ids.length) { const e = linSuma(M.evalua(lhs, env, linea), M.evalua(rhs, env, linea), -1); if (!e.c.size) { const ok = op === '<=' ? e.k <= 1e-9 : op === '>=' ? e.k >= -1e-9 : Math.abs(e.k) <= 1e-9; if (!ok) M.filas.push({nom: nom + (ids.length ? `[${ids.map(i => env[i] + 1).join(',')}]` : ''), c: new Map(), s: op, b: -e.k, imposible: true, linea}); return; } M.filas.push({nom: nom + (ids.length ? `[${ids.map(i => env[i] + 1).join(',')}]` : ''), c: e.c, s: op, b: -e.k, linea}); return; }
      const ix = ids[d]; for (let v = 0; v < M.tam(ix, linea); v++) rec(d + 1, {...env, [ix]: v});
    };
    rec(0, {});
  });
  if (!M.obj) throw errDSL(0, 'sinObjetivo');
  if (!M.vars.size) throw errDSL(0, 'sinVariables');
  /* a la forma del solver (siempre minimización) */
  const claves = [...M.vars.keys()], pos = new Map(claves.map((k, i) => [k, i]));
  const sg = M.sentido === 'max' ? -1 : 1;
  const c = claves.map(k => sg * (M.obj.c.get(k) || 0));
  const filas = M.filas.map(f => ({a: [...f.c].map(([k, v]) => [pos.get(k), v]), s: f.s, b: f.b}));
  for (const f of M.filas) if (f.imposible) filas.push({a: [], s: '<=', b: -1});
  const P = {n: claves.length, c, k: sg * M.obj.k, filas, lb: claves.map(k => M.vars.get(k).lb), ub: claves.map(k => M.vars.get(k).ub), ent: claves.map(k => M.vars.get(k).ent)};
  return {claves, P, sentido: M.sentido, filasNom: M.filas, nVars: claves.length, nFilas: M.filas.length, decl: M.decl};
}
/* resolver el modelo compilado; z en el sentido original */
function resuelveModelo(m, {relajado = false, maxNodos = 20000} = {}) {
  const r = relajado ? resuelveLP(m.P) : resuelveMIP(m.P, {maxNodos});
  const sg = m.sentido === 'max' ? -1 : 1;
  return {...r, z: r.z === undefined ? undefined : sg * r.z};
}
/* ¿cumple una asignación todas las restricciones del modelo? → lista de violadas (vacía = factible) */
function violaciones(m, asig) {
  const val = k => asig[k] ?? 0, out = [];
  m.claves.forEach((k, j) => { const v = val(k), lb = m.P.lb[j], ub = m.P.ub[j]; if (v < lb - 1e-6 || v > ub + 1e-6) out.push({nom: k, tipo: 'cota'}); else if (m.P.ent[j] && Math.abs(v - Math.round(v)) > 1e-6) out.push({nom: k, tipo: 'entera'}); });
  m.filasNom.forEach(f => { let s = 0; for (const [k, c] of f.c) s += c * val(k); const ok = f.imposible ? false : f.s === '<=' ? s <= f.b + 1e-6 : f.s === '>=' ? s >= f.b - 1e-6 : Math.abs(s - f.b) <= 1e-6; if (!ok) out.push({nom: f.nom, tipo: 'fila', lhs: s, s: f.s, b: f.b}); });
  return out;
}
if (typeof module !== 'undefined') module.exports = {...(module.exports || {}), compila, resuelveModelo, violaciones, tokeniza};
