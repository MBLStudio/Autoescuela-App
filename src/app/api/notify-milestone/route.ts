import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { APP_URL, FROM_EMAIL, ctaButton } from '@/lib/email'

// Logo SVG inline (camión)
const LOGO_SVG = `<svg width="34" height="34" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M96 280l52-156a24 24 0 0122.8-16.5h170.4A24 24 0 01463 280" stroke="white" stroke-width="28" stroke-linecap="round"/>
  <path d="M72 280h368v80a16 16 0 01-16 16H88a16 16 0 01-16-16v-80z" fill="white"/>
  <circle cx="168" cy="392" r="44" fill="#0057B8" stroke="white" stroke-width="20"/>
  <circle cx="344" cy="392" r="44" fill="#0057B8" stroke="white" stroke-width="20"/>
  <path d="M212 392h88" stroke="white" stroke-width="20" stroke-linecap="round"/>
</svg>`

function buildMilestoneEmail(studentName: string, count: number, token: string): string {
  const bookingUrl = `${APP_URL}/s/${token}`
  const firstName = studentName.split(' ')[0]

  const milestoneMessages: Record<number, { title: string; body: string; accent: string }> = {
    5:  { accent: '#f59e0b', title: `¡${firstName}, llevas 5 prácticas!`,         body: 'Estás cogiendo el ritmo. Sigue reservando y cada vez te saldrán mejor.' },
    10: { accent: '#0057B8', title: `¡${firstName}, 10 prácticas completadas!`,   body: '¡Diez clases ya! Cada kilómetro recorrido te acerca más al carnet.' },
    15: { accent: '#7c3aed', title: `¡${firstName}, 15 prácticas!`,               body: 'Qué constancia. El examen práctico ya no queda tan lejos, ¡ánimo!' },
    20: { accent: '#16a34a', title: `¡${firstName}, 20 prácticas completadas!`,   body: 'Veinte prácticas son muchas horas al volante. Eres un ejemplo. ¡A por el examen!' },
  }

  const msg = milestoneMessages[count] ?? {
    accent: '#0057B8',
    title: `¡${firstName}, ${count} prácticas completadas!`,
    body: `Has alcanzado las ${count} prácticas de conducción. ¡Sigue así!`,
  }

  const paymentBlock = count === 5 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:12px;margin-bottom:24px">
      <tr><td style="padding:20px 24px">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:14px;vertical-align:top"><span style="font-size:28px">💳</span></td>
            <td>
              <p style="margin:0 0 4px;color:#92400e;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px">Recordatorio de pago</p>
              <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6">
                Llevas 5 prácticas realizadas. Pásate por la oficina para abonarlas antes de continuar. ¡Así no se acumula! 😄
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
          <td style="background:#0057B8;padding:24px 36px">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:rgba(255,255,255,0.18);border-radius:14px;padding:11px 13px;vertical-align:middle">
                        ${LOGO_SVG}
                      </td>
                      <td style="padding-left:14px">
                        <p style="margin:0;color:#ffffff;font-size:17px;font-weight:900;letter-spacing:0.3px">AUTO-ESCUELA BAHILLO</p>
                        <p style="margin:3px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.5px">Palencia · Prácticas de conducción</p>
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
          <td style="padding:32px 36px">
            <h1 style="margin:0 0 10px;color:#0a0f1a;font-size:22px;font-weight:900">${msg.title}</h1>
            <p style="margin:0 0 28px;color:#4a6080;font-size:15px;line-height:1.7">${msg.body}</p>

            ${paymentBlock}

            ${ctaButton(bookingUrl, 'Reservar próxima práctica →')}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f7fafd;padding:16px 36px;border-top:1px solid #e8f0f8;text-align:center">
            <p style="margin:0;color:#9ab0c8;font-size:11px;line-height:1.8">
              <a href="${bookingUrl}" style="color:#0057B8;text-decoration:none">Ver mis reservas</a><br>
              <span style="color:#c5d5e8">Notificación automática · No respondas a este mensaje</span>
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

    const { data: student } = await supabase
      .from('students')
      .select('full_name, email, token')
      .eq('id', studentId)
      .single()

    if (!student?.email) {
      return NextResponse.json({ sent: false, reason: 'No email' })
    }

    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'completed')

    if (!count) {
      return NextResponse.json({ sent: false, reason: 'No completed bookings' })
    }

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
    const html = buildMilestoneEmail(student.full_name, count, student.token)

    await resend.emails.send({
      from: FROM_EMAIL,
      to: student.email,
      subject: `¡${count} prácticas completadas! ${student.full_name.split(' ')[0]}, ¡sigue así!`,
      html,
    })

    return NextResponse.json({ sent: true, milestone: count })
  } catch (err) {
    console.error('notify-milestone error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
