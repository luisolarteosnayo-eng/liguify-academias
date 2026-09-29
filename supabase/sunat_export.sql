-- =====================================================================
-- LIGUIFY ACADEMIAS — v21: Marca de exportación a SUNAT en pagos
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Fecha en que el documento de pago fue exportado para la emisión del
-- comprobante fiscal (boleta/factura). Control anti doble emisión.
-- =====================================================================

alter table academias.pagos add column if not exists sunat_exportado date;

-- =====================================================================
-- FIN v21.
-- =====================================================================
