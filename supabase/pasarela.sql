-- =====================================================================
-- LIGUIFY ACADEMIAS — v48: Pasarela de pagos por EMPRESA (Fase 1: Culqi)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Cada empresa tiene su propia cuenta de pasarela (el dinero va directo a
-- su banco; Liguify solo orquesta). Las LLAVES viven en una tabla SIN
-- políticas de cliente: solo las Edge Functions (service role) las leen.
-- El padre paga desde una página pública (pagar.html?t=<token>) y el pago
-- nace APROBADO automáticamente (la pasarela certifica el cobro).
-- =====================================================================

create table if not exists academias.pasarelas (
  academia_id uuid primary key references academias.academias(id) on delete cascade,
  proveedor   text not null default 'culqi' check (proveedor in ('culqi', 'mercadopago')),
  pk_llave    text,               -- llave pública (va al navegador del padre)
  sk_llave    text,               -- llave SECRETA (solo service role; jamás al cliente)
  activo      boolean not null default false,
  updated_at  timestamptz default now()
);
alter table academias.pasarelas enable row level security;
-- Sin políticas: ni el staff puede leer la sk desde el cliente.

create table if not exists academias.pago_intentos (
  id          uuid primary key default gen_random_uuid(),
  academia_id uuid not null,
  jugador_id  uuid not null,
  tutor_id    uuid,
  token       text not null unique,      -- va en la URL pública del link de pago
  cargos      jsonb not null,            -- [{cargo_id, concepto, cat, tipo, monto}]
  monto       numeric(12,2) not null,    -- total exacto (sin pagos parciales)
  estado      text not null default 'pendiente' check (estado in ('pendiente','pagado','anulado','error')),
  charge_id   text,                      -- referencia del cobro en la pasarela
  pago_id     uuid,                      -- pago aprobado que generó
  creado_por  text,
  error       text,
  created_at  timestamptz default now(),
  pagado_at   timestamptz
);
alter table academias.pago_intentos enable row level security;
drop policy if exists pago_intentos_sel on academias.pago_intentos;
create policy pago_intentos_sel on academias.pago_intentos
  for select using (academia_id = academias.mi_academia());
-- Escrituras solo vía Edge Functions (service role).
create index if not exists idx_pago_intentos_token on academias.pago_intentos(token);

-- =====================================================================
-- FIN v48.
-- =====================================================================
