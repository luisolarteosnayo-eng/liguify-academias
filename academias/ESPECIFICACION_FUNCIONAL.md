# Especificación Funcional — Plataforma SaaS B2B de Gestión Integral para Escuelas Deportivas

> Documento fuente de verdad del **Módulo de Academias**. Provisto por el cliente (Luis).
> Modelo: SaaS **multi-tenant (Multi-Tenant)** B2B para academias de fútbol y deportes formativos.

## 1. Objetivo

Plataforma multi-inquilino SaaS B2B que centraliza: operación administrativa, control
financiero masivo, logística de indumentaria y análisis del rendimiento deportivo.

## 2. Módulos principales

### Módulo I — Configuración Global y Onboarding (Tenant Settings)
- **Theming dinámico / marca blanca**: carga de logo; el backend extrae automáticamente
  colores predominantes (primario y secundario) para personalizar portales y cromos.
- **Datos maestros de la academia**: nombre, RUC/doc. tributario, año de fundación,
  teléfono, correo corporativo y **slug de URL único** (ej: `app.tusport.com/tales`).
- **Pasarela de pagos**: conectar llaves API (Stripe, Mercado Pago, Culqi) y cuentas
  bancarias institucionales para recaudación automatizada.

### Módulo II — Estructura Jerárquica y Gestión de Sedes
- **Multi-sede** con una sola cuenta admin. Registro de sedes: nombre, dirección 1 y 2,
  ciudad, país, teléfono del coordinador, URL de Google Maps.
- **Aislamiento operativo**: cada sede es un contenedor lógico independiente (sus propios
  alumnos, profesores, horarios y registros financieros locales).

### Módulo III — Planificación Operativa (Tracks y Programas)
El **Track** es la unidad mínima operativa, deportiva y comercial dentro de una sede.
- **Línea de negocio** (etiqueta plana para reportes): Academia Regular, Alto Rendimiento,
  Especialización de Arqueros.
- **Ficha operativa**: nombre (categoría/año de nacimiento, ej. `2020-2019`), cuerpo técnico
  (**M2M**, varios coaches por grupo), aforo máximo, días y bloques horarios.
- **Parámetros financieros / break-even**: costo mensual de cancha e infraestructura, costo
  mensual estimado de profesores, mensualidad base sugerida, clases incluidas por mes.

### Módulo IV — Gestión de Alumnos y Conversión Progresiva
- **Inscripción cero fricción (obligatorio)**: nombre, apellido, celular del tutor, tipo y
  número de documento, fecha de nacimiento.
- **Categoría inmutable**: del `fecha_nacimiento` se extrae el año y se graba permanente y
  **no editable** (01/01/2015 → Categoría 2015). Indexa al jugador para siempre.
- **Datos progresivos (ficha deportiva e indumentaria)**: posición, pierna hábil, número de
  camiseta, nombre de estampado; talla superior (camiseta) y talla inferior (short) por
  desplegables estandarizados.
- **Información médica**: tipo de sangre, notas médicas, historial de lesiones, alergias,
  otras actividades físicas paralelas (todos opcionales).
- **Conversión progresiva**: email del padre no obligatorio en cancha; se registra luego
  vía incentivos en el portal familiar para activar credenciales.

### Módulo V — Control de Asistencias (Alumnos y Staff)
- **Asistencia tradicional por Track**: UI móvil de alto contraste; filtro por Sede/Track/Fecha;
  4 estados: **Presente, Ausente, Tardanza, Justificado** + notas de sesión.
- **Asistencia Express y Check-in QR**: búsqueda predictiva por nombre; pop-up directo;
  escaneo de QR del carnet; el sistema calcula Presente/Tardanza contrastando hora del
  servidor vs. horario de inicio del Track.
- **Asistencia y liquidación de profesores**: contrato por **sueldo fijo mensual** o **pago
  por horas** dictadas con éxito. Ausencias/tardanzas del profesor generan penalidades y
  descuentos automáticos.

### Módulo VI — Tesorería, Facturación y Finanzas Globales
- **Motor de mensualidades recurrentes (Cron Job)**: el primer día de cada mes escanea
  inscripciones activas y genera filas de deuda respetando el costo personalizado
  (becas/medias becas/tarifas). Botón de contingencia para forzar facturación masiva.
- **Cargos no recurrentes (eventuales)**: uniforme completo, inscripción a torneo, matrícula
  anual, exámenes médicos.
- **Estado de cuenta consolidado familiar**: agrupa cargos vigentes/vencidos/pagados del
  tutor, consolidando la deuda de múltiples hijos. Permite abonos parciales o liquidar por
  pasarela o efectivo en caja de la sede.
- **Libro Mayor de Finanzas**: ingresos totales (cuotas, uniformes, eventuales) vs. egresos
  (facturas de proveedores de canchas, materiales, uniformes, nómina de profesores).

## 3. Procesos críticos

### Flujo A — Inscripción, asignación y generación de deuda
1. Coordinador inicia registro rápido en cancha.
2. Ingresa datos mínimos + documento/teléfono del tutor (sin email).
3. Backend calcula año y graba **Categoría Inmutable**.
4. Sistema filtra Tracks activos compatibles con la edad; coordinador selecciona uno o varios.
5. Motor financiero lee costos, evalúa descuento personalizado y genera cargos (Vencido / Por Pagar).
6. Dispara SMS/WhatsApp al padre con enlace a su estado de cuenta.

### Flujo B — Activación progresiva del padre (onboarding familiar)
1. Entrenador actualiza los **6 atributos técnicos** del niño (Velocidad, Potencia, Agilidad,
   Técnica, Pase, Defensa).
2. Sistema dispara alerta al celular del tutor con enlace.
3. Padre entra al portal público; doble factor: **DNI + teléfono** registrados en cancha.
4. Al coincidir, asistente pide **email + contraseña** para desbloquear el panel/cromo.
5. Backend hace **Upsert**: el email pasa a ser llave primaria de acceso familiar; se habilitan
   estados de cuenta por correo con botones de pago.

### Flujo C — Rentabilidad y punto de equilibrio (break-even)
1. Dueño configura Track con dos egresos fijos: alquiler de cancha + honorarios profesor →
   **Costo Total de Operación**.
2. Fija la **Mensualidad Sugerida**.
3. Motor BI: **Punto de Equilibrio = Ceil(Costo Operación / Mensualidad Sugerida)** = alumnos
   mínimos para no operar a pérdida.
4. Monitorea alumnos matriculados vs. capacidad en tiempo real.
5. Ingresos reales = suma de mensualidades vigentes. Si inscritos < punto de equilibrio →
   barra **ámbar/roja** "Track operando a pérdida". Si ≥ umbral → **verde** "Track Rentable"
   con margen de utilidad neta del grupo.

## 4. Matriz de rentabilidad por Track (ejemplo)

| Indicador | Track 2020-2019 (San Miguel) | Track CPE 6pm (San Miguel) |
|-----------|------------------------------|----------------------------|
| Aforo / Ocupación | 3 / 20 | 1 / 20 |
| Mensualidad base sugerida | S/ 220.00 | S/ 250.00 |
| Costo alquiler cancha | S/ 500.00 | S/ 600.00 |
| Costo profesores | S/ 600.00 | S/ 700.00 |
| **Costo total operación** | S/ 1,100.00 | S/ 1,300.00 |
| Punto de equilibrio | 5 alumnos | 6 alumnos |
| Ingresos brutos reales | S/ 660.00 | S/ 250.00 |
| **Utilidad neta** | **- S/ 440.00** (pérdida) | **- S/ 1,050.00** (pérdida) |
| Alerta | Barra ámbar (riesgo) | Barra roja (déficit crítico) |

## 5. Modelo de entidades (resumen)

- **Academia (Tenant Master)**: id, nombre_academia, slug_url (unique), logo_url,
  color_primario, color_secundario, plan_suscripcion (Starter/Pro/Elite).
- **Sede**: id, academia_id (FK), nombre_sede, direccion_linea1, ciudad,
  telefono_coordinador, google_maps_url.
- **Track**: id, sede_id (FK), linea_negocio (ENUM), nombre_track, capacidad_maxima,
  mensualidad_sugerida, clases_mensuales, costo_mensual_cancha, costo_mensual_profesores.
- **Tutor**: id, academia_id (FK), dni_tutor (unique), telefono_celular,
  email_tutor (nullable/unique), password_hash (nullable), perfil_reclamado (bool default false).
- **Jugador (Alumno)**: id, tutor_id (FK), nombre, apellido, fecha_nacimiento,
  categoria_inmutable (int, no editable), talla_camiseta, talla_short, numero_camiseta,
  nombre_camiseta, posicion_juego, estado_alumno (Activo/Baja).
- **Inscripción (Jugador↔Track)**: id, jugador_id (FK), track_id (FK), fecha_inscripcion,
  costo_mensual_personalizado (DECIMAL — anula la mensualidad sugerida; becas).
