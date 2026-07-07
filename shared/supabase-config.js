// Configuración compartida de Supabase para toda la suite Liguify.
// Mismo proyecto que Liguify Torneos (liguify-erp). La anon key es pública:
// la seguridad real la imponen las políticas RLS.
// Las tablas de Academias viven en el esquema Postgres "academias":
//   supabase.createClient(url, anonKey, { db: { schema: 'academias' } })

window.SUPABASE_CONFIG = {
  url: 'https://bpsczjjomgzhnjxnzmhj.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwc2N6ampvbWd6aG5qeG56bWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDg5MTgsImV4cCI6MjA5ODA4NDkxOH0.3O92Q-3xxdCmF1LStCQrlCtz1s_EfdlayXnL_mEElOw',
  schema: 'academias',
};
