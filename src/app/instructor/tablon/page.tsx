'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getDayName, getPracticeLabel } from '@/lib/utils'
import type { Student, PracticeType } from '@/types'

type PendingStudent = Student & { assigned_at: string | null }

export default function TablonPage() {
  const supabase = createClient()

  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [instructorName, setInstructorName] = useState('')
  const [instructorTypes, setInstructorTypes] = useState<PracticeType[]>([])
  const [students, setStudents] = useState<PendingStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaimingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<PracticeType | 'all'>('all')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: instructor } = await supabase
      .from('instructors')
      .select('id, name, practice_types')
      .eq('user_id', user.id)
      .single()
    if (instructor) {
      setInstructorId(instructor.id)
      setInstructorName(instructor.name)
      setInstructorTypes(instructor.practice_types ?? ['car'])
      fetchPendingStudents(instructor.practice_types ?? ['car'])
    } else {
      setLoading(false)
    }
  }

  async function fetchPendingStudents(types: PracticeType[]) {
    setLoading(true)
    // Alumnos activos sin instructor asignado o pendientes de asignación
    const { data } = await supabase
      .from('students')
      .select('*')
      .is('instructor_id', null)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (data) {
      // Filtrar solo los que tienen al menos un tipo compatible con el instructor
      const compatible = data.filter(s =>
        (s.practice_types as PracticeType[]).some(t => types.includes(t))
      )
      setStudents(compatible as PendingStudent[])
    }
    setLoading(false)
  }

  async function claimStudent(student: Student) {
    if (!instructorId) return
    setClaimingId(student.id)

    await supabase
      .from('students')
      .update({ instructor_id: instructorId })
      .eq('id', student.id)

    // Email al alumno
    fetch('/api/notify-claimed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.id,
        instructorName,
      }),
    }).catch(() => {})

    setStudents(prev => prev.filter(s => s.id !== student.id))
    setClaimingId(null)
  }

  const filtered = filterType === 'all'
    ? students
    : students.filter(s => (s.practice_types as PracticeType[]).includes(filterType))

  const typeColors: Record<PracticeType, { bg: string; text: string }> = {
    car: { bg: '#0057B820', text: '#0057B8' },
    truck: { bg: '#38bdf820', text: '#38bdf8' },
    moto: { bg: '#a78bfa20', text: '#a78bfa' },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#0057B8' }}>Tablón de alumnos</p>
        <h1 className="text-3xl font-black text-white tracking-tight">Alumnos disponibles</h1>
        <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>
          Alumnos pendientes de asignación · compatibles con tus tipos de práctica
        </p>
      </div>

      {/* Filtros por tipo */}
      {instructorTypes.length > 1 && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition"
            style={{
              background: filterType === 'all' ? '#0057B8' : '#0d1829',
              color: filterType === 'all' ? 'white' : '#6b8ab0',
              border: `1px solid ${filterType === 'all' ? '#0057B8' : '#1a2d45'}`,
            }}
          >
            Todos ({students.length})
          </button>
          {instructorTypes.map(t => {
            const count = students.filter(s => (s.practice_types as PracticeType[]).includes(t)).length
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  background: filterType === t ? typeColors[t].text : '#0d1829',
                  color: filterType === t ? 'white' : '#6b8ab0',
                  border: `1px solid ${filterType === t ? typeColors[t].text : '#1a2d45'}`,
                }}
              >
                {getPracticeLabel(t)} ({count})
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: '#6b8ab0' }}>Cargando...</div>
      ) : !instructorId ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <p className="text-white font-semibold">Sin instructor asignado</p>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>Pide al administrador que vincule tu cuenta</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <svg className="w-12 h-12 mx-auto mb-4" style={{ color: '#1a2d45' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-semibold text-white">Tablón vacío</p>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>No hay alumnos pendientes de asignación compatibles contigo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((student, idx) => (
            <div
              key={student.id}
              className="rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{ background: '#0d1829', border: '1px solid #1a2d45' }}
            >
              {/* Posición cronológica */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black" style={{ background: '#0a1220', color: '#3a5070' }}>
                {idx + 1}
              </div>

              {/* Info alumno */}
              <div className="flex-1">
                <p className="text-white font-bold">{student.full_name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {(student.practice_types as PracticeType[]).map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                      background: typeColors[t]?.bg ?? '#0057B820',
                      color: typeColors[t]?.text ?? '#0057B8',
                    }}>
                      {getPracticeLabel(t)}
                    </span>
                  ))}
                  {/* Compatibilidad */}
                  {(student.practice_types as PracticeType[]).some(t => instructorTypes.includes(t)) && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                      ✓ Compatible
                    </span>
                  )}
                </div>
              </div>

              {/* Fecha de registro */}
              <div className="text-right text-xs" style={{ color: '#3a5070' }}>
                <p>Registrado</p>
                <p className="font-semibold" style={{ color: '#6b8ab0' }}>{formatDate(student.created_at.split('T')[0])}</p>
              </div>

              {/* Nº orden */}
              <div className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: '#0f1c2e', color: '#3a5070' }}>
                #{student.order_number}
              </div>

              {/* Botón elegir */}
              <button
                onClick={() => claimStudent(student)}
                disabled={claiming === student.id}
                className="text-xs px-4 py-2 rounded-xl font-bold transition-all"
                style={{
                  background: claiming === student.id ? '#1a2d45' : '#0057B8',
                  color: claiming === student.id ? '#3a5070' : 'white',
                }}
                onMouseEnter={e => { if (claiming !== student.id) (e.currentTarget as HTMLElement).style.background = '#004494' }}
                onMouseLeave={e => { if (claiming !== student.id) (e.currentTarget as HTMLElement).style.background = '#0057B8' }}
              >
                {claiming === student.id ? 'Asignando...' : 'Elegir alumno'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
