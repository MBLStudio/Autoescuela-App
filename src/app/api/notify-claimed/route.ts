import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { studentId, instructorName } = await req.json()
  if (!studentId || !instructorName) return NextResponse.json({ sent: false })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: student } = await supabase
    .from('students')
    .select('full_name, email, token, practice_types')
    .eq('id', studentId)
    .single()

  if (!student?.email) return NextResponse.json({ sent: false, reason: 'no email' })

  const firstName = student.full_name.split(' ')[0]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autoescuela-app.vercel.app'
  const bookingUrl = `${appUrl}/s/${student.token}`

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <tr>
          <td style="background:#0057B8;padding:32px 40px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px">
                  <span style="font-size:24px">🎉</span>
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
            <p style="margin:0 0 8px;color:#0057B8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">¡Buenas noticias!</p>
            <h1 style="margin:0 0 20px;color:#0a0f1a;font-size:24px;font-weight:900">Hola, ${firstName} 👋</h1>
            <p style="margin:0 0 24px;color:#4a6080;font-size:15px;line-height:1.7">
              <strong>${instructorName}</strong> te ha elegido para realizar tus prácticas de conducción con él en Auto-Escuela Bahillo.<br><br>
              ¿A qué esperas? Ya puedes reservar tu primera práctica. ¡Vamos a ello, campeón!
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px">
              <tr><td align="center">
                <a href="${bookingUrl}"
                  style="display:inline-block;background:#0057B8;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px">
                  Reservar mi primera práctica →
                </a>
              </td></tr>
            </table>

            <p style="margin:0;color:#9ab0c8;font-size:12px;text-align:center;line-height:1.6">
              Auto-Escuela Bahillo · Palencia<br>
              Notificación automática
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'notificaciones@autoescuela-bahillo.es'

  try {
    await resend.emails.send({
      from: fromEmail,
      to: student.email,
      subject: `${instructorName} te ha elegido · Auto-Escuela Bahillo`,
      html,
    })
    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('Error notify-claimed:', err)
    return NextResponse.json({ sent: false })
  }
}
