import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Ping mínimo para mantener Supabase activo
  await supabase.from('students').select('id').limit(1)

  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}
