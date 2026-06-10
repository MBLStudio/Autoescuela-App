import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser, isAdminOrInstructor } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!isAdminOrInstructor(user)) return NextResponse.json({ error: 'Prohibido' }, { status: 403 })

  const { studentId, instructorId: bodyInstructorId } = await req.json()

  if (!studentId) {
    return NextResponse.json({ error: 'studentId es obligatorio' }, { status: 400 })
  }

  // Instructores siempre se autoasignan; admin puede asignar a cualquier instructor
  const instructorId = user.role === 'admin'
    ? (bodyInstructorId ?? user.id)
    : user.id

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await supabaseAdmin
    .from('students')
    .update({ instructor_id: instructorId })
    .eq('id', studentId)
    .is('instructor_id', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Devolver nombre del instructor para la notificación al alumno
  const { data: instructor } = await supabaseAdmin
    .from('instructors')
    .select('name')
    .eq('id', instructorId)
    .single()

  return NextResponse.json({ ok: true, instructorName: instructor?.name ?? null })
}
