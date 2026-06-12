import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

async function verifyStudentToken(studentId: string, studentToken: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('token', studentToken)
    .single()
  return !!data
}

// POST /api/calendar — crea un evento cuando se confirma una reserva
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.studentId || !body.studentToken || !await verifyStudentToken(body.studentId, body.studentToken)) {
      return NextResponse.json({ eventId: null }, { status: 401 })
    }
    const eventId = await createCalendarEvent(body)
    return NextResponse.json({ eventId })
  } catch (err) {
    console.error('Google Calendar POST error:', err)
    return NextResponse.json({ eventId: null }, { status: 200 }) // no bloquear la reserva si falla el calendar
  }
}

// DELETE /api/calendar — elimina el evento cuando se cancela la reserva
export async function DELETE(req: NextRequest) {
  try {
    const { eventId, studentId, studentToken } = await req.json()
    if (!studentId || !studentToken || !await verifyStudentToken(studentId, studentToken)) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    if (eventId) await deleteCalendarEvent(eventId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Google Calendar DELETE error:', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
