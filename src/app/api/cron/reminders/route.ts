import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  APP_URL, FROM_EMAIL,
  emailWrapper, infoCard, infoRow, ctaButton,
  formatDateEs, getDayNameEs, getPracticeLabel,
} from '@/lib/email'

function getTomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildReminderEmail(studentName: string, date: string, time: string, practiceLabel: string, token: string): string {
  const bookingUrl = `${APP_URL}/s/${token}`
  const firstName = studentName.split(' ')[0]

  const rows =
    infoRow('Día', `${getDayNameEs(date)}, ${formatDateEs(date)}`, '#dce8f5') +
    infoRow('Hora', time, '#dce8f5') +
    infoRow('Tipo de práctica', practiceLabel, '#dce8f5', true)

  const content = `
    <p style="margin:0 0 6px;color:#0057B8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Recordatorio de mañana</p>
    <h1 style="margin:0 0 16px;color:#0a0f1a;font-size:23px;font-weight:900">¡Hola, ${firstName}!</h1>
    <p style="margin:0 0 28px;color:#4a6080;font-size:15px;line-height:1.7">
      Te recordamos que mañana tienes una práctica de conducción confirmada. ¡No olvides el DNI y llega con un par de minutos de antelación!
    </p>
    ${infoCard(rows, '#f7fafd', '#dce8f5')}
    ${ctaButton(bookingUrl, 'Ver mi reserva →')}
    <p style="margin:20px 0 0;color:#9ab0c8;font-size:12px;text-align:center;line-height:1.6">
      Si no puedes asistir, cancela con más de 24 h de antelación<br>para liberar el hueco a otros alumnos.
    </p>
  `

  return emailWrapper(content, { url: bookingUrl, label: 'Ver mis reservas' })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const tomorrow = getTomorrowDate()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, start_time, practice_type, practice_subtype, student:students(full_name, email, token)')
    .eq('practice_date', tomorrow)
    .eq('status', 'confirmed')

  if (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No hay reservas mañana' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0

  for (const booking of bookings) {
    const student = (booking.student as unknown) as { full_name: string; email: string | null; token: string } | null
    if (!student?.email) continue

    const time = booking.start_time.substring(0, 5)
    const label = getPracticeLabel(booking.practice_type, booking.practice_subtype)
    const html = buildReminderEmail(student.full_name, tomorrow, time, label, student.token)

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: student.email,
        subject: `Recuerda: práctica de ${label} mañana a las ${time} · Auto-Escuela Bahillo`,
        html,
      })
      sent++
    } catch (err) {
      console.error(`Error enviando recordatorio a ${student.email}:`, err)
    }
  }

  return NextResponse.json({ sent, total: bookings.length })
}
