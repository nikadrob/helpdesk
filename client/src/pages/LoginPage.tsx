import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { signIn, useSession } from '../lib/auth-client.ts'

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

type LoginForm = z.infer<typeof loginSchema>

const inputClass =
  'mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none'
const inputOk = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
const inputError = 'border-red-500 focus:border-red-500 focus:ring-red-500'

export default function LoginPage() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (isPending) {
    return <div className="p-8 text-sm text-gray-500">Loading…</div>
  }

  // Already signed in: no reason to show the form.
  if (session) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(values: LoginForm) {
    setServerError(null)
    const { error } = await signIn.email(values)

    if (error) {
      // Same message for a wrong password, unknown email, or deactivated user,
      // so the form doesn't reveal which accounts exist.
      setServerError(error.status === 0 ? 'Cannot reach the server.' : 'Invalid email or password.')
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-600">Sign in to your HelpDesk account.</p>

        {serverError && (
          <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {serverError}
          </div>
        )}

        <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          className={`${inputClass} ${errors.email ? inputError : inputOk}`}
          {...register('email')}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}

        <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          className={`${inputClass} ${errors.password ? inputError : inputOk}`}
          {...register('password')}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
