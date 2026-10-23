-- =====================================================================
-- LIGUIFY ACADEMIAS — v50: Segundo celular del tutor (papá y mamá)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Un alumno puede tener dos contactos de cobranza. El recordatorio masivo
-- envía a AMBOS números, y el webhook reconoce al tutor por cualquiera de
-- los dos (la respuesta de papá o mamá cae en la misma conversación).
-- =====================================================================

alter table academias.tutores add column if not exists telefono_celular2 text;

alter table academias.tutores add column if not exists telefono2_norm text
  generated always as (regexp_replace(coalesce(telefono_celular2, ''), '\D', '', 'g')) stored;

create index if not exists idx_tutores_tel2_norm on academias.tutores(telefono2_norm);

-- =====================================================================
-- FIN v50.
-- =====================================================================
