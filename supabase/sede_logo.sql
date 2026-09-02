-- =====================================================================
-- LIGUIFY ACADEMIAS — v7: Logo por sede
-- Ejecutar en el SQL Editor (Run). Idempotente.
-- Se muestra junto al selector de sede en toda la app.
-- =====================================================================

alter table academias.sedes add column if not exists logo_url text;
