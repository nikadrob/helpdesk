import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession, type UserRole } from '@/lib/auth-client'

// Wraps routes that need a signed-in user, optionally with a specific role.
// The server still enforces authentication and permissions on every API call;
// this only keeps the UI consistent.
export default function ProtectedRoute({ role }: { role?: UserRole }) {
  const { data: session, isPending } = useSession()
  const location = useLocation()

  if (isPending) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role && session.user.role !== role) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
