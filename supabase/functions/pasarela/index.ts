// ============================================================================
// 💳 pasarela · Supabase Edge Function (Deno) — Liguify Academias
// Operaciones del STAFF sobre la pasarela de pagos de SU empresa:
//   accion 'config' → guarda llaves pk/sk y activa/desactiva (solo rol admin)
//   accion 'estado' → ¿configurada? (nunca devuelve la sk completa)
//   accion 'link'   → genera un link de pago para los cargos de un alumno
//                     (monto EXACTO de los cargos: sin pagos parciales)
//
// DESPLIEGUE: Edge Functions → nombre: pasarela (Verify JWT ACTIVADO).
// Las llaves viven en academias.pasarelas (sin políticas: solo service role).
// ============================================================================

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
    const auth = req.headers.get('Authorization') || '';
    if (!auth) return json({ error: 'Falta la sesión del usuario' }, 401);

    const apiUser = async (path: string) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: { apikey: ANON, Authorization: auth, 'Accept-Profile': 'academias' },
      });
      const b = await r.json().catch(() => null);
      if (!r.ok) throw new Error((b && b.message) || `Error ${r.status}`);
      return b;
    };
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

    // Perfil del usuario (RLS devuelve solo los suyos): academia activa + rol
    const perfiles = await apiUser('perfiles?select=academia_id,rol,activa&order=activa.desc');
    const perfil = Array.isArray(perfiles) && perfiles[0];
    if (!perfil) return json({ error: 'Sin perfil de academia' }, 403);
    const ACA = perfil.academia_id;

    const body = await req.json();

    if (body.accion === 'config') {
      if (perfil.rol !== 'admin') return json({ error: 'Solo el Administrador puede configurar la pasarela' }, 403);
      const pk = String(body.pk || '').trim();
      const sk = String(body.sk || '').trim();
      const activo = !!body.activo;
      const [prev] = (await srv('GET', `pasarelas?academia_id=eq.${ACA}&select=sk_llave`)) || [];
      const fila = { academia_id: ACA, proveedor: 'culqi', pk_llave: pk || null,
        sk_llave: sk || (prev ? prev.sk_llave : null),   // sk vacía = conservar la guardada
        activo, updated_at: new Date().toISOString() };
      await srv('POST', 'pasarelas?on_conflict=academia_id', fila, 'return=minimal,resolution=merge-duplicates');
      return json({ ok: true });
    }

    if (body.accion === 'estado') {
      const [p] = (await srv('GET', `pasarelas?academia_id=eq.${ACA}&select=proveedor,pk_llave,sk_llave,activo`)) || [];
      return json({
        configurada: !!(p && p.pk_llave && p.sk_llave),
        activo: !!(p && p.activo), proveedor: (p && p.proveedor) || 'culqi',
        pk: (p && p.pk_llave) || '', sk_fin: p && p.sk_llave ? String(p.sk_llave).slice(-4) : '',
      });
    }

    if (body.accion === 'link') {
      const { jugador_id, cargo_ids, origen } = body;
      if (!jugador_id || !Array.isArray(cargo_ids) || !cargo_ids.length) return json({ error: 'Faltan jugador_id o cargo_ids' }, 400);
      const [p] = (await srv('GET', `pasarelas?academia_id=eq.${ACA}&select=pk_llave,sk_llave,activo`)) || [];
      if (!p || !p.pk_llave || !p.sk_llave) return json({ error: 'La pasarela no está configurada (Configuración → Empresa)' }, 400);
      if (!p.activo) return json({ error: 'La pasarela está desactivada' }, 400);
      // RLS del usuario: solo ve alumnos/cargos de su academia
      const [j] = await apiUser(`jugadores?id=eq.${jugador_id}&select=id,tutor_id,sede_id,nombre,apellido,estado_alumno`);
      if (!j) return json({ error: 'Alumno no encontrado' }, 404);
      const ids = cargo_ids.map((x: string) => `"${x}"`).join(',');
      const cargos = await apiUser(`cargos?id=in.(${ids})&jugador_id=eq.${jugador_id}&select=id,concepto,descripcion,tipo,monto,pagado_monto,estado`);
      const pend = (cargos || []).filter((c: any) => (c.monto - (c.pagado_monto || 0)) > 0);
      if (!pend.length) return json({ error: 'Los cargos seleccionados ya no tienen saldo pendiente' }, 400);
      const detalle = pend.map((c: any) => ({ cargo_id: c.id,
        concepto: `${c.concepto || ''}${c.descripcion ? ' ' + c.descripcion : ''}`.trim(),
        cat: c.tipo === 'CR' ? 'Mensualidades' : (c.concepto || 'Otros'), tipo: c.tipo,
        monto: Math.round((c.monto - (c.pagado_monto || 0)) * 100) / 100 }));
      const monto = Math.round(detalle.reduce((s: number, d: any) => s + d.monto, 0) * 100) / 100;
      const token = [...crypto.getRandomValues(new Uint8Array(24))].map((b2) => b2.toString(16).padStart(2, '0')).join('');
      const quien = await (async () => {
        try { const u = await (await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: auth } })).json();
          return (u && u.email) ? String(u.email).split('@')[0] : 'staff'; } catch { return 'staff'; }
      })();
      await srv('POST', 'pago_intentos', { academia_id: ACA, jugador_id, tutor_id: j.tutor_id || null,
        token, cargos: detalle, monto, creado_por: quien }, 'return=minimal');
      const base = String(origen || '').replace(/\/$/, '') || 'https://liguify-academias.vercel.app';
      return json({ ok: true, url: `${base}/academias/pagar.html?t=${token}`, monto, alumno: `${j.nombre} ${j.apellido || ''}`.trim() });
    }

    return json({ error: "Acción inválida: usa 'config', 'estado' o 'link'" }, 400);
  } catch (err) {
    return json({ error: String((err as Error).message || err) }, 500);
  }
});
