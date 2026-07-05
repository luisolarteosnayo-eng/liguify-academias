# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Proyecto

**Portafolio / suite de aplicaciones deportivas.** Un launcher central da acceso
a tres apps que comparten un mismo backend Supabase y un dato maestro común:
**Clubes / Academias**.

| App | Alcance | Estado |
|-----|---------|--------|
| **Gestión de Torneos** | Estructura **financiera** de torneos: categorías, inscripciones, pagos, cuentas por cobrar, caja. | ✅ Existe en otro repo (`../proyecto-torneos`), se mantiene **como está**. Solo se conectará a la tabla maestra compartida. |
| **Gestión de Academias** | SaaS **multi-tenant B2B**: sedes, tracks, alumnos, tutores, mensualidades, tesorería, asistencia y cromos de rendimiento. | 🆕 En construcción (carpeta `academias/`). |
| **Estadística de Torneos** | Lado **deportivo**: grupos, fixture, calendario, resultados, tablas de posiciones, estadísticas. | 🆕 Pendiente (carpeta `estadisticas/`). |

## Módulo de Academias — fuente de verdad

El diseño del módulo de Academias sigue la **Especificación Funcional** en
[`academias/ESPECIFICACION_FUNCIONAL.md`](academias/ESPECIFICACION_FUNCIONAL.md).
Es un SaaS **multi-tenant**: cada academia es un tenant aislado.

**Jerarquía:** `Academia (tenant) → Sede → Track (horario/programa) → Inscripción` · `Tutor → Jugador (Alumno)`

- **Cada Sede se administra de forma independiente**, como una sub-academia del mismo
  dueño (aislamiento operativo). La app tiene un **selector de sede activa** que filtra
  todas las pantallas operativas (Dashboard, Tracks, Alumnos, Tesorería, Asistencia).
  El alumno pertenece a una sede (`jugadores.sede_id`).
- **Track** = subdivisión de **horario/programa** dentro de una sede (categoría por año, o
  especialización como "Arqueros 5pm"), con **break-even** (costo cancha + profesores vs.
  mensualidad sugerida).
- Un **alumno puede estar en varios tracks** de su sede (p. ej. "2015-2016" y "Arqueros 5pm").
- **Categoría inmutable**: del `fecha_nacimiento` se graba el año, permanente y no editable.
- **Tutor** paga; consolida la deuda de varios hijos (jugadores). Onboarding progresivo
  (email opcional en cancha, se reclama luego con DNI+teléfono como doble factor).
- **Cromo de rendimiento**: 6 atributos (Velocidad, Potencia, Agilidad, Técnica, Pase, Defensa).

## Dato maestro de la suite (integración futura)

Las 3 apps comparten conceptualmente **Clubes / Academias**. La integración con un dato
maestro común de la suite es un tema **posterior**; por ahora el módulo de Academias es
self-contained según su especificación (tabla `academias` como tenant).

## Stack técnico

Igual que el proyecto de torneos, para mantener la curva de aprendizaje baja:

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + Tailwind (CDN) + JavaScript vanilla — **sin build step** |
| Backend | **Supabase** (PostgreSQL + Auth + RLS) — montos en `DECIMAL`, nunca `float` |
| Almacenamiento vouchers | Supabase Storage |

A diferencia de torneos (un solo `index.html`), la app de academias se organiza en
**varios archivos** por su mayor alcance. Cada app vive en su carpeta; lo común
(config Supabase, auth, componentes) va en `shared/`.

## Estructura de carpetas

```
proyecto-academias/
├── launcher/       Página de inicio con acceso a las 3 apps
├── academias/      App de gestión de academias
├── estadisticas/   App de estadística de torneos (pendiente)
├── shared/         Config Supabase, auth y utilidades comunes
└── supabase/       Esquema SQL único compartido, migraciones y seeds
```

## Roles (app Academias)

| Rol | Puede |
|-----|-------|
| **Administrador / Director** | Configurar academia, sedes, tracks; ver todo; libro mayor y rentabilidad |
| **Coordinador / Recepción** | Registro cero-fricción en cancha, matricular alumnos, registrar pagos, asistencia |
| **Tesorero / Caja** | Aprobar/rechazar pagos, estado de cuenta familiar, saldos, egresos |
| **Profesor / Entrenador** | Ver sus tracks, registrar asistencia, actualizar cromo (6 atributos) |
| **Tutor (portal familiar)** | Ver estado de cuenta y cromo de sus hijos, pagar (onboarding progresivo) |

## Reglas de negocio clave (Academias)

- **Categoría inmutable**: al registrar, se extrae el año de `fecha_nacimiento` y se graba
  permanente y **no editable**.
- **Break-even por Track**: `costo_operacion = costo_cancha + costo_profesores`;
  `punto_equilibrio = ceil(costo_operacion / mensualidad_sugerida)`. Barra verde (rentable) /
  ámbar (riesgo) / roja (déficit) según alumnos vs. punto de equilibrio.
- **Motor de mensualidades**: Cron el 1° de cada mes genera cargos por inscripción activa,
  usando `costo_mensual_personalizado` si existe (becas), o `mensualidad_sugerida`. Botón de
  contingencia para forzar facturación manual del periodo.
- **Costo personalizado (beca)**: la inscripción puede anular la mensualidad sugerida del track.
- **Estado de cuenta por alumno**: cada jugador tiene su propio estado de cuenta
  (`Saldo = Σ cargos − Σ abonos aprobados`). El estado de cuenta del **Tutor** es la suma
  de los de sus hijos. Los cargos guardan `pagado_monto`; al aprobar un pago se aplica a los
  cargos del alumno (más antiguos primero).
- **Tipos de cargo**:
  - **CR (Cargo Recurrente)**: mensualidad de cada track (la genera el motor de mensualidades).
  - **CNR (Cargo No Recurrente)**: eventuales (uniforme, torneo, matrícula, examen).
- **Abonos**: se registran contra un alumno (voucher salvo efectivo), entran *pendientes* y
  Tesorería los aprueba/rechaza; admite **abonos parciales**.
- **Voucher** para pagos digitales; efectivo en caja de sede no requiere voucher.
- **Estados de pago**: `Pendiente → Aprobado | Rechazado`, sin reversión en el piloto.
- **Onboarding progresivo del padre**: email opcional en cancha; se reclama luego con
  **DNI + teléfono** (doble factor) y se hace Upsert del email como llave de acceso.
- **Multi-tenant**: todo aislado por `academia_id`; roles locales además por `sede_id`.
- **Moneda**: soles (S/.), 2 decimales. Sin multi-moneda.
- **Los alumnos nunca se eliminan**, solo pasan a **Baja** (trazabilidad de pagos).

## Preguntas abiertas (por decidir)

1. Liquidación de profesores: ¿cálculo de penalidades automático o revisión manual?
2. Prorrateo de mensualidad al matricular a mitad de mes.
3. Theming dinámico: extracción de color en backend vs. selección manual en el MVP.
4. Integración con el dato maestro común de la suite (Clubes/Academias) — posterior.
