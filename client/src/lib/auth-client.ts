import { createAuthClient } from 'better-auth/react'

// The client and API share an origin (Vite proxies /api in development),
// so Better Auth's default base path `/api/auth` on the current origin is correct.
export const authClient = createAuthClient()

export const { useSession, signIn, signOut } = authClient
