// =====================================================================
// Liguify Academias — Capa de conexión y sincronización con Supabase
// - Auth (email + password) y onboarding (RPC crear_academia)
// - loadAll(): hidrata el objeto DB de la app desde el esquema `academias`
// - Sync: motor de sincronización por diferencias — cada ~2.5s compara el
//   DB en memoria contra el último snapshot y hace upsert/delete de lo
//   que cambió. Así la app no necesita llamadas explícitas por mutación.
// Modo demo: agrega ?demo=1 a la URL para usar los datos mock sin backend.
// =====================================================================
window.AcademiasDB = (() => {
  const cfg = window.SUPABASE_CONFIG || {};
  const demo = new URLSearchParams(location.search).has('demo');
  const on = !demo && !!(window.supabase && cfg.url && !String(cfg.url).includes('PEGAR'));
  if (!on) return { on: false };

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
    db: { schema: cfg.schema || 'academias' },
  });

  const N = (v) => (v === null || v === undefined ? v : +v);          // numeric -> number
  const pick = (obj, cols) => { const r = {}; cols.forEach((c) => { r[c] = obj[c] === undefined ? null : obj[c]; }); return r; };

  // ---------- Conversores por tabla: fila app <-> fila SQL ----------
  // key: nombre de la colección en DB (app) · table: tabla SQL
  let ACADEMIA_ID = null;
  const T = {
    sedes: {
      table: 'sedes',
      toRow: (s) => ({ ...pick(s, ['id', 'nombre_sede', 'ciudad', 'pais', 'codigo_postal', 'telefono_coordinador', 'google_maps_url', 'cabecera_url']),
        direccion_linea1: s.direccion1 ?? null, direccion_linea2: s.direccion2 ?? null,
        activo: s.activo !== false, academia_id: ACADEMIA_ID }),
      fromRow: (r) => ({ ...r, direccion1: r.direccion_linea1, direccion2: r.direccion_linea2 }),
    },
    staff: {
      table: 'staff',
      toRow: (s) => ({ ...pick(s, ['id', 'sede_id', 'dni', 'rol', 'modalidad_pago']),
        nombres: s.nombre ?? '', apellidos: s.apellido ?? '',
        sueldo_fijo: N(s.sueldo_fijo), tarifa_hora: N(s.tarifa_hora),
        activo: s.activo !== false, academia_id: ACADEMIA_ID }),
      fromRow: (r) => ({ ...r, nombre: r.nombres, apellido: r.apellidos, sueldo_fijo: N(r.sueldo_fijo), tarifa_hora: N(r.tarifa_hora) }),
    },
    tracks: {
      table: 'tracks',
      toRow: (t) => ({ ...pick(t, ['id', 'sede_id', 'linea_negocio', 'nombre_track', 'dias_horario', 'horarios', 'coach_id']),
        capacidad_maxima: N(t.capacidad_maxima) || 0, mensualidad_sugerida: N(t.mensualidad_sugerida) || 0,
        clases_mensuales: N(t.clases_mensuales) || 8, costo_mensual_cancha: N(t.costo_mensual_cancha) || 0,
        costo_mensual_profesores: N(t.costo_mensual_profesores) || 0, activo: t.activo !== false }),
      fromRow: (r) => ({ ...r, capacidad_maxima: N(r.capacidad_maxima), mensualidad_sugerida: N(r.mensualidad_sugerida),
        clases_mensuales: N(r.clases_mensuales), costo_mensual_cancha: N(r.costo_mensual_cancha),
        costo_mensual_profesores: N(r.costo_mensual_profesores) }),
    },
    tutores: {
      table: 'tutores',
      toRow: (t) => ({ ...pick(t, ['id', 'dni_tutor', 'telefono_celular', 'email_tutor']),
        perfil_reclamado: !!t.perfil_reclamado, academia_id: ACADEMIA_ID }),
      fromRow: (r) => r,
    },
    jugadores: {
      table: 'jugadores',
      toRow: (j) => ({ ...pick(j, ['id', 'tutor_id', 'sede_id', 'nombre', 'apellido', 'sexo', 'fecha_nacimiento', 'fecha_registro',
        'foto_url', 'tipo_documento', 'num_documento', 'telefono', 'talla_camiseta', 'talla_short', 'nombre_camiseta',
        'posicion_juego', 'pierna_habil', 'tipo_sangre', 'notas_medicas', 'historial_lesiones', 'alergias',
        'otras_actividades', 'estado_alumno', 'atributos']),
        numero_camiseta: N(j.numero_camiseta),
        categoria_inmutable: j.categoria_inmutable || new Date(j.fecha_nacimiento + 'T00:00:00').getFullYear() }),
      fromRow: (r) => ({ ...r, numero_camiseta: N(r.numero_camiseta) }),
    },
    inscripciones: {
      table: 'inscripciones',
      toRow: (i) => ({ ...pick(i, ['id', 'jugador_id', 'track_id', 'fecha_inscripcion', 'ultima_fecha_corte', 'ciclo_dia']),
        costo_mensual_personalizado: N(i.costo_mensual_personalizado), activo: i.activo !== false }),
      fromRow: (r) => ({ ...r, costo_mensual_personalizado: N(r.costo_mensual_personalizado) }),
    },
    cargos: {
      table: 'cargos',
      toRow: (c) => ({ ...pick(c, ['id', 'tutor_id', 'jugador_id', 'inscripcion_id', 'tipo', 'origen', 'proceso_id',
        'concepto', 'descripcion', 'periodo', 'ciclo_inicio', 'ciclo_fin', 'fecha_vencimiento', 'promo', 'estado']),
        ciclo_dia: N(c.ciclo_dia), gratis: !!c.gratis, monto: N(c.monto) || 0, pagado_monto: N(c.pagado_monto) || 0 }),
      fromRow: (r) => ({ ...r, monto: N(r.monto), pagado_monto: N(r.pagado_monto), ciclo_dia: N(r.ciclo_dia) }),
    },
    pagos: {
      table: 'pagos',
      toRow: (p) => ({ ...pick(p, ['id', 'tutor_id', 'jugador_id', 'sede_id', 'fecha', 'medio', 'num_operacion',
        'voucher_url', 'estado', 'fecha_aprobacion', 'fecha_rechazo']),
        monto: N(p.total) || 0,
        _detalle: (p.detalle || []).map((d) => ({ cargo_id: d.cargo_id, concepto: d.concepto ?? null, cat: d.cat ?? null, tipo: d.tipo ?? null, monto: N(d.monto) || 0 })) }),
      fromRow: (r) => ({ ...r, total: N(r.monto), detalle: [] }),
    },
    mediosPago: {
      table: 'medios_pago',
      toRow: (m) => ({ ...pick(m, ['id', 'nombre']), activo: m.activo !== false, academia_id: ACADEMIA_ID }),
      fromRow: (r) => r,
    },
    ciclosPago: {
      table: 'ciclos_pago',
      toRow: (c) => ({ ...pick(c, ['id']), dia: N(c.dia), dia_venc: N(c.dia_venc), es_default: !!c.es_default,
        activo: c.activo !== false, academia_id: ACADEMIA_ID }),
      fromRow: (r) => ({ ...r, dia: N(r.dia), dia_venc: N(r.dia_venc) }),
    },
    promociones: {
      table: 'promociones',
      toRow: (p) => ({ ...pick(p, ['id', 'nombre']), meses_total: N(p.meses_total), meses_pagados: N(p.meses_pagados),
        activo: p.activo !== false, academia_id: ACADEMIA_ID }),
      fromRow: (r) => ({ ...r, meses_total: N(r.meses_total), meses_pagados: N(r.meses_pagados) }),
    },
    conceptosCNR: {
      table: 'conceptos_cnr',
      toRow: (c) => ({ ...pick(c, ['id', 'nombre']), precio: N(c.precio) || 0, maneja_stock: !!c.maneja_stock,
        es_torneo: !!c.es_torneo, activo: c.activo !== false, academia_id: ACADEMIA_ID }),
      fromRow: (r) => ({ ...r, precio: N(r.precio) }),
    },
    procesosCR: {
      table: 'procesos_facturacion',
      toRow: (p) => ({ ...pick(p, ['id', 'sede_id', 'corte', 'vencimiento', 'fecha', 'cargo_ids']),
        ciclo_dia: N(p.ciclo_dia) || 0, total_monto: N(p.total) || 0,
        total_crs: (p.cargo_ids || []).length, academia_id: ACADEMIA_ID }),
      fromRow: (r) => ({ ...r, total: N(r.total_monto), ciclo_dia: N(r.ciclo_dia) }),
    },
  };

  // ---------- Autenticación ----------
  const auth = {
    async getSession() { const { data } = await sb.auth.getSession(); return data.session || null; },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error; return data.session;
    },
    async signUp(email, password) {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw error; return data;  // data.session puede ser null si exige confirmar email
    },
    async signOut() { await sb.auth.signOut(); },
    async signInGoogle() {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: location.origin + location.pathname },
      });
      if (error) throw error;
    },
  };

  async function crearAcademia(nombre, sede) {
    const { data, error } = await sb.rpc('crear_academia', { p_nombre: nombre, p_sede: sede || 'Principal' });
    if (error) throw error; return data;
  }

  // ---------- Usuarios e invitaciones (módulo de seguridad) ----------
  const usuarios = {
    async aceptarInvitacion() {
      const { data, error } = await sb.rpc('aceptar_invitacion');
      if (error) throw error; return data;  // academia_id o null
    },
    async invitar(email, rol, sedeId) {
      const { data, error } = await sb.rpc('invitar_usuario', { p_email: email, p_rol: rol, p_sede: sedeId || null });
      if (error) throw error; return data;
    },
    async revocar(id) {
      const { error } = await sb.rpc('revocar_invitacion', { p_id: id });
      if (error) throw error;
    },
    async cambiarRol(userId, rol, sedeId) {
      const { error } = await sb.rpc('cambiar_rol_usuario', { p_user: userId, p_rol: rol, p_sede: sedeId || null });
      if (error) throw error;
    },
    async quitar(userId) {
      const { error } = await sb.rpc('quitar_usuario', { p_user: userId });
      if (error) throw error;
    },
    async listar() {
      const [pe, inv] = await Promise.all([
        sb.from('perfiles').select('*').order('created_at'),
        sb.from('invitaciones').select('*').order('created_at', { ascending: false }),
      ]);
      if (pe.error) throw pe.error;
      if (inv.error) throw inv.error;
      return { perfiles: pe.data, invitaciones: inv.data };
    },
  };

  // ---------- Carga inicial: Supabase -> forma del DB de la app ----------
  async function loadAll() {
    const { data: sess } = await sb.auth.getSession();
    const userId = sess && sess.session ? sess.session.user.id : null;
    const perfilQ = userId ? await sb.from('perfiles').select('*').eq('user_id', userId).maybeSingle() : { data: null };
    const perfil = perfilQ.data || null;
    const sel = (t) => sb.from(t).select('*');
    const [ac, se, st, tr, ts, tu, ju, ins, ca, pa, pc, mp, ci, pr, cn, pf, asis] = await Promise.all([
      sel('academias'), sel('sedes'), sel('staff'), sel('tracks'), sel('track_staff'), sel('tutores'),
      sel('jugadores'), sel('inscripciones'), sel('cargos'), sel('pagos'), sel('pago_cargo'),
      sel('medios_pago'), sel('ciclos_pago'), sel('promociones'), sel('conceptos_cnr'),
      sel('procesos_facturacion'), sel('asistencias'),
    ]);
    const err = [ac, se, st, tr, ts, tu, ju, ins, ca, pa, pc, mp, ci, pr, cn, pf, asis].find((r) => r.error);
    if (err) throw err.error;
    if (!ac.data.length) return { academia: null, perfil };

    const a = ac.data[0];
    const academia = { ...a, email: a.email_corporativo, ruc: a.ruc_dni };
    ACADEMIA_ID = a.id;

    const pagos = pa.data.map(T.pagos.fromRow);
    pc.data.forEach((d) => {
      const p = pagos.find((x) => x.id === d.pago_id);
      if (p) p.detalle.push({ cargo_id: d.cargo_id, concepto: d.concepto, cat: d.cat, tipo: d.tipo, monto: N(d.monto) });
    });
    const trackStaff = {};
    ts.data.forEach((r) => { (trackStaff[r.track_id] = trackStaff[r.track_id] || []).push(r.staff_id); });

    return {
      academia,
      perfil,
      sedes: se.data.map(T.sedes.fromRow),
      staff: st.data.map(T.staff.fromRow),
      tracks: tr.data.map(T.tracks.fromRow),
      trackStaff,
      tutores: tu.data.map(T.tutores.fromRow),
      jugadores: ju.data.map(T.jugadores.fromRow),
      inscripciones: ins.data.map(T.inscripciones.fromRow),
      cargos: ca.data.map(T.cargos.fromRow),
      pagos,
      mediosPago: mp.data.map(T.mediosPago.fromRow),
      ciclosPago: ci.data.map(T.ciclosPago.fromRow),
      promociones: pr.data.map(T.promociones.fromRow),
      conceptosCNR: cn.data.map(T.conceptosCNR.fromRow),
      procesosCR: pf.data.map(T.procesosCR.fromRow),
      asistencias: asis.data.map((r) => ({ track_id: r.track_id, jugador_id: r.jugador_id, fecha: r.fecha, estado: r.estado })),
    };
  }

  // ---------- Motor de sincronización por diferencias ----------
  const sync = {
    db: null, baseline: {}, timer: null, busy: false, status: 'ok', lastError: null,
    _cb: null, _skipDel: new Set(),
    onStatus(cb) { this._cb = cb; },
    _set(status, err) { this.status = status; this.lastError = err || null; if (this._cb) this._cb(status, err); },

    start(db) {
      this.db = db;
      this.baseline = this._snapshot();
      this.timer = setInterval(() => this.tick(), 2500);
      window.addEventListener('beforeunload', () => { /* mejor esfuerzo */ this.tick(); });
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.tick(); });
    },

    _snapshot() {
      const snap = {};
      Object.keys(T).forEach((key) => {
        const rows = this.db[key] || [];
        const m = {};
        rows.forEach((r) => { if (r && r.id) m[r.id] = JSON.stringify(T[key].toRow(r)); });
        snap[key] = m;
      });
      snap._academia = JSON.stringify(this._academiaRow());
      snap._trackStaff = JSON.stringify(this._tsRows());
      snap._asistencias = {};
      (this.db.asistencias || []).forEach((a) => { snap._asistencias[`${a.track_id}|${a.jugador_id}|${a.fecha}`] = a.estado; });
      return snap;
    },
    _academiaRow() {
      const a = this.db.academia || {};
      return { nombre_academia: a.nombre_academia, slug_url: a.slug_url, email_corporativo: a.email ?? null,
        telefono: a.telefono ?? null, direccion1: a.direccion1 ?? null, direccion2: a.direccion2 ?? null,
        ciudad: a.ciudad ?? null, pais: a.pais ?? null, codigo_postal: a.codigo_postal ?? null,
        ruc_dni: a.ruc ?? null, anio_fundacion: parseInt(a.anio_fundacion, 10) || null, mision: a.mision ?? null,
        whatsapp: a.whatsapp ?? null, instagram: a.instagram ?? null, facebook: a.facebook ?? null,
        tiktok: a.tiktok ?? null, youtube: a.youtube ?? null, twitter: a.twitter ?? null,
        google_maps_url: a.google_maps_url ?? null, logo_url: a.logo_url ?? null,
        color_primario: a.color_primario ?? null, color_secundario: a.color_secundario ?? null };
    },
    _tsRows() {
      const out = [];
      Object.entries(this.db.trackStaff || {}).forEach(([tid, ids]) => (ids || []).forEach((sid) => out.push(`${tid}|${sid}`)));
      return out.sort();
    },

    async tick() {
      if (this.busy || !this.db) return;
      this.busy = true;
      try {
        let wrote = false;
        for (const key of Object.keys(T)) wrote = (await this._syncTable(key)) || wrote;
        wrote = (await this._syncAcademia()) || wrote;
        wrote = (await this._syncTrackStaff()) || wrote;
        wrote = (await this._syncAsistencias()) || wrote;
        if (wrote || this.status !== 'ok') this._set('ok');
      } catch (e) {
        console.error('[sync]', e);
        this._set('error', e);
      } finally { this.busy = false; }
    },

    async _syncTable(key) {
      const { table, toRow } = T[key];
      const base = this.baseline[key] || {};
      const rows = this.db[key] || [];
      const current = {};
      rows.forEach((r) => { if (r && r.id) current[r.id] = toRow(r); });

      const upserts = Object.keys(current).filter((id) => base[id] !== JSON.stringify(current[id]));
      const deletes = Object.keys(base).filter((id) => !current[id] && !this._skipDel.has(id));
      if (!upserts.length && !deletes.length) return false;
      this._set('saving');

      if (upserts.length) {
        const payload = upserts.map((id) => { const r = { ...current[id] }; delete r._detalle; return r; });
        const { error } = await sb.from(table).upsert(payload);
        if (error) throw error;
        // detalle de pagos -> pago_cargo (reemplazo completo por pago)
        if (key === 'pagos') {
          for (const id of upserts) {
            const det = current[id]._detalle || [];
            const del = await sb.from('pago_cargo').delete().eq('pago_id', id);
            if (del.error) throw del.error;
            if (det.length) {
              const ins = await sb.from('pago_cargo').insert(det.map((d) => ({ ...d, pago_id: id })));
              if (ins.error) throw ins.error;
            }
          }
        }
        upserts.forEach((id) => { this.baseline[key][id] = JSON.stringify(current[id]); });
      }
      if (deletes.length) {
        const { error } = await sb.from(table).delete().in('id', deletes);
        if (error) { deletes.forEach((id) => this._skipDel.add(id)); throw error; }
        deletes.forEach((id) => { delete this.baseline[key][id]; });
      }
      return true;
    },

    async _syncAcademia() {
      const row = this._academiaRow();
      const s = JSON.stringify(row);
      if (s === this.baseline._academia) return false;
      this._set('saving');
      const { error } = await sb.from('academias').update(row).eq('id', ACADEMIA_ID);
      if (error) throw error;
      this.baseline._academia = s;
      return true;
    },

    async _syncTrackStaff() {
      const now = this._tsRows();
      const s = JSON.stringify(now);
      if (s === this.baseline._trackStaff) return false;
      this._set('saving');
      const before = JSON.parse(this.baseline._trackStaff || '[]');
      const add = now.filter((x) => !before.includes(x)).map((x) => { const [track_id, staff_id] = x.split('|'); return { track_id, staff_id }; });
      const del = before.filter((x) => !now.includes(x));
      if (add.length) { const { error } = await sb.from('track_staff').upsert(add); if (error) throw error; }
      for (const x of del) {
        const [track_id, staff_id] = x.split('|');
        const { error } = await sb.from('track_staff').delete().eq('track_id', track_id).eq('staff_id', staff_id);
        if (error) throw error;
      }
      this.baseline._trackStaff = s;
      return true;
    },

    async _syncAsistencias() {
      const base = this.baseline._asistencias || {};
      const current = {};
      (this.db.asistencias || []).forEach((a) => { current[`${a.track_id}|${a.jugador_id}|${a.fecha}`] = a.estado; });
      const upserts = Object.keys(current).filter((k) => base[k] !== current[k]);
      const deletes = Object.keys(base).filter((k) => current[k] === undefined);
      if (!upserts.length && !deletes.length) return false;
      this._set('saving');
      if (upserts.length) {
        const payload = upserts.map((k) => { const [track_id, jugador_id, fecha] = k.split('|'); return { track_id, jugador_id, fecha, estado: current[k] }; });
        const { error } = await sb.from('asistencias').upsert(payload, { onConflict: 'track_id,jugador_id,fecha' });
        if (error) throw error;
        upserts.forEach((k) => { base[k] = current[k]; });
      }
      for (const k of deletes) {
        const [track_id, jugador_id, fecha] = k.split('|');
        const { error } = await sb.from('asistencias').delete().eq('track_id', track_id).eq('jugador_id', jugador_id).eq('fecha', fecha);
        if (error) throw error;
        delete base[k];
      }
      return true;
    },
  };

  return { on: true, sb, auth, crearAcademia, usuarios, loadAll, sync, get academiaId() { return ACADEMIA_ID; } };
})();
