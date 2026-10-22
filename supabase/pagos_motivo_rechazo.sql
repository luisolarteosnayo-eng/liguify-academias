-- =====================================================================
-- LIGUIFY ACADEMIAS — v49: Motivo del rechazo de un pago
-- Ejecutar en el SQL Editor (Run). Idempotente.
-- Al rechazar en Tesorería el motivo es OBLIGATORIO y queda visible en el
-- historial de pagos del alumno (voucher ilegible, monto no coincide…).
-- La observación al APROBAR se suma al campo comentario ya existente.
-- =====================================================================

alter table academias.pagos add column if not exists motivo_rechazo text;

-- =====================================================================
-- FIN v49.
-- =====================================================================
