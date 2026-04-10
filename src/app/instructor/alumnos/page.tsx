'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPracticeLabel } from '@/lib/utils'
import type { Student, PracticeType } from '@/types'

export default function InstructorAlumnosPage() {
  const supabase = createClient()
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: instructor } = await supabase
      .from('instructors')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (instructor) {
      setInstructorId(instructor.id)
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('instructor_id', instructor.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (data) setStudents(data)
    }
    setLoading(false)
  }

  const typeColors: Record<PracticeType, { bg: string; text: string }> = {
    car: { bg: '#0057B820', text: '#0057B8' },
    truck: { bg: '#38bdf820', text: '#38bdf8' },
    moto: { bg: '#a78bfa20', text: '#a78bfa' },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#0057B8' }}>Gestión</p>
        <h1 className="text-3xl font-black text-white tracking-tight">Mis alumnos</h1>
        <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>{students.length} alumnos asignados</p>
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: '#6b8ab0' }}>Cargando...</div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <p className="font-semibold text-white">Sin alumnos asignados</p>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>Ve al tablón para elegir alumnos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map(student => (
            <div key={student.id} className="rounded-2xl px-5 py-4 flex items-center gap-4" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
              <div className="flex-1">
                <p className="text-white font-bold">{student.full_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {(student.practice_types as PracticeType[]).map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                      background: typeColors[t]?.bg,
                      color: typeColors[t]?.text,
                    }}>
                      {getPracticeLabel(t)}
                    </span>
                  ))}
                </div>
              </div>
              {student.phone && (
                <p className="text-xs" style={{ color: '#3a5070' }}>{student.phone}</p>
              )}
              <div className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: '#0f1c2e', color: '#3a5070' }}>
                #{student.order_number}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
