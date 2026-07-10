-- =====================================================================
-- LIGUIFY ACADEMIAS — v4: Calendario de clases por sede
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Cada sede configura los días del mes en los que SÍ tendrá clases
-- (los feriados, vacaciones y fechas especiales se dejan sin marcar).
-- Se guarda como lista de fechas ISO en jsonb, p. ej.:
--   ["2026-07-01","2026-07-06","2026-07-08", ...]
-- Servirá para prorratear los CR según las clases pendientes del mes.
-- =====================================================================

alter table academias.sedes add column if not exists dias_clase jsonb;

-- =====================================================================
-- FIN v4.
-- =====================================================================
