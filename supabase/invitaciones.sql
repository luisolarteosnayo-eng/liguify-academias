-- =====================================================================
-- LIGUIFY ACADEMIAS — v3: Usuarios, invitaciones y roles
-- Ejecutar DESPUÉS de schema.sql y rls_auth.sql. Idempotente.
--
-- Flujo (igual que Liguify Torneos):
--   1. El admin invita por correo asignando rol (y sede opcional).
--   2. El invitado se registra o entra con Google en la app.
--   3. Al entrar, la app llama aceptar_invitacion(): si su correo tiene
--      una invitación pendiente, se une a esa academia con ese rol.
--   4. Sin invitación, el flujo normal: crear su propia academia.
-- =====================================================================

-- Email visible en el perfil (para listar usuarios sin exponer auth.users)
alter table academias.perfiles add column if not exists email text;

-- ¿El usuario autenticado es admin de su academia?
create or replace function academias.es_admin() returns boolean
language sql stable security definer set search_path = academias, public as
$$ select exists (select 1 from academias.perfiles
                  where user_id = auth.uid() and rol = 'admin' and academia_id is not null) $$;
revoke execute on function academias.es_admin() from public;
grant execute on function academias.es_admin() to authenticated;

-- Los miembros ven los perfiles de su academia (antes: solo el propio)
drop policy if exists p_perfiles_sel on academias.perfiles;
create policy p_perfiles_sel on academias.perfiles for select to authenticated
  using (user_id = (select auth.uid()) or academia_id = (select academias.mi_academia()));

-- ---------------------------------------------------------------------
-- Invitaciones
-- ---------------------------------------------------------------------
create table if not exists academias.invitaciones (
  id           uuid primary key default gen_random_uuid(),
  academia_id  uuid not null references academias.academias(id),
  email        text not null,
  rol          text not null default 'coordinador'
               check (rol in ('admin','coordinador','tesorero','profesor')),
  sede_id      uuid references academias.sedes(id),
  estado       text not null default 'pendiente'
               check (estado in ('pendiente','aceptada','revocada')),
  created_by   uuid,
  created_at   timestamptz not null default now(),
  aceptada_at  timestamptz
);
create unique index if not exists idx_inv_unica_pendiente
  on academias.invitaciones (academia_id, lower(email)) where (estado = 'pendiente');

alter table academias.invitaciones enable row level security;
grant all on academias.invitaciones to authenticated, service_role;

drop policy if exists p_inv_sel on academias.invitaciones;
create policy p_inv_sel on academias.invitaciones for select to authenticated
  using (academia_id = (select academias.mi_academia()));
-- Escrituras solo vía RPCs (security definer); sin políticas de insert/update/delete.

-- ---------------------------------------------------------------------
-- RPCs de administración de usuarios
-- ---------------------------------------------------------------------
create or replace function academias.invitar_usuario(p_email text, p_rol text, p_sede uuid default null)
returns uuid
language plpgsql security definer set search_path = academias, public as
$$
declare v_acad uuid; v_id uuid; v_email text;
begin
  if not academias.es_admin() then raise exception 'Solo un administrador puede invitar usuarios'; end if;
  v_acad := academias.mi_academia();
  v_email := lower(trim(p_email));
  if v_email = '' then raise exception 'Correo requerido'; end if;
  if exists (select 1 from academias.perfiles where academia_id = v_acad and lower(email) = v_email) then
    raise exception 'Ese correo ya es usuario de la academia';
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

-- La llama la app tras el login si el usuario aún no tiene academia.
-- Devuelve la academia a la que se unió, o null si no hay invitación.
create or replace function academias.aceptar_invitacion()
returns uuid
language plpgsql security definer set search_path = academias, public as
$$
declare v_email text; v_inv academias.invitaciones%rowtype;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if exists (select 1 from academias.perfiles where user_id = auth.uid() and academia_id is not null) then
    return null;  -- ya pertenece a una academia
  end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  select * into v_inv from academias.invitaciones
    where lower(email) = v_email and estado = 'pendiente'
    order by created_at desc limit 1;
  if v_inv.id is null then return null; end if;

  insert into academias.perfiles (user_id, academia_id, sede_id, rol, email, nombre)
  values (auth.uid(), v_inv.academia_id, v_inv.sede_id, v_inv.rol, v_email, split_part(v_email, '@', 1))
  on conflict (user_id) do update
    set academia_id = excluded.academia_id, sede_id = excluded.sede_id,
        rol = excluded.rol, email = excluded.email;
  update academias.invitaciones set estado = 'aceptada', aceptada_at = now() where id = v_inv.id;
  return v_inv.academia_id;
end $$;
revoke execute on function academias.aceptar_invitacion() from public, anon;
grant execute on function academias.aceptar_invitacion() to authenticated;

create or replace function academias.revocar_invitacion(p_id uuid)
returns void
language plpgsql security definer set search_path = academias, public as
$$
begin
  if not academias.es_admin() then raise exception 'Solo un administrador puede revocar invitaciones'; end if;
  update academias.invitaciones set estado = 'revocada'
    where id = p_id and academia_id = academias.mi_academia() and estado = 'pendiente';
end $$;
revoke execute on function academias.revocar_invitacion(uuid) from public, anon;
grant execute on function academias.revocar_invitacion(uuid) to authenticated;

create or replace function academias.cambiar_rol_usuario(p_user uuid, p_rol text, p_sede uuid default null)
returns void
language plpgsql security definer set search_path = academias, public as
$$
begin
  if not academias.es_admin() then raise exception 'Solo un administrador puede cambiar roles'; end if;
  if p_user = auth.uid() then raise exception 'No puedes cambiar tu propio rol'; end if;
  update academias.perfiles set rol = p_rol, sede_id = p_sede
    where user_id = p_user and academia_id = academias.mi_academia();
end $$;
revoke execute on function academias.cambiar_rol_usuario(uuid, text, uuid) from public, anon;
grant execute on function academias.cambiar_rol_usuario(uuid, text, uuid) to authenticated;

create or replace function academias.quitar_usuario(p_user uuid)
returns void
language plpgsql security definer set search_path = academias, public as
$$
begin
  if not academias.es_admin() then raise exception 'Solo un administrador puede quitar usuarios'; end if;
  if p_user = auth.uid() then raise exception 'No puedes quitarte a ti mismo'; end if;
  delete from academias.perfiles
    where user_id = p_user and academia_id = academias.mi_academia();
end $$;
revoke execute on function academias.quitar_usuario(uuid) from public, anon;
grant execute on function academias.quitar_usuario(uuid) to authenticated;

-- crear_academia ahora también guarda el email en el perfil
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

  insert into academias.perfiles (user_id, academia_id, rol, email, nombre)
  values (auth.uid(), v_id, 'admin', v_email, split_part(coalesce(v_email, ''), '@', 1))
  on conflict (user_id) do update
    set academia_id = excluded.academia_id, rol = 'admin', email = excluded.email;

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

-- =====================================================================
-- FIN v3.
-- =====================================================================
