// ============================================================================
// 💬 whatsapp-entrante · Supabase Edge Function (Deno) — Liguify Academias
// Webhook de la WhatsApp Cloud API (Meta, SIN Twilio): recibe los mensajes que
// los clientes envían al número de la PLATAFORMA, identifica al tutor por su
// teléfono, guarda la conversación y el mensaje (los vouchers/imágenes se
// descargan al bucket privado), actualiza estados de los enviados, y manda un
// auto-reply con el WhatsApp propio de la academia.
//
// DESPLIEGUE: Edge Functions → Deploy new function → nombre: whatsapp-entrante
// ⚠ En Configuración de la función DESACTIVAR "Verify JWT" (Meta llama sin JWT).
//
// SECRETOS:
//   WHATSAPP_TOKEN         token permanente de la app de Meta (system user)
//   WHATSAPP_PHONE_ID      id del número de la plataforma (Cloud API)
//   WHATSAPP_VERIFY_TOKEN  texto libre que pegas igual en el panel de Meta
// (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya existen por defecto.)
//
// En Meta for Developers → WhatsApp → Configuration → Webhook:
//   Callback URL = https://<proyecto>.supabase.co/functions/v1/whatsapp-entrante
//   Verify token = el mismo WHATSAPP_VERIFY_TOKEN · suscribir el campo "messages"
// ============================================================================

const GRAPH = 'https://graph.facebook.com/v21.0';

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SRK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const TOKEN = Deno.env.get('WHATSAPP_TOKEN') || '';
  const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID') || '';

  // --- Verificación del webhook (la hace Meta una sola vez, por GET) ---
  if (req.method === 'GET') {
    const u = new URL(req.url);
    if (u.searchParams.get('hub.mode') === 'subscribe'
      && u.searchParams.get('hub.verify_token') === Deno.env.get('WHATSAPP_VERIFY_TOKEN')) {
      return new Response(u.searchParams.get('hub.challenge') || '', { status: 200 });
    }
    return new Response('forbidden', { status: 403 });
  }
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  // REST con service role (el webhook no tiene usuario; escribe en el esquema academias)
  const db = async (method: string, path: string, body?: unknown, prefer?: string) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: SRK, Authorization: `Bearer ${SRK}`,
        'Accept-Profile': 'academias', 'Content-Profile': 'academias',
        'Content-Type': 'application/json',
        Prefer: prefer || 'return=representation',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const txt = await r.text();
    let out = null; try { out = txt ? JSON.parse(txt) : null; } catch { /* no json */ }
    if (!r.ok) console.error('[db]', method, path, r.status, txt.slice(0, 300));
    return out;
  };

  try {
    const payload = await req.json();
    for (const entry of payload.entry || []) {
      for (const ch of entry.changes || []) {
        const v = ch.value || {};

        // --- Estados de mensajes salientes (sent/delivered/read/failed) ---
        for (const st of v.statuses || []) {
          if (st.id && st.status) {
            await db('PATCH', `wsp_mensajes?wa_id=eq.${encodeURIComponent(st.id)}`,
              { estado: st.status }, 'return=minimal');
          }
        }

        // --- Mensajes entrantes ---
        for (const m of v.messages || []) {
          const telefono = String(m.from || '');          // p.ej. 51987654321
          if (!telefono) continue;
          const nombrePerfil = (v.contacts && v.contacts[0] && v.contacts[0].profile && v.contacts[0].profile.name) || null;

          // Identificar al tutor por los últimos 9 dígitos (celular peruano),
          // sobre el teléfono NORMALIZADO (los guardados llevan espacios)
          const last9 = telefono.slice(-9);
          let tutor = null, jugadorId = null, sedeW = null, sedeId = null;
          const tuts = await db('GET', `tutores?select=id,academia_id,nombres&telefono_norm=like.*${last9}&limit=1`);
          if (Array.isArray(tuts) && tuts[0]) {
            tutor = tuts[0];
            const js = await db('GET', `jugadores?select=id,sede_id&tutor_id=eq.${tutor.id}&limit=1`);
            if (Array.isArray(js) && js[0]) {
              jugadorId = js[0].id; sedeId = js[0].sede_id;
              const sds = await db('GET', `sedes?select=whatsapp_respuestas,nombre_sede&id=eq.${js[0].sede_id}&limit=1`);
              if (Array.isArray(sds) && sds[0]) sedeW = sds[0];
            }
          }
          const academiaId = tutor ? tutor.academia_id : null;

          // Conversación: buscar/crear por teléfono + academia
          const filtroAca = academiaId ? `academia_id=eq.${academiaId}` : 'academia_id=is.null';
          let conv = (await db('GET', `wsp_conversaciones?select=*&telefono=eq.${telefono}&${filtroAca}&limit=1`) || [])[0];
          if (!conv) {
            conv = ((await db('POST', 'wsp_conversaciones', {
              academia_id: academiaId, sede_id: sedeId, tutor_id: tutor ? tutor.id : null,
              jugador_id: jugadorId, telefono, nombre: nombrePerfil,
            })) || [])[0];
          }
          if (!conv) continue;
          // Backfill: conversación creada antes sin vínculo → se completa ahora
          if (tutor && !conv.jugador_id && jugadorId) {
            await db('PATCH', `wsp_conversaciones?id=eq.${conv.id}`,
              { tutor_id: tutor.id, jugador_id: jugadorId, sede_id: sedeId }, 'return=minimal');
            conv.jugador_id = jugadorId;
          }
          const esPrimeroEn20h = !conv.ultimo_entrante_at
            || (Date.now() - new Date(conv.ultimo_entrante_at).getTime()) > 20 * 3600 * 1000;

          // Contenido del mensaje (texto / imagen / documento)
          let tipo = 'texto', cuerpo = null, mediaPath = null;
          if (m.type === 'text') cuerpo = m.text && m.text.body;
          else if (m.type === 'image' || m.type === 'document') {
            tipo = m.type === 'image' ? 'imagen' : 'documento';
            cuerpo = (m[m.type] && m[m.type].caption) || null;
            const mediaId = m[m.type] && m[m.type].id;
            if (mediaId && TOKEN) {
              try {
                // 1) URL temporal del media · 2) descargar · 3) subir al bucket privado
                const meta = await (await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
                const bin = await (await fetch(meta.url, { headers: { Authorization: `Bearer ${TOKEN}` } })).arrayBuffer();
                const ext = (meta.mime_type || '').includes('pdf') ? 'pdf' : (meta.mime_type || '').includes('png') ? 'png' : 'jpg';
                // Nombre saneado: el wamid trae '=' y otros caracteres que Storage rechaza
                const ruta = `wsp/${conv.id}/${Date.now()}-${String(m.id).replace(/[^a-zA-Z0-9]/g, '').slice(-24)}.${ext}`;
                const up = await fetch(`${SUPABASE_URL}/storage/v1/object/academias-vouchers/${ruta}`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${SRK}`, 'Content-Type': meta.mime_type || 'image/jpeg', 'x-upsert': 'true' },
                  body: bin,
                });
                if (up.ok) mediaPath = `vstore:${ruta}`;
                else console.error('[media] upload', up.status, await up.text());
              } catch (e) { console.error('[media]', e); }
            }
          } else cuerpo = `(${m.type})`;   // audio, sticker, ubicación…

          // Guardar el mensaje (dedupe por wa_id) y actualizar la conversación
          await db('POST', `wsp_mensajes?on_conflict=wa_id`, {
            conversacion_id: conv.id, academia_id: academiaId, direccion: 'in',
            tipo, cuerpo, media_path: mediaPath, wa_id: m.id,
          }, 'return=minimal,resolution=ignore-duplicates');
          await db('PATCH', `wsp_conversaciones?id=eq.${conv.id}`, {
            ultimo_mensaje: tipo === 'texto' ? (cuerpo || '').slice(0, 120) : (tipo === 'imagen' ? '📷 Imagen' : '📄 Documento'),
            ultimo_mensaje_at: new Date().toISOString(),
            ultimo_entrante_at: new Date().toISOString(),
            no_leidos: (+conv.no_leidos || 0) + 1,
            nombre: conv.nombre || nombrePerfil,
          }, 'return=minimal');

          // Auto-reply (1 vez por episodio): indica el WhatsApp propio de la academia
          if (esPrimeroEn20h && TOKEN && PHONE_ID && sedeW && sedeW.whatsapp_respuestas) {
            try {
              const texto = `Gracias por tu mensaje 🙌. Este es el canal de avisos de ${sedeW.nombre_sede || 'la academia'}. ` +
                `Tu mensaje fue registrado; para una atención más rápida también puedes escribirnos al WhatsApp de la sede: ${sedeW.whatsapp_respuestas}`;
              const r = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ messaging_product: 'whatsapp', to: telefono, type: 'text', text: { body: texto } }),
              });
              const rb = await r.json().catch(() => null);
              const waOut = rb && rb.messages && rb.messages[0] && rb.messages[0].id;
              await db('POST', 'wsp_mensajes', {
                conversacion_id: conv.id, academia_id: academiaId, direccion: 'out',
                tipo: 'texto', cuerpo: texto, wa_id: waOut || null, enviado_por: 'auto',
                estado: r.ok ? 'sent' : 'failed',
              }, 'return=minimal');
            } catch (e) { console.error('[auto-reply]', e); }
          }
        }
      }
    }
  } catch (e) { console.error('[webhook]', e); }
  // Siempre 200: si Meta recibe errores repetidos, desactiva el webhook
  return new Response('ok', { status: 200 });
});
