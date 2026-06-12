import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  FROM_EMAIL,
  emailWrapper, infoCard, infoRow,
  formatDateEs, getDayNameEs, getPracticeLabel,
} from '@/lib/email'

function buildInstructorEmail(
  instructorName: string,
  studentName: string,
  date: string,
  time: string,
  practiceLabel: string,
  pickupLocation: string | null,
  action: 'booked' | 'cancelled'
): string {
  const isBooked = action === 'booked'
  const accentColor = isBooked ? '#16a34a' : '#dc2626'
  const accentBg   = isBooked ? '#f0fdf4' : '#fef2f2'
  const accentBorder = isBooked ? '#86efac' : '#fca5a5'
  const actionLabel = isBooked ? 'Nueva reserva' : 'Reserva cancelada'

  const pickupRow = pickupLocation
    ? infoRow('Lugar de recogida', `📍 ${pickupLocation}`, accentBorder, true)
    : ''

  const rows =
    infoRow('Alumno', studentName, accentBorder) +
    infoRow('Día y hora', `${getDayNameEs(date)}, ${formatDateEs(date)} · ${time}`, accentBorder) +
    infoRow('Práctica', practiceLabel, accentBorder, !pickupLocation) +
    pickupRow

  const body = isBooked
    ? `${studentName.split(' ')[0]} acaba de reservar una práctica. Aquí tienes los detalles:`
    : `${studentName.split(' ')[0]} ha cancelado su reserva. Quedas libre en ese hueco.`

  const content = `
    <p style="margin:0 0 6px;color:${accentColor};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${actionLabel}</p>
    <h1 style="margin:0 0 16px;color:#0a0f1a;font-size:22px;font-weight:900">Hola, ${instructorName}</h1>
    <p style="margin:0 0 24px;color:#4a6080;font-size:15px;line-height:1.7">${body}</p>
    ${infoCard(rows, accentBg, accentBorder)}
  `

  return emailWrapper(content)
}

export async function POST(req: NextRequest) {
  try {
    const { instructorId, studentId, studentToken, studentName, practiceDate, startTime, practiceType, practiceSubtype, pickupLocation, action } =
      await req.json()

    if (!instructorId || !studentId || !studentToken || !studentName || !practiceDate || !startTime || !practiceType || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar que el token pertenece al alumno que hace la acción
    const { data: caller } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('token', studentToken)
      .single()

    if (!caller) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { data: instructor } = await supabase
      .from('instructors')
      .select('name, email')
      .eq('id', instructorId)
      .single()

    if (!instructor?.email) {
      return NextResponse.json({ sent: false, reason: 'Instructor has no email' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const time = startTime.substring(0, 5)
    const label = getPracticeLabel(practiceType, practiceSubtype ?? null)
    const html = buildInstructorEmail(instructor.name, studentName, practiceDate, time, label, pickupLocation ?? null, action)

    const subject = action === 'booked'
      ? `Nueva reserva: ${studentName} · ${getDayNameEs(practiceDate)} ${time}`
      : `Cancelación: ${studentName} · ${getDayNameEs(practiceDate)} ${time}`

    await resend.emails.send({ from: FROM_EMAIL, to: instructor.email, subject, html })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('notify-instructor error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
