-- =====================================================================
-- LIGUIFY ACADEMIAS — v27: Vínculo del alumno con Liguify Competencias
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- El alumno se vincula al jugador_maestro de Competencias por su
-- documento. El RPC (security definer) busca en el padrón global y
-- devuelve foto, escaneos del DNI y el token del perfil público —
-- solo si el documento pertenece a un alumno de TU academia.
-- =====================================================================

alter table academias.jugadores add column if not exists jugador_maestro_id uuid;

create or replace function academias.buscar_jugador_competencias(p_pais text, p_nro text)
returns table(jugador_maestro_id uuid, nombres text, apellidos text, foto_url text,
              doc_frente text, doc_reverso text, verificado boolean, perfil_token text)
language plpgsql security definer set search_path = academias, competencias, public as
$$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if p_nro is null or length(trim(p_nro)) < 6 then
    raise exception 'Documento inválido';
  end if;
  -- el documento debe pertenecer a un alumno de MI academia (evita consultas arbitrarias)
  if not exists (
    select 1 from academias.jugadores j
      join academias.sedes s on s.id = j.sede_id
     where j.num_documento = trim(p_nro)
       and coalesce(j.pais_documento, 'PE') = coalesce(p_pais, 'PE')
       and s.academia_id = (select academias.mi_academia())
  ) then
    raise exception 'El documento no corresponde a un alumno de tu academia';
  end if;
  return query
  select jm.id, jm.nombres, jm.apellidos, jm.foto_url,
         jm.doc_scan_frente_url, jm.doc_scan_reverso_url, jm.verificado,
         (select pj.token from competencias.perfil_jugador pj
           where pj.jugador_id = jm.id and pj.habilitado limit 1)
    from competencias.jugador_maestro jm
   where jm.nro_documento = trim(p_nro)
     and coalesce(jm.pais_documento, 'PE') = coalesce(p_pais, 'PE')
   limit 1;
end $$;

-- =====================================================================
-- FIN v27.
-- =====================================================================
