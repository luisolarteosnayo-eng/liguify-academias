-- =====================================================================
-- LIGUIFY ACADEMIAS — v30: Nómina de alumnos en el cierre mensual
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- El cierre guarda los ids de los alumnos inscritos en cada track al
-- momento del cierre, lo que permite identificar ALTAS y BAJAS por
-- nombre entre un periodo y el anterior (vista "Ver cierres").
-- =====================================================================

alter table academias.track_cierres add column if not exists alumnos_ids jsonb;

-- =====================================================================
-- FIN v30.
-- =====================================================================
