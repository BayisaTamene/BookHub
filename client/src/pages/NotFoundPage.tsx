import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">

      <h1 className="text-7xl font-bold text-blue-600">
        404
      </h1>

      <h2 className="mt-4 text-2xl font-semibold text-slate-800">
        Page Not Found
      </h2>

      <p className="mt-3 max-w-md text-slate-500">
        Sorry, the page you are looking for does not exist or may have been moved.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
      >
        Return to Home
      </Link>

    </main>
  )
}

export default NotFoundPage