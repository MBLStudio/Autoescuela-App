import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16)
}

export async function POST(req: NextRequest) {
  const { fullName, dni, phone, email, practiceTypes, notes } = await req.json()

  if (!fullName?.trim() || !dni?.trim() || !practiceTypes?.length) {
    return NextResponse.json({ error: 'Nombre, DNI y tipo de prácticas son obligatorios' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: last } = await supabaseAdmin
    .from('students')
    .select('order_number')
    .order('order_number', { ascending: false })
    .limit(1)
    .single()

  const orderNumber = (last?.order_number ?? 0) + 1
  const num = orderNumber.toString().padStart(3, '0')

  const { data, error } = await supabaseAdmin
    .from('students')
    .insert({
      instructor_id: null,
      dni: dni.toUpperCase().trim(),
      full_name: fullName.trim(),
      order_number: orderNumber,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      practice_types: practiceTypes,
      notes: notes?.trim() || null,
      token: generateToken(),
      login_code: `Alumno-${num}`,
      login_pin: num,
    })
    .select()
    .single()

  if (error) {
    const msg = error.code === '23505' ? 'Ya existe un alumno con ese DNI' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ student: data })
}
