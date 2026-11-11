
import { Link, useParams } from "react-router";import { books } from "../data/books";

function BookDetailsPage() {
  const { id } = useParams();

  const book = books.find((item) => item.id === Number(id));

  if (!book) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Book Not Found
          </h1>

          <p className="mt-3 text-gray-600">
            Sorry, the book you are looking for does not exist.
          </p>

          <Link
            to="/explore"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
          >
            Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/explore"
          className="mb-8 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Explore
        </Link>

        <div className="grid grid-cols-1 gap-10 rounded-2xl bg-white p-8 shadow-sm md:grid-cols-2">
          <div
            className={`flex min-h-96 items-center justify-center rounded-xl ${book.coverColor}`}
          >
            <span className="px-6 text-center text-3xl font-bold text-gray-800">
              {book.title}
            </span>
          </div>

          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              {book.category}
            </span>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              {book.title}
            </h1>

            <p className="mt-3 text-lg text-gray-600">
              By {book.author}
            </p>

            <p className="mt-8 leading-7 text-gray-700">
              {book.description}
            </p>

            <div className="mt-8 space-y-3 border-t border-gray-200 pt-6">
              <p className="text-gray-700">
                <span className="font-semibold">Published:</span>{" "}
                {book.publishedYear}
              </p>

              <p className="text-gray-700">
                <span className="font-semibold">Pages:</span>{" "}
                {book.pages}
              </p>

              <p className="text-gray-700">
                <span className="font-semibold">Author:</span>{" "}
                {book.author}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default BookDetailsPage;
