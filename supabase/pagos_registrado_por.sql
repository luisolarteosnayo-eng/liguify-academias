-- =====================================================================
-- LIGUIFY ACADEMIAS — v37: Quién registró el pago
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- El pago graba el usuario que lo registró; se muestra en la ventana de
-- Aprobar pagos (junto a la alerta de pago duplicado por medio + N° op).
-- =====================================================================

alter table academias.pagos add column if not exists registrado_por text;

-- =====================================================================
-- FIN v37.
-- =====================================================================
