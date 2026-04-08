import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function formatDateEs(dateStr: string): string {
  const [y, m, day] = dateStr.split('-')
  return `${day}/${m}/${y}`
}

function getDayNameEs(dateStr: string): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[new Date(dateStr + 'T00:00:00').getDay()]
}

function getPracticeLabel(type: string, subtype: string | null): string {
  if (type === 'car') return 'Coche'
  if (type === 'moto' && subtype === 'pista') return 'Moto Pista'
  if (type === 'moto' && subtype === 'circulacion') return 'Moto Circulación'
  if (type === 'moto') return 'Moto'
  if (subtype === 'pista') return 'Camión Pista'
  if (subtype === 'circulacion') return 'Camión Circulación'
  return 'Camión'
}

type BookingRow = {
  start_time: string
  practice_type: string
  practice_subtype: string | null
  pickup_location: string | null
  student: { full_name: string; order_number: number } | null
}

function buildSummaryEmail(instructorName: string, date: string, bookings: BookingRow[]): string {
  const rows = bookings
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map(b => {
      const time = b.start_time.substring(0, 5)
      const label = getPracticeLabel(b.practice_type, b.practice_subtype)
      const name = b.student?.full_name ?? '—'
      const num = b.student?.order_number ?? '—'
      const pickup = b.pickup_location ? `<br><span style="color:#6b8ab0;font-size:11px">📍 ${b.pickup_location}</span>` : ''
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e8f0f8;vertical-align:top">
            <p style="margin:0;color:#0057B8;font-size:15px;font-weight:900;font-family:monospace">${time}</p>
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid #e8f0f8;vertical-align:top">
            <p style="margin:0;color:#0a0f1a;font-size:14px;font-weight:700">${name} <span style="color:#9ab0c8;font-weight:400;font-size:12px">#${num}</span></p>
            <p style="margin:4px 0 0;color:#6b8ab0;font-size:12px">${label}${pickup}</p>
          </td>
        </tr>`
    }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <tr>
          <td style="background:#0057B8;padding:28px 40px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px">
                  <span style="font-size:22px">📋</span>
                </td>
                <td style="padding-left:14px">
                  <p style="margin:0;color:#ffffff;font-size:17px;font-weight:900">AUTO-ESCUELA BAHILLO</p>
                  <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px">Resumen del día</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px">
            <p style="margin:0 0 6px;color:#0057B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Buenos días</p>
            <h1 style="margin:0 0 6px;color:#0a0f1a;font-size:22px;font-weight:900">${instructorName}</h1>
            <p style="margin:0 0 24px;color:#4a6080;font-size:14px">
              ${getDayNameEs(date)}, ${formatDateEs(date)} · <strong>${bookings.length} ${bookings.length === 1 ? 'práctica' : 'prácticas'} hoy</strong>
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafd;border:1.5px solid #dce8f5;border-radius:12px;overflow:hidden">
              <thead>
                <tr style="background:#eef4fb">
                  <td style="padding:10px 16px;color:#6b8ab0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:56px">Hora</td>
                  <td style="padding:10px 16px;color:#6b8ab0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Alumno</td>
                </tr>
              </thead>
              <tbody style="background:#ffffff">
                <tr><td colspan="2" style="padding:0 16px">
                  <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
                </td></tr>
              </tbody>
            </table>

            <p style="margin:24px 0 0;color:#9ab0c8;font-size:12px;text-align:center">
              Notificación automática · Auto-Escuela Bahillo
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
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

  const today = new Date().toISOString().split('T')[0]

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_time, practice_type, practice_subtype, pickup_location, instructor_id, student:students(full_name, order_number)')
    .eq('practice_date', today)
    .eq('status', 'confirmed')
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!bookings || bookings.length === 0) return NextResponse.json({ sent: 0, reason: 'No bookings today' })

  // Agrupar por instructor
  const byInstructor = new Map<string, BookingRow[]>()
  for (const b of bookings) {
    const list = byInstructor.get(b.instructor_id) ?? []
    list.push(b as unknown as BookingRow)
    byInstructor.set(b.instructor_id, list)
  }

  const { data: instructors } = await supabase
    .from('instructors')
    .select('id, name, email')
    .in('id', [...byInstructor.keys()])

  if (!instructors) return NextResponse.json({ sent: 0 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'notificaciones@autoescuela-bahillo.es'
  let sent = 0

  for (const instructor of instructors) {
    if (!instructor.email) continue
    const instructorBookings = byInstructor.get(instructor.id) ?? []
    if (instructorBookings.length === 0) continue

    const html = buildSummaryEmail(instructor.name, today, instructorBookings)
    try {
      await resend.emails.send({
        from: fromEmail,
        to: instructor.email,
        subject: `📋 ${instructorBookings.length} ${instructorBookings.length === 1 ? 'práctica' : 'prácticas'} hoy · ${getDayNameEs(today)} ${today.split('-').reverse().slice(0, 2).join('/')}`,
        html,
      })
      sent++
    } catch (err) {
      console.error(`Error enviando resumen a ${instructor.email}:`, err)
    }
  }

  return NextResponse.json({ sent, instructors: instructors.length })
}
