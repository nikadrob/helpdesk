import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type Health = { status: string; database: string }

export const healthQuery = queryOptions({
  queryKey: ['health'],
  queryFn: async ({ signal }) => {
    const { data } = await api.get<Health>('/health', {
      signal,
      // The API returns JSON with status 503 when the database is down,
      // so accept both 200 and 503.
      validateStatus: (status) => status === 200 || status === 503,
    })
    return data
  },
  // Report problems at once, even when the browser says it's offline.
  retry: false,
  networkMode: 'always',
})
