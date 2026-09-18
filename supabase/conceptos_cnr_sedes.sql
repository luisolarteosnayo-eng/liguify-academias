-- =====================================================================
-- LIGUIFY ACADEMIAS — v15: Sedes múltiples por concepto CNR
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Un concepto CNR puede activarse para todas, una o varias sedes
-- (igual que los profesores). La lista va en conceptos_cnr.sede_ids
-- (jsonb, array de ids de sede); sede_id se mantiene como la primera
-- sede (compatibilidad). NULL / vacío = todas las sedes.
-- =====================================================================

alter table academias.conceptos_cnr add column if not exists sede_ids jsonb;

-- Migración: sembrar sede_ids desde la sede única existente
update academias.conceptos_cnr
   set sede_ids = jsonb_build_array(sede_id)
 where sede_id is not null and sede_ids is null;

-- =====================================================================
-- FIN v15.
-- =====================================================================
