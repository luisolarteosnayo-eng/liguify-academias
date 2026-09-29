-- =====================================================================
-- LIGUIFY ACADEMIAS — v18: Conceptos de gasto configurables
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Catálogo de conceptos para la pantalla Gastos, por sede (todas / 1 /
-- varias, como el resto de catálogos). Se siembran los conceptos
-- estándar en cada empresa existente; los gastos ya registrados
-- conservan su texto.
-- =====================================================================

create table if not exists academias.conceptos_gasto (
  id          uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias.academias(id),
  nombre      text not null,
  sede_id     uuid references academias.sedes(id),
  sede_ids    jsonb,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_conceptosgasto_academia on academias.conceptos_gasto(academia_id);

alter table academias.conceptos_gasto enable row level security;
drop policy if exists p_conceptos_gasto on academias.conceptos_gasto;
create policy p_conceptos_gasto on academias.conceptos_gasto for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

-- Sembrar los conceptos estándar en cada empresa que aún no tenga catálogo
insert into academias.conceptos_gasto (academia_id, nombre)
select a.id, x.nombre
  from academias.academias a
 cross join (values ('Cancha'), ('Materiales'), ('Uniformes'), ('Nómina'), ('Otro')) as x(nombre)
 where not exists (select 1 from academias.conceptos_gasto cg where cg.academia_id = a.id);

-- =====================================================================
-- FIN v18.
-- =====================================================================
