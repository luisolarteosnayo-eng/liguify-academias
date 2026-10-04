-- =====================================================================
-- LIGUIFY ACADEMIAS — v34: Facturación electrónica (SUNAT)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- · El medio de pago define si sus pagos emiten boleta/factura en SUNAT
--   o solo un recibo simple (genera_sunat).
-- · El RUC emisor, la razón social, y las series con su correlativo se
--   configuran POR SEDE (sedes de una misma empresa pueden compartir
--   RUC, pero cada sede lleva su serie).
-- · El pago guarda el comprobante emitido: tipo, serie-número, enlaces
--   al PDF/XML de SUNAT y el estado de la emisión.
-- =====================================================================

alter table academias.medios_pago add column if not exists genera_sunat boolean default false;

alter table academias.sedes add column if not exists ruc_emisor text;
alter table academias.sedes add column if not exists razon_social_emisor text;
alter table academias.sedes add column if not exists direccion_fiscal text;
alter table academias.sedes add column if not exists serie_boleta text;
alter table academias.sedes add column if not exists serie_factura text;
alter table academias.sedes add column if not exists correlativo_boleta int;
alter table academias.sedes add column if not exists correlativo_factura int;
alter table academias.sedes add column if not exists correlativo_recibo int;

alter table academias.pagos add column if not exists doc_tipo text;
alter table academias.pagos add column if not exists doc_serie text;
alter table academias.pagos add column if not exists doc_numero int;
alter table academias.pagos add column if not exists doc_pdf_url text;
alter table academias.pagos add column if not exists doc_xml_url text;
alter table academias.pagos add column if not exists sunat_estado text;
alter table academias.pagos add column if not exists sunat_error text;
alter table academias.pagos add column if not exists emitido_at timestamptz;

-- =====================================================================
-- FIN v34.
-- =====================================================================
