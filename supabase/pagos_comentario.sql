-- =====================================================================
-- LIGUIFY ACADEMIAS — v47: Comentario libre en el registro de pago
-- Ejecutar en el SQL Editor (Run). Idempotente.
-- Observación opcional al registrar un pago (p.ej. "pagó la mitad en
-- efectivo y la mitad por Yape", "trajo el voucher impreso"); visible
-- al aprobar en Tesorería y en el historial de pagos del alumno.
-- =====================================================================

alter table academias.pagos add column if not exists comentario text;

-- =====================================================================
-- FIN v47.
-- =====================================================================
