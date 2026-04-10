'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getDayName, toDateString } from '@/lib/utils'
import type { BlockedDay, BlockedSlot } from '@/types'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function FestivosPage() {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Día completo
  const [reason, setReason] = useState('')
  const [savingDay, setSavingDay] = useState(false)

  // Franjas horarias
  const [showSlotForm, setShowSlotForm] = useState(false)
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [savingSlot, setSavingSlot] = useState(false)

  useEffect(() => { fetchData() }, [currentMonth, currentYear])

  async function fetchData() {
    setLoading(true)
    const from = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
    const lastDay = getDaysInMonth(currentYear, currentMonth)
    const to = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const [{ data: daysData }, { data: slotsData }] = await Promise.all([
      supabase.from('blocked_days').select('*').gte('date', from).lte('date', to).order('date', { ascending: true }),
      supabase.from('blocked_slots').select('*').gte('date', from).lte('date', to).order('start_time', { ascending: true }),
    ])

    if (daysData) setBlockedDays(daysData)
    if (slotsData) setBlockedSlots(slotsData)
    setLoading(false)
  }

  function isBlockedDay(dateStr: string) {
    return blockedDays.some(b => b.date === dateStr)
  }

  function selectDate(dateStr: string) {
    setSelectedDate(prev => prev === dateStr ? null : dateStr)
    setReason('')
    setShowSlotForm(false)
    setBlockStart('')
    setBlockEnd('')
    setBlockReason('')
  }

  async function blockDay() {
    if (!selectedDate) return
    setSavingDay(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingDay(false); return }
    const { data } = await supabase.from('blocked_days').insert({
      instructor_id: user.id,
      date: selectedDate,
      reason: reason.trim() || null,
    }).select().single()
    if (data) setBlockedDays(prev => [...prev, data])
    setReason('')
    setSavingDay(false)
  }

  async function unblockDay(dateStr: string) {
    await supabase.from('blocked_days').delete().eq('date', dateStr)
    setBlockedDays(prev => prev.filter(b => b.date !== dateStr))
  }

  async function saveBlockedSlot() {
    if (!selectedDate || !blockStart || !blockEnd || blockStart >= blockEnd) return
    setSavingSlot(true)
    const { data: instructor } = await supabase.from('instructors').select('id').single()
    if (!instructor) { setSavingSlot(false); return }
    const { data: newSlot } = await supabase.from('blocked_slots').insert({
      instructor_id: instructor.id,
      date: selectedDate,
      start_time: blockStart,
      end_time: blockEnd,
      reason: blockReason.trim() || null,
    }).select().single()
    if (newSlot) setBlockedSlots(prev => [...prev, newSlot])

    // Cancelar reservas en ese rango y notificar a los alumnos afectados
    fetch('/api/cancel-slot-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructorId: instructor.id,
        date: selectedDate,
        startTime: blockStart,
        endTime: blockEnd,
        reason: blockReason.trim() || null,
      }),
    }).catch(() => {})

    setBlockStart('')
    setBlockEnd('')
    setBlockReason('')
    setShowSlotForm(false)
    setSavingSlot(false)
  }

  async function deleteBlockedSlot(id: string) {
    await supabase.from('blocked_slots').delete().eq('id', id)
    setBlockedSlots(prev => prev.filter(b => b.id !== id))
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  return (
    <div className="p-8">

      {/* Cabecera */}
      <div className="mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#0057B8' }}>Configuración</p>
        <h1 className="text-3xl font-black text-white tracking-tight">Festivos y horarios</h1>
        <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>Bloquea días completos o franjas horarias específicas</p>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Calendario */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>

          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1a2d45' }}>
            <button onClick={prevMonth} style={{ color: '#6b8ab0' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6b8ab0'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-white font-black">{MONTHS[currentMonth]} {currentYear}</p>
            <button onClick={nextMonth} style={{ color: '#6b8ab0' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6b8ab0'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 px-3 pt-3">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-bold py-1.5" style={{ color: '#3a5070' }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 px-3 pb-3">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(currentYear, currentMonth, day)
              const dateStr = toDateString(date)
              const blocked = isBlockedDay(dateStr)
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === toDateString(today)
              const slotCount = blockedSlots.filter(s => s.date === dateStr).length

              return (
                <button
                  key={day}
                  onClick={() => selectDate(dateStr)}
                  className="rounded-lg text-sm font-bold py-2 transition-all duration-150 relative"
                  style={{
                    background: isSelected
                      ? blocked ? 'rgba(239,68,68,0.2)' : '#0057B820'
                      : blocked ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: blocked ? '#f87171' : isSelected ? '#0057B8' : isToday ? '#0057B8' : '#a0b8d0',
                    border: `1.5px solid ${isSelected ? (blocked ? 'rgba(239,68,68,0.5)' : '#0057B840') : 'transparent'}`,
                    textDecoration: blocked ? 'line-through' : 'none',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = blocked ? 'rgba(239,68,68,0.15)' : '#0057B810' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = blocked ? 'rgba(239,68,68,0.1)' : 'transparent' }}
                >
                  {day}
                  {slotCount > 0 && !blocked && (
                    <span className="absolute bottom-0.5 right-1 text-xs" style={{ color: '#f87171', fontSize: '8px' }}>●</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Leyenda */}
          <div className="px-5 py-3 flex items-center gap-4 flex-wrap" style={{ borderTop: '1px solid #1a2d45' }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
              <p className="text-xs" style={{ color: '#3a5070' }}>Día bloqueado</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#f87171', fontSize: '8px' }}>●</span>
              <p className="text-xs" style={{ color: '#3a5070' }}>Franja bloqueada</p>
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div>
          {!selectedDate ? (
            <div className="rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: '#1a2d45' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-white font-semibold">Selecciona un día</p>
              <p className="text-sm mt-1" style={{ color: '#3a5070' }}>Pincha en cualquier día del calendario para bloquearlo o añadir franjas horarias</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Cabecera fecha seleccionada */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-black text-lg">{getDayName(selectedDate)}</p>
                  <p className="text-sm" style={{ color: '#6b8ab0' }}>{formatDate(selectedDate)}</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 rounded-lg transition"
                  style={{ color: '#3a5070' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3a5070'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sección 1: Día completo */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
                <div className="px-5 py-3" style={{ background: '#0a1220', borderBottom: '1px solid #1a2d45' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>🚫 Día completo</p>
                </div>
                {isBlockedDay(selectedDate) ? (
                  <div className="px-5 py-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#f87171' }}>Día bloqueado</p>
                      <p className="text-xs mt-0.5" style={{ color: '#3a5070' }}>
                        {blockedDays.find(b => b.date === selectedDate)?.reason ?? 'Sin motivo'}
                      </p>
                    </div>
                    <button
                      onClick={() => unblockDay(selectedDate)}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold transition flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'}
                    >
                      Desbloquear
                    </button>
                  </div>
                ) : (
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-xs" style={{ color: '#6b8ab0' }}>Los alumnos no podrán reservar ninguna hora este día</p>
                    <input
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Motivo (ej: Festivo, Vacaciones...)"
                      className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                      style={{ background: '#0a1220', border: '1.5px solid #1a2d45' }}
                      onFocus={e => e.target.style.borderColor = '#f87171'}
                      onBlur={e => e.target.style.borderColor = '#1a2d45'}
                    />
                    <button
                      onClick={blockDay}
                      disabled={savingDay}
                      className="w-full py-2.5 rounded-xl text-sm font-bold transition"
                      style={{ background: savingDay ? '#1a2d45' : '#ef4444', color: savingDay ? '#3a5070' : 'white' }}
                    >
                      {savingDay ? 'Guardando...' : '🚫 Bloquear día completo'}
                    </button>
                  </div>
                )}
              </div>

              {/* Sección 2: Franjas horarias */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#0a1220', borderBottom: '1px solid #1a2d45' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>🔒 Franjas horarias</p>
                  <button
                    onClick={() => { setShowSlotForm(v => !v); setBlockStart(''); setBlockEnd(''); setBlockReason('') }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    style={{
                      background: showSlotForm ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                  >
                    {showSlotForm ? '✕ Cancelar' : '+ Nueva franja'}
                  </button>
                </div>

                {showSlotForm && (
                  <div className="px-5 py-4 space-y-4" style={{ background: 'rgba(239,68,68,0.03)', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>

                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#6b8ab0' }}>Accesos rápidos</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: '☀️ Mañana entera', start: '08:00', end: '14:00' },
                          { label: '🌆 Tarde entera', start: '16:00', end: '19:30' },
                          { label: '🕐 Primera hora', start: '08:00', end: '10:00' },
                          { label: '🕔 Última hora', start: '18:00', end: '19:30' },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            onClick={() => { setBlockStart(preset.start); setBlockEnd(preset.end) }}
                            className="py-2 px-3 rounded-xl text-xs font-semibold text-left transition"
                            style={{
                              background: blockStart === preset.start && blockEnd === preset.end ? 'rgba(239,68,68,0.15)' : '#0a1220',
                              border: `1.5px solid ${blockStart === preset.start && blockEnd === preset.end ? 'rgba(239,68,68,0.4)' : '#1a2d45'}`,
                              color: blockStart === preset.start && blockEnd === preset.end ? '#f87171' : '#6b8ab0',
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#6b8ab0' }}>O elige horas exactas</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#3a5070' }}>Desde</p>
                          <input
                            type="time"
                            value={blockStart}
                            onChange={e => setBlockStart(e.target.value)}
                            className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                            style={{ background: '#0a1220', border: '1.5px solid #1a2d45' }}
                          />
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#3a5070' }}>Hasta</p>
                          <input
                            type="time"
                            value={blockEnd}
                            onChange={e => setBlockEnd(e.target.value)}
                            className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                            style={{ background: '#0a1220', border: '1.5px solid #1a2d45' }}
                          />
                        </div>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      placeholder="Motivo (ej: Médico, Examen teórico...)"
                      className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                      style={{ background: '#0a1220', border: '1.5px solid #1a2d45' }}
                    />

                    {blockStart && blockEnd && blockStart < blockEnd && (
                      <div className="rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <span style={{ color: '#f87171' }}>🔒</span>
                        <p className="text-sm font-bold" style={{ color: '#f87171' }}>
                          {blockStart} – {blockEnd}
                          {blockReason && <span className="font-normal text-xs ml-2" style={{ opacity: 0.7 }}>· {blockReason}</span>}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={saveBlockedSlot}
                      disabled={savingSlot || !blockStart || !blockEnd || blockStart >= blockEnd}
                      className="w-full py-3 rounded-xl text-sm font-bold transition"
                      style={{
                        background: savingSlot || !blockStart || !blockEnd || blockStart >= blockEnd ? '#1a2d45' : '#ef4444',
                        color: savingSlot || !blockStart || !blockEnd || blockStart >= blockEnd ? '#3a5070' : 'white',
                      }}
                    >
                      {savingSlot ? 'Guardando...' : '🔒 Confirmar bloqueo'}
                    </button>
                  </div>
                )}

                {blockedSlots.filter(b => b.date === selectedDate).length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-xs" style={{ color: '#1a2d45' }}>Sin franjas bloqueadas para este día</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#0f1c2e' }}>
                    {blockedSlots.filter(b => b.date === selectedDate).map(slot => (
                      <div key={slot.id} className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'rgba(239,68,68,0.1)' }}>
                          🔒
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black" style={{ color: '#f87171' }}>
                            {slot.start_time.substring(0, 5)} – {slot.end_time.substring(0, 5)}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#3a5070' }}>{slot.reason ?? 'Sin motivo'}</p>
                        </div>
                        <button
                          onClick={() => deleteBlockedSlot(slot.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-bold transition"
                          style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
