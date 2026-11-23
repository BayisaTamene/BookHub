import { Link } from "react-router";

import type { Book } from "../types/books";

interface CatalogBookCardProps {
  book: Book;
}

function CatalogBookCard({ book }: CatalogBookCardProps) {
  const authors = book.authors
    .map((item) => item.author.name)
    .join(", ");

  return (
    <Link
      to={`/books/${book.id}`}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex h-56 items-center justify-center bg-gray-100">
        <span className="text-gray-400">Book Cover</span>
      </div>

      <div className="p-5">
        <p className="mb-2 text-sm font-medium text-blue-600">
          {book.category.name}
        </p>

        <h2 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
          {book.title}
        </h2>

        <p className="text-sm text-gray-500">
          {authors || "Unknown author"}
        </p>
      </div>
    </Link>
  );
}

export default CatalogBookCard;