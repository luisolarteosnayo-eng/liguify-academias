// =====================================================================
// LIGUIFY ACADEMIAS — Edge Function: envío masivo de cobranza por WhatsApp
// vía Twilio (WhatsApp Business API con plantilla aprobada).
//
// Secretos requeridos (Project Settings → Edge Functions → Secrets):
//   TWILIO_ACCOUNT_SID   → SID de la cuenta Twilio (ACxxxxxxxx…)
//   TWILIO_AUTH_TOKEN    → token de autenticación de Twilio
//   TWILIO_WHATSAPP_FROM → número emisor aprobado, ej: +14155238886 o +51XXXXXXXXX
//   TWILIO_CONTENT_SID   → SID de la plantilla aprobada (HXxxxxxxxx…)
//
// La plantilla (Content Template en Twilio, categoría UTILITY) debe tener
// 4 variables, en este orden:
//   {{1}} nombre del tutor · {{2}} alumno · {{3}} monto S/ · {{4}} sede
// Ejemplo de cuerpo:
//   "Hola {{1}} 👋 Le recordamos que {{2}} tiene un saldo pendiente de
//    S/ {{3}} en {{4}}. Puede pagar por Yape/Plin y enviar su voucher.
//    ¡Gracias!"
//
// Entrada (POST, JWT de usuario autenticado):
//   { "envios": [ { "to": "+51999888777", "vars": {"1":"Rosa","2":"Mateo Quispe","3":"220.00","4":"San Miguel"} }, … ] }
// Salida: { "resultados": [ { "to", "ok", "sid", "error" }, … ] }
// =====================================================================

Deno.serve(async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  };
  const json = (x: unknown, status = 200) =>
    new Response(JSON.stringify(x), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
  const FROM = Deno.env.get('TWILIO_WHATSAPP_FROM');
  const CONTENT = Deno.env.get('TWILIO_CONTENT_SID');
  if (!SID || !TOKEN || !FROM || !CONTENT) {
    return json({ error: 'Faltan secretos TWILIO_* en la configuración de la función' }, 500);
  }

  let envios: Array<{ to: string; vars: Record<string, string> }>;
  try {
    const body = await req.json();
    envios = body.envios;
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }
  if (!Array.isArray(envios) || !envios.length) return json({ error: 'Sin envíos' }, 400);
  if (envios.length > 200) return json({ error: 'Máximo 200 envíos por lote' }, 400);

  const auth = 'Basic ' + btoa(`${SID}:${TOKEN}`);
  const resultados: Array<{ to: string; ok: boolean; sid: string | null; error: string | null }> = [];
  for (const e of envios) {
    try {
      const form = new URLSearchParams({
        From: `whatsapp:${FROM}`,
        To: `whatsapp:${e.to}`,
        ContentSid: CONTENT,
        ContentVariables: JSON.stringify(e.vars || {}),
      });
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      });
      const d = await r.json();
      resultados.push({ to: e.to, ok: r.ok, sid: d.sid ?? null, error: r.ok ? null : (d.message ?? `HTTP ${r.status}`) });
    } catch (err) {
      resultados.push({ to: e.to, ok: false, sid: null, error: String(err) });
    }
  }
  return json({ resultados });
});
