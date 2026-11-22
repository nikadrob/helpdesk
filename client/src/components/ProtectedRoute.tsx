import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '@/lib/auth-client'

// Wraps routes that need a signed-in user. The server still enforces
// authentication on every API call; this only keeps the UI consistent.
export default function ProtectedRoute() {
  const { data: session, isPending } = useSession()
  const location = useLocation()

  if (isPending) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
