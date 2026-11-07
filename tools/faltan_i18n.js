// Lista las cadenas de la interfaz sin traducción en/pt (t('…') literales, data-i18n y claves dinámicas).  node tools/faltan_i18n.js
const fs = require('fs'), vm = require('vm'), path = require('path'); const R = path.join(__dirname, '..');
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(R + '/src/i18n.js', 'utf8') + ';this.D=I18N;', ctx);
const base = fs.readFileSync(R + '/forja/js/65-i18n.js', 'utf8'); const ctx2 = {}; vm.createContext(ctx2);
vm.runInContext(base.slice(base.indexOf('const I18N_BASE'), base.indexOf('const _dict')) + ';this.B=I18N_BASE;', ctx2);
const claves = new Set();
for (const f of ['app.js', 'ui_lab.js', 'ui_act.js', 'ui_panel.js']) { const s = fs.readFileSync(R + '/src/' + f, 'utf8'); for (const m of s.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)) claves.add(m[1].replace(/\\'/g, "'")); }
const b = fs.readFileSync(R + '/src/body.html', 'utf8'); for (const m of b.matchAll(/data-i18n="([^"]+)"/g)) claves.add(m[1]); for (const m of b.matchAll(/data-i18n-attr="([^"]+)"/g)) m[1].split(';').forEach(p => claves.add(p.split(':')[1]));
// claves dinámicas
const src = fs.readFileSync(R + '/src/app.js', 'utf8') + fs.readFileSync(R + '/src/ui_lab.js', 'utf8') + fs.readFileSync(R + '/src/ui_act.js', 'utf8') + fs.readFileSync(R + '/src/ui_panel.js', 'utf8');
const ev = new Function(src.match(/const STEPS = [^\n]+/)[0] + src.match(/const HUBS = [^\n]+/)[0] + src.match(/const NAV = [^\n]+/)[0] + src.match(/const GLOS = \[[\s\S]*?\n\];/)[0] + src.match(/const CONF = [^\n]+/)[0] + src.match(/const LAB_TABS = [^\n]+/)[0] + src.match(/const COTAS_TABS = [^\n]+/)[0] + src.match(/const RES_COLS = [^\n]+/)[0] + src.match(/const CLAVES_NB = [^\n]+/)[0] + src.match(/const AVISOS = [^\n]+/)[0] + ';return {STEPS,HUBS,NAV,GLOS,CONF,LAB_TABS,COTAS_TABS,RES_COLS,CLAVES_NB,AVISOS}')();
ev.STEPS.forEach(x => claves.add(x)); ev.HUBS.forEach(x => claves.add(x)); ev.NAV.flat().forEach(x => claves.add(x)); ev.GLOS.flat().forEach(x => claves.add(x)); ev.CONF.forEach(x => claves.add(x[1]));
ev.LAB_TABS.forEach(x => claves.add(x[1])); ev.COTAS_TABS.forEach(x => claves.add(x[1])); Object.values(ev.RES_COLS).flat().forEach(x => claves.add(x[1])); Object.values(ev.CLAVES_NB).forEach(x => claves.add(x)); Object.values(ev.AVISOS).forEach(x => claves.add(x));
['ramifica', 'entero', 'podado', 'infactible', 'no_acotado'].forEach(x => claves.add('nodo.' + x)); ['Unidades didácticas', 'Descripción', 'Objetivos', 'Sí', 'No', 'Subgradiente'].forEach(x => claves.add(x));
const msgs = (src.match(/const M = \{opEstricto[\s\S]*?\};/) || [''])[0]; for (const m of msgs.matchAll(/: '((?:[^'\\]|\\.)*)'/g)) claves.add(m[1]);
const falta = [...claves].filter(k => k && (ctx.D.en[k] === undefined || ctx.D.pt[k] === undefined) && (ctx2.B.en?.[k] === undefined));
fs.writeFileSync('/tmp/faltan.json', JSON.stringify(falta, null, 1)); console.log(falta.length, 'sin traducir');
