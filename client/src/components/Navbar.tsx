import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth-client'

export default function Navbar() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    navigate('/login', { replace: true })
  }

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          HelpDesk
        </Link>
        <div className="flex items-center gap-4">
          {session && (
            <>
              <span className="text-sm text-muted-foreground">{session.user.name}</span>
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
