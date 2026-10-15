-- =====================================================================
-- LIGUIFY ACADEMIAS — v41: El celular es del TUTOR, no del alumno
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Los datos migrados (p.ej. Sporting Cristal Surco) traían el celular en
-- jugadores.telefono. La app siempre guarda el celular en el tutor; este
-- script mueve el dato legado a tutores.telefono_celular y limpia la
-- ficha del alumno. La columna jugadores.telefono queda (vacía) por
-- compatibilidad, pero ya nada la escribe.
-- =====================================================================

-- 1) Pasar el celular de la ficha del alumno al TUTOR que no tiene teléfono
update academias.tutores t
   set telefono_celular = j.telefono
  from (
    select distinct on (tutor_id) tutor_id, telefono
      from academias.jugadores
     where tutor_id is not null
       and nullif(regexp_replace(coalesce(telefono, ''), '\D', '', 'g'), '') is not null
     order by tutor_id, id
  ) j
 where t.id = j.tutor_id
   and nullif(regexp_replace(coalesce(t.telefono_celular, ''), '\D', '', 'g'), '') is null;

-- 2) Limpiar el teléfono del alumno cuando el tutor ya tiene ese mismo número
--    (incluye los recién migrados en el paso 1)
update academias.jugadores j
   set telefono = null
  from academias.tutores t
 where t.id = j.tutor_id
   and nullif(regexp_replace(coalesce(j.telefono, ''), '\D', '', 'g'), '') is not null
   and regexp_replace(coalesce(t.telefono_celular, ''), '\D', '', 'g')
     = regexp_replace(coalesce(j.telefono, ''), '\D', '', 'g');

-- 3) Lo que queda es para revisar a mano: alumno con un número DISTINTO al de
--    su tutor (¿cuál es el bueno?) o alumno con teléfono pero sin tutor.
select j.id, j.nombre || ' ' || coalesce(j.apellido, '') as alumno,
       j.telefono as tel_alumno, t.nombres as tutor,
       t.telefono_celular as tel_tutor, s.nombre_sede
  from academias.jugadores j
  left join academias.tutores t on t.id = j.tutor_id
  left join academias.sedes s on s.id = j.sede_id
 where nullif(regexp_replace(coalesce(j.telefono, ''), '\D', '', 'g'), '') is not null
 order by s.nombre_sede, alumno;

-- =====================================================================
-- FIN v41. Si el paso 3 devuelve filas, corrige el teléfono del tutor en
-- la ficha del alumno (sección Tutor) y vuelve a correr los pasos 2 y 3.
-- =====================================================================
