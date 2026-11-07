// Carga la lógica pura de la app en Node (mismo orden que app.json → app_js)
const fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = () => { const ctx = {console, module: {exports: {}}}; vm.createContext(ctx);
  vm.runInContext(['curriculum.js', 'lp.js', 'dsl.js', 'lab.js', 'lab2.js', 'actividades.js', 'motor.js', 'panel.js'].map(f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')).join('\n;\n') + '\n;this.X=module.exports;', ctx); return ctx.X; };
