-- =====================================================================
-- LIGUIFY ACADEMIAS — v51: Control del recordatorio masivo POR NÚMERO
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- La regla "no repetir en 7 días" era por alumno: si se agregaba el 2do
-- celular (papá/mamá) después de un envío, el número nuevo quedaba
-- bloqueado. Ahora se guarda A QUÉ números se les envió: el masivo
-- reaparece para el alumno y sale SOLO a los celulares pendientes.
-- =====================================================================

alter table academias.jugadores add column if not exists recordatorio_tels jsonb;

-- =====================================================================
-- FIN v51.
-- =====================================================================
