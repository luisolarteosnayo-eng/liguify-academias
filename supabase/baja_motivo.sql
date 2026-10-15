-- =====================================================================
-- LIGUIFY ACADEMIAS — v44: Motivo y comentario de la baja del alumno
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Al dar de baja se registra el motivo (DEJO DE ASISTIR / PROBLEMA CON
-- ACADEMIA / PROBLEMA CON PROFESOR / OTRO) y un comentario libre, para
-- analizar después por qué se van los alumnos.
-- =====================================================================

alter table academias.jugadores add column if not exists baja_motivo text;
alter table academias.jugadores add column if not exists baja_comentario text;

-- =====================================================================
-- FIN v44.
-- =====================================================================
