
import { randomUUID } from "node:crypto";

import type multer from "multer";

import { storage } from "./storage.service.js";

// Connects Multer's incoming file streams to BookHub storage.
export class MulterStorage implements multer.StorageEngine {

  // Save an incoming uploaded file.
  _handleFile(
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (
      error?: any,
      info?: Partial<Express.Multer.File>,
    ) => void,
  ): void {
    // Generate a unique server-controlled storage key.
      const key = `quarantine/${randomUUID()}`;
    // Stream the uploaded file into our storage provider.
    void storage
      .save(file.stream, key, {
        contentType: file.mimetype,
      })
      .then(() => {
        callback(null, { filename: key });
      })
      .catch((error: unknown) => {
        callback(
          error instanceof Error
            ? error
            : new Error("File storage failed."),
        );
      });
  }

  // Remove a previously stored file when cleanup is required.
  _removeFile(
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ): void {
    const key = file.filename;

    if (!key) {
      callback(new Error("Stored file key is missing."));
      return;
    }

    void storage
      .delete(key)
      .then(() => callback(null))
      .catch((error: unknown) => {
        callback(
          error instanceof Error
            ? error
            : new Error("File cleanup failed."),
        );
      });
  }
}
