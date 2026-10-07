-- =====================================================================
-- LIGUIFY ACADEMIAS — v36: Quién registró al alumno / clase de prueba
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Se graba el usuario que hizo el registro (clase de prueba o registro
-- cero fricción) para las futuras comisiones de captación.
-- =====================================================================

alter table academias.jugadores add column if not exists registrado_por text;

-- =====================================================================
-- FIN v36.
-- =====================================================================
