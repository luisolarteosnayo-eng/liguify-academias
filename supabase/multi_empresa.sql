-- =====================================================================
-- LIGUIFY ACADEMIAS — v10: Multi-empresa (una cuenta, varias empresas)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Un mismo email puede pertenecer a varias EMPRESAS, con un rol y sede
-- distintos en cada una (operador en la marca A, cobranza en la B).
-- Al entrar, si tiene varias, la app muestra el selector de empresa y
-- un conmutador en el sidebar. La "empresa activa" se guarda en el
-- perfil (columna activa) y TODA la seguridad RLS sigue pasando por
-- mi_academia(), que ahora devuelve la empresa activa del usuario.
-- =====================================================================

-- 1) Perfiles: de "un perfil por usuario" a "un perfil por (usuario, empresa)"
delete from academias.perfiles where academia_id is null;
alter table academias.perfiles alter column academia_id set not null;
alter table academias.perfiles drop constraint if exists perfiles_pkey;
alter table academias.perfiles add primary key (user_id, academia_id);
alter table academias.perfiles add column if not exists activa boolean not null default false;
update academias.perfiles set activa = true where activa = false
  and not exists (select 1 from academias.perfiles p2
                  where p2.user_id = academias.perfiles.user_id and p2.activa);

-- Cierre de seguridad: el usuario solo puede modificar columnas inocuas
-- de su propio perfil (el rol/sede/academia solo cambian vía RPCs definer)
revoke update on academias.perfiles from authenticated;
grant update (email, nombre) on academias.perfiles to authenticated;

-- 2) mi_academia() = la empresa ACTIVA del usuario
create or replace function academias.mi_academia() returns uuid
language sql stable security definer set search_path = academias, public as
$$ select academia_id from academias.perfiles
   where user_id = auth.uid()
   order by activa desc, created_at asc
   limit 1 $$;

-- es_admin() = admin de la empresa ACTIVA
create or replace function academias.es_admin() returns boolean
language sql stable security definer set search_path = academias, public as
$$ select exists (select 1 from academias.perfiles
                  where user_id = auth.uid() and rol = 'admin'
                    and academia_id = academias.mi_academia()) $$;

-- 3) El usuario puede VER los datos básicos de todas sus empresas (para el
-- selector); modificar, solo la activa
drop policy if exists p_academias on academias.academias;
drop policy if exists p_academias_sel on academias.academias;
create policy p_academias_sel on academias.academias for select to authenticated
  using (id in (select academia_id from academias.perfiles where user_id = (select auth.uid())));
drop policy if exists p_academias_mod on academias.academias;
create policy p_academias_mod on academias.academias for all to authenticated
  using (id = (select academias.mi_academia()))
  with check (id = (select academias.mi_academia()));

-- 4) Cambiar de empresa activa (solo entre las propias)
create or replace function academias.cambiar_empresa(p_academia uuid)
returns void
language plpgsql security definer set search_path = academias, public as
$$
begin
  if not exists (select 1 from academias.perfiles
                 where user_id = auth.uid() and academia_id = p_academia) then
    raise exception 'No perteneces a esa empresa';
  end if;
  update academias.perfiles set activa = (academia_id = p_academia)
    where user_id = auth.uid();
end $$;
revoke execute on function academias.cambiar_empresa(uuid) from public, anon;
grant execute on function academias.cambiar_empresa(uuid) to authenticated;

-- 5) Crear empresa: permitido aunque ya pertenezcas a otras (multi-marca)
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
  select email into v_email from auth.users where id = auth.uid();

  insert into academias.academias (nombre_academia, slug_url, email_corporativo)
  values (p_nombre,
          lower(regexp_replace(p_nombre, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 4),
          v_email)
  returning id into v_id;

  update academias.perfiles set activa = false where user_id = auth.uid();
  insert into academias.perfiles (user_id, academia_id, rol, email, nombre, activa)
  values (auth.uid(), v_id, 'admin', v_email, split_part(coalesce(v_email, ''), '@', 1), true)
  on conflict (user_id, academia_id) do update set rol = 'admin', activa = true;

  insert into academias.sedes (academia_id, nombre_sede) values (v_id, coalesce(nullif(p_sede,''), 'Principal'));

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

-- 6) Aceptar invitaciones: agrega la membresía aunque ya tenga empresas.
-- Acepta TODAS las pendientes del correo; devuelve la primera unida (o null).
create or replace function academias.aceptar_invitacion()
returns uuid
language plpgsql security definer set search_path = academias, public as
$$
declare
  v_email text;
  v_inv record;
  v_primera uuid := null;
  v_tenia boolean;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  v_tenia := exists (select 1 from academias.perfiles where user_id = auth.uid());

  for v_inv in
    select * from academias.invitaciones
    where lower(email) = v_email and estado = 'pendiente'
      and not exists (select 1 from academias.perfiles p
                      where p.user_id = auth.uid() and p.academia_id = academias.invitaciones.academia_id)
    order by created_at asc
  loop
    insert into academias.perfiles (user_id, academia_id, sede_id, rol, email, nombre, activa)
    values (auth.uid(), v_inv.academia_id, v_inv.sede_id, v_inv.rol, v_email,
            split_part(v_email, '@', 1), not v_tenia)
    on conflict (user_id, academia_id) do update
      set sede_id = excluded.sede_id, rol = excluded.rol, email = excluded.email;
    update academias.invitaciones set estado = 'aceptada', aceptada_at = now() where id = v_inv.id;
    if v_primera is null then v_primera := v_inv.academia_id; end if;
    v_tenia := true;   -- las siguientes ya no se marcan activas
  end loop;
  return v_primera;
end $$;
revoke execute on function academias.aceptar_invitacion() from public, anon;
grant execute on function academias.aceptar_invitacion() to authenticated;

-- 7) Invitar/revocar: el perfil que decide es el de la empresa ACTIVA
create or replace function academias.invitar_usuario(p_email text, p_rol text, p_sede uuid default null)
returns uuid
language plpgsql security definer set search_path = academias, public as
$$
declare
  v_acad uuid; v_id uuid; v_email text; v_rol text; v_mi_sede uuid;
begin
  v_acad := academias.mi_academia();
  select rol, sede_id into v_rol, v_mi_sede
    from academias.perfiles where user_id = auth.uid() and academia_id = v_acad;
  if v_acad is null or v_rol not in ('admin', 'coordinador') then
    raise exception 'Solo administradores y coordinadores pueden invitar usuarios';
  end if;
  if v_rol = 'coordinador' then
    if p_rol = 'admin' then
      raise exception 'Solo un administrador puede invitar administradores';
    end if;
    if v_mi_sede is not null then
      if p_rol = 'coordinador' then
        raise exception 'Un coordinador de sede no puede invitar coordinadores';
      end if;
      p_sede := v_mi_sede;
    end if;
  end if;

  v_email := lower(trim(p_email));
  if v_email = '' then raise exception 'Correo requerido'; end if;
  if exists (select 1 from academias.perfiles where academia_id = v_acad and lower(email) = v_email) then
    raise exception 'Ese correo ya es usuario de la empresa';
  end if;
  if exists (select 1 from academias.invitaciones where academia_id = v_acad and lower(email) = v_email and estado = 'pendiente') then
    raise exception 'Ya existe una invitación pendiente para ese correo';
  end if;
  insert into academias.invitaciones (academia_id, email, rol, sede_id, created_by)
  values (v_acad, v_email, p_rol, p_sede, auth.uid())
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function academias.invitar_usuario(text, text, uuid) from public, anon;
grant execute on function academias.invitar_usuario(text, text, uuid) to authenticated;

create or replace function academias.revocar_invitacion(p_id uuid)
returns void
language plpgsql security definer set search_path = academias, public as
$$
declare
  v_acad uuid; v_rol text; v_mi_sede uuid;
begin
  v_acad := academias.mi_academia();
  select rol, sede_id into v_rol, v_mi_sede
    from academias.perfiles where user_id = auth.uid() and academia_id = v_acad;
  if v_acad is null or v_rol not in ('admin', 'coordinador') then
    raise exception 'Solo administradores y coordinadores pueden revocar invitaciones';
  end if;
  update academias.invitaciones set estado = 'revocada'
    where id = p_id and academia_id = v_acad and estado = 'pendiente'
      and (v_rol = 'admin' or v_mi_sede is null or sede_id = v_mi_sede);
end $$;
revoke execute on function academias.revocar_invitacion(uuid) from public, anon;
grant execute on function academias.revocar_invitacion(uuid) to authenticated;

-- quitar_usuario y cambiar_rol_usuario ya operan sobre mi_academia() (activa)
-- y siguen siendo solo admin vía es_admin().

-- =====================================================================
-- FIN v10.
-- =====================================================================
