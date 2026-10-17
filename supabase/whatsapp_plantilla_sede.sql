-- =====================================================================
-- LIGUIFY ACADEMIAS — v46: Plantilla VIP de WhatsApp por sede
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Sedes VIP pueden usar su propia plantilla de cobranza con CABECERA DE
-- IMAGEN (marketing). tpl_cobranza = nombre de la plantilla aprobada en
-- Meta (vacío = la estándar cobranza_liguify_v2); tpl_imagen_url = URL
-- pública de la imagen que se envía como cabecera en cada recordatorio.
-- =====================================================================

alter table academias.sedes add column if not exists tpl_cobranza text;
alter table academias.sedes add column if not exists tpl_imagen_url text;

-- =====================================================================
-- FIN v46.
-- =====================================================================
