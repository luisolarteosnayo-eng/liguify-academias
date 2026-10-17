// ============================================================================
// 💬 whatsapp-enviar · Supabase Edge Function (Deno) — Liguify Academias
// Envía mensajes por la WhatsApp Cloud API (Meta, SIN Twilio) desde Liguify:
//  · accion 'texto'    → respuesta libre desde la bandeja (requiere ventana de
//                        24h abierta: el cliente escribió hace menos de 24h)
//  · accion 'imagen'   → imagen pegada/adjuntada en la bandeja (misma ventana);
//                        se sube a Meta por /media y una copia queda en Storage
//  · accion 'cobranza' → plantilla aprobada (recordatorio de deuda) a 1 número
//
// DESPLIEGUE: Edge Functions → Deploy new function → nombre: whatsapp-enviar
// (con Verify JWT activado: siempre se llama con la sesión del usuario).
//
// SECRETOS: WHATSAPP_TOKEN · WHATSAPP_PHONE_ID
//   WHATSAPP_TPL_COBRANZA (opcional, default 'cobranza_liguify'; en pruebas
//   con el número de test de Meta usar 'hello_world')
//
// La autorización la impone la BD: la conversación se lee con el token del
// usuario (RLS) — solo el staff de la academia dueña puede responder.
// ============================================================================

const GRAPH = 'https://graph.facebook.com/v21.0';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SRK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TOKEN = Deno.env.get('WHATSAPP_TOKEN');
    const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID');
    if (!TOKEN || !PHONE_ID) return json({ error: 'Faltan los secretos WHATSAPP_TOKEN / WHATSAPP_PHONE_ID' }, 500);
    const auth = req.headers.get('Authorization') || '';
    if (!auth) return json({ error: 'Falta la sesión del usuario' }, 401);

    // Lecturas con el token del usuario (RLS) · escrituras con service role
    const apiUser = async (path: string) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: { apikey: ANON, Authorization: auth, 'Accept-Profile': 'academias' },
      });
      const b = await r.json().catch(() => null);
      if (!r.ok) throw new Error((b && b.message) || `Error ${r.status}`);
      return b;
    };
    const dbWrite = async (method: string, path: string, body: unknown) => {
      await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Profile': 'academias',
          'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(body),
      });
    };
    // Quién envía (para la trazabilidad del mensaje)
    const quien = await (async () => {
      try {
        const u = await (await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: auth } })).json();
        return (u && u.email) ? String(u.email).split('@')[0] : 'staff';
      } catch { return 'staff'; }
    })();

    const body = await req.json();
    const wa = async (payload: unknown) => {
      const r = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', ...payload as object }),
      });
      const rb = await r.json().catch(() => null);
      if (!r.ok) throw new Error((rb && rb.error && rb.error.message) || `Meta ${r.status}`);
      return rb && rb.messages && rb.messages[0] && rb.messages[0].id;
    };

    if (body.accion === 'texto') {
      const { conversacion_id, texto } = body;
      if (!conversacion_id || !(texto || '').trim()) return json({ error: 'Faltan conversacion_id o texto' }, 400);
      // RLS: si el usuario no es de la academia dueña, no la ve
      const [c] = await apiUser(`wsp_conversaciones?id=eq.${conversacion_id}&select=id,academia_id,telefono,ultimo_entrante_at,marcada`);
      if (!c) return json({ error: 'Conversación no encontrada (¿es de tu academia?)' }, 403);
      const abierta = c.ultimo_entrante_at && (Date.now() - new Date(c.ultimo_entrante_at).getTime()) < 24 * 3600 * 1000;
      if (!abierta) return json({ error: 'La ventana de 24h está cerrada: el cliente no escribió en el último día. Usa el recordatorio (plantilla) o espera su mensaje.' }, 400);
      const waId = await wa({ to: c.telefono, type: 'text', text: { body: String(texto).slice(0, 4000) } });
      await dbWrite('POST', 'wsp_mensajes', { conversacion_id: c.id, academia_id: c.academia_id,
        direccion: 'out', tipo: 'texto', cuerpo: texto, wa_id: waId || null, enviado_por: quien, estado: 'sent' });
      // Responder quita el SIN RESPUESTA, pero NUNCA borra una clasificación de
      // cobranza (pago / pagara_cancha / pendiente_pago) puesta por el equipo
      await dbWrite('PATCH', `wsp_conversaciones?id=eq.${c.id}`,
        { ultimo_mensaje: String(texto).slice(0, 120), ultimo_mensaje_at: new Date().toISOString(), no_leidos: 0,
          marcada: c.marcada === 'sin_respuesta' ? null : (c.marcada || null) });
      return json({ ok: true, wa_id: waId });
    }

    if (body.accion === 'imagen') {
      // Imagen pegada/adjuntada en la bandeja (dataURL ya redimensionada en el
      // cliente). Igual que 'texto': requiere la ventana de 24h abierta.
      const { conversacion_id, imagen, texto } = body;
      const data = String(imagen || '');
      if (!conversacion_id || !/^data:image\//.test(data)) return json({ error: 'Faltan conversacion_id o imagen' }, 400);
      const [c] = await apiUser(`wsp_conversaciones?id=eq.${conversacion_id}&select=id,academia_id,telefono,ultimo_entrante_at,marcada`);
      if (!c) return json({ error: 'Conversación no encontrada (¿es de tu academia?)' }, 403);
      const abierta = c.ultimo_entrante_at && (Date.now() - new Date(c.ultimo_entrante_at).getTime()) < 24 * 3600 * 1000;
      if (!abierta) return json({ error: 'La ventana de 24h está cerrada: el cliente no escribió en el último día.' }, 400);
      const mime = data.slice(5, data.indexOf(';')) || 'image/jpeg';
      const bytes = Uint8Array.from(atob(data.split(',')[1] || ''), (ch) => ch.charCodeAt(0));
      if (!bytes.length) return json({ error: 'La imagen llegó vacía' }, 400);
      if (bytes.length > 4.5 * 1024 * 1024) return json({ error: 'La imagen supera el límite de WhatsApp (5 MB)' }, 400);
      // 1) Subir el media a Meta y enviarlo por su id
      const fd = new FormData();
      fd.append('messaging_product', 'whatsapp');
      fd.append('file', new Blob([bytes], { type: mime }), 'imagen.jpg');
      const up = await fetch(`${GRAPH}/${PHONE_ID}/media`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: fd });
      const ub = await up.json().catch(() => null);
      if (!up.ok || !ub || !ub.id) return json({ error: 'Meta rechazó la imagen: ' + ((ub && ub.error && ub.error.message) || up.status) }, 502);
      const cap = String(texto || '').trim();
      const waId = await wa({ to: c.telefono, type: 'image', image: cap ? { id: ub.id, caption: cap.slice(0, 1024) } : { id: ub.id } });
      // 2) Copia al bucket privado para que la bandeja pueda mostrarla
      let mediaPath = null;
      const ruta = `wsp/${c.id}/out-${Date.now()}.jpg`;
      const st = await fetch(`${SUPABASE_URL}/storage/v1/object/academias-vouchers/${ruta}`, {
        method: 'POST',
        headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': mime, 'x-upsert': 'true' },
        body: bytes,
      });
      if (st.ok) mediaPath = `vstore:${ruta}`;
      await dbWrite('POST', 'wsp_mensajes', { conversacion_id: c.id, academia_id: c.academia_id, direccion: 'out',
        tipo: 'imagen', cuerpo: cap || null, media_path: mediaPath, wa_id: waId || null, enviado_por: quien, estado: 'sent' });
      await dbWrite('PATCH', `wsp_conversaciones?id=eq.${c.id}`,
        { ultimo_mensaje: '📷 Imagen', ultimo_mensaje_at: new Date().toISOString(), no_leidos: 0,
          marcada: c.marcada === 'sin_respuesta' ? null : (c.marcada || null) });
      return json({ ok: true, wa_id: waId });
    }

    if (body.accion === 'cobranza') {
      // Plantilla de recordatorio: {tutor} {alumno} {monto} {sede} + teléfono de
      // respuestas de la sede como 5ª variable (y sufijo del botón wa.me)
      const { telefono, variables, plantilla, imagen_url } = body;
      const to = String(telefono || '').replace(/\D/g, '');
      if (!to || !Array.isArray(variables)) return json({ error: 'Faltan telefono o variables' }, 400);
      // El usuario debe poder ver a alguien con ese teléfono (RLS = su academia);
      // compara sobre telefono_norm (solo dígitos: los guardados llevan espacios).
      // El celular puede estar en el TUTOR o en la ficha del ALUMNO (datos migrados).
      const last9 = to.slice(-9);
      let aca = null, tutorId = null, nombreConv = null, jj = null;
      const tuts = await apiUser(`tutores?select=id,academia_id,nombres&telefono_norm=like.*${last9}&limit=1`);
      if (tuts.length) {
        aca = tuts[0].academia_id; tutorId = tuts[0].id; nombreConv = tuts[0].nombres || null;
        [jj] = await apiUser(`jugadores?select=id,sede_id&tutor_id=eq.${tutorId}&limit=1`);
      } else {
        const js = await apiUser(`jugadores?select=id,sede_id,tutor_id,nombre,apellido&telefono_norm=like.*${last9}&limit=1`);
        if (!js.length) return json({ error: 'El teléfono no corresponde a un tutor ni a un alumno de tu academia' }, 403);
        jj = js[0]; tutorId = jj.tutor_id || null;
        nombreConv = [jj.nombre, jj.apellido].filter(Boolean).join(' ') || null;
        const [sd] = await apiUser(`sedes?select=academia_id&id=eq.${jj.sede_id}&limit=1`);
        if (!sd) return json({ error: 'No se pudo resolver la academia del alumno' }, 403);
        aca = sd.academia_id;
      }
      const tpl = plantilla || Deno.env.get('WHATSAPP_TPL_COBRANZA') || 'cobranza_liguify';
      // La app manda 6 variables [tutor, alumno, monto, sede, detalle de cargos,
      // medios]. La plantilla ORIGINAL (cobranza_liguify) tiene 5 (sin detalle):
      // se descarta la 5ª. La v2 (cobranza_liguify_v2) usa las 6 tal cual.
      let vars = (variables as unknown[]).map((v) => String(v));
      if (tpl === 'cobranza_liguify' && vars.length >= 6) vars = [vars[0], vars[1], vars[2], vars[3], vars[5]];
      // Plantilla VIP con CABECERA DE IMAGEN: la URL (pública, configurada en la
      // sede) viaja como componente header en cada envío
      const comps: unknown[] = [];
      if (imagen_url && /^https?:\/\//.test(String(imagen_url))) {
        comps.push({ type: 'header', parameters: [{ type: 'image', image: { link: String(imagen_url) } }] });
      }
      comps.push({ type: 'body', parameters: vars.map((v) => ({ type: 'text', text: v.slice(0, 120) })) });
      const payload = tpl === 'hello_world'
        ? { to, type: 'template', template: { name: 'hello_world', language: { code: 'en_US' } } }   // plantilla de PRUEBAS de Meta
        : { to, type: 'template', template: { name: tpl, language: { code: 'es_PE' },   // las plantillas se aprobaron como Spanish (PER)
            components: comps } };
      const waId = await wa(payload);
      // Texto REAL que recibe el cliente (cuerpo de la plantilla con las
      // variables puestas): así la bandeja muestra lo mismo que su WhatsApp
      const cuerpoReal = tpl === 'hello_world'
        ? '[plantilla de prueba hello_world]'
        : vars.length >= 6
          ? `Hola ${vars[0]} 👋, le recordamos que ${vars[1]} tiene un saldo pendiente de ${vars[2]} en ${vars[3]} por: ${vars[4]}. Puede pagar por: ${vars[5]} y enviar su comprobante respondiendo a este mensaje. ¡Gracias!`
          : `Hola ${vars[0]} 👋, le recordamos que ${vars[1]} tiene un saldo pendiente de ${vars[2]} en ${vars[3]}. Puede pagar por: ${vars[4]} y enviar su comprobante respondiendo a este mensaje. ¡Gracias!`;
      // Registrar también en la bandeja (crea la conversación si no existe)
      let [conv] = await apiUser(`wsp_conversaciones?telefono=eq.${to}&academia_id=eq.${aca}&select=id&limit=1`);
      if (!conv) {
        // La conversación nace vinculada: alumno + sede + nombre (tutor si existe)
        await dbWrite('POST', 'wsp_conversaciones', { academia_id: aca, tutor_id: tutorId, telefono: to,
          jugador_id: jj ? jj.id : null, sede_id: jj ? jj.sede_id : null, nombre: nombreConv });
        [conv] = await apiUser(`wsp_conversaciones?telefono=eq.${to}&academia_id=eq.${aca}&select=id&limit=1`);
      }
      if (conv) {
        await dbWrite('POST', 'wsp_mensajes', { conversacion_id: conv.id, academia_id: aca, direccion: 'out',
          tipo: 'plantilla', cuerpo: cuerpoReal, wa_id: waId || null,
          enviado_por: quien, estado: 'sent' });
        // Recordatorio enviado → la conversación queda en PENDIENTE DE PAGO
        await dbWrite('PATCH', `wsp_conversaciones?id=eq.${conv.id}`,
          { ultimo_mensaje: '🔔 Recordatorio de cobranza', ultimo_mensaje_at: new Date().toISOString(), marcada: 'pendiente_pago' });
      }
      return json({ ok: true, wa_id: waId });
    }

    return json({ error: "Acción inválida: usa 'texto', 'imagen' o 'cobranza'" }, 400);
  } catch (err) {
    return json({ error: String((err as Error).message || err) }, 500);
  }
});
