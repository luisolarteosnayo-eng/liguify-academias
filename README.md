# Suite Deportiva — Portafolio de aplicaciones

Portafolio de tres aplicaciones que comparten un backend Supabase y un dato
maestro común (**Clubes / Academias**):

1. **Gestión de Torneos** — estructura financiera de torneos *(repo aparte:
   `../proyecto-torneos`, se mantiene como está)*.
2. **Gestión de Academias** — alumnos, mensualidades, asistencia *(en construcción)*.
3. **Estadística de Torneos** — fixture, resultados y tablas *(pendiente)*.

## Estructura

```
launcher/       Home con acceso a las 3 apps
academias/      App de academias (HTML + Tailwind CDN + JS vanilla + Supabase)
estadisticas/   App de estadística de torneos (pendiente)
shared/         Config Supabase, auth y utilidades comunes
supabase/       Esquema SQL, migraciones y seeds
```

## Cómo correr

No hay build step. Se abre el HTML directamente en el navegador (o con un servidor
estático simple). La conexión a Supabase se configura en `shared/supabase-config.js`.

## Estado

🚧 Proyecto recién iniciado. Ver `CLAUDE.md` para el modelo de dominio, roles y
reglas de negocio, y `supabase/` para el esquema de datos.
