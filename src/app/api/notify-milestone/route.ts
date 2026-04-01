import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function formatDateEs(dateStr: string): string {
  const [y, m, day] = dateStr.split('-')
  return `${day}/${m}/${y}`
}

function buildMilestoneEmail(studentName: string, count: number, token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autoescuela-app.vercel.app'
  const bookingUrl = `${appUrl}/s/${token}`

  const milestoneMessages: Record<number, { title: string; body: string; emoji: string }> = {
    5:  { emoji: '🌱', title: '¡5 prácticas completadas!', body: 'Llevas 5 prácticas. ¡Vas por buen camino! Sigue así y pronto estarás listo para el examen.' },
    10: { emoji: '🚗', title: '¡10 prácticas completadas!', body: 'Ya tienes 10 prácticas a tus espaldas. ¡Cada clase te acerca más a tu carnet!' },
    15: { emoji: '⭐', title: '¡15 prácticas completadas!', body: '15 prácticas y contando. Estás demostrando mucha constancia. ¡El carnet está cada vez más cerca!' },
    20: { emoji: '🏆', title: '¡20 prácticas completadas!', body: '¡Increíble! 20 prácticas completadas. Eres un ejemplo de dedicación. ¡A por el examen!' },
  }

  const msg = milestoneMessages[count] ?? {
    emoji: '🎯',
    title: `¡${count} prácticas completadas!`,
    body: `Has completado ${count} prácticas de conducción. ¡Sigue así!`,
  }

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
                  <span style="font-size:24px">${msg.emoji}</span>
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
            <p style="margin:0 0 8px;color:#0057B8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Hito alcanzado</p>
            <h1 style="margin:0 0 8px;color:#0a0f1a;font-size:26px;font-weight:900">${msg.title}</h1>
            <p style="margin:0 0 28px;color:#4a6080;font-size:15px;line-height:1.6">Hola, ${studentName}. ${msg.body}</p>

            <!-- Contador grande -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1.5px solid #bfdbfe;border-radius:12px;margin-bottom:28px">
              <tr><td style="padding:28px;text-align:center">
                <p style="margin:0;font-size:64px;font-weight:900;color:#0057B8;line-height:1">${count}</p>
                <p style="margin:8px 0 0;color:#6b8ab0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px">prácticas completadas</p>
              </td></tr>
            </table>

            <!-- Botón -->
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center">
                <a href="${bookingUrl}" style="display:inline-block;background:#0057B8;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px">
                  Reservar próxima práctica
                </a>
              </td></tr>
            </table>

            <p style="margin:28px 0 0;color:#9ab0c8;font-size:12px;text-align:center;line-height:1.6">
              ¡Sigue reservando para continuar progresando!
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
    const { studentId, instructorId } = await req.json()

    if (!studentId || !instructorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener datos del alumno
    const { data: student } = await supabase
      .from('students')
      .select('full_name, email, token')
      .eq('id', studentId)
      .single()

    if (!student?.email) {
      return NextResponse.json({ sent: false, reason: 'No email' })
    }

    // Contar prácticas completadas del alumno
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'completed')

    if (!count) {
      return NextResponse.json({ sent: false, reason: 'No completed bookings' })
    }

    // Obtener hitos configurados del instructor
    const { data: instructor } = await supabase
      .from('instructors')
      .select('milestone_counts')
      .eq('id', instructorId)
      .single()

    const milestones: number[] = instructor?.milestone_counts ?? [5, 10, 15, 20]

    if (!milestones.includes(count)) {
      return NextResponse.json({ sent: false, reason: `${count} is not a milestone` })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'notificaciones@autoescuela-bahillo.es'
    const html = buildMilestoneEmail(student.full_name, count, student.token)

    await resend.emails.send({
      from: fromEmail,
      to: student.email,
      subject: `¡${count} prácticas completadas! Sigue así, ${student.full_name.split(' ')[0]}`,
      html,
    })

    return NextResponse.json({ sent: true, milestone: count })
  } catch (err) {
    console.error('notify-milestone error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
