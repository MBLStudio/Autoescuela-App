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

  const { data: students, error } = await supabaseAdmin
    .from('students')
    .select('id, dni, is_active, full_name, created_at')
    .ilike('dni', cleanDni)

  return NextResponse.json({
    searched: cleanDni,
    count: students?.length ?? 0,
    error: error?.message ?? null,
    students: students?.map(s => ({
      id: s.id,
      name: s.full_name,
      dni: s.dni,
      isActive: s.is_active,
      createdAt: s.created_at,
      expectedPin: s.dni.replace(/\D/g, '').slice(-4),
    })) ?? [],
  })
}
