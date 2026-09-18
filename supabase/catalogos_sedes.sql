-- =====================================================================
-- LIGUIFY ACADEMIAS — v17: Sedes múltiples en todos los catálogos
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Medios de pago, ciclos de pago y promociones pueden activarse para
-- todas, una o varias sedes (igual que conceptos CNR y profesores).
-- sede_ids jsonb; sede_id se mantiene como la primera (compatibilidad).
-- NULL / vacío = todas las sedes.
-- =====================================================================

alter table academias.medios_pago  add column if not exists sede_ids jsonb;
alter table academias.ciclos_pago  add column if not exists sede_ids jsonb;
alter table academias.promociones  add column if not exists sede_ids jsonb;

-- Migración: sembrar sede_ids desde la sede única existente
update academias.medios_pago set sede_ids = jsonb_build_array(sede_id)
 where sede_id is not null and sede_ids is null;
update academias.ciclos_pago set sede_ids = jsonb_build_array(sede_id)
 where sede_id is not null and sede_ids is null;
update academias.promociones set sede_ids = jsonb_build_array(sede_id)
 where sede_id is not null and sede_ids is null;

-- =====================================================================
-- FIN v17.
-- =====================================================================
