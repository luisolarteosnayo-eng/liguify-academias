-- =====================================================================
-- LIGUIFY ACADEMIAS — v13: Sedes múltiples por profesor
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Un profesor del catálogo puede pertenecer a varias sedes. La lista
-- se guarda en staff.sede_ids (jsonb, array de ids de sede); el campo
-- staff.sede_id se mantiene como la primera sede (compatibilidad).
-- NULL / vacío = disponible en todas las sedes.
-- =====================================================================

alter table academias.staff add column if not exists sede_ids jsonb;

-- Migración: sembrar sede_ids desde la sede única existente
update academias.staff
   set sede_ids = jsonb_build_array(sede_id)
 where sede_id is not null and sede_ids is null;

-- =====================================================================
-- FIN v13.
-- =====================================================================
