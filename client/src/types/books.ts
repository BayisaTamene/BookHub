export interface BookAuthor {
  author: {
    id: string;
    name: string;
  };
}

export interface BookCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Book {
  id: string;
  title: string;
  description: string | null;
  isbn: string | null;
  originalPublishedAt: string | null;
  coverImageKey: string | null;
  category: BookCategory;
  authors: BookAuthor[];
}

export interface BooksPagination {
  page: number;
  limit: number;
  totalBooks: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BooksData {
  books: Book[];
  pagination: BooksPagination;
}