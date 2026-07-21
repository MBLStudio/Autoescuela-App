import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ENDPOINT TEMPORAL DE DEBUG — BORRAR DESPUÉS
export async function GET(req: NextRequest) {
  const dni = req.nextUrl.searchParams.get('dni') ?? ''

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const cleanDni = dni.trim().toUpperCase()

  const { data: student, error } = await supabaseAdmin
    .from('students')
    .select('id, dni, is_active, full_name')
    .ilike('dni', cleanDni)
    .single()

  const storedDni = student?.dni ?? null
  const numericPart = storedDni ? storedDni.replace(/\D/g, '') : null
  const expectedPin = numericPart ? numericPart.slice(-4) : null

  return NextResponse.json({
    searched: cleanDni,
    found: !!student,
    error: error?.message ?? null,
    storedDni,
    numericPart,
    expectedPin,
    isActive: student?.is_active ?? null,
    name: student?.full_name ?? null,
  })
}
