
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { ApiError } from "../lib/api";
import { getBookById } from "../lib/books";
import type { Book } from "../types/books";

function BookDetailsPage() {
  const { id } = useParams();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid book ID.");
      setLoading(false);
      return;
    }

    const bookId: string = id;

    let cancelled = false;

    async function fetchBook() {
      try {
        setLoading(true);
        setError(null);
        setBook(null);

const response = await getBookById(bookId);
        if (!cancelled) {
          setBook(response.data.book);
        }
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 404) {
          setError("The book you are looking for does not exist.");
        } else if (error instanceof ApiError && error.status === 400) {
          setError("The supplied book ID is invalid.");
        } else {
          setError("Unable to load this book. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBook();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <p className="text-gray-600">Loading book details...</p>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {error?.includes("does not exist")
              ? "Book Not Found"
              : "Unable to Load Book"}
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "The requested book could not be found."}
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

  const authors = book.authors
    .map((item) => item.author.name)
    .join(", ");

  const publishedDate = book.originalPublishedAt
    ? new Date(book.originalPublishedAt).toLocaleDateString()
    : "Not available";

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
          <div className="flex min-h-96 items-center justify-center rounded-xl bg-gray-100">
            <span className="px-6 text-center text-3xl font-bold text-gray-800">
              {book.title}
            </span>
          </div>

          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              {book.category.name}
            </span>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              {book.title}
            </h1>

            <p className="mt-3 text-lg text-gray-600">
              By {authors || "Unknown author"}
            </p>

            <p className="mt-8 leading-7 text-gray-700">
              {book.description || "No description available."}
            </p>

            <div className="mt-8 space-y-3 border-t border-gray-200 pt-6">
              <p className="text-gray-700">
                <span className="font-semibold">Originally published:</span>{" "}
                {publishedDate}
              </p>

              <p className="text-gray-700">
                <span className="font-semibold">ISBN:</span>{" "}
                {book.isbn || "Not available"}
              </p>

              <p className="text-gray-700">
                <span className="font-semibold">Author:</span>{" "}
                {authors || "Unknown author"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default BookDetailsPage;
