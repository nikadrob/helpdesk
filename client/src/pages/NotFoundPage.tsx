import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Back to home
      </Link>
    </main>
  )
}
