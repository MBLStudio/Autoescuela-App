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

function buildSlotEmail(
  studentName: string,
  date: string,
  time: string,
  practiceLabel: string,
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

        <!-- Header azul -->
        <tr>
          <td style="background:#0057B8;padding:32px 40px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px">
                  <span style="font-size:24px">🔔</span>
                </td>
                <td style="padding-left:14px">
                  <p style="margin:0;color:#ffffff;font-size:18px;font-weight:900;letter-spacing:-0.3px">AUTO-ESCUELA BAHILLO</p>
                  <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px">Palencia</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 8px;color:#16a34a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">¡Hueco disponible!</p>
            <h1 style="margin:0 0 16px;color:#0a0f1a;font-size:24px;font-weight:900">Hola, ${studentName}</h1>
            <p style="margin:0 0 28px;color:#4a6080;font-size:15px;line-height:1.6">
              Se ha liberado un hueco de práctica. ¡Entra rápido antes de que lo reserve otro alumno!
            </p>

            <!-- Tarjeta del hueco -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;margin-bottom:28px">
              <tr><td style="padding:24px">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:14px;border-bottom:1px solid #bbf7d0">
                      <p style="margin:0;color:#16a34a;font-size:11px;font-weight:600;text-transform:uppercase">Día</p>
                      <p style="margin:4px 0 0;color:#0a0f1a;font-size:16px;font-weight:800">${getDayNameEs(date)}, ${formatDateEs(date)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 0;border-bottom:1px solid #bbf7d0">
                      <p style="margin:0;color:#16a34a;font-size:11px;font-weight:600;text-transform:uppercase">Hora</p>
                      <p style="margin:4px 0 0;color:#0a0f1a;font-size:16px;font-weight:800">${time}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:14px">
                      <p style="margin:0;color:#16a34a;font-size:11px;font-weight:600;text-transform:uppercase">Tipo de práctica</p>
                      <p style="margin:4px 0 0;color:#0a0f1a;font-size:16px;font-weight:800">${practiceLabel}</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Botón -->
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center">
                <a href="${bookingUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px">
                  Reservar este hueco
                </a>
              </td></tr>
            </table>

            <p style="margin:28px 0 0;color:#9ab0c8;font-size:12px;text-align:center;line-height:1.6">
              Los huecos se asignan por orden de llegada.<br>
              Si ya tienes una reserva para ese día, no podrás reservar este hueco.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f7fafd;padding:20px 40px;border-top:1px solid #dce8f5">
            <p style="margin:0;color:#9ab0c8;font-size:12px;text-align:center">
              Auto-Escuela Bahillo · Palencia<br>
              Este mensaje es una notificación automática.
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
    const { cancelledStudentId, instructorId, practiceDate, startTime, practiceType, practiceSubtype } =
      await req.json()

    if (!cancelledStudentId || !instructorId || !practiceDate || !startTime || !practiceType) {
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

    // Buscar alumnos elegibles: mismo instructor, práctica habilitada, activos, con email, excluyendo quien canceló
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

    // Filtrar por tipo de práctica habilitado
    const eligible = students.filter(
      (s) => s.email && Array.isArray(s.practice_types) && s.practice_types.includes(practiceType)
    )

    if (eligible.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No students with this practice type' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'notificaciones@autoescuela-bahillo.es'
    const time = startTime.substring(0, 5)
    const label = getPracticeLabel(practiceType, practiceSubtype ?? null)
    let sent = 0

    for (const student of eligible) {
      if (!student.email) continue
      const html = buildSlotEmail(student.full_name, practiceDate, time, label, student.token)
      try {
        await resend.emails.send({
          from: fromEmail,
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
