import { createWriteStream } from "node:fs";
import { link, lstat, open, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import type { Readable } from "node:stream";

import type {
  StorageSaveOptions,
  StorageService,
} from "./storage.interface.js";

// Implements file storage using the local filesystem.
export class LocalStorage implements StorageService {
  constructor(private readonly rootDirectory: string) {}

  // Validate a storage key and resolve its safe filesystem path.
  private resolveKey(key: string): string {
    const segments = key.split("/");

    if (
      segments.length !== 2 ||
      !["covers", "books", "quarantine"].includes(segments[0]) ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segments[1])
    ) {
      throw new Error("Invalid storage key.");
    }

    const root = path.resolve(this.rootDirectory);
    const filePath = path.resolve(root, key);
    const relativePath = path.relative(root, filePath);

    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error("Storage path is outside the storage directory.");
    }

    return filePath;
  }

  // Ensure the storage directories are real directories, not symbolic links.
  private async validateDirectories(filePath: string): Promise<void> {
    const root = path.resolve(this.rootDirectory);
    const targetDirectory = path.dirname(filePath);

    for (const directory of [root, targetDirectory]) {
      const directoryInfo = await lstat(directory);

      if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) {
        throw new Error("Invalid storage directory.");
      }
    }
  }

  // Save a file without overwriting an existing file.
  async save(
    file: Readable,
    key: string,
    _options: StorageSaveOptions,
  ): Promise<void> {
    const filePath = this.resolveKey(key);

    await this.validateDirectories(filePath);

    let fileCreated = false;

    try {
      const fileHandle = await open(filePath, "wx");
      fileCreated = true;

      try {
        await pipeline(
          file,
          createWriteStream(filePath, {
            fd: fileHandle.fd,
            autoClose: false,
          }),
        );
      } finally {
        await fileHandle.close();
      }
    } catch (error) {
      // Remove only the file created by this operation.
      if (fileCreated) {
        await unlink(filePath).catch(() => undefined);
      }

      throw error;
    }
  }

 // Move a stored file to another storage location.
async move(sourceKey: string, destinationKey: string): Promise<void> {
  const sourcePath = this.resolveKey(sourceKey);
  const destinationPath = this.resolveKey(destinationKey);

  await this.validateDirectories(sourcePath);
  await this.validateDirectories(destinationPath);

  // Verify that the source is a regular file, not a symbolic link.
  const sourceInfo = await lstat(sourcePath);

  if (!sourceInfo.isFile() || sourceInfo.isSymbolicLink()) {
    throw new Error("Source is not a valid regular file.");
  }

  // Create a destination hard link without replacing an existing file.
  await link(sourcePath, destinationPath);

  try {
    // Remove the original filename after creating the destination.
    await unlink(sourcePath);
  } catch (error) {
    // Roll back the destination link if source removal fails.
    await unlink(destinationPath).catch(() => undefined);
    throw error;
  }
}

  // Retrieve a file as a readable stream.
  async read(key: string): Promise<Readable> {
    const filePath = this.resolveKey(key);

    await this.validateDirectories(filePath);

    const fileHandle = await open(filePath, "r");

    try {
      // Inspect the file through the opened handle.
      const fileInfo = await fileHandle.stat();

      // Inspect the filesystem entry without following a symlink.
      const pathInfo = await lstat(filePath);

      if (
        !fileInfo.isFile() ||
        pathInfo.isSymbolicLink() ||
        fileInfo.dev !== pathInfo.dev ||
        fileInfo.ino !== pathInfo.ino
      ) {
        throw new Error("Stored item is not a valid regular file.");
      }

      // Stream from the already-opened file handle.
      return fileHandle.createReadStream({ autoClose: true });
    } catch (error) {
      await fileHandle.close().catch(() => undefined);
      throw error;
    }
  }

  // Delete a stored file.
  async delete(key: string): Promise<void> {
    const filePath = this.resolveKey(key);

    await this.validateDirectories(filePath);

    try {
      await unlink(filePath);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }

      throw error;
    }
  }

  // Check whether a regular file exists.
  async exists(key: string): Promise<boolean> {
    const filePath = this.resolveKey(key);

    await this.validateDirectories(filePath);

    try {
      const fileInfo = await lstat(filePath);
      return fileInfo.isFile();
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error.code === "ENOENT" || error.code === "ENOTDIR")
      ) {
        return false;
      }

      throw error;
    }
  }
}
