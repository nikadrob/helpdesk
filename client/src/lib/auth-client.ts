import { inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

// The client and API share an origin (Vite proxies /api in development),
// so Better Auth's default base path `/api/auth` on the current origin is correct.
export const authClient = createAuthClient({
  plugins: [
    // Types only. Keep in sync with `user.additionalFields` in server/src/auth/auth.ts.
    inferAdditionalFields({
      user: {
        role: { type: ['ADMIN', 'AGENT'], required: false, defaultValue: 'AGENT', input: false },
        isActive: { type: 'boolean', required: false, defaultValue: true, input: false },
      },
    }),
  ],
})

export const { useSession, signIn, signOut } = authClient
export type UserRole = 'ADMIN' | 'AGENT'
