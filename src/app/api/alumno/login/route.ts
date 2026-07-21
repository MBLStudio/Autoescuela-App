import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAX_ATTEMPTS = 10
const WINDOW_MINUTES = 15

function getPinFromDni(dni: string): string {
  // Extrae los últimos 4 dígitos numéricos del DNI
  // Ej: "12345678Z" → "5678"
  return dni.replace(/\D/g, '').slice(-4)
}

export async function POST(req: NextRequest) {
  const { dni, pin } = await req.json()

  if (!dni || !pin) {
    return NextResponse.json({ error: 'DNI y PIN son obligatorios' }, { status: 400 })
  }

  const cleanDni = String(dni).trim().toUpperCase()
  const cleanPin = String(pin).trim()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Rate limiting por IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Espera ${WINDOW_MINUTES} minutos.` },
      { status: 429 }
    )
  }

  // Buscar alumno por DNI (activo primero, por si hay duplicados de prueba)
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('token, is_active, dni')
    .ilike('dni', cleanDni)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  console.log('[login] cleanDni:', cleanDni, '| cleanPin:', cleanPin)
  console.log('[login] studentError:', studentError?.message ?? null)
  console.log('[login] student found:', !!student, '| stored dni:', student?.dni ?? null)

  // Validar PIN = últimos 4 dígitos numéricos del DNI
  const validPin = student ? getPinFromDni(student.dni) : null
  const pinOk = validPin !== null && validPin.length === 4 && cleanPin === validPin

  console.log('[login] validPin:', validPin, '| pinOk:', pinOk)

  if (!student || !pinOk) {
    await supabaseAdmin.from('login_attempts').insert({ ip_address: ip })
    supabaseAdmin.from('login_attempts')
      .delete()
      .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    return NextResponse.json({ error: 'DNI o PIN incorrectos' }, { status: 401 })
  }

  if (!student.is_active) {
    return NextResponse.json({ error: 'Tu cuenta está desactivada. Contacta con la autoescuela.' }, { status: 403 })
  }

  return NextResponse.json({ token: student.token })
}
