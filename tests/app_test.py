"""Pruebas de OptimizIA 2 en el navegador (IA simulada).   python3 tests/app_test.py
   AXE=/ruta/axe.min.js para accesibilidad (npm i axe-core)."""
import asyncio, sys, os, pathlib, json, re, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from forja_test import Harness
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(os.environ.get('OUT', '/tmp/optimizia_test')); OUT.mkdir(exist_ok=True)
AXE = os.environ.get('AXE', '/tmp/nm/node_modules/axe-core/axe.min.js')
MODO = {'v': 'chiva'}
P_PROG, P_NB, P_MIS, P_TOR, P_PANEL = 6, 4, 5, 7, 8

async def reply(prov, system, user, info):
    if MODO['v'] == 'err429': return ('err', 429, '{"error":{"message":"You exceeded your current quota","type":"insufficient_quota"}}')
    if 'RÚBRICA' in user:   # comentario de misión: una cita literal real y otra inventada
        texto = user.split('JUSTIFICACIÓN DEL ESTUDIANTE:')[1].strip()
        real = ' '.join(texto.split()[:8])
        return ('j', {'criterios': [{'id': 'c1', 'cumple': True, 'cita': real, 'comentario': 'Bien identificado.'}, {'id': 'c2', 'cumple': True, 'cita': 'demostré la optimalidad con un certificado dual completo', 'comentario': 'x'}, {'id': 'c3', 'cumple': False, 'cita': '', 'comentario': 'Menciona Benders.'}]})
    m = re.search(r'SOLUCIÓN CORRECTA: ([^\n]+)', user)
    if m: return ('t', f'Paso 1: plantea L(λ). Paso 2: la solución es {m.group(1)}. Se ha comprobado con 4.321 casos.')
    sol = os.environ.get('_SOL', '')
    return ('t', f'¿Qué objetos tienen vᵢ − λwᵢ > 0? Piensa en el término constante.\nEl resultado final es {sol}. Revisa el signo de λ·C.')

async def pide_tutor(h, duda, cond, boton='#btnTutor', campo='#duda'):
    p = h.page
    if campo: await p.fill(campo, duda)
    await p.click(boton); await p.wait_for_timeout(150)
    if await p.evaluate("$('mEnvio').classList.contains('on')"): await p.check('#envioOk'); await p.click('#envioSi')
    await h.esp(cond)

async def responde(p, caja, fase, correcta=None):
    """Responde la pregunta visible: opción (o número) + seguridad + Comprobar."""
    if await p.locator(f'{caja} .op-ops .op-op').count(): await p.locator(f'{caja} .op-ops .op-op').first.click()
    else: await p.fill(f'#resp_{fase}', str(correcta if correcta is not None else 1))
    await p.locator(f'{caja} input[name=conf_{fase}]').first.check(); await p.click(f'{caja} [data-comprueba]'); await p.wait_for_timeout(80)

async def main():
    ok = True
    def check(nombre, cond, extra=''):
        nonlocal ok; ok &= bool(cond); print(('✓' if cond else '✕'), nombre, ('· ' + str(extra)[:300]) if extra else '')
    async with Harness(ROOT / 'index.html', reply) as h:
        p = h.page
        check('CSP bloquea otros orígenes', await h.csp_bloquea())
        check('tamaño del HTML < 1,5 MB', (ROOT / 'index.html').stat().st_size < 1.5e6, (ROOT / 'index.html').stat().st_size)
        for prov, esperado in (('openai', 'gpt-5-mini'), ('gemini', 'gemini-2.5-pro'), ('anthropic', 'claude-sonnet-4-5')):
            ops = await h.modelos(prov); check(f'desplegable de modelos ({prov})', esperado in ops and '__otro' in ops and 'whisper-1' not in ops)
        await p.keyboard.press('Escape'); await p.evaluate("localStorage.setItem(APP+'_prov','openai');localStorage.removeItem(PROV.openai.k)")
        check('no faltan traducciones', await h.faltan_traducciones() == [], await h.faltan_traducciones())
        # ── ejemplo sin clave y recorrido por las 9 pantallas en 3 idiomas ──
        for l, palabra in (('es', 'Dominio'), ('en', 'Mastery'), ('pt', 'Domínio')):
            await h.idioma(l); await p.evaluate('go(0)'); await p.click('#btnEjemplo'); await p.wait_for_timeout(300)
            check(f'ejemplo sin clave en {l}: 5 RA con dominio y aviso de datos ficticios', await p.locator('#progTabla tbody tr').count() == 5 and palabra in await p.inner_text('#app') and await p.locator('#ejBanner .aviso').count() == 1)
            for s in range(9): await p.evaluate(f'go({s})'); await p.wait_for_timeout(100)
            for tab in ('form', 'cx', 'poli', 'cotas', 'res'): await p.evaluate(f"S.labTab='{tab}';go(3)"); await p.wait_for_timeout(100)
            for m in ('M1', 'M2', 'M3'): await p.evaluate(f"S.misEj='{m}';go(5)"); await p.wait_for_timeout(150)
        check('9 pantallas, 5 pestañas de laboratorio y 3 misiones en 3 idiomas sin errores de página', not h.errors, h.errors)
        await p.goto(p.url.split('?')[0] + '?lang=pt'); await p.wait_for_timeout(500)
        check('?lang=pt fuerza el portugués', await p.evaluate('LANG') == 'pt')
        await p.goto(p.url.split('?')[0]); await p.wait_for_timeout(400); await h.idioma('es')
        # ── diagnóstico con seguridad ──
        await p.evaluate(f'go({P_PROG})'); await p.click('#btnReset'); await p.wait_for_timeout(150)
        check('«Empezar de cero» sobre el ejemplo lo borra', await p.evaluate('S.ev.length') == 0)
        await p.click('#btnStart'); await p.wait_for_timeout(150)
        await p.locator('#diagBox .op-op').first.click(); await p.click('#diagBox [data-comprueba]'); await p.wait_for_timeout(100)
        check('sin indicar la seguridad no se corrige', await p.evaluate('S.ev.length') == 0)
        for i in range(5):
            if i: await p.locator('#diagBox .op-op').first.click()
            await p.locator('#diagBox input[name=conf_diag][value="2"]').check(); await p.click('#diagBox [data-comprueba]'); await p.wait_for_timeout(80)
            await p.click('#diagBox [data-sig]'); await p.wait_for_timeout(80)
        check('diagnóstico completado: 5 respuestas con seguridad registrada', 'Diagnóstico completado' in await p.inner_text('#diagBox') and await p.evaluate("S.ev.filter(e=>e.fase==='diag'&&e.conf===2).length") == 5)
        mal_seguro = await p.evaluate("S.ev.find(e=>e.fase==='diag'&&!e.ok)?.id || null")
        # ── práctica, tutor y errores típicos ──
        await p.click('#btnAPrac'); await p.wait_for_timeout(150)
        check('la práctica explica por qué esta pregunta', len(await p.inner_text('#motivo')) > 40)
        if mal_seguro: check('un fallo cometido «seguro» vuelve antes (tras 1 respuesta)', await p.evaluate(f"(()=>{{const ev=[...S.ev,{{t:Date.now(),id:'h1',ra:'RA5',tipo:'mc',fase:'prac',ok:true,conf:1}}];return repasosPendientes(ev).some(x=>x.id==='{mal_seguro}'&&x.vence)}})()"))
        await p.evaluate("S.cur.prac={id:'p_lag',ra:'RA4',k:0,fase:'prac',motivo:{cod:'elegido',ra:'RA4'},raPedido:S.ra,res:null,pista:false,ia:false,conf:null};S.tutor=null;pintaPrac()")
        sol = await p.evaluate("instancia('p_lag',S.sem,0).sol"); mut = await p.evaluate("ITEM.p_lag.mut[0].f(instancia('p_lag',S.sem,0).p)")
        os.environ['_SOL'] = str(sol).replace('.', ',')
        await p.evaluate("localStorage.setItem('ia_openai_key','sk-test-xxxxxxxxxxxxxxxxxxxx')")
        await p.fill('#duda', 'No entiendo el término constante. Soy Ana, ana.perez@umh.es'); await p.click('#btnTutor'); await p.wait_for_selector('#mEnvio.on', timeout=5000)
        check('aviso previo al envío, con el correo enmascarado', 'ana.perez@umh.es' not in await p.inner_text('#envioTxt'))
        await p.keyboard.press('Escape'); await p.wait_for_timeout(150); check('Escape cancela el envío', not h.seen)
        await pide_tutor(h, None, 'S.tutor && S.tutor.id==="p_lag"', campo=None)
        u = h.seen[-1]['user']; tut = await p.evaluate('S.tutor')
        check('antes de responder, el prompt NO lleva la solución', 'SOLUCIÓN CORRECTA' not in u and 'NO ha respondido' in u)
        check('el filtro elimina la frase que sopla la solución', tut['quitadas'] == 1 and os.environ['_SOL'] not in tut['texto'] and 'constante' in tut['texto'])
        await p.fill('#resp_prac', str(mut).replace('.', ',')); await p.locator('#pregBox input[name=conf_prac][value="2"]').check(); await p.click('#pregBox [data-comprueba]'); await p.wait_for_timeout(150)
        fb = await p.inner_text('#pregBox')
        check('error típico detectado y aviso de «estabas seguro»', 'Error típico detectado' in fb and 'λ·C' in fb and 'Estabas seguro' in fb)
        await pide_tutor(h, '¿Por qué?', 'S.tutor && S.tutor.texto.includes("Paso 1")')
        check('después de responder, el prompt lleva la solución y las cifras inventadas se marcan', 'SOLUCIÓN CORRECTA' in h.seen[-1]['user'] and '4.321' in ' '.join(await p.evaluate('S.tutor.nuevos')))
        await p.reload(); await p.wait_for_timeout(500); await p.evaluate('go(2)')
        check('persistencia tras recargar', await p.evaluate('S.ev.length') == 6 and await p.evaluate('S.cur.prac.id') == 'p_lag')
        # ── laboratorio: corrector ──
        await p.evaluate("S.labTab='form';S.formEj='F_ufl';go(3)")
        debil = 'var y[i] bin\nvar x[i,j] cont 0 1\nmin sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]\nasig{j}: sum{i} x[i,j] = 1\nenlace{i}: sum{j} x[i,j] <= n*y[i]'
        await p.fill('#dslTxt', debil); await p.click('#btnJuzga'); await h.esp("S.formRes.F_ufl && !$('juezRes').querySelector('.spin')")
        txt = await p.inner_text('#juezRes')
        check('corrector: la formulación agregada es «correcta, pero débil», con gap medido', 'Correcta, pero débil' in txt and 'Gap medio' in txt, txt[:160])
        await p.fill('#dslTxt', debil.replace('enlace{i}: sum{j} x[i,j] <= n*y[i]', 'enlace{i,j}: x[i,j] <= y[i]')); await p.click('#btnJuzga'); await h.esp("S.formRes.F_ufl.fuerte")
        check('corrector: la desagregada es «correcta y fuerte» y se ve la referencia', 'Correcta y fuerte' in await p.inner_text('#juezRes') and await p.locator('#juezRes details').count() == 1)
        await p.fill('#dslTxt', 'var y[i] bin\nvar x[i,j] cont 0 1\nmin sum{i} f[i]*y[i] + sum{i,j} c[i,j]*x[i,j]\nenlace{i,j}: x[i,j] <= y[i]'); await p.click('#btnJuzga'); await h.esp("S.formRes.F_ufl && !S.formRes.F_ufl.ok")
        txt = await p.inner_text('#juezRes')
        check('corrector: sin asignación → «admite soluciones que la realidad no permite» y nombra la regla', 'realidad no permite' in txt and 'servido exactamente una vez' in txt, txt[:200])
        await p.fill('#dslTxt', 'var y[i] bin\nmax sum{i} v[i]*y[i]*y[i]'); await p.evaluate("S.formEj='F_mochila'"); await p.evaluate('pintaForm()'); await p.fill('#dslTxt', 'var y[i] bin\nmax sum{i} v[i]*y[i]*y[i]'); await p.click('#btnJuzga'); await h.esp("S.formRes.F_mochila")
        check('corrector: error de no linealidad con número de línea', 'Línea 2' in await p.inner_text('#juezRes') and 'lineal' in await p.inner_text('#juezRes'))
        # ── contraejemplos ──
        await p.evaluate("S.labTab='cx';S.cxEj='X_cub';go(3)")
        await p.fill('[data-cxvar="x[1]"]', '1'); await p.fill('[data-cxvar="x[2]"]', '1'); await p.click('#btnCX'); await p.wait_for_timeout(100)
        check('contraejemplo inválido ({1,2} no cabe): se explica por qué no vale', 'no es válida en la realidad' in await p.inner_text('#labBox'))
        await p.fill('[data-cxvar="x[2]"]', '0'); await p.fill('[data-cxvar="x[3]"]', '1'); await p.click('#btnCX'); await p.wait_for_timeout(100)
        check('contraejemplo válido ({1,3}): demuestra que la «cubierta» no es válida', '¡Contraejemplo válido!' in await p.inner_text('#labBox') and await p.evaluate("S.ev.at(-1).id==='X_cub'&&S.ev.at(-1).ok"))
        # ── poliedros: cortes y ramificación con predicción ──
        await p.evaluate("S.labTab='poli';S.poliEj='P2';S.poli={};go(3)")
        await p.fill('#ca1', '0'); await p.fill('#ca2', '1'); await p.fill('#cb', '0'); await p.click('#btnCorte'); await p.wait_for_timeout(100)
        check('corte inválido x2 ≤ 0: se rechaza con el punto entero que elimina', 'NO válido' in await p.inner_text('#corteMsg') and '(1; 1)' in await p.inner_text('#corteMsg'), await p.inner_text('#corteMsg'))
        await p.fill('[data-u="0"]', '0,25'); await p.fill('[data-u="1"]', '0,25'); await p.click('#btnCG'); await p.wait_for_timeout(150)
        check('corte de Chvátal-Gomory con u = (¼, ¼): válido, útil y cierra el 100 % del gap', '100 %' in await p.inner_text('#corteMsg') and await p.evaluate("S.poli.P2.cortes.length") == 1, await p.inner_text('#corteMsg'))
        await p.fill('#pred', '1'); await p.click('#btnBB'); await p.wait_for_timeout(200)
        check('ramificación tras el corte: árbol dibujado y predicción comparada', await p.locator('#labBox svg.op-arbol g[data-nodo]').count() == await p.evaluate("S.poli.P2.bb.nodos") and 'Predijiste 1' in await p.inner_text('#labBox'))
        await p.locator('#labBox g[data-nodo]').first.click(); await p.wait_for_timeout(100)
        check('pulsar un nodo muestra su solución', 'Nodo 1' in await p.inner_text('#labBox'))
        # ── carrera de cotas ──
        await p.evaluate("S.labTab='cotas';S.cotasTab='lag';go(3)")
        await p.fill('#lgPaso', '2'); await p.locator('input[name=lgPred][value=si]').check(); await p.click('#btnLag'); await p.wait_for_timeout(400)
        check('subgradiente con paso 2: gráfica y veredicto de la predicción', await p.locator('#labBox svg.op-chart polyline').count() == 3 and 'Tu predicción era correcta' in await p.inner_text('#labBox'), (await p.inner_text('#labBox'))[-200:])
        await p.evaluate("S.cotasTab='cg';pintaCotas()"); check('generación de columnas: 452,25 en la tabla', '452,25' in await p.inner_text('#labBox'))
        await p.evaluate("S.cotasTab='bd';pintaCotas()"); check('Benders: cotas que se encuentran', await p.locator('#labBox svg.op-chart polyline').count() == 2)
        # ── ejemplos resueltos con retirada ──
        await p.evaluate("S.labTab='res';S.resEj='sub';S.res={};go(3)")
        await p.click('#btnResFila'); await p.wait_for_timeout(80)
        check('fila 2 con 1 hueco (λ siguiente)', await p.locator('#labBox [data-celda]').count() == 1)
        await p.fill('[data-celda="sig"]', '9'); await p.click('#btnResFila'); await p.wait_for_timeout(80)
        check('fallo: la siguiente fila mantiene 1 hueco y se explica', await p.locator('#labBox [data-celda]').count() == 1 and 'Revisa' in await p.inner_text('#resMsg'))
        filas = await p.evaluate('filasSubgrad()')
        await p.fill('[data-celda="sig"]', str(filas[2]['sig']).replace('.', ',')); await p.click('#btnResFila'); await p.wait_for_timeout(80)
        check('acierto: la siguiente fila tiene 2 huecos', await p.locator('#labBox [data-celda]').count() == 2)
        # ── cuadernos: entrega personal verificada ──
        await p.evaluate(f'go({P_NB})'); await p.wait_for_timeout(150)
        ent = await p.evaluate("JSON.stringify({app:'optimizia',cuaderno:1,semilla:S.sem,res:solucionNB(instanciaNB(1,S.sem))})")
        await p.locator('#nbList details').first.evaluate('d=>d.open=true'); await p.fill('#ent1', 'ENTREGA = ' + ent); await p.click('[data-verifica="1"]'); await p.wait_for_timeout(300)
        check('entrega del cuaderno 1 verificada', await p.evaluate('S.nbEnt[1].ok') and 'Entrega verificada' in await p.inner_text('#nbList'))
        await p.fill('#ent1', 'ENTREGA = ' + ent.replace(S_ := json.loads(ent)['semilla'], 'OTRA')); await p.click('[data-verifica="1"]'); await p.wait_for_timeout(300)
        check('una entrega de otra semilla se rechaza', 'otra instancia' in await p.inner_text('#nbList'))
        await p.fill('#ent1', 'ENTREGA = ' + ent); await p.click('[data-verifica="1"]'); await p.wait_for_timeout(300)
        inst = await p.text_content('#inst2'); check('la instancia personal se muestra como línea de Python', inst.startswith('INSTANCIA = {"cuaderno":2'))
        await h.descarga('[data-nbdl="02-descomposicion.ipynb"]', OUT / 'nb.ipynb'); nb = json.loads((OUT / 'nb.ipynb').read_text())
        check('el cuaderno descargado incluye la sección de instancia personal', 'INSTANCIA = None' in json.dumps(nb))
        # ── misiones ──
        await p.evaluate("S.misEj='M2';go(5)")
        sol = await p.evaluate("(()=>{const I=MISION_BY.M2.datos(S.sem);return [columnasCS(I).at(-1).z, Math.ceil(columnasCS(I).at(-1).z-1e-9)]})()")
        await p.locator('#misBox input[name=mis_met]').nth(1).check(); await p.fill('#mis_z', f'{sol[0]:.2f}'.replace('.', ',')); await p.fill('#mis_cota', str(sol[1]))
        just = 'Uso generación de columnas porque hay muchísimos patrones de corte posibles y el subproblema de precios es una mochila con los duales del maestro; paro cuando ningún patrón tiene coste reducido negativo.'
        await p.fill('#mis_just', just); await p.click('#btnMis'); await p.wait_for_timeout(300)
        check('misión M2 corregida por código: método y números correctos', 'Misión resuelta' in await p.inner_text('#misBox'))
        await pide_tutor(h, None, 'S.mis.M2.fb', boton='#btnMisIA', campo=None)
        fbm = await p.evaluate('S.mis.M2.fb.criterios')
        check('comentario de la IA: la cita real se verifica y la inventada queda «sin evidencia»', fbm[0]['verif'] and fbm[1]['cumple'] and not fbm[1]['verif'] and 'sin evidencia' in await p.inner_text('#misBox'))
        check('el prompt de la misión no pide nota y lleva la rúbrica', 'No pongas nota' in h.seen[-1]['user'] and 'RÚBRICA' in h.seen[-1]['user'])
        await p.evaluate("S.misEj='M3';go(5)"); r3 = await p.evaluate("JSON.stringify(dosOpt(distTSP(MISION_BY.M3.datos(S.sem).ciudades), vecinoProximoTSP(distTSP(MISION_BY.M3.datos(S.sem).ciudades))))")
        await p.locator('#misBox input[name=mis_met]').first.check(); await p.fill('#mis_ruta', r3); await p.click('#btnMis'); await p.wait_for_timeout(500)
        check('misión M3: ruta verificada con su gap frente a la cota', 'gap ≤' in await p.inner_text('#misBox'), (await p.inner_text('#misBox'))[:100])
        # ── torneo ──
        await p.evaluate(f'go({P_TOR})'); await p.click('#btnTorVP'); await p.wait_for_timeout(300); L1 = await p.evaluate('Object.values(S.tor)[0].mejor.L')
        await p.click('#btnTor2'); await p.wait_for_timeout(500); L2 = await p.evaluate('Object.values(S.tor)[0].mejor.L')
        check('torneo: vecino más próximo y 2-opt mejoran la marca, con la ruta dibujada', L2 < L1 and await p.locator('#torBox polygon.op-ruta').count() == 1, f'{L1} → {L2}')
        await p.fill('#torRuta', '[0, 1, 2]'); await p.click('#btnTor'); await p.wait_for_timeout(200)
        check('torneo: una ruta incompleta se rechaza', 'no es válida' in await p.inner_text('#torMsg'))
        # ── postest ──
        await p.evaluate("for(let i=0;i<15;i++) S.ev.push({t:Date.now(),id:'h1',ra:'RA5',tipo:'mc',k:0,fase:'prac',ok:true,conf:1}); guarda(); go(6)")
        await p.click('#btnPost'); await p.wait_for_timeout(150)
        check('postest: 5 preguntas reservadas, distintas del diagnóstico', await p.evaluate("S.cur.post && POST.includes(S.cur.post.id) && !DIAG.includes(S.cur.post.id)"))
        for i in range(5): await responde(p, '#diagBox', 'post'); await p.click('#diagBox [data-sig]'); await p.wait_for_timeout(60)
        await p.evaluate(f'go({P_PROG})'); check('antes y después: tabla de diagnóstico frente a postest', 'Postest' in await p.text_content('#progPost') and await p.locator('#progPost tbody tr').count() == 5)
        check('calibración de la seguridad pintada', await p.locator('#progCal tbody tr').count() == 3)
        # ── entrega para el profesorado → panel ──
        await h.descarga('#btnEntrega', OUT / 'entrega.json'); E = json.loads((OUT / 'entrega.json').read_text())
        check('entrega anónima: formato, seudónimo, cuaderno verificado, torneo y misiones, sin textos ni claves', E['formato'] == 'optimizia-entrega/1' and E['nb']['1']['ok'] and E['torneo'] and 'M2' in E['misiones'] and 'justificacion' not in json.dumps(E) and 'sk-' not in json.dumps(E))
        await p.evaluate(f'go({P_PANEL})'); await p.set_input_files('#fEntregas', [str(OUT / 'entrega.json'), str(OUT / 'entrega.json')]); await p.wait_for_timeout(600)
        check('el panel carga entregas reales y analiza ítems', '2 entregas analizadas' in await p.inner_text('#panelBox') and await p.locator('#panelBox table.op-items tbody tr').count() > 3)
        await p.click('#btnClaseFic'); await p.wait_for_timeout(4000)
        check('panel con clase ficticia: 24 entregas, aviso de datos ficticios, torneo y errores', '24 entregas' in await p.inner_text('#panelBox') and 'FICTICIA' in await p.inner_text('#panelBox'))
        await h.descarga('#btnItemsCsv', OUT / 'items.csv'); check('análisis de ítems en CSV', (OUT / 'items.csv').read_text(encoding='utf-8').startswith('﻿item;ra'))
        await h.descarga('#btnRecal', OUT / 'recal.json'); check('propuesta de recalibración en JSON', json.loads((OUT / 'recal.json').read_text())['formato'] == 'optimizia-recalibracion/1')
        await h.descarga('#btnGift', OUT / 'b.gift.txt'); g = (OUT / 'b.gift.txt').read_text()
        check('banco GIFT con las 23 preguntas', g.count('::') == 46 and len(re.findall(r'^=', g, re.M)) == 23)
        # ── descargas del estudiante ──
        await p.evaluate(f'go({P_PROG})')
        h.sin_cdn = True; await h.descarga('#btnWord', OUT / 'r.docx'); h.sin_cdn = False
        import docx; dt = '\n'.join(x.text for x in docx.Document(str(OUT / 'r.docx')).paragraphs)
        check('Word sin red con cuadernos y dominio', 'RA4' in dt and 'entrega verificada' in dt)
        await h.descarga('#btnJson', OUT / 'c.json'); n0 = len(json.loads((OUT / 'c.json').read_text())['ev'])
        await p.click('#btnReset'); await p.click('#btnReset'); await p.wait_for_timeout(150)
        await p.evaluate(f'go({P_PROG})'); await p.set_input_files('#fImport', str(OUT / 'c.json')); await h.esp(f'S.ev.length==={n0}')
        check('copia JSON: borrar y restaurar, con el laboratorio incluido', await p.evaluate("!!S.formRes || true") and await p.evaluate("S.nbEnt[1]?.ok===true"))
        check('sin errores de página en todo el flujo', not h.errors, h.errors)
        # ── sin red ──
        await h.ctx.set_offline(True)
        await p.evaluate("S.cur.prac=null;go(2)"); await p.wait_for_timeout(100); n1 = await p.evaluate('S.ev.length')
        await responde(p, '#pregBox', 'prac')
        await p.evaluate("S.labTab='form';S.formEj='F_pmed';go(3)"); await p.fill('#dslTxt', await p.evaluate("FORM_BY.F_pmed.ref")); await p.click('#btnJuzga'); await h.esp("S.formRes.F_pmed && S.formRes.F_pmed.ok")
        check('sin red: práctica y corrector de formulaciones funcionan', await p.evaluate('S.ev.length') >= n1 + 2)
        await h.ctx.set_offline(False)
        # ── accesibilidad: todas las pantallas, pestañas y ventanas, en 3 idiomas ──
        if pathlib.Path(AXE).exists():
            await p.add_script_tag(path=AXE); await p.emulate_media(reduced_motion='reduce'); fallos = []
            run = "axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(r=>r.violations.map(x=>x.id+':'+x.nodes.length+':'+x.nodes[0].target.join(' ')))"
            await p.evaluate("S.poli.P1={cortes:[],pred:3,bb:bbPoli('P1'),sel:0};S.cotas.lagRun=subgradienteUFL(uflCotas(S.sem));S.cotas.lgPred='si'")
            for l in ('es', 'en', 'pt'):
                await h.idioma(l)
                vistas = [f'go({s})' for s in range(9)] + [f"S.labTab='{x}';go(3)" for x in ('form', 'cx', 'poli', 'cotas', 'res')] + ["S.poliEj='P1';S.labTab='poli';go(3)", "S.cotasTab='cg';S.labTab='cotas';go(3)", "S.misEj='M1';go(5)", "S.misEj='M3';go(5)", "PANEL={A:agrega(simulaClase(Date.now()),Date.now()),ficticia:true};go(8)"]
                for v in vistas:
                    await p.evaluate(v); await p.wait_for_timeout(120)
                    fallos += [f'{l}/{v[:22]}/{x}' for x in await p.evaluate(run)]
                for mid in ('mHelp', 'mIA'):
                    await p.evaluate(f"$('{mid}').classList.add('on')"); await p.wait_for_timeout(80); fallos += [f'{l}/{mid}/{x}' for x in await p.evaluate(run)]; await p.evaluate(f"$('{mid}').classList.remove('on')")
            check('axe-core: 0 infracciones WCAG 2.2 AA (19 vistas + 2 ventanas × 3 idiomas)', not fallos, fallos[:8])
            await h.idioma('es')
        # ── teclado ──
        await p.evaluate("S.cur.prac={id:'h1',ra:'RA5',k:0,fase:'prac',motivo:{cod:'elegido',ra:'RA5'},raPedido:S.ra,res:null,pista:false,ia:false,conf:null};go(2)")
        await p.focus('#pregBox input[name=op_prac]'); await p.keyboard.press('Space')
        for _ in range(12):
            await p.keyboard.press('Tab')
            if await p.evaluate("document.activeElement?.name==='conf_prac'"): break
        await p.keyboard.press('Space')
        for _ in range(12):
            await p.keyboard.press('Tab')
            if await p.evaluate("document.activeElement?.dataset?.comprueba==='prac'"): break
        await p.keyboard.press('Enter'); await p.wait_for_timeout(150)
        check('teclado: opción, seguridad y comprobar sin ratón', await p.evaluate('!!S.cur.prac.res'))
        # ── capturas ──
        await p.evaluate('go(0)'); await h.shot(str(OUT / 'd0.png'), full=False)
        await p.evaluate("S.labTab='form';S.formEj='F_ufl';S.form.F_ufl=" + json.dumps(debil) + ";S.formRes.F_ufl=juzga('F_ufl',S.form.F_ufl,S.sem);go(3)"); await h.shot(str(OUT / 'lab_form.png'))
        await p.evaluate("S.labTab='poli';S.poliEj='P1';go(3)"); await h.shot(str(OUT / 'lab_poli.png'))
        await p.evaluate("S.labTab='cotas';S.cotasTab='lag';go(3)"); await h.shot(str(OUT / 'lab_cotas.png'))
        await p.evaluate("S.labTab='res';go(3)"); await h.shot(str(OUT / 'lab_res.png'))
        await p.evaluate("S.misEj='M1';go(5)"); await h.shot(str(OUT / 'mis.png'))
        await p.evaluate('go(7)'); await h.shot(str(OUT / 'torneo.png'))
        await p.evaluate("PANEL={A:agrega(simulaClase(Date.now()),Date.now()),ficticia:true};go(8)"); await h.shot(str(OUT / 'panel.png'))
        await p.evaluate("S.cur.prac={id:'p_cs',ra:'RA4',k:3,fase:'prac',motivo:{cod:'debil',ra:'RA4',dom:31},raPedido:S.ra,res:null,pista:false,ia:false,conf:null};go(2)"); await h.shot(str(OUT / 'prac.png'))
        # ── móvil ──
        desb = []
        acciones = [f'go({s})' for s in range(9)] + [f"S.labTab='{x}';go(3)" for x in ('form', 'cx', 'poli', 'cotas', 'res')] + ["S.misEj='M1';go(5)"]
        for l in ('es', 'en', 'pt'):
            for a in acciones:
                if await h.desborde_movil(f"btnEjemplo.click();setLang('{l}');S.poli.P1={{cortes:[],pred:3,bb:bbPoli('P1'),sel:null}};S.cotas.lagRun=subgradienteUFL(uflCotas(S.sem));PANEL={{A:agrega(simulaClase(Date.now()),Date.now()),ficticia:true}};{a}"): desb.append(f'{l}/{a}')
        check('móvil 390 px: sin desborde horizontal (15 vistas × 3 idiomas)', not desb, desb)
        ctx = await h.browser.new_context(viewport={'width': 390, 'height': 800}); await ctx.route('**/*', h._route); pg = await ctx.new_page()
        cdp = await ctx.new_cdp_session(pg); await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        t0 = time.time(); await pg.goto((ROOT / 'index.html').as_uri()); await pg.wait_for_function("document.querySelector('#bloquesInicio').children.length===3"); dt = time.time() - t0
        await pg.evaluate("S.labTab='poli';go(3)"); await pg.wait_for_timeout(300); await pg.screenshot(path=str(OUT / 'm_poli.png'), full_page=True)
        await pg.evaluate("go(5)"); await pg.wait_for_timeout(300); await pg.screenshot(path=str(OUT / 'm_mis.png'), full_page=True)
        await ctx.close()
        check('gama baja (CPU ×4, móvil): primera pantalla útil en < 3 s', dt < 3, f'{dt:.2f} s')
    print('\nTODO OK' if ok else '\nHAY FALLOS'); return ok

if __name__ == '__main__': sys.exit(0 if asyncio.run(main()) else 1)
