/* ══ Interfaz del LABORATORIO: corrector de formulaciones, contraejemplos, poliedros 2D, carrera de cotas, ejemplos resueltos ══ */
const LAB_TABS = [['form', 'Formular', 'pencil'], ['cx', 'Contraejemplos', 'target'], ['poli', 'Poliedros y árboles', 'hexagon'], ['cotas', 'Carrera de cotas', 'chart'], ['res', 'Ejemplos resueltos', 'steps']];
function tabs(id, lista, actual, attr) { $(id).innerHTML = lista.map(([v, tx, ic]) => `<button type="button" role="tab" class="op-tab-b" ${attr}="${v}" aria-selected="${actual === v}">${ic ? ico(ic) : ''}<span>${esc(t(tx))}</span></button>`).join(''); }
function pintaLab() {
  tabs('labTabs', LAB_TABS, S.labTab, 'data-labtab');
  ({form: pintaForm, cx: pintaCX, poli: pintaPoli, cotas: pintaCotas, res: pintaRes}[S.labTab] || pintaForm)();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-labtab]'); if (b) { S.labTab = b.dataset.labtab; guarda(); pintaLab(); } });
const msgDSL = er => {
  const M = {opEstricto: 'No se admiten desigualdades estrictas («{0}»): usa <= o >=.', caracter: 'Carácter no válido: «{0}».', esperaba: 'Se esperaba «{0}» y hay «{1}».', finInesperado: 'La línea termina antes de tiempo.', inesperado: 'No se esperaba «{0}» aquí.', noLineal: 'Producto de dos variables: el modelo debe ser lineal.', divCero: 'División por cero.', indiceDesconocido: 'Índice «{0}» desconocido. Índices disponibles: {1}.', indiceRepetido: 'El índice «{0}» ya está en uso en esta expresión.', indiceLibre: 'El índice «{0}» de {1} no está definido: ¿falta un sum{{0}} o un {{0}} en el nombre de la restricción?', dimVar: 'La variable {0} tiene {1} índice(s).', fueraRango: 'Índice fuera de rango en {0}.', dimDato: 'El dato {0} no tiene esos índices.', nombreDesconocido: 'Nombre desconocido: «{0}». Disponibles: {1}.', sobra: 'Sobra «{0}» al final de la línea.', nombreRepetido: 'El nombre «{0}» ya existe.', dosObjetivos: 'Solo puede haber una función objetivo.', sinObjetivo: 'Falta la función objetivo (min … o max …).', sinVariables: 'No hay variables declaradas (var …).', interno: 'Error interno: {0}'};
  const tx = t(M[er.cod] || er.cod, ...(er.args || []));
  return (er.linea ? t('Línea {0}: ', er.linea) : '') + tx.replace(/\{\{0\}\}/g, '{' + (er.args?.[0] || 'i') + '}');
};
const datosHtml = (ej, d) => Object.entries(d).filter(([k]) => !['m', 'n'].includes(k) || true).map(([k, v]) => Array.isArray(v) ? (Array.isArray(v[0]) ? `<p class="op-dato"><b>${esc(k)}</b></p>` + tablaHtml({cab: ['', ...v[0].map((_, j) => String(j + 1))], filas: v.map((f, i) => [String(i + 1), ...f.map(String)])}) : `<p class="op-dato"><b>${esc(k)}</b> = (${v.map(x => esc(fmtN(x))).join('; ')})</p>`) : `<p class="op-dato"><b>${esc(k)}</b> = ${esc(fmtN(v))}</p>`).join('');
/* ── formular ── */
function pintaForm() {
  const ej = FORM_BY[S.formEj], txt = S.form[ej.id] ?? ej.plantilla, r = S.formRes[ej.id];
  const ejemplo = ej.gen(rndDe(`${S.sem}|${ej.id}|juez`));
  let res = '';
  if (r) {
    if (r.error) res = `<div class="aviso" role="status">${esc(msgDSL(r.error))}</div>`;
    else if (r.ok) res = `<div class="${r.fuerte ? 'okbox' : 'aviso'}" role="status"><b>${esc(r.fuerte ? t('Correcta y fuerte.') : t('Correcta, pero débil.'))}</b> ${esc(t('Mismo óptimo que la referencia en las {0} instancias.', r.nInst))} ${ej.fuerza && r.gapAlu !== null ? esc(t('Gap medio de tu relajación lineal: {0} % (referencia: {1} %).', fmtN(100 * r.gapAlu, 1), fmtN(100 * r.gapRef, 1))) : ''} ${esc(t('Tamaño: {0} variables y {1} restricciones.', r.nVars, r.nFilas))}${!r.fuerte ? `<p>${esc(t('Tu relajación está más lejos del óptimo entero: ¿puedes desagregar alguna restricción o ajustar alguna big-M?'))}</p>` : ''}</div>`;
    else { const f = r.fallo; const D = f.datos ? `<details class="op-det"><summary>${esc(t('Ver la instancia en la que falla'))}</summary>${datosHtml(ej, f.datos)}</details>` : '';
      const tx = {sentido: t('El ejercicio pide {0}imizar y tu modelo hace lo contrario.', f.esperado === 'min' ? 'min' : 'max'), infactible: t('En la instancia {0} tu modelo es infactible, pero el problema real tiene solución (coste óptimo {1}).', (f.k ?? 0) + 1, fmtN(f.zRef ?? 0)), noAcotado: t('En la instancia {0} tu modelo no está acotado: falta alguna restricción.', (f.k ?? 0) + 1), limite: t('El solver del navegador no terminó: simplifica el modelo.'), permisivo: t('En la instancia {0} tu modelo encuentra {1}, mejor que el óptimo real {2}: admite soluciones que la realidad no permite.', f.k + 1, fmtN(f.zAlu), fmtN(f.zRef)), restrictivo: t('En la instancia {0} tu modelo da {1}, peor que el óptimo real {2}: excluye alguna solución válida.', f.k + 1, fmtN(f.zAlu), fmtN(f.zRef))}[f.cod];
      const extra = (f.viola || []).map(v => `<li>${esc(t('Tu solución incumple una regla real: {0}.', L(ej.desc[v]) || v))}</li>`).join('') + ((f.rechaza || []).length ? `<li>${esc(t('Restricciones de tu modelo que rechazan la solución óptima real: {0}.', f.rechaza.slice(0, 6).join(', ')))}</li>` : '') + ((f.solAlu || []).length ? `<li>${esc(t('Tu solución: {0}', f.solAlu.slice(0, 14).map(([k, v]) => `${k} = ${fmtN(v)}`).join(' · ')))}</li>` : '');
      res = `<div class="aviso" role="status"><b>${esc(t('Todavía no.'))}</b> ${esc(tx)}${extra ? `<ul class="op-ul">${extra}</ul>` : ''}${D}</div>`; }
    if (r.ok && r.fuerte) res += `<details class="op-det"><summary>${esc(t('Ver la formulación de referencia'))}</summary><pre class="fa-pre">${esc(ej.ref)}</pre></details>`;
  }
  $('labBox').innerHTML = `<div class="card"><div class="op-ra-sel" role="group" aria-label="${esc(t('Ejercicio'))}">${FORM.map(f => `<button type="button" class="op-seg" data-formej="${f.id}" aria-pressed="${f.id === ej.id}">${esc(L(f.titulo))}${S.formRes[f.id]?.ok ? ' ✓' : ''}</button>`).join('')}</div></div>
    <div class="card"><div class="op-qcab">${chip(ej.ra)}${ej.fuerza ? chip('RA2', t('se mide la fuerza')) : ''}</div><h3 class="op-h3">${esc(L(ej.titulo))}</h3><p class="op-enun">${esc(L(ej.enun))}</p><p class="help">${esc(L(ej.datosTxt))}</p>
      <details class="op-det"><summary>${esc(t('Ver una instancia de ejemplo'))}</summary>${datosHtml(ej, ejemplo)}</details>
      <div class="field"><label for="dslTxt">${esc(t('Tu formulación'))}</label><textarea id="dslTxt" class="op-code" rows="9" spellcheck="false" autocapitalize="off" autocomplete="off">${esc(txt)}</textarea></div>
      <div class="actions"><button class="btn btn-primary" type="button" id="btnJuzga">${ico('check')}<span>${esc(t('Comprobar con 8 instancias'))}</span></button><button class="btn btn-ghost" type="button" id="btnSintaxis">${ico('help')}<span>${esc(t('Sintaxis'))}</span></button><button class="btn btn-ghost" type="button" id="btnPlantilla">${ico('refresh')}<span>${esc(t('Volver a la plantilla'))}</span></button></div>
      <div id="sintaxis" hidden><pre class="fa-pre">var y[i] bin            # bin | int | cont  (cotas: var x[i,j] cont 0 1)
var x[i,j] cont 0 1
min sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]     # o max …
asig{j}: sum{i} x[i,j] = 1                         # una restricción por cada j
enlace{i,j}: x[i,j] <= y[i]
# sum{i} se aplica al término que sigue; usa paréntesis para más: sum{i} (a[i]*x[i] + b[i]*y[i])</pre></div>
      <div id="juezRes" aria-live="polite">${res}</div></div>`;
  $('dslTxt').oninput = e => { S.form[ej.id] = e.target.value; guarda(); };
  $('btnSintaxis').onclick = () => { $('sintaxis').hidden = !$('sintaxis').hidden; };
  $('btnPlantilla').onclick = () => { S.form[ej.id] = ej.plantilla; delete S.formRes[ej.id]; guarda(); pintaForm(); };
  $('btnJuzga').onclick = () => {
    asegSemilla(); $('juezRes').innerHTML = `<p class="help"><span class="spin"></span> ${esc(t('Resolviendo 8 instancias con tu modelo y con el de referencia…'))}</p>`;
    setTimeout(() => { const r2 = juzga(ej.id, $('dslTxt').value, S.sem); S.formRes[ej.id] = r2; if (!r2.error) { regEvento(ej.id, r2.ok); if (ej.fuerza && r2.ok) regEvento(ej.id + '_f', r2.fuerte); } guarda(); pintaForm(); document.querySelector('#juezRes [role=status]')?.focus?.(); }, 30);
  };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-formej]'); if (b) { S.formEj = b.dataset.formej; guarda(); pintaForm(); } });
/* ── contraejemplos ── */
function pintaCX() {
  const c = CX_BY[S.cxEj], m = modeloCX(c.id), val = S.cx[c.id] || {}, r = S.cxRes[c.id];
  const msg = r ? (r.ok ? `<div class="okbox" role="status"><b>${esc(t('¡Contraejemplo válido!'))}</b> ${esc(c.modo === 'acepta' ? t('El modelo acepta tu solución y la realidad no la permite: el modelo está mal.') : t('Tu solución es válida en la realidad y el modelo la rechaza ({0}): el modelo está mal.', (r.viol || []).join(', ')))}</div>`
    : `<div class="aviso" role="status">${esc({modeloRechaza: t('El modelo también rechaza tu solución ({0}). Busca una que el modelo ACEPTE.', (r.viol || []).join(', ')), reglaValida: t('Tu solución es válida también en la realidad: no demuestra el error.'), reglaInvalida: t('Tu solución no es válida en la realidad: tiene que serlo para demostrar que el modelo la rechaza sin motivo.'), modeloAcepta: t('El modelo acepta tu solución: no demuestra el error. Busca una válida que el modelo RECHACE.')}[r.motivo])}</div>`) : '';
  $('labBox').innerHTML = `<div class="card"><div class="op-ra-sel" role="group" aria-label="${esc(t('Ejercicio'))}">${CX.map(x => `<button type="button" class="op-seg" data-cxej="${x.id}" aria-pressed="${x.id === c.id}">${esc(L(x.titulo))}${S.cxRes[x.id]?.ok ? ' ✓' : ''}</button>`).join('')}</div></div>
    <div class="card"><div class="op-qcab">${chip(c.ra)}<span class="fa-chip">${esc(c.modo === 'acepta' ? t('El modelo acepta de más') : t('El modelo rechaza de más'))}</span></div><h3 class="op-h3">${esc(L(c.titulo))}</h3><p class="op-enun">${esc(L(c.enun))}</p>
      <p class="help">${esc(t('Modelo defectuoso y sus datos:'))}</p><pre class="fa-pre">${esc(c.modelo)}</pre>${datosHtml(c, c.datos)}
      <fieldset class="op-cxvars"><legend>${esc(t('Tu solución (las variables que no rellenes valen 0)'))}</legend>${m.claves.map(k => `<label class="op-cxv"><span>${esc(k)}</span><input type="text" inputmode="decimal" data-cxvar="${esc(k)}" value="${esc(val[k] ?? '')}" aria-label="${esc(k)}"></label>`).join('')}</fieldset>
      <div class="actions"><button class="btn btn-primary" type="button" id="btnCX">${ico('check')}<span>${esc(t('Comprobar contraejemplo'))}</span></button><button class="btn btn-ghost" type="button" id="btnCXpista">${ico('bulb')}<span>${esc(t('Ver una pista'))}</span></button></div><p class="help" id="cxPista" hidden>${esc(L(c.pista))}</p><div aria-live="polite">${msg}</div></div>`;
  $$('[data-cxvar]').forEach(i => i.oninput = () => { (S.cx[c.id] ||= {})[i.dataset.cxvar] = i.value; guarda(); });
  $('btnCXpista').onclick = () => { $('cxPista').hidden = false; };
  $('btnCX').onclick = () => { const a = {}, cur = S.cx[c.id] || {}; for (const k of m.claves) { const v = leeNum(cur[k] ?? ''); a[k] = Number.isNaN(v) ? 0 : v; } const r2 = compruebaCX(c.id, a); S.cxRes[c.id] = r2; regEvento(c.id, r2.ok); guarda(); pintaCX(); };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-cxej]'); if (b) { S.cxEj = b.dataset.cxej; guarda(); pintaCX(); } });
/* ── poliedros, cortes y ramificación ── */
function svgPoli(a, arbolSel) {
  const W = 340, pad = 30, U = (W - 2 * pad) / CAJA, X = x => pad + x * U, Y = y => W - pad - y * U;
  let s = `<svg viewBox="0 0 ${W} ${W}" class="op-svg" role="img" aria-labelledby="poliT"><title id="poliT">${esc(t('Región lineal, puntos enteros y envolvente convexa'))}</title>`;
  for (let k = 0; k <= CAJA; k++) s += `<line x1="${X(k)}" y1="${Y(0)}" x2="${X(k)}" y2="${Y(CAJA)}" class="op-g"/><line x1="${X(0)}" y1="${Y(k)}" x2="${X(CAJA)}" y2="${Y(k)}" class="op-g"/><text x="${X(k)}" y="${Y(0) + 14}" class="op-ax">${k}</text><text x="${X(0) - 10}" y="${Y(k) + 4}" class="op-ax">${k}</text>`;
  if (a.V.length >= 3) s += `<polygon points="${a.V.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}" class="op-reg"/>`;
  if (a.H.length >= 3) s += `<polygon points="${a.H.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}" class="op-hull"/>`;
  a.filas.filter(f => f.corte).forEach(f => { const [p, q] = [[0, f.b / (f.a[1] || 1e-9)], [CAJA, (f.b - f.a[0] * CAJA) / (f.a[1] || 1e-9)]]; if (Math.abs(f.a[1]) < 1e-9) s += `<line x1="${X(f.b / f.a[0])}" y1="${Y(0)}" x2="${X(f.b / f.a[0])}" y2="${Y(CAJA)}" class="op-cut"/>`; else s += `<line x1="${X(p[0])}" y1="${Y(p[1])}" x2="${X(q[0])}" y2="${Y(q[1])}" class="op-cut"/>`; });
  a.E.forEach(p => { s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.2" class="op-ent"/>`; });
  s += `<circle cx="${X(a.lp[0])}" cy="${Y(a.lp[1])}" r="6" class="op-lp"/><path d="M${X(a.ip[0])},${Y(a.ip[1]) - 8} l2.4,5.5 6,.6 -4.5,4 1.3,5.9 -5.2-3 -5.2,3 1.3-5.9 -4.5-4 6-.6z" class="op-ip"/>`;
  if (arbolSel?.x) s += `<circle cx="${X(arbolSel.x[0])}" cy="${Y(arbolSel.x[1])}" r="7" class="op-sel"/>`;
  return s + '</svg>';
}
function svgArbol(arb, sel) {
  if (!arb?.length) return '';
  const hijos = {}; arb.forEach(n => { if (n.padre !== null) (hijos[n.padre] ||= []).push(n); });
  Object.values(hijos).forEach(l => l.sort((a, b) => (a.rama?.[1] === '<=' ? 0 : 1) - (b.rama?.[1] === '<=' ? 0 : 1)));
  const pos = {}; let hoja = 0;
  const rec = (n, d) => { const h = hijos[n.id] || []; if (!h.length) pos[n.id] = {x: hoja++, d}; else { h.forEach(c => rec(c, d + 1)); pos[n.id] = {x: (pos[h[0].id].x + pos[h.at(-1).id].x) / 2, d}; } };
  rec(arb.find(n => n.padre === null), 0);
  const prof = Math.max(...Object.values(pos).map(p => p.d)), W = Math.max(320, hoja * 74), H = (prof + 1) * 78 + 20, XP = x => 37 + x * 74, YP = d => 26 + d * 78;
  const col = {entero: 'op-n-ent', podado: 'op-n-pod', infactible: 'op-n-inf', ramifica: 'op-n-ram'};
  let s = `<svg viewBox="0 0 ${W} ${H}" class="op-svg op-arbol" style="max-width:${W}px" role="group" aria-labelledby="arbT"><title id="arbT">${esc(t('Árbol de ramificación y acotación'))}</title>`;
  arb.forEach(n => { if (n.padre !== null) { const p = pos[n.padre], q = pos[n.id]; s += `<line x1="${XP(p.x)}" y1="${YP(p.d)}" x2="${XP(q.x)}" y2="${YP(q.d)}" class="op-edge"/><text x="${(XP(p.x) + XP(q.x)) / 2 + 4}" y="${(YP(p.d) + YP(q.d)) / 2}" class="op-ax">x${n.rama[0] + 1}${n.rama[1] === '<=' ? '≤' : '≥'}${n.rama[2]}</text>`; } });
  arb.forEach((n, k) => { const q = pos[n.id]; s += `<g data-nodo="${k}" tabindex="0" role="button" aria-label="${esc(t('Nodo {0}: {1}', k + 1, t('nodo.' + n.estado)))}"><circle cx="${XP(q.x)}" cy="${YP(q.d)}" r="17" class="${col[n.estado] || ''} ${sel === k ? 'op-n-sel' : ''}"/><text x="${XP(q.x)}" y="${YP(q.d) + 4}" class="op-nt">${n.z === undefined ? '∅' : fmtN(n.z, 1)}</text></g>`; });
  return s + '</svg>';
}
function pintaPoli() {
  const id = S.poliEj, st = S.poli[id] ||= {cortes: [], pred: null, bb: null, sel: null}, a = analizaPoli(id, st.cortes), pr = POLI_BY[id];
  const filas = filasPoli(pr, st.cortes);
  const restr = filas.map((f, i) => `<li>${f.corte ? '✂️ ' : ''}${fmtN(f.a[0])}·x1 ${f.a[1] < 0 ? '−' : '+'} ${fmtN(Math.abs(f.a[1]))}·x2 ≤ ${fmtN(f.b)}${f.corte ? ` <button type="button" class="op-x" data-quitacorte="${i - pr.A.length}" aria-label="${esc(t('Quitar corte'))}">×</button>` : ''}</li>`).join('');
  const bb = st.bb, nodoSel = bb && st.sel !== null ? bb.arbol[st.sel] : null;
  $('labBox').innerHTML = `<div class="card"><div class="op-ra-sel" role="group" aria-label="${esc(t('Problema'))}">${POLI.map(p => `<button type="button" class="op-seg" data-poliej="${p.id}" aria-pressed="${p.id === id}">${esc(L(p.nom))}</button>`).join('')}</div></div>
    <div class="op-2col"><div class="card"><h3 class="op-h3">${esc(t('máx {0}·x1 + {1}·x2', fmtN(pr.c[0]), fmtN(pr.c[1])))}</h3><ul class="op-ul op-restr">${restr}<li>x1, x2 ≥ 0 ${esc(t('y enteras'))}</li></ul>${svgPoli(a, nodoSel)}
      <p class="op-leyenda"><span class="op-lg op-lg-reg"></span>${esc(t('relajación lineal'))} <span class="op-lg op-lg-hull"></span>${esc(t('envolvente convexa'))} <span class="op-lg op-lg-lp"></span>${esc(t('óptimo lineal'))} ★ ${esc(t('óptimo entero'))}</p>
      <p>${esc(t('Óptimo lineal: {0} en ({1}; {2}) · óptimo entero: {3} · gap cerrado por tus cortes: {4} %', fmtN(a.zLP), fmtN(a.lp[0]), fmtN(a.lp[1]), fmtN(a.zIP), Math.round(100 * a.cerrado)))}</p></div>
      <div class="card"><h3 class="op-h3">${esc(t('Añade un corte'))}</h3><p class="help">${esc(t('Un corte válido no elimina ningún punto entero factible y, si es útil, deja fuera el óptimo lineal actual.'))}</p>
        <div class="op-fila"><input type="text" inputmode="decimal" id="ca1" aria-label="a1" placeholder="a1"><span>·x1 +</span><input type="text" inputmode="decimal" id="ca2" aria-label="a2" placeholder="a2"><span>·x2 ≤</span><input type="text" inputmode="decimal" id="cb" aria-label="b" placeholder="b"></div>
        <div class="actions"><button class="btn btn-primary btn-sm" type="button" id="btnCorte">${ico('plus')}<span>${esc(t('Añadir corte'))}</span></button></div>
        <h3 class="op-h3">${esc(t('Corte de Chvátal-Gomory'))}</h3><p class="help">${esc(t('Elige multiplicadores u ≥ 0 para las restricciones: ⌊uᵀA⌋x ≤ ⌊uᵀb⌋ siempre es válido (porque x ≥ 0 y entera).'))}</p>
        <div class="op-fila">${filas.map((_, i) => `<label class="op-u">u${i + 1}<input type="text" inputmode="decimal" data-u="${i}" value="0"></label>`).join('')}</div>
        <div class="actions"><button class="btn btn-ghost btn-sm" type="button" id="btnCG">${ico('sparkles')}<span>${esc(t('Generar y añadir'))}</span></button><button class="btn btn-ghost btn-sm" type="button" id="btnSinCortes">${ico('refresh')}<span>${esc(t('Quitar todos los cortes'))}</span></button></div><p class="help" id="corteMsg" role="status"></p>
        <h3 class="op-h3">${esc(t('Ramificación y acotación'))}</h3>
        ${bb ? `<p>${esc(t('Predijiste {0} nodos; ha explorado {1}.', st.pred, bb.nodos))} ${Math.abs(st.pred - bb.nodos) <= 1 ? '✓' : ''}</p>${svgArbol(bb.arbol, st.sel)}<p class="op-leyenda"><span class="op-lg op-n-ram"></span>${esc(t('nodo.ramifica'))} <span class="op-lg op-n-ent"></span>${esc(t('nodo.entero'))} <span class="op-lg op-n-pod"></span>${esc(t('nodo.podado'))} <span class="op-lg op-n-inf"></span>${esc(t('nodo.infactible'))}</p>${nodoSel ? `<p class="help">${esc(t('Nodo {0}: {1}', st.sel + 1, t('nodo.' + nodoSel.estado)))}${nodoSel.x ? ' · x = (' + nodoSel.x.map(v => fmtN(v, 2)).join('; ') + ')' : ''}</p>` : `<p class="help">${esc(t('Pulsa un nodo para ver su solución en el dibujo.'))}</p>`}<div class="actions"><button class="btn btn-ghost btn-sm" type="button" id="btnBBotra">${ico('refresh')}<span>${esc(t('Volver a predecir'))}</span></button></div>`
          : `<div class="field"><label for="pred">${esc(t('Antes de ejecutarla: ¿cuántos nodos crees que explorará? (en profundidad, rama ≤ primero)'))}</label><input type="text" inputmode="numeric" id="pred" style="max-width:120px"></div><div class="actions"><button class="btn btn-primary btn-sm" type="button" id="btnBB">${ico('tree')}<span>${esc(t('Ejecutar ramificación'))}</span></button></div>`}
      </div></div>`;
  const anade = (a1, a2, b) => { if (![a1, a2, b].every(Number.isFinite) || (a1 === 0 && a2 === 0)) return $('corteMsg').textContent = t('Escribe a1, a2 y b (números).'); const v = validaCorte(id, [a1, a2], b); if (!v.ok) { regEvento('POLI_corte', false); return $('corteMsg').textContent = t('Corte NO válido: elimina el punto entero ({0}; {1}).', v.punto[0], v.punto[1]); } const util = a1 * a.lp[0] + a2 * a.lp[1] > b + 1e-9; st.cortes.push({a: [a1, a2], b}); st.bb = null; const a2n = analizaPoli(id, st.cortes); regEvento('POLI_corte', util); guarda(); pintaPoli(); $('corteMsg').textContent = util ? t('Corte válido y útil: el gap cerrado pasa al {0} %.', Math.round(100 * a2n.cerrado)) : t('Corte válido, pero no corta el óptimo lineal actual: no mejora la cota.'); };
  $('btnCorte').onclick = () => anade(leeNum($('ca1').value), leeNum($('ca2').value), leeNum($('cb').value));
  $('btnCG').onclick = () => { const u = $$('[data-u]').map(i => leeNum(i.value)); const c = corteCG(id, u, st.cortes); if (!c) return $('corteMsg').textContent = t('Los multiplicadores deben ser números ≥ 0.'); if (c.a[0] === 0 && c.a[1] === 0) return $('corteMsg').textContent = t('Con esos multiplicadores sale 0 ≤ {0}: no corta nada. Prueba otros (por ejemplo, fracciones como 0,25 o 0,5).', c.b); anade(c.a[0], c.a[1], c.b); };
  $('btnSinCortes').onclick = () => { st.cortes = []; st.bb = null; guarda(); pintaPoli(); };
  if ($('btnBB')) $('btnBB').onclick = () => { const p = parseInt($('pred').value, 10); if (!(p >= 1)) return toast(t('Escribe tu predicción (un número entero ≥ 1)')); st.pred = p; st.bb = bbPoli(id, st.cortes); st.sel = null; regEvento('POLI_pred', Math.abs(p - st.bb.nodos) <= 1); guarda(); pintaPoli(); };
  if ($('btnBBotra')) $('btnBBotra').onclick = () => { st.bb = null; guarda(); pintaPoli(); };
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-poliej]'); if (b) { S.poliEj = b.dataset.poliej; guarda(); pintaPoli(); return; }
  const q = e.target.closest('[data-quitacorte]'); if (q) { const st = S.poli[S.poliEj]; st.cortes.splice(+q.dataset.quitacorte, 1); st.bb = null; guarda(); pintaPoli(); return; }
  const n = e.target.closest('[data-nodo]'); if (n) { S.poli[S.poliEj].sel = +n.dataset.nodo; guarda(); pintaPoli(); }
});
document.addEventListener('keydown', e => { const n = e.target.closest?.('[data-nodo]'); if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); n.dispatchEvent(new MouseEvent('click', {bubbles: true})); } });
/* ── carrera de cotas ── */
function svgLineas(series, {titulo, yTit, ref} = {}) {
  const W = 620, H = 260, pl = 54, pr = 14, pt = 14, pb = 34;
  const todos = series.filter(s => s.rango !== false).flatMap(s => s.v.filter(Number.isFinite)).concat(ref ? [ref.v] : []);   // la serie auxiliar (rango:false) no fija la escala: se recorta
  let lo = Math.min(...todos), hi = Math.max(...todos); if (hi - lo < 1e-9) { lo -= 1; hi += 1; } const m = (hi - lo) * 0.25; lo -= m; hi += m * 0.4;
  const n = Math.max(...series.map(s => s.v.length)), X = i => pl + (n <= 1 ? 0 : i / (n - 1)) * (W - pl - pr), Y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="op-svg op-chart" role="img" aria-labelledby="chT"><title id="chT">${esc(titulo || '')}</title><defs><clipPath id="chClip"><rect x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}"/></clipPath></defs>`;
  for (let k = 0; k <= 4; k++) { const v = lo + (hi - lo) * k / 4; s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" class="op-g"/><text x="${pl - 6}" y="${Y(v) + 4}" class="op-ax" text-anchor="end">${fmtN(v, 1)}</text>`; }
  s += `<text x="${(W + pl) / 2}" y="${H - 6}" class="op-ax">${esc(t('iteración'))}</text>`;
  if (ref) s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(ref.v)}" y2="${Y(ref.v)}" class="op-refl"/><text x="${W - pr - 6}" y="${Y(ref.v) + 16}" class="op-ax" text-anchor="end">${esc(ref.nom)}</text>`;
  series.forEach(se => { const pts = se.v.map((v, i) => Number.isFinite(v) ? `${X(i)},${Y(v)}` : null).filter(Boolean); s += `<polyline clip-path="url(#chClip)" points="${pts.join(' ')}" fill="none" stroke="${se.c}" stroke-width="${se.w || 2.4}" ${se.d ? 'stroke-dasharray="5 4"' : ''}/>`; });
  return s + '</svg>' + `<p class="op-leyenda">${series.map(se => `<span class="op-lg" style="background:${se.c}"></span>${esc(se.nom)}`).join(' ')}</p>`;
}
const COTAS_TABS = [['lag', 'Lagrangiana'], ['cg', 'Generación de columnas'], ['bd', 'Benders']];
function pintaCotas() {
  asegSemilla();
  const tab = S.cotasTab;
  let html = `<div class="card"><div class="op-ra-sel" role="group" aria-label="${esc(t('Método'))}">${COTAS_TABS.map(([v, tx]) => `<button type="button" class="op-seg" data-cotastab="${v}" aria-pressed="${v === tab}">${esc(t(tx))}</button>`).join('')}</div></div><div class="card">`;
  if (tab === 'lag') {
    const I = uflCotas(S.sem), zlp = (pintaCotas._lp ||= {})[S.sem] ??= uflLP(I), st = S.cotas;
    const run = st.lagRun;
    html += `<h3 class="op-h3">${esc(t('Relajación lagrangiana de la localización sin capacidades (6 plantas, 15 clientes)'))}</h3><p class="help">${esc(t('Se relajan las restricciones de asignación. Por Geoffrion, la mejor cota lagrangiana es la de la relajación lineal fuerte ({0}). ¿Llega el subgradiente? Depende del paso.', fmtN(zlp)))}</p>
      <div class="op-fila"><label class="op-u">${esc(t('Paso inicial'))}<input type="text" inputmode="decimal" id="lgPaso" value="${fmtN(st.paso)}"></label><label class="op-u">${esc(t('Se divide entre 2 cada'))}<input type="text" inputmode="numeric" id="lgCada" value="${st.cada}"></label></div>
      <fieldset class="op-conf"><legend>${esc(t('Tu predicción: ¿llegará a menos del 1 % de la cota lineal en 150 iteraciones?'))}</legend>${[['si', 'Sí'], ['no', 'No']].map(([v, tx]) => `<label class="op-seg op-segl"><input type="radio" name="lgPred" value="${v}" ${st.lgPred === v ? 'checked' : ''}><span>${esc(t(tx))}</span></label>`).join('')}</fieldset>
      <div class="actions"><button class="btn btn-primary btn-sm" type="button" id="btnLag">${ico('play')}<span>${esc(t('Ejecutar'))}</span></button></div>`;
    if (run) { const fin = run.at(-1), llega = fin.LB >= zlp * 0.99; html += svgLineas([{nom: t('L(λ) en cada iteración'), v: run.map(s => s.L), c: '#9DB0C4', w: 1.4, rango: false}, {nom: t('mejor cota inferior'), v: run.map(s => s.LB), c: '#1F6FB2'}, {nom: t('mejor solución factible'), v: run.map(s => s.UB), c: '#C9441F'}], {titulo: t('Cotas del subgradiente'), ref: {v: zlp, nom: t('relajación lineal')}}) + `<p>${esc(t('Mejor cota: {0} ({1} % de la lineal) · mejor factible: {2}.', fmtN(fin.LB), fmtN(100 * fin.LB / zlp, 1), fmtN(fin.UB)))} ${st.lgPred ? esc((st.lgPred === 'si') === llega ? t('Tu predicción era correcta.') : t('Tu predicción no se cumplió: ¿por qué crees que ha pasado?')) : ''}</p>`; }
  } else if (tab === 'cg') {
    const ser = columnasCS(CS_NB);
    html += `<h3 class="op-h3">${esc(t('Generación de columnas: corte de rollos (la instancia del cuaderno 2)'))}</h3><p class="help">${esc(t('El maestro restringido baja en cada iteración; la cota de Farley (z / máx Σπa) acota por debajo. Cuando se tocan, el maestro es óptimo para la relajación completa.'))}</p>`
      + svgLineas([{nom: t('valor del maestro restringido'), v: ser.map(s => s.z), c: '#C9441F'}, {nom: t('cota de Farley'), v: ser.map(s => s.LB), c: '#1F6FB2'}], {titulo: t('Cotas de la generación de columnas')})
      + tablaHtml({cab: [t('Iteración'), t('Duales π'), t('Mejor patrón'), t('Coste reducido'), t('Maestro')], filas: ser.map(s => [String(s.it), s.pi.map(x => fmtN(x, 3)).join('; '), s.a.join(','), fmtN(s.rc, 4), fmtN(s.z, 3)])});
  } else {
    const I = cflBenders(S.sem), ser = bendersCFL(I);
    html += `<h3 class="op-h3">${esc(t('Benders: localización con capacidades (4 almacenes, 8 clientes, tu instancia)'))}</h3><p class="help">${esc(t('El maestro (aquí, enumerando las aperturas) da la cota inferior; cada solución factible, la superior. Cada iteración añade un corte con los duales del problema de transporte.'))}</p>`
      + svgLineas([{nom: t('cota inferior (maestro)'), v: ser.map(s => s.LB), c: '#1F6FB2'}, {nom: t('cota superior (factible)'), v: ser.map(s => s.UB), c: '#C9441F'}], {titulo: t('Cotas de Benders')})
      + tablaHtml({cab: [t('Iteración'), t('Almacenes abiertos'), t('Cota inferior'), t('Cota superior')], filas: ser.map(s => [String(s.it), s.y.map((v, i) => v ? i + 1 : 0).filter(Boolean).join(','), fmtN(s.LB, 1), fmtN(s.UB, 1)])});
  }
  $('labBox').innerHTML = html + '</div>';
  if ($('btnLag')) $('btnLag').onclick = () => { const p = leeNum($('lgPaso').value), c = parseInt($('lgCada').value, 10); if (!(p > 0 && p <= 10) || !(c >= 1 && c <= 150)) return toast(t('Paso entre 0 y 10; «cada» entre 1 y 150')); const pr = document.querySelector('input[name=lgPred]:checked'); if (!pr) return toast(t('Haz primero tu predicción')); S.cotas = {...S.cotas, paso: p, cada: c, lgPred: pr.value, lagRun: subgradienteUFL(uflCotas(S.sem), {paso: p, cada: c, iters: 150})}; guarda(); pintaCotas(); };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-cotastab]'); if (b) { S.cotasTab = b.dataset.cotastab; guarda(); pintaCotas(); } });
/* ── ejemplos resueltos con retirada gradual ── */
const RES_COLS = {sub: [['lam', 'λ'], ['x', 'x(λ): objetos'], ['L', 'L(λ)'], ['g', 'g = C − Σwx'], ['sig', 'λ siguiente']], cg: [['it', 'Iteración'], ['pi', 'Duales π'], ['a', 'Mejor patrón'], ['rc', 'Coste reducido'], ['z', 'Maestro']]};
function pintaRes() {
  const id = S.resEj, def = RES_DEF[id], filas = def.filas(), st = S.res[id] ||= {fila: 1, nivel: 1, hist: []};
  const enun = id === 'sub' ? t('Mochila máx Σvx con v = (12, 9, 14, 7, 10), w = (4, 3, 6, 2, 5), C = 10. Se relaja la capacidad: L(λ) = λC + Σ máx(0, vᵢ − λwᵢ). Paso fijo t = 0,1: λ ← máx(0, λ − t·g).') : t('Corte de rollos: W = 20, anchos (9, 7, 4), pedidos (10, 14, 20). En cada iteración, el mejor patrón resuelve la mochila máx Σπa con Σwa ≤ 20; coste reducido = 1 − Σπa.');
  const cols = RES_COLS[id];
  const fin = st.fila > filas.length;
  const cuerpo = filas.slice(0, Math.min(st.fila, filas.length)).map((f, r) => {
    const actual = r + 1 === st.fila, huecos = actual ? huecosDe(def, st.nivel) : [];
    return `<tr>${cols.map(([c], j) => { const v = f[c]; const celda = huecos.includes(c) ? `<input type="text" class="op-celda" data-celda="${c}" aria-label="${esc(t(cols[j][1]))}" inputmode="${c === 'x' || c === 'a' ? 'text' : 'decimal'}">` : esc(typeof v === 'number' ? fmtN(v, 4) : String(v)); return j ? `<td>${celda}</td>` : `<th scope="row">${celda}</th>`; }).join('')}</tr>`;
  }).join('');
  $('labBox').innerHTML = `<div class="card"><div class="op-ra-sel" role="group" aria-label="${esc(t('Ejemplo'))}">${[['sub', 'Subgradiente'], ['cg', 'Generación de columnas']].map(([v, tx]) => `<button type="button" class="op-seg" data-resej="${v}" aria-pressed="${v === id}">${esc(t(tx))}</button>`).join('')}</div></div>
    <div class="card"><p class="op-enun">${esc(enun)}</p><p class="help">${esc(t('La primera fila viene resuelta. En cada fila nueva aparecen más huecos para ti; si fallas alguno, la siguiente tendrá los mismos huecos. Patrones y conjuntos: números separados por comas.'))}</p>
      <div class="table-wrap"><table class="op-tab op-datos"><thead><tr>${cols.map(([, tx]) => `<th scope="col">${esc(t(tx))}</th>`).join('')}</tr></thead><tbody>${cuerpo}</tbody></table></div>
      ${fin ? `<div class="okbox" role="status">${esc(t('Ejemplo completado. Último nivel alcanzado: {0} hueco(s) por fila.', st.nivel))}</div><div class="actions"><button class="btn btn-ghost btn-sm" type="button" id="btnResOtra">${ico('refresh')}<span>${esc(t('Empezar de nuevo'))}</span></button></div>` : `<div class="actions"><button class="btn btn-primary btn-sm" type="button" id="btnResFila">${ico('check')}<span>${esc(st.fila === 1 ? t('Entendido: siguiente fila') : t('Comprobar fila'))}</span></button></div>`}
      <p class="help" id="resMsg" role="status">${st.msg ? esc(st.msg) : ''}</p></div>`;
  if ($('btnResOtra')) $('btnResOtra').onclick = () => { S.res[id] = {fila: 1, nivel: 1, hist: []}; guarda(); pintaRes(); };
  if ($('btnResFila')) $('btnResFila').onclick = () => {
    const f = filas[st.fila - 1]; const huecos = st.fila === 1 ? [] : huecosDe(def, st.nivel);
    const mal = huecos.filter(c => !compruebaCelda(c, document.querySelector(`[data-celda="${c}"]`)?.value ?? '', f[c]));
    st.hist.push({fila: st.fila, nivel: st.nivel, ok: !mal.length});
    if (mal.length) { st.msg = t('Revisa: {0}. Valor correcto: {1}. La siguiente fila tendrá los mismos huecos.', mal.map(c => t(cols.find(x => x[0] === c)[1])).join(', '), mal.map(c => typeof f[c] === 'number' ? fmtN(f[c], 4) : f[c]).join(' · ')); }
    else { st.msg = st.fila === 1 ? '' : t('¡Bien! Más huecos en la siguiente fila.'); if (st.fila > 1) st.nivel = Math.min(def.orden.length, st.nivel + 1); }
    st.fila++;
    if (st.fila > filas.length) regEvento(id === 'sub' ? 'RES_sub' : 'RES_cg', st.hist.slice(-1)[0].ok && st.nivel >= Math.min(def.orden.length, 2));
    guarda(); pintaRes();
  };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-resej]'); if (b) { S.resEj = b.dataset.resej; guarda(); pintaRes(); } });
