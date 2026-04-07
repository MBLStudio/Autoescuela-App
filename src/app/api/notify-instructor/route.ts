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
  const accentBg = isBooked ? '#f0fdf4' : '#fef2f2'
  const accentBorder = isBooked ? '#86efac' : '#fca5a5'
  const actionLabel = isBooked ? 'Nueva reserva' : 'Reserva cancelada'
  const emoji = isBooked ? '📅' : '❌'

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
                  <span style="font-size:22px">${emoji}</span>
                </td>
                <td style="padding-left:14px">
                  <p style="margin:0;color:#ffffff;font-size:17px;font-weight:900">AUTO-ESCUELA BAHILLO</p>
                  <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px">Palencia</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px">
            <p style="margin:0 0 6px;color:${accentColor};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${actionLabel}</p>
            <h1 style="margin:0 0 20px;color:#0a0f1a;font-size:22px;font-weight:900">Hola, ${instructorName}</h1>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:${accentBg};border:1.5px solid ${accentBorder};border-radius:12px;margin-bottom:24px">
              <tr><td style="padding:20px 24px">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding-bottom:12px;border-bottom:1px solid ${accentBorder}">
                    <p style="margin:0;color:#6b8ab0;font-size:11px;font-weight:600;text-transform:uppercase">Alumno</p>
                    <p style="margin:4px 0 0;color:#0a0f1a;font-size:16px;font-weight:800">${studentName}</p>
                  </td></tr>
                  <tr><td style="padding:12px 0;border-bottom:1px solid ${accentBorder}">
                    <p style="margin:0;color:#6b8ab0;font-size:11px;font-weight:600;text-transform:uppercase">Día y hora</p>
                    <p style="margin:4px 0 0;color:#0a0f1a;font-size:16px;font-weight:800">${getDayNameEs(date)}, ${formatDateEs(date)} · ${time}</p>
                  </td></tr>
                  <tr><td style="padding:12px 0${pickupLocation ? ';border-bottom:1px solid ' + accentBorder : ''}">
                    <p style="margin:0;color:#6b8ab0;font-size:11px;font-weight:600;text-transform:uppercase">Práctica</p>
                    <p style="margin:4px 0 0;color:#0a0f1a;font-size:16px;font-weight:800">${practiceLabel}</p>
                  </td></tr>
                  ${pickupLocation ? `<tr><td style="padding-top:12px">
                    <p style="margin:0;color:#6b8ab0;font-size:11px;font-weight:600;text-transform:uppercase">Lugar de recogida</p>
                    <p style="margin:4px 0 0;color:#0a0f1a;font-size:15px;font-weight:700">📍 ${pickupLocation}</p>
                  </td></tr>` : ''}
                </table>
              </td></tr>
            </table>

            <p style="margin:0;color:#9ab0c8;font-size:12px;text-align:center;line-height:1.6">
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

export async function POST(req: NextRequest) {
  try {
    const { instructorId, studentName, practiceDate, startTime, practiceType, practiceSubtype, pickupLocation, action } =
      await req.json()

    if (!instructorId || !studentName || !practiceDate || !startTime || !practiceType || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: instructor } = await supabase
      .from('instructors')
      .select('name, email')
      .eq('id', instructorId)
      .single()

    if (!instructor?.email) {
      return NextResponse.json({ sent: false, reason: 'Instructor has no email' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'notificaciones@autoescuela-bahillo.es'
    const time = startTime.substring(0, 5)
    const label = getPracticeLabel(practiceType, practiceSubtype ?? null)
    const html = buildInstructorEmail(instructor.name, studentName, practiceDate, time, label, pickupLocation ?? null, action)

    const subject = action === 'booked'
      ? `Nueva reserva: ${studentName} · ${getDayNameEs(practiceDate)} ${time}`
      : `Cancelación: ${studentName} · ${getDayNameEs(practiceDate)} ${time}`

    await resend.emails.send({ from: fromEmail, to: instructor.email, subject, html })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('notify-instructor error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
