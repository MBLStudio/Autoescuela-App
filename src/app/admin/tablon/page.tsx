'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PracticeType } from '@/types'

interface QueueStudent {
  id: string
  full_name: string
  dni: string
  order_number: number
  phone: string | null
  practice_types: PracticeType[]
  notes: string | null
  created_at: string
}

const PRACTICE = {
  car:   { label: 'Coche',  emoji: '🚗', color: '#0057B8', bg: 'rgba(0,87,184,0.15)' },
  truck: { label: 'Camión', emoji: '🚛', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
  moto:  { label: 'Moto',   emoji: '🏍️', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
} as const

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return `Hace ${Math.floor(diff / 86400)} día${Math.floor(diff / 86400) > 1 ? 's' : ''}`
}

function isRecent(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 2 * 60 * 60 * 1000
}

export default function AdminTablonPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<QueueStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PracticeType | 'all'>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    load()
  }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/tablon/list')
    const json = await res.json()
    if (json.students) setStudents(json.students)
    setLoading(false)
  }

  async function handleClaim(studentId: string) {
    if (!userId) return
    setClaiming(true)
    const res = await fetch('/api/tablon/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, instructorId: userId }),
    })
    if (res.ok) {
      setStudents(prev => prev.filter(s => s.id !== studentId))
    }
    setConfirmId(null)
    setClaiming(false)
  }

  const filtered = filter === 'all'
    ? students
    : students.filter(s => s.practice_types.includes(filter))

  const counts = {
    all: students.length,
    car: students.filter(s => s.practice_types.includes('car')).length,
    truck: students.filter(s => s.practice_types.includes('truck')).length,
    moto: students.filter(s => s.practice_types.includes('moto')).length,
  }

  return (
    <div className="p-8">

      {/* Cabecera */}
      <div className="mb-8">
        <p className="text-sm font-semibold mb-1" style={{ color: '#0057B8' }}>Administración</p>
        <h1 className="text-3xl font-black text-white tracking-tight">Tablón de alumnos</h1>
        <p className="text-sm mt-1.5" style={{ color: '#6b8ab0' }}>
          Alumnos en espera de instructor — elige los que quieras asignar a tu cartera
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'all',   label: 'En cola',  color: '#6b8ab0' },
          { key: 'car',   label: 'Coche',    color: '#0057B8' },
          { key: 'truck', label: 'Camión',   color: '#38bdf8' },
          { key: 'moto',  label: 'Moto',     color: '#a78bfa' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key as PracticeType | 'all')}
            className="rounded-xl p-4 text-left transition-all"
            style={{
              background: filter === key ? `${color}18` : '#0d1829',
              border: `1.5px solid ${filter === key ? color : '#1a2d45'}`,
            }}
          >
            <p className="text-2xl font-black" style={{ color }}>{counts[key as keyof typeof counts]}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#6b8ab0' }}>{label}</p>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0057B8', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-20 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#0f1c2e' }}>
            <svg className="w-7 h-7" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-bold text-white text-lg">Tablón vacío</p>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>
            {filter === 'all'
              ? 'No hay alumnos en espera de asignación'
              : `No hay alumnos de ${PRACTICE[filter as PracticeType]?.label} en espera`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((s, idx) => (
            <div
              key={s.id}
              className="rounded-2xl p-5 flex flex-col gap-4 transition-all"
              style={{ background: '#0d1829', border: `1px solid ${isRecent(s.created_at) ? 'rgba(0,87,184,0.5)' : '#1a2d45'}` }}
            >
              {/* Fila superior */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-base"
                  style={{ background: 'rgba(0,87,184,0.15)', color: '#0057B8' }}>
                  {s.full_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold text-base leading-tight">{s.full_name}</p>
                    {isRecent(s.created_at) && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,87,184,0.2)', color: '#60a5fa' }}>
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: '#3a5070' }}>
                    {s.dni} · #{String(s.order_number).padStart(3, '0')}
                  </p>
                  {s.phone && (
                    <p className="text-xs mt-1" style={{ color: '#6b8ab0' }}>📱 {s.phone}</p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: '#3a5070' }}>Cola</p>
                  <p className="text-lg font-black" style={{ color: '#6b8ab0' }}>{idx + 1}</p>
                </div>
              </div>

              {/* Tipos de práctica */}
              <div className="flex flex-wrap gap-2">
                {s.practice_types.map(t => (
                  <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: PRACTICE[t].bg, color: PRACTICE[t].color }}>
                    {PRACTICE[t].emoji} {PRACTICE[t].label}
                  </span>
                ))}
              </div>

              {/* Notas del instructor */}
              {s.notes && (
                <div className="rounded-xl px-4 py-3 text-sm italic" style={{ background: '#0a1220', color: '#6b8ab0', borderLeft: '3px solid #1a2d45' }}>
                  "{s.notes}"
                </div>
              )}

              {/* Pie con acción */}
              <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid #0f1c2e' }}>
                <p className="text-xs" style={{ color: '#3a5070' }}>⏱ {timeAgo(s.created_at)}</p>

                {confirmId === s.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                      style={{ background: '#0a1220', color: '#6b8ab0', border: '1px solid #1a2d45' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleClaim(s.id)}
                      disabled={claiming}
                      className="text-xs px-4 py-1.5 rounded-lg font-bold text-white transition"
                      style={{ background: claiming ? '#1a2d45' : '#0057B8' }}
                    >
                      {claiming ? 'Asignando...' : '✓ Confirmar'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(s.id)}
                    className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl text-white transition-all"
                    style={{ background: '#0057B8' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#004494'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0057B8'}
                  >
                    Elegir alumno
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
