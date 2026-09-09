-- =====================================================================
-- LIGUIFY ACADEMIAS — v8: Independencia total por sede
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- 1) Gastos por sede: la tabla egresos gana fecha (el módulo de Gastos
--    ya existe en la app; la utilidad real = ingresos − gastos).
-- 2) Catálogos financieros por sede: conceptos CNR, medios de pago,
--    ciclos y promociones pueden ser de UNA sede o compartidos.
--    sede_id NULL = compartido con todas las sedes (los datos actuales
--    quedan compartidos; no se pierde nada).
-- =====================================================================

alter table academias.egresos add column if not exists fecha date default current_date;

alter table academias.conceptos_cnr add column if not exists sede_id uuid references academias.sedes(id);
alter table academias.medios_pago   add column if not exists sede_id uuid references academias.sedes(id);
alter table academias.ciclos_pago   add column if not exists sede_id uuid references academias.sedes(id);
alter table academias.promociones   add column if not exists sede_id uuid references academias.sedes(id);

-- =====================================================================
-- FIN v8.
-- =====================================================================
