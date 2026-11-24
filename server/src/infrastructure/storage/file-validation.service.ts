import { Readable } from "node:stream";
import { fileTypeFromStream } from "file-type";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import yauzl from "yauzl";
import { SaxesParser } from "saxes";

import { storage } from "./storage.service.js";
import AppError from "../../utils/app-error.js";
import { endsWith } from "zod";

// Create a temporary copy of a stored file for archive inspection.
const createTemporaryFile = async (key: string): Promise<string> => {
  // Create an isolated temporary directory.
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "bookhub-"),
  );

  // Define the temporary file path.
  const temporaryFile = path.join(temporaryDirectory, "upload");

  try {
    // Stream the stored file into the temporary file.
    await pipeline(
      await storage.read(key),
      createWriteStream(temporaryFile, { flags: "wx", mode: 0o600 }),
    );

    return temporaryFile;
  } catch (error) {
    // Remove temporary files if copying fails.
    await rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });

    throw error;
  }
};

// Parses META-INF/container.xml and returns the actual OPF package document path.
const parseContainerXml = (xml: string): string => {
  // Stores the package document path declared by the EPUB.
  let packagePath: string | undefined;

  // Enable namespace-aware XML parsing.
  const parser = new SaxesParser({ xmlns: true });

  // Reject DOCTYPE declarations to prevent unsafe XML processing.
  parser.on("doctype", () => {
    throw new AppError(
      "EPUB container XML must not contain a DOCTYPE.",
      415,
    );
  });

  // Execute this handler whenever the parser encounters an opening XML element.
  parser.on("opentag", (tag) => {
    // Find the rootfile element belonging to the EPUB container namespace.
    if (
      tag.local === "rootfile" &&
      tag.uri === "urn:oasis:names:tc:opendocument:xmlns:container"
    ) {
      // Extract the OPF document path and its required media type.
      const fullPath = tag.attributes["full-path"]?.value;
      const mediaType = tag.attributes["media-type"]?.value;

      // Reject duplicate declarations, missing paths, or incorrect media types.
      if (
        packagePath ||
        !fullPath ||
        mediaType !== "application/oebps-package+xml"
      ) {
        throw new AppError("Invalid EPUB package declaration.", 415);
      }

      // Save the declared package document path.
      packagePath = fullPath;
    }
  });

  try {
    // Parse the complete XML document and finish parsing.
    parser.write(xml).close();
  } catch {
    // Convert XML parsing failures into an HTTP 415 application error.
    throw new AppError("Invalid EPUB container XML.", 415);
  }

  // Reject XML documents that do not declare a package document.
  if (!packagePath) {
    throw new AppError("EPUB package document was not declared.", 415);
  }

  // Return the package document path for further archive validation.
  return packagePath;
};

// Validates that the OPF package path is a safe archive-relative path.
const validatePackagePath = (packagePath: string): string => {
  // Reject empty paths, absolute paths, backslashes, and null characters.
  if (
    !packagePath ||
    packagePath.startsWith("/") ||
    packagePath.includes("\\") ||
    packagePath.includes("\0")
  ) {
    throw new AppError("Invalid EPUB package document path.", 415);
  }

  // Split the path into individual archive directory/file segments.
  const segments = packagePath.split("/");

  // Reject empty segments and directory traversal components.
  if (
    segments.some(
      (segment) => !segment || segment === "." || segment === "..",
    )
  ) {
    throw new AppError("Unsafe EPUB package document path.", 415);
  }

  // The package document must be an OPF file.
  if (!packagePath.toLowerCase().endsWith(".opf")) {
    throw new AppError("Invalid EPUB package document path.", 415);
  }

  // Return the validated path without modifying it.
  return packagePath;
};

// Reads one ZIP entry while enforcing a maximum amount of data.
const readZipEntry = async (
  zipFile: yauzl.ZipFile,
  entry: yauzl.Entry,
  maxBytes: number,
): Promise<Buffer> => {
  // Open a readable stream for the selected ZIP entry.
  const stream = await zipFile.openReadStreamPromise(entry);

  // Store the small chunks as they arrive.
  const chunks: Buffer[] = [];

  // Track the total number of bytes read.
  let totalBytes = 0;

  // Read the entry progressively instead of loading it all at once.
  for await (const chunk of stream) {
    // Ensure each incoming chunk is represented as a Buffer.
    const buffer = Buffer.from(chunk);

    // Update the total number of bytes received.
    totalBytes += buffer.length;

    // Reject entries that exceed the permitted memory limit.
    if (totalBytes > maxBytes) {
      throw new AppError("EPUB metadata entry is too large.", 415);
    }

    // Keep the chunk for the final result.
    chunks.push(buffer);
  }

  // Combine the collected chunks into one Buffer.
  return Buffer.concat(chunks, totalBytes);
};

// Reads a ZIP entry stream and counts its actual decompressed bytes.
const countZipEntryBytes = async (
  zipFile: yauzl.ZipFile,
  entry: yauzl.Entry,
  maxBytes: number,
): Promise<number> => {
  // Open the decompressed stream for this archive entry.
  const stream = await zipFile.openReadStreamPromise(entry);

  // Track the actual number of decompressed bytes received.
  let totalBytes = 0;

  // Consume the stream without storing its contents in memory.
  for await (const chunk of stream) {
    // Count the bytes in the current chunk.
    totalBytes += chunk.length;

    // Reject an entry that exceeds the permitted size.
    if (totalBytes > maxBytes) {
      throw new AppError(
        "EPUB entry expands beyond the allowed size.",
        415,
      );
    }
  }

  // Return the actual decompressed size after reading the entire entry.
  return totalBytes;
};

// Validates the internal structure of an EPUB ZIP archive.
const validateEpubArchive = async (
  filePath: string,
): Promise<void> => {
  // Open the EPUB archive for inspection.
  const zipFile = await yauzl.openPromise(filePath, {
    lazyEntries: true,
    validateEntrySizes: true,
    strictFileNames: true,
  });

  try {
    // Store archive entries by their internal filenames.
    const entries = new Map<string, yauzl.Entry>();

    // Track the number of entries and their actual expanded size.
    let entryCount = 0;
    let totalUncompressedSize = 0;

    // Inspect and verify every entry in the archive.
for await (const entry of zipFile.eachEntry()) {
  entryCount++;

  // Prevent archives containing an excessive number of entries.
  if (entryCount > 1000) {
    throw new AppError("EPUB contains too many archive entries.", 415);
  }

  // Reject duplicate filenames to avoid ambiguous file references.
  if (entries.has(entry.fileName)) {
    throw new AppError("EPUB contains duplicate archive entries.", 415);
  }

  // Save the entry for later metadata inspection.
  entries.set(entry.fileName, entry);

  // Directory entries do not contain file data.
  if (entry.fileName.endsWith("/")) {
    continue;
  }

  // Calculate the remaining space allowed for decompressed data.
  const remainingBytes = 200 * 1024 * 1024 - totalUncompressedSize;

  // Read and count the actual decompressed bytes.
  const actualSize = await countZipEntryBytes(
    zipFile,
    entry,
    remainingBytes,
  );

  // Accumulate the actual decompressed size.
  totalUncompressedSize += actualSize;

  // Reject archives exceeding the total expanded-size limit.
  if (totalUncompressedSize > 200 * 1024 * 1024) {
    throw new AppError(
      "EPUB archive expands beyond the allowed size.",
      415,
    );
  }
}

    // The EPUB specification requires mimetype to be the first ZIP entry.
    const firstEntry = entries.values().next().value;

    if (
      !firstEntry ||
      firstEntry.fileName !== "mimetype" ||
      firstEntry.compressionMethod !== 0
    ) {
      throw new AppError("Invalid EPUB mimetype entry.", 415);
    }

    // Locate the required EPUB metadata files.
    const mimetypeEntry = entries.get("mimetype");
    const containerEntry = entries.get("META-INF/container.xml");

    // Reject archives missing either required entry.
    if (!mimetypeEntry || !containerEntry) {
      throw new AppError("EPUB is missing required metadata files.", 415);
    }

    // Read the mimetype entry with a small memory limit.
    const mimetypeBuffer = await readZipEntry(
      zipFile,
      mimetypeEntry,
      100,
    );

    // Confirm the exact EPUB media type.
    if (mimetypeBuffer.toString("utf8") !== "application/epub+zip") {
      throw new AppError("Invalid EPUB mimetype content.", 415);
    }

    // Read the container XML with a 64 KiB memory limit.
    const containerBuffer = await readZipEntry(
      zipFile,
      containerEntry,
      64 * 1024,
    );

    // Parse the XML to discover the actual package document path.
    const packagePath = parseContainerXml(
      containerBuffer.toString("utf8"),
    );

    // Validate the declared path before looking it up in the archive.
    const safePackagePath = validatePackagePath(packagePath);

    // Confirm that the declared package document exists in the archive.
    const packageEntry = entries.get(safePackagePath);

    if (!packageEntry || packageEntry.fileName.endsWith("/")) {
      throw new AppError("EPUB package document is missing.", 415);
    }
  } finally {
    // Close the ZIP archive even if validation fails.
    zipFile.close();
  }
};

// Supported formats for uploaded cover images.
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Supported formats for uploaded book files.
const allowedBookTypes = [
  "application/pdf",
  "application/epub+zip",
];

// Detect and validate the actual file format.
export const validateFileType = async (
  key: string,
  category: "image" | "book",
): Promise<void> => {
  // Open the quarantined file as a readable stream.
  const fileStream = await storage.read(key);

  // Convert the Node.js stream into a Web ReadableStream.
  const webStream = Readable.toWeb(fileStream);

  // Detect the actual file format from its binary contents.
  const detectedType = await fileTypeFromStream(webStream);

  // Reject files whose format could not be identified.
  if (!detectedType) {
    throw new AppError("Invalid or unsupported file format.", 415);
  }

  // Select the allowed formats for the requested category.
  const allowedTypes =
    category === "image" ? allowedImageTypes : allowedBookTypes;

  // Reject files whose detected MIME type is not permitted.
  if (!allowedTypes.includes(detectedType.mime)) {
    throw new AppError("File content does not match the permitted format.", 415);
  }

  // Perform additional structural validation for EPUB files.
  if (
    category === "book" &&
    detectedType.mime === "application/epub+zip"
  ) {
    const temporaryFile = await createTemporaryFile(key);

    try {
      await validateEpubArchive(temporaryFile);
    } finally {
      await rm(path.dirname(temporaryFile), {
        recursive: true,
        force: true,
      });
    }
  }
};
