/* ── arranque (último fichero del montaje) ── */
(async () => { const p = await cargaEstado(); if (p) S = {...S_INI(), ...p, cur: {diag: null, prac: null, post: null, ...(p.cur || {})}}; asegSemilla(); iniciaUI(); go(0); })();
