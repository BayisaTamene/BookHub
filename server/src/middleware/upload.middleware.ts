
import multer from "multer";
import AppError from "../utils/app-error.js";
import { MulterStorage } from "../infrastructure/storage/multer.storage.js";

// Configure a reusable upload middleware.
const createUploadMiddleware = (
  allowedMimeTypes: string[],
  maxFileSize: number,
  options?: {
    fileSizeLimits?: Record<string, number>;
    allowedMimeTypesByField?: Record<string, string[]>;
    maxFiles?: number;
    maxParts?: number;
  },
) => {
  return multer({
    storage: new MulterStorage(options?.fileSizeLimits),
    limits: {
      fileSize: maxFileSize,
      files: options?.maxFiles ?? 1,
      fields: 5,
      fieldSize: 16 * 1024,
      fieldNameSize: 100,
      parts: options?.maxParts ?? 6,
    },
    fileFilter: (_req, file, callback) => {
      const allowedTypes = options?.allowedMimeTypesByField
        ? options.allowedMimeTypesByField[file.fieldname] ?? []
        : allowedMimeTypes;

      if (!allowedTypes.includes(file.mimetype)) {
        callback(new AppError("Unsupported file type.", 415));
        return;
      }

      callback(null, true);
    },
  });
};

// Configure cover-image uploads.
export const uploadCover = createUploadMiddleware(
  ["image/jpeg", "image/png", "image/webp"],
  8 * 1024 * 1024,
);

// Configure book-file uploads.
export const uploadBookFile = createUploadMiddleware(
  ["application/pdf", "application/epub+zip"],
  80 * 1024 * 1024,
);

// Configure combined book-file and optional cover-image uploads.
export const uploadBookAndCover = createUploadMiddleware(
  [
    "application/pdf",
    "application/epub+zip",
    "image/jpeg",
    "image/png",
    "image/webp",
  ],
  80 * 1024 * 1024,
  {
    fileSizeLimits: {
      coverImage: 8 * 1024 * 1024,
    },
    allowedMimeTypesByField: {
      bookFile: ["application/pdf", "application/epub+zip"],
      coverImage: ["image/jpeg", "image/png", "image/webp"],
    },
    maxFiles: 2,
    maxParts: 7,
  },
);
