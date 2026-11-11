
import BookCard from "./BookCard";

import { books } from "../data/books"


export default function PopularBooks() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">

        {/* Section Heading */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Reader Favorites
          </p>

          <h2 className="mb-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Popular Books
          </h2>

          <p className="max-w-2xl text-slate-600">
            Explore some of the most loved books among our readers.
            Find your next favorite story today.
          </p>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

      </div>
    </section>
  );
}
