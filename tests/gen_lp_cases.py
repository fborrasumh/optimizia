# Genera problemas LP/MIP aleatorios y los resuelve con OR-Tools (GLOP / SCIP) como referencia → tests/lp_cases.json
import random, json, sys
from ortools.linear_solver import pywraplp
rnd = random.Random(7); casos = []
for k in range(400):
    n = rnd.randint(2, 9); m = rnd.randint(1, 8); mip = k % 2 == 1; libre = k % 7 == 0
    c = [rnd.randint(-9, 9) for _ in range(n)]
    filas = []
    for _ in range(m):
        a = [[j, rnd.randint(-6, 9)] for j in range(n) if rnd.random() < 0.7]
        s = rnd.choice(['<=', '<=', '>=', '='] if k % 3 else ['<='])
        filas.append({'a': a, 's': s, 'b': rnd.randint(-5, 30)})
    lb = [(-rnd.randint(0, 4) if libre and j % 2 else 0) for j in range(n)]
    ub = [(rnd.randint(1, 8) if rnd.random() < 0.6 or mip else None) for j in range(n)]
    s = pywraplp.Solver.CreateSolver('SCIP' if mip else 'GLOP')
    x = [(s.IntVar if mip else s.NumVar)(lb[j], ub[j] if ub[j] is not None else s.infinity(), f'x{j}') for j in range(n)]
    cons = []
    for f in filas:
        e = sum(v * x[j] for j, v in f['a']) if f['a'] else 0
        if not f['a']: e = 0 * x[0]
        cons.append(s.Add(e <= f['b']) if f['s'] == '<=' else s.Add(e >= f['b']) if f['s'] == '>=' else s.Add(e == f['b']))
    s.Minimize(sum(c[j] * x[j] for j in range(n)))
    st = s.Solve()
    est = {pywraplp.Solver.OPTIMAL: 'optimo', pywraplp.Solver.INFEASIBLE: 'infactible', pywraplp.Solver.UNBOUNDED: 'no_acotado'}.get(st, 'otro')
    if est == 'otro': continue
    casos.append({'n': n, 'c': c, 'filas': filas, 'lb': lb, 'ub': [u if u is not None else 1e308 for u in ub], 'ent': [mip] * n, 'mip': mip, 'ref': est, 'z': s.Objective().Value() if est == 'optimo' else None})
json.dump(casos, open(sys.argv[1], 'w')); print(len(casos), 'casos', {e: sum(1 for c in casos if c['ref'] == e) for e in ('optimo', 'infactible', 'no_acotado')})
# bloque 2: factibles y acotados con x ≥ 0 (comprobación de duales) y bloque 3: más grandes (rendimiento)
for k in range(300):
    grande = k >= 220
    n = rnd.randint(25, 60) if grande else rnd.randint(2, 12); m = rnd.randint(15, 40) if grande else rnd.randint(1, 10)
    c = [rnd.randint(1, 20) for _ in range(n)]
    filas = [{'a': [[j, rnd.randint(1, 9)] for j in range(n) if rnd.random() < 0.5] or [[0, 1]], 's': rnd.choice(['>=', '>=', '=', '<=']), 'b': rnd.randint(1, 40)} for _ in range(m)]
    for f in filas:
        if f['s'] == '<=': f['b'] += 200
    mip = grande and k % 2 == 0
    if mip:
        n = min(n, 30); c = c[:n]
        for f in filas: f['a'] = [t for t in f['a'] if t[0] < n] or [[0, 1]]
    s = pywraplp.Solver.CreateSolver('SCIP' if mip else 'GLOP')
    x = [(s.IntVar if mip else s.NumVar)(0, s.infinity(), '') for j in range(n)]
    for f in filas:
        e = sum(v * x[j] for j, v in f['a'])
        s.Add(e <= f['b']) if f['s'] == '<=' else s.Add(e >= f['b']) if f['s'] == '>=' else s.Add(e == f['b'])
    s.Minimize(sum(c[j] * x[j] for j in range(n))); st = s.Solve()
    est = {pywraplp.Solver.OPTIMAL: 'optimo', pywraplp.Solver.INFEASIBLE: 'infactible'}.get(st, 'otro')
    if est == 'otro': continue
    casos.append({'n': n, 'c': c, 'filas': filas, 'lb': [0] * n, 'ub': [1e308] * n, 'ent': [mip] * n, 'mip': mip, 'ref': est, 'z': s.Objective().Value() if est == 'optimo' else None})
json.dump(casos, open(sys.argv[1], 'w')); print(len(casos), 'casos en total')
