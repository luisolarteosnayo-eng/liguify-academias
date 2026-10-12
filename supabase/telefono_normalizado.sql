-- =====================================================================
-- LIGUIFY ACADEMIAS — v39: Teléfono del tutor normalizado (solo dígitos)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Los teléfonos se guardan con espacios/+ ("989 229 154"); el match de
-- WhatsApp (webhook y envío) necesita compararlos como dígitos puros.
-- Columna GENERADA: se mantiene sola, sin tocar la app.
-- =====================================================================

alter table academias.tutores add column if not exists telefono_norm text
  generated always as (regexp_replace(coalesce(telefono_celular, ''), '\D', '', 'g')) stored;

create index if not exists idx_tutores_tel_norm on academias.tutores(telefono_norm);

-- =====================================================================
-- FIN v39.
-- =====================================================================
