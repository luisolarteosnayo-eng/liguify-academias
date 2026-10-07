-- =====================================================================
-- LIGUIFY ACADEMIAS — v35: Seguimiento de clase de prueba
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Bitácora de observaciones del prospecto (varias, con fecha y usuario):
-- el profesor anota en campo y ventas registra el segundo seguimiento.
-- jsonb: [{ fecha, usuario, texto }]
-- =====================================================================

alter table academias.jugadores add column if not exists seguimiento jsonb;

-- =====================================================================
-- FIN v35.
-- =====================================================================
