// Pruebas de la lógica pura en Node:  node tests/test_motor.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = path.join(__dirname, '..');
const ctx = {console, module: {exports: {}}}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(R + '/src/curriculum.js', 'utf8') + '\n' + fs.readFileSync(R + '/src/motor.js', 'utf8') + '\n;this.X={CURSO,RAS,MC,PLANT,BLOQUES,BLOOM,...module.exports};', ctx);
const X = ctx.X; let fallos = 0, n = 0;
const ok = (nombre, c, extra = '') => { n++; if (!c) fallos++; console.log((c ? '✓ ' : '✕ ') + nombre + (extra ? ' · ' + extra : '')); };
const nrm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%]+/g, ' ').trim();
// 1 · citas literales a la guía
const guia = nrm(fs.readFileSync(__dirname + '/guia.txt', 'utf8'));
const citas = [...X.RAS.flatMap(r => r.origen.map(o => o.cita)), X.CURSO.evaluacion.cita];
const malas = citas.filter(c => !guia.includes(nrm(c)));
ok('todas las citas de origen aparecen literalmente en la Guía Docente', !malas.length, malas.join(' | '));
ok('código, nombre y ECTS coinciden con la guía', guia.includes('8265') && guia.includes(nrm(X.CURSO.nombre)) && guia.includes('ects 3'));
// 2 · banco: estructura y tres idiomas
const L = ['es', 'en', 'pt'];
const mcMal = X.MC.filter(m => !L.every(l => m.q[l] && m.exp[l] && m.pista[l] && m.ops.every(o => o[l])) || m.ok < 0 || m.ok >= m.ops.length || !X.RAS.some(r => r.id === m.ra) || !X.BLOOM[m.bloom]);
ok('opción múltiple: 3 idiomas, índice correcto válido, RA y Bloom existentes', !mcMal.length, mcMal.map(m => m.id).join(','));
ok('cada RA tiene al menos 4 ítems', X.RAS.every(r => X.ITEMS.filter(i => i.ra === r.id).length >= 4), X.RAS.map(r => r.id + ':' + X.ITEMS.filter(i => i.ra === r.id).length).join(' '));
ok('ids únicos', new Set(X.ITEMS.map(i => i.id)).size === X.ITEMS.length);
// 3 · plantillas: 300 variantes cada una, solución finita, determinismo, errores típicos distinguibles
for (const P of X.PLANT) {
  let finitas = 0, distintas = new Set(), mutUtil = new Array((P.mut || []).length).fill(0), enunOK = true;
  for (let k = 0; k < 300; k++) {
    const a = X.instancia(P.id, 'S' + k, k), b = X.instancia(P.id, 'S' + k, k);
    if (JSON.stringify(a) !== JSON.stringify(b)) { ok(P.id + ' determinista', false); break; }
    if (Number.isFinite(a.sol)) finitas++; distintas.add(a.sol);
    (P.mut || []).forEach((m, i) => { const v = m.f(a.p); if (Math.abs(v - a.sol) > Math.max(0.011, 0.005 * Math.abs(a.sol))) mutUtil[i]++; });
    L.forEach(l => { const e = P.enun(a.p, l); if (!e || /undefined|NaN/.test(e)) enunOK = false; });
    if (!X.corrige(a, String(a.sol).replace('.', ',')).ok) { ok(P.id + ' acepta su propia solución con coma decimal', false, String(a.sol)); break; }
  }
  ok(`${P.id}: 300 variantes deterministas con solución finita y enunciado en 3 idiomas`, finitas === 300 && enunOK, `${distintas.size} soluciones distintas`);
  ok(`${P.id}: cada error típico se distingue de la solución en ≥ 40 % de las variantes`, mutUtil.every(c => c >= 120), mutUtil.join('/'));
}
// 4 · oráculos independientes: casos de verdad conocida
const K = {v: [10, 13, 7, 8, 6], w: [5, 7, 4, 5, 3], C: 12};
ok('mochila del cuaderno 1: óptimo entero 23 (como SCIP)', (() => { const p = {...K}; let b = 0; for (let s = 0; s < 32; s++) { let w = 0, v = 0; for (let i = 0; i < 5; i++) if (s >> i & 1) { w += p.w[i]; v += p.v[i]; } if (w <= p.C) b = Math.max(b, v); } return b === 23; })());
const tam = X.PLANT.find(p => p.id === 'p_tam');
ok('formulación fuerte UFL 8×25 = 225 restricciones (como el cuaderno 1)', tam.sol({m: 8, n: 25}) === 225);
const cs = X.PLANT.find(p => p.id === 'p_cs');
ok('corte: patrón (0,2,0,2) del cuaderno 2 con π de los patrones homogéneos (it. 1) → coste reducido −0,29', Math.abs(cs.sol({W: 100, w: [45, 36, 31, 14], pi: [1 / 2, 1 / 2, 1 / 3, 1 / 7]}) - (-0.29)) < 0.006);
ok('recocido: Δ=10, T=10 → 36,8 %', X.PLANT.find(p => p.id === 'p_sa').sol({d: 10, T: 10}) === 36.8);
// 5 · corrección y diagnóstico
const iLP = X.instancia('p_lp', 'Z', 0); const m0 = X.ITEM.p_lp.mut[0].f(iLP.p);
ok('diagnóstico reconoce «olvidar la fracción»', X.corrige(iLP, String(m0)).diag === 0);
ok('lectura de números: 1,5 · 1.234,5 · −3 · 12 %', X.leeNum('1,5') === 1.5 && X.leeNum('1.234,5') === 1234.5 && X.leeNum('−3') === -3 && X.leeNum('12 %') === 12 && Number.isNaN(X.leeNum('abc')));
// 6 · ruta: determinista y explicable
const ahora = Date.UTC(2026, 10, 7);
const ev = X.simulaEjemplo(ahora);
ok('ejemplo simulado determinista', JSON.stringify(ev) === JSON.stringify(X.simulaEjemplo(ahora)), ev.length + ' eventos');
ok('mismos eventos → mismo siguiente ítem y motivo', JSON.stringify(X.siguiente(ev, ahora)) === JSON.stringify(X.siguiente(ev.slice(), ahora)));
ok('el diagnóstico va primero y cubre los 5 RA', X.siguiente([], ahora).motivo.cod === 'diag' && new Set(X.DIAG.map(id => X.ITEM[id].ra)).size === 5);
const M = X.modelo(ev, ahora);
ok('el modelo distingue RA fuertes y débiles en el ejemplo (RA1 > RA4)', M.RA1.dominio > M.RA4.dominio, Object.entries(M).map(([k, m]) => k + ':' + m.dominio).join(' '));
ok('el olvido baja el dominio mostrado con el tiempo', X.modelo(ev, ahora + 30 * 864e5).RA1.dominio < M.RA1.dominio);
const fallo = [...ev, ...[0, 1, 2, 3].map(i => ({t: ahora + i, id: i ? 'h' + i : 'f4', ra: i ? 'RA5' : 'RA1', tipo: 'mc', fase: 'prac', ok: !!i}))];
ok('un fallo vuelve como repaso tras 3 respuestas', X.siguiente(fallo, ahora + 10).motivo.cod === 'repaso' || X.repasosPendientes(fallo).some(p => p.id === 'f4' && p.vence));
const sec = []; let evs = ev.slice(); for (let i = 0; i < 40; i++) { const s = X.siguiente(evs, ahora + i * 1000); sec.push(s.motivo.cod); evs.push({t: ahora + i * 1000, id: s.id, ra: s.ra, tipo: X.ITEM[s.id].tipo, fase: s.fase, ok: i % 3 !== 0}); }
ok('la ruta usa varios motivos (débil, intercalado, repaso…)', new Set(sec).size >= 2, [...new Set(sec)].join(','));
ok('ningún ítem se repite en 3 pasos seguidos', evs.slice(ev.length).every((e, i, a) => i < 2 || !(a[i - 1].id === e.id && a[i - 2].id === e.id)));
// 7 · filtro de fugas
const iN = X.instancia('p_sa', 'F', 0);
const f1 = X.filtraFugas(`Recuerda la fórmula e^(−Δ/T). El resultado es ${String(iN.sol).replace('.', ',')} %. Revisa el signo.`, iN, X.ITEM.p_sa.enun(iN.p, 'es'));
ok('el filtro quita la frase con la solución numérica y deja el resto', f1.quitadas === 1 && /fórmula/.test(f1.texto) && /signo/.test(f1.texto), f1.texto);
const iM = X.instancia('d1', 'F', 0); const letra = 'ABCD'[iM.ord.indexOf(X.ITEM.d1.ok)];
const f2 = X.filtraFugas(`Piensa en el número de variables. La respuesta es la generación de columnas. Elige la opción ${letra}.`, iM, '', 'es');
ok('el filtro quita la opción correcta y la letra', f2.quitadas === 2 && /variables/.test(f2.texto), f2.texto);
const f3 = X.filtraFugas('¿Sobran variables o restricciones? Mira cuántos patrones hay.', iM, '', 'es');
ok('el filtro no toca una pista legítima', f3.quitadas === 0);
console.log(`\n${n - fallos}/${n} pruebas superadas`); process.exit(fallos ? 1 : 0);
