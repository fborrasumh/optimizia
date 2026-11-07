/* ══ Interfaz de CUADERNOS (instancia personal y entrega), MISIONES y TORNEO ══ */
const NB_TEMAS = {
  '01-reforzamiento.ipynb': [L3('Formulación débil y fuerte de la localización sin capacidades', 'Weak and strong formulations of uncapacitated facility location', 'Formulação fraca e forte da localização sem capacidades'), L3('Big-M ajustada y su efecto en la cota', 'Tight big-M and its effect on the bound', 'Big-M ajustado e o seu efeito no limite'), L3('Desigualdades de cubierta en la mochila', 'Cover inequalities in the knapsack', 'Desigualdades de cobertura na mochila'), L3('Tu instancia: gap débil frente a fuerte', 'Your instance: weak versus strong gap', 'A sua instância: gap fraco face a forte')],
  '02-descomposicion.ipynb': [L3('Generación de columnas: corte de rollos', 'Column generation: cutting stock', 'Geração de colunas: corte de rolos'), L3('Relajación lagrangiana y subgradiente', 'Lagrangian relaxation and subgradient', 'Relaxação lagrangiana e subgradiente'), L3('Descomposición de Benders', 'Benders decomposition', 'Decomposição de Benders'), L3('Tu instancia: columnas y localización con capacidades', 'Your instance: columns and capacitated location', 'A sua instância: colunas e localização com capacidades')],
  '03-metaheuristicas.ipynb': [L3('Vecino más próximo y 2-opt', 'Nearest neighbour and 2-opt', 'Vizinho mais próximo e 2-opt'), L3('GRASP', 'GRASP', 'GRASP'), L3('Metaheurísticas de OR-Tools: GLS, tabú, recocido', 'OR-Tools metaheuristics: GLS, tabu, annealing', 'Meta-heurísticas do OR-Tools: GLS, tabu, recozimento'), L3('Cotas 1-árbol y Held-Karp', '1-tree and Held-Karp bounds', 'Limites 1-árvore e Held-Karp'), L3('Tu instancia y el torneo de la semana', 'Your instance and the weekly tournament', 'A sua instância e o torneio da semana')]
};
const lineaPy = (nom, obj) => `${nom} = ${JSON.stringify(obj)}`;
const CLAVES_NB = {z_ip: 'Óptimo entero', z_lp_debil: 'Relajación lineal débil', z_lp_fuerte: 'Relajación lineal fuerte', z_lp_corte: 'Relajación del corte de rollos', z_cfl: 'Óptimo de la localización con capacidades', ruta: 'Ruta válida', longitud: 'Longitud declarada', gap: 'Gap frente a Held-Karp ≤ 5 %'};
function pintaNb() {
  asegSemilla();
  $('nbList').innerHTML = BLOQUES.map((b, i) => {
    const k = i + 1, hecho = S.nb[b.nb], ent = S.nbEnt[k], inst = lineaPy('INSTANCIA', instanciaNB(k, S.sem));
    const ver = ent?.items ? `<ul class="op-ul">${ent.items.map(x => `<li>${x.ok ? '✓' : '✗'} ${esc(t(CLAVES_NB[x.clave] || x.clave))}${x.esperado !== undefined && !x.ok ? ' · ' + esc(t('esperado {0}, entregado {1}', fmtN(x.esperado), x.dado === undefined ? '—' : fmtN(x.dado))) : x.dado !== undefined && x.clave === 'gap' ? ' · ' + fmtN(Math.max(0, x.dado), 2) + ' %' : ''}</li>`).join('')}</ul>` : '';
    return `<div class="card op-nb" style="--c:${b.c}"><div class="op-nb-cab"><div class="op-bl-ico">${ico(b.ico)}</div><div><p class="op-kick">${esc(t('Cuaderno {0}', k))} · ${esc(b.ras.join(', '))}</p><h3 class="op-h3">${esc(L(b.nombre))}</h3></div>${ent?.ok ? `<span class="fa-chip ok">${esc(t('Entrega verificada'))}</span>` : hecho ? `<span class="fa-chip">${esc(t('Trabajado'))}</span>` : ''}</div>
      <ul class="op-ul">${(NB_TEMAS[b.nb] || []).map(x => `<li>${esc(L(x))}</li>`).join('')}</ul>
      <div class="actions"><a class="btn btn-primary" href="https://colab.research.google.com/github/${REPO}/blob/main/cuadernos/${b.nb}" target="_blank" rel="noopener">${ico('ext')}<span>${esc(t('Abrir en Colab'))}</span></a><button class="btn btn-ghost" type="button" data-nbdl="${b.nb}">${ico('download')}<span>${esc(t('Descargar .ipynb'))}</span></button><button class="btn btn-ghost" type="button" data-nbok="${b.nb}" aria-pressed="${!!hecho}">${ico('check')}<span>${esc(hecho ? t('Desmarcar') : t('Marcar como trabajado'))}</span></button></div>
      <details class="op-det" ${ent ? 'open' : ''}><summary>${esc(t('Tu instancia personal y tu entrega'))}</summary>
        <p class="help">${esc(t('1) Copia esta línea y sustituye con ella «INSTANCIA = None» al final del cuaderno. 2) Ejecuta. 3) Pega aquí la línea «ENTREGA = …» que imprime.'))}</p>
        <pre class="fa-pre op-inst" id="inst${k}">${esc(inst)}</pre><div class="actions"><button class="btn btn-ghost btn-sm" type="button" data-copia="inst${k}">${ico('copy')}<span>${esc(t('Copiar'))}</span></button></div>
        <div class="field"><label for="ent${k}">${esc(t('Tu entrega'))}</label><textarea id="ent${k}" rows="3" class="op-code" placeholder="ENTREGA = {…}">${esc(ent?.txt || '')}</textarea></div>
        <div class="actions"><button class="btn btn-primary btn-sm" type="button" data-verifica="${k}">${ico('check')}<span>${esc(t('Verificar entrega'))}</span></button></div><div aria-live="polite">${ent?.error ? `<div class="aviso">${esc({formato: t('No reconozco la entrega: pega la línea completa «ENTREGA = {…}».'), semilla: t('Esta entrega es de otra instancia (otra semilla): usa la tuya.'), ruta: t('La ruta no es válida: debe visitar todas las ciudades una sola vez.')}[ent.error])}</div>` : ''}${ver}</div></details></div>`;
  }).join('');
}
document.addEventListener('click', e => {
  const d = e.target.closest('[data-nbdl]'); if (d) { const f = d.dataset.nbdl; if (!NB_FICH[f]) return toast(t('Cuaderno no disponible')); dl(f, new Blob([NB_FICH[f]], {type: 'application/x-ipynb+json'})); return; }
  const k = e.target.closest('[data-nbok]'); if (k) { const f = k.dataset.nbok; S.nb[f] = S.nb[f] ? null : new Date().toISOString(); guarda(); pintaNb(); return; }
  const c = e.target.closest('[data-copia]'); if (c) { const el = $(c.dataset.copia); copia(el.textContent, el); return; }
  const v = e.target.closest('[data-verifica]'); if (v) {
    const n = +v.dataset.verifica, txt = $('ent' + n).value, ent = leeEntrega(txt);
    const r = ent ? verificaEntrega(ent, S.sem) : {error: 'formato'};
    const ok = !r.error && r.items.every(x => x.ok);
    S.nbEnt[n] = {txt, ok, items: r.items, error: r.error, fecha: new Date().toISOString()};
    if (!r.error || r.error === 'ruta') regEvento('NB' + n, ok);
    if (ok) S.nb[BLOQUES[n - 1].nb] ||= new Date().toISOString();
    guarda(); pintaNb(); toast(ok ? t('Entrega verificada: la app ha recalculado tu instancia y coincide.') : t('La entrega no coincide del todo: revisa los puntos marcados.'), 6000);
  }
});
/* ── misiones ── */
const misDatosHtml = (M, I) => {
  if (M.id === 'M1') return tablaHtml({cab: [t('Almacén'), 'F', 'Q', ...I.d.map((_, j) => 'c·' + (j + 1))], filas: I.F.map((f, i) => [String(i + 1), String(f), String(I.Q[i]), ...I.c[i].map(String)])}) + `<p class="op-dato"><b>d</b> = (${I.d.join('; ')})</p>`;
  if (M.id === 'M2') return `<p class="op-dato"><b>W</b> = ${I.W} · <b>${esc(t('anchos'))}</b> = (${I.w.join('; ')}) · <b>${esc(t('pedidos'))}</b> = (${I.d.join('; ')})</p>`;
  return svgCiudades(I.ciudades) + `<p class="op-dato">${esc(t('Coordenadas'))}: ${I.ciudades.map((p, i) => `${i}: (${p[0]}, ${p[1]})`).join(' · ')}</p><p class="help">${esc(t('Distancia = distancia euclídea redondeada al entero más próximo.'))}</p>`;
};
function svgCiudades(P, ruta) {
  const W = 320, X = x => 14 + x * 2.92, Y = y => W - 14 - y * 2.92;
  let s = `<svg viewBox="0 0 ${W} ${W}" class="op-svg op-mapa" role="img" aria-labelledby="mapT"><title id="mapT">${esc(t('Mapa de las ciudades'))}${ruta ? ' · ' + esc(t('con la ruta')) : ''}</title><rect x="0" y="0" width="${W}" height="${W}" class="op-mapa-f"/>`;
  if (ruta) s += `<polygon points="${ruta.map(i => X(P[i][0]) + ',' + Y(P[i][1])).join(' ')}" class="op-ruta"/>`;
  P.forEach((p, i) => { s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${i === 0 ? 5 : 3.6}" class="${i === 0 ? 'op-dep' : 'op-ciu'}"/>${P.length <= 12 ? `<text x="${X(p[0]) + 6}" y="${Y(p[1]) - 5}" class="op-ax">${i}</text>` : ''}`; });
  return s + '</svg>';
}
function pintaMis() {
  asegSemilla();
  tabs('misTabs', MISIONES.map(m => [m.id, L(m.titulo), m.ico]), S.misEj, 'data-misej');
  const M = MISION_BY[S.misEj], I = M.datos(S.sem), st = S.mis[M.id] ||= {resp: {}, res: null, fb: null};
  const preg = M.preguntas.map((q, n) => {
    const r = st.res?.[q.id], marca = r ? (r.ok ? '✓' : '✗') : '';
    let campo = '';
    if (q.tipo === 'mc') campo = `<fieldset class="op-ops"><legend class="sr-only">${esc(L(q.q))}</legend>${q.ops.map((o, k) => `<label class="op-op${r ? (k === q.ok ? ' op-bien' : (+st.resp[q.id] === k ? ' op-mal' : '')) : ''}"><input type="radio" name="mis_${q.id}" value="${k}" ${+st.resp[q.id] === k && st.resp[q.id] !== undefined ? 'checked' : ''}><span class="op-let" aria-hidden="true">${LETRAS[k]}</span><span>${esc(L(o))}</span></label>`).join('')}</fieldset>`;
    else if (q.tipo === 'texto') campo = `<textarea id="mis_${q.id}" rows="5" aria-label="${esc(L(q.q))}">${esc(st.resp[q.id] || '')}</textarea>`;
    else campo = `<input type="text" id="mis_${q.id}" ${q.tipo === 'num' ? 'inputmode="decimal"' : ''} value="${esc(st.resp[q.id] || '')}" aria-label="${esc(L(q.q))}" style="max-width:${q.tipo === 'ruta' ? '100%' : '260px'}">`;
    const det = r && !r.ok ? (q.tipo === 'num' ? ` · ${esc(t('solución calculada: {0}', fmtN(r.sol)))}` : q.tipo === 'conj' ? ` · ${esc(r.coste === null ? t('esa apertura no tiene capacidad suficiente') : t('con esos almacenes el coste es {0}; el óptimo es {1} (por ejemplo, abriendo {2})', fmtN(r.coste), fmtN(cflSolucion(I).z), cflSolucion(I).abiertas.join(', ')))}` : q.tipo === 'ruta' ? ` · ${esc(r.invalida ? t('la ruta debe visitar cada comercio una sola vez (del 0 al 11)') : t('longitud {0}, gap ≤ {1} % frente a la cota {2}: hay que bajar del 5 %', r.L, fmtN(r.gap, 1), fmtN(r.LB, 1)))}` : '') : r?.ok && q.tipo === 'ruta' ? ` · ${esc(t('longitud {0}, gap ≤ {1} % frente a la cota de Held-Karp {2}', r.L, fmtN(Math.max(0, r.gap), 1), fmtN(r.LB, 1)))}` : '';
    return `<div class="op-mq"><p class="op-mq-t"><b>${n + 1}.</b> ${esc(L(q.q))} <span class="op-marca">${marca}</span>${det}</p>${campo}</div>`;
  }).join('');
  const fb = st.fb ? `<div class="op-tutor-res"><h4>${esc(t('Comentario de la IA según la rúbrica (sin nota)'))}</h4><ul class="op-ul">${st.fb.criterios.map(c => `<li>${c.cumple && c.verif ? '✓' : c.cumple ? '⚠' : '○'} <b>${esc(L(M.rubrica.find(x => x.id === c.id)?.t) || c.id)}</b>${c.verif ? `<br><small class="muted">«${esc(c.cita)}»</small>` : c.cumple ? `<br><small class="muted">${esc(t('La IA dice que lo cumples, pero la cita que aporta no está en tu texto: sin evidencia.'))}</small>` : ''}${c.comentario ? `<br><small>${esc(c.comentario)}</small>` : ''}</li>`).join('')}</ul><p class="help">${esc(t('Orientativo: lo confirma el profesorado. Respuesta de {0} ({1}).', st.fb.prov, st.fb.modelo))}</p></div>` : '';
  $('misBox').innerHTML = `<div class="card"><div class="op-qcab">${chip(M.ra)}<span class="fa-chip">${esc(t('Datos ficticios, distintos para cada estudiante'))}</span></div><h3 class="op-h3">${esc(L(M.titulo))}</h3><p class="op-enun">${esc(L(M.caso))}</p>${misDatosHtml(M, I)}
    <details class="op-det"><summary>${esc(t('Copiar los datos para Colab'))}</summary><pre class="fa-pre" id="misDatos">${esc(lineaPy('DATOS', I))}</pre><div class="actions"><button class="btn btn-ghost btn-sm" type="button" data-copia="misDatos">${ico('copy')}<span>${esc(t('Copiar'))}</span></button></div></details></div>
    <div class="card">${preg}<div class="actions"><button class="btn btn-primary" type="button" id="btnMis">${ico('check')}<span>${esc(t('Corregir'))}</span></button><button class="btn btn-ghost" type="button" id="btnMisIA">${ico('sparkles')}<span>${esc(t('Comentario de la IA sobre mi justificación'))}</span></button></div><p class="help" id="misEstado" role="status"></p>${st.res ? `<div class="${Object.values(st.res).every(x => x.ok) ? 'okbox' : 'aviso'}" role="status">${esc(Object.values(st.res).every(x => x.ok) ? t('Misión resuelta: método y números correctos.') : t('Hay partes por revisar (marcadas con ✗).'))}</div>` : ''}${fb}</div>`;
  const leeResp = () => { for (const q of M.preguntas) { if (q.tipo === 'mc') { const s = document.querySelector(`input[name="mis_${q.id}"]:checked`); if (s) st.resp[q.id] = s.value; } else st.resp[q.id] = $('mis_' + q.id).value; } guarda(); };
  $$('#misBox input, #misBox textarea').forEach(x => x.addEventListener('change', leeResp));
  $('btnMis').onclick = () => { leeResp(); const auto = M.preguntas.filter(q => q.tipo !== 'texto'); if (auto.some(q => st.resp[q.id] === undefined || st.resp[q.id] === '')) return toast(t('Responde todas las preguntas antes de corregir')); st.res = corrigeMision(M.id, S.sem, st.resp); regEvento(M.id, Object.values(st.res).every(x => x.ok)); guarda(); pintaMis(); };
  $('btnMisIA').onclick = () => { leeResp(); comentaMision(M, st); };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-misej]'); if (b) { S.misEj = b.dataset.misej; guarda(); pintaMis(); } });
let busyMis = false;
async function comentaMision(M, st) {
  if (busyMis) return; const txt = String(st.resp.just || '').trim();
  if (txt.split(/\s+/).length < 15) return toast(t('Escribe una justificación de al menos 15 palabras'));
  if (!pideClave()) return;
  const {t: limpio, n} = scrub(txt);
  const prompt = `Eres profesor de «Técnicas Avanzadas de Optimización». Valora la justificación de un estudiante para este caso SOLO con la rúbrica. No pongas nota ni puntos.
Para cada criterio devuelve si se cumple y, si se cumple, una CITA LITERAL (copiada sin cambiar nada) del texto del estudiante que lo demuestre, y un comentario breve y concreto (qué falta o cómo mejorarlo).
${INSTR_IDIOMA()} Las citas, en el idioma original del texto del estudiante.
Devuelve SOLO JSON: {"criterios":[{"id":"c1","cumple":true,"cita":"…","comentario":"…"}]}

CASO: ${L(M.caso)}
RÚBRICA:
${M.rubrica.map(c => `${c.id}: ${L(c.t)}`).join('\n')}

JUSTIFICACIÓN DEL ESTUDIANTE:
${limpio}`;
  if (!(await pideEnvio(prompt, n))) return;
  busyMis = true; $('misEstado').innerHTML = '<span class="spin"></span> ' + esc(t('La IA está leyendo tu justificación…'));
  try {
    const raw = await llmJSON([{role: 'system', content: 'Eres un evaluador riguroso. Respondes SOLO con JSON válido.'}, {role: 'user', content: prompt}], {max: 1400});
    const crit = M.rubrica.map(c => { const r = (raw.criterios || []).find(x => String(x.id) === c.id) || {}; const cita = String(r.cita || ''); return {id: c.id, cumple: !!r.cumple, cita, verif: !!r.cumple && cita.length >= 12 && esFiel(limpio, cita), comentario: String(r.comentario || '')}; });
    st.fb = {criterios: crit, prov: PROV[getProv()].n, modelo: getMod()}; await guardaYa(); pintaMis();
  } catch (e) { $('misEstado').textContent = e.message; toast(e.message, 8000); }
  finally { busyMis = false; }
}
/* ── torneo de la semana ── */
function pintaTorneo() {
  const sem = semanaISO(), T = torneo(sem), st = S.tor[sem] ||= {mejor: null, intentos: []};
  const ultima = st.ultima ? verificaTorneo(sem, st.ultima) : null;
  $('torBox').innerHTML = `<div class="op-2col"><div class="card"><div class="op-qcab"><span class="fa-chip">${esc(t('Semana {0}', sem))}</span>${chip('RA5')}</div>${svgCiudades(T.ciudades, ultima?.ok ? st.ultima : null)}
      <p>${esc(t('Cota inferior de Held-Karp: {0}. Una heurística sencilla (vecino más próximo + 2-opt) consigue {1}.', fmtN(T.LB, 1), T.ref))}</p>
      ${st.mejor ? `<div class="okbox">${esc(t('Tu mejor ruta esta semana: {0} (gap ≤ {1} %).', st.mejor.L, fmtN(Math.max(0, st.mejor.gap), 2)))}</div>` : ''}</div>
    <div class="card"><h3 class="op-h3">${esc(t('1 · Llévate la instancia a Colab'))}</h3><p class="help">${esc(t('Pega esta línea en la celda «TORNEO = None» del cuaderno 3 y ejecútala.'))}</p><pre class="fa-pre op-inst" id="torInst">${esc(lineaPy('TORNEO', {semana: sem, ciudades: T.ciudades}))}</pre><div class="actions"><button class="btn btn-ghost btn-sm" type="button" data-copia="torInst">${ico('copy')}<span>${esc(t('Copiar'))}</span></button></div>
      <h3 class="op-h3">${esc(t('2 · Entrega tu ruta'))}</h3><div class="field"><label for="torRuta">${esc(t('Pega la línea «RUTA = …» o la lista de ciudades (del 0 al 29)'))}</label><textarea id="torRuta" rows="3" class="op-code">${esc(st.txt || '')}</textarea></div>
      <div class="actions"><button class="btn btn-primary btn-sm" type="button" id="btnTor">${ico('check')}<span>${esc(t('Comprobar ruta'))}</span></button><button class="btn btn-ghost btn-sm" type="button" id="btnTorVP">${ico('compass')}<span>${esc(t('Partir del vecino más próximo'))}</span></button><button class="btn btn-ghost btn-sm" type="button" id="btnTor2">${ico('refresh')}<span>${esc(t('Mejorar con 2-opt'))}</span></button></div>
      <p class="help" id="torMsg" role="status">${ultima ? esc(ultima.ok ? t('Ruta válida: longitud {0}, a lo sumo un {1} % por encima del óptimo.', ultima.L, fmtN(Math.max(0, ultima.gap), 2)) : t('La ruta no es válida: debe visitar las 30 ciudades una sola vez.')) : ''}</p>
      <p class="help">${esc(t('Vecino más próximo y 2-opt están aquí para que veas el punto de partida; para ganar, usa el cuaderno (GLS, tu recocido, GRASP…). Tu mejor marca va en la entrega para el profesorado.'))}</p></div></div>`;
  const prueba = (ruta, txt) => { st.txt = txt; st.ultima = ruta; const v = ruta ? verificaTorneo(sem, ruta) : {ok: false}; if (v.ok) { st.intentos.push({L: v.L, t: Date.now()}); if (!st.mejor || v.L < st.mejor.L) { st.mejor = {L: v.L, gap: v.gap}; regEvento('TORNEO', v.gap <= 3); } } guarda(); pintaTorneo(); };
  $('btnTor').onclick = () => { const txt = $('torRuta').value, ent = leeEntrega(txt); prueba(ent?.ruta || leeRuta(txt), txt); };
  $('btnTorVP').onclick = () => { const r = vecinoProximoTSP(T.D); prueba(r, JSON.stringify(r)); };
  $('btnTor2').onclick = () => { const base = leeEntrega($('torRuta').value)?.ruta || leeRuta($('torRuta').value) || vecinoProximoTSP(T.D); const v = verificaTorneo(sem, base); const r = dosOpt(T.D, v.ok ? base : vecinoProximoTSP(T.D)); prueba(r, JSON.stringify(r)); };
}
