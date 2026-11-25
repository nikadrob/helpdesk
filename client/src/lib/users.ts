import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
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

export const usersQuery = queryOptions({
  queryKey: ['users'],
  queryFn: async ({ signal }) => {
    const { data } = await api.get<{ users: User[] }>('/users', { signal })
    return data.users
  },
})
