import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function formatDateEs(dateStr: string): string {
  const [y, m, day] = dateStr.split('-')
  return `${day}/${m}/${y}`
}

const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13M3 13v5a1 1 0 001 1h1a2 2 0 004 0h8a2 2 0 004 0h1a1 1 0 001-1v-5M3 13h18" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

function buildMilestoneEmail(studentName: string, count: number, token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autoescuela-app.vercel.app'
  const bookingUrl = `${appUrl}/s/${token}`
  const firstName = studentName.split(' ')[0]

  const milestoneMessages: Record<number, { title: string; body: string; accent: string }> = {
    5:  { accent: '#f59e0b', title: `¡${firstName}, llevas 5 prácticas!`, body: 'Vas por buen camino. Sigue reservando para continuar progresando.' },
    10: { accent: '#0057B8', title: `¡${firstName}, 10 prácticas completadas!`, body: 'Ya tienes 10 prácticas a tus espaldas. ¡Cada clase te acerca más a tu carnet!' },
    15: { accent: '#7c3aed', title: `¡${firstName}, 15 prácticas!`, body: 'Estás demostrando mucha constancia. ¡El carnet está cada vez más cerca!' },
    20: { accent: '#16a34a', title: `¡${firstName}, 20 prácticas completadas!`, body: '¡Increíble dedicación! Eres un ejemplo. ¡A por el examen!' },
  }

  const msg = milestoneMessages[count] ?? {
    accent: '#0057B8',
    title: `¡${firstName}, ${count} prácticas completadas!`,
    body: `Has completado ${count} prácticas de conducción. ¡Sigue así!`,
  }

  const paymentBlock = count === 5 ? `
            <!-- Aviso de pago -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:12px;margin-bottom:24px">
              <tr><td style="padding:20px 24px">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:14px;vertical-align:top">
                      <span style="font-size:28px">💳</span>
                    </td>
                    <td>
                      <p style="margin:0 0 4px;color:#92400e;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px">Recordatorio de pago</p>
                      <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6">
                        Llevas 5 prácticas realizadas. Pásate por la oficina de Auto-Escuela Bahillo para abonar las prácticas realizadas. ¡Si no, habrá que pagarlas todas de golpe! 😄
                      </p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#0057B8;padding:28px 40px">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 12px;vertical-align:middle">
                        ${LOGO_SVG}
                      </td>
                      <td style="padding-left:14px">
                        <p style="margin:0;color:#ffffff;font-size:17px;font-weight:900;letter-spacing:0.5px">AUTO-ESCUELA BAHILLO</p>
                        <p style="margin:2px 0 0;color:rgba(255,255,255,0.65);font-size:12px">Palencia · Prácticas de conducción</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right">
                  <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Hito alcanzado</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Contador destacado -->
        <tr>
          <td style="background:${msg.accent};padding:24px 40px;text-align:center">
            <p style="margin:0;font-size:72px;font-weight:900;color:#ffffff;line-height:1">${count}</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px">prácticas completadas</p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:32px 40px">
            <h1 style="margin:0 0 10px;color:#0a0f1a;font-size:22px;font-weight:900">${msg.title}</h1>
            <p style="margin:0 0 28px;color:#4a6080;font-size:15px;line-height:1.7">${msg.body}</p>

            ${paymentBlock}

            <!-- Botón -->
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center">
                <a href="${bookingUrl}" style="display:inline-block;background:#0057B8;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px">
                  Reservar próxima práctica →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f7fafd;padding:18px 40px;border-top:1px solid #dce8f5">
            <p style="margin:0;color:#9ab0c8;font-size:11px;text-align:center;line-height:1.8">
              Auto-Escuela Bahillo · C/ Ejemplo, Palencia<br>
              Notificación automática · <a href="${appUrl}/s/${token}" style="color:#0057B8;text-decoration:none">Ver mis reservas</a>
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
