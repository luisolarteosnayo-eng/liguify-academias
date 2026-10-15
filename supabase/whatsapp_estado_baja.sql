-- =====================================================================
-- LIGUIFY ACADEMIAS — v45: Estado DADO DE BAJA en la bandeja WhatsApp
-- Ejecutar en el SQL Editor (Run). Idempotente.
-- =====================================================================

alter table academias.wsp_conversaciones drop constraint if exists wsp_conversaciones_marcada_check;

alter table academias.wsp_conversaciones add constraint wsp_conversaciones_marcada_check
  check (marcada in ('sin_respuesta', 'pago', 'pagara_cancha', 'pendiente_pago', 'baja'));

-- =====================================================================
-- FIN v45.
-- =====================================================================
