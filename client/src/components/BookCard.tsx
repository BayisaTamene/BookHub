
import type { Book } from "../types/book"
import { Link } from "react-router";


interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link to={`/books/${book.id}`} className="block">
 <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      {/* Book Cover */}
      <div
        className={`flex h-64 items-center justify-center ${book.coverColor}`}
      >
        <h3 className="max-w-40 text-center text-2xl font-bold text-white">
          {book.title}
        </h3>
      </div>

      {/* Book Information */}
      <div className="p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          {book.category}
        </p>

        <h3 className="mb-1 font-bold text-slate-900">
          {book.title}
        </h3>

        <p className="text-sm text-slate-500">
          By {book.author}
        </p>
      </div>

    </article>
</Link>

   
  );
}
