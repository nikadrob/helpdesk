import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className={buttonVariants({ variant: 'link', className: 'mt-4 px-0' })}>
        Back to home
      </Link>
    </main>
  )
}
