// ============================================================================
// 📧 enviar-evaluacion · Supabase Edge Function (Deno) — Liguify Academias
// Envía al tutor, por email, la evaluación mensual del alumno: atributos con
// su variación vs el mes anterior, peso/talla, observaciones y objetivos.
//
// DESPLIEGUE (una vez): pegar esta función en el panel (Edge Functions →
// Deploy new function → nombre: enviar-evaluacion). Reusa el secreto
// RESEND_API_KEY ya configurado para los avisos de Competencias y el
// dominio verificado liguify.com.
//
// Entrada (POST, con la sesión del usuario): { jugador_id, periodo, prueba_a? }
// La autorización la impone la BD: las lecturas usan el token del usuario
// (RLS), así que solo el staff de la academia del alumno puede enviar.
// ============================================================================

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (t: unknown) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ATRIBUTOS: Array<[string, string]> = [['velocidad', 'Velocidad'], ['potencia', 'Potencia'],
  ['agilidad', 'Agilidad'], ['tecnica', 'Técnica'], ['pase', 'Pase'], ['control', 'Control'], ['decisiones', 'Toma de decisiones']];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const mesLabel = (p: string) => `${MESES[(+p.slice(5, 7) || 1) - 1]} de ${p.slice(0, 4)}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const RESEND = Deno.env.get('RESEND_API_KEY');
    if (!RESEND) return json({ error: 'Falta el secreto RESEND_API_KEY en el proyecto' }, 500);
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const auth = req.headers.get('Authorization') || '';
    if (!auth) return json({ error: 'Falta la sesión del usuario' }, 401);

    const { jugador_id, periodo, prueba_a, radar_url, peso_url, talla_url, leyenda } = await req.json();
    if (!jugador_id || !periodo) return json({ error: 'Faltan jugador_id o periodo' }, 400);
    // Solo se insertan imágenes alojadas en el bucket público del propio proyecto
    const okImg = (u: unknown) => typeof u === 'string' && u.startsWith(`${SUPABASE_URL}/storage/v1/object/public/academias-media/`) ? u : null;
    const imgRadar = okImg(radar_url), imgPeso = okImg(peso_url), imgTalla = okImg(talla_url);

    const api = async (path: string) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: { apikey: ANON, Authorization: auth, 'Accept-Profile': 'academias' },
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error((body && body.message) || `Error ${r.status}`);
      return body;
    };

    // Lecturas con el token del usuario (RLS = solo su academia)
    const [j] = await api(`jugadores?id=eq.${jugador_id}&select=nombre,apellido,fecha_nacimiento,tutor_id,sede_id`);
    if (!j) return json({ error: 'Alumno no encontrado (¿es de tu academia?)' }, 403);
    const [t] = await api(`tutores?id=eq.${j.tutor_id}&select=nombres,email_tutor`);
    const destino = prueba_a || (t && t.email_tutor);
    if (!destino) return json({ error: 'El tutor no tiene email registrado' }, 400);
    const evs = await api(`evaluaciones?jugador_id=eq.${jugador_id}&select=*&order=periodo.desc&limit=12`);
    const ev = evs.find((e: any) => e.periodo === periodo);
    if (!ev) return json({ error: `No hay evaluación guardada de ${mesLabel(periodo)}` }, 400);
    const prev = evs.find((e: any) => e.periodo < periodo) || null;
    const [s] = await api(`sedes?id=eq.${j.sede_id}&select=nombre_sede,academia_id`);
    const [a] = s ? await api(`academias?id=eq.${s.academia_id}&select=nombre_academia`) : [null];
    const academia = (a && a.nombre_academia) || 'Liguify Academias';
    const sede = (s && s.nombre_sede) || '';

    // ---- HTML del informe (barras y tabla: compatible con Gmail/Outlook) ----
    const delta = (v: number | null, p: number | null, dec = 0) => {
      if (v == null || p == null) return '';
      const d = Math.round((v - p) * 10) / 10;
      if (!d) return '<span style="color:#94a3b8">=</span>';
      return d > 0 ? `<span style="color:#0a7d4f;font-weight:bold">▲ +${d.toFixed(dec)}</span>`
                   : `<span style="color:#c11d27;font-weight:bold">▼ ${d.toFixed(dec)}</span>`;
    };
    const filas = ATRIBUTOS.filter(([k]) => (ev as any)[k] != null).map(([k, lbl]) => {
      const v = (ev as any)[k], p = prev ? (prev as any)[k] : null;
      return `<tr>
        <td style="padding:7px 10px;border-bottom:1px solid #eee">${lbl}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #eee">
          <div style="background:#f1f5f9;border-radius:6px;height:12px;width:160px"><div style="background:#d9232e;border-radius:6px;height:12px;width:${Math.min(100, v)}%"></div></div>
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #eee;font-weight:bold;text-align:right">${v}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:right">${delta(v, p)}</td>
      </tr>`;
    }).join('');
    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#171e2e">
      <div style="background:#171e2e;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
        <div style="font-size:12px;letter-spacing:1px;opacity:.75">${esc(academia)}${sede ? ' · ' + esc(sede) : ''}</div>
        <div style="font-size:20px;font-weight:bold;margin-top:2px">📊 Informe de evaluación · ${esc(mesLabel(periodo))}</div>
        <div style="font-size:14px;margin-top:4px">${esc(j.nombre)} ${esc(j.apellido)} · Categoría ${String(j.fecha_nacimiento || '').slice(0, 4)}</div>
      </div>
      <div style="border:1px solid #e9e6e0;border-top:0;padding:18px 22px;border-radius:0 0 12px 12px">
        <p style="margin:0 0 12px">Hola${t && t.nombres ? ' ' + esc(t.nombres.split(' ')[0]) : ''} 👋, compartimos el informe mensual del entrenador${prev ? ` (comparado con ${esc(mesLabel(prev.periodo))})` : ''}:</p>
        ${imgRadar ? `
        <div style="text-align:center;margin:0 0 14px">
          <img src="${imgRadar}" width="280" height="280" alt="Radar de atributos" style="max-width:100%;height:auto"/>
          ${leyenda ? `<div style="font-size:11px;color:#8b93a7;margin-top:2px">${esc(leyenda)}</div>` : ''}
        </div>` : ''}
        <table style="border-collapse:collapse;width:100%;font-size:14px">${filas}</table>
        ${(imgPeso || imgTalla) ? `
        <table style="width:100%;margin-top:14px"><tr>
          ${imgPeso ? `<td style="text-align:center;vertical-align:top"><div style="font-size:12px;font-weight:bold;color:#64748b">⚖ Evolución del peso (kg)</div><img src="${imgPeso}" width="250" alt="Evolución de peso" style="max-width:100%;height:auto"/></td>` : ''}
          ${imgTalla ? `<td style="text-align:center;vertical-align:top"><div style="font-size:12px;font-weight:bold;color:#64748b">📏 Evolución de la talla (cm)</div><img src="${imgTalla}" width="250" alt="Evolución de talla" style="max-width:100%;height:auto"/></td>` : ''}
        </tr></table>` : ''}
        ${(ev.peso != null || ev.talla != null) ? `
        <p style="margin:14px 0 0;font-size:14px">
          ${ev.peso != null ? `⚖ <b>Peso:</b> ${ev.peso} kg ${delta(ev.peso, prev && prev.peso, 1)}` : ''}
          ${ev.talla != null ? ` &nbsp;·&nbsp; 📏 <b>Talla:</b> ${ev.talla} cm ${delta(ev.talla, prev && prev.talla, 1)}` : ''}
        </p>` : ''}
        ${ev.observaciones ? `<p style="margin:14px 0 0;font-size:14px"><b>📝 Observaciones del entrenador:</b><br>${esc(ev.observaciones)}</p>` : ''}
        ${ev.objetivos ? `<p style="margin:12px 0 0;font-size:14px"><b>🎯 Objetivos del siguiente periodo:</b><br>${esc(ev.objetivos)}</p>` : ''}
        <p style="margin:18px 0 0;font-size:12px;color:#8b93a7">Enviado desde Liguify Academias · ${esc(academia)}</p>
      </div>
    </div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${academia} <no-reply@liguify.com>`,
        to: [destino],
        subject: `📊 Evaluación de ${j.nombre} ${j.apellido} · ${mesLabel(periodo)}`,
        html,
      }),
    });
    const rb = await r.json().catch(() => null);
    if (!r.ok) return json({ error: (rb && rb.message) || `Resend ${r.status}` }, 502);
    return json({ ok: true, enviado_a: destino });
  } catch (err) {
    return json({ error: String((err as Error).message || err) }, 500);
  }
});
