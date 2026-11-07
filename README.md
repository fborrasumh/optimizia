# OptimizIA

Práctica adaptativa y cuadernos de Google OR-Tools para **Técnicas Avanzadas de Optimización (8265)**, del Máster Universitario en Estadística Computacional y Ciencia de Datos para la Toma de Decisiones (Universidad Miguel Hernández de Elche). Es una aplicación web de un solo fichero.

**Usar la app:** https://fborrasumh.github.io/optimizia/

**Idiomas:** español (por defecto), inglés y portugués. Se eligen en la barra superior o con `?lang=en` / `?lang=pt` en la URL. Los cuadernos están en español.

## Qué hace

**Práctica adaptativa**
- Diagnóstico inicial y **postest** con preguntas reservadas, una por resultado de aprendizaje (RA1-RA5), cubriendo los tres bloques: reforzamiento, descomposición y heurísticas/metaheurísticas.
- Banco de 23 preguntas de opción múltiple y 10 plantillas de problemas numéricos con variantes ilimitadas. **La solución la calcula el código** y, si la respuesta coincide con un error típico declarado, la app dice cuál es.
- **Seguridad antes de responder** («Lo sé», «Creo que sí», «Lo adivino»): un error cometido «seguro» vuelve antes al repaso, y en Progreso se ve si la seguridad está calibrada.
- Ruta explicable: un modelo tipo Elo con olvido elige el resultado más flojo, intercala, repasa los fallos y ajusta la dificultad. Siempre se muestra el motivo.

**Laboratorio**, todo con un solver propio que funciona en el navegador y sin red (símplex con duales y ramificación y acotación, contrastado con GLOP y SCIP de OR-Tools en 700 problemas):
- **Corrector de formulaciones**: el estudiante escribe su modelo en un lenguaje de modelado sencillo (`var`, `min`/`max`, `sum{i}`, restricciones con nombre). La app lo resuelve en 8 instancias aleatorias y lo compara con la referencia.
  - Si da el mismo óptimo, es correcta. Si su relajación lineal está más lejos que la de la referencia, es correcta pero **débil**, y se dice cuánto.
  - Si falla, enseña la instancia y qué regla real incumple, o qué restricción rechaza la solución buena.
  - Hay 4 ejercicios: mochila, localización sin y con capacidades, y p-mediana.
- **Contraejemplos**: modelos con un error (big-M demasiado pequeña, igualdad convertida en desigualdad, disyunción mal modelada y una «cubierta» que no lo es). El estudiante construye la solución que lo demuestra y el código la comprueba.
- **Poliedros y árboles**: problemas enteros en 2D con su región lineal, los puntos enteros y la envolvente convexa.
  - Los cortes propuestos por el estudiante se comprueban contra todos los puntos enteros, y se pueden generar cortes de Chvátal-Gomory con multiplicadores.
  - Antes de la ramificación y acotación, el estudiante **predice** cuántos nodos explorará; después ve el árbol y puede pulsar cada nodo.
- **Carrera de cotas**: subgradiente con el paso que elige el estudiante (y su predicción), generación de columnas con la cota de Farley y Benders con sus cotas inferior y superior.
- **Ejemplos resueltos con retirada gradual** (subgradiente y generación de columnas): cada fila tiene más huecos; si se falla, la siguiente mantiene los mismos.

**Cuadernos de Google OR-Tools** (`cuadernos/`), ejecutados de principio a fin con OR-Tools 9.15:
- Tratan reforzamiento, descomposición (columnas, lagrangiana y Benders) y metaheurísticas (2-opt, GRASP, búsqueda local guiada, tabú, recocido y cotas de Held-Karp).
- Cada cuaderno termina con la **instancia personal** del estudiante, generada a partir de su seudónimo. La entrega que imprime se pega en la app, que la recalcula con su solver y la valida; una entrega de otra persona se rechaza. Se ha probado de extremo a extremo con OR-Tools real.

**Misiones**: tres casos abiertos tipo examen, con datos propios para cada estudiante (almacenes, bobinas de papel y ruta de reparto).
- El código corrige el método y los números.
- La justificación la puede comentar la IA con una rúbrica, sin nota. Cada criterio que la IA da por cumplido debe llevar una cita literal del texto del estudiante, y el código la comprueba.

**Torneo semanal**: un viajante de 30 ciudades, igual para toda la clase. La app comprueba la ruta y calcula el gap frente a la cota de Held-Karp.

**Panel del profesorado**, sin servidor: el profesorado carga las entregas anónimas que exporta el alumnado. Muestra:
- dominio por resultado de aprendizaje, y diagnóstico frente a postest;
- **análisis de ítems**: acierto, discriminación, distractores que nadie elige y dificultad propuesta;
- errores típicos de la clase, calibración de la seguridad, cuadernos verificados, misiones y clasificación del torneo.

Exporta el análisis de ítems en CSV y una propuesta de recalibración en JSON. Se puede probar con una **clase ficticia** de 24 estudiantes. También exporta el banco de preguntas a Moodle (GIFT).

## Ciencia del aprendizaje que usa

- Práctica de recuperación: Roediger y Karpicke (2006), [doi:10.1111/j.1467-9280.2006.01693.x](https://doi.org/10.1111/j.1467-9280.2006.01693.x).
- Práctica espaciada: Cepeda y otros (2006), [doi:10.1037/0033-2909.132.3.354](https://doi.org/10.1037/0033-2909.132.3.354).
- Intercalado: Rohrer y Taylor (2007), [doi:10.1007/s11251-007-9015-8](https://doi.org/10.1007/s11251-007-9015-8).
- Retroalimentación: Hattie y Timperley (2007), [doi:10.3102/003465430298487](https://doi.org/10.3102/003465430298487).
- Modelo Elo en sistemas adaptativos: Pelánek (2016), [doi:10.1016/j.compedu.2016.03.017](https://doi.org/10.1016/j.compedu.2016.03.017).

## Cómo se usa la IA

Solo en el tutor y en el comentario de las misiones, y solo si la persona lo pide, con su propia clave de OpenAI, Google Gemini o Anthropic Claude. La clave se guarda solo en el navegador y no hace falta servidor. Todo lo demás (práctica, corrección, ruta, progreso y exportaciones) funciona sin clave y sin red.

## Privacidad

- Las respuestas y el progreso se guardan solo en el navegador (IndexedDB), asociados a un seudónimo aleatorio.
- Al proveedor de IA solo sale, si se usa el tutor, el enunciado de la pregunta y la duda escrita, con correos, DNI y teléfonos enmascarados. Antes del primer envío de cada sesión se ve una muestra de lo que sale.
- La app no tiene servidor ni recoge datos.
- Los cuadernos se ejecutan en Google Colab, con la cuenta de Google de cada persona.

## Límites

- El banco de preguntas es **inicial y está pendiente de revisión por el profesorado**. Las dificultades son estimaciones de partida, no están calibradas con datos.
- El dominio estimado es orientativo: **no es una nota** ni sustituye a la evaluación de la asignatura (según la guía, examen final 50 % y trabajos y actividades 50 %).
- Las instancias de los cuadernos son pequeñas y ficticias, y sus resultados de tiempo dependen de la máquina.
- El solver del navegador está pensado para instancias pequeñas (las de la app). En 4 de 700 problemas enteros generales grandes de prueba llega al límite de nodos, y lo dice en lugar de dar un óptimo falso.
- El pretest y el postest usan una pregunta por resultado: sirven como tendencia del grupo, no como medida individual. El panel no produce por sí solo evidencia publicable: para investigar hace falta la aprobación de la OEP de la UMH, el consentimiento informado y un diseño con grupo de comparación.
- La dificultad propuesta en el panel es orientativa: hay que revisarla antes de cambiar el banco.
- El filtro del tutor elimina las frases con el valor numérico de la solución o con la opción correcta literal. Una paráfrasis muy indirecta podría escaparse.
- No se ha probado con estudiantes reales ni con claves de IA reales (solo con IA simulada).
- Accesibilidad: se ha verificado WCAG 2.2 AA con axe-core en las cinco pantallas y las ventanas, en los tres idiomas, y se ha probado el uso con teclado. No se ha hecho una auditoría manual completa ni se ha probado con lectores de pantalla reales.

## Sobre la Guía Docente

La *Descripción* de la guía anuncia tres bloques (reforzamiento de modelos, descomposición y heurísticas/metaheurísticas). Sin embargo, los *Objetivos* solo tratan la descomposición, y las *Unidades didácticas* («Mathematical Programming» y «Reforzamiento de Modelos de Optimización») no incluyen las heurísticas. La app cubre los tres bloques e indica, en cada resultado de aprendizaje, si consta o no como objetivo en la guía, con su cita literal.

## Adaptarla a otra asignatura

1. Edita `src/curriculum.js`: resultados de aprendizaje con su origen literal, bloques, preguntas y plantillas con su solución y sus errores típicos.
2. Regenera los cuadernos con `tools/gen_nb.py`, o pon los tuyos en `cuadernos/`.
3. Traduce con `tools/i18n_src.py` y monta la app con `python3 build.py`.
4. Prueba con `node tests/test_motor.js`, `node tests/test_lp.js`, `node tests/test_lab.js`, `node tests/test_lab2.js` y `node tests/test_panel.js` (lógica), `python3 tests/test_entregas.py` (cuadernos ↔ app con OR-Tools) y `python3 tests/app_test.py` (navegador).

## Autoría

Roles CRediT **propuestos**: confirmadlos antes de publicar.

| Persona | Afiliación | ORCID | Roles (CRediT) |
|---|---|---|---|
| Fernando Borrás Rocher | Universidad Miguel Hernández de Elche | [0000-0002-5519-4573](https://orcid.org/0000-0002-5519-4573) | Conceptualización, software, validación |
| Mercedes Landete Ruiz | Universidad Miguel Hernández de Elche | [0000-0002-5201-0476](https://orcid.org/0000-0002-5201-0476) | Recursos (asignatura), revisión |
| Juan Francisco Monge Ivars | Universidad Miguel Hernández de Elche | [0000-0003-1224-1867](https://orcid.org/0000-0003-1224-1867) | Recursos (asignatura), revisión |

A partir de la Guía Docente de Técnicas Avanzadas de Optimización (8265), curso 2026-2027, del Máster Universitario en Estadística Computacional y Ciencia de Datos para la Toma de Decisiones (UMH).

## Cómo citar

Borrás Rocher, F., Landete Ruiz, M. y Monge Ivars, J. F. (2026). *OptimizIA* (v1.0.0) [Software]. (DOI en trámite)

## Licencia

MIT. Véase [LICENSE](LICENSE). Si los contenidos pedagógicos (preguntas y cuadernos) se quieren reutilizar por separado, se puede considerar publicarlos además con CC BY 4.0.
