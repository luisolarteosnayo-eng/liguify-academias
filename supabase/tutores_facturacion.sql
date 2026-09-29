-- =====================================================================
-- LIGUIFY ACADEMIAS — v22: Datos de facturación del tutor
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- nombres ya existía; se agregan RUC y razón social para los casos
-- que piden FACTURA (la exportación SUNAT los usa: tutor con RUC
-- exporta como FACTURA con razón social; sin RUC, BOLETA con nombre).
-- =====================================================================

alter table academias.tutores add column if not exists ruc text;
alter table academias.tutores add column if not exists razon_social text;

-- =====================================================================
-- FIN v22.
-- =====================================================================
