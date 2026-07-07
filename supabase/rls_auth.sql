-- =====================================================================
-- LIGUIFY ACADEMIAS — v2: Alineación con la app + Auth + RLS multi-tenant
-- Ejecutar DESPUÉS de schema.sql, completo, en el SQL Editor (Run).
-- Idempotente: correrlo dos veces no rompe nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Alineación de columnas con la app (campos que la app ya usa)
-- ---------------------------------------------------------------------
alter table academias.academias add column if not exists direccion1 text;
alter table academias.academias add column if not exists direccion2 text;
alter table academias.academias add column if not exists ciudad text;
alter table academias.academias add column if not exists pais text;
alter table academias.academias add column if not exists codigo_postal text;
alter table academias.academias add column if not exists mision text;
alter table academias.academias add column if not exists whatsapp text;
alter table academias.academias add column if not exists instagram text;
alter table academias.academias add column if not exists facebook text;
alter table academias.academias add column if not exists tiktok text;
alter table academias.academias add column if not exists youtube text;
alter table academias.academias add column if not exists twitter text;
alter table academias.academias add column if not exists google_maps_url text;

alter table academias.sedes add column if not exists codigo_postal text;

alter table academias.tracks add column if not exists horarios jsonb;
alter table academias.tracks add column if not exists coach_id uuid references academias.staff(id);

alter table academias.jugadores add column if not exists tipo_documento text;
alter table academias.jugadores add column if not exists num_documento text;
alter table academias.jugadores add column if not exists telefono text;
alter table academias.jugadores add column if not exists atributos jsonb;   -- cromo (6 atributos)

alter table academias.cargos add column if not exists promo text;           -- nombre de la promo aplicada

alter table academias.pagos add column if not exists fecha_aprobacion date;
alter table academias.pagos add column if not exists fecha_rechazo date;

alter table academias.pago_cargo add column if not exists concepto text;    -- snapshot para el documento
alter table academias.pago_cargo add column if not exists cat text;         -- categoría de ingreso
alter table academias.pago_cargo add column if not exists tipo text;        -- CR | CNR

alter table academias.procesos_facturacion add column if not exists fecha date;
alter table academias.procesos_facturacion add column if not exists cargo_ids jsonb;

-- ---------------------------------------------------------------------
-- 2) Perfiles: vincula un usuario de Supabase Auth con academia + rol
-- ---------------------------------------------------------------------
create table if not exists academias.perfiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  academia_id uuid references academias.academias(id),
  sede_id     uuid references academias.sedes(id),
  rol         text not null default 'admin'
              check (rol in ('admin','coordinador','tesorero','profesor')),
  nombre      text,
  created_at  timestamptz not null default now()
);
alter table academias.perfiles enable row level security;
grant all on academias.perfiles to authenticated, service_role;

-- Academia del usuario autenticado. SECURITY DEFINER para evitar recursión RLS.
create or replace function academias.mi_academia() returns uuid
language sql stable security definer set search_path = academias, public as
$$ select academia_id from academias.perfiles where user_id = auth.uid() $$;
revoke execute on function academias.mi_academia() from public;
grant execute on function academias.mi_academia() to authenticated;

drop policy if exists p_perfiles_sel on academias.perfiles;
create policy p_perfiles_sel on academias.perfiles for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists p_perfiles_upd on academias.perfiles;
create policy p_perfiles_upd on academias.perfiles for update to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 3) Políticas RLS multi-tenant (cada academia ve y toca solo lo suyo)
-- ---------------------------------------------------------------------
-- La academia propia
drop policy if exists p_academias on academias.academias;
create policy p_academias on academias.academias for all to authenticated
  using (id = (select academias.mi_academia()))
  with check (id = (select academias.mi_academia()));

-- Tablas con academia_id directo
drop policy if exists p_sedes on academias.sedes;
create policy p_sedes on academias.sedes for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_staff on academias.staff;
create policy p_staff on academias.staff for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_tutores on academias.tutores;
create policy p_tutores on academias.tutores for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_conceptos_cnr on academias.conceptos_cnr;
create policy p_conceptos_cnr on academias.conceptos_cnr for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_medios_pago on academias.medios_pago;
create policy p_medios_pago on academias.medios_pago for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_ciclos_pago on academias.ciclos_pago;
create policy p_ciclos_pago on academias.ciclos_pago for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_promociones on academias.promociones;
create policy p_promociones on academias.promociones for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_procesos on academias.procesos_facturacion;
create policy p_procesos on academias.procesos_facturacion for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_egresos on academias.egresos;
create policy p_egresos on academias.egresos for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_pasarelas on academias.academia_pasarelas;
create policy p_pasarelas on academias.academia_pasarelas for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

-- Tablas hijas (aisladas vía su padre)
drop policy if exists p_tracks on academias.tracks;
create policy p_tracks on academias.tracks for all to authenticated
  using (exists (select 1 from academias.sedes s
                 where s.id = sede_id and s.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.sedes s
                 where s.id = sede_id and s.academia_id = (select academias.mi_academia())));

drop policy if exists p_track_staff on academias.track_staff;
create policy p_track_staff on academias.track_staff for all to authenticated
  using (exists (select 1 from academias.tracks t join academias.sedes s on s.id = t.sede_id
                 where t.id = track_id and s.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.tracks t join academias.sedes s on s.id = t.sede_id
                 where t.id = track_id and s.academia_id = (select academias.mi_academia())));

drop policy if exists p_jugadores on academias.jugadores;
create policy p_jugadores on academias.jugadores for all to authenticated
  using (exists (select 1 from academias.tutores t
                 where t.id = tutor_id and t.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.tutores t
                 where t.id = tutor_id and t.academia_id = (select academias.mi_academia())));

drop policy if exists p_jugador_atributos on academias.jugador_atributos;
create policy p_jugador_atributos on academias.jugador_atributos for all to authenticated
  using (exists (select 1 from academias.jugadores j join academias.tutores t on t.id = j.tutor_id
                 where j.id = jugador_id and t.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.jugadores j join academias.tutores t on t.id = j.tutor_id
                 where j.id = jugador_id and t.academia_id = (select academias.mi_academia())));

drop policy if exists p_inscripciones on academias.inscripciones;
create policy p_inscripciones on academias.inscripciones for all to authenticated
  using (exists (select 1 from academias.jugadores j join academias.tutores t on t.id = j.tutor_id
                 where j.id = jugador_id and t.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.jugadores j join academias.tutores t on t.id = j.tutor_id
                 where j.id = jugador_id and t.academia_id = (select academias.mi_academia())));

drop policy if exists p_cargos on academias.cargos;
create policy p_cargos on academias.cargos for all to authenticated
  using (exists (select 1 from academias.tutores t
                 where t.id = tutor_id and t.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.tutores t
                 where t.id = tutor_id and t.academia_id = (select academias.mi_academia())));

drop policy if exists p_pagos on academias.pagos;
create policy p_pagos on academias.pagos for all to authenticated
  using (exists (select 1 from academias.tutores t
                 where t.id = tutor_id and t.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.tutores t
                 where t.id = tutor_id and t.academia_id = (select academias.mi_academia())));

drop policy if exists p_pago_cargo on academias.pago_cargo;
create policy p_pago_cargo on academias.pago_cargo for all to authenticated
  using (exists (select 1 from academias.pagos p join academias.tutores t on t.id = p.tutor_id
                 where p.id = pago_id and t.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.pagos p join academias.tutores t on t.id = p.tutor_id
                 where p.id = pago_id and t.academia_id = (select academias.mi_academia())));

drop policy if exists p_asistencias on academias.asistencias;
create policy p_asistencias on academias.asistencias for all to authenticated
  using (exists (select 1 from academias.tracks tr join academias.sedes s on s.id = tr.sede_id
                 where tr.id = track_id and s.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.tracks tr join academias.sedes s on s.id = tr.sede_id
                 where tr.id = track_id and s.academia_id = (select academias.mi_academia())));

drop policy if exists p_asistencias_staff on academias.asistencias_staff;
create policy p_asistencias_staff on academias.asistencias_staff for all to authenticated
  using (exists (select 1 from academias.staff st
                 where st.id = staff_id and st.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.staff st
                 where st.id = staff_id and st.academia_id = (select academias.mi_academia())));

-- ---------------------------------------------------------------------
-- 4) Onboarding: crear academia + primera sede + catálogos por defecto
--    Lo llama la app tras el primer login (RPC).
-- ---------------------------------------------------------------------
create or replace function academias.crear_academia(p_nombre text, p_sede text default 'Principal')
returns uuid
language plpgsql security definer set search_path = academias, public as
$$
declare
  v_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if exists (select 1 from academias.perfiles where user_id = auth.uid() and academia_id is not null) then
    raise exception 'El usuario ya pertenece a una academia';
  end if;
  select email into v_email from auth.users where id = auth.uid();

  insert into academias.academias (nombre_academia, slug_url, email_corporativo)
  values (p_nombre,
          lower(regexp_replace(p_nombre, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 4),
          v_email)
  returning id into v_id;

  insert into academias.perfiles (user_id, academia_id, rol, nombre)
  values (auth.uid(), v_id, 'admin', split_part(coalesce(v_email, ''), '@', 1))
  on conflict (user_id) do update set academia_id = excluded.academia_id, rol = 'admin';

  insert into academias.sedes (academia_id, nombre_sede) values (v_id, coalesce(nullif(p_sede,''), 'Principal'));

  -- Catálogos por defecto (editables luego en Configuración)
  insert into academias.medios_pago (academia_id, nombre) values
    (v_id, 'Efectivo'), (v_id, 'Yape'), (v_id, 'Plin'), (v_id, 'Transferencia'), (v_id, 'Tarjeta');
  insert into academias.ciclos_pago (academia_id, dia, dia_venc, es_default) values
    (v_id, 1, 5, true), (v_id, 16, 20, false);
  insert into academias.promociones (academia_id, nombre, meses_total, meses_pagados) values
    (v_id, '3x2', 3, 2), (v_id, '2x1', 2, 1);
  insert into academias.conceptos_cnr (academia_id, nombre, precio, maneja_stock, es_torneo) values
    (v_id, 'Matrícula', 100, false, false),
    (v_id, 'Uniforme', 120, true, false),
    (v_id, 'Inscripción torneo', 100, false, true);

  return v_id;
end
$$;
revoke execute on function academias.crear_academia(text, text) from public, anon;
grant execute on function academias.crear_academia(text, text) to authenticated;

-- =====================================================================
-- FIN v2. Verificación rápida:
--   select count(*) from pg_policies where schemaname = 'academias';  -- ≈ 23
-- =====================================================================
