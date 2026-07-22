# AGENTS.md — Autoescuela-App

Reglas de revisión de código para Guardian Angel (`gga`). Rechaza el commit si alguna se incumple.

## Seguridad — prioridad máxima

- Rechaza cualquier archivo staged que contenga un JWT de Supabase (patrón `eyJhbGciOi` o `eyJhbGci`), o las nuevas claves de Supabase (`sb_secret_`, `sb_publishable_`) escritas literalmente.
- `.claude/settings.json` y `.claude/settings.local.json` nunca deben contener claves/tokens literales dentro de reglas de permisos de Bash — solo referencias a variables de entorno. `.claude/settings.local.json` no debe estar trackeado en git en absoluto.
- Ninguna ruta de `src/app/api/**` debe crear el cliente con `SUPABASE_SERVICE_ROLE_KEY` con la URL o la clave escritas a mano — siempre `process.env.NEXT_PUBLIC_SUPABASE_URL` / `process.env.SUPABASE_SERVICE_ROLE_KEY`.

## Auth

- Auth real vía Supabase Auth + tabla `staff` por rol (`admin`/`instructor`/`secretary`) — usa `getSessionUser()`, `isAdmin()`, `isAdminOrInstructor()`, `isAdminOrSecretary()` de `src/lib/auth.ts`. No inventar un mecanismo de sesión nuevo.
- El cliente con `SUPABASE_SERVICE_ROLE_KEY` se construye inline en cada ruta que lo necesita (no hay factory compartida todavía) — si tocas 2+ de estas rutas en el mismo cambio, sugiere extraer un `lib/supabase/admin.ts` compartido en vez de duplicar más.

## Convenciones de código

- API routes en kebab-case, componentes en PascalCase, funciones en camelCase.
- No fabricar ni redondear pagos/deudas de alumnos — siempre calculados desde los datos reales.
