-- =====================================================================
-- LIGUIFY ACADEMIAS — v29: Atributos CONTROL y TOMA DE DECISIONES
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Defensa se reemplaza por Control (los valores existentes migran) y
-- se agrega Toma de decisiones. La columna defensa se conserva como
-- dato legado (ya no se captura).
-- =====================================================================

alter table academias.evaluaciones add column if not exists control int;
alter table academias.evaluaciones add column if not exists decisiones int;

-- Migrar: defensa → control en evaluaciones existentes
update academias.evaluaciones
   set control = defensa
 where control is null and defensa is not null;

-- Migrar el cromo del alumno (jsonb): defensa → control
update academias.jugadores
   set atributos = (atributos - 'defensa') || jsonb_build_object('control', atributos->'defensa')
 where atributos ? 'defensa' and not (atributos ? 'control');

-- =====================================================================
-- FIN v29.
-- =====================================================================
