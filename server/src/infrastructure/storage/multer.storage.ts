
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type multer from "multer";
import { storage } from "./storage.service.js";
import AppError from "../../utils/app-error.js";

// Connects Multer's incoming file streams to BookHub storage.
export class MulterStorage implements multer.StorageEngine {
  constructor(
    private readonly fileSizeLimits?: Record<string, number>,
  ) {}

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

    const maxFileSize = this.fileSizeLimits?.[file.fieldname];

    let fileStream: Readable = file.stream;

    // Apply an additional size limit when one is configured for this field.
    if (maxFileSize !== undefined) {
      fileStream = Readable.from(
        (async function* () {
          let bytesReceived = 0;

          for await (const chunk of file.stream) {
            bytesReceived += chunk.length;

            if (bytesReceived > maxFileSize) {
              throw new AppError(
                "Uploaded file exceeds the allowed size limit.",
                413,
              );
            }

            yield chunk;
          }
        })(),
      );
    }

    // Stream the uploaded file into our storage provider.
    void storage
      .save(fileStream, key, {
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
