-- =====================================================================
-- LIGUIFY ACADEMIAS — v12: Cierre mensual de tracks (evolución mes a mes)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- El cierre mensual guarda la foto del mes de cada track activo:
-- alumnos, ingresos, costos, utilidad, CR promedio y entrenadores a
-- cargo. Con los cierres se evalúa la evolución del track y el
-- rendimiento de sus profesores mes a mes.
-- =====================================================================

create table if not exists academias.track_cierres (
  id               uuid primary key default gen_random_uuid(),
  academia_id      uuid not null references academias.academias(id),
  sede_id          uuid not null references academias.sedes(id),
  track_id         uuid not null references academias.tracks(id),
  periodo          text not null,                  -- 'YYYY-MM'
  nombre_track     text,                           -- snapshot (por si luego cambia)
  entrenadores     text,                           -- nombres a cargo en el cierre
  alumnos          int not null default 0,
  capacidad        int default 0,
  ingresos         decimal(12,2) not null default 0,
  costo_cancha     decimal(12,2) not null default 0,
  costo_profesores decimal(12,2) not null default 0,
  utilidad         decimal(12,2) not null default 0,
  cr_promedio      decimal(12,2) not null default 0,
  created_at       timestamptz not null default now(),
  unique (track_id, periodo)
);
create index if not exists idx_trackcierres_track on academias.track_cierres(track_id, periodo);

alter table academias.track_cierres enable row level security;
drop policy if exists p_track_cierres on academias.track_cierres;
create policy p_track_cierres on academias.track_cierres for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

-- =====================================================================
-- FIN v12.
-- =====================================================================
