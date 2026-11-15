# Sistema de Billares Ángel (S.B.A)

Aplicación web para administrar salones de billar: mesas con cronómetro, ventas, inventario,
caja y reportes. Funciona en celular y computadora, y se puede instalar como aplicación.

- **Pantallas:** aplicación React ya compilada (carpeta `sitio/`), publicada en Netlify.
- **Base de datos y cuentas:** Supabase.
- **Instalable (PWA):** botón «Instalar aplicación» en el menú lateral.

## Estructura

| Ruta | Qué es |
|---|---|
| `sitio/` | El sitio completo, tal como se publica |
| `sitio/index.html` | Página principal |
| `sitio/app.js`, `sitio/app.css` | Aplicación compilada (minificada) |
| `sitio/ticket.js` | Impresión de tickets de 58/80 mm (Fun Print, guardar imagen, navegador) |
| `sitio/instalar.js` | Instalación como aplicación (celular y computadora) |
| `sitio/tema.js` | Modo claro / oscuro (se recuerda en cada aparato) |
| `sitio/sonidos.js` | Sonidos suaves de confirmación (se pueden apagar) |
| `sitio/sw.js` | Service worker (instalación y arranque rápido) |
| `sitio/config.js` | Dirección pública de Supabase y llave pública. **Nunca poner llaves secretas aquí** |
| `netlify.toml` | Le dice a Netlify que publique la carpeta `sitio/` sin compilar |

## Importante: código fuente original

Este repositorio guarda el sitio **compilado** tal como está publicado. El código fuente original
de React (archivos `.tsx`/`.jsx`, `package.json`, etc.) no estaba disponible al preparar este
repositorio. Cuando se consiga, súbelo en una carpeta `fuente/`; entonces se podrá cambiar
`netlify.toml` para que Netlify lo compile.

## Seguridad

- Mantén este repositorio **privado**.
- Nunca subir la llave `service_role` de Supabase ni contraseñas.
- La llave «publishable/anon» de `config.js` es pública por diseño; la protección real está en las
  políticas y funciones de la base de datos (Supabase).

## Actualizar el sistema

1. Reemplaza el contenido de `sitio/` con la versión nueva.
2. Sube los cambios a GitHub (rama `main`).
3. Netlify publica automáticamente.
