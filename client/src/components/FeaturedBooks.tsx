
import { Link } from 'react-router'

interface Book {
  id: number
  title: string
  author: string
  category: string
  coverColor: string
}

const books: Book[] = [
  {
    id: 1,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Programming',
    coverColor: 'bg-slate-800',
  },
  {
    id: 2,
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self Development',
    coverColor: 'bg-emerald-700',
  },
  {
    id: 3,
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Finance',
    coverColor: 'bg-amber-600',
  },
  {
    id: 4,
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    category: 'Business',
    coverColor: 'bg-blue-700',
  },
]

function FeaturedBooks() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">

        {/* Section heading */}
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Handpicked for you
            </span>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Featured Books
            </h2>

            <p className="mt-3 max-w-xl text-slate-600">
              Explore some of our selected books and discover something new to read.
            </p>
          </div>

          <Link
            to="/explore"
            className="font-semibold text-blue-600 transition hover:text-blue-800"
          >
            View all books →
          </Link>
        </div>

        {/* Books grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <article
              key={book.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Book cover placeholder */}
              <div className="flex h-64 items-center justify-center bg-slate-100 p-6">
                <div
                  className={`flex h-full w-40 flex-col justify-between rounded-r-lg p-5 text-white shadow-xl ${book.coverColor}`}
                >
                  <span className="text-xs font-medium uppercase tracking-widest">
                    BookHub
                  </span>

                  <h3 className="text-xl font-bold leading-snug">
                    {book.title}
                  </h3>

                  <span className="text-xs">
                    {book.author}
                  </span>
                </div>
              </div>

              {/* Book information */}
              <div className="p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {book.category}
                </span>

                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {book.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  By {book.author}
                </p>

                <Link
                  to="/explore"
                  className="mt-5 inline-block text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                >
                  Explore book →
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  )
}

export default FeaturedBooks
