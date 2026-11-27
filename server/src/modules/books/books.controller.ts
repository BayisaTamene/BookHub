
import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { randomUUID } from "node:crypto";
import {
  booksQuerySchema,
  bookIdSchema,
  bookCreateSchema,
} from "./books.query.schema.js";
import AppError from "../../utils/app-error.js";
import { storage } from "../../infrastructure/storage/storage.service.js";
import { validateFileType } from "../../infrastructure/storage/file-validation.service.js";

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

// Infer the validated book metadata type from the Zod schema.
type BookCreate = z.infer<typeof bookCreateSchema>;

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Track both files so they can be cleaned up if creation fails.
  let bookQuarantineKey: string | undefined;
  let coverQuarantineKey: string | undefined;

  let bookPermanentKey: string | undefined;
  let coverPermanentKey: string | undefined;

  let bookMoved = false;
  let coverMoved = false;
  let bookCreated = false;

  try {
    // Retrieve the uploaded files from Multer's fields middleware.
    const uploadedFiles = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;

    const bookFile = uploadedFiles?.bookFile?.[0];
    const coverImage = uploadedFiles?.coverImage?.[0];

    // Record quarantine keys before validation for reliable cleanup.
    bookQuarantineKey = bookFile?.filename;
    coverQuarantineKey = coverImage?.filename;

    // A book file is required, but a cover image is optional.
    if (!bookFile) {
      throw new AppError("Book file is required.", 400);
    }

    // Validate the metadata received from the multipart request.
    const result = bookCreateSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError("Invalid book metadata.", 400);
    }

    // Extract the validated metadata.
    const {
      title,
      description,
      isbn,
      categoryId,
      authorIds = [],
    } = result.data;

    // Reject duplicate author IDs.
    if (new Set(authorIds).size !== authorIds.length) {
      throw new AppError("Duplicate author IDs are not allowed.", 400);
    }

    // Verify that the selected category exists.
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    // Verify that all selected authors exist.
    const authors = await prisma.author.findMany({
      where: {
        id: { in: authorIds },
      },
      select: { id: true },
    });

    if (authors.length !== authorIds.length) {
      throw new AppError("One or more authors were not found.", 404);
    }

    // Validate the actual content of the uploaded book file.
    const detectedBookFormat = await validateFileType(
      bookQuarantineKey!,
      "book",
    );

    if (
      detectedBookFormat !== "PDF" &&
      detectedBookFormat !== "EPUB"
    ) {
      throw new AppError("Invalid book file format.", 415);
    }

    // Validate the actual content of the optional cover image.
    let detectedCoverFormat:
      | "JPEG"
      | "PNG"
      | "WEBP"
      | undefined;

    if (coverQuarantineKey) {
      const detectedFormat = await validateFileType(
        coverQuarantineKey,
        "image",
      );

      if (
        detectedFormat !== "JPEG" &&
        detectedFormat !== "PNG" &&
        detectedFormat !== "WEBP"
      ) {
        throw new AppError("Invalid cover image format.", 415);
      }

      detectedCoverFormat = detectedFormat;
    }

    // Generate permanent storage keys for the validated files.
    bookPermanentKey = `books/${randomUUID()}`;

    if (coverQuarantineKey) {
      coverPermanentKey = `covers/${randomUUID()}`;
    }

    // Move the validated book file out of quarantine.
    await storage.move(bookQuarantineKey!, bookPermanentKey);
    bookMoved = true;

    // Move the validated cover image if one was uploaded.
    if (coverQuarantineKey && coverPermanentKey) {
      await storage.move(coverQuarantineKey, coverPermanentKey);
      coverMoved = true;
    }

    // Create the book and its author relationships.
    const book = await prisma.book.create({
      data: {
        title,
        description,
        isbn,
        categoryId,
        fileKey: bookPermanentKey,
        fileFormat: detectedBookFormat,
        coverImageKey: coverPermanentKey ?? null,
        createdById: req.user!.id,
        updatedById: req.user!.id,

        ...(authorIds.length > 0 && {
          authors: {
            create: authorIds.map((authorId) => ({
              author: {
                connect: { id: authorId },
              },
            })),
          },
        }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        isbn: true,
        status: true,
        fileFormat: true,
        createdAt: true,
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

    bookCreated = true;

    res.status(201).json({
      success: true,
      message: "Book created successfully.",
      data: { book },
    });
  } catch (error) {
    // Clean up both files if database creation did not succeed.
    if (!bookCreated) {
      const keysToDelete = [
        bookMoved ? bookPermanentKey : bookQuarantineKey,
        coverMoved ? coverPermanentKey : coverQuarantineKey,
      ];

      let cleanupError: unknown;

      // Attempt both cleanups even if the first one fails.
      for (const key of keysToDelete) {
        if (!key) continue;

        try {
          await storage.delete(key);
        } catch (error) {
          cleanupError ??= error;
        }
      }

      if (cleanupError) {
        next(cleanupError);
        return;
      }
    }

    next(error);
  }
};
