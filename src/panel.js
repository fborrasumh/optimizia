/* ══ PANEL DEL PROFESORADO (lógica pura). Agrega las entregas anónimas que el alumnado exporta (sin servidor). ══
   · Análisis de ítems: % de acierto (1.er intento), discriminación (correlación punto-biserial con el acierto en el resto),
     distractores elegidos y no elegidos, dificultad propuesta (orientativa) para recalibrar el banco.
   · Errores típicos más frecuentes, calibración de la confianza, pretest/postest, cuadernos verificados y torneo.
   · simulaClase(): una clase FICTICIA para enseñar el panel sin datos reales. ══ */
function corr(a, b) { const n = a.length; if (n < 3) return null; const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n; let sab = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return sa && sb ? sab / Math.sqrt(sa * sb) : null; }
const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
function validaEntregaAlumno(j) { return j && j.formato === 'optimizia-entrega/1' && Array.isArray(j.ev) && typeof j.sem === 'string'; }
function agrega(entregas, ahora) {
  const E = entregas.filter(validaEntregaAlumno);
  const alumnos = E.map(e => {
    const M = modelo(e.ev, ahora);
    const prim = {}; e.ev.filter(x => ITEMS.some(i => i.id === x.id)).forEach(x => { if (!(x.id in prim)) prim[x.id] = x; });
    const tasa = Object.values(prim).length ? Object.values(prim).filter(x => x.ok).length / Object.values(prim).length : 0;
    return {sem: e.sem, M, prim, tasa, e};
  });
  const porRA = Object.fromEntries(RAS.map(r => [r.id, {doms: alumnos.map(a => a.M[r.id].dominio).filter(v => v !== null)}]));
  for (const r of RAS) { const d = porRA[r.id].doms; porRA[r.id].media = media(d); porRA[r.id].bajo = d.filter(v => v < 40).length; }
  const items = ITEMS.map(it => {
    const res = alumnos.filter(a => a.prim[it.id]).map(a => ({ok: a.prim[it.id].ok ? 1 : 0, resto: (Object.values(a.prim).filter(x => x.id !== it.id && x.ok).length) / Math.max(1, Object.values(a.prim).length - 1), resp: a.prim[it.id].resp, theta: a.M[it.ra].theta}));
    const n = res.length, p = n ? res.filter(x => x.ok).length / n : null;
    const disc = corr(res.map(x => x.ok), res.map(x => x.resto));
    const dis = it.tipo === 'mc' ? it.ops.map((_, k) => res.filter(x => +x.resp === k).length) : null;
    const ps = n ? (res.filter(x => x.ok).length + 0.5) / (n + 1) : null;
    const bProp = n >= 5 ? media(res.map(x => x.theta)) - Math.log(ps / (1 - ps)) : null;
    const avisos = [];
    if (n >= 5 && p > 0.9) avisos.push('facil'); if (n >= 5 && p < 0.2) avisos.push('dificil');
    if (n >= 8 && disc !== null && disc < 0.2) avisos.push('noDiscrimina');
    if (dis && n >= 8) dis.forEach((c, k) => { if (k !== it.ok && c === 0) avisos.push('distractorMuerto:' + k); });
    return {id: it.id, ra: it.ra, tipo: it.tipo, n, p, disc, dis, b: it.b, bProp, avisos};
  }).filter(x => x.n);
  const errores = {}; alumnos.forEach(a => a.e.ev.forEach(x => { if (x.diag != null && ITEM[x.id]?.mut?.[x.diag]) { const k = x.id + '|' + x.diag; errores[k] = (errores[k] || 0) + 1; } }));
  const cal = [0, 1, 2].map(c => { const xs = alumnos.flatMap(a => a.e.ev.filter(x => x.conf === c)); return {conf: c, n: xs.length, acierto: xs.length ? xs.filter(x => x.ok).length / xs.length : null}; });
  const prepost = Object.fromEntries(RAS.map(r => { const pre = alumnos.map(a => a.e.ev.find(x => x.fase === 'diag' && x.ra === r.id)).filter(Boolean), post = alumnos.map(a => a.e.ev.find(x => x.fase === 'post' && x.ra === r.id)).filter(Boolean); return [r.id, {pre: pre.length ? pre.filter(x => x.ok).length / pre.length : null, post: post.length ? post.filter(x => x.ok).length / post.length : null, nPost: post.length}]; }));
  const nb = [1, 2, 3].map(k => alumnos.filter(a => a.e.nb?.[k]?.ok).length);
  const torneos = {}; alumnos.forEach(a => (a.e.torneo || []).forEach(t => { (torneos[t.semana] ||= []).push({sem: a.sem, L: t.L, gap: t.gap}); }));
  Object.values(torneos).forEach(l => l.sort((x, y) => x.L - y.L));
  const misiones = Object.fromEntries((typeof MISIONES !== 'undefined' ? MISIONES : []).map(m => [m.id, alumnos.filter(a => a.e.misiones?.[m.id]).length]));
  return {n: alumnos.length, descartadas: entregas.length - E.length, porRA, items, errores: Object.entries(errores).sort((a, b) => b[1] - a[1]), cal, prepost, nb, torneos, misiones};
}
/* clase ficticia determinista: 24 estudiantes simulados con dominios distintos */
function simulaClase(ahora, n = 24) {
  const out = [], rr = rndDe('clase-ficticia');
  for (let s = 0; s < n; s++) {
    const sem = 'FIC' + String(s + 1).padStart(2, '0'), base = rr() * 1.6 - 0.6;
    const verdad = Object.fromEntries(RAS.map(r => [r.id, base + (rr() - 0.5) * 1.4 + (r.id === 'RA4' ? -0.6 : 0)]));
    const ev = []; let t = ahora - 20 * DIA; const nEv = 25 + Math.floor(rr() * 25);
    for (let i = 0; i < nEv; i++) {
      const sg = siguiente(ev, t); const it = ITEM[sg.id], inst = instancia(sg.id, sem, sg.k);
      const ok = rr() < sigm(verdad[sg.ra] - it.b);
      const resp = it.tipo === 'mc' ? (ok ? it.ok : [1, 2, 3].map(d => (it.ok + d) % it.ops.length)[Math.floor(rr() * (it.id === 'd1' ? 1 : 3))]) : (ok ? inst.sol : (it.mut?.length && rr() < 0.7 ? it.mut[Math.floor(rr() * it.mut.length)].f(inst.p) : inst.sol * 1.3 + 1));
      const conf = ok ? (rr() < 0.55 ? 2 : rr() < 0.75 ? 1 : 0) : (rr() < 0.3 ? 2 : rr() < 0.55 ? 1 : 0);
      ev.push({t, id: sg.id, ra: sg.ra, tipo: it.tipo, k: sg.k, fase: sg.fase, ok, resp: String(resp), diag: ok ? null : corrige(inst, resp).diag, conf, ej: 1});
      t += 0.3 * DIA + rr() * 0.4 * DIA;
    }
    for (let i = 0; i < POST.length; i++) { const id = POST[i], it = ITEM[id], ok = rr() < sigm(verdad[it.ra] + 0.5 - it.b); ev.push({t: t += 0.01 * DIA, id, ra: it.ra, tipo: 'mc', k: 0, fase: 'post', ok, resp: String(ok ? it.ok : (it.ok + 1) % 4), diag: null, conf: 1, ej: 1}); }
    const nb = Object.fromEntries([1, 2, 3].map(k => [k, {ok: rr() < 0.75 - 0.15 * k + 0.2}]));
    const L = 420 + Math.floor(rr() * 60);
    out.push({formato: 'optimizia-entrega/1', version: VERSION_APP, sem, ev, nb, torneo: [{semana: '2026-W45', L, gap: Math.max(0, 100 * (L - 418) / L)}], misiones: rr() < 0.6 ? {M1: {ok: true}} : {}, ficticia: true});
  }
  return out;
}
const VERSION_APP = '1.0.0';
if (typeof module !== 'undefined') module.exports = {...(module.exports || {}), agrega, simulaClase, corr};
