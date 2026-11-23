
import type { Readable } from "node:stream";

// Additional information needed when saving a file.
export interface StorageSaveOptions {
  contentType: string;
}

// Defines the operations every storage provider must implement.
export interface StorageService {
  save(
    file: Readable,
    key: string,
    options: StorageSaveOptions,
  ): Promise<void>;

  move(sourceKey: string, destinationKey: string): Promise<void>;

  read(key: string): Promise<Readable>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}