// Conexión de la aplicación con su servidor (proyecto de Supabase).
// La clave de aquí es la PÚBLICA: puede estar a la vista. Por sí sola no
// da acceso a ningún dato; los permisos los decide la base según la sesión.
// NUNCA pongas aquí la clave secreta ("service_role" o "sb_secret_...").
window.BEJ_CONFIG = {
  supabaseUrl: 'https://fvodiaefjqovhkotdhqj.supabase.co',
  supabaseKey: 'sb_publishable_nMvUjoryiCyQ1cMvqiyp8Q_xbitZ2iA',
};
