
import { useEffect, useState } from "react";

import CatalogBookCard from "../components/CatalogBookCard";
import { getBooks } from "../lib/books";
import { getCategories } from "../lib/categories";

import type { BooksData } from "../types/books";
import type { Category } from "../types/categories";

function ExplorePage() {
  // Search and category filter state.
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Catalog data and pagination state.
  const [booksData, setBooksData] = useState<BooksData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);

  // Loading and error states.
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  // Wait 300 milliseconds after typing before updating the search query.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Reset pagination when the search or category filter changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  // Fetch categories from the backend.
  useEffect(() => {
    let active = true;

    async function fetchCategories() {
      try {
        setIsCategoriesLoading(true);
        setCategoryError("");

        const response = await getCategories();

        if (active) {
          setCategories(response.data);
        }
      } catch (err) {
        if (active) {
          setCategoryError(
            err instanceof Error
              ? err.message
              : "Failed to load categories.",
          );
        }
      } finally {
        if (active) {
          setIsCategoriesLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  // Fetch books whenever the page, category, or search changes.
  useEffect(() => {
    let active = true;

    async function fetchBooks() {
      try {
        setIsLoading(true);
        setError("");

        const response = await getBooks({
          page,
          limit: 12,
          category: selectedCategory || undefined,
          search: debouncedSearch || undefined,
        });

        if (active) {
          setBooksData(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load books.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchBooks();

    return () => {
      active = false;
    };
  }, [page, selectedCategory, debouncedSearch]);

  const books = booksData?.books ?? [];
  const pagination = booksData?.pagination;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">

        {/* Page Heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Explore Books
          </h1>

          <p className="mt-2 text-gray-600">
            Discover books and find your next great read.
          </p>
        </div>

        {/* Search and Category Filters */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, description, or author..."
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value)
            }
            disabled={isCategoriesLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {isCategoriesLoading
                ? "Loading categories..."
                : "All Categories"}
            </option>

            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Loading Error */}
        {categoryError && (
          <p className="mb-4 text-sm text-red-600">
            Could not load categories: {categoryError}
          </p>
        )}

        {/* Books Count */}
        {pagination && (
          <p className="mb-6 text-sm text-gray-600">
            Showing {books.length} of {pagination.totalBooks} books
          </p>
        )}

        {/* Books Loading State */}
        {isLoading ? (
          <p className="py-12 text-center text-gray-500">
            Loading books...
          </p>
        ) : error ? (
          /* Books Error State */
          <p className="py-12 text-center text-red-600">
            {error}
          </p>
        ) : books.length > 0 ? (
          <>
            {/* Books Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {books.map((book) => (
                <CatalogBookCard key={book.id} book={book} />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <p className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </p>

                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <p className="py-12 text-center text-gray-500">
            No books found. Try another search or category.
          </p>
        )}

      </div>
    </main>
  );
}

export default ExplorePage;
