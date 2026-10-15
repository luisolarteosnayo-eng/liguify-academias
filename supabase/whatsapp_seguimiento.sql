-- =====================================================================
-- LIGUIFY ACADEMIAS — v42: Seguimiento manual de conversaciones WhatsApp
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- La bandeja calcula "Por responder" automáticamente (el último movimiento
-- fue del tutor). Esta marca manual permite cerrar una conversación que no
-- necesita respuesta (una reacción, un "gracias") o reabrirla:
--   marcada = 'respondida' | 'pendiente' | null (null = automático)
-- El webhook la limpia cuando entra un mensaje nuevo (vuelve al automático).
-- =====================================================================

alter table academias.wsp_conversaciones add column if not exists marcada text
  check (marcada in ('respondida', 'pendiente'));

-- =====================================================================
-- FIN v42.
-- =====================================================================
