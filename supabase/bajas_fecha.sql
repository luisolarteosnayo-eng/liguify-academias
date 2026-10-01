-- =====================================================================
-- LIGUIFY ACADEMIAS — v31: Fecha de baja del alumno
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- La baja de un alumno ahora guarda la fecha (KPI "bajas del mes" en
-- Tracks · Rentabilidad) y desactiva sus inscripciones en tracks, para
-- que deje de contar en la rentabilidad y de generar CR mensuales.
-- Las bajas hechas antes de este cambio las corrige la app sola al
-- cargar (les desactiva las inscripciones y les pone fecha de hoy).
-- =====================================================================

alter table academias.jugadores add column if not exists baja_fecha date;

-- =====================================================================
-- FIN v31.
-- =====================================================================
