'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTime, formatDate, getDayName, toDateString, getPracticeLabel, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { Booking } from '@/types'

export default function InstructorPage() {
  const supabase = createClient()
  const today = toDateString(new Date())

  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [instructorName, setInstructorName] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: instructor } = await supabase
      .from('instructors')
      .select('id, name')
      .eq('user_id', user.id)
      .single()
    if (instructor) {
      setInstructorId(instructor.id)
      setInstructorName(instructor.name)
      fetchBookings(instructor.id)
    } else {
      setLoading(false)
    }
  }

  async function fetchBookings(id: string) {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, student:students(full_name, order_number)')
      .eq('instructor_id', id)
      .eq('practice_date', today)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })
    if (data) setBookings(data)
    setLoading(false)
  }

  async function markCompleted(booking: Booking) {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id)
    fetch('/api/notify-milestone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: booking.student_id, instructorId: booking.instructor_id }),
    }).catch(() => {})
    if (instructorId) fetchBookings(instructorId)
  }

  const completedCount = bookings.filter(b => b.status === 'completed').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#0057B8' }}>Panel de instructor</p>
          <h1 className="text-3xl font-black text-white tracking-tight">{getDayName(today)}</h1>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>{formatDate(today)}{instructorName ? ` · ${instructorName}` : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total hoy', value: bookings.length, color: 'white' },
          { label: 'Completadas', value: completedCount, color: '#34d399' },
          { label: 'Pendientes', value: bookings.length - completedCount, color: '#0057B8' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-5" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b8ab0' }}>{stat.label}</p>
            <p className="text-4xl font-black" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: '#6b8ab0' }}>Cargando...</div>
      ) : !instructorId ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <p className="text-white font-semibold">Sin instructor asignado</p>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>Pide al administrador que vincule tu cuenta</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <p className="font-semibold text-white">Sin prácticas hoy</p>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>No tienes prácticas programadas para hoy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(booking => (
            <div
              key={booking.id}
              className="rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{ background: '#0d1829', border: '1px solid #1a2d45' }}
            >
              <div className="w-1 h-12 rounded-full flex-shrink-0" style={{
                background: booking.practice_type === 'car' ? '#0057B8' : booking.practice_type === 'moto' ? '#a78bfa' : '#38bdf8'
              }} />
              <div className="text-center min-w-[56px]">
                <p className="text-white font-black text-xl leading-none">{formatTime(booking.start_time)}</p>
                <p className="text-xs mt-1" style={{ color: '#3a5070' }}>{formatTime(booking.end_time)}</p>
              </div>
              <div className="w-px h-10" style={{ background: '#1a2d45' }} />
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{(booking.student as any)?.full_name ?? '—'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                    background: booking.practice_type === 'car' ? '#0057B820' : booking.practice_type === 'moto' ? '#a78bfa20' : '#38bdf820',
                    color: booking.practice_type === 'car' ? '#0057B8' : booking.practice_type === 'moto' ? '#a78bfa' : '#38bdf8',
                  }}>
                    {getPracticeLabel(booking.practice_type, (booking as any).practice_subtype)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
              </div>
              <div className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: '#0f1c2e', color: '#3a5070' }}>
                #{(booking.student as any)?.order_number ?? '—'}
              </div>
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => markCompleted(booking)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-150"
                  style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.1)'}
                >
                  ✓ Completar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
