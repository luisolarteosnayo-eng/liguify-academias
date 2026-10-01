-- =====================================================================
-- LIGUIFY ACADEMIAS — v33: Nuevos y bajas del periodo en el cierre
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- El cierre mensual graba como dato, por track, cuántos alumnos nuevos
-- se inscribieron y cuántas bajas hubo en el periodo cerrado (contando
-- inscripciones por fecha_inscripcion / baja_fecha del mes).
-- =====================================================================

alter table academias.track_cierres add column if not exists nuevos int;
alter table academias.track_cierres add column if not exists bajas int;

-- =====================================================================
-- FIN v33.
-- =====================================================================
