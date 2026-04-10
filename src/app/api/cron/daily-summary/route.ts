import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  FROM_EMAIL,
  emailWrapper,
  formatDateEs, getDayNameEs, getPracticeLabel,
} from '@/lib/email'

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
      const pickup = b.pickup_location
        ? `<br><span style="color:#6b8ab0;font-size:11px">📍 ${b.pickup_location}</span>`
        : ''
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

  const tableBlock = `
    <p style="margin:0 0 6px;color:#0057B8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Resumen del día</p>
    <h1 style="margin:0 0 6px;color:#0a0f1a;font-size:22px;font-weight:900">Buenos días, ${instructorName.split(' ')[0]}</h1>
    <p style="margin:0 0 24px;color:#4a6080;font-size:14px;line-height:1.6">
      ${getDayNameEs(date)}, ${formatDateEs(date)} · <strong>${bookings.length} ${bookings.length === 1 ? 'práctica' : 'prácticas'} hoy</strong>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafd;border:1.5px solid #dce8f5;border-radius:12px;overflow:hidden;margin-bottom:8px">
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
  `

  return emailWrapper(tableBlock)
}

function getTodayDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

  const today = getTodayDate()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_time, practice_type, practice_subtype, pickup_location, instructor_id, student:students(full_name, order_number)')
    .eq('practice_date', today)
    .eq('status', 'confirmed')
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!bookings || bookings.length === 0) return NextResponse.json({ sent: 0, reason: 'No bookings today' })

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
  let sent = 0

  for (const instructor of instructors) {
    if (!instructor.email) continue
    const instructorBookings = byInstructor.get(instructor.id) ?? []
    if (instructorBookings.length === 0) continue

    const html = buildSummaryEmail(instructor.name, today, instructorBookings)
    const count = instructorBookings.length
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: instructor.email,
        subject: `${count} ${count === 1 ? 'práctica' : 'prácticas'} hoy · ${getDayNameEs(today)} ${formatDateEs(today)}`,
        html,
      })
      sent++
    } catch (err) {
      console.error(`Error enviando resumen a ${instructor.email}:`, err)
    }
  }

  return NextResponse.json({ sent, instructors: instructors.length })
}
