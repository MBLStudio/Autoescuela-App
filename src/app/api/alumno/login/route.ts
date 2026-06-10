import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAX_ATTEMPTS = 10
const WINDOW_MINUTES = 15

export async function POST(req: NextRequest) {
  const { login_code, login_pin } = await req.json()

  if (!login_code || !login_pin) {
    return NextResponse.json({ error: 'Código y PIN son obligatorios' }, { status: 400 })
  }

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

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('token, is_active, login_code, login_pin')
    .eq('login_code', login_code.trim())
    .eq('login_pin', login_pin.trim())
    .single()

  if (!student) {
    // Registrar intento fallido
    await supabaseAdmin.from('login_attempts').insert({ ip_address: ip })
    // Limpiar intentos viejos (best-effort, sin await)
    supabaseAdmin.from('login_attempts')
      .delete()
      .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    return NextResponse.json({ error: 'Código o PIN incorrectos' }, { status: 401 })
  }

  if (!student.is_active) {
    return NextResponse.json({ error: 'Tu cuenta está desactivada. Contacta con la autoescuela.' }, { status: 403 })
  }

  return NextResponse.json({ token: student.token })
}
