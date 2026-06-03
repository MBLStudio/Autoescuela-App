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

  // Eliminar
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Editar horario
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)

  // Editar tipos de práctica
  const [editingTypesId, setEditingTypesId] = useState<string | null>(null)
  const [typesForm, setTypesForm] = useState<string[]>(['car'])
  const [savingTypes, setSavingTypes] = useState(false)

  // Editar hitos
  const [editingMilestonesId, setEditingMilestonesId] = useState<string | null>(null)
  const [milestonesInput, setMilestonesInput] = useState('')
  const [savingMilestones, setSavingMilestones] = useState(false)
  const [milestonesError, setMilestonesError] = useState('')
  const [scheduleForm, setScheduleForm] = useState({
    jornada: 'full' as 'full' | 'half',
    schedule_morning: true, morning_start: '08:00', morning_end: '13:30',
    schedule_afternoon: true, afternoon_start: '16:00', afternoon_end: '19:15',
    break_minutes: 10,
  })
  const [savingSchedule, setSavingSchedule] = useState(false)

  useEffect(() => { fetchInstructors() }, [])

  async function fetchInstructors() {
    setLoading(true)
    const res = await fetch('/api/profesores/list')
    const json = await res.json()
    if (json.instructors) setInstructors(json.instructors)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    const res = await fetch('/api/profesores/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setInstructors(prev => prev.filter(i => i.id !== id))
    }
    setConfirmDeleteId(null)
    setDeleting(false)
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
      setInviteError(data.error ?? 'No se pudo crear la cuenta')
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

  async function savePracticeTypes(instructorId: string) {
    if (typesForm.length === 0) return
    setSavingTypes(true)
    await supabase.from('instructors').update({ practice_types: typesForm }).eq('id', instructorId)
    setInstructors(prev => prev.map(i => i.id === instructorId ? { ...i, practice_types: typesForm as any } : i))
    setEditingTypesId(null)
    setSavingTypes(false)
  }

  async function saveMilestones(instructorId: string) {
    setMilestonesError('')
    const parsed = milestonesInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0)
    if (parsed.length === 0) {
      setMilestonesError('Introduce al menos un número válido')
      return
    }
    const sorted = [...new Set(parsed)].sort((a, b) => a - b)
    setSavingMilestones(true)
    await supabase.from('instructors').update({ milestone_counts: sorted }).eq('id', instructorId)
    setInstructors(prev => prev.map(i => i.id === instructorId ? { ...i, milestone_counts: sorted } : i))
    setEditingMilestonesId(null)
    setSavingMilestones(false)
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
          Nuevo profesor
        </button>
      </div>

      {/* Formulario de invitación */}
      {showInvite && (
        <div className="rounded-2xl p-5 mb-6 space-y-4" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <div className="flex items-center justify-between">
            <p className="text-white font-bold">Nuevo profesor</p>
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
                  {inviting ? 'Creando...' : 'Crear cuenta'}
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
              const isEditingMilestones = editingMilestonesId === inst.id
              const isEditingTypes = editingTypesId === inst.id
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
                          setEditingTypesId(isEditingTypes ? null : inst.id)
                          setEditingMilestonesId(null)
                          setEditingScheduleId(null)
                          setTypesForm(inst.practice_types ?? ['car'])
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold transition"
                        style={{ color: '#6b8ab0', background: '#0a1220', border: '1px solid #1a2d45' }}
                      >
                        {isEditingTypes ? 'Cancelar' : '🚗 Tipos'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingMilestonesId(isEditingMilestones ? null : inst.id)
                          setEditingScheduleId(null)
                          setEditingTypesId(null)
                          setMilestonesError('')
                          setMilestonesInput((inst.milestone_counts ?? [5, 10, 15, 20]).join(', '))
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold transition"
                        style={{ color: '#6b8ab0', background: '#0a1220', border: '1px solid #1a2d45' }}
                      >
                        {isEditingMilestones ? 'Cancelar' : '🎯 Hitos'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingScheduleId(isEditing ? null : inst.id)
                          setEditingMilestonesId(null)
                          setEditingTypesId(null)
                          setScheduleForm({
                            jornada: inst.jornada ?? 'full',
                            schedule_morning: inst.schedule_morning ?? true,
                            morning_start: (inst.morning_start ?? '08:00').substring(0, 5),
                            morning_end: (inst.morning_end ?? '13:30').substring(0, 5),
                            schedule_afternoon: inst.schedule_afternoon ?? true,
                            afternoon_start: (inst.afternoon_start ?? '16:00').substring(0, 5),
                            afternoon_end: (inst.afternoon_end ?? '19:15').substring(0, 5),
                            break_minutes: inst.break_minutes ?? 10,
                          })
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold transition"
                        style={{ color: '#6b8ab0', background: '#0a1220', border: '1px solid #1a2d45' }}
                      >
                        {isEditing ? 'Cancelar' : '⏰ Horario'}
                      </button>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>Activo</span>
                      {confirmDeleteId === inst.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(inst.id)}
                            disabled={deleting}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold transition"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                          >
                            {deleting ? '...' : '¿Eliminar?'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2 py-1 rounded-lg font-semibold transition"
                            style={{ color: '#6b8ab0', background: '#0a1220', border: '1px solid #1a2d45' }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(inst.id)}
                          className="p-1.5 rounded-lg transition"
                          style={{ color: '#3a5070' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a5070'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resumen horario + hitos + tipos */}
                  {!isEditing && !isEditingMilestones && !isEditingTypes && (
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#3a5070' }}>
                      <span>{inst.jornada === 'half' ? '🕓 Media jornada' : '🕗 Jornada completa'}</span>
                      {(inst.schedule_morning ?? true) && <span>☀️ {(inst.morning_start ?? '08:00').substring(0,5)} – {(inst.morning_end ?? '13:30').substring(0,5)}</span>}
                      {(inst.schedule_afternoon ?? true) && <span>🌆 {(inst.afternoon_start ?? '16:00').substring(0,5)} – {(inst.afternoon_end ?? '19:15').substring(0,5)}</span>}
                      <span>⏱ Descanso: {inst.break_minutes ?? 10} min</span>
                      <span>🎯 Hitos: {(inst.milestone_counts ?? [5, 10, 15, 20]).join(', ')}</span>
                      <span>🚗 Tipos: {(inst.practice_types ?? ['car']).join(', ')}</span>
                    </div>
                  )}

                  {/* Formulario tipos de práctica */}
                  {isEditingTypes && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: '#0a1220', border: '1px solid #1a2d45' }}>
                      <p className="text-xs font-semibold" style={{ color: '#6b8ab0' }}>Tipos de práctica que imparte este profesor</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { value: 'car', label: '🚗 Coche', color: '#0057B8' },
                          { value: 'truck', label: '🚛 Camión', color: '#38bdf8' },
                          { value: 'moto', label: '🏍️ Moto', color: '#a78bfa' },
                        ] as const).map(({ value, label, color }) => {
                          const selected = typesForm.includes(value)
                          return (
                            <button key={value} type="button"
                              onClick={() => setTypesForm(prev => selected ? prev.filter(t => t !== value) : [...prev, value])}
                              className="py-2.5 rounded-xl text-xs font-bold transition"
                              style={{
                                background: selected ? `${color}20` : '#0d1829',
                                border: `2px solid ${selected ? color : '#1a2d45'}`,
                                color: selected ? color : '#3a5070',
                              }}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => savePracticeTypes(inst.id)}
                        disabled={savingTypes || typesForm.length === 0}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition"
                        style={{ background: savingTypes || typesForm.length === 0 ? '#1a2d45' : '#0057B8' }}
                      >
                        {savingTypes ? 'Guardando...' : 'Guardar tipos'}
                      </button>
                    </div>
                  )}

                  {/* Formulario hitos */}
                  {isEditingMilestones && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: '#0a1220', border: '1px solid #1a2d45' }}>
                      <p className="text-xs font-semibold" style={{ color: '#6b8ab0' }}>
                        Número de prácticas completadas en los que el alumno recibe un email de felicitación.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0b8d0' }}>
                          Hitos (separados por comas)
                        </label>
                        <input
                          type="text"
                          value={milestonesInput}
                          onChange={e => setMilestonesInput(e.target.value)}
                          placeholder="5, 10, 15, 20"
                          className="w-full rounded-lg px-3 py-2 text-white text-sm outline-none"
                          style={{ background: '#0d1829', border: '1px solid #1a2d45' }}
                        />
                      </div>
                      {milestonesError && (
                        <p className="text-xs" style={{ color: '#f87171' }}>{milestonesError}</p>
                      )}
                      <button
                        onClick={() => saveMilestones(inst.id)}
                        disabled={savingMilestones}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition"
                        style={{ background: savingMilestones ? '#1a2d45' : '#0057B8' }}
                      >
                        {savingMilestones ? 'Guardando...' : 'Guardar hitos'}
                      </button>
                    </div>
                  )}

                  {/* Formulario horario */}
                  {isEditing && (
                    <div className="rounded-xl p-4 space-y-4" style={{ background: '#0a1220', border: '1px solid #1a2d45' }}>

                      {/* Tipo de jornada */}
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#6b8ab0' }}>Tipo de jornada</p>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { value: 'full', label: '🕗 Jornada completa', desc: '~40h semanales' },
                            { value: 'half', label: '🕓 Media jornada', desc: '~20h semanales' },
                          ] as const).map(({ value, label, desc }) => (
                            <button key={value} type="button"
                              onClick={() => setScheduleForm(f => ({
                                ...f,
                                jornada: value,
                                // Media jornada: desactiva tarde automáticamente
                                schedule_afternoon: value === 'half' ? false : f.schedule_afternoon,
                              }))}
                              className="py-2.5 px-3 rounded-xl text-left transition"
                              style={{
                                background: scheduleForm.jornada === value ? '#0057B820' : '#0d1829',
                                border: `2px solid ${scheduleForm.jornada === value ? '#0057B8' : '#1a2d45'}`,
                              }}
                            >
                              <p className="text-xs font-bold" style={{ color: scheduleForm.jornada === value ? '#0057B8' : '#6b8ab0' }}>{label}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#3a5070' }}>{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

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

                      {/* Descanso entre prácticas */}
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#6b8ab0' }}>
                          Descanso entre prácticas
                          <span className="ml-2 font-normal" style={{ color: '#3a5070' }}>(camión circulación siempre 30 min)</span>
                        </p>
                        <div className="flex items-center gap-3">
                          {[5, 10, 15, 20].map(mins => (
                            <button key={mins} type="button"
                              onClick={() => setScheduleForm(f => ({ ...f, break_minutes: mins }))}
                              className="flex-1 py-2 rounded-xl text-xs font-bold transition"
                              style={{
                                background: scheduleForm.break_minutes === mins ? '#0057B820' : '#0d1829',
                                border: `2px solid ${scheduleForm.break_minutes === mins ? '#0057B8' : '#1a2d45'}`,
                                color: scheduleForm.break_minutes === mins ? '#0057B8' : '#3a5070',
                              }}
                            >
                              {mins} min
                            </button>
                          ))}
                        </div>
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
