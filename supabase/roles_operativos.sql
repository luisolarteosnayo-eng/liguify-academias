-- =====================================================================
-- LIGUIFY ACADEMIAS — v9: Roles Operador y Cobranza + invitaciones por
-- coordinadores (General y de Sede)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Operador: registra alumnos, revisa su información y registra pagos.
-- Cobranza: registra pagos y revisa cuentas por cobrar.
-- Invitan: admin (todo), Coordinador General (todo menos admin, cualquier
-- sede) y Coordinador de Sede (operador/cobranza/tesorero/profesor, SOLO
-- para su sede — el servidor fuerza la sede).
-- =====================================================================

alter table academias.perfiles drop constraint if exists perfiles_rol_check;
alter table academias.perfiles add constraint perfiles_rol_check
  check (rol in ('admin','coordinador','tesorero','profesor','operador','cobranza'));

alter table academias.invitaciones drop constraint if exists invitaciones_rol_check;
alter table academias.invitaciones add constraint invitaciones_rol_check
  check (rol in ('admin','coordinador','tesorero','profesor','operador','cobranza'));

-- Invitar: admin y coordinadores, con alcance según su nivel
create or replace function academias.invitar_usuario(p_email text, p_rol text, p_sede uuid default null)
returns uuid
language plpgsql security definer set search_path = academias, public as
$$
declare
  v_acad uuid; v_id uuid; v_email text; v_rol text; v_mi_sede uuid;
begin
  select academia_id, rol, sede_id into v_acad, v_rol, v_mi_sede
    from academias.perfiles where user_id = auth.uid();
  if v_acad is null or v_rol not in ('admin', 'coordinador') then
    raise exception 'Solo administradores y coordinadores pueden invitar usuarios';
  end if;
  if v_rol = 'coordinador' then
    if p_rol = 'admin' then
      raise exception 'Solo un administrador puede invitar administradores';
    end if;
    if v_mi_sede is not null then
      -- Coordinador de Sede: no crea coordinadores y solo invita a SU sede
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

-- Revocar: admin (todas) y coordinadores (el de sede, solo las de su sede)
create or replace function academias.revocar_invitacion(p_id uuid)
returns void
language plpgsql security definer set search_path = academias, public as
$$
declare
  v_acad uuid; v_rol text; v_mi_sede uuid;
begin
  select academia_id, rol, sede_id into v_acad, v_rol, v_mi_sede
    from academias.perfiles where user_id = auth.uid();
  if v_acad is null or v_rol not in ('admin', 'coordinador') then
    raise exception 'Solo administradores y coordinadores pueden revocar invitaciones';
  end if;
  update academias.invitaciones set estado = 'revocada'
    where id = p_id and academia_id = v_acad and estado = 'pendiente'
      and (v_rol = 'admin' or v_mi_sede is null or sede_id = v_mi_sede);
end $$;
revoke execute on function academias.revocar_invitacion(uuid) from public, anon;
grant execute on function academias.revocar_invitacion(uuid) to authenticated;

-- =====================================================================
-- FIN v9. quitar_usuario y cambiar_rol_usuario siguen siendo solo admin.
-- =====================================================================
