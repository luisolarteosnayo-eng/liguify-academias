-- =====================================================================
-- LIGUIFY ACADEMIAS — v28: Objetivos en la evaluación mensual
-- Ejecutar en el SQL Editor (Run). Idempotente.
-- =====================================================================

alter table academias.evaluaciones add column if not exists objetivos text;

-- =====================================================================
-- FIN v28.
-- =====================================================================
