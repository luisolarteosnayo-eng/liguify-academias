-- =====================================================================
-- MÓDULO DE ACADEMIAS — Esquema BORRADOR (alineado a la Especificación Funcional)
-- SaaS multi-tenant B2B. Montos DECIMAL(12,2). Moneda: soles. Sin float.
-- Jerarquía: Academia (tenant) -> Sede -> Track -> Inscripción
--            Tutor -> Jugador (Alumno)
-- =====================================================================

-- ---------------------------------------------------------------------
-- MÓDULO I — Academia (Tenant Master) + Onboarding
-- ---------------------------------------------------------------------
create table academias (
  id                uuid primary key default gen_random_uuid(),
  nombre_academia   text not null,
  slug_url          text not null unique,               -- app.tusport.com/<slug>
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

-- Pasarelas / cuentas de recaudación (llaves API, cuentas bancarias)
create table academia_pasarelas (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id),
  proveedor     text check (proveedor in ('stripe','mercadopago','culqi','banco')),
  referencia    text,                                   -- alias/cuenta (no guardar secretos en claro)
  activo        boolean not null default true
);

-- ---------------------------------------------------------------------
-- MÓDULO II — Sedes (aislamiento operativo por sede)
-- ---------------------------------------------------------------------
create table sedes (
  id                   uuid primary key default gen_random_uuid(),
  academia_id          uuid not null references academias(id),
  nombre_sede          text not null,
  direccion_linea1     text,
  direccion_linea2     text,
  ciudad               text,
  pais                 text default 'Perú',
  telefono_coordinador text,
  google_maps_url      text,
  activo               boolean not null default true
);

-- ---------------------------------------------------------------------
-- STAFF / Profesores (liquidación por sueldo fijo u horas)
-- ---------------------------------------------------------------------
create table staff (
  id                uuid primary key default gen_random_uuid(),
  academia_id       uuid not null references academias(id),
  sede_id           uuid references sedes(id),
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
create table tracks (
  id                        uuid primary key default gen_random_uuid(),
  sede_id                   uuid not null references sedes(id),
  linea_negocio             text not null default 'academia'
                            check (linea_negocio in ('academia','alto_rendimiento','arqueros')),
  nombre_track              text not null,              -- "2020 - 2019"
  capacidad_maxima          int not null default 20,
  mensualidad_sugerida      decimal(12,2) not null,
  clases_mensuales          int default 8,
  costo_mensual_cancha      decimal(12,2) not null default 0,
  costo_mensual_profesores  decimal(12,2) not null default 0,
  dias_horario              text,                       -- "Lun/Mié 18:00" (texto por ahora)
  activo                    boolean not null default true
  -- Derivados (calculados en la app / vistas):
  --   costo_operacion   = costo_mensual_cancha + costo_mensual_profesores
  --   punto_equilibrio  = ceil(costo_operacion / mensualidad_sugerida)
);

-- Cuerpo técnico: relación muchos-a-muchos Track <-> Staff
create table track_staff (
  track_id   uuid not null references tracks(id),
  staff_id   uuid not null references staff(id),
  primary key (track_id, staff_id)
);

-- ---------------------------------------------------------------------
-- MÓDULO IV — Tutores y Jugadores (alumnos)
-- ---------------------------------------------------------------------
create table tutores (
  id                uuid primary key default gen_random_uuid(),
  academia_id       uuid not null references academias(id),
  dni_tutor         text not null,
  telefono_celular  text not null,
  email_tutor       text unique,                        -- nulo en registro inicial
  password_hash     text,                               -- se completa en onboarding
  perfil_reclamado  boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (academia_id, dni_tutor)
);

create table jugadores (
  id                  uuid primary key default gen_random_uuid(),
  tutor_id            uuid not null references tutores(id),
  nombre              text not null,
  apellido            text not null,
  fecha_nacimiento    date not null,
  categoria_inmutable int not null,                     -- año extraído; NO editable
  fecha_registro      date not null default current_date, -- alta del alumno (para reportes de inscripciones)
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

-- 6 atributos técnicos del cromo (Flujo B). Historial por evaluación.
create table jugador_atributos (
  id            uuid primary key default gen_random_uuid(),
  jugador_id    uuid not null references jugadores(id),
  velocidad     int check (velocidad between 0 and 100),
  potencia      int check (potencia between 0 and 100),
  agilidad      int check (agilidad between 0 and 100),
  tecnica       int check (tecnica between 0 and 100),
  pase          int check (pase between 0 and 100),
  defensa       int check (defensa between 0 and 100),
  evaluado_por  uuid references staff(id),
  evaluado_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Inscripción (Jugador <-> Track) = DEFINICIÓN de un Cargo Recurrente (CR)
-- El precio se fija al inscribir; de aquí se generan los CR periódicos.
-- ---------------------------------------------------------------------
create table inscripciones (
  id                          uuid primary key default gen_random_uuid(),
  jugador_id                  uuid not null references jugadores(id),
  track_id                    uuid not null references tracks(id),
  fecha_inscripcion           date not null default current_date,
  costo_mensual_personalizado decimal(12,2),            -- null => usa mensualidad_sugerida del track
  ultima_fecha_corte          date,                     -- fin del último ciclo CR generado (null = ninguno)
  ciclo_dia                   int,                      -- día de ciclo asignado a este CR (para generación periódica)
  activo                      boolean not null default true,
  unique (jugador_id, track_id)
);

-- ---------------------------------------------------------------------
-- MÓDULO VI — Tesorería
-- ---------------------------------------------------------------------
-- Catálogo configurable de Cargos No Recurrentes (CNR) por academia.
create table conceptos_cnr (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id),
  nombre        text not null,                          -- "Concepto" / nombre del cargo
  precio        decimal(12,2) not null default 0,       -- precio unitario
  maneja_stock  boolean not null default false,         -- asociado a inventario (uniforme, buzo)
  es_torneo     boolean not null default false,         -- inscripción a torneo (seguimiento especial)
  activo        boolean not null default true
);

-- Medios de pago habilitados por academia.
create table medios_pago (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id),
  nombre        text not null,                          -- Efectivo, Yape, Transferencia...
  activo        boolean not null default true
);

-- Ciclos de pago: día del mes de corte para generar los CR.
create table ciclos_pago (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id),
  dia           int not null check (dia between 1 and 28),  -- "Ciclo al N"
  es_default    boolean not null default false,
  activo        boolean not null default true
);

-- Promociones NxM: N meses total, M pagados; los últimos (N−M) van gratis.
-- Anclada al día de matrícula; tras la promo, el alumno pasa a su ciclo general.
create table promociones (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id),
  nombre        text not null,                          -- "3x2"
  meses_total   int not null,
  meses_pagados int not null,
  activo        boolean not null default true
);

-- Cargo (deuda) a un alumno. tipo: CR (recurrente, mensualidad) | CNR (no recurrente).
create table cargos (
  id            uuid primary key default gen_random_uuid(),
  tutor_id      uuid not null references tutores(id),
  jugador_id    uuid references jugadores(id),
  inscripcion_id uuid references inscripciones(id),
  tipo          text not null default 'CR' check (tipo in ('CR','CNR')),
  concepto_cnr_id uuid references conceptos_cnr(id),    -- si es CNR, concepto del catálogo
  concepto      text not null,                          -- CR: nombre del track · CNR: nombre del concepto
  descripcion   text,                                   -- CR: "Del <ini> al <fin>" · CNR: detalle
  periodo       text,                                   -- "2026-07"
  ciclo_inicio  date,                                   -- CR: inicio del ciclo facturado
  ciclo_fin     date,                                   -- CR: fin del ciclo (fecha de corte)
  ciclo_dia     int,                                    -- CR: día del ciclo usado (1, 16, ...)
  promo_id      uuid references promociones(id),        -- CR generado por una promoción
  gratis        boolean not null default false,         -- mes gratis de promo (monto 0)
  monto         decimal(12,2) not null,
  pagado_monto  decimal(12,2) not null default 0,       -- acumulado aplicado por abonos
  estado        text not null default 'por_pagar'
                check (estado in ('por_pagar','vencido','pagado','parcial')),
  created_at    timestamptz not null default now()
);

-- Pago / abono (puede ser parcial). Voucher obligatorio si no es efectivo en caja.
create table pagos (
  id            uuid primary key default gen_random_uuid(),
  tutor_id      uuid not null references tutores(id),
  sede_id       uuid references sedes(id),
  monto         decimal(12,2) not null,
  medio         text check (medio in ('efectivo','transferencia','yape','plin','pasarela','tarjeta')),
  voucher_url   text,
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','aprobado','rechazado')),
  created_by    uuid,
  created_at    timestamptz not null default now(),
  processed_by  uuid,
  processed_at  timestamptz,
  rejection_reason text
);

-- Aplicación de un pago a uno o varios cargos (soporta abonos parciales)
create table pago_cargo (
  pago_id   uuid not null references pagos(id),
  cargo_id  uuid not null references cargos(id),
  monto     decimal(12,2) not null,
  primary key (pago_id, cargo_id)
);

-- Libro mayor: egresos manuales (proveedores, materiales, nómina)
create table egresos (
  id            uuid primary key default gen_random_uuid(),
  academia_id   uuid not null references academias(id),
  sede_id       uuid references sedes(id),
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
create table asistencias (
  id            uuid primary key default gen_random_uuid(),
  track_id      uuid not null references tracks(id),
  jugador_id    uuid not null references jugadores(id),
  fecha         date not null default current_date,
  estado        text not null default 'presente'
                check (estado in ('presente','ausente','tardanza','justificado')),
  notas         text,
  registrado_por uuid references staff(id),
  created_at    timestamptz not null default now(),
  unique (track_id, jugador_id, fecha)
);

create table asistencias_staff (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid not null references staff(id),
  track_id      uuid references tracks(id),
  fecha         date not null default current_date,
  estado        text not null default 'presente'
                check (estado in ('presente','ausente','tardanza','justificado')),
  horas         decimal(5,2),                           -- horas dictadas (modalidad por_horas)
  penalidad     decimal(12,2) default 0,                -- descuento por ausencia/tardanza
  created_at    timestamptz not null default now()
);

-- NOTA: RLS multi-tenant (aislar por academia_id, y por sede para roles locales)
-- se define aparte, reusando el patrón del proyecto de torneos.
