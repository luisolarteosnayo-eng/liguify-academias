-- =====================================================================
-- FASE A · SINCRONIZACIÓN ACADEMIAS → COMPETENCIAS (estructura de datos)
-- El alumno gana identidad completa para poder importarlo al maestro de
-- jugadores de Competencias (llave global país+documento):
--  · pais_documento (el tipo/num_documento ya existen en producción)
--  · fotos del documento (frontal/reverso) en el bucket PRIVADO 'documentos'
--    bajo el prefijo jugadores/ (mismo bucket y política que Competencias)
--  · consentimiento de imagen (+fecha) — en torneos la foto sale a color
-- El documento NO es obligatorio al crear el alumno; SÍ lo será para
-- importarlo a Competencias.
-- Ejecutar en Supabase SQL Editor.
-- =====================================================================

alter table academias.jugadores
  add column if not exists tipo_documento        text,   -- ya existe en prod (no-op)
  add column if not exists num_documento         text,   -- ya existe en prod (no-op)
  add column if not exists telefono              text,   -- ya existe en prod (no-op)
  add column if not exists pais_documento        text not null default 'PE',
  add column if not exists doc_scan_frente_url   text,   -- RUTA en bucket privado 'documentos'
  add column if not exists doc_scan_reverso_url  text,
  add column if not exists consentimiento_imagen boolean not null default false,
  add column if not exists consentimiento_fecha  timestamptz;

-- Búsquedas por documento (emparejar con el maestro de Competencias)
create index if not exists jugadores_num_documento_idx
  on academias.jugadores (pais_documento, num_documento)
  where num_documento is not null;

notify pgrst, 'reload schema';
