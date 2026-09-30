-- =====================================================================
-- LIGUIFY ACADEMIAS — v23: Recordatorio de cobro por WhatsApp
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Fecha del último recordatorio de cobro enviado al tutor por WhatsApp
-- desde la pantalla Por cobrar (control de seguimiento de cobranza).
-- =====================================================================

alter table academias.jugadores add column if not exists ultimo_recordatorio date;

-- =====================================================================
-- FIN v23.
-- =====================================================================
