-- =====================================================================
-- LIGUIFY ACADEMIAS — v26: Evaluación mensual del alumno
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Evaluación periódica (una por mes y alumno): los 6 atributos del
-- cromo + peso y talla + observaciones del entrenador. El cromo del
-- alumno (jugadores.atributos) refleja siempre la más reciente.
-- =====================================================================

create table if not exists academias.evaluaciones (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias.academias(id),
  jugador_id    uuid not null references academias.jugadores(id),
  periodo       text not null,                -- 'YYYY-MM'
  velocidad     int,
  potencia      int,
  agilidad      int,
  tecnica       int,
  pase          int,
  defensa       int,
  peso          decimal(5,2),                 -- kg
  talla         decimal(5,1),                 -- cm
  observaciones text,
  created_at    timestamptz not null default now(),
  unique (jugador_id, periodo)
);
create index if not exists idx_evaluaciones_jugador on academias.evaluaciones(jugador_id, periodo);

alter table academias.evaluaciones enable row level security;
drop policy if exists p_evaluaciones on academias.evaluaciones;
create policy p_evaluaciones on academias.evaluaciones for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

-- =====================================================================
-- FIN v26.
-- =====================================================================
