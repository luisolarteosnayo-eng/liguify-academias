-- =====================================================================
-- LIGUIFY ACADEMIAS — v16: Prospectos (clase de prueba)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Un interesado se registra como PROSPECTO con su clase de prueba
-- (fecha + track que visitará, gratis o con CNR). No cuenta como
-- alumno; desde su ficha se convierte en alumno o se descarta.
-- fue_prospecto conserva la marca para medir la conversión.
-- =====================================================================

-- Permitir el estado 'prospecto' (reemplaza el check de estado_alumno)
do $$
declare c text;
begin
  select conname into c
    from pg_constraint
   where conrelid = 'academias.jugadores'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%estado_alumno%';
  if c is not null then
    execute format('alter table academias.jugadores drop constraint %I', c);
  end if;
end $$;

alter table academias.jugadores
  add constraint jugadores_estado_alumno_check
  check (estado_alumno in ('activo', 'baja', 'prospecto'));

alter table academias.jugadores add column if not exists prueba_fecha date;
alter table academias.jugadores add column if not exists prueba_track_id uuid references academias.tracks(id);
alter table academias.jugadores add column if not exists fue_prospecto boolean not null default false;

-- =====================================================================
-- FIN v16.
-- =====================================================================
