'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Staff } from '@/types'

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  admin:     { label: 'Admin',     bg: 'rgba(0,87,184,0.15)',    color: '#4d9ff5' },
  instructor:{ label: 'Instructor',bg: 'rgba(52,211,153,0.1)',   color: '#34d399' },
  secretary: { label: 'Secretaria',bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
}

export default function EquipoPage() {
  const supabase = createClient()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState<'instructor' | 'secretary' | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)

  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { fetchStaff() }, [])

  async function fetchStaff() {
    setLoading(true)
    const { data } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setStaff(data)
    setLoading(false)
  }

  async function handleCreate() {
    if (!showForm || !name.trim() || !email.trim()) return
    setSaving(true)
    setFormError('')

    const endpoint = showForm === 'instructor' ? '/api/profesores/invite' : '/api/secretaria/invite'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      setFormError(data.error ?? 'No se pudo crear la cuenta')
      setSaving(false)
      return
    }

    setFormSuccess(true)
    setName('')
    setEmail('')
    setSaving(false)
    await fetchStaff()
    setTimeout(() => { setFormSuccess(false); setShowForm(null) }, 2500)
  }

  async function toggleActive(member: Staff) {
    setToggling(member.id)
    await fetch('/api/secretaria/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, is_active: !member.is_active }),
    })
    setStaff(prev => prev.map(s => s.id === member.id ? { ...s, is_active: !s.is_active } : s))
    setToggling(null)
  }

  return (
    <div className="p-8 max-w-2xl">

      {/* Cabecera */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: '#0057B8' }}>Administración</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Equipo</h1>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>Todos los miembros del equipo y sus roles</p>
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => { setShowForm('secretary'); setFormError(''); setFormSuccess(false) }}
            className="px-3 py-2 rounded-xl text-sm font-bold transition"
            style={{ background: '#0d1829', border: '1px solid #1a2d45', color: '#a78bfa' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#12203a'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0d1829'}
          >
            + Secretaria
          </button>
          <button
            onClick={() => { setShowForm('instructor'); setFormError(''); setFormSuccess(false) }}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition"
            style={{ background: '#0057B8' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#004494'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0057B8'}
          >
            + Instructor
          </button>
        </div>
      </div>

      {/* Formulario de invitación */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-6 space-y-4" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <div className="flex items-center justify-between">
            <p className="text-white font-bold">
              {showForm === 'instructor' ? 'Nuevo instructor' : 'Nueva secretaria'}
            </p>
            <button onClick={() => setShowForm(null)} style={{ color: '#6b8ab0' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {formSuccess ? (
            <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p className="font-bold text-sm" style={{ color: '#34d399' }}>¡Cuenta creada!</p>
              <p className="text-xs mt-1" style={{ color: '#34d399', opacity: 0.7 }}>
                Las credenciales se han enviado por email.
              </p>
            </div>
          ) : (
            <>
              {[
                { label: 'Nombre completo', value: name, setter: setName, type: 'text', placeholder: 'Carlos García' },
                { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'carlos@autoescuela.com' },
              ].map(({ label, value, setter, type, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0b8d0' }}>{label}</label>
                  <input
                    type={type}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                    style={{ background: '#0a1220', border: '1.5px solid #1a2d45' }}
                    onFocus={e => e.target.style.borderColor = '#0057B8'}
                    onBlur={e => e.target.style.borderColor = '#1a2d45'}
                  />
                </div>
              ))}

              {formError && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  {formError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={saving || !name || !email}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition"
                style={{ background: saving || !name || !email ? '#1a2d45' : '#0057B8', color: saving || !name || !email ? '#3a5070' : 'white' }}
              >
                {saving ? 'Creando...' : 'Crear cuenta y enviar credenciales'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Lista de equipo */}
      {loading ? (
        <div className="text-sm" style={{ color: '#6b8ab0' }}>Cargando...</div>
      ) : staff.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <p className="font-semibold text-white">Sin miembros</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map(member => {
            const rc = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.secretary
            return (
              <div
                key={member.id}
                className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: '#0d1829', border: `1px solid ${member.is_active ? '#1a2d45' : '#2a1a1a'}` }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                  style={{ background: rc.bg, color: rc.color }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold">{member.name}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: rc.bg, color: rc.color }}
                    >
                      {rc.label}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: '#3a5070' }}>{member.email}</p>
                </div>

                {/* Alta */}
                <div className="text-right text-xs hidden sm:block flex-shrink-0" style={{ color: '#3a5070' }}>
                  <p>Alta</p>
                  <p className="font-semibold" style={{ color: '#6b8ab0' }}>{formatDate(member.created_at.split('T')[0])}</p>
                </div>

                {/* Estado */}
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                  style={{
                    background: member.is_active ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                    color: member.is_active ? '#34d399' : '#f87171',
                  }}
                >
                  {member.is_active ? 'Activo' : 'Inactivo'}
                </span>

                {/* Acción — los admins no se pueden desactivar desde aquí */}
                {member.role !== 'admin' && (
                  <button
                    onClick={() => toggleActive(member)}
                    disabled={toggling === member.id}
                    className="text-xs px-3 py-1.5 rounded-xl font-semibold transition flex-shrink-0"
                    style={{
                      background: '#0a1220',
                      border: '1px solid #1a2d45',
                      color: toggling === member.id ? '#3a5070' : '#6b8ab0',
                      opacity: toggling === member.id ? 0.5 : 1,
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6b8ab0'}
                  >
                    {member.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Nota informativa */}
      <div className="mt-6 rounded-xl px-4 py-3 flex gap-3" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#3a5070' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: '#3a5070' }}>
          Los <span style={{ color: '#6b8ab0' }}>instructores</span> pueden ver el calendario y gestionar sus alumnos.
          Las <span style={{ color: '#6b8ab0' }}>secretarias</span> gestionan alumnos, pagos y el tablón de asignación.
          Al desactivar una cuenta se bloquea el acceso inmediatamente.
        </p>
      </div>

    </div>
  )
}
