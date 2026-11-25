import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth-client'
import { clearUserData } from '@/lib/query-client'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    navigate('/login', { replace: true })
    clearUserData()
  }

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold">
            HelpDesk
          </Link>
          {session?.user.role === 'ADMIN' && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                cn(
                  'text-sm transition-colors hover:text-foreground',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                )
              }
            >
              Users
            </NavLink>
          )}
        </div>
        <div className="flex items-center gap-4">
          {session && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{session.user.name}</span>
              <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
