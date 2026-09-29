-- =====================================================================
-- LIGUIFY ACADEMIAS — v20: Imágenes en Supabase Storage
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Las fotos de alumnos y logos van al bucket PÚBLICO 'academias-media'
-- (la fila guarda la URL); los vouchers de pago al bucket PRIVADO
-- 'academias-vouchers' (la fila guarda 'vstore:<ruta>' y se visualiza
-- con URL firmada). Esto saca los base64 de las filas y acelera la
-- carga inicial del sistema.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('academias-media', 'academias-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('academias-vouchers', 'academias-vouchers', false)
on conflict (id) do nothing;

-- Media pública: cualquiera puede leer; solo usuarios autenticados escriben
drop policy if exists p_acadmedia_select on storage.objects;
create policy p_acadmedia_select on storage.objects for select
  using (bucket_id = 'academias-media');
drop policy if exists p_acadmedia_insert on storage.objects;
create policy p_acadmedia_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'academias-media');
drop policy if exists p_acadmedia_update on storage.objects;
create policy p_acadmedia_update on storage.objects for update to authenticated
  using (bucket_id = 'academias-media') with check (bucket_id = 'academias-media');
drop policy if exists p_acadmedia_delete on storage.objects;
create policy p_acadmedia_delete on storage.objects for delete to authenticated
  using (bucket_id = 'academias-media');

-- Vouchers privados: solo usuarios autenticados (lectura vía URL firmada)
drop policy if exists p_acadvouchers_select on storage.objects;
create policy p_acadvouchers_select on storage.objects for select to authenticated
  using (bucket_id = 'academias-vouchers');
drop policy if exists p_acadvouchers_insert on storage.objects;
create policy p_acadvouchers_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'academias-vouchers');
drop policy if exists p_acadvouchers_update on storage.objects;
create policy p_acadvouchers_update on storage.objects for update to authenticated
  using (bucket_id = 'academias-vouchers') with check (bucket_id = 'academias-vouchers');
drop policy if exists p_acadvouchers_delete on storage.objects;
create policy p_acadvouchers_delete on storage.objects for delete to authenticated
  using (bucket_id = 'academias-vouchers');

-- =====================================================================
-- FIN v20.
-- =====================================================================
