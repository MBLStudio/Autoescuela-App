'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getPracticeLabel } from '@/lib/utils'
import type { Student, PracticeType } from '@/types'

export default function SecretariaTablonPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<PracticeType | 'all'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { fetchPendingStudents() }, [])

  async function fetchPendingStudents() {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*')
      .is('instructor_id', null)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    if (data) setStudents(data)
    setLoading(false)
  }

  function buildMessage(student: Student): string {
    const types = (student.practice_types as PracticeType[]).map(t => getPracticeLabel(t)).join(', ')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autoescuela-app.vercel.app'
    return `Hola ${student.full_name.split(' ')[0]} 👋 Ya tienes acceso al sistema de reservas de Auto-Escuela Bahillo para tus prácticas de ${types}. Puedes reservar tu primera práctica aquí: ${appUrl}/s/${student.token} — ¡Te esperamos!`
  }

  async function copyMessage(student: Student) {
    await navigator.clipboard.writeText(buildMessage(student))
    setCopiedId(student.id)
    setTimeout(() => setCopiedId(null), 2000)
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: '#0057B8' }}>Secretaría</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Tablón de alumnos</h1>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>Alumnos registrados pendientes de ser asignados a un instructor</p>
        </div>
        <a
          href="/secretaria/nuevo-alumno"
          className="flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-xl text-white shadow-lg transition"
          style={{ background: '#0057B8' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#004494'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0057B8'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo alumno
        </a>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['all', 'car', 'truck', 'moto'] as const).map(f => {
          const count = f === 'all' ? students.length : students.filter(s => (s.practice_types as PracticeType[]).includes(f as PracticeType)).length
          return (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition"
              style={{
                background: filterType === f ? (f === 'moto' ? '#a78bfa' : f === 'truck' ? '#38bdf8' : '#0057B8') : '#0d1829',
                color: filterType === f ? 'white' : '#6b8ab0',
                border: `1px solid ${filterType === f ? 'transparent' : '#1a2d45'}`,
              }}
            >
              {f === 'all' ? 'Todos' : getPracticeLabel(f as PracticeType)} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: '#6b8ab0' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <p className="font-semibold text-white">Tablón vacío</p>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>No hay alumnos pendientes de asignación</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((student, idx) => (
            <div
              key={student.id}
              className="rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{ background: '#0d1829', border: '1px solid #1a2d45' }}
            >
              {/* Posición */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black" style={{ background: '#0a1220', color: '#3a5070' }}>
                {idx + 1}
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="text-white font-bold">{student.full_name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
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

              {/* Fecha registro */}
              <div className="text-right text-xs" style={{ color: '#3a5070' }}>
                <p>Registrado</p>
                <p className="font-semibold" style={{ color: '#6b8ab0' }}>{formatDate(student.created_at.split('T')[0])}</p>
              </div>

              <div className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: '#0f1c2e', color: '#3a5070' }}>
                #{student.order_number}
              </div>

              {/* Copiar mensaje */}
              <button
                onClick={() => copyMessage(student)}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-bold transition"
                style={{
                  background: copiedId === student.id ? 'rgba(52,211,153,0.15)' : '#0d1829',
                  color: copiedId === student.id ? '#34d399' : '#6b8ab0',
                  border: `1px solid ${copiedId === student.id ? 'rgba(52,211,153,0.3)' : '#1a2d45'}`,
                }}
              >
                {copiedId === student.id ? (
                  <>✓ Copiado</>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar mensaje
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
