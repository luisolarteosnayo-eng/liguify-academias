-- =====================================================================
-- LIGUIFY ACADEMIAS — v25: El tutor es un dato del alumno (1:1)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- El tutor deja de ser una entidad compartida: cada alumno tiene su
-- propio registro de tutor. Se elimina la restricción única
-- (academia_id, dni_tutor) porque dos hermanos tendrán cada uno su
-- copia del mismo padre (mismo DNI en dos filas).
-- =====================================================================

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'academias.tutores'::regclass
       and contype = 'u'
       and pg_get_constraintdef(oid) ilike '%dni_tutor%'
  loop
    execute format('alter table academias.tutores drop constraint %I', c);
  end loop;
end $$;

-- =====================================================================
-- FIN v25.
-- =====================================================================
