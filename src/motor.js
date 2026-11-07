/* ══ MOTOR (lógica pura, sin DOM: se prueba en Node) ══
   · PRNG con semilla (mulberry32): misma semilla → misma variante, mismo orden de opciones.
   · Modelo de dominio por RA tipo Elo con olvido: θ ← θ + K·(acierto − σ(θ − b)); al mostrarlo, θ_ef = θ − OLVIDO·ln(1 + días sin practicar).
   · Ruta determinista y explicable: mismos eventos y misma hora → mismo siguiente ítem, con su motivo.
   · Corrección numérica por código y diagnóstico por recálculo (errores típicos declarados en curriculum.js).
   · Filtro de fugas del tutor de IA: elimina frases con la solución. ══ */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 0x811c9dc5; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193); } return h >>> 0; }
const rndDe = s => mulberry32(hashStr(s));
const sigm = x => 1 / (1 + Math.exp(-x));
const DIA = 864e5, OLVIDO = 0.15, OBJ_P = 0.7, DOMINADO = 80;
const ITEMS = [...MC.map(x => ({...x, tipo: 'mc'})), ...PLANT.map(x => ({...x, tipo: 'num'}))];
/* laboratorio, cuadernos, misiones y torneo también informan al modelo de dominio (la ruta de práctica no los elige) */
const ITEM = Object.fromEntries([...ITEMS, ...(typeof LAB_ITEMS !== 'undefined' ? LAB_ITEMS : []), ...(typeof ACT_ITEMS !== 'undefined' ? ACT_ITEMS : [])].map(x => [x.id, x]));
/* diagnóstico inicial (pretest): por cada RA, el ítem de opción múltiple más cercano a dificultad 0.
   postest: el siguiente más cercano; queda RESERVADO (la práctica no lo usa) para que la comparación sea limpia. */
const ordDiag = ra => MC.filter(x => x.ra === ra).sort((a, b) => Math.abs(a.b) - Math.abs(b.b) || (a.id < b.id ? -1 : 1));
const DIAG = RAS.map(r => ordDiag(r.id)[0].id);
const POST = RAS.map(r => ordDiag(r.id)[1].id);
const RESERVA = new Set(POST);

function modelo(ev, ahora) {
  const M = Object.fromEntries(RAS.map(r => [r.id, {theta: 0, n: 0, ok: 0, ultimo: null}]));
  for (const e of ev) {
    const m = M[e.ra], it = ITEM[e.id]; if (!m || !it) continue;
    const K = 0.6 / Math.sqrt(1 + m.n);
    m.theta += K * ((e.ok ? 1 : 0) - sigm(m.theta - it.b)); m.n++; if (e.ok) m.ok++; m.ultimo = e.t;
  }
  for (const r of RAS) { const m = M[r.id]; const dias = m.ultimo ? Math.max(0, (ahora - m.ultimo) / DIA) : 0; m.ef = m.theta - OLVIDO * Math.log(1 + dias); m.dominio = m.n ? Math.round(100 * sigm(m.ef)) : null; m.dias = dias; }
  return M;
}
/* ¿qué fallos están pendientes de repaso? (fallado y no acertado después; vence tras 3 respuestas más, o tras 1 si se falló «seguro») */
function repasosPendientes(ev) {
  const pend = [];
  ev.forEach((e, i) => { if (e.ok || !ITEMS.some(x => x.id === e.id) || RESERVA.has(e.id)) return; const despues = ev.slice(i + 1); if (despues.some(x => x.id === e.id && x.ok)) return; if (pend.some(p => p.id === e.id)) return; pend.push({id: e.id, ra: e.ra, vence: i + (e.conf === 2 ? 2 : 4) <= ev.length}); });   // error con seguridad alta → vuelve antes
  return pend.filter(p => !ev.slice(-1).some(x => x.id === p.id));
}
const usos = (ev, id) => ev.filter(e => e.id === id).length;
function eligeItem(ra, ev, M) {
  const recientes = new Set(ev.slice(-6).map(e => e.id));
  const objetivo = M[ra].ef - Math.log(OBJ_P / (1 - OBJ_P));   // σ(θ − b) = 0,7  ⇒  b = θ − 0,85
  const cand = ITEMS.filter(x => x.ra === ra && !RESERVA.has(x.id));
  const libres = cand.filter(x => !recientes.has(x.id));
  const pool = libres.length ? libres : cand;
  return pool.slice().sort((a, b) => Math.abs(a.b - objetivo) - Math.abs(b.b - objetivo) || usos(ev, a.id) - usos(ev, b.id) || (a.id < b.id ? -1 : 1))[0];
}
/* siguiente(): devuelve {id, ra, k, fase, motivo:{cod, ra, dom, otro}}; cod ∈ diag | post | repaso | elegido | nuevo | debil | intercalado | mantener */
function siguiente(ev, ahora, opt = {}) {
  if (opt.post) { const hp = new Set(ev.filter(e => e.fase === 'post').map(e => e.id)); const fp = POST.find(id => !hp.has(id)); return fp ? {id: fp, ra: ITEM[fp].ra, k: 0, fase: 'post', motivo: {cod: 'post', ra: ITEM[fp].ra}} : null; }
  const hechos = new Set(ev.filter(e => e.fase === 'diag').map(e => e.id));
  const fd = DIAG.find(id => !hechos.has(id));
  if (fd && !opt.sinDiag) return {id: fd, ra: ITEM[fd].ra, k: 0, fase: 'diag', motivo: {cod: 'diag', ra: ITEM[fd].ra}};
  const M = modelo(ev, ahora);
  const pk = it => ({id: it.id, ra: it.ra, k: usos(ev, it.id), fase: 'prac'});
  if (opt.ra && M[opt.ra]) return {...pk(eligeItem(opt.ra, ev, M)), motivo: {cod: 'elegido', ra: opt.ra, dom: M[opt.ra].dominio}};
  const rep = repasosPendientes(ev).find(p => p.vence);
  if (rep) return {...pk(ITEM[rep.id]), motivo: {cod: 'repaso', ra: rep.ra, dom: M[rep.ra].dominio}};
  const sinHacer = RAS.find(r => !M[r.id].n);
  if (sinHacer) return {...pk(eligeItem(sinHacer.id, ev, M)), motivo: {cod: 'nuevo', ra: sinHacer.id}};
  const orden = RAS.map(r => r.id).sort((a, b) => M[a].ef - M[b].ef || (a < b ? -1 : 1));
  if (M[orden[0]].dominio >= DOMINADO) { const viejo = RAS.map(r => r.id).sort((a, b) => (M[a].ultimo || 0) - (M[b].ultimo || 0) || (a < b ? -1 : 1))[0]; return {...pk(eligeItem(viejo, ev, M)), motivo: {cod: 'mantener', ra: viejo, dom: M[viejo].dominio}}; }
  let ra = orden[0], cod = 'debil', otro = null;
  const ult = ev.slice(-2).map(e => e.ra);
  if (ult.length === 2 && ult.every(x => x === ra) && M[orden[1]].dominio - M[ra].dominio <= 15) { otro = ra; ra = orden[1]; cod = 'intercalado'; }
  return {...pk(eligeItem(ra, ev, M)), motivo: {cod, ra, dom: M[ra].dominio, otro}};
}
/* instancia concreta de un ítem para una persona (semilla) y un uso k */
function instancia(id, semilla, k) {
  const it = ITEM[id];
  if (it.tipo === 'mc') { const r = rndDe(`${semilla}|${id}|orden`); const ord = it.ops.map((_, i) => i); for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; } return {id, tipo: 'mc', ord}; }
  const p = it.gen(rndDe(`${semilla}|${id}|${k}`));
  return {id, tipo: 'num', p, sol: it.sol(p)};
}
/* lectura de números escritos por personas: «1,5», «1.5», «−3», «12 %», «1.234,5» */
function leeNum(s) {
  let x = String(s ?? '').trim().replace(/[−–]/g, '-').replace(/\s|%/g, '');
  if (!x) return NaN;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(x)) x = x.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(x)) x = x.replace(/,/g, '');
  else x = x.replace(',', '.');
  return /^-?\d*\.?\d+$/.test(x) ? parseFloat(x) : NaN;
}
const cerca = (a, b) => Math.abs(a - b) <= Math.max(0.011, 0.005 * Math.abs(b));
/* corrige(): {ok, diag} — diag = índice del error típico reconocido (o null) */
function corrige(inst, resp) {
  const it = ITEM[inst.id];
  if (inst.tipo === 'mc') return {ok: +resp === it.ok, diag: null};
  const x = leeNum(resp); if (Number.isNaN(x)) return {ok: false, diag: null, nan: true};
  if (cerca(x, inst.sol)) return {ok: true, diag: null};
  const d = (it.mut || []).findIndex(m => { const v = m.f(inst.p); return !cerca(v, inst.sol) && cerca(x, v); });
  return {ok: false, diag: d >= 0 ? d : null};
}
/* filtro de fugas del tutor: quita frases que contienen la solución numérica (si no está en el enunciado) o la opción correcta */
const nrm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
function filtraFugas(texto, inst, enunciado, lang = 'es') {
  const lineas = String(texto || '').split('\n').map(l => l.split(/(?<=[.!?;:])\s+/));
  const numsEn = new Set((String(enunciado).match(/-?\d+(?:[.,]\d+)?/g) || []).map(leeNum));
  const it = ITEM[inst.id];
  const correcta = it.tipo === 'mc' ? nrm(it.ops[it.ok][lang] || it.ops[it.ok].es) : null;
  const letra = it.tipo === 'mc' ? 'ABCD'[inst.ord.indexOf(it.ok)] : null;
  const fuga = f => {
    if (it.tipo === 'num') return (f.match(/-?\d+(?:[.,]\d+)?/g) || []).map(leeNum).some(v => !numsEn.has(v) && Math.abs(v - inst.sol) <= Math.max(0.006, 0.007 * Math.abs(inst.sol)));
    const nf = nrm(f);
    return (correcta.length >= 5 && nf.includes(correcta)) || new RegExp(`\\b(opcion|option|opcao|respuesta|answer|resposta)\\s*\\(?${letra}\\)?\\b`, 'i').test(nf) || new RegExp(`(^|\\s)\\(?${letra}\\)\\s`, 'i').test(' ' + f + ' ');
  };
  let quitadas = 0;
  const out = lineas.map(fr => fr.filter(f => { if (f.trim() && fuga(f)) { quitadas++; return false; } return true; }).join(' ')).filter((l, i, a) => l.trim() || (i && a[i - 1].trim()));
  return {texto: out.join('\n').trim(), quitadas};
}
/* ejemplo sin clave: una estudiante FICTICIA simulada (determinista) con dominios distintos por RA, durante 12 días */
function simulaEjemplo(ahora) {
  const verdad = {RA1: 1.2, RA2: 0.4, RA3: -0.2, RA4: -0.9, RA5: 0.7}, r = rndDe('ejemplo-optimizia');
  const ev = []; let t = ahora - 12 * DIA;
  for (let i = 0; i < 34; i++) {
    const s = siguiente(ev, t); const it = ITEM[s.id]; const inst = instancia(s.id, 'EJEMPLO', s.k);
    const ok = r() < sigm(verdad[s.ra] - it.b);
    const resp = it.tipo === 'mc' ? (ok ? it.ok : (it.ok + 1) % it.ops.length) : (ok ? inst.sol : (it.mut?.[0] ? it.mut[0].f(inst.p) : inst.sol + 1));
    const conf = r() < 0.5 ? (ok ? 2 : 1) : r() < 0.5 ? 2 : 0;
    ev.push({t, id: s.id, ra: s.ra, tipo: it.tipo, k: s.k, fase: s.fase, ok, resp: String(resp), diag: ok ? null : corrige(inst, resp).diag, ayuda: null, conf, ej: 1});
    t += (i % 6 === 5 ? 1.6 * DIA : 0.05 * DIA) + r() * 0.02 * DIA;
  }
  return ev;
}
if (typeof module !== 'undefined') module.exports = {...(module.exports || {}), modelo, siguiente, instancia, corrige, leeNum, filtraFugas, simulaEjemplo, repasosPendientes, ITEMS, ITEM, DIAG, POST, rndDe};
