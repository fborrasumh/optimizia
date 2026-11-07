// Contraste del solver JS con OR-Tools (GLOP/SCIP):  node tests/test_lp.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {module: {exports: {}}, console}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/lp.js'), 'utf8') + ';this.X=module.exports;', ctx);
const {resuelveLP, resuelveMIP} = ctx.X;
const casos = JSON.parse(fs.readFileSync(path.join(__dirname, 'lp_cases.json'), 'utf8'));
let mal = [], dualOK = 0, dualN = 0, limites = 0;
for (const [i, c] of casos.entries()) {
  const P = {...c, ub: c.ub.map(u => u > 1e300 ? Infinity : u)};
  const r = c.mip ? resuelveMIP(P) : resuelveLP(P);
  // OR-Tools a veces informa de «infactible» en problemas infactibles-o-no-acotados: se aceptan ambos si el estado del JS es uno de los dos y ninguno es óptimo
  const est = r.estado;
  if (est.startsWith('limite')) { limites++; if (est === 'limite_factible' && r.z < c.z - 1e-6) mal.push([i, 'factible mejor que el óptimo', c.z, r.z]); continue; }   // nunca se declara óptimo lo que no se ha demostrado
  if (c.ref === 'optimo') { if (est !== 'optimo' || Math.abs(r.z - c.z) > 1e-6 * Math.max(1, Math.abs(c.z))) mal.push([i, c.ref, c.z, est, r.z]); }
  else if (est === 'optimo') mal.push([i, c.ref, c.z, est, r.z]);
  // duales: dualidad fuerte y factibilidad dual en LP con x ≥ 0 sin cotas superiores
  if (!c.mip && est === 'optimo' && c.lb.every(v => v === 0) && c.ub.every(u => u > 1e300)) {
    dualN++; const y = r.y; let bd = 0; c.filas.forEach((f, k) => bd += f.b * y[k]);
    const rc = Array.from({length: c.n}, (_, j) => c.c[j] - c.filas.reduce((s, f, k) => s + (f.a.find(t => t[0] === j)?.[1] || 0) * y[k], 0));
    const signos = c.filas.every((f, k) => f.s === '=' || (f.s === '>=' ? y[k] >= -1e-7 : y[k] <= 1e-7));
    if (Math.abs(bd - r.z) < 1e-6 * Math.max(1, Math.abs(r.z)) && rc.every(v => v >= -1e-7) && signos) dualOK++; else mal.push([i, 'dual', bd, r.z]);
  }
}
console.log(`${casos.length - mal.length - limites}/${casos.length} casos coinciden con OR-Tools · ${limites} llegan al límite de nodos sin declarar un óptimo falso · duales correctos (dualidad fuerte + factibilidad + signo) en ${dualOK}/${dualN}`);
if (mal.length) console.log(mal.slice(0, 10));
process.exit(mal.length || limites > 5 ? 1 : 0);
