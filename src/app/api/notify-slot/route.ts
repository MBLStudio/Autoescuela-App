import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  APP_URL, FROM_EMAIL,
  emailWrapper, infoCard, infoRow, ctaButton,
  formatDateEs, getDayNameEs, getPracticeLabel,
} from '@/lib/email'

function buildSlotEmail(
  studentName: string,
  date: string,
  time: string,
  practiceLabel: string,
  token: string
): string {
  const bookingUrl = `${APP_URL}/s/${token}`
  const firstName = studentName.split(' ')[0]

  const rows =
    infoRow('Día', `${getDayNameEs(date)}, ${formatDateEs(date)}`, '#86efac') +
    infoRow('Hora', time, '#86efac') +
    infoRow('Tipo de práctica', practiceLabel, '#86efac', true)

  const content = `
    <p style="margin:0 0 6px;color:#16a34a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">¡Hueco disponible!</p>
    <h1 style="margin:0 0 16px;color:#0a0f1a;font-size:23px;font-weight:900">¡Hola, ${firstName}!</h1>
    <p style="margin:0 0 28px;color:#4a6080;font-size:15px;line-height:1.7">
      Se ha liberado un hueco de práctica. Entra rápido antes de que lo reserve otro alumno, ¡los huecos se asignan por orden de llegada!
    </p>
    ${infoCard(rows, '#f0fdf4', '#86efac')}
    ${ctaButton(bookingUrl, 'Reservar este hueco →', '#16a34a')}
    <p style="margin:20px 0 0;color:#9ab0c8;font-size:12px;text-align:center;line-height:1.6">
      Si ya tienes una reserva para ese día, este hueco no estará disponible para ti.
    </p>
  `

  return emailWrapper(content, { url: bookingUrl, label: 'Ver mis reservas' })
}

export async function POST(req: NextRequest) {
  try {
    const { cancelledStudentId, studentToken, instructorId, practiceDate, startTime, practiceType, practiceSubtype } =
      await req.json()

    if (!cancelledStudentId || !studentToken || !instructorId || !practiceDate || !startTime || !practiceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Solo notificar si la práctica es en el futuro
    const today = new Date().toISOString().split('T')[0]
    if (practiceDate <= today) {
      return NextResponse.json({ sent: 0, reason: 'Past date' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar que el token pertenece al alumno que cancela
    const { data: caller } = await supabase
      .from('students')
      .select('id')
      .eq('id', cancelledStudentId)
      .eq('token', studentToken)
      .single()

    if (!caller) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { data: students, error } = await supabase
      .from('students')
      .select('id, full_name, email, token, practice_types')
      .eq('instructor_id', instructorId)
      .eq('is_active', true)
      .neq('id', cancelledStudentId)
      .not('email', 'is', null)

    if (error || !students || students.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No eligible students' })
    }

    const eligible = students.filter(
      (s) => s.email && Array.isArray(s.practice_types) && s.practice_types.includes(practiceType)
    )

    if (eligible.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No students with this practice type' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const time = startTime.substring(0, 5)
    const label = getPracticeLabel(practiceType, practiceSubtype ?? null)
    let sent = 0

    for (const student of eligible) {
      if (!student.email) continue
      const html = buildSlotEmail(student.full_name, practiceDate, time, label, student.token)
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: student.email,
          subject: `¡Hueco libre! Práctica de ${label} el ${getDayNameEs(practiceDate)} a las ${time}`,
          html,
        })
        sent++
      } catch (err) {
        console.error(`Error enviando notificación a ${student.email}:`, err)
      }
    }

    return NextResponse.json({ sent, total: eligible.length })
  } catch (err) {
    console.error('notify-slot error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
