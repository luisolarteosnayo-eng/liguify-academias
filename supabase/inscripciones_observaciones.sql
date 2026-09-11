-- =====================================================================
-- LIGUIFY ACADEMIAS — v14: Observaciones por inscripción (track × alumno)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Comentario libre en la asignación del track a un alumno, por ejemplo
-- para dejar constancia de por qué se cambió el precio.
-- =====================================================================

alter table academias.inscripciones add column if not exists observaciones text;

-- =====================================================================
-- FIN v14.
-- =====================================================================
