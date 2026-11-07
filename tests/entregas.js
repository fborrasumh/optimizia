// node tests/entregas.js instancias SEM   → JSON con las 3 instancias y el torneo
// node tests/entregas.js verifica SEM < entregas.json → resultados de la verificación
const X = require('./ctx.js')(); const [, , modo, sem] = process.argv;
if (modo === 'instancias') console.log(JSON.stringify({nb: [1, 2, 3].map(k => X.instanciaNB(k, sem)), torneo: X.torneo(X.semanaISO(new Date(Date.UTC(2026, 10, 9))))}));
else { const ent = JSON.parse(require('fs').readFileSync(0, 'utf8')); console.log(JSON.stringify({nb: ent.nb.map(e => X.verificaEntrega(e, sem)), torneo: X.verificaTorneo(ent.torneo.torneo, ent.torneo.ruta), esperado: [1, 2].map(k => X.solucionNB(X.instanciaNB(k, sem)))})); }
