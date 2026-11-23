
import { api } from "./api";
import type { ApiSuccess } from "../types/api";
import type { Book, BooksData } from "../types/books";

interface GetBooksParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export async function getBooks(
  params: GetBooksParams = {},
): Promise<ApiSuccess<BooksData>> {
  const query = new URLSearchParams();

  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }

  if (params.limit !== undefined) {
    query.set("limit", String(params.limit));
  }

  if (params.category) {
    query.set("category", params.category);
  }

  if (params.search) {
    query.set("search", params.search);
  }

  const queryString = query.toString();

  return api.get<ApiSuccess<BooksData>>(
    `/books${queryString ? `?${queryString}` : ""}`,
  );
}

export async function getBookById(
  id: string,
): Promise<ApiSuccess<{ book: Book }>> {
  return api.get<ApiSuccess<{ book: Book }>>(`/books/${id}`);
}
