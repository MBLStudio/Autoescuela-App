'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Instructor } from '@/types'

export default function ProfesoresPage() {
  const supabase = createClient()

  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)

  // Formulario de invitación
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Editar horario
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    schedule_morning: true, morning_start: '08:00', morning_end: '13:30',
    schedule_afternoon: true, afternoon_start: '16:00', afternoon_end: '19:15',
  })
  const [savingSchedule, setSavingSchedule] = useState(false)

  useEffect(() => { fetchInstructors() }, [])

  async function fetchInstructors() {
    setLoading(true)
    const { data } = await supabase
      .from('instructors')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setInstructors(data)
    setLoading(false)
  }

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword) {
      setInviteError('El nombre, email y contraseña son obligatorios')
      return
    }
    setInviting(true)
    setInviteError('')

    const res = await fetch('/api/profesores/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim(), password: invitePassword }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      setInviteError(data.error ?? 'No se pudo enviar la invitación')
      setInviting(false)
      return
    }

    setInviteSuccess(true)
    setInviteName('')
    setInviteEmail('')
    setInvitePassword('')
    setInviting(false)
    await fetchInstructors()
    setTimeout(() => {
      setInviteSuccess(false)
      setShowInvite(false)
    }, 3000)
  }

  async function saveSchedule(instructorId: string) {
    setSavingSchedule(true)
    await supabase.from('instructors').update(scheduleForm).eq('id', instructorId)
    setInstructors(prev => prev.map(i => i.id === instructorId ? { ...i, ...scheduleForm } : i))
    setEditingScheduleId(null)
    setSavingSchedule(false)
  }

  return (
    <div className="p-8 max-w-2xl">

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: '#0057B8' }}>Administración</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Profesores</h1>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteError(''); setInviteSuccess(false); setInvitePassword('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition"
          style={{ background: '#0057B8' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#004494'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0057B8'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Invitar profesor
        </button>
      </div>

      {/* Formulario de invitación */}
      {showInvite && (
        <div className="rounded-2xl p-5 mb-6 space-y-4" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <div className="flex items-center justify-between">
            <p className="text-white font-bold">Invitar nuevo profesor</p>
            <button
              onClick={() => setShowInvite(false)}
              style={{ color: '#6b8ab0' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {inviteSuccess ? (
            <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p className="font-bold text-sm" style={{ color: '#34d399' }}>¡Profesor creado!</p>
              <p className="text-xs mt-1" style={{ color: '#34d399', opacity: 0.7 }}>
                Ya puede acceder con su email y la contraseña que le has asignado.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0b8d0' }}>
                    Nombre completo <span style={{ color: '#0057B8' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder="Carlos García"
                    className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-all"
                    style={{ background: '#0a1220', border: '1.5px solid #1a2d45' }}
                    onFocus={e => e.target.style.borderColor = '#0057B8'}
                    onBlur={e => e.target.style.borderColor = '#1a2d45'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0b8d0' }}>
                    Email <span style={{ color: '#0057B8' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="profesor@autoescuela.com"
                    className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-all"
                    style={{ background: '#0a1220', border: '1.5px solid #1a2d45' }}
                    onFocus={e => e.target.style.borderColor = '#0057B8'}
                    onBlur={e => e.target.style.borderColor = '#1a2d45'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0b8d0' }}>
                  Contraseña <span style={{ color: '#0057B8' }}>*</span>
                </label>
                <input
                  type="password"
                  value={invitePassword}
                  onChange={e => setInvitePassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-all"
                  style={{ background: '#0a1220', border: '1.5px solid #1a2d45' }}
                  onFocus={e => e.target.style.borderColor = '#0057B8'}
                  onBlur={e => e.target.style.borderColor = '#1a2d45'}
                />
              </div>

              <div className="rounded-xl px-3 py-2.5 text-xs" style={{ background: '#0a1220', border: '1px solid #1a2d45', color: '#6b8ab0' }}>
                El profesor accederá con su email y esta contraseña. Pásasela por WhatsApp o en persona.
              </div>

              {inviteError && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {inviteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
                  style={{ background: '#0a1220', color: '#6b8ab0', border: '1px solid #1a2d45' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !invitePassword}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition"
                  style={{ background: inviting ? '#1a2d45' : '#0057B8', color: inviting ? '#3a5070' : 'white' }}
                  onMouseEnter={e => { if (!inviting) (e.currentTarget as HTMLElement).style.background = '#004494' }}
                  onMouseLeave={e => { if (!inviting) (e.currentTarget as HTMLElement).style.background = '#0057B8' }}
                >
                  {inviting ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Lista de profesores */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0057B8', borderTopColor: 'transparent' }} />
        </div>
      ) : instructors.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <p className="text-white font-bold">Sin profesores registrados</p>
          <p className="text-sm mt-1" style={{ color: '#3a5070' }}>Invita al primer profesor usando el botón de arriba.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1a2d45' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0057B8' }}>
              {instructors.length} {instructors.length === 1 ? 'profesor' : 'profesores'}
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: '#0f1c2e' }}>
            {instructors.map(inst => {
              const isEditing = editingScheduleId === inst.id
              return (
                <div key={inst.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm" style={{ background: '#0057B820', color: '#0057B8' }}>
                      {inst.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{inst.name}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#3a5070' }}>{inst.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingScheduleId(isEditing ? null : inst.id)
                          setScheduleForm({
                            schedule_morning: inst.schedule_morning ?? true,
                            morning_start: (inst.morning_start ?? '08:00').substring(0, 5),
                            morning_end: (inst.morning_end ?? '13:30').substring(0, 5),
                            schedule_afternoon: inst.schedule_afternoon ?? true,
                            afternoon_start: (inst.afternoon_start ?? '16:00').substring(0, 5),
                            afternoon_end: (inst.afternoon_end ?? '19:15').substring(0, 5),
                          })
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold transition"
                        style={{ color: '#6b8ab0', background: '#0a1220', border: '1px solid #1a2d45' }}
                      >
                        {isEditing ? 'Cancelar' : '⏰ Horario'}
                      </button>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>Activo</span>
                    </div>
                  </div>

                  {/* Resumen horario */}
                  {!isEditing && (
                    <div className="flex gap-3 text-xs" style={{ color: '#3a5070' }}>
                      {(inst.schedule_morning ?? true) && <span>☀️ {(inst.morning_start ?? '08:00').substring(0,5)} – {(inst.morning_end ?? '13:30').substring(0,5)}</span>}
                      {(inst.schedule_afternoon ?? true) && <span>🌆 {(inst.afternoon_start ?? '16:00').substring(0,5)} – {(inst.afternoon_end ?? '19:15').substring(0,5)}</span>}
                    </div>
                  )}

                  {/* Formulario horario */}
                  {isEditing && (
                    <div className="rounded-xl p-4 space-y-4" style={{ background: '#0a1220', border: '1px solid #1a2d45' }}>
                      {/* Mañana */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <input type="checkbox" id={`morning-${inst.id}`} checked={scheduleForm.schedule_morning}
                            onChange={e => setScheduleForm(f => ({ ...f, schedule_morning: e.target.checked }))} />
                          <label htmlFor={`morning-${inst.id}`} className="text-sm font-bold text-white cursor-pointer">Turno de mañana</label>
                        </div>
                        {scheduleForm.schedule_morning && (
                          <div className="grid grid-cols-2 gap-2 ml-6">
                            <div>
                              <p className="text-xs mb-1" style={{ color: '#6b8ab0' }}>Desde</p>
                              <input type="time" value={scheduleForm.morning_start}
                                onChange={e => setScheduleForm(f => ({ ...f, morning_start: e.target.value }))}
                                className="w-full rounded-lg px-2 py-1.5 text-white text-sm outline-none"
                                style={{ background: '#0d1829', border: '1px solid #1a2d45' }} />
                            </div>
                            <div>
                              <p className="text-xs mb-1" style={{ color: '#6b8ab0' }}>Hasta</p>
                              <input type="time" value={scheduleForm.morning_end}
                                onChange={e => setScheduleForm(f => ({ ...f, morning_end: e.target.value }))}
                                className="w-full rounded-lg px-2 py-1.5 text-white text-sm outline-none"
                                style={{ background: '#0d1829', border: '1px solid #1a2d45' }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tarde */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <input type="checkbox" id={`afternoon-${inst.id}`} checked={scheduleForm.schedule_afternoon}
                            onChange={e => setScheduleForm(f => ({ ...f, schedule_afternoon: e.target.checked }))} />
                          <label htmlFor={`afternoon-${inst.id}`} className="text-sm font-bold text-white cursor-pointer">Turno de tarde</label>
                        </div>
                        {scheduleForm.schedule_afternoon && (
                          <div className="grid grid-cols-2 gap-2 ml-6">
                            <div>
                              <p className="text-xs mb-1" style={{ color: '#6b8ab0' }}>Desde</p>
                              <input type="time" value={scheduleForm.afternoon_start}
                                onChange={e => setScheduleForm(f => ({ ...f, afternoon_start: e.target.value }))}
                                className="w-full rounded-lg px-2 py-1.5 text-white text-sm outline-none"
                                style={{ background: '#0d1829', border: '1px solid #1a2d45' }} />
                            </div>
                            <div>
                              <p className="text-xs mb-1" style={{ color: '#6b8ab0' }}>Hasta</p>
                              <input type="time" value={scheduleForm.afternoon_end}
                                onChange={e => setScheduleForm(f => ({ ...f, afternoon_end: e.target.value }))}
                                className="w-full rounded-lg px-2 py-1.5 text-white text-sm outline-none"
                                style={{ background: '#0d1829', border: '1px solid #1a2d45' }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <button onClick={() => saveSchedule(inst.id)} disabled={savingSchedule}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition"
                        style={{ background: savingSchedule ? '#1a2d45' : '#0057B8' }}>
                        {savingSchedule ? 'Guardando...' : 'Guardar horario'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
