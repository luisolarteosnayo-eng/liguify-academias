-- =====================================================================
-- LIGUIFY ACADEMIAS — v40: Teléfono del ALUMNO normalizado (solo dígitos)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- La cobranza por WhatsApp usa el celular del tutor O, si no tiene, el de
-- la ficha del alumno (común en datos migrados, p.ej. Sporting Cristal
-- Surco). Las funciones whatsapp-enviar y whatsapp-entrante necesitan
-- poder matchear también jugadores.telefono como dígitos puros.
-- =====================================================================

alter table academias.jugadores add column if not exists telefono_norm text
  generated always as (regexp_replace(coalesce(telefono, ''), '\D', '', 'g')) stored;

create index if not exists idx_jugadores_tel_norm on academias.jugadores(telefono_norm);

-- =====================================================================
-- FIN v40.
-- =====================================================================
