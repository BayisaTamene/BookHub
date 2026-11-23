import path from "node:path";
import { fileURLToPath } from "node:url";

import { LocalStorage } from "./local.storage.js";

// Get the directory containing this module.
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// Resolve the storage directory from the backend root.
const storageDirectory = path.resolve(currentDirectory, "../../../storage");

// Create one reusable storage provider.
export const storage = new LocalStorage(storageDirectory);