-- =====================================================================
-- LIGUIFY ACADEMIAS — v38: WhatsApp Cloud API (bandeja de cobranzas)
-- Ejecutar en el SQL Editor (Run). Idempotente.
--
-- Conversaciones y mensajes del número de WhatsApp de la PLATAFORMA
-- (Cloud API de Meta, sin Twilio). El webhook (service role) escribe;
-- cada academia lee solo lo suyo (RLS). Los mensajes entrantes sin
-- tutor identificado quedan con academia_id NULL (solo visibles por
-- SQL, para diagnóstico).
-- =====================================================================

create table if not exists academias.wsp_conversaciones (
  id                 uuid primary key default gen_random_uuid(),
  academia_id        uuid references academias.academias(id),
  sede_id            uuid,
  tutor_id           uuid,
  jugador_id         uuid,
  telefono           text not null,              -- wa_id del cliente (p.ej. 519XXXXXXXX)
  nombre             text,                       -- nombre del perfil de WhatsApp
  ultimo_mensaje     text,
  ultimo_mensaje_at  timestamptz,
  ultimo_entrante_at timestamptz,                -- para la ventana de 24h
  no_leidos          int not null default 0,
  created_at         timestamptz not null default now(),
  unique (telefono, academia_id)
);
create index if not exists idx_wsp_conv_academia on academias.wsp_conversaciones(academia_id, ultimo_mensaje_at desc);

create table if not exists academias.wsp_mensajes (
  id              uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references academias.wsp_conversaciones(id),
  academia_id     uuid,
  direccion       text not null,                 -- 'in' | 'out'
  tipo            text not null default 'texto', -- texto | imagen | documento | plantilla
  cuerpo          text,
  media_path      text,                          -- 'vstore:wsp/...' en el bucket privado
  wa_id           text unique,                   -- id del mensaje en WhatsApp (dedupe)
  enviado_por     text,                          -- usuario que respondió / 'auto' / null (cliente)
  estado          text,                          -- sent | delivered | read | failed (salientes)
  created_at      timestamptz not null default now()
);
create index if not exists idx_wsp_msj_conv on academias.wsp_mensajes(conversacion_id, created_at);

alter table academias.wsp_conversaciones enable row level security;
drop policy if exists p_wsp_conv on academias.wsp_conversaciones;
create policy p_wsp_conv on academias.wsp_conversaciones for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

alter table academias.wsp_mensajes enable row level security;
drop policy if exists p_wsp_msj on academias.wsp_mensajes;
create policy p_wsp_msj on academias.wsp_mensajes for all to authenticated
  using (academia_id = (select academias.mi_academia()))
  with check (academia_id = (select academias.mi_academia()));

-- WhatsApp propio de cada sede: destino de las respuestas sugerido en los
-- avisos (botón "responder a la academia") y del auto-reply del webhook
alter table academias.sedes add column if not exists whatsapp_respuestas text;

-- =====================================================================
-- FIN v38.
-- =====================================================================
