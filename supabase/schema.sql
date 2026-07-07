-- =====================================================================
-- LIGUIFY ACADEMIAS — Esquema de base de datos (FINAL)
-- Se instala en el MISMO proyecto Supabase que Liguify Torneos, dentro
-- del esquema Postgres "academias" (torneos vive en "public"; así las
-- tablas pagos/medios_pago de ambas apps no colisionan).
--
-- SaaS multi-tenant B2B. Montos DECIMAL(12,2). Moneda: soles. Sin float.
-- Jerarquía: Academia (tenant) -> Sede -> Track -> Inscripción
--            Tutor -> Jugador (Alumno)
--
-- Ejecutar completo en SQL Editor (Run). Es idempotente (IF NOT EXISTS).
-- =====================================================================

create schema if not exists academias;

-- ---------------------------------------------------------------------
-- MÓDULO I — Academia (Tenant Master) + Onboarding
-- ---------------------------------------------------------------------
create table if not exists academias.academias (
  id                uuid primary key default gen_random_uuid(),
  nombre_academia   text not null,
  slug_url          text not null unique,               -- app.liguify.com/<slug>
  ruc_dni           text,
  anio_fundacion    int,
  telefono          text,
  email_corporativo text,
  logo_url          text,
  color_primario    text,                               -- hex extraído del logo
  color_secundario  text,
  plan_suscripcion  text not null default 'starter'
                    check (plan_suscripcion in ('starter','pro','elite')),
  created_at        timestamptz not null default now()
);

-- Pasarelas / cuentas de recaudación (alias visibles; nunca secretos en claro)
create table if not exists academias.academia_pasarelas (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias.academias(id),
  proveedor     text check (proveedor in ('stripe','mercadopago','culqi','banco')),
  referencia    text,
  activo        boolean not null default true
);

-- ---------------------------------------------------------------------
-- MÓDULO II — Sedes (aislamiento operativo por sede)
-- ---------------------------------------------------------------------
create table if not exists academias.sedes (
  id                   uuid primary key default gen_random_uuid(),
  academia_id          uuid not null references academias.academias(id),
  nombre_sede          text not null,
  direccion_linea1     text,
  direccion_linea2     text,
  ciudad               text,
  pais                 text default 'Perú',
  telefono_coordinador text,
  google_maps_url      text,
  cabecera_url         text,                            -- imagen de cabecera del estado de cuenta
  activo               boolean not null default true
);

-- ---------------------------------------------------------------------
-- STAFF / Profesores (liquidación por sueldo fijo u horas)
-- ---------------------------------------------------------------------
create table if not exists academias.staff (
  id                uuid primary key default gen_random_uuid(),
  academia_id       uuid not null references academias.academias(id),
  sede_id           uuid references academias.sedes(id),
  nombres           text not null,
  apellidos         text not null,
  dni               text,
  rol               text not null default 'profesor'
                    check (rol in ('admin','coordinador','profesor','tesorero')),
  modalidad_pago    text check (modalidad_pago in ('sueldo_fijo','por_horas')),
  sueldo_fijo       decimal(12,2),
  tarifa_hora       decimal(12,2),
  activo            boolean not null default true
);

-- ---------------------------------------------------------------------
-- MÓDULO III — Tracks (unidad operativa/comercial) + break-even
-- ---------------------------------------------------------------------
create table if not exists academias.tracks (
  id                        uuid primary key default gen_random_uuid(),
  sede_id                   uuid not null references academias.sedes(id),
  linea_negocio             text not null default 'academia'
                            check (linea_negocio in ('academia','alto_rendimiento','arqueros')),
  nombre_track              text not null,              -- "2015 - 2016"
  capacidad_maxima          int not null default 20,
  mensualidad_sugerida      decimal(12,2) not null,
  clases_mensuales          int default 8,
  costo_mensual_cancha      decimal(12,2) not null default 0,
  costo_mensual_profesores  decimal(12,2) not null default 0,
  dias_horario              text,                       -- "Lun/Mié 18:00"
  activo                    boolean not null default true
  -- Derivados (en la app): costo_operacion = cancha + profesores;
  --   punto_equilibrio = ceil(costo_operacion / mensualidad_sugerida)
);

-- Cuerpo técnico: muchos-a-muchos Track <-> Staff
create table if not exists academias.track_staff (
  track_id   uuid not null references academias.tracks(id),
  staff_id   uuid not null references academias.staff(id),
  primary key (track_id, staff_id)
);

-- ---------------------------------------------------------------------
-- MÓDULO IV — Tutores y Jugadores (alumnos)
-- ---------------------------------------------------------------------
create table if not exists academias.tutores (
  id                uuid primary key default gen_random_uuid(),
  academia_id       uuid not null references academias.academias(id),
  nombres           text,
  dni_tutor         text not null,
  telefono_celular  text not null,
  email_tutor       text,                               -- nulo en registro inicial (onboarding progresivo)
  perfil_reclamado  boolean not null default false,     -- reclamado con DNI+teléfono (doble factor)
  created_at        timestamptz not null default now(),
  unique (academia_id, dni_tutor)
);

create table if not exists academias.jugadores (
  id                  uuid primary key default gen_random_uuid(),
  tutor_id            uuid not null references academias.tutores(id),
  sede_id             uuid references academias.sedes(id),  -- el alumno pertenece a una sede
  nombre              text not null,
  apellido            text not null,
  sexo                text default 'M' check (sexo in ('M','F')),
  fecha_nacimiento    date not null,
  categoria_inmutable int not null,                     -- año extraído; NO editable
  fecha_registro      date not null default current_date,
  foto_url            text,
  -- Indumentaria / ficha deportiva (opcionales)
  talla_camiseta      text,
  talla_short         text,
  numero_camiseta     int,
  nombre_camiseta     text,
  posicion_juego      text,
  pierna_habil        text check (pierna_habil in ('derecha','izquierda','ambidiestro')),
  -- Info médica (opcional)
  tipo_sangre         text,
  notas_medicas       text,
  historial_lesiones  text,
  alergias            text,
  otras_actividades   text,
  estado_alumno       text not null default 'activo'
                      check (estado_alumno in ('activo','baja')),
  created_at          timestamptz not null default now()
);

-- 6 atributos técnicos del cromo. Historial por evaluación.
create table if not exists academias.jugador_atributos (
  id            uuid primary key default gen_random_uuid(),
  jugador_id    uuid not null references academias.jugadores(id),
  velocidad     int check (velocidad between 0 and 100),
  potencia      int check (potencia between 0 and 100),
  agilidad      int check (agilidad between 0 and 100),
  tecnica       int check (tecnica between 0 and 100),
  pase          int check (pase between 0 and 100),
  defensa       int check (defensa between 0 and 100),
  evaluado_por  uuid references academias.staff(id),
  evaluado_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Inscripción (Jugador <-> Track) = DEFINICIÓN de un Cargo Recurrente (CR)
-- ---------------------------------------------------------------------
create table if not exists academias.inscripciones (
  id                          uuid primary key default gen_random_uuid(),
  jugador_id                  uuid not null references academias.jugadores(id),
  track_id                    uuid not null references academias.tracks(id),
  fecha_inscripcion           date not null default current_date,
  costo_mensual_personalizado decimal(12,2),            -- null => mensualidad_sugerida del track
  ultima_fecha_corte          date,                     -- fin del último ciclo CR generado
  ciclo_dia                   int,                      -- ciclo recordado para la generación periódica
  activo                      boolean not null default true,
  unique (jugador_id, track_id)
);

-- ---------------------------------------------------------------------
-- MÓDULO VI — Tesorería: catálogos configurables por academia
-- ---------------------------------------------------------------------
create table if not exists academias.conceptos_cnr (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias.academias(id),
  nombre        text not null,                          -- Uniforme, Matrícula, Inscripción torneo...
  precio        decimal(12,2) not null default 0,
  maneja_stock  boolean not null default false,
  es_torneo     boolean not null default false,
  activo        boolean not null default true
);

create table if not exists academias.medios_pago (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias.academias(id),
  nombre        text not null,                          -- Efectivo, Yape, Plin, Transferencia...
  activo        boolean not null default true
);

-- Ciclos de pago: día de corte + día de vencimiento (dentro del mes del ciclo)
create table if not exists academias.ciclos_pago (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias.academias(id),
  dia           int not null check (dia between 1 and 28),
  dia_venc      int check (dia_venc between 1 and 28),
  es_default    boolean not null default false,
  activo        boolean not null default true
);

-- Promociones NxM: N meses total, M pagados; los últimos (N−M) van gratis.
create table if not exists academias.promociones (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias.academias(id),
  nombre        text not null,                          -- "3x2"
  meses_total   int not null,
  meses_pagados int not null,
  activo        boolean not null default true
);

-- Procesos de generación masiva de CR por ciclo (auditoría) — antes que cargos (FK)
create table if not exists academias.procesos_facturacion (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias.academias(id),
  sede_id       uuid references academias.sedes(id),
  ciclo_dia     int not null,
  corte         date not null,
  vencimiento   date not null,
  total_crs     int not null default 0,
  total_monto   decimal(12,2) not null default 0,
  created_by    uuid,
  created_at    timestamptz not null default now()
);

-- Cargo (deuda) de un alumno. tipo: CR (mensualidad) | CNR (eventual).
create table if not exists academias.cargos (
  id              uuid primary key default gen_random_uuid(),
  tutor_id        uuid not null references academias.tutores(id),
  jugador_id      uuid references academias.jugadores(id),
  inscripcion_id  uuid references academias.inscripciones(id),
  tipo            text not null default 'CR' check (tipo in ('CR','CNR')),
  origen          text check (origen in ('manual','proceso','promo')),
  proceso_id      uuid references academias.procesos_facturacion(id),
  concepto_cnr_id uuid references academias.conceptos_cnr(id),
  concepto        text not null,                        -- CR: nombre del track · CNR: nombre del concepto
  descripcion     text,                                 -- CR: "Del <ini> al <fin>" · CNR: detalle
  periodo         text,                                 -- "2026-07"
  ciclo_inicio    date,
  ciclo_fin       date,                                 -- fecha de corte del CR
  ciclo_dia       int,
  fecha_vencimiento date,
  promo_id        uuid references academias.promociones(id),
  gratis          boolean not null default false,       -- mes gratis de promo (monto 0)
  monto           decimal(12,2) not null,
  pagado_monto    decimal(12,2) not null default 0,
  estado          text not null default 'por_pagar'
                  check (estado in ('por_pagar','vencido','pagado','parcial')),
  created_at      timestamptz not null default now()
);

-- Documento de pago / abono. Voucher obligatorio salvo efectivo en caja.
-- Flujo: pendiente -> aprobado | rechazado (al rechazar, los cargos vuelven a por_pagar).
create table if not exists academias.pagos (
  id               uuid primary key default gen_random_uuid(),
  tutor_id         uuid not null references academias.tutores(id),
  jugador_id       uuid references academias.jugadores(id),
  sede_id          uuid references academias.sedes(id),
  fecha            date not null default current_date,
  monto            decimal(12,2) not null,
  medio_pago_id    uuid references academias.medios_pago(id),
  medio            text,                                -- nombre del medio al momento del pago (editable al aprobar)
  num_operacion    text,
  voucher_url      text,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente','aprobado','rechazado')),
  created_by       uuid,
  created_at       timestamptz not null default now(),
  processed_by     uuid,
  processed_at     timestamptz,
  rejection_reason text
);

-- Detalle: aplicación de un pago a uno o varios cargos (soporta parciales y montos S/ 0)
create table if not exists academias.pago_cargo (
  pago_id   uuid not null references academias.pagos(id),
  cargo_id  uuid not null references academias.cargos(id),
  monto     decimal(12,2) not null,
  primary key (pago_id, cargo_id)
);

-- Libro mayor: egresos manuales (proveedores, materiales, nómina)
create table if not exists academias.egresos (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias.academias(id),
  sede_id       uuid references academias.sedes(id),
  concepto      text not null
                check (concepto in ('cancha','materiales','uniformes','nomina','otro')),
  descripcion   text,
  periodo       text,
  monto         decimal(12,2) not null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MÓDULO V — Asistencias (4 estados) + liquidación de staff
-- ---------------------------------------------------------------------
create table if not exists academias.asistencias (
  id             uuid primary key default gen_random_uuid(),
  track_id       uuid not null references academias.tracks(id),
  jugador_id     uuid not null references academias.jugadores(id),
  fecha          date not null default current_date,
  estado         text not null default 'presente'
                 check (estado in ('presente','ausente','tardanza','justificado')),
  notas          text,
  registrado_por uuid references academias.staff(id),
  created_at     timestamptz not null default now(),
  unique (track_id, jugador_id, fecha)
);

create table if not exists academias.asistencias_staff (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid not null references academias.staff(id),
  track_id      uuid references academias.tracks(id),
  fecha         date not null default current_date,
  estado        text not null default 'presente'
                check (estado in ('presente','ausente','tardanza','justificado')),
  horas         decimal(5,2),
  penalidad     decimal(12,2) default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices para las consultas frecuentes de la app
-- ---------------------------------------------------------------------
create index if not exists idx_sedes_academia       on academias.sedes(academia_id);
create index if not exists idx_tracks_sede          on academias.tracks(sede_id);
create index if not exists idx_jugadores_tutor      on academias.jugadores(tutor_id);
create index if not exists idx_jugadores_sede       on academias.jugadores(sede_id);
create index if not exists idx_insc_jugador         on academias.inscripciones(jugador_id);
create index if not exists idx_insc_track           on academias.inscripciones(track_id);
create index if not exists idx_cargos_jugador       on academias.cargos(jugador_id);
create index if not exists idx_cargos_estado        on academias.cargos(estado);
create index if not exists idx_cargos_venc          on academias.cargos(fecha_vencimiento);
create index if not exists idx_pagos_jugador        on academias.pagos(jugador_id);
create index if not exists idx_pagos_estado         on academias.pagos(estado);
create index if not exists idx_pagos_fecha          on academias.pagos(fecha);
create index if not exists idx_asis_track_fecha     on academias.asistencias(track_id, fecha);

-- ---------------------------------------------------------------------
-- Seguridad (RLS)
-- Se habilita RLS en TODAS las tablas. De momento sin políticas: nadie
-- accede con la anon key hasta que se implemente la autenticación de la
-- app y se definan las políticas multi-tenant (aislar por academia_id,
-- y por sede_id para roles locales), reusando el patrón de torneos.
-- ---------------------------------------------------------------------
alter table academias.academias            enable row level security;
alter table academias.academia_pasarelas   enable row level security;
alter table academias.sedes                enable row level security;
alter table academias.staff                enable row level security;
alter table academias.tracks               enable row level security;
alter table academias.track_staff          enable row level security;
alter table academias.tutores              enable row level security;
alter table academias.jugadores            enable row level security;
alter table academias.jugador_atributos    enable row level security;
alter table academias.inscripciones        enable row level security;
alter table academias.conceptos_cnr        enable row level security;
alter table academias.medios_pago          enable row level security;
alter table academias.ciclos_pago          enable row level security;
alter table academias.promociones          enable row level security;
alter table academias.procesos_facturacion enable row level security;
alter table academias.cargos               enable row level security;
alter table academias.pagos                enable row level security;
alter table academias.pago_cargo           enable row level security;
alter table academias.egresos              enable row level security;
alter table academias.asistencias          enable row level security;
alter table academias.asistencias_staff    enable row level security;

-- Grants para que PostgREST pueda ver el esquema cuando se exponga en
-- Project Settings -> API -> Exposed schemas (agregar "academias").
grant usage on schema academias to anon, authenticated, service_role;
grant all on all tables in schema academias to anon, authenticated, service_role;
alter default privileges in schema academias
  grant all on tables to anon, authenticated, service_role;

-- =====================================================================
-- FIN. Verifica en Table Editor (selector de schema: academias) que las
-- 21 tablas existan. RLS activo: sin políticas todavía = sin acceso anon.
-- =====================================================================
