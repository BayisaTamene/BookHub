import multer from "multer";
import AppError from "../utils/app-error.js";
import { MulterStorage } from "../infrastructure/storage/multer.storage.js";

// Configure a reusable upload middleware.
const createUploadMiddleware = (
  allowedMimeTypes: string[],
  maxFileSize: number,
) => {
  return multer({
    storage: new MulterStorage(),

    limits: {
      fileSize: maxFileSize,
      files: 1,
      fields: 5,
      fieldSize: 16 * 1024,
      fieldNameSize: 100,
      parts: 6,
    },

    fileFilter: (_req, file, callback) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(
          new AppError("Unsupported file type.", 415),
        );

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