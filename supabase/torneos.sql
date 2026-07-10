-- =====================================================================
-- LIGUIFY ACADEMIAS — v6: Torneos en los que participan los alumnos
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Modelo: Torneo -> Categorías (con costo de inscripción que paga la
-- academia) -> Jugadores por categoría (con precio de inscripción que se
-- cobra al alumno). Al generar los CNR pendientes, cada registro guarda
-- el cargo_id (glosa: "Inscripción a torneo <NOMBRE> <MES> <AÑO>").
-- Rentabilidad = CNRs generados − costo total del torneo.
-- =====================================================================

create table if not exists academias.torneos (
  id           uuid primary key default gen_random_uuid(),
  academia_id  uuid not null references academias.academias(id),
  nombre       text not null,
  fecha_inicio date,
  descripcion  text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists academias.torneo_categorias (
  id                uuid primary key default gen_random_uuid(),
  torneo_id         uuid not null references academias.torneos(id),
  nombre            text not null,                       -- "2019", "2015", "Libre"...
  costo_inscripcion decimal(12,2) not null default 0,    -- lo que paga la academia por esta categoría
  created_at        timestamptz not null default now()
);

create table if not exists academias.torneo_jugadores (
  id                 uuid primary key default gen_random_uuid(),
  torneo_id          uuid not null references academias.torneos(id),
  categoria_id       uuid not null references academias.torneo_categorias(id),
  jugador_id         uuid not null references academias.jugadores(id),
  precio_inscripcion decimal(12,2) not null default 0,   -- lo que se cobra al alumno
  cargo_id           uuid references academias.cargos(id),  -- CNR generado (null = pendiente)
  fecha_agregado     date not null default current_date,
  created_at         timestamptz not null default now(),
  unique (categoria_id, jugador_id)   -- no repetir jugador en la misma categoría
);

create index if not exists idx_torneo_cat    on academias.torneo_categorias(torneo_id);
create index if not exists idx_torneo_jug    on academias.torneo_jugadores(torneo_id);
create index if not exists idx_torneo_jug_j  on academias.torneo_jugadores(jugador_id);

alter table academias.torneos           enable row level security;
alter table academias.torneo_categorias enable row level security;
alter table academias.torneo_jugadores  enable row level security;

drop policy if exists p_torneos on academias.torneos;
create policy p_torneos on academias.torneos for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_torneo_categorias on academias.torneo_categorias;
create policy p_torneo_categorias on academias.torneo_categorias for all to authenticated
  using (exists (select 1 from academias.torneos t
                 where t.id = torneo_id and t.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.torneos t
                 where t.id = torneo_id and t.academia_id = (select academias.mi_academia())));

drop policy if exists p_torneo_jugadores on academias.torneo_jugadores;
create policy p_torneo_jugadores on academias.torneo_jugadores for all to authenticated
  using (exists (select 1 from academias.torneos t
                 where t.id = torneo_id and t.academia_id = (select academias.mi_academia())))
  with check (exists (select 1 from academias.torneos t
                 where t.id = torneo_id and t.academia_id = (select academias.mi_academia())));

-- =====================================================================
-- FIN v6.
-- =====================================================================
