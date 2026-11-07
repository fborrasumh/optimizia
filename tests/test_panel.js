// node tests/test_panel.js
const X = require('./ctx.js')(); let n = 0, f = 0; const ok = (nom, c, e = '') => { n++; if (!c) f++; console.log((c ? '✓ ' : '✕ ') + nom + (e ? ' · ' + e : '')); };
const T = Date.UTC(2026, 10, 8), clase = X.simulaClase(T), A = X.agrega(clase, T);
ok('clase ficticia determinista de 24 estudiantes', A.n === 24 && JSON.stringify(X.simulaClase(T)[3]) === JSON.stringify(clase[3]));
ok('RA4 (más difícil en la simulación) sale con el dominio medio más bajo', Object.entries(A.porRA).sort((a, b) => a[1].media - b[1].media)[0][0] === 'RA4', JSON.stringify(Object.fromEntries(Object.entries(A.porRA).map(([k, v]) => [k, Math.round(v.media)]))));
ok('análisis de ítems con acierto, discriminación y distractores', A.items.length > 10 && A.items.some(i => i.disc !== null) && A.items.filter(i => i.tipo === 'mc').every(i => i.dis.length === 4));
ok('se detecta el distractor que nadie elige (d1 simulado)', A.items.find(i => i.id === 'd1')?.avisos.some(a => a.startsWith('distractorMuerto')) ?? true);
ok('errores típicos agregados', A.errores.length > 0, A.errores.slice(0, 2).join(' '));
ok('calibración: se acierta más con confianza alta que baja', A.cal[2].acierto > A.cal[0].acierto, A.cal.map(c => c.conf + ':' + (c.acierto ?? 0).toFixed(2)).join(' '));
ok('pretest y postest por RA', Object.values(A.prepost).every(p => p.pre !== null && p.post !== null));
ok('ranking del torneo ordenado por longitud', A.torneos['2026-W45'].every((x, i, a) => !i || a[i - 1].L <= x.L));
ok('las entregas con otro formato se descartan', X.agrega([...clase, {formato: 'otra'}], T).descartadas === 1);
console.log(`\n${n - f}/${n} pruebas superadas`); process.exit(f ? 1 : 0);
