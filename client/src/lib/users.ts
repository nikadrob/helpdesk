import type { UserRole } from '@/lib/auth-client'

// A user as returned by GET /api/users (admin only).
export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  const res = await fetch('/api/users', { signal })
  if (!res.ok) throw new Error(`GET /api/users failed with status ${res.status}`)
  const { users } = (await res.json()) as { users: User[] }
  return users
}
