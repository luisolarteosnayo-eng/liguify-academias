-- =====================================================================
-- LIGUIFY ACADEMIAS — v19: Concepto de gasto libre en egresos
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Los conceptos de gasto ahora son configurables (v18), así que el
-- CHECK legado de egresos.concepto ('cancha','materiales',...) sobra:
-- bloqueaba el registro de gastos con conceptos del catálogo.
-- =====================================================================

alter table academias.egresos drop constraint if exists egresos_concepto_check;

-- =====================================================================
-- FIN v19.
-- =====================================================================
