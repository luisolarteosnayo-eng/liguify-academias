# Supabase — Liguify Academias

Las tablas de Academias viven en el **mismo proyecto Supabase que Liguify Torneos**
(`liguify-erp`), dentro del esquema Postgres **`academias`** (torneos usa `public`,
así `pagos` y `medios_pago` de ambas apps no chocan).

## 1. Cargar el esquema (único paso obligatorio)

1. Entra a **https://supabase.com/dashboard** → proyecto **liguify-erp**.
2. **SQL Editor** → **New query**.
3. Abre [`schema.sql`](schema.sql) (este repo), copia **todo** y pégalo.
4. **Run**. Debe decir *Success. No rows returned*.
5. Verifica en **Table Editor** → selector de schema (arriba a la izquierda) →
   elige `academias`: deben aparecer las 21 tablas.

El script es idempotente: si lo corres dos veces no rompe nada.

## 2. Exponer el esquema a la API (cuando conectemos la app)

La app (frontend) accede vía PostgREST, que solo publica los esquemas listados:

1. **Project Settings** (⚙️) → **API** → **Exposed schemas**.
2. Agrega `academias` a la lista (quedará `public, storage, academias` o similar).
3. Guarda.

> Este paso puede hacerse desde ya o cuando construyamos la capa de conexión;
> sin él, el esquema existe pero la API no lo ve.

## 3. Credenciales del frontend

Ya están en [`../shared/supabase-config.js`](../shared/supabase-config.js) — son
las mismas del proyecto de torneos (la anon key es pública; la seguridad la
imponen las políticas RLS). El cliente debe crearse apuntando al esquema:

```js
const sb = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey,
  { db: { schema: 'academias' } });
```

## Estado de seguridad

- **RLS está habilitado en todas las tablas y sin políticas**: nadie puede leer
  ni escribir con la anon key todavía. Es intencional.
- Las políticas multi-tenant (aislar por `academia_id`, y por `sede_id` para
  roles locales) se definirán junto con la autenticación de la app, reusando el
  patrón de torneos (`profiles` + roles).
- **Nunca** uses la `service_role` key en el navegador.

## Pendientes de la fase de conexión

1. Autenticación (login) + tabla de perfiles/roles para Academias.
2. Políticas RLS multi-tenant.
3. Capa de conexión en la app (hoy usa datos demo en memoria, `DB` en `app.js`).
4. Bucket de Storage para vouchers y fotos (`academias-vouchers`).
