'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Staff } from '@/types'

export default function AdminSecretariaPage() {
  const supabase = createClient()
  const [secretaries, setSecretaries] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  // Formulario nueva secretaria
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { fetchSecretaries() }, [])

  async function fetchSecretaries() {
    setLoading(true)
    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('role', 'secretary')
      .order('created_at', { ascending: true })
    if (data) setSecretaries(data)
    setLoading(false)
  }

  async function handleCreate() {
    if (!name.trim() || !email.trim()) {
      setError('Nombre y email son obligatorios')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/secretaria/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      setError(data.error ?? 'No se pudo crear la cuenta')
      setSaving(false)
      return
    }

    setSuccess(true)
    setName('')
    setEmail('')
    setSaving(false)
    await fetchSecretaries()
    setTimeout(() => { setSuccess(false); setShowForm(false) }, 2500)
  }

  async function toggleActive(s: Staff) {
    setToggling(s.id)
    await fetch('/api/secretaria/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    })
    setSecretaries(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x))
    setToggling(null)
  }

  return (
    <div className="p-8 max-w-2xl">

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: '#0057B8' }}>Administración</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Secretaría</h1>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>Gestión de cuentas de secretaria</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); setSuccess(false) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition"
          style={{ background: '#0057B8' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#004494'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0057B8'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva secretaria
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-6 space-y-4" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <div className="flex items-center justify-between">
            <p className="text-white font-bold">Nueva cuenta de secretaria</p>
            <button onClick={() => setShowForm(false)} style={{ color: '#6b8ab0' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p className="font-bold text-sm" style={{ color: '#34d399' }}>¡Cuenta creada!</p>
              <p className="text-xs mt-1" style={{ color: '#34d399', opacity: 0.7 }}>
                Las credenciales han sido enviadas a {email || 'su email'}.
              </p>
            </div>
          ) : (
            <>
              {[
                { label: 'Nombre completo', value: name, setter: setName, type: 'text', placeholder: 'María López' },
                { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'secretaria@autoescuela.com' },
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

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  {error}
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

      {/* Lista */}
      {loading ? (
        <div className="text-sm" style={{ color: '#6b8ab0' }}>Cargando...</div>
      ) : secretaries.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <p className="font-semibold text-white">Sin secretarias</p>
          <p className="text-sm mt-1" style={{ color: '#6b8ab0' }}>Crea la primera cuenta con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-3">
          {secretaries.map(s => (
            <div key={s.id} className="rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{ background: '#0d1829', border: `1px solid ${s.is_active ? '#1a2d45' : '#2a1a1a'}` }}>

              {/* Avatar inicial */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                style={{ background: s.is_active ? '#0057B820' : '#1a1a2a', color: s.is_active ? '#0057B8' : '#3a3a5a' }}>
                {s.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{s.name}</p>
                <p className="text-xs truncate" style={{ color: '#3a5070' }}>{s.email}</p>
              </div>

              {/* Alta */}
              <div className="text-right text-xs hidden sm:block" style={{ color: '#3a5070' }}>
                <p>Alta</p>
                <p className="font-semibold" style={{ color: '#6b8ab0' }}>{formatDate(s.created_at.split('T')[0])}</p>
              </div>

              {/* Estado */}
              <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{
                background: s.is_active ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                color: s.is_active ? '#34d399' : '#f87171',
              }}>
                {s.is_active ? 'Activa' : 'Inactiva'}
              </span>

              {/* Toggle */}
              <button
                onClick={() => toggleActive(s)}
                disabled={toggling === s.id}
                className="text-xs px-3 py-1.5 rounded-xl font-semibold transition"
                style={{
                  background: '#0a1220',
                  border: '1px solid #1a2d45',
                  color: toggling === s.id ? '#3a5070' : '#6b8ab0',
                  opacity: toggling === s.id ? 0.5 : 1,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6b8ab0'}
              >
                {s.is_active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info acceso */}
      <div className="mt-6 rounded-xl px-4 py-3 flex gap-3" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#3a5070' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: '#3a5070' }}>
          Las secretarias entran en <span style={{ color: '#6b8ab0' }}>autoescuela-app.vercel.app</span> con su email y contraseña.
          Tienen acceso al tablón de alumnos sin asignar y al formulario de alta de nuevos alumnos.
          Al desactivar una cuenta se bloquea el acceso inmediatamente.
        </p>
      </div>

    </div>
  )
}
