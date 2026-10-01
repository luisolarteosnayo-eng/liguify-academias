-- =====================================================================
-- LIGUIFY ACADEMIAS — v32: Fecha de baja de la inscripción en el track
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Cada card de track muestra el movimiento del mes: alumnos nuevos
-- (inscripciones con fecha del mes) y bajas (inscripciones desactivadas
-- en el mes). Para eso la inscripción guarda su propia fecha de baja.
-- =====================================================================

alter table academias.inscripciones add column if not exists baja_fecha date;

-- Backfill: inscripciones ya desactivadas por la baja del alumno heredan
-- la fecha de baja del alumno (cubre las bajas hechas antes del cambio)
update academias.inscripciones i
   set baja_fecha = j.baja_fecha
  from academias.jugadores j
 where i.jugador_id = j.id
   and i.activo = false
   and i.baja_fecha is null
   and j.baja_fecha is not null;

-- =====================================================================
-- FIN v32.
-- =====================================================================
