"""Cuadernos ↔ app: la app genera instancias personales, los cuadernos las resuelven con OR-Tools y la app valida las entregas.
   python3 tests/test_entregas.py"""
import json, subprocess, pathlib, re, sys, nbformat
from nbclient import NotebookClient
R = pathlib.Path(__file__).resolve().parent.parent; SEM = 'EPRUEBA7'
inst = json.loads(subprocess.check_output(['node', str(R / 'tests/entregas.js'), 'instancias', SEM]))
salida = {'nb': [], 'torneo': None}
for k, f in enumerate(['01-reforzamiento.ipynb', '02-descomposicion.ipynb', '03-metaheuristicas.ipynb']):
    nb = nbformat.read(R / 'cuadernos' / f, as_version=4)
    for c in nb.cells:
        if c.cell_type == 'code' and c.source.startswith('INSTANCIA = None'): c.source = 'INSTANCIA = ' + json.dumps(inst['nb'][k])
        if c.cell_type == 'code' and c.source.startswith('TORNEO = None'): c.source = c.source.replace('TORNEO = None', 'TORNEO = ' + json.dumps({k2: inst['torneo'][k2] for k2 in ('semana', 'ciudades')}), 1)
    NotebookClient(nb, timeout=300, kernel_name='python3').execute()
    txt = '\n'.join(o.get('text', '') for c in nb.cells if c.cell_type == 'code' for o in c.get('outputs', []) if o.get('output_type') == 'stream')
    errores = [o['ename'] for c in nb.cells if c.cell_type == 'code' for o in c.get('outputs', []) if o.get('output_type') == 'error']
    assert not errores, (f, errores)
    salida['nb'].append(json.loads(re.search(r'ENTREGA = (\{.*\})', txt).group(1)))
    m = re.search(r'RUTA = (\{.*\})', txt)
    if m: salida['torneo'] = json.loads(m.group(1))
    print('ejecutado', f)
v = json.loads(subprocess.run(['node', str(R / 'tests/entregas.js'), 'verifica', SEM], input=json.dumps(salida), capture_output=True, text=True, check=True).stdout)
ok = True
for k, r in enumerate(v['nb']):
    bien = 'items' in r and all(i['ok'] for i in r['items'])
    ok &= bien; print(('✓' if bien else '✕'), f'cuaderno {k + 1}: la app valida la entrega calculada con OR-Tools', json.dumps(r)[:240])
t = v['torneo']; bien = t['ok'] and t['gap'] < 5; ok &= bien
print(('✓' if bien else '✕'), f"torneo: ruta válida de OR-Tools (GLS) · L = {t.get('L')} · gap ≤ {t.get('gap', 0):.2f} % frente a Held-Karp")
# una entrega manipulada no debe pasar
mal = json.loads(json.dumps(salida)); mal['nb'][0]['res']['z_ip'] += 1
v2 = json.loads(subprocess.run(['node', str(R / 'tests/entregas.js'), 'verifica', SEM], input=json.dumps(mal), capture_output=True, text=True, check=True).stdout)
bien = not all(i['ok'] for i in v2['nb'][0]['items']); ok &= bien; print(('✓' if bien else '✕'), 'una entrega con un valor alterado se rechaza')
mal2 = json.loads(json.dumps(salida)); mal2['nb'][1]['semilla'] = 'OTRA'
v3 = json.loads(subprocess.run(['node', str(R / 'tests/entregas.js'), 'verifica', SEM], input=json.dumps(mal2), capture_output=True, text=True, check=True).stdout)
bien = v3['nb'][1].get('error') == 'semilla'; ok &= bien; print(('✓' if bien else '✕'), 'la entrega de otra persona (otra semilla) se rechaza')
print('TODO OK' if ok else 'HAY FALLOS'); sys.exit(0 if ok else 1)
