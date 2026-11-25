import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { healthQuery } from '@/lib/health'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry once, but not on 4xx: a 401, 403, or 404 won't change by itself.
      retry: (failureCount, error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined
        if (status !== undefined && status >= 400 && status < 500) return false
        return failureCount < 1
      },
    },
  },
})

// Drops everything the signed-in user loaded, so the next user never sees it.
// Call on sign-in and sign-out. The health check isn't user data, so it stays.
export function clearUserData() {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== healthQuery.queryKey[0] })
}
