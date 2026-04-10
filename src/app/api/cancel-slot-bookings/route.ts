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

function buildCancelEmail(
  studentName: string,
  date: string,
  time: string,
  practiceLabel: string,
  reason: string | null,
  token: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autoescuela-app.vercel.app'
  const bookingUrl = `${appUrl}/s/${token}`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <tr>
          <td style="background:#dc2626;padding:32px 40px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px">
                  <span style="font-size:24px">⚠️</span>
                </td>
                <td style="padding-left:14px">
                  <p style="margin:0;color:#ffffff;font-size:18px;font-weight:900">AUTO-ESCUELA BAHILLO</p>
                  <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px">Palencia</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 8px;color:#dc2626;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Práctica cancelada</p>
            <h1 style="margin:0 0 16px;color:#0a0f1a;font-size:24px;font-weight:900">Hola, ${studentName}</h1>
            <p style="margin:0 0 24px;color:#4a6080;font-size:15px;line-height:1.7">
              Tu práctica del <strong>${getDayNameEs(date)} ${formatDateEs(date)}</strong> a las <strong>${time}</strong> ha sido cancelada por el instructor debido a una indisponibilidad.${reason ? `<br><br>Motivo: <em>${reason}</em>` : ''}
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;margin-bottom:28px">
              <tr><td style="padding:20px 24px">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:12px;border-bottom:1px solid #fecaca">
                      <p style="margin:0;color:#dc2626;font-size:11px;font-weight:600;text-transform:uppercase">Día cancelado</p>
                      <p style="margin:4px 0 0;color:#0a0f1a;font-size:15px;font-weight:800">${getDayNameEs(date)}, ${formatDateEs(date)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #fecaca">
                      <p style="margin:0;color:#dc2626;font-size:11px;font-weight:600;text-transform:uppercase">Hora</p>
                      <p style="margin:4px 0 0;color:#0a0f1a;font-size:15px;font-weight:800">${time}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px">
                      <p style="margin:0;color:#dc2626;font-size:11px;font-weight:600;text-transform:uppercase">Tipo</p>
                      <p style="margin:4px 0 0;color:#0a0f1a;font-size:15px;font-weight:800">${practiceLabel}</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <p style="margin:0 0 20px;color:#4a6080;font-size:14px;line-height:1.6">
              Puedes reservar otro hueco disponible desde tu panel:
            </p>

            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center">
                <a href="${bookingUrl}" style="display:inline-block;background:#0057B8;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px">
                  Ver huecos disponibles
                </a>
              </td></tr>
            </table>

            <p style="margin:24px 0 0;color:#9ab0c8;font-size:12px;text-align:center">
              Auto-Escuela Bahillo · Palencia
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// POST: cancela todas las reservas dentro de un rango horario y notifica a los alumnos
export async function POST(req: NextRequest) {
  const { instructorId, date, startTime, endTime, reason } = await req.json()
  if (!instructorId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar reservas confirmadas del instructor ese día que se solapen con el rango bloqueado
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, start_time, practice_type, practice_subtype, student:students(full_name, email, token)')
    .eq('instructor_id', instructorId)
    .eq('practice_date', date)
    .eq('status', 'confirmed')
    .gte('start_time', startTime)
    .lt('start_time', endTime)

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ cancelled: 0, reason: 'No bookings in range' })
  }

  // Cancelar todas
  const ids = bookings.map(b => b.id)
  await supabase.from('bookings').update({ status: 'cancelled' }).in('id', ids)

  // Notificar a cada alumno afectado
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'notificaciones@autoescuela-bahillo.es'
  let sent = 0

  for (const booking of bookings) {
    const student = booking.student as unknown as { full_name: string; email: string | null; token: string } | null
    if (!student?.email) continue

    const time = booking.start_time.substring(0, 5)
    const label = getPracticeLabel(booking.practice_type, booking.practice_subtype ?? null)
    const html = buildCancelEmail(student.full_name, date, time, label, reason ?? null, student.token)

    try {
      await resend.emails.send({
        from: fromEmail,
        to: student.email,
        subject: `Práctica cancelada · ${getDayNameEs(date)} ${formatDateEs(date)} a las ${time}`,
        html,
      })
      sent++
    } catch (err) {
      console.error(`Error notificando cancelación a ${student.email}:`, err)
    }
  }

  return NextResponse.json({ cancelled: bookings.length, notified: sent })
}
