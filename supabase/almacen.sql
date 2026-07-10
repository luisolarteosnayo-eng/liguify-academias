-- =====================================================================
-- LIGUIFY ACADEMIAS — v5: Almacén (CNRs inventariables: uniformes, etc.)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Modelo: kardex de movimientos por sede/concepto/talla. El stock es
-- derivado: ingresos − salidas. Los pedidos generan un ingreso al
-- recibirse. Al asignar un CNR inventariable, la app verifica stock y
-- registra la salida (con jugador y cargo vinculados).
-- =====================================================================

create table if not exists academias.inv_pedidos (
  id              uuid primary key default gen_random_uuid(),
  academia_id     uuid not null references academias.academias(id),
  sede_id         uuid not null references academias.sedes(id),
  concepto_cnr_id uuid not null references academias.conceptos_cnr(id),
  talla           text,
  cantidad        int not null check (cantidad > 0),
  proveedor       text,
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente','recibido','anulado')),
  fecha           date not null default current_date,
  recibido_fecha  date,
  created_at      timestamptz not null default now()
);

create table if not exists academias.inv_movimientos (
  id              uuid primary key default gen_random_uuid(),
  academia_id     uuid not null references academias.academias(id),
  sede_id         uuid not null references academias.sedes(id),
  concepto_cnr_id uuid not null references academias.conceptos_cnr(id),
  talla           text,
  tipo            text not null check (tipo in ('ingreso','salida')),
  cantidad        int not null check (cantidad > 0),
  motivo          text,
  jugador_id      uuid references academias.jugadores(id),   -- salida por asignación
  cargo_id        uuid references academias.cargos(id),      -- CNR vinculado
  pedido_id       uuid references academias.inv_pedidos(id), -- ingreso por pedido
  fecha           date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists idx_invmov_sede_concepto
  on academias.inv_movimientos(sede_id, concepto_cnr_id);
create index if not exists idx_invped_sede_estado
  on academias.inv_pedidos(sede_id, estado);

alter table academias.inv_pedidos     enable row level security;
alter table academias.inv_movimientos enable row level security;

drop policy if exists p_inv_pedidos on academias.inv_pedidos;
create policy p_inv_pedidos on academias.inv_pedidos for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

drop policy if exists p_inv_movimientos on academias.inv_movimientos;
create policy p_inv_movimientos on academias.inv_movimientos for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

-- =====================================================================
-- FIN v5. Verificación: select count(*) from academias.inv_movimientos;
-- =====================================================================
