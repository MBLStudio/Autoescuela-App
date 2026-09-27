import { NextResponse, type NextRequest } from 'next/server'

// ── Mudanza a ControlL ───────────────────────────────────────────────────────
// Autoescuela Bahillo se ha mudado a ControlL (https://app.controll.es) con los
// mismos ids y el mismo token de enlace personal de cada alumno. Esta app ya no
// sirve páginas ni acepta escrituras; todo se corta aquí, antes de cualquier lógica:
//   · /api/...          → 410 JSON (incluidos los crons)
//   · /s/<token>?...    → https://app.controll.es/s/<token>?...  (query intacta)
//   · /alumno/...       → https://app.controll.es/alumno
//   · cualquier otra    → https://app.controll.es/
// Los estáticos (/_next, favicon, manifest, imágenes) quedan fuera del matcher y
// se sirven normal.
//
// Antes este middleware refrescaba la sesión de Supabase y protegía /admin e
// /instructor. Ya no hace falta: ninguna página ni ruta de API llega a ejecutarse.

export const runtime = 'nodejs'

const CONTROLL_URL = 'https://app.controll.es'
const MENSAJE_MUDANZA = 'Esta aplicación se ha mudado a app.controll.es'

// Redirección permanente (308), pero con caché acotada en el navegador: sin
// Cache-Control, el navegador guarda un 308 indefinidamente y, si hubiera que
// deshacer la mudanza, quien ya pasó por aquí seguiría saltando a ControlL.
function redirigir(url: string) {
  return NextResponse.redirect(url, {
    status: 308,
    headers: { 'Cache-Control': 'private, max-age=3600' },
  })
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: MENSAJE_MUDANZA },
      { status: 410, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // El token es el primer segmento tras /s/ (tal cual llega, sin decodificar).
  const token = pathname.match(/^\/s\/([^/]+)/)?.[1]
  if (token) return redirigir(`${CONTROLL_URL}/s/${token}${search}`)

  if (pathname === '/alumno' || pathname.startsWith('/alumno/')) {
    return redirigir(`${CONTROLL_URL}/alumno`)
  }

  return redirigir(`${CONTROLL_URL}/`)
}

export const config = {
  matcher: [
    '/((?!_next/|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
