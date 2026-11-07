/* ══ OptimizIA · interfaz principal: navegación, práctica, tutor y progreso.
      Laboratorio → ui_lab.js · Cuadernos, misiones y torneo → ui_act.js · Panel → ui_panel.js · Arranque → boot.js
      La lógica pura (modelo, ruta, corrección, solver, corrector, entregas) está en motor.js, lp.js, dsl.js, lab*.js, actividades.js y panel.js. ══ */
const VERSION = '1.0.0';
const REPO = 'fborrasumh/optimizia';
const STEPS = ['Inicio', 'Diagnóstico', 'Práctica', 'Laboratorio', 'Cuadernos', 'Misiones', 'Progreso'];
const HUBS = ['Torneo', 'Profesorado'];
const P_PROG = 6, P_TORNEO = 7, P_PANEL = 8;
const NAV = [['Empezar', 'Prueba con el ejemplo: no necesita clave ni red.'], ['Siguiente: práctica', 'Cinco preguntas, una por resultado de aprendizaje.'], ['Siguiente: laboratorio', 'La ruta se recalcula tras cada respuesta.'], ['Siguiente: cuadernos', 'Modela, demuestra y experimenta.'], ['Siguiente: misiones', 'Resuelve tu instancia en Colab y entrega.'], ['Siguiente: progreso', 'Casos abiertos como los del examen.'], ['Volver al inicio', 'Exporta tu progreso cuando quieras.']];
const RENDER = {0: pintaInicio, 1: pintaDiag, 2: pintaPrac, 3: pintaLab, 4: pintaNb, 5: pintaMis, 6: pintaProg, 7: pintaTorneo, 8: pintaPanel};
const GLOS = [
  ['¿Qué es OptimizIA?', 'Una herramienta de aprendizaje para Técnicas Avanzadas de Optimización (8265): práctica adaptativa, un laboratorio de modelado con corrector automático, cuadernos de Google OR-Tools con instancia personal, misiones tipo examen, un torneo semanal y un panel para el profesorado.'],
  ['Cómo elige la siguiente pregunta', 'Estima tu dominio de cada resultado de aprendizaje con un modelo tipo Elo (Pelánek, 2016, doi:10.1016/j.compedu.2016.03.017) que baja con los días sin practicar. Te propone el resultado más flojo, intercala si llevas varias seguidas del mismo, recupera los fallos tras unas preguntas y elige una dificultad para que aciertes unas 7 de cada 10. Siempre te dice por qué.'],
  ['Tu seguridad cuenta', 'Antes de comprobar dices si lo sabes, lo crees o lo adivinas. Un error cometido «seguro» vuelve antes al repaso, y en Progreso ves si aciertas más cuando estás seguro (calibración). Corregir un error del que estabas seguro suele fijarse especialmente bien.'],
  ['Por qué así', 'Práctica de recuperación (Roediger y Karpicke, 2006, doi:10.1111/j.1467-9280.2006.01693.x), práctica espaciada (Cepeda y otros, 2006, doi:10.1037/0033-2909.132.3.354), intercalado de tipos de problema (Rohrer y Taylor, 2007, doi:10.1007/s11251-007-9015-8) y retroalimentación sobre la tarea y cómo hacerla mejor (Hattie y Timperley, 2007, doi:10.3102/003465430298487).'],
  ['El corrector de formulaciones', 'Escribes un modelo en un lenguaje sencillo (var, min/max, sum{i}, restricciones con nombre). La app lo resuelve con su propio solver (símplex y ramificación, contrastado con OR-Tools) en 8 instancias aleatorias y lo compara con la formulación de referencia: si da el mismo óptimo es correcta; si su relajación lineal está más lejos, es débil. Si falla, te enseña la instancia y qué regla rompe.'],
  ['Contraejemplos', 'Te damos un modelo con un error. No eliges una opción: construyes una solución que el modelo acepta y la realidad no (o al revés). El código comprueba tu contraejemplo.'],
  ['Poliedros, cortes y árboles', 'Un problema entero en dos variables: ves la región lineal, los puntos enteros y su envolvente convexa. Propón cortes (el código comprueba que no eliminan ningún punto entero) o genera cortes de Chvátal-Gomory con multiplicadores. Antes de lanzar la ramificación, predice cuántos nodos explorará.'],
  ['Carrera de cotas', 'Relajación lagrangiana con subgradiente (ajustas el paso), generación de columnas (con la cota de Farley) y Benders (cotas inferior y superior) sobre instancias reales, dibujados iteración a iteración.'],
  ['Ejemplos resueltos que se retiran', 'Iteraciones del subgradiente y de la generación de columnas: la primera fila viene resuelta; en las siguientes van apareciendo huecos que rellenas tú. Si fallas, los huecos no aumentan hasta que lo consigas.'],
  ['Tu instancia personal', 'Cada cuaderno termina con una sección para TU instancia (sale de tu seudónimo). Copias la instancia, la resuelves en Colab con OR-Tools y pegas la entrega: la app la recalcula con su solver y la valida. Una entrega de otra persona no vale.'],
  ['Misiones', 'Casos abiertos como el caso práctico del examen. El método y los números los corrige el código; la justificación la puede comentar la IA con una rúbrica, citando literalmente tu texto (el código comprueba la cita). La IA no pone nota: eso lo hace el profesorado.'],
  ['Torneo de la semana', 'Un viajante de 30 ciudades igual para toda la clase. La app comprueba la ruta y calcula la cota de Held-Karp, así que sabes cuánto te falta como mucho para el óptimo. El ranking lo hace el profesorado con las entregas.'],
  ['Panel del profesorado', 'Carga las entregas anónimas del grupo: dominio por resultado, antes y después, análisis de ítems (acierto, discriminación, distractores, dificultad propuesta), errores típicos, calibración, cuadernos verificados y torneo. Puede probarse con una clase ficticia.'],
  ['El tutor de IA (opcional)', 'Solo si lo pides y con tu propia clave (OpenAI, Gemini o Claude). Antes de que respondas, el tutor no recibe la solución y el código elimina cualquier frase suya que la revele. Después de responder, sí recibe la solución para explicártela. Las cifras que menciona y no están en el enunciado se marcan.'],
  ['Privacidad', 'Tus respuestas y tu progreso se guardan solo en este navegador. Al proveedor de IA solo sale, si lo pides, el enunciado y tu texto, con los datos personales enmascarados, y antes del primer envío ves lo que sale. La app no tiene servidor ni recoge datos: las entregas al profesorado las exportas tú.'],
  ['Límites', 'El banco de preguntas, los ejercicios y las misiones son iniciales y están pendientes de revisión por el profesorado; las dificultades son estimaciones de partida. El solver del navegador es para instancias pequeñas. El dominio es orientativo, no es una nota ni sustituye a la evaluación de la asignatura (examen 50 % y trabajos 50 %, según la guía). No se ha probado con estudiantes reales ni con claves de IA reales.'],
  ['Sobre la Guía Docente', 'La descripción anuncia tres bloques (reforzamiento, descomposición y heurísticas), pero los objetivos solo tratan la descomposición y las unidades didácticas no incluyen las heurísticas. La app cubre los tres bloques e indica, en cada resultado de aprendizaje, si consta o no como objetivo en la guía.'],
  ['Autoría y licencia', 'Fernando Borrás Rocher, Mercedes Landete Ruiz y Juan Francisco Monge Ivars (Universidad Miguel Hernández de Elche). Código bajo licencia MIT.']
];
const S_INI = () => ({sem: null, ev: [], cur: {diag: null, prac: null, post: null}, ra: null, nb: {}, tutor: null, esEjemplo: false, modoPost: false,
  labTab: 'form', formEj: 'F_mochila', form: {}, formRes: {}, cxEj: 'X_bigm', cx: {}, cxRes: {}, poliEj: 'P1', poli: {}, cotasTab: 'lag', cotas: {paso: 2, cada: 30}, resEj: 'sub', res: {},
  nbEnt: {}, misEj: 'M1', mis: {}, tor: {}});
let S = S_INI();
let ENVIO_OK = false, resetArmado = 0;
const L = o => (o && (o[LANG] ?? o.es)) ?? '';
const RA_BY = Object.fromEntries(RAS.map(r => [r.id, r]));
const bloqueDe = raId => BLOQUES.find(b => b.ras.includes(raId)) || BLOQUES[0];
const ahora = () => Date.now();
const fmtN = (x, d = 3) => (Math.round(x * 10 ** d) / 10 ** d).toLocaleString(locale(), {maximumFractionDigits: d});
const LETRAS = 'ABCD';
function asegSemilla() { if (!S.sem) { const a = new Uint32Array(1); crypto.getRandomValues(a); S.sem = 'E' + a[0].toString(36).toUpperCase(); } }
/* registra un evento de cualquier actividad (cuenta para el modelo de dominio) */
function regEvento(id, ok, extra = {}) { const it = ITEM[id]; if (!it) return; S.ev.push({t: ahora(), id, ra: it.ra, tipo: it.tipo, k: 0, fase: 'act', ok: !!ok, resp: '', diag: null, ayuda: null, ...extra}); guarda(); }
const chip = (ra, txt) => `<span class="op-chip" style="--c:${bloqueDe(ra).c}">${esc(txt ?? ra)}</span>`;

/* ── textos que dependen de datos (se redactan al pintar, en el idioma del momento) ── */
function motivoTxt(m) {
  const ra = m.ra, dom = m.dom ?? '—';
  const base = {
    diag: t('Diagnóstico inicial: una pregunta por resultado de aprendizaje ({0}).', ra),
    post: t('Postest: una pregunta nueva por resultado de aprendizaje ({0}), para comparar con el diagnóstico.', ra),
    repaso: t('Repaso: fallaste esta pregunta hace unas respuestas y vuelve ahora para fijarla (práctica espaciada).'),
    elegido: t('Has elegido practicar {0}.', ra),
    nuevo: t('Aún no has practicado {0}.', ra),
    debil: t('{0} es tu resultado con menor dominio estimado ({1} %).', ra, dom),
    intercalado: t('Intercalado: llevas dos seguidas de {0}; cambiamos a {1} ({2} %), que está casi igual de flojo.', m.otro, ra, dom),
    mantener: t('Dominas todos los resultados; repasamos {0}, el que hace más tiempo que no practicas.', ra)
  }[m.cod] || '';
  return base + (['diag', 'post'].includes(m.cod) ? '' : ' ' + t('La dificultad se elige para que aciertes aproximadamente 7 de cada 10.'));
}
const enunciado = (it, inst) => it.tipo === 'mc' ? L(it.q) : it.enun(inst.p, LANG);
const tablaDe = (it, inst) => it.tipo === 'num' && it.tabla ? it.tabla(inst.p, LANG) : null;
const tablaTexto = tb => tb ? '\n' + [tb.cab, ...tb.filas].map(f => f.join(' | ')).join('\n') : '';
const tablaHtml = (tb, cls = 'op-datos') => tb ? `<div class="table-wrap"><table class="op-tab ${cls}"><thead><tr>${tb.cab.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${tb.filas.map(f => `<tr>${f.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
const solTxt = (it, inst) => it.tipo === 'mc' ? L(it.ops[it.ok]) : fmtN(inst.sol) + (it.unidad ? ' ' + it.unidad : '');

/* ── pantalla 0 ── */
function pintaInicio() {
  const nRes = S.ev.filter(e => !e.ej).length;
  $('inicioProj').innerHTML = S.esEjemplo ? `${esc(t('Estás viendo el ejemplo de una estudiante ficticia.'))} <button class="btn btn-ghost btn-sm" id="btnCont" type="button">${esc(t('Ver su progreso'))}</button>` : nRes ? `${esc(t('Llevas {0} respuestas guardadas en este navegador.', nRes))} <button class="btn btn-ghost btn-sm" id="btnCont" type="button">${esc(t('Continuar'))}</button>` : '';
  $('bloquesInicio').innerHTML = BLOQUES.map(b => `<div class="op-bloque" style="--c:${b.c}"><div class="op-bl-ico">${ico(b.ico)}</div><div><b>${esc(L(b.nombre))}</b><ul>${b.ras.map(r => `<li><span class="op-raid">${r}</span> ${esc(L(RA_BY[r].txt))}</li>`).join('')}</ul></div></div>`).join('');
}
const diagHecho = () => !DIAG.some(id => !S.ev.some(e => e.fase === 'diag' && e.id === id));
const postHecho = () => !POST.some(id => !S.ev.some(e => e.fase === 'post' && e.id === id));
function quitaEjemplo() { if (S.esEjemplo) { const sem = S.sem; S = {...S_INI(), sem}; toast(t('Se ha quitado el ejemplo: empiezas con tus propias respuestas.')); } }
$('btnStart').onclick = () => { quitaEjemplo(); asegSemilla(); guarda(); go(diagHecho() ? 2 : 1); };
$('btnEjemplo').onclick = () => { asegSemilla(); const sem = S.sem; S = {...S_INI(), sem, ev: simulaEjemplo(ahora()), esEjemplo: true}; guarda(); go(P_PROG); toast(t('Ejemplo de demostración con datos simulados, sin usar la IA')); };
$('irTorneo').onclick = () => go(P_TORNEO); $('irPanel').onclick = () => go(P_PANEL);
document.addEventListener('click', e => { if (e.target.closest('#btnCont')) go(S.esEjemplo ? P_PROG : diagHecho() ? 2 : 1); });

/* ── tarjeta de pregunta (diagnóstico, postest y práctica) ── */
function curDe(fase) {
  let c = S.cur[fase];
  if (fase === 'prac' && c && !c.res && (c.raPedido ?? null) !== S.ra) c = null;   // cambió la elección de RA
  if (!c) {
    const s = fase === 'post' ? siguiente(S.ev, ahora(), {post: true}) : siguiente(S.ev, ahora(), fase === 'prac' ? {sinDiag: true, ra: S.ra} : {});
    if (!s || (fase === 'diag' && s.fase !== 'diag')) return null;
    c = S.cur[fase] = {...s, raPedido: S.ra, res: null, pista: false, ia: false, conf: null}; guarda();
  }
  return c;
}
const CONF = [[2, 'Lo sé'], [1, 'Creo que sí'], [0, 'Lo adivino']];
function htmlPregunta(c, fase) {
  const it = ITEM[c.id], inst = instancia(c.id, S.sem, c.k), b = bloqueDe(it.ra), r = c.res;
  const cab = `<div class="op-qcab"><span class="op-chip" style="--c:${b.c}">${esc(it.ra)} · ${esc(L(b.nombre))}</span><span class="fa-chip">${esc(t('Nivel: {0}', L(BLOOM[it.bloom])))}</span><span class="fa-chip">${esc(it.tipo === 'mc' ? t('Opción múltiple') : t('Problema calculado'))}</span></div>`;
  let cuerpo = `<p class="op-enun">${esc(enunciado(it, inst))}</p>${tablaHtml(tablaDe(it, inst))}`;
  if (it.tipo === 'mc') {
    cuerpo += `<fieldset class="op-ops"><legend class="sr-only">${esc(t('Elige una respuesta'))}</legend>${inst.ord.map((oi, k) => {
      const marca = r ? (oi === it.ok ? ' op-bien' : (+r.resp === oi ? ' op-mal' : '')) : '';
      return `<label class="op-op${marca}"><input type="radio" name="op_${fase}" value="${oi}" ${r ? 'disabled' : ''} ${r && +r.resp === oi ? 'checked' : ''}><span class="op-let" aria-hidden="true">${LETRAS[k]}</span><span>${esc(L(it.ops[oi]))}</span></label>`;
    }).join('')}</fieldset>`;
  } else {
    cuerpo += `<div class="field op-num"><label for="resp_${fase}">${esc(t('Tu respuesta'))}${it.unidad ? ' (' + esc(it.unidad) + ')' : ''}</label><input type="text" inputmode="decimal" autocomplete="off" id="resp_${fase}" value="${r ? esc(r.resp) : ''}" ${r ? 'disabled' : ''} aria-describedby="ayudaNum_${fase}"><p class="help" id="ayudaNum_${fase}">${esc(t('Admite coma o punto decimal.'))}</p></div>`;
  }
  const conf = `<fieldset class="op-conf"><legend>${esc(t('¿Cuánta seguridad tienes?'))}</legend>${CONF.map(([v, tx]) => `<label class="op-seg op-segl"><input type="radio" name="conf_${fase}" value="${v}" ${r ? 'disabled' : ''} ${c.conf === v ? 'checked' : ''}><span>${esc(t(tx))}</span></label>`).join('')}</fieldset>`;
  const pista = c.pista ? `<div class="op-pista"><b>${esc(t('Pista'))}:</b> ${esc(L(it.pista))}</div>` : '';
  const botones = r ? `<div class="actions"><button class="btn btn-primary" type="button" data-sig="${fase}">${ico('right')}<span>${esc(t('Siguiente pregunta'))}</span></button></div>`
    : `<div class="actions"><button class="btn btn-primary" type="button" data-comprueba="${fase}">${ico('check')}<span>${esc(t('Comprobar'))}</span></button>${c.pista ? '' : `<button class="btn btn-ghost" type="button" data-pista="${fase}">${ico('bulb')}<span>${esc(t('Ver una pista'))}</span></button>`}</div>`;
  return cab + cuerpo + conf + pista + (r ? htmlFeedback(it, inst, r, c.conf) : '') + botones;
}
function htmlFeedback(it, inst, r, conf) {
  const exp = it.tipo === 'mc' ? L(it.exp) : t('Método: {0}', L(it.pista));
  if (r.ok) return `<div class="okbox op-fb" role="status" tabindex="-1"><b>${esc(t('¡Correcto!'))}</b> ${it.tipo === 'num' ? esc(t('Solución calculada por el código: {0}.', solTxt(it, inst))) : ''}${conf === 0 ? `<p>${esc(t('Acertaste adivinando: esta pregunta volverá para que la fijes.'))}</p>` : ''}<p>${esc(exp)}</p></div>`;
  const diag = r.diag != null && it.mut?.[r.diag] ? `<p><b>${esc(t('Error típico detectado:'))}</b> ${esc(L(it.mut[r.diag].fb))}</p>` : (it.tipo === 'num' ? `<p>${esc(t('Tu respuesta no coincide con ninguno de los errores típicos registrados.'))}</p>` : '');
  const seguro = conf === 2 ? `<p><b>${esc(t('Estabas seguro y no era así.'))}</b> ${esc(t('Lee bien la explicación: estos errores son los que más se aprenden al corregirlos, y esta pregunta volverá pronto.'))}</p>` : '';
  return `<div class="aviso op-fb" role="status" tabindex="-1"><b>${esc(t('No es correcto.'))}</b> ${esc(it.tipo === 'mc' ? t('La respuesta correcta es: {0}', solTxt(it, inst)) : t('Solución calculada por el código: {0}.', solTxt(it, inst)))}${diag}${seguro}<p>${esc(exp)}</p></div>`;
}
function comprueba(fase) {
  const c = S.cur[fase]; if (!c || c.res) return;
  const it = ITEM[c.id], inst = instancia(c.id, S.sem, c.k);
  let resp;
  if (it.tipo === 'mc') { const sel = document.querySelector(`input[name="op_${fase}"]:checked`); if (!sel) return toast(t('Elige una opción')); resp = sel.value; }
  else { resp = $('resp_' + fase).value.trim(); if (Number.isNaN(leeNum(resp))) return toast(t('Escribe un número (admite coma o punto decimal)')); }
  const cf = document.querySelector(`input[name="conf_${fase}"]:checked`); if (!cf) return toast(t('Indica cuánta seguridad tienes'));
  c.conf = +cf.value;
  const res = corrige(inst, resp);
  c.res = {ok: res.ok, diag: res.diag, resp};
  S.ev.push({t: ahora(), id: c.id, ra: it.ra, tipo: it.tipo, k: c.k, fase: c.fase, ok: res.ok, resp: String(resp), diag: res.diag, ayuda: c.ia ? 'ia' : c.pista ? 'pista' : null, conf: c.conf});
  guarda(); (RENDER[step] || (() => {}))();
  document.querySelector('.screen.on .op-fb')?.focus();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-comprueba],[data-sig],[data-pista],[data-ra],[data-practica]'); if (!b) return;
  if (b.dataset.comprueba) comprueba(b.dataset.comprueba);
  else if (b.dataset.sig) { S.cur[b.dataset.sig] = null; if (b.dataset.sig === 'prac') S.tutor = null; guarda(); (RENDER[step] || (() => {}))(); const q = $(b.dataset.sig === 'prac' ? 'pregBox' : 'diagBox'); q?.querySelector('input,button')?.focus(); }
  else if (b.dataset.pista) { S.cur[b.dataset.pista].pista = true; guarda(); (RENDER[step] || (() => {}))(); }
  else if (b.dataset.ra !== undefined) { S.ra = b.dataset.ra || null; guarda(); pintaPrac(); }
  else if (b.dataset.practica) { S.ra = b.dataset.practica; guarda(); go(2); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id?.startsWith('resp_')) comprueba(e.target.id.slice(5)); });

/* ── pantalla 1: diagnóstico (y postest) ── */
function pintaDiag() {
  const post = S.modoPost && diagHecho(), fase = post ? 'post' : 'diag', lista = post ? POST : DIAG;
  $('diagTit').textContent = post ? t('Postest') : t('Diagnóstico inicial');
  if (S.esEjemplo) { $('diagBox').innerHTML = `<p class="empty">${esc(t('Estás viendo el ejemplo. Pulsa «Empezar» en el inicio para hacer tu propio diagnóstico.'))}</p>`; return; }
  asegSemilla();
  const c = curDe(fase);
  const hechos = lista.filter(id => S.ev.some(e => e.fase === fase && e.id === id)).length;
  if (!c) {
    if (post) { S.modoPost = false; guarda(); }
    $('diagBox').innerHTML = `<h3>${esc(post ? t('Postest completado') : t('Diagnóstico completado'))}</h3><ul class="op-ul">${lista.map(id => { const e = S.ev.find(x => x.fase === fase && x.id === id); return `<li>${e.ok ? '✓' : '✗'} <b>${esc(ITEM[id].ra)}</b> · ${esc(L(RA_BY[ITEM[id].ra].txt))}</li>`; }).join('')}</ul>${post ? `<p>${esc(t('Compara el antes y el después en Progreso.'))}</p>` : `<p>${esc(t('La práctica empezará por: {0}.', siguiente(S.ev, ahora(), {sinDiag: true}).ra))}</p>`}<div class="actions"><button class="btn btn-primary" type="button" id="btnAPrac">${ico('right')}<span>${esc(post ? t('Ver mi progreso') : t('Ir a la práctica'))}</span></button></div>`;
    $('btnAPrac').onclick = () => go(post ? P_PROG : 2); return;
  }
  $('diagBox').innerHTML = `<p class="op-cont">${esc(t('Pregunta {0} de {1}', Math.min(hechos + (c.res ? 0 : 1), lista.length), lista.length))}</p>` + htmlPregunta(c, fase);
}

/* ── pantalla 2: práctica ── */
function pintaPrac() {
  asegSemilla();
  $('raSel').innerHTML = [['', t('Automático')], ...RAS.map(r => [r.id, r.id])].map(([v, txt]) => `<button type="button" class="op-seg" data-ra="${v}" aria-pressed="${(S.ra || '') === v}" ${v ? `title="${esc(L(RA_BY[v].txt))}"` : ''}>${esc(txt)}</button>`).join('');
  const c = curDe('prac');
  $('motivo').innerHTML = `<p class="op-motivo-t">${ico('bulb')}<span><b>${esc(t('Por qué esta pregunta:'))}</b> ${esc(motivoTxt(c.motivo))}</span></p>` + (S.esEjemplo ? `<p class="help">${esc(t('Estás practicando sobre el ejemplo ficticio. Pulsa «Empezar de cero» en Progreso para usar tus propias respuestas.'))}</p>` : '');
  $('pregBox').innerHTML = htmlPregunta(c, 'prac');
  pintaTutor(c);
}

/* ── tutor de IA: la IA explica; el código impide que sople la solución antes de responder ── */
function pintaTutor(c) {
  const tu = S.tutor && S.tutor.id === c.id && S.tutor.k === c.k ? S.tutor : null;
  const antes = !c.res;
  let res = '';
  if (tu) res = `<div class="op-tutor-res" aria-live="polite">${md(tu.texto) || `<p class="empty">${esc(t('El tutor no dejó texto utilizable.'))}</p>`}${tu.quitadas ? `<div class="aviso">${esc(t('Se han eliminado {0} frase(s) del tutor porque revelaban la solución.', tu.quitadas))}</div>` : ''}${(tu.nuevos || []).length ? `<div class="aviso">${esc(t('Cifras del tutor que no están en el enunciado ni en la solución: {0}. Compruébalas.', tu.nuevos.join(', ')))}</div>` : ''}<p class="help">${esc(t('Respuesta de {0} ({1}). La IA puede equivocarse.', tu.prov, tu.modelo))}</p></div>`;
  $('tutorBox').innerHTML = `<h3>${ico('chat')}<span>${esc(t('Pregunta al tutor de IA (opcional)'))}</span></h3><p class="help">${esc(antes ? t('Antes de responder, el tutor no recibe la solución y el código elimina cualquier frase que la revele. Necesita tu clave de IA.') : t('Ya has respondido: el tutor recibe la solución y puede explicártela. Necesita tu clave de IA.'))}</p><div class="field"><label for="duda">${esc(t('¿Qué no entiendes?'))}</label><textarea id="duda" rows="3" placeholder="${esc(t('Por ejemplo: no sé por qué hay que restar λ·C'))}"></textarea></div><div class="actions"><button class="btn btn-ghost" type="button" id="btnTutor">${ico('sparkles')}<span>${esc(t('Preguntar al tutor'))}</span></button></div><p class="help" id="tutorEstado" role="status"></p>${res}`;
  $('btnTutor').onclick = () => preguntaTutor(c);
}
let envioRes = null;
function pideEnvio(textoEnviado, masks) {
  if (ENVIO_OK) return Promise.resolve(true);
  $('envioInfo').innerHTML = `<p class="sub" style="margin-top:0">${esc(t('Se enviarán unos {0} caracteres a {1}. Se han enmascarado {2} dato(s) personales.', nf(textoEnviado.length), PROV[getProv()].n, masks))}</p><p class="help">${esc(t('Muestra del envío:'))}</p>`;
  $('envioTxt').textContent = textoEnviado.slice(0, 3000) + (textoEnviado.length > 3000 ? '\n…' : '');
  $('envioOk').checked = false; $('envioSi').disabled = true; $('mEnvio').classList.add('on');
  return new Promise(r => { envioRes = r; });
}
function cierraEnvio(v) { $('mEnvio').classList.remove('on'); if (envioRes) { const r = envioRes; envioRes = null; if (v) ENVIO_OK = true; r(v); } }
_cierres.mEnvio = () => cierraEnvio(false);
$('envioOk').onchange = () => { $('envioSi').disabled = !$('envioOk').checked; };
$('envioSi').onclick = () => cierraEnvio(true); $('envioNo').onclick = () => cierraEnvio(false);

const PROMPT_TUTOR = ({enun, opciones, duda, respuesta, solucion, explicacion}) => `Eres tutor de la asignatura «Técnicas Avanzadas de Optimización» (programación entera, descomposición, metaheurísticas) de un máster.
${solucion === null ? `REGLA ESTRICTA: el estudiante todavía NO ha respondido. No des la solución, ni el valor numérico final, ni digas qué opción es la correcta. Haz preguntas socráticas y da como mucho UNA pista sobre el método.` : `El estudiante YA ha respondido. Explícale la solución paso a paso y, si se equivocó, por qué.`}
Responde en 120 palabras como máximo, en Markdown sencillo. ${INSTR_IDIOMA()}

PREGUNTA:
${enun}${opciones ? '\nOPCIONES:\n' + opciones : ''}
${respuesta !== null ? `\nRESPUESTA DEL ESTUDIANTE: ${respuesta}` : ''}${solucion !== null ? `\nSOLUCIÓN CORRECTA: ${solucion}\nEXPLICACIÓN DE REFERENCIA: ${explicacion}` : ''}

DUDA DEL ESTUDIANTE:
${duda}`;
let busyTutor = false;
async function preguntaTutor(c) {
  if (busyTutor) return;
  const duda = $('duda').value.trim(); if (duda.length < 3) return toast(t('Escribe tu duda'));
  if (!pideClave()) return;
  const it = ITEM[c.id], inst = instancia(c.id, S.sem, c.k);
  const enun = enunciado(it, inst) + tablaTexto(tablaDe(it, inst));
  const opciones = it.tipo === 'mc' ? inst.ord.map((oi, k) => `${LETRAS[k]}) ${L(it.ops[oi])}`).join('\n') : null;
  const {t: dudaLimpia, n} = scrub(duda);   // «t» de scrub es el texto enmascarado (no la función de traducción)
  const respTxt = c.res ? (it.tipo === 'mc' ? L(it.ops[+c.res.resp]) : c.res.resp) : null;
  const sol = c.res ? solTxt(it, inst) : null;
  const msg = PROMPT_TUTOR({enun, opciones, duda: dudaLimpia, respuesta: respTxt, solucion: sol, explicacion: it.tipo === 'mc' ? L(it.exp) : L(it.pista)});
  if (!(await pideEnvio(msg, n))) return;
  busyTutor = true; $('btnTutor').disabled = true; $('tutorEstado').innerHTML = '<span class="spin"></span> ' + esc(t('El tutor está pensando…'));
  try {
    const raw = await llm([{role: 'system', content: 'Eres un tutor riguroso y breve de investigación operativa.'}, {role: 'user', content: msg}], {max: 900});
    const f = c.res ? {texto: String(raw || ''), quitadas: 0} : filtraFugas(raw, inst, enun, LANG);
    const ref = enun + ' ' + (opciones || '') + ' ' + (sol || '') + ' ' + (c.res ? L(it.exp) : '');
    S.tutor = {id: c.id, k: c.k, texto: f.texto, quitadas: f.quitadas, nuevos: numerosNuevos(f.texto, ref), prov: PROV[getProv()].n, modelo: getMod()};
    c.ia = true; await guardaYa(); pintaTutor(c);
  } catch (e) { $('tutorEstado').textContent = e.message; toast(e.message, 8000); }
  finally { busyTutor = false; if ($('btnTutor')) $('btnTutor').disabled = false; }
}

/* ── pantalla 6: progreso ── */
const estadoRA = m => !m.n ? ['', t('Sin datos')] : m.dominio >= DOMINADO && m.n >= 5 ? ['ok', t('Dominado')] : m.dominio < 40 ? ['error', t('Flojo')] : ['aviso', t('En progreso')];
function pintaProg() {
  const T = ahora(), M = modelo(S.ev, T);
  $('ejBanner').innerHTML = S.esEjemplo ? `<div class="aviso">${esc(t('Ejemplo: progreso de una estudiante ficticia, simulado durante 12 días para mostrar cómo funciona. «Empezar de cero» lo borra.'))}</div>` : '';
  if (!S.ev.length) $('progTabla').innerHTML = `<p class="empty">${esc(t('Aún no hay respuestas. Empieza por el diagnóstico.'))}</p>`;
  else $('progTabla').innerHTML = `<div class="table-wrap"><table class="op-tab"><thead><tr><th scope="col">${esc(t('Resultado'))}</th><th scope="col">${esc(t('Dominio'))}</th><th scope="col">${esc(t('Respuestas'))}</th><th scope="col">${esc(t('Aciertos'))}</th><th scope="col">${esc(t('Última'))}</th><th scope="col"><span class="sr-only">${esc(t('Acción'))}</span></th></tr></thead><tbody>${RAS.map(r => {
    const m = M[r.id], [cl, et] = estadoRA(m), b = bloqueDe(r.id);
    return `<tr><th scope="row"><span class="op-chip" style="--c:${b.c}">${r.id}</span> <span class="op-ratxt">${esc(L(r.txt))}</span></th><td>${m.n ? `<div class="op-bar" role="img" aria-label="${esc(t('Dominio estimado: {0} %', m.dominio))}"><span style="width:${m.dominio}%;--c:${b.c}"></span></div><small>${m.dominio} % · <span class="fa-chip ${cl}">${esc(et)}</span></small>` : `<span class="fa-chip">${esc(et)}</span>`}</td><td>${m.n}</td><td>${m.n ? Math.round(100 * m.ok / m.n) + ' %' : '—'}</td><td>${m.ultimo ? esc(m.dias < 1 ? t('hoy') : t('hace {0} días', Math.floor(m.dias))) : '—'}</td><td><button class="btn btn-ghost btn-sm" type="button" data-practica="${r.id}">${esc(t('Practicar'))}</button></td></tr>`;
  }).join('')}</tbody></table></div><p class="help">${esc(t('Cuadernos con entrega verificada: {0} de {1}. Misiones resueltas: {2} de {3}.', [1, 2, 3].filter(k => S.nbEnt[k]?.ok).length, 3, MISIONES.filter(m => S.mis[m.id]?.res && Object.values(S.mis[m.id].res).every(x => x.ok)).length, MISIONES.length))}</p>`;
  const s = siguiente(S.ev, T, {sinDiag: true});
  $('progMotivo').innerHTML = `<p>${esc(diagHecho() || S.esEjemplo ? motivoTxt(s.motivo) : t('Aún no has terminado el diagnóstico inicial.'))}</p><div class="actions"><button class="btn btn-primary btn-sm" type="button" id="btnIrPrac">${ico('play')}<span>${esc(t('Practicar ahora'))}</span></button></div>`;
  $('btnIrPrac').onclick = () => { S.ra = null; guarda(); go(diagHecho() || S.esEjemplo ? 2 : 1); };
  /* antes y después */
  const nPrac = S.ev.filter(e => e.fase === 'prac').length;
  const filasPP = RAS.map(r => { const pre = S.ev.find(e => e.fase === 'diag' && e.ra === r.id), post = S.ev.find(e => e.fase === 'post' && e.ra === r.id); return [r.id, pre ? (pre.ok ? '✓' : '✗') : '—', post ? (post.ok ? '✓' : '✗') : '—']; });
  $('progPost').innerHTML = (postHecho() ? tablaHtml({cab: [t('Resultado'), t('Diagnóstico'), t('Postest')], filas: filasPP}, 'op-datos') : '') + `<p class="help">${esc(postHecho() ? t('Una pregunta por resultado no basta para medir el aprendizaje de una persona: tómalo como una señal. El profesorado ve el agregado de la clase.') : t('El postest son 5 preguntas nuevas, reservadas (no salen en la práctica), para comparar con el diagnóstico. Se activa tras 15 respuestas de práctica ({0} de 15).', Math.min(nPrac, 15)))}</p>${!postHecho() && diagHecho() && !S.esEjemplo ? `<div class="actions"><button class="btn btn-ghost btn-sm" type="button" id="btnPost" ${nPrac >= 15 ? '' : 'disabled'}>${ico('target')}<span>${esc(t('Hacer el postest'))}</span></button></div>` : ''}`;
  if ($('btnPost')) $('btnPost').onclick = () => { S.modoPost = true; guarda(); go(1); };
  /* calibración */
  const cal = CONF.map(([v, tx]) => { const xs = S.ev.filter(e => e.conf === v); return [t(tx), String(xs.length), xs.length ? Math.round(100 * xs.filter(e => e.ok).length / xs.length) + ' %' : '—']; });
  const segur = S.ev.filter(e => e.conf === 2), fallosSeg = segur.filter(e => !e.ok).length;
  $('progCal').innerHTML = tablaHtml({cab: [t('Seguridad'), t('Respuestas'), t('Aciertos')], filas: cal}, 'op-datos') + `<p class="help">${esc(segur.length >= 5 ? (fallosSeg / segur.length > 0.25 ? t('Cuando dices «Lo sé» fallas {0} de cada 10: hay ideas que crees dominar y no dominas. Revisa tus errores típicos.', Math.round(10 * fallosSeg / segur.length)) : t('Cuando dices «Lo sé» casi siempre aciertas: tu seguridad está bien calibrada.')) : t('Responde algunas preguntas más para ver si tu seguridad está calibrada.'))}</p>`;
  /* errores típicos */
  const cuenta = {};
  S.ev.filter(e => e.diag != null && ITEM[e.id]?.mut?.[e.diag]).forEach(e => { const k = e.id + '|' + e.diag; cuenta[k] = (cuenta[k] || 0) + 1; });
  const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $('progErrores').innerHTML = top.length ? `<ul class="op-ul">${top.map(([k, nn]) => { const [id, d] = k.split('|'); const it = ITEM[id]; return `<li>${chip(it.ra)} ${esc(L(it.mut[+d].fb))} <small class="muted">(${esc(nn === 1 ? t('1 vez') : t('{0} veces', nn))})</small></li>`; }).join('')}</ul>` : `<p class="empty">${esc(t('Aún no se ha detectado ningún error típico en los problemas calculados.'))}</p>`;
  $('progGuia').innerHTML = RAS.map(r => `<div class="op-origen"><p>${chip(r.id)} ${esc(L(r.txt))} ${r.enGuia ? '' : `<span class="fa-chip aviso">${esc(t('No consta como objetivo en la guía'))}</span>`}</p><ul>${r.origen.map(o => `<li>«${esc(o.cita)}» <small class="muted">(${esc(t('Guía Docente, sección «{0}»', t(o.seccion)))})</small></li>`).join('')}</ul></div>`).join('') + `<p class="help">${esc(t('Evaluación según la guía:'))} «${esc(CURSO.evaluacion.cita)}»</p>`;
}
/* exportaciones */
function informeMd() {
  const T = ahora(), M = modelo(S.ev, T);
  const filas = RAS.map(r => { const m = M[r.id]; return `- **${r.id}** ${L(r.txt)} — ${m.n ? t('dominio estimado {0} %, {1} respuestas, {2} % de aciertos', m.dominio, m.n, Math.round(100 * m.ok / m.n)) : t('sin datos')}`; }).join('\n');
  const nbs = [1, 2, 3].map(k => `- ${t('Cuaderno {0}', k)}: ${S.nbEnt[k]?.ok ? t('entrega verificada') : t('sin entrega verificada')}`).join('\n');
  return `## ${t('Resumen')}\n${t('Asignatura: {0} ({1}), curso {2}.', CURSO.nombre, CURSO.codigo, CURSO.curso)}\n${t('Seudónimo: {0}. Respuestas registradas: {1}.', S.sem, S.ev.length)}${S.esEjemplo ? '\n\n' + t('[EJEMPLO con datos simulados de una estudiante ficticia]') : ''}\n\n## ${t('Dominio por resultado de aprendizaje')}\n${filas}\n\n## ${t('Cuadernos')}\n${nbs}\n\n## ${t('Qué te toca ahora y por qué')}\n${motivoTxt(siguiente(S.ev, T, {sinDiag: true}).motivo)}\n\n## ${t('Cómo leer este informe')}\n${t('El dominio es una estimación orientativa (modelo tipo Elo con olvido) calculada con tus respuestas en este navegador. No es una nota ni sustituye a la evaluación de la asignatura.')}`;
}
$('btnWord').onclick = async () => { if (!S.ev.length) return toast(t('Aún no hay respuestas')); try { dl('optimizia-progreso.docx', await wordDeMarkdown(informeMd(), {titulo: t('Progreso en {0}', CURSO.nombre), subtitulo: new Date().toLocaleDateString(locale()), pie: t('Generado con {0} {1}. Estimación orientativa; no es una nota.', APP_NAME, VERSION)})); } catch (e) { toast(e.message, 7000); } };
$('btnCsv').onclick = () => { if (!S.ev.length) return toast(t('Aún no hay respuestas')); dl('optimizia-respuestas.csv', csvDe([t('fecha'), t('ra'), t('item'), t('tipo'), t('variante'), t('fase'), t('correcta'), t('respuesta'), t('error_tipico'), t('ayuda'), t('seguridad')], S.ev.map(e => [new Date(e.t).toISOString(), e.ra, e.id, e.tipo, e.k ?? 0, e.fase, e.ok ? t('sí') : t('no'), e.resp, e.diag ?? '', e.ayuda || '', e.conf ?? ''])), 'text/csv;charset=utf-8'); };
const COPIA = () => ({formato: 'optimizia/1', version: VERSION, exportado: new Date().toISOString(), sem: S.sem, ev: S.ev, nb: S.nb, esEjemplo: S.esEjemplo, form: S.form, nbEnt: S.nbEnt, mis: S.mis, tor: S.tor, res: S.res, poli: S.poli});
$('btnJson').onclick = () => dl('optimizia-copia.json', new Blob([JSON.stringify(COPIA(), null, 1)], {type: 'application/json'}));
/* entrega anónima para el profesorado: seudónimo, eventos, entregas verificadas, torneo y misiones (sin textos salvo que se marque) */
function entregaAlumno(conTextos) {
  const mis = Object.fromEntries(Object.entries(S.mis).filter(([, v]) => v?.res).map(([k, v]) => [k, {ok: Object.values(v.res).every(x => x.ok), res: Object.fromEntries(Object.entries(v.res).map(([q, r]) => [q, !!r.ok])), ...(conTextos ? {justificacion: v.resp?.just || ''} : {})}]));
  const tor = Object.entries(S.tor).filter(([, v]) => v?.mejor).map(([semana, v]) => ({semana, L: v.mejor.L, gap: v.mejor.gap}));
  return {formato: 'optimizia-entrega/1', version: VERSION, exportado: new Date().toISOString(), sem: S.sem, ev: S.ev.map(({t: tt, id, ra, tipo, k, fase, ok, resp, diag, ayuda, conf}) => ({t: tt, id, ra, tipo, k, fase, ok, resp, diag, ayuda, conf})), nb: Object.fromEntries(Object.entries(S.nbEnt).map(([k, v]) => [k, {ok: !!v?.ok}])), torneo: tor, misiones: mis, ficticia: !!S.esEjemplo};
}
$('btnEntrega').onclick = () => { if (!S.ev.length) return toast(t('Aún no hay respuestas')); dl(`optimizia-entrega-${S.sem}.json`, new Blob([JSON.stringify(entregaAlumno($('chkTextos').checked))], {type: 'application/json'})); toast(t('Envía este fichero a tu profesorado (por ejemplo, en la tarea del aula virtual).'), 6000); };
$('fImport').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const j = JSON.parse(await f.text()); if (j.formato !== 'optimizia/1' || !Array.isArray(j.ev)) throw new Error(t('El fichero no es una copia de OptimizIA.')); const ev = j.ev.filter(x => ITEM[x.id] && RA_BY[x.ra] && typeof x.t === 'number'); S = {...S_INI(), sem: String(j.sem || S.sem), ev, nb: j.nb || {}, esEjemplo: !!j.esEjemplo, form: j.form || {}, nbEnt: j.nbEnt || {}, mis: j.mis || {}, tor: j.tor || {}, res: j.res || {}, poli: j.poli || {}}; await guardaYa(); toast(t('Copia importada: {0} respuestas.', ev.length)); go(P_PROG); }
  catch (er) { toast(er.message || t('No se pudo leer el fichero.'), 7000); }
};
$('btnReset').onclick = () => {
  if (S.ev.length && !S.esEjemplo && Date.now() - resetArmado > 5000) { resetArmado = Date.now(); return toast(t('Se borrarán tus {0} respuestas de este navegador. Pulsa otra vez para confirmar.', S.ev.length), 5000); }
  resetArmado = 0; const sem = S.esEjemplo ? S.sem : null; S = {...S_INI(), sem}; asegSemilla(); guarda(); toast(t('Progreso borrado.')); go(0);
};
/* banco para Moodle (GIFT): solo las de opción múltiple, en el idioma activo */
const giftEsc = s => String(s).replace(/([~=#{}:\\])/g, '\\$1');
$('btnGift').onclick = () => { const txt = `// OptimizIA ${VERSION} · ${CURSO.nombre} (${CURSO.codigo}) · ${LANG}\n// ${t('Banco inicial pendiente de revisión por el profesorado.')}\n\n` + MC.map(m => `$CATEGORY: OptimizIA/${m.ra}\n::${m.id}::${giftEsc(L(m.q))} {\n${m.ops.map((o, i) => `${i === m.ok ? '=' : '~'}${giftEsc(L(o))}`).join('\n')}\n####${giftEsc(L(m.exp))}\n}\n`).join('\n'); dl(`optimizia-banco-${LANG}.gift.txt`, new Blob([txt], {type: 'text/plain;charset=utf-8'})); };
/* copiar al portapapeles (con alternativa si el navegador no lo permite) */
async function copia(txt, el) { try { await navigator.clipboard.writeText(txt); toast(t('Copiado')); } catch { if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } toast(t('Selecciona el texto y cópialo con Ctrl+C')); } }
