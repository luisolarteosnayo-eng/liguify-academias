-- =====================================================================
-- LIGUIFY ACADEMIAS — v41b: limpieza fina del teléfono legado del alumno
-- Ejecutar en el SQL Editor (Run) DESPUÉS del v41. Idempotente.
--
-- El reporte del v41 mostró que casi todos los "distintos" eran el MISMO
-- número con el prefijo +51 de más (51993487575 vs 993487575). Aquí se
-- compara por los ÚLTIMOS 9 DÍGITOS (el celular peruano real) y se limpia
-- también la basura ("+51" solo, "+51 000").
-- =====================================================================

-- a) Tutor con el placeholder 999888777 y alumno con número real:
--    el bueno es el del alumno (caso Luis Isaac Meza, Arequipa)
update academias.tutores t
   set telefono_celular = j.telefono
  from academias.jugadores j
 where j.tutor_id = t.id
   and regexp_replace(coalesce(t.telefono_celular, ''), '\D', '', 'g') like '%999888777'
   and length(regexp_replace(coalesce(j.telefono, ''), '\D', '', 'g')) >= 9;

-- b) Limpiar el teléfono del alumno cuando coincide con el del tutor en los
--    últimos 9 dígitos (la diferencia era solo el +51 o los espacios)
update academias.jugadores j
   set telefono = null
  from academias.tutores t
 where t.id = j.tutor_id
   and length(regexp_replace(coalesce(j.telefono, ''), '\D', '', 'g')) >= 9
   and right(regexp_replace(coalesce(j.telefono, ''), '\D', '', 'g'), 9)
     = right(regexp_replace(coalesce(t.telefono_celular, ''), '\D', '', 'g'), 9);

-- c) Limpiar basura: "+51" solo, "+51 000" y similares (menos de 9 dígitos)
update academias.jugadores
   set telefono = null
 where telefono is not null
   and length(regexp_replace(coalesce(telefono, ''), '\D', '', 'g')) < 9;

-- d) Lo que queda de verdad es distinto (¿segundo contacto? ¿número viejo?):
--    decide cuál es el bueno. El del TUTOR es el que usa la cobranza.
select j.id, j.nombre || ' ' || coalesce(j.apellido, '') as alumno,
       j.telefono as tel_alumno, t.nombres as tutor,
       t.telefono_celular as tel_tutor, s.nombre_sede
  from academias.jugadores j
  left join academias.tutores t on t.id = j.tutor_id
  left join academias.sedes s on s.id = j.sede_id
 where nullif(regexp_replace(coalesce(j.telefono, ''), '\D', '', 'g'), '') is not null
 order by s.nombre_sede, alumno;

-- =====================================================================
-- FIN v41b. Si en (d) decides que el número del TUTOR es el correcto,
-- limpia los restantes con:
--   update academias.jugadores set telefono = null where telefono is not null;
-- Si el correcto es el del ALUMNO, corrige el teléfono del tutor en la
-- ficha (sección Tutor) y vuelve a correr b).
-- =====================================================================
