// ============================================================================
// 🧾 emitir-comprobante · Supabase Edge Function (Deno) — Liguify Academias
// Emite una BOLETA o FACTURA electrónica vía Nubefact (PSE) para un pago
// aprobado, y devuelve los enlaces al PDF/XML que entrega SUNAT.
//
// DESPLIEGUE: pegar en el panel (Edge Functions → Deploy new function →
// nombre: emitir-comprobante).
//
// SECRETOS (por RUC emisor — Nubefact entrega una RUTA y un TOKEN por RUC):
//   NUBEFACT_RUTA_<RUC>   p.ej. NUBEFACT_RUTA_20123456789 = https://api.nubefact.com/api/v1/xxxx
//   NUBEFACT_TOKEN_<RUC>
//
// Entrada (POST con la sesión del usuario): { pago_id, tipo: 'boleta'|'factura',
// serie, numero }. Las lecturas usan el token del usuario (RLS): solo el staff
// de la academia puede emitir. Los precios YA INCLUYEN IGV (18%): el desglose
// se calcula hacia atrás (valor = total / 1.18).
// ============================================================================

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const r2 = (n: number) => Math.round(n * 100) / 100;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const auth = req.headers.get('Authorization') || '';
    if (!auth) return json({ error: 'Falta la sesión del usuario' }, 401);

    const { pago_id, tipo, serie, numero } = await req.json();
    if (!pago_id || !['boleta', 'factura'].includes(tipo) || !serie || !(+numero > 0)) {
      return json({ error: 'Faltan pago_id, tipo, serie o numero' }, 400);
    }

    const api = async (path: string) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: { apikey: ANON, Authorization: auth, 'Accept-Profile': 'academias' },
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error((body && body.message) || `Error ${r.status}`);
      return body;
    };

    // Lecturas con el token del usuario (RLS = solo su academia)
    const [p] = await api(`pagos?id=eq.${pago_id}&select=id,jugador_id,tutor_id,sede_id,fecha,monto,estado,doc_tipo`);
    if (!p) return json({ error: 'Pago no encontrado (¿es de tu academia?)' }, 403);
    if (p.estado !== 'aprobado') return json({ error: 'El pago no está aprobado' }, 400);
    if (p.doc_tipo) return json({ error: 'El pago ya tiene comprobante emitido' }, 400);
    const [j] = await api(`jugadores?id=eq.${p.jugador_id}&select=nombre,apellido,sede_id`);
    const [t] = await api(`tutores?id=eq.${p.tutor_id}&select=nombres,dni_tutor,ruc,razon_social,email_tutor`);
    const [s] = await api(`sedes?id=eq.${j ? j.sede_id : p.sede_id}&select=nombre_sede,ruc_emisor,razon_social_emisor,direccion_fiscal`);
    if (!s || !s.ruc_emisor) return json({ error: 'La sede no tiene RUC emisor configurado' }, 400);
    const detalle = await api(`pago_cargo?pago_id=eq.${pago_id}&select=concepto,monto`);

    // Credenciales Nubefact del RUC emisor
    const RUTA = Deno.env.get(`NUBEFACT_RUTA_${s.ruc_emisor}`);
    const TOKEN = Deno.env.get(`NUBEFACT_TOKEN_${s.ruc_emisor}`);
    if (!RUTA || !TOKEN) return json({ error: `Faltan los secretos NUBEFACT_RUTA_${s.ruc_emisor} / NUBEFACT_TOKEN_${s.ruc_emisor}` }, 500);

    // Cliente: factura exige RUC; boleta usa DNI o "cliente varios" (doc 0 / -)
    const esFactura = tipo === 'factura';
    if (esFactura && !(t && /^\d{11}$/.test(String(t.ruc || '')))) {
      return json({ error: 'La factura requiere RUC del tutor (11 dígitos)' }, 400);
    }
    const dniOk = t && /^\d{8}$/.test(String(t.dni_tutor || '').trim());
    const cliente = esFactura
      ? { tipo_de_documento: 6, numero: t.ruc, denominacion: t.razon_social }
      : dniOk
        ? { tipo_de_documento: 1, numero: t.dni_tutor, denominacion: t.nombres || `${j.nombre} ${j.apellido}` }
        : { tipo_de_documento: '-', numero: '-', denominacion: 'CLIENTE VARIOS' };

    // Ítems: precio CON IGV incluido → valor unitario = precio / 1.18
    const items = (detalle.length ? detalle : [{ concepto: 'Servicio de academia deportiva', monto: p.monto }])
      .filter((d: any) => +d.monto > 0)
      .map((d: any) => {
        const precio = r2(+d.monto);
        const valor = r2(precio / 1.18);
        return {
          unidad_de_medida: 'ZZ',               // servicio
          descripcion: d.concepto || 'Servicio de academia deportiva',
          cantidad: 1,
          valor_unitario: valor,
          precio_unitario: precio,
          subtotal: valor,
          tipo_de_igv: 1,                       // gravado - operación onerosa
          igv: r2(precio - valor),
          total: precio,
        };
      });
    const total = r2(items.reduce((sm: number, it: any) => sm + it.total, 0));
    const gravada = r2(items.reduce((sm: number, it: any) => sm + it.subtotal, 0));

    const cuerpo = {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: esFactura ? 1 : 2,   // 1 factura · 2 boleta
      serie, numero: +numero,
      sunat_transaction: 1,
      cliente_tipo_de_documento: cliente.tipo_de_documento,
      cliente_numero_de_documento: cliente.numero,
      cliente_denominacion: cliente.denominacion,
      cliente_direccion: '',
      cliente_email: (t && t.email_tutor) || '',
      fecha_de_emision: new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' }).split('/').map((x) => x.padStart(2, '0')).join('-'),
      moneda: 1,                                 // soles
      porcentaje_de_igv: 18.0,
      total_gravada: gravada,
      total_igv: r2(total - gravada),
      total,
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: !!(t && t.email_tutor),
      items,
    };

    const resp = await fetch(RUTA, {
      method: 'POST',
      headers: { Authorization: `Token token="${TOKEN}"`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    const rb = await resp.json().catch(() => null);
    if (!resp.ok || (rb && rb.errors)) {
      return json({ error: (rb && (rb.errors || rb.error)) || `Nubefact ${resp.status}` }, 502);
    }
    return json({
      ok: true, serie, numero: +numero,
      pdf: (rb && rb.enlace_del_pdf) || null,
      xml: (rb && rb.enlace_del_xml) || null,
      cdr: (rb && rb.enlace_del_cdr) || null,
      aceptada_por_sunat: rb && rb.aceptada_por_sunat,
    });
  } catch (err) {
    return json({ error: String((err as Error).message || err) }, 500);
  }
});
