import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'instructor' | 'secretary'

export interface AuthUser {
  id: string
  role: UserRole
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!staff || !(['admin', 'instructor', 'secretary'].includes(staff.role))) {
      return null
    }

    return { id: user.id, role: staff.role as UserRole }
  } catch {
    return null
  }
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}

export function isAdminOrInstructor(user: AuthUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'instructor'
}

export function isAdminOrSecretary(user: AuthUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'secretary'
}
