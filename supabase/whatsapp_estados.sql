-- =====================================================================
-- LIGUIFY ACADEMIAS — v43: Estados de cobranza en la bandeja WhatsApp
-- Ejecutar en el SQL Editor (Run) DESPUÉS del v42. Idempotente.
--
-- Reemplaza el respondida/pendiente del v42 por los estados reales de
-- seguimiento de cobranza:
--   sin_respuesta   → el cliente escribió y nadie lo ha atendido
--                     (el webhook lo pone SIEMPRE que entra un mensaje)
--   pago            → PAGÓ (voucher recibido)
--   pagara_cancha   → PAGARÁ EN CANCHA
--   pendiente_pago  → PENDIENTE DE PAGO (se pone solo al enviar recordatorio)
-- =====================================================================

alter table academias.wsp_conversaciones drop constraint if exists wsp_conversaciones_marcada_check;

update academias.wsp_conversaciones
   set marcada = case when marcada = 'pendiente' then 'sin_respuesta' else null end
 where marcada in ('pendiente', 'respondida');

alter table academias.wsp_conversaciones add constraint wsp_conversaciones_marcada_check
  check (marcada in ('sin_respuesta', 'pago', 'pagara_cancha', 'pendiente_pago'));

-- =====================================================================
-- FIN v43.
-- =====================================================================
