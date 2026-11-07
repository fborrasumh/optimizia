/* ══ Interfaz del PANEL DEL PROFESORADO (los datos de otras personas solo viven en memoria: no se guardan) ══ */
let PANEL = null;
const pct = v => v === null || v === undefined ? '—' : Math.round(100 * v) + ' %';
const AVISOS = {facil: 'muy fácil', dificil: 'muy difícil', noDiscrimina: 'no discrimina'};
function pintaPanel() {
  if (!PANEL) { $('panelBox').innerHTML = `<div class="card"><p class="empty">${esc(t('Carga las entregas de tu grupo o prueba con la clase ficticia.'))}</p></div>`; return; }
  const A = PANEL.A;
  const itemsOrd = A.items.slice().sort((a, b) => (b.avisos.length - a.avisos.length) || (a.p - b.p));
  const filasItems = itemsOrd.map(i => [i.id, i.ra, String(i.n), pct(i.p), i.disc === null ? '—' : fmtN(i.disc, 2), fmtN(i.b, 2), i.bProp === null ? '—' : fmtN(i.bProp, 2), [...i.avisos.filter(a => !a.startsWith('distractor')).map(a => t(AVISOS[a])), ...i.avisos.filter(a => a.startsWith('distractor')).map(a => t('opción «{0}» nunca elegida', L(ITEM[i.id].ops[+a.split(':')[1]]).slice(0, 40)))].join(' · ')]);
  const tor = Object.entries(A.torneos).map(([sem, l]) => `<h4>${esc(t('Semana {0}', sem))}</h4>` + tablaHtml({cab: ['#', t('Seudónimo'), t('Longitud'), 'gap'], filas: l.slice(0, 10).map((x, k) => [String(k + 1), x.sem, String(x.L), fmtN(x.gap, 2) + ' %'])})).join('');
  $('panelBox').innerHTML = `${PANEL.ficticia ? `<div class="aviso">${esc(t('Clase FICTICIA simulada: sirve para ver cómo funciona el panel. Los datos no son reales.'))}</div>` : ''}
    <div class="card"><h3>${esc(t('{0} entregas analizadas', A.n))}${A.descartadas ? ` · ${esc(t('{0} ficheros no reconocidos', A.descartadas))}` : ''}</h3>
      ${tablaHtml({cab: [t('Resultado'), t('Dominio medio'), t('Por debajo del 40 %'), t('Diagnóstico (acierto)'), t('Postest (acierto)')], filas: RAS.map(r => [r.id, A.porRA[r.id].media === null ? '—' : Math.round(A.porRA[r.id].media) + ' %', String(A.porRA[r.id].bajo), pct(A.prepost[r.id].pre), A.prepost[r.id].post === null ? '—' : pct(A.prepost[r.id].post) + ` (n=${A.prepost[r.id].nPost})`])})}
      <p class="help">${esc(t('Pre y post usan preguntas distintas de dificultad parecida: compáralos como tendencia del grupo, no como medida individual.'))}</p></div>
    <div class="card"><h3>${esc(t('Análisis de ítems'))}</h3><p class="help">${esc(t('Primer intento de cada estudiante. Discriminación: correlación con el acierto en el resto de preguntas (< 0,2 = la pregunta no separa a quien domina de quien no). La dificultad propuesta es orientativa: revisadla antes de cambiar el banco.'))}</p>
      ${tablaHtml({cab: [t('Ítem'), 'RA', 'n', t('Acierto'), t('Discriminación'), t('Dificultad actual'), t('Dificultad propuesta'), t('Avisos')], filas: filasItems}, 'op-items')}
      <div class="actions"><button class="btn btn-ghost btn-sm" type="button" id="btnItemsCsv">${ico('download')}<span>${esc(t('Análisis de ítems (CSV)'))}</span></button><button class="btn btn-ghost btn-sm" type="button" id="btnRecal">${ico('download')}<span>${esc(t('Propuesta de recalibración (JSON)'))}</span></button></div></div>
    <div class="op-2col"><div class="card"><h3>${esc(t('Errores típicos de la clase'))}</h3>${A.errores.length ? `<ul class="op-ul">${A.errores.slice(0, 8).map(([k, n]) => { const [id, d] = k.split('|'); return `<li>${chip(ITEM[id].ra)} ${esc(L(ITEM[id].mut[+d].fb))} <b>(${n})</b></li>`; }).join('')}</ul>` : `<p class="empty">${esc(t('Sin errores típicos registrados.'))}</p>`}</div>
      <div class="card"><h3>${esc(t('Calibración de la seguridad'))}</h3>${tablaHtml({cab: [t('Seguridad'), t('Respuestas'), t('Acierto')], filas: A.cal.map(c => [t(CONF.find(x => x[0] === c.conf)[1]), String(c.n), pct(c.acierto)]).reverse()})}<p class="help">${esc(t('Si con «Lo sé» se acierta poco, hay ideas erróneas asentadas: buen material para la clase.'))}</p></div></div>
    <div class="op-2col"><div class="card"><h3>${esc(t('Cuadernos con entrega verificada'))}</h3>${tablaHtml({cab: [t('Cuaderno'), t('Estudiantes')], filas: A.nb.map((n, k) => [String(k + 1), `${n} / ${A.n}`])})}<h3>${esc(t('Misiones resueltas'))}</h3>${tablaHtml({cab: [t('Misión'), t('Estudiantes')], filas: Object.entries(A.misiones).map(([k, n]) => [L(MISION_BY[k].titulo), `${n} / ${A.n}`])})}</div>
      <div class="card"><h3>${esc(t('Torneo'))}</h3>${tor || `<p class="empty">${esc(t('Nadie ha entregado rutas del torneo.'))}</p>`}</div></div>`;
  $('btnItemsCsv').onclick = () => dl('optimizia-items.csv', csvDe(['item', 'ra', 'tipo', 'n', 'acierto', 'discriminacion', 'dificultad_actual', 'dificultad_propuesta', 'avisos'], A.items.map(i => [i.id, i.ra, i.tipo, i.n, i.p === null ? '' : i.p.toFixed(3), i.disc === null ? '' : i.disc.toFixed(3), i.b, i.bProp === null ? '' : i.bProp.toFixed(3), i.avisos.join(' ')])), 'text/csv;charset=utf-8');
  $('btnRecal').onclick = () => dl('optimizia-recalibracion.json', new Blob([JSON.stringify({formato: 'optimizia-recalibracion/1', version: VERSION, fecha: new Date().toISOString(), n: A.n, ficticia: !!PANEL.ficticia, nota: 'Propuesta orientativa: revisar antes de aplicar en src/curriculum.js y publicar como versión nueva.', items: Object.fromEntries(A.items.filter(i => i.bProp !== null).map(i => [i.id, {actual: i.b, propuesta: Math.round(i.bProp * 100) / 100, n: i.n}]))}, null, 1)], {type: 'application/json'}));
}
$('fEntregas').onchange = async e => {
  const fs = [...e.target.files]; e.target.value = ''; if (!fs.length) return;
  const js = []; for (const f of fs) { try { js.push(JSON.parse(await f.text())); } catch { js.push(null); } }
  PANEL = {A: agrega(js, ahora()), ficticia: js.some(j => j?.ficticia)}; pintaPanel(); toast(t('{0} entregas cargadas', PANEL.A.n));
};
$('btnClaseFic').onclick = () => { $('panelBox').innerHTML = `<p class="help"><span class="spin"></span> ${esc(t('Simulando una clase de 24 estudiantes…'))}</p>`; setTimeout(() => { PANEL = {A: agrega(simulaClase(ahora()), ahora()), ficticia: true}; pintaPanel(); }, 30); };
