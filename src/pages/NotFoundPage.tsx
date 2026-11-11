import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">Page not found</h2>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-500 hover:underline">
        Go to dashboard
      </Link>
    </div>
  )
}
