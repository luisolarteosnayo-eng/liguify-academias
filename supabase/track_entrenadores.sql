-- =====================================================================
-- LIGUIFY ACADEMIAS — v11: Entrenadores por track con costo individual
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Cada track puede tener varios entrenadores, cada uno con su costo
-- mensual; la suma = costo de profesores del track (el campo
-- tracks.costo_mensual_profesores se mantiene sincronizado por la app).
-- =====================================================================

create table if not exists academias.track_entrenadores (
  id        uuid primary key default gen_random_uuid(),
  track_id  uuid not null references academias.tracks(id),
  staff_id  uuid not null references academias.staff(id),
  costo     decimal(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (track_id, staff_id)
);
create index if not exists idx_trackent_track on academias.track_entrenadores(track_id);

alter table academias.track_entrenadores enable row level security;
drop policy if exists p_track_entrenadores on academias.track_entrenadores;
create policy p_track_entrenadores on academias.track_entrenadores for all to authenticated
  using (exists (select 1 from academias.tracks t join academias.sedes s on s.id = t.sede_id
                 where t.id = track_id and s.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.tracks t join academias.sedes s on s.id = t.sede_id
                 where t.id = track_id and s.academia_id = (select academias.mi_academia())));

-- Migración: sembrar desde el coach asignado (con el costo actual del track)
insert into academias.track_entrenadores (track_id, staff_id, costo)
select t.id, t.coach_id, coalesce(t.costo_mensual_profesores, 0)
  from academias.tracks t
 where t.coach_id is not null
   and not exists (select 1 from academias.track_entrenadores te
                   where te.track_id = t.id and te.staff_id = t.coach_id);

-- ...y desde el cuerpo técnico legado (track_staff), con costo 0 los adicionales
insert into academias.track_entrenadores (track_id, staff_id, costo)
select ts.track_id, ts.staff_id, 0
  from academias.track_staff ts
 where not exists (select 1 from academias.track_entrenadores te
                   where te.track_id = ts.track_id and te.staff_id = ts.staff_id);

-- =====================================================================
-- FIN v11.
-- =====================================================================
