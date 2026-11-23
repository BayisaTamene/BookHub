
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma.js";
import type { z } from "zod";
import { booksQuerySchema, bookIdSchema } from "./books.query.schema.js";
import AppError from "../../utils/app-error.js";

// Infer the validated query type directly from the Zod schema.
type BooksQuery = z.infer<typeof booksQuerySchema>;

export const getBooks = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Use validated and transformed query parameters.
    const { page, limit, category, search } =
      res.locals.validated.query as BooksQuery;

    // Calculate how many records to skip for pagination.
    const skip = (page - 1) * limit;

    // Build filters for publicly available books.
    const where = {
      status: "PUBLISHED" as const,
      archivedAt: null,
      deletedAt: null,

      ...(category && {
        category: {
          slug: category,
        },
      }),

      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            authors: {
              some: {
                author: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          },
        ],
      }),
    };

    // Retrieve the current page and total matching record count.
    const [books, totalBooks] = await prisma.$transaction([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          isbn: true,
          originalPublishedAt: true,
          coverImageKey: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          authors: {
            select: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.book.count({ where }),
    ]);

    // Calculate pagination information.
    const totalPages = Math.ceil(totalBooks / limit);

    res.status(200).json({
      success: true,
      data: {
        books,
        pagination: {
          page,
          limit,
          totalBooks,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

type BookIdParams = z.infer<typeof bookIdSchema>;

export const getBookById = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Use the validated UUID from the route parameters.
    const { id } = res.locals.validated.params as BookIdParams;

    // Retrieve one publicly available book.
    const book = await prisma.book.findFirst({
      where: {
        id,
        status: "PUBLISHED",
        archivedAt: null,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        isbn: true,
        originalPublishedAt: true,
        coverImageKey: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        authors: {
          select: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Treat unavailable books as not found.
    if (!book) {
      next(new AppError("Book not found.", 404));
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        book,
      },
    });
  } catch (error) {
    next(error);
  }
};

