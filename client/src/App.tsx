import { useQuery } from '@tanstack/react-query'
import { CircleCheck, CircleX, LoaderCircle, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import { healthQuery } from '@/lib/health'
import { cn } from '@/lib/utils'
import Navbar from './components/Navbar.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import UsersPage from './pages/UsersPage.tsx'

export default function App() {
  return (
    <>
      <HealthMessage />
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

type BannerTone = 'muted' | 'primary' | 'destructive'

const toneClasses: Record<BannerTone, string> = {
  muted: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  destructive: 'bg-destructive/10 text-destructive',
}

function Banner({ tone, icon: Icon, children }: { tone: BannerTone; icon: LucideIcon; children: ReactNode }) {
  return (
    <div role="status" className={cn('border-b px-4 py-2 text-sm', toneClasses[tone])}>
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        <Icon className={cn('size-4 shrink-0', Icon === LoaderCircle && 'animate-spin')} aria-hidden />
        <span>{children}</span>
      </div>
    </div>
  )
}

function HealthMessage() {
  const { data: health, isPending, isError } = useQuery(healthQuery)

  if (isPending) {
    return (
      <Banner tone="muted" icon={LoaderCircle}>
        Checking API…
      </Banner>
    )
  }

  // Checked before the data: after a failed refetch, the old data is still there.
  if (isError) {
    return (
      <Banner tone="destructive" icon={CircleX}>
        Cannot reach the API. Is the server running?
      </Banner>
    )
  }

  if (health.status === 'ok') {
    return (
      <Banner tone="primary" icon={CircleCheck}>
        API is running and the database is connected.
      </Banner>
    )
  }

  return (
    <Banner tone="destructive" icon={TriangleAlert}>
      API is running, but the database is {health.database}.
    </Banner>
  )
}
