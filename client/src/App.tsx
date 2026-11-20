import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router'
import HomePage from './pages/HomePage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

type Health = { status: string; database: string }

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; health: Health }
  | { kind: 'error' }

export default function App() {
  const [state, setState] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/health', { signal: controller.signal })
      // The API returns JSON with status 503 when the database is down,
      // so read the body for both 200 and 503.
      .then((res) => res.json() as Promise<Health>)
      .then((health) => setState({ kind: 'ok', health }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setState({ kind: 'error' })
      })

    return () => controller.abort()
  }, [])

  return (
    <>
      <HealthMessage state={state} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

function HealthMessage({ state }: { state: HealthState }) {
  if (state.kind === 'loading') {
    return <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600">Checking API…</div>
  }

  if (state.kind === 'error') {
    return (
      <div className="bg-red-100 px-4 py-2 text-sm text-red-800">
        Cannot reach the API. Is the server running?
      </div>
    )
  }

  const { health } = state
  if (health.status === 'ok') {
    return (
      <div className="bg-green-100 px-4 py-2 text-sm text-green-800">
        API is running and the database is connected.
      </div>
    )
  }

  return (
    <div className="bg-amber-100 px-4 py-2 text-sm text-amber-800">
      API is running, but the database is {health.database}.
    </div>
  )
}
