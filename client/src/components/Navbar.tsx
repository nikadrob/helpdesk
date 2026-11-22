import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { signOut, useSession } from '../lib/auth-client.ts'

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
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          HelpDesk
        </Link>
        {session && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{session.user.name}</span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
