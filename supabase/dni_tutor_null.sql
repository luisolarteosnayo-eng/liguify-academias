-- =====================================================================
-- LIGUIFY ACADEMIAS — v24: DNI del tutor opcional (fuera los placeholders)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Los DNIs de relleno (0000, 000, S/D-…, menos de 8 dígitos) no son
-- información real: se convierten a NULL. El DNI del tutor pasa a ser
-- opcional; se completa con el dato real desde la ficha del alumno
-- (la app ya no genera placeholders ni reutiliza tutores sin DNI).
-- =====================================================================

alter table academias.tutores alter column dni_tutor drop not null;

update academias.tutores
   set dni_tutor = null
 where dni_tutor is not null
   and (dni_tutor ~ '^0+$'
        or dni_tutor ilike 'S/D%'
        or length(regexp_replace(dni_tutor, '\D', '', 'g')) < 8);

-- =====================================================================
-- FIN v24.
-- =====================================================================
