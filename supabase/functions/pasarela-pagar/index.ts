// ============================================================================
// 💳 pasarela-pagar · Supabase Edge Function (Deno) — Liguify Academias
// Cara PÚBLICA del link de pago (el padre no tiene sesión):
//   accion 'info'   → datos del intento para pintar la página de pago
//                     (alumno, academia, detalle, monto, llave PÚBLICA)
//   accion 'cobrar' → recibe el token de Culqi (tarjeta/Yape ya tokenizados en
//                     el navegador), ejecuta el cargo con la llave SECRETA de
//                     la empresa y, si Culqi confirma, crea el pago APROBADO
//                     y marca los cargos como pagados. Sin pagos parciales.
//
// DESPLIEGUE: Edge Functions → nombre: pasarela-pagar · DESACTIVAR "Verify JWT".
// Seguridad: el token del intento es un secreto de 48 hex; la sk jamás sale.
// ============================================================================

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const hoyLima = () => new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SRK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const srv = async (method: string, path: string, body?: unknown, prefer = 'return=representation') => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Accept-Profile': 'academias',
          'Content-Profile': 'academias', 'Content-Type': 'application/json', Prefer: prefer },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const t = await r.text();
      let b = null; try { b = t ? JSON.parse(t) : null; } catch { /* vacío */ }
      if (!r.ok) throw new Error((b && b.message) || `Error BD ${r.status}`);
      return b;
    };

    const body = await req.json();
    const token = String(body.token || '').trim();
    if (!/^[0-9a-f]{48}$/.test(token)) return json({ error: 'Link de pago inválido' }, 400);
    const [it] = (await srv('GET', `pago_intentos?token=eq.${token}&select=*`)) || [];
    if (!it) return json({ error: 'Link de pago no encontrado' }, 404);

    const [j] = (await srv('GET', `jugadores?id=eq.${it.jugador_id}&select=nombre,apellido,sede_id`)) || [];
    const [aca] = (await srv('GET', `academias?id=eq.${it.academia_id}&select=nombre_academia,logo_url`)) || [];
    const [pas] = (await srv('GET', `pasarelas?academia_id=eq.${it.academia_id}&select=proveedor,pk_llave,sk_llave,activo`)) || [];

    // Revalidar la deuda: si algún cargo ya se pagó por otra vía, el link muere
    const ids = (it.cargos || []).map((d: any) => `"${d.cargo_id}"`).join(',');
    const cargosHoy = ids ? await srv('GET', `cargos?id=in.(${ids})&select=id,monto,pagado_monto`) : [];
    const saldoHoy = (cargosHoy || []).reduce((s: number, c: any) => s + Math.max(0, c.monto - (c.pagado_monto || 0)), 0);
    const vigente = it.estado === 'pendiente' && Math.abs(saldoHoy - (+it.monto)) < 0.01;

    if (body.accion === 'info') {
      return json({
        estado: it.estado === 'pagado' ? 'pagado' : (vigente ? 'pendiente' : 'anulado'),
        alumno: j ? `${j.nombre} ${j.apellido || ''}`.trim() : '',
        academia: (aca && aca.nombre_academia) || '', logo: (aca && aca.logo_url) || null,
        monto: +it.monto, detalle: (it.cargos || []).map((d: any) => ({ concepto: d.concepto, tipo: d.tipo, monto: d.monto })),
        proveedor: (pas && pas.proveedor) || 'culqi',
        pk: (pas && pas.activo && pas.pk_llave) || null,
        charge_id: it.estado === 'pagado' ? it.charge_id : null,
      });
    }

    if (body.accion === 'cobrar') {
      if (it.estado === 'pagado') return json({ ok: true, referencia: it.charge_id });   // idempotente
      if (!vigente) return json({ error: 'Este link ya no está vigente (la deuda cambió o fue pagada por otro medio). Pide uno nuevo a la academia.' }, 400);
      if (!pas || !pas.activo || !pas.sk_llave) return json({ error: 'La pasarela de la academia no está activa' }, 400);
      const culqiToken = String(body.culqi_token || '').trim();
      const email = String(body.email || '').trim() || 'padre@liguify.app';
      if (!culqiToken) return json({ error: 'Falta el token de pago' }, 400);
      // Cobro síncrono en Culqi con la llave SECRETA de la empresa
      const r = await fetch('https://api.culqi.com/v2/charges', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pas.sk_llave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round((+it.monto) * 100), currency_code: 'PEN', email,
          source_id: culqiToken,
          description: `Liguify · ${j ? j.nombre : 'alumno'} · ${(aca && aca.nombre_academia) || ''}`.slice(0, 80),
          metadata: { intento: it.id, jugador_id: it.jugador_id },
        }),
      });
      const ch = await r.json().catch(() => null);
      if (!r.ok || !ch || !ch.id) {
        const msg = (ch && (ch.user_message || ch.merchant_message || ch.message)) || `Culqi ${r.status}`;
        await srv('PATCH', `pago_intentos?id=eq.${it.id}`, { estado: 'pendiente', error: String(msg).slice(0, 300) }, 'return=minimal');
        return json({ error: 'El cobro fue rechazado: ' + msg }, 402);
      }
      // Cobro confirmado → pago APROBADO automático + cargos pagados (sin parciales)
      const pagoId = crypto.randomUUID();
      const ahora = new Date().toISOString();
      await srv('POST', 'pagos', {
        id: pagoId, jugador_id: it.jugador_id, tutor_id: it.tutor_id, sede_id: j ? j.sede_id : null,
        fecha: hoyLima(), medio: 'Pasarela Culqi', num_operacion: ch.id,
        estado: 'aprobado', fecha_aprobacion: ahora, registrado_por: 'pasarela',
        comentario: `Pago online · aprobado automáticamente por Culqi (${ch.id})`,
        monto: +it.monto,
      }, 'return=minimal');
      await srv('POST', 'pago_cargo', (it.cargos || []).map((d: any) => ({
        pago_id: pagoId, cargo_id: d.cargo_id, concepto: d.concepto, cat: d.cat, tipo: d.tipo, monto: d.monto,
      })), 'return=minimal');
      for (const c of cargosHoy || []) {
        await srv('PATCH', `cargos?id=eq.${c.id}`, { pagado_monto: c.monto, estado: 'pagado' }, 'return=minimal');
      }
      await srv('PATCH', `pago_intentos?id=eq.${it.id}`,
        { estado: 'pagado', charge_id: ch.id, pago_id: pagoId, pagado_at: ahora, error: null }, 'return=minimal');
      return json({ ok: true, referencia: ch.id });
    }

    return json({ error: "Acción inválida: usa 'info' o 'cobrar'" }, 400);
  } catch (err) {
    return json({ error: String((err as Error).message || err) }, 500);
  }
});
