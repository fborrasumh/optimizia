#!/usr/bin/env python3
"""Genera los tres cuadernos de OptimizIA (OR-Tools, para Colab). Uso: python3 gen_nb.py <carpeta_salida>"""
import sys, pathlib, nbformat as nbf

OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'cuadernos'); OUT.mkdir(parents=True, exist_ok=True)
REPO = 'fborrasumh/optimizia'
AUT = 'Fernando Borrás Rocher, Mercedes Landete Ruiz y Juan Francisco Monge Ivars'

def md(s): return nbf.v4.new_markdown_cell(s.strip('\n'))
def code(s): return nbf.v4.new_code_cell(s.strip('\n'))

def cab(n, fich, titulo, ra, lede):
    return [md(f"""
<a href="https://colab.research.google.com/github/{REPO}/blob/main/cuadernos/{fich}" target="_parent"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Abrir en Colab"/></a>

# OptimizIA · Cuaderno {n}: {titulo}

**Técnicas Avanzadas de Optimización (8265)** · Máster en Estadística Computacional y Ciencia de Datos para la Toma de Decisiones · UMH.
Cuaderno de práctica de la app OptimizIA ({AUT}). Licencia MIT.

**Resultados de aprendizaje que trabaja:** {ra}

{lede}

> Cómo usarlo: ejecuta las celdas en orden (Mayús+Intro). Los ejercicios están marcados con ✏️. Las celdas «Solución» están plegadas: despliégalas solo después de intentarlo.
> Las instancias son **pequeñas y ficticias**, pensadas para ver el mecanismo; los tiempos que veas dependen de la máquina de Colab.
"""), code("""
# Instala OR-Tools si no está (en Colab tarda unos segundos)
try:
    import ortools
except ImportError:
    %pip install -q ortools
    import ortools
print('OR-Tools', ortools.__version__)
""")]

# ───────────────────────── Cuaderno 1 · Reforzamiento ─────────────────────────
nb1 = cab(1, '01-reforzamiento.ipynb', 'Formular y reforzar modelos enteros',
    'RA1 (formular modelos de programación entera) y RA2 (reforzar una formulación y medir la mejora de la cota).',
    'Idea central: dos formulaciones **correctas** del mismo problema entero pueden tener relajaciones lineales muy distintas. La más ajustada da mejores cotas y el branch-and-bound explora menos nodos.') + [
md("""
## 1. Localización de plantas sin capacidades (UFL)

Abrir la planta $i$ cuesta $f_i$; servir al cliente $j$ desde $i$ cuesta $c_{ij}$. Variables: $y_i\\in\\{0,1\\}$ (abrir) y $x_{ij}\\in[0,1]$ (fracción de $j$ servida desde $i$).

$$\\min \\sum_i f_i y_i + \\sum_{i,j} c_{ij}x_{ij} \\quad \\text{s.a.}\\quad \\sum_i x_{ij}=1\\;\\forall j$$

Dos maneras de impedir servir desde una planta cerrada:
- **Débil (agregada):** $\\sum_j x_{ij} \\le n\\,y_i \\;\\forall i$ — una restricción por planta.
- **Fuerte (desagregada):** $x_{ij} \\le y_i \\;\\forall i,j$ — una por par.

Las dos tienen las mismas soluciones enteras. ¿Y sus relajaciones lineales?
"""),
code("""
import random, time
from ortools.linear_solver import pywraplp

def instancia_ufl(m=8, n=25, semilla=1):
    rnd = random.Random(semilla)
    P = [(rnd.random(), rnd.random()) for _ in range(m)]   # plantas
    C = [(rnd.random(), rnd.random()) for _ in range(n)]   # clientes
    f = [round(rnd.uniform(3, 6), 2) for _ in range(m)]
    c = [[round(10 * ((P[i][0]-C[j][0])**2 + (P[i][1]-C[j][1])**2) ** .5, 2) for j in range(n)] for i in range(m)]
    return f, c

def ufl(f, c, fuerte=True, relajada=False):
    m, n = len(f), len(c[0])
    s = pywraplp.Solver.CreateSolver('GLOP' if relajada else 'SCIP')
    y = [s.NumVar(0, 1, f'y{i}') if relajada else s.BoolVar(f'y{i}') for i in range(m)]
    x = [[s.NumVar(0, 1, f'x{i}_{j}') for j in range(n)] for i in range(m)]
    for j in range(n):
        s.Add(sum(x[i][j] for i in range(m)) == 1)
    for i in range(m):
        if fuerte:
            for j in range(n): s.Add(x[i][j] <= y[i])
        else:
            s.Add(sum(x[i][j] for j in range(n)) <= n * y[i])
    s.Minimize(sum(f[i] * y[i] for i in range(m)) + sum(c[i][j] * x[i][j] for i in range(m) for j in range(n)))
    t0 = time.time(); st = s.Solve(); dt = time.time() - t0
    assert st == pywraplp.Solver.OPTIMAL
    return s.Objective().Value(), dt, s.NumConstraints(), s.nodes() if not relajada else 0

f, c = instancia_ufl()
z_ip, t_ip, _, nodos = ufl(f, c, fuerte=True)
print(f'Óptimo entero z_IP = {z_ip:.3f}')
for nombre, fuerte in (('débil', False), ('fuerte', True)):
    z_lp, _, ncons, _ = ufl(f, c, fuerte=fuerte, relajada=True)
    print(f'Relajación {nombre:7s}: z_LP = {z_lp:8.3f} · gap = {100*(z_ip - z_lp)/z_ip:5.1f} % · {ncons} restricciones')
"""),
md("""
**Qué observar.** La formulación fuerte tiene más restricciones, pero su cota inferior está mucho más cerca del óptimo (gap pequeño o nulo). La débil deja abrir «un poco» cada planta ($y_i = \\sum_j x_{ij}/n$), y eso abarata artificialmente la relajación.

✏️ **Ejercicio 1.** Cambia la semilla y el tamaño (`instancia_ufl(m=12, n=40, semilla=7)`) y compara también los **nodos** de branch-and-bound de SCIP con cada formulación (`ufl(...)[3]`). ¿Se mantiene la conclusión?
"""),
code("""
#@title Solución del ejercicio 1 { display-mode: "form" }
f2, c2 = instancia_ufl(m=12, n=40, semilla=7)
for nombre, fuerte in (('débil', False), ('fuerte', True)):
    z, t, _, nodos = ufl(f2, c2, fuerte=fuerte)
    zl = ufl(f2, c2, fuerte=fuerte, relajada=True)[0]
    print(f'{nombre:7s}: z_IP={z:.3f}  z_LP={zl:.3f}  nodos={nodos}  t={t:.2f}s')
"""),
md("""
## 2. Big-M ajustada

Con capacidades, la restricción de enlace es $\\sum_j d_j x_{ij} \\le M y_i$. Cualquier $M$ suficientemente grande es **correcta**, pero cuanto mayor es $M$, más débil es la relajación. La más pequeña válida es $M_i = \\min(Q_i, \\sum_j d_j)$: la planta no puede servir más que su capacidad ni más que la demanda total.
"""),
code("""
def cfl_lp(M_factor, semilla=3, m=6, n=15):
    rnd = random.Random(semilla)
    d = [rnd.randint(5, 20) for _ in range(n)]
    Q = [rnd.randint(40, 90) for _ in range(m)]
    f = [rnd.randint(30, 60) for _ in range(m)]
    c = [[rnd.randint(1, 15) for _ in range(n)] for _ in range(m)]
    def resuelve(relajada, Ms):
        s = pywraplp.Solver.CreateSolver('GLOP' if relajada else 'SCIP')
        y = [s.NumVar(0, 1, '') if relajada else s.BoolVar('') for _ in range(m)]
        x = [[s.NumVar(0, 1, '') for _ in range(n)] for _ in range(m)]
        for j in range(n): s.Add(sum(x[i][j] for i in range(m)) == 1)
        for i in range(m):
            s.Add(sum(d[j] * x[i][j] for j in range(n)) <= Q[i])            # capacidad
            s.Add(sum(d[j] * x[i][j] for j in range(n)) <= Ms[i] * y[i])    # enlace con big-M
        s.Minimize(sum(f[i]*y[i] for i in range(m)) + sum(c[i][j]*d[j]*x[i][j] for i in range(m) for j in range(n)))
        s.Solve(); return s.Objective().Value()
    M_aj = [min(Q[i], sum(d)) for i in range(m)]
    z_ip = resuelve(False, M_aj)
    return z_ip, resuelve(True, [M_factor * Mi for Mi in M_aj])

for k in (1, 2, 10, 100):
    z_ip, z_lp = cfl_lp(k)
    print(f'M = {k:>3} × M_ajustada → z_LP = {z_lp:9.2f} · gap = {100*(z_ip-z_lp)/z_ip:5.1f} %')
"""),
md("""
## 3. Desigualdades de cubierta en la mochila

En $\\max \\sum v_i x_i$ s.a. $\\sum w_i x_i \\le C$, un conjunto $K$ con $\\sum_{i\\in K} w_i > C$ es una **cubierta**: no caben todos, así que $\\sum_{i\\in K} x_i \\le |K|-1$ es válida. No elimina ninguna solución entera, pero sí puntos fraccionarios de la relajación.
"""),
code("""
v = [10, 13, 7, 8, 6]; w = [5, 7, 4, 5, 3]; C = 12

def mochila(cubiertas=(), relajada=True):
    s = pywraplp.Solver.CreateSolver('GLOP' if relajada else 'SCIP')
    x = [s.NumVar(0, 1, f'x{i}') if relajada else s.BoolVar(f'x{i}') for i in range(len(v))]
    s.Add(sum(w[i] * x[i] for i in range(len(v))) <= C)
    for K in cubiertas: s.Add(sum(x[i] for i in K) <= len(K) - 1)
    s.Maximize(sum(v[i] * x[i] for i in range(len(v))))
    s.Solve(); return s.Objective().Value(), [round(xi.solution_value(), 3) for xi in x]

print('Óptimo entero      :', mochila(relajada=False))
print('Relajación         :', mochila())
print('Con cubierta {0,1} :', mochila(cubiertas=[(0, 1)]))
"""),
md("""
✏️ **Ejercicio 2.** Encuentra a mano **todas las cubiertas minimales** de esta mochila (quitar cualquier elemento deja de ser cubierta), añádelas y mide cuánto se cierra el gap. Comprueba tu lista con la celda de solución.
"""),
code("""
#@title Solución del ejercicio 2 { display-mode: "form" }
from itertools import combinations
n = len(w)
cub = [K for r in range(2, n + 1) for K in combinations(range(n), r) if sum(w[i] for i in K) > C]
minimales = [K for K in cub if all(sum(w[i] for i in K) - w[k] <= C for k in K)]
print('Cubiertas minimales:', minimales)
z_ip = mochila(relajada=False)[0]; z0 = mochila()[0]; z1 = mochila(cubiertas=minimales)[0]
print(f'z_IP={z_ip}  z_LP={z0:.3f}  z_LP+cubiertas={z1:.3f}  → gap cerrado: {100*(z0-z1)/(z0-z_ip):.0f} %')
"""),
md("""
## 🎯 Tu instancia personal y tu entrega

1. En OptimizIA, ve a **Cuadernos → Tu instancia personal** y pulsa **Copiar**.
2. Sustituye la línea `INSTANCIA = None` de la celda siguiente por la que has copiado y ejecuta las dos celdas.
3. Copia la línea `ENTREGA = {…}` que aparece y pégala en OptimizIA: la app recalcula tu instancia con su propio solver y valida tu resultado.

> ✏️ Antes de ejecutar, **predice**: ¿qué gap tendrá la formulación débil en tu instancia? ¿Y la fuerte?
"""),
code("""
INSTANCIA = None   # ← sustituye esta línea por la que copias de OptimizIA
"""),
code("""
import json
if INSTANCIA:
    fI, cI = INSTANCIA['f'], INSTANCIA['c']
    res = {'z_ip': ufl(fI, cI, fuerte=True)[0], 'z_lp_debil': ufl(fI, cI, fuerte=False, relajada=True)[0], 'z_lp_fuerte': ufl(fI, cI, fuerte=True, relajada=True)[0]}
    print(f"gap débil = {100*(res['z_ip']-res['z_lp_debil'])/res['z_ip']:.1f} % · gap fuerte = {100*(res['z_ip']-res['z_lp_fuerte'])/res['z_ip']:.1f} %")
    print('ENTREGA =', json.dumps({'app': 'optimizia', 'cuaderno': 1, 'semilla': INSTANCIA['semilla'], 'res': res}))
else:
    print('Pega primero tu INSTANCIA en la celda anterior.')
"""),
md("""
## Para llevarte
- La calidad de una formulación entera se mide por su **relajación lineal**: cuanto más cerca de la envolvente convexa, mejor.
- Desagregar restricciones, ajustar las big-M y añadir desigualdades válidas (cubiertas, cortes) son formas de **reforzar** sin cambiar las soluciones enteras.
- Bibliografía de la guía: Nemhauser y Wolsey, *Integer and Combinatorial Optimization* (Wiley).
""")]

# ───────────────────────── Cuaderno 2 · Descomposición ─────────────────────────
nb2 = cab(2, '02-descomposicion.ipynb', 'Técnicas de descomposición',
    'RA3 (elegir el método de descomposición adecuado a la estructura) y RA4 (aplicarlo: generación de columnas, relajación lagrangiana, Benders).',
    'Tres métodos, tres estructuras: **muchas variables** (generación de columnas), **restricciones que complican** (relajación lagrangiana) y **variables que complican** (Benders).') + [
md("""
## 1. Generación de columnas: el problema del corte (*cutting stock*)

Rollos de ancho $W$; pedidos de $d_k$ piezas de ancho $w_k$. Cada **patrón** $p$ (cuántas piezas de cada tipo salen de un rollo, $a_{kp}$) es una columna. Hay demasiados patrones para enumerarlos: el **maestro restringido** trabaja con unos pocos, y el **subproblema de precios** (una mochila con los duales $\\pi_k$) busca un patrón con coste reducido $1-\\sum_k \\pi_k a_k < 0$.
"""),
code("""
from ortools.linear_solver import pywraplp
W = 100; w = [45, 36, 31, 14]; d = [97, 610, 395, 211]

def mochila_entera(valores, pesos, cap):
    # Mochila entera sin límite (programación dinámica): máximo Σ valor·a con Σ peso·a ≤ cap
    best = [0.0] * (cap + 1); elec = [None] * (cap + 1)
    for c in range(1, cap + 1):
        best[c], elec[c] = best[c - 1], None
        for k, (vk, pk) in enumerate(zip(valores, pesos)):
            if pk <= c and best[c - pk] + vk > best[c] + 1e-12:
                best[c], elec[c] = best[c - pk] + vk, k
    a, c = [0] * len(pesos), cap
    while c > 0:
        if elec[c] is None: c -= 1
        else: a[elec[c]] += 1; c -= pesos[elec[c]]
    return best[cap], a

def maestro(patrones, entero=False):
    s = pywraplp.Solver.CreateSolver('SCIP' if entero else 'GLOP')
    lam = [s.IntVar(0, s.infinity(), '') if entero else s.NumVar(0, s.infinity(), '') for _ in patrones]
    filas = [s.Add(sum(p[k] * lam[q] for q, p in enumerate(patrones)) >= d[k]) for k in range(len(w))]
    s.Minimize(sum(lam)); s.Solve()
    return s.Objective().Value(), [f.dual_value() for f in filas] if not entero else None, [l.solution_value() for l in lam]

# Patrones iniciales: homogéneos (solo un tipo de pieza)
patrones = [[(W // w[k]) if j == k else 0 for j in range(len(w))] for k in range(len(w))]
for it in range(1, 50):
    z, pi, _ = maestro(patrones)
    valor, a = mochila_entera(pi, w, W)
    cr = 1 - valor
    print(f'it {it:2d}: z_maestro = {z:9.3f} · mejor coste reducido = {cr:+.4f} · patrón {a}')
    if cr > -1e-9: break
    patrones.append(a)
z_ent, _, lam = maestro(patrones, entero=True)
print(f'\\nCota de la relajación (z_LP) = {z:.3f} → al menos {int(-(-z // 1))} rollos')
print(f'Maestro entero con las columnas generadas: {z_ent:.0f} rollos (solución factible; el óptimo garantizado exigiría branch-and-price)')
"""),
md("""
✏️ **Ejercicio 1.** Calcula **a mano** el coste reducido del patrón $(0,2,0,2)$ con los duales de la última iteración (`pi`). ¿Por qué el algoritmo ya no lo añade?
"""),
code("""
#@title Solución del ejercicio 1 { display-mode: "form" }
patron = [0, 2, 0, 2]
assert sum(wk * ak for wk, ak in zip(w, patron)) <= W, 'el patrón no cabe'
cr = round(1 - sum(p * a for p, a in zip(pi, patron)), 9) + 0.0
print(f'coste reducido = {cr:+.4f} (≥ 0: ya no mejora el maestro; lo añadimos en la iteración 1 y sus duales se ajustaron)')
"""),
md("""
## 2. Relajación lagrangiana y método del subgradiente

Localización sin capacidades (UFL, cuaderno 1). Relajamos las restricciones de asignación $\\sum_i x_{ij}=1$ con multiplicadores $\\lambda_j$ (libres de signo):

$$L(\\lambda)=\\sum_j \\lambda_j + \\sum_i \\min\\Big(0,\\; f_i + \\sum_j \\min(0,\\, c_{ij}-\\lambda_j)\\Big)$$

El subproblema se resuelve **por inspección** (cada planta por separado). $L(\\lambda)$ es una cota inferior para cualquier $\\lambda$; el subgradiente la maximiza.
"""),
code("""
import random
def instancia_ufl(m=8, n=25, semilla=1):
    rnd = random.Random(semilla)
    P = [(rnd.random(), rnd.random()) for _ in range(m)]; C = [(rnd.random(), rnd.random()) for _ in range(n)]
    f = [round(rnd.uniform(3, 6), 2) for _ in range(m)]
    c = [[round(10 * ((P[i][0]-C[j][0])**2 + (P[i][1]-C[j][1])**2) ** .5, 2) for j in range(n)] for i in range(m)]
    return f, c
f, c = instancia_ufl(); m, n = len(f), len(c[0])

def L(lam):
    val, y, x = sum(lam), [0]*m, [[0]*n for _ in range(m)]
    for i in range(m):
        r = f[i] + sum(min(0, c[i][j] - lam[j]) for j in range(n))
        if r < 0:
            val += r; y[i] = 1
            for j in range(n): x[i][j] = 1 if c[i][j] - lam[j] < 0 else 0
    return val, y, x

def heuristica(y):   # solución factible: abrir las plantas de y (o la mejor si no hay) y asignar cada cliente a la más barata
    A = [i for i in range(m) if y[i]] or [min(range(m), key=lambda i: f[i] + sum(c[i]))]
    return sum(f[i] for i in A) + sum(min(c[i][j] for i in A) for j in range(n))

lam = [min(c[i][j] for i in range(m)) for j in range(n)]
LB, UB, paso = -1e9, 1e9, 2.0
for k in range(300):
    val, y, x = L(lam); LB = max(LB, val); UB = min(UB, heuristica(y))
    g = [1 - sum(x[i][j] for i in range(m)) for j in range(n)]     # subgradiente
    if all(gj == 0 for gj in g): break
    t = paso * (UB - val) / sum(gj * gj for gj in g)
    lam = [lam[j] + t * g[j] for j in range(n)]
    if k % 30 == 29: paso /= 2
    if k % 50 == 0: print(f'it {k:3d}: L(λ) = {val:8.3f} · mejor cota = {LB:8.3f} · mejor factible = {UB:8.3f}')
print(f'\\nTras {k+1} iteraciones: cota lagrangiana {LB:.3f} ≤ óptimo ≤ {UB:.3f} (gap {abs(100*(UB-LB)/UB):.2f} %)')
"""),
md("""
✏️ **Ejercicio 2.** Por el teorema de Geoffrion, como el subproblema tiene la **propiedad de integralidad**, la mejor cota lagrangiana coincide con la relajación lineal de la formulación fuerte. Compruébalo resolviendo esa relajación con GLOP.
"""),
code("""
#@title Solución del ejercicio 2 { display-mode: "form" }
s = pywraplp.Solver.CreateSolver('GLOP')
y = [s.NumVar(0, 1, '') for _ in range(m)]; x = [[s.NumVar(0, 1, '') for _ in range(n)] for _ in range(m)]
for j in range(n): s.Add(sum(x[i][j] for i in range(m)) == 1)
for i in range(m):
    for j in range(n): s.Add(x[i][j] <= y[i])
s.Minimize(sum(f[i]*y[i] for i in range(m)) + sum(c[i][j]*x[i][j] for i in range(m) for j in range(n))); s.Solve()
print(f'z_LP fuerte = {s.Objective().Value():.3f} · mejor cota lagrangiana = {LB:.3f} (el subgradiente se acerca, no siempre la alcanza exactamente)')
"""),
md("""
## 3. Descomposición de Benders

Localización **con** capacidades: las $y_i$ (abrir) son las variables que complican. Fijadas, lo que queda es un problema de transporte (lineal). El maestro decide $y$ y una estimación $\\eta$ del coste de transporte; cada subproblema devuelve un **corte de optimalidad** construido con sus duales.

Para no tratar cortes de factibilidad, exigimos en el maestro capacidad abierta suficiente: $\\sum_i Q_i y_i \\ge \\sum_j d_j$ (así el subproblema siempre es factible).
"""),
code("""
rnd = random.Random(5)
m, n = 5, 12
d = [rnd.randint(5, 20) for _ in range(n)]; Q = [rnd.randint(40, 80) for _ in range(m)]
F = [rnd.randint(80, 160) for _ in range(m)]; c = [[rnd.randint(1, 12) for _ in range(n)] for _ in range(m)]

def subproblema(ybar):
    s = pywraplp.Solver.CreateSolver('GLOP')
    x = [[s.NumVar(0, s.infinity(), '') for _ in range(n)] for _ in range(m)]
    dem = [s.Add(sum(x[i][j] for i in range(m)) >= d[j]) for j in range(n)]          # duales u_j ≥ 0
    cap = [s.Add(sum(x[i][j] for j in range(n)) <= Q[i] * ybar[i]) for i in range(m)]  # duales v_i ≤ 0
    s.Minimize(sum(c[i][j] * x[i][j] for i in range(m) for j in range(n)))
    assert s.Solve() == pywraplp.Solver.OPTIMAL
    return s.Objective().Value(), [r.dual_value() for r in dem], [r.dual_value() for r in cap]

cortes, LB, UB = [], -1e9, 1e9
for it in range(1, 30):
    M = pywraplp.Solver.CreateSolver('SCIP')
    y = [M.BoolVar(f'y{i}') for i in range(m)]; eta = M.NumVar(0, M.infinity(), 'eta')
    M.Add(sum(Q[i] * y[i] for i in range(m)) >= sum(d))
    for (u, v) in cortes:   # η ≥ Σ_j u_j d_j + Σ_i v_i Q_i y_i
        M.Add(eta >= sum(u[j] * d[j] for j in range(n)) + sum(v[i] * Q[i] * y[i] for i in range(m)))
    M.Minimize(sum(F[i] * y[i] for i in range(m)) + eta); M.Solve()
    ybar = [round(yi.solution_value()) for yi in y]; LB = M.Objective().Value()
    zsub, u, v = subproblema(ybar)
    UB = min(UB, sum(F[i] * ybar[i] for i in range(m)) + zsub)
    print(f'it {it:2d}: y = {ybar} · cota inferior = {LB:8.2f} · mejor factible = {UB:8.2f}')
    if UB - LB < 1e-6: break
    cortes.append((u, v))
print(f'\\nBenders termina con óptimo {UB:.2f} tras {it} iteraciones')
"""),
md("""
✏️ **Ejercicio 3.** Comprueba el resultado resolviendo el modelo completo (monolítico) con SCIP. Después, discute: ¿en qué tipo de instancias compensaría Benders frente al modelo completo?
"""),
code("""
#@title Solución del ejercicio 3 { display-mode: "form" }
s = pywraplp.Solver.CreateSolver('SCIP')
y = [s.BoolVar('') for _ in range(m)]; x = [[s.NumVar(0, s.infinity(), '') for _ in range(n)] for _ in range(m)]
for j in range(n): s.Add(sum(x[i][j] for i in range(m)) >= d[j])
for i in range(m): s.Add(sum(x[i][j] for j in range(n)) <= Q[i] * y[i])
s.Minimize(sum(F[i]*y[i] for i in range(m)) + sum(c[i][j]*x[i][j] for i in range(m) for j in range(n))); s.Solve()
print('Monolítico:', round(s.Objective().Value(), 2), '· Benders:', round(UB, 2))
# Compensa cuando, fijadas las y, el subproblema se separa en muchos subproblemas independientes (p. ej. escenarios
# de programación estocástica, Birge y Louveaux) o tiene estructura que un algoritmo especializado resuelve muy rápido.
"""),
md("""
## 🎯 Tu instancia personal y tu entrega

1. En OptimizIA, ve a **Cuadernos → Tu instancia personal** y pulsa **Copiar**.
2. Sustituye la línea `INSTANCIA = None` de la celda siguiente por la que has copiado y ejecuta las dos celdas.
3. Copia la línea `ENTREGA = {…}` que aparece y pégala en OptimizIA: la app recalcula tu instancia con su propio solver y valida tu resultado.

> ✏️ Antes de ejecutar, **predice**: ¿cuántas iteraciones de generación de columnas necesitará tu instancia? ¿Cuántas de Benders?
"""),
code("""
INSTANCIA = None   # ← sustituye esta línea por la que copias de OptimizIA
"""),
code("""
import json
def cg_corte(W, w, d):
    pats = [[(W // w[k]) if j == k else 0 for j in range(len(w))] for k in range(len(w))]
    while True:
        s = pywraplp.Solver.CreateSolver('GLOP'); lam = [s.NumVar(0, s.infinity(), '') for _ in pats]
        filas = [s.Add(sum(p[k] * lam[q] for q, p in enumerate(pats)) >= d[k]) for k in range(len(w))]
        s.Minimize(sum(lam)); s.Solve(); pi = [f.dual_value() for f in filas]
        valor, a = mochila_entera(pi, w, W)
        if 1 - valor > -1e-9: return s.Objective().Value(), len(pats) - len(w) + 1
        pats.append(a)
def cfl_completo(I):
    m, n, d, Q, F, c = I['m'], I['n'], I['d'], I['Q'], I['F'], I['c']
    s = pywraplp.Solver.CreateSolver('SCIP'); y = [s.BoolVar('') for _ in range(m)]; x = [[s.NumVar(0, s.infinity(), '') for _ in range(n)] for _ in range(m)]
    for j in range(n): s.Add(sum(x[i][j] for i in range(m)) >= d[j])
    for i in range(m): s.Add(sum(x[i][j] for j in range(n)) <= Q[i] * y[i])
    s.Minimize(sum(F[i]*y[i] for i in range(m)) + sum(c[i][j]*x[i][j] for i in range(m) for j in range(n))); s.Solve()
    return s.Objective().Value()
if INSTANCIA:
    cs, cf = INSTANCIA['corte'], INSTANCIA['cfl']
    z_cs, its = cg_corte(cs['W'], cs['w'], cs['d'])
    print(f'Generación de columnas: z_LP = {z_cs:.3f} en {its} iteraciones')
    res = {'z_lp_corte': z_cs, 'z_cfl': cfl_completo(cf)}
    print('ENTREGA =', json.dumps({'app': 'optimizia', 'cuaderno': 2, 'semilla': INSTANCIA['semilla'], 'res': res}))
    print('✏️ Reto: resuelve también tu CFL con tu propio Benders (sección 3) y comprueba que obtienes el mismo z_cfl.')
else:
    print('Pega primero tu INSTANCIA en la celda anterior.')
"""),
md("""
## Para llevarte
| Estructura del problema | Método natural |
|---|---|
| Muchísimas variables, pocas restricciones (patrones, rutas) | Generación de columnas / Dantzig-Wolfe |
| Unas pocas restricciones «de enlace» complican un problema fácil | Relajación lagrangiana |
| Unas pocas variables «complicantes»; fijadas, el resto es fácil o separable | Benders |
""")]

# ───────────────────────── Cuaderno 3 · Metaheurísticas ─────────────────────────
nb3 = cab(3, '03-metaheuristicas.ipynb', 'Heurísticas y metaheurísticas',
    'RA5 (diseñar y evaluar heurísticas y metaheurísticas para problemas combinatorios). *Este bloque aparece en la descripción de la guía, no en sus objetivos.*',
    'Cuando el problema es demasiado grande para un método exacto, buscamos buenas soluciones rápido. Lo importante: saber **cuánto** te alejas del óptimo (o de una cota).') + [
md("""
## 1. Viajante (TSP): construir y mejorar

Instancia de 40 ciudades al azar. Primero una heurística **constructiva** (vecino más próximo) y luego **búsqueda local 2-opt**: quitar dos aristas $(a,b),(c,e)$ y reconectar $(a,c),(b,e)$ si $\\Delta = d_{ac}+d_{be}-d_{ab}-d_{ce} < 0$.
"""),
code("""
import random, math, time
rnd = random.Random(11); N = 40
P = [(rnd.uniform(0, 100), rnd.uniform(0, 100)) for _ in range(N)]
D = [[round(math.dist(P[i], P[j])) for j in range(N)] for i in range(N)]
long_ = lambda t: sum(D[t[k]][t[(k + 1) % len(t)]] for k in range(len(t)))

def vecino_mas_proximo(inicio=0):
    t, libres = [inicio], set(range(N)) - {inicio}
    while libres:
        sig = min(libres, key=lambda j: D[t[-1]][j]); t.append(sig); libres.remove(sig)
    return t

def dos_opt(t):
    t, mejora = t[:], True
    while mejora:
        mejora = False
        for i in range(N - 1):
            for k in range(i + 2, N if i else N - 1):
                a, b, c, e = t[i], t[i + 1], t[k], t[(k + 1) % N]
                if D[a][c] + D[b][e] - D[a][b] - D[c][e] < 0:
                    t[i + 1:k + 1] = reversed(t[i + 1:k + 1]); mejora = True
    return t

t0 = vecino_mas_proximo(); t1 = dos_opt(t0)
print('Vecino más próximo:', long_(t0), '· tras 2-opt:', long_(t1))
"""),
md("""
## 2. GRASP: construcción aleatorizada + búsqueda local, con multiarranque

En cada paso se elige al azar entre los candidatos de la **lista restringida** (RCL): los que están a menos de $\\alpha$ del mejor. $\\alpha=0$ es voraz puro; $\\alpha=1$, aleatorio puro.
"""),
code("""
def grasp(iters=30, alfa=0.3, semilla=0):
    r = random.Random(semilla); mejor = None
    for _ in range(iters):
        t = [r.randrange(N)]; libres = set(range(N)) - set(t)
        while libres:
            dist = {j: D[t[-1]][j] for j in libres}; lo, hi = min(dist.values()), max(dist.values())
            rcl = [j for j in libres if dist[j] <= lo + alfa * (hi - lo)]
            j = r.choice(rcl); t.append(j); libres.remove(j)
        t = dos_opt(t)
        if mejor is None or long_(t) < long_(mejor): mejor = t
    return mejor
for alfa in (0.0, 0.2, 0.5, 1.0):
    print(f'GRASP α={alfa}: {long_(grasp(alfa=alfa))}')
"""),
md("""
## 3. Metaheurísticas de OR-Tools (enrutamiento)

La librería de *routing* de OR-Tools trae varias metaheurísticas: **búsqueda local guiada** (GLS, penaliza las aristas de los óptimos locales), **búsqueda tabú** y **recocido simulado**. Se les da un límite de tiempo.
"""),
code("""
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

def or_tools_tsp(meta, segundos=3):
    man = pywrapcp.RoutingIndexManager(N, 1, 0); R = pywrapcp.RoutingModel(man)
    cb = R.RegisterTransitCallback(lambda a, b: D[man.IndexToNode(a)][man.IndexToNode(b)])
    R.SetArcCostEvaluatorOfAllVehicles(cb)
    p = pywrapcp.DefaultRoutingSearchParameters()
    p.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    if meta: p.local_search_metaheuristic = getattr(routing_enums_pb2.LocalSearchMetaheuristic, meta); p.time_limit.seconds = segundos
    sol = R.SolveWithParameters(p); return sol.ObjectiveValue()

res = {}
for meta in (None, 'GREEDY_DESCENT', 'GUIDED_LOCAL_SEARCH', 'TABU_SEARCH', 'SIMULATED_ANNEALING'):
    res[meta or 'solo constructiva'] = or_tools_tsp(meta)
    print(f'{meta or "solo constructiva":22s}: {res[meta or "solo constructiva"]}')
"""),
md("""
**Cuidado al comparar.** Con 3 segundos y esta instancia, algunas metaheurísticas pueden no mejorar la solución inicial y un GRASP sencillo puede ganar a todas. Eso no es una conclusión general: depende del límite de tiempo, la instancia y la semilla. Repite con `segundos=10` y otras semillas antes de opinar.
"""),
md("""
## 4. ¿A qué distancia del óptimo estamos? Una cota

Una metaheurística no certifica nada por sí sola. Para saber cuánto te alejas necesitas una **cota inferior**. Aquí usamos el **árbol 1** (*1-tree*): árbol de expansión mínima sobre las ciudades $1..N-1$ más las dos aristas más baratas de la ciudad 0. Todo ciclo hamiltoniano es un 1-árbol, así que su peso mínimo es una cota inferior (débil; Held y Karp la mejoran con multiplicadores lagrangianos: ¡el cuaderno 2 otra vez!).
"""),
code("""
def cota_1_arbol(pen=None):
    pen = pen or [0] * N; Dp = lambda i, j: D[i][j] + pen[i] + pen[j]
    dentro, coste, grado = {1}, 0, [0] * N
    mejor = {j: (Dp(1, j), 1) for j in range(2, N)}
    while mejor:   # Prim sobre 1..N-1
        j = min(mejor, key=lambda k: mejor[k][0]); cj, pj = mejor.pop(j); coste += cj; grado[j] += 1; grado[pj] += 1
        for k in mejor:
            if Dp(j, k) < mejor[k][0]: mejor[k] = (Dp(j, k), j)
    dos = sorted(range(1, N), key=lambda j: Dp(0, j))[:2]
    for j in dos: coste += Dp(0, j); grado[j] += 1
    grado[0] = 2
    return coste - 2 * sum(pen), grado

LB0 = cota_1_arbol()[0]
pen, LB, paso = [0] * N, LB0, 1.0       # Held-Karp: subgradiente sobre las penalizaciones de los nodos
UB = min(min(res.values()), long_(grasp(alfa=0.5)))
for k in range(200):
    val, g = cota_1_arbol(pen); LB = max(LB, val)
    sg = [gi - 2 for gi in g]
    if not any(sg): break
    t = paso * (UB - val) / sum(s * s for s in sg); pen = [pen[i] + t * sg[i] for i in range(N)]
    if k % 40 == 39: paso /= 2
print(f'Cota 1-árbol: {LB0:.1f} · cota Held-Karp: {LB:.1f} · mejor tour: {UB} → gap ≤ {100*(UB-LB)/UB:.1f} %')
"""),
md("""
✏️ **Ejercicio.** Implementa un **recocido simulado** propio con movimientos 2-opt: acepta un empeoramiento $\\Delta>0$ con probabilidad $e^{-\\Delta/T}$ y enfría $T \\leftarrow 0{,}995\\,T$. Compara su resultado con GLS de OR-Tools y con la cota.
"""),
code("""
#@title Solución del ejercicio { display-mode: "form" }
def recocido(T=50.0, frio=0.995, iters=40000, semilla=1):
    r = random.Random(semilla); t = vecino_mas_proximo(); L_ = long_(t); mejor, Lm = t[:], L_
    for _ in range(iters):
        i, k = sorted(r.sample(range(N), 2))
        if k - i < 2 or (i == 0 and k == N - 1): continue
        a, b, c, e = t[i], t[i + 1], t[k], t[(k + 1) % N]
        delta = D[a][c] + D[b][e] - D[a][b] - D[c][e]
        if delta < 0 or r.random() < math.exp(-delta / T):
            t[i + 1:k + 1] = reversed(t[i + 1:k + 1]); L_ += delta
            if L_ < Lm: mejor, Lm = t[:], L_
        T *= frio if T > 1e-3 else 1
    return Lm
print('Recocido propio:', recocido(), '· GLS OR-Tools:', res['GUIDED_LOCAL_SEARCH'], '· cota:', round(LB, 1))
"""),
md("""
## 🎯 Tu instancia personal y tu entrega

1. En OptimizIA, ve a **Cuadernos → Tu instancia personal** y pulsa **Copiar**.
2. Sustituye la línea `INSTANCIA = None` de la celda siguiente por la que has copiado y ejecuta las dos celdas.
3. Copia la línea `ENTREGA = {…}` que aparece y pégala en OptimizIA: la app recalcula tu instancia con su propio solver y valida tu resultado.

> ✏️ Antes de ejecutar, **predice**: ¿a qué distancia de la cota de Held-Karp crees que quedará tu mejor ruta?
"""),
code("""
INSTANCIA = None   # ← sustituye esta línea por la que copias de OptimizIA
"""),
code("""
import json, math
def mejor_ruta(P, segundos=10):
    n = len(P); Dm = [[round(math.dist(P[i], P[j])) for j in range(n)] for i in range(n)]
    man = pywrapcp.RoutingIndexManager(n, 1, 0); R = pywrapcp.RoutingModel(man)
    cb = R.RegisterTransitCallback(lambda a, b: Dm[man.IndexToNode(a)][man.IndexToNode(b)]); R.SetArcCostEvaluatorOfAllVehicles(cb)
    p = pywrapcp.DefaultRoutingSearchParameters(); p.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    p.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH; p.time_limit.seconds = segundos
    sol = R.SolveWithParameters(p); i = R.Start(0); ruta = []
    while not R.IsEnd(i): ruta.append(man.IndexToNode(i)); i = sol.Value(R.NextVar(i))
    return ruta, sum(Dm[ruta[k]][ruta[(k + 1) % n]] for k in range(n))
if INSTANCIA:
    ruta, L = mejor_ruta(INSTANCIA['ciudades'])
    print('Longitud:', L, '· ✏️ mejórala con tu recocido o tu GRASP si puedes')
    print('ENTREGA =', json.dumps({'app': 'optimizia', 'cuaderno': 3, 'semilla': INSTANCIA['semilla'], 'res': {'ruta': ruta, 'longitud': L}}))
else:
    print('Pega primero tu INSTANCIA en la celda anterior.')
"""),
md("""
## 🏆 Torneo de la semana

Toda la clase tiene la misma instancia de 30 ciudades, distinta cada semana. En OptimizIA, ve a **Torneo** y copia la línea `TORNEO = {…}`. Ejecuta y pega la ruta en la app: verá su longitud y su gap frente a la cota de Held-Karp. Vale todo: GLS, tu recocido, GRASP… y más segundos.
"""),
code("""
TORNEO = None   # ← sustituye esta línea por la que copias de OptimizIA (Torneo)
if TORNEO:
    ruta, L = mejor_ruta(TORNEO['ciudades'], segundos=15)
    print('Longitud:', L)
    print('RUTA =', json.dumps({'app': 'optimizia', 'torneo': TORNEO['semana'], 'ruta': ruta}))
"""),
md("""
## Para llevarte
- Constructiva → búsqueda local → metaheurística (escapar de óptimos locales: tabú, recocido, GLS, GRASP multiarranque).
- Compara siempre con la misma instancia, el mismo tiempo y varias semillas.
- Sin una cota (relajación, 1-árbol, Held-Karp) no sabes cuánto te queda por mejorar.
- Bibliografía complementaria de la guía: Martí y Reinelt, *The Linear Ordering Problem* (heurísticas y metaheurísticas en un problema concreto).
""")]

for nombre, celdas in (('01-reforzamiento.ipynb', nb1), ('02-descomposicion.ipynb', nb2), ('03-metaheuristicas.ipynb', nb3)):
    nb = nbf.v4.new_notebook(); nb.cells = celdas
    nb.metadata = {'colab': {'provenance': []}, 'kernelspec': {'name': 'python3', 'display_name': 'Python 3'}, 'language_info': {'name': 'python'}}
    nbf.write(nb, OUT / nombre); print('escrito', OUT / nombre)
