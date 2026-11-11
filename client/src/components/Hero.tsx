
import { Link } from 'react-router'

function Hero() {
  return (
    <section className="overflow-hidden bg-slate-50">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">

        {/* Left: Hero content */}
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            Your world of knowledge
          </span>

          <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Discover Your Next
            <span className="text-blue-600"> Favorite Book</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Explore a growing digital library of books, discover new ideas,
            and expand your knowledge. Your next great read starts here.
          </p>

          {/* Book search */}
          <form
            action="/explore"
            method="get"
            className="mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <input
              type="search"
              name="q"
              placeholder="Search books or authors..."
              aria-label="Search books or authors"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Search Books
            </button>
          </form>

          <Link
            to="/explore"
            className="mt-5 inline-flex items-center font-semibold text-blue-600 transition hover:text-blue-800"
          >
            Explore the library
            <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Right: Decorative book showcase */}
        <div className="relative flex min-h-[360px] items-center justify-center">

          <div className="absolute h-72 w-72 rounded-full bg-blue-100 sm:h-96 sm:w-96" />

          <div className="relative flex items-center gap-3">

            <div className="flex h-56 w-36 -rotate-6 flex-col justify-between rounded-r-lg bg-indigo-700 p-5 text-white shadow-xl sm:h-64 sm:w-40">
              <span className="text-xs font-medium uppercase tracking-widest">
                Knowledge
              </span>
              <span className="text-2xl font-bold">
                The Art of Learning
              </span>
              <span className="text-xs">BOOKHUB COLLECTION</span>
            </div>

            <div className="z-10 flex h-64 w-40 rotate-3 flex-col justify-between rounded-r-lg bg-amber-500 p-5 text-white shadow-2xl sm:h-72 sm:w-48">
              <span className="text-xs font-medium uppercase tracking-widest">
                Explore
              </span>
              <span className="text-3xl font-bold">
                Think. Read. Grow.
              </span>
              <span className="text-xs">YOUR DIGITAL LIBRARY</span>
            </div>

            <div className="flex h-52 w-32 -rotate-3 flex-col justify-between rounded-r-lg bg-emerald-700 p-4 text-white shadow-xl sm:h-60 sm:w-36">
              <span className="text-xs font-medium uppercase tracking-widest">
                Discover
              </span>
              <span className="text-xl font-bold">
                New Ideas
              </span>
              <span className="text-xs">BOOKHUB</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero
