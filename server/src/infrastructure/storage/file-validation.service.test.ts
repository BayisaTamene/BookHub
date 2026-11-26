import { test } from "node:test";
import assert from "node:assert/strict";
import { validateFileType } from "./file-validation.service.js";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { strToU8, zipSync, Zip, ZipPassThrough, ZipDeflate } from "fflate";

import { storage } from "./storage.service.js";

// Creates a small, genuine PDF document for testing.
const createPdfFixture = (): Buffer => {
  const content = [
    "%PDF-1.4",
    "1 0 obj",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "endobj",
    "2 0 obj",
    "<< /Type /Pages /Kids [] /Count 0 >>",
    "endobj",
    "trailer",
    "<< /Root 1 0 R >>",
    "%%EOF",
  ].join("\n");

  return Buffer.from(content, "ascii");
};

// Creates a tiny PNG image for testing.
const createPngFixture = (): Buffer => {
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC";

  return Buffer.from(base64, "base64");
};

// Creates a valid EPUB archive for testing.
const createEpubFixture = (): Buffer => {
  const archive = zipSync(
    {
      // EPUB requires this entry to be first and uncompressed.
      mimetype: [
        strToU8("application/epub+zip"),
        { level: 0 },
      ],

      // Identifies the package document inside the EPUB.
      "META-INF/container.xml": strToU8(
        `<?xml version="1.0" encoding="UTF-8"?>
        <container
          xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
          version="1.0">
          <rootfiles>
            <rootfile
              full-path="EPUB/package.opf"
              media-type="application/oebps-package+xml"/>
          </rootfiles>
        </container>`,
      ),

      // Minimal package document.
      "EPUB/package.opf": strToU8(
        `<?xml version="1.0" encoding="UTF-8"?>
        <package
          xmlns="http://www.idpf.org/2007/opf"
          version="3.0"
          unique-identifier="book-id">
          <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
            <dc:identifier id="book-id">test-book</dc:identifier>
            <dc:title>Test Book</dc:title>
            <dc:language>en</dc:language>
          </metadata>
          <manifest/>
          <spine/>
        </package>`,
      ),
    },
    {
      // Keep the mimetype entry uncompressed.
      level: 6,
    },
  );

  return Buffer.from(archive);
};

// Creates an ordinary ZIP archive, not an EPUB.
const createOrdinaryZipFixture = (): Buffer => {
  const archive = zipSync({
    "notes.txt": strToU8("This is an ordinary ZIP archive."),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like ZIP archive without the required mimetype entry.
const createEpubWithoutMimetypeFixture = (): Buffer => {
  const archive = zipSync({
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with incorrect mimetype content.
const createEpubWithInvalidMimetypeFixture = (): Buffer => {
  const archive = zipSync({
    // First entry, stored without compression, but with incorrect content.
    mimetype: [
      strToU8("application/zip"),
      { level: 0 },
    ],

    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with mimetype in the wrong position.
const createEpubWithMimetypeNotFirstFixture = (): Buffer => {
  const archive = zipSync({
    // This entry deliberately comes before mimetype.
    "notes.txt": strToU8("This entry must not come first."),

    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with a compressed mimetype entry.
const createEpubWithCompressedMimetypeFixture = (): Buffer => {
  const archive = zipSync(
    {
      // Correct position and content, but this entry will be compressed.
      mimetype: strToU8("application/epub+zip"),

      "META-INF/container.xml": strToU8(
        `<?xml version="1.0" encoding="UTF-8"?>
        <container
          xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
          version="1.0">
          <rootfiles>
            <rootfile
              full-path="EPUB/package.opf"
              media-type="application/oebps-package+xml"/>
          </rootfiles>
        </container>`,
      ),

      "EPUB/package.opf": strToU8("<package/>"),
    },
    {
      // Apply compression to the mimetype entry.
      level: 6,
    },
  );

  return Buffer.from(archive);
};

// Creates an EPUB-like archive without the required container.xml file.
const createEpubWithoutContainerFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // The package document exists, but container.xml is missing.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with malformed container.xml.
const createEpubWithMalformedContainerFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // Deliberately malformed XML: the closing tag is incorrect.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </containers>`,
    ),

    // Package document exists.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with container.xml missing its rootfile.
const createEpubWithoutRootfileFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // Valid XML, but the rootfiles element contains no rootfile.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles/>
      </container>`,
    ),

    // Package document exists but isn't referenced by container.xml.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with a rootfile missing its full-path attribute.
const createEpubWithMissingPackagePathFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // Valid XML, but rootfile has no full-path attribute.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    // Package document exists, but container.xml doesn't reference it.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with a package path attempting directory traversal.
const createEpubWithPathTraversalFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // The path attempts to escape the EPUB archive's directory structure.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="../../outside/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    // A normal package document is included, but the declared path is unsafe.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with an absolute package document path.
const createEpubWithAbsolutePackagePathFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // The leading slash makes this an absolute path.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    // A normal package document exists, but the declared path is absolute.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with Windows-style path separators.
const createEpubWithBackslashPathFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // Backslashes are invalid in EPUB archive paths.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB\\package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    // A normal package document exists, but the declared path is invalid.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with an invalid package document extension.
const createEpubWithInvalidPackageExtensionFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // Points to a .txt file instead of the required .opf package document.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.txt"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    // The referenced file exists, but its extension is invalid.
    "EPUB/package.txt": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with an invalid package document media type.
const createEpubWithInvalidPackageMediaTypeFixture = (): Buffer => {
  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // Declares an incorrect media type for the package document.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="text/plain"/>
        </rootfiles>
      </container>`,
    ),

    // The package file exists and has the correct extension.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive containing duplicate filenames.
const createEpubWithDuplicateEntriesFixture = async (): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    // Create a ZIP archive and collect its generated data.
    const zip = new Zip((error, data, final) => {
      if (error) {
        reject(error);
        return;
      }

      chunks.push(data);

      // Resolve once the complete ZIP archive has been generated.
      if (final) {
        resolve(Buffer.concat(chunks));
      }
    });

    // Add an individual ZIP entry.
    const addEntry = (name: string, content: string): void => {
      const entry = new ZipPassThrough(name);

      zip.add(entry);
      entry.push(strToU8(content), true);
    };

    // Add the required EPUB mimetype as the first entry.
    addEntry("mimetype", "application/epub+zip");

    // Add the required container metadata.
    addEntry(
      "META-INF/container.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    );

    // Add the same package filename twice.
    addEntry("EPUB/package.opf", "<package/>");
    addEntry("EPUB/package.opf", "<package>duplicate</package>");

    zip.end();
  });
};

// Creates an EPUB-like archive containing more than 1,000 entries.
const createEpubWithTooManyEntriesFixture = async (): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    // Create a ZIP archive and collect its generated data.
    const zip = new Zip((error, data, final) => {
      if (error) {
        reject(error);
        return;
      }

      chunks.push(data);

      if (final) {
        resolve(Buffer.concat(chunks));
      }
    });

    // Add an individual ZIP entry.
    const addEntry = (name: string, content: string): void => {
      const entry = new ZipPassThrough(name);

      zip.add(entry);
      entry.push(strToU8(content), true);
    };

    // Add the required EPUB mimetype as the first entry.
    addEntry("mimetype", "application/epub+zip");

    // Add the required container metadata.
    addEntry(
      "META-INF/container.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    );

    // Add the package document.
    addEntry("EPUB/package.opf", "<package/>");

    // Add 998 additional entries, bringing the total to 1,001.
    for (let i = 0; i < 998; i++) {
      addEntry(`EPUB/extra-${i}.txt`, "test");
    }

    zip.end();
  });
};

// Creates an EPUB-like archive that expands beyond the allowed size.
const createEpubWithExcessiveExpandedSizeFixture =
  async (): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      // Create a ZIP archive and collect its generated data.
      const zip = new Zip((error, data, final) => {
        if (error) {
          reject(error);
          return;
        }

        chunks.push(data);

        if (final) {
          resolve(Buffer.concat(chunks));
        }
      });

      // Add an individual ZIP entry.
      const addEntry = (name: string, content: string): void => {
        const entry = new ZipPassThrough(name);

        zip.add(entry);
        entry.push(strToU8(content), true);
      };

      // Add the required EPUB mimetype.
      addEntry("mimetype", "application/epub+zip");

      // Add the required container metadata.
      addEntry(
        "META-INF/container.xml",
        `<?xml version="1.0" encoding="UTF-8"?>
        <container
          xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
          version="1.0">
          <rootfiles>
            <rootfile
              full-path="EPUB/package.opf"
              media-type="application/oebps-package+xml"/>
          </rootfiles>
        </container>`,
      );

      // Add the package document.
      addEntry("EPUB/package.opf", "<package/>");

      // Create a compressed ZIP entry for oversized content.
      const largeEntry = new ZipDeflate("EPUB/large.txt", {
        level: 6,
      });

      zip.add(largeEntry);

      // Reuse a 1 MiB buffer instead of allocating 200 MiB at once.
      const chunkSize = 1024 * 1024;
      const buffer = new Uint8Array(chunkSize);
      buffer.fill(65);

      // Set the expanded size to 200 MiB plus one byte.
      const totalBytes = 200 * 1024 * 1024 + 1;

      // Feed the data into the compressor incrementally.
      for (let offset = 0; offset < totalBytes; offset += chunkSize) {
        const currentSize = Math.min(
          chunkSize,
          totalBytes - offset,
        );

        largeEntry.push(
          buffer.subarray(0, currentSize),
          offset + currentSize === totalBytes,
        );
      }

      zip.end();
    });
  };

 // Creates a valid EPUB-like archive with a corrupted ZIP end record.
const createCorruptedEpubFixture = (): Buffer => {
  // Start with a structurally valid EPUB archive.
  const corruptedData = createEpubFixture();

  // Locate the ZIP end-of-central-directory signature.
  const signature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const signatureOffset = corruptedData.lastIndexOf(signature);

  // Ensure the expected ZIP record exists.
  if (signatureOffset === -1) {
    throw new Error("ZIP end-of-central-directory record was not found.");
  }

  // Corrupt the signature so the ZIP archive becomes invalid.
  corruptedData[signatureOffset] = 0x00;

  return corruptedData;
};

// Creates an EPUB-like archive with oversized container.xml metadata.
const createEpubWithOversizedContainerFixture = (): Buffer => {
  // Generate XML content larger than the permitted 64 KiB.
  const oversizedContent = " ".repeat(64 * 1024 + 1);

  const archive = zipSync({
    // Correct first entry, stored without compression.
    mimetype: [
      strToU8("application/epub+zip"),
      { level: 0 },
    ],

    // Include excessive whitespace inside otherwise valid XML.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        ${oversizedContent}
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    // Include a valid package document.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

// Creates an EPUB-like archive with an oversized mimetype entry.
const createEpubWithOversizedMimetypeFixture = (): Buffer => {
  // Generate mimetype content larger than the permitted 100 bytes.
  const oversizedMimetype = "application/epub+zip" + " ".repeat(81);

  const archive = zipSync({
    // The mimetype must remain the first entry and be uncompressed.
    mimetype: [
      strToU8(oversizedMimetype),
      { level: 0 },
    ],

    // Include valid container metadata.
    "META-INF/container.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
      <container
        xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
        version="1.0">
        <rootfiles>
          <rootfile
            full-path="EPUB/package.opf"
            media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`,
    ),

    // Include a valid package document.
    "EPUB/package.opf": strToU8("<package/>"),
  });

  return Buffer.from(archive);
};

//Reject a plain text when image is expected.
test("rejects unsupported file formats", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    // Save plain text as a quarantined file.
    await storage.save(
      Readable.from(["This is not an image."]),
      key,
      { contentType: "text/plain" },
    );

    // Verify that the image validator rejects the file.
    await assert.rejects(
      validateFileType(key, "image"),
      {
        message: "Invalid or unsupported file format.",
      },
    );
  } finally {
    // Remove the test file, even if an assertion fails.
    await storage.delete(key);
  }
});

//Reject a valid PDF when image is expected.
test("rejects a valid PDF when an image is expected", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    // Save a genuine PDF file in quarantine.
    await storage.save(
      Readable.from([createPdfFixture()]),
      key,
      { contentType: "application/pdf" },
    );

    // Verify that the image validator rejects the PDF.
    await assert.rejects(
      validateFileType(key, "image"),
      {
        message: "File content does not match the permitted format.",
      },
    );
  } finally {
    // Remove the test file.
    await storage.delete(key);
  }
});

//Accept a valid PNG image when image is expected.
test("accepts a valid PNG image", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    // Save the PNG image in quarantine.
    await storage.save(
      Readable.from([createPngFixture()]),
      key,
      { contentType: "image/png" },
    );

    // Verify that the image validator accepts the PNG.
    await assert.doesNotReject(
      validateFileType(key, "image"),
    );
  } finally {
    // Remove the test file.
    await storage.delete(key);
  }
});

//Accept a valid PDF when book is expected.
test("accepts a valid PDF book file", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    // Save the PDF in quarantine.
    await storage.save(
      Readable.from([createPdfFixture()]),
      key,
      { contentType: "application/pdf" },
    );

    // Verify that the book validator accepts the PDF.
    await assert.doesNotReject(
      validateFileType(key, "book"),
    );
  } finally {
    // Remove the test file.
    await storage.delete(key);
  }
});

//Rejects a PDF when disguised with an image MIMe types.
test("rejects a PDF disguised with an image MIME type", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    // Save actual PDF content with misleading MIME metadata.
    await storage.save(
      Readable.from([createPdfFixture()]),
      key,
      { contentType: "image/png" },
    );

    // The actual PDF content must still be rejected as an image.
    await assert.rejects(
      validateFileType(key, "image"),
      {
        message: "File content does not match the permitted format.",
      },
    );
  } finally {
    await storage.delete(key);
  }
});

//Accept a valid EPUB when book is expected.
test("accepts a valid EPUB book file", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    // Save the EPUB archive in quarantine.
    await storage.save(
      Readable.from([createEpubFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    // Verify that the book validator accepts the EPUB.
    await assert.doesNotReject(
      validateFileType(key, "book"),
    );
  } finally {
    // Remove the test file.
    await storage.delete(key);
  }
});

//Reject an ordinary ZIP archive as an EPUB.
test("rejects an ordinary ZIP archive as an EPUB", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    // Save an ordinary ZIP archive in quarantine.
    await storage.save(
      Readable.from([createOrdinaryZipFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    // Verify that the EPUB validator rejects the ordinary ZIP.
    await assert.rejects(
      validateFileType(key, "book"),
      {
        message: "File content does not match the permitted format.",      },
    );
  } finally {
    // Remove the test file.
    await storage.delete(key);
  }
});

//Reject an EPUB missing its mimetyes entry.
test("rejects an EPUB missing its mimetype entry", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithoutMimetypeFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(
      validateFileType(key, "book"),
      {
        message: "File content does not match the permitted format.",
      },
    );
  } finally {
    await storage.delete(key);
  }
});

//Reject an EPUB with incorrect mimetyes content.
test("rejects an EPUB with incorrect mimetype content", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithInvalidMimetypeFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(
      validateFileType(key, "book"),
      {
        message: "File content does not match the permitted format.",
      },
    );
  } finally {
    await storage.delete(key);
  }
});

//Reject an EPUB when mimetyes is not the first ZIP entry.
test("rejects an EPUB when mimetype is not the first ZIP entry", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithMimetypeNotFirstFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB mimetype entry.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Reject an EPUB when mimetyes is compressed.
test("rejects an EPUB when mimetype is compressed", async () => {
  const key = `quarantine/${randomUUID()}`;

  // Generate the EPUB fixture.
  const fixture = createEpubWithCompressedMimetypeFixture();

  // Verify that the first ZIP entry has the expected local header signature.
  assert.equal(fixture.readUInt32LE(0), 0x04034b50);

  // Verify that the mimetype entry uses DEFLATE compression (method 8).
  assert.equal(fixture.readUInt16LE(8), 8);

  try {
    await storage.save(
      Readable.from([fixture]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB mimetype entry.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Reject an EPUB missing container.xml.
test("rejects an EPUB missing container.xml", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithoutContainerFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "EPUB is missing required metadata files.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Reject an EPUB with malformed container.xml.
test("rejects an EPUB with malformed container.xml", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithMalformedContainerFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB container XML.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB with no rootfile in container.xml
test("rejects an EPUB with no rootfile in container.xml", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithoutRootfileFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "EPUB package document was not declared.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB when rootfile is missing full-path.
test("rejects an EPUB when rootfile is missing full-path", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithMissingPackagePathFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB container XML.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB with a package path containing directory traversal
test("rejects an EPUB with a package path containing directory traversal", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithPathTraversalFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Unsafe EPUB package document path.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB with an absolute package document path
test("rejects an EPUB with an absolute package document path", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithAbsolutePackagePathFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB package document path.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB with Windows-style package path separators
test("rejects an EPUB with Windows-style package path separators", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithBackslashPathFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB package document path.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB with an invalid package document extension
test("rejects an EPUB with an invalid package document extension", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithInvalidPackageExtensionFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB package document path.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB with an invalid package document media type
test("rejects an EPUB with an invalid package document media type", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithInvalidPackageMediaTypeFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB container XML.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB containing duplicate archive entries.
test("rejects an EPUB containing duplicate archive entries", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([await createEpubWithDuplicateEntriesFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "EPUB contains duplicate archive entries.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB containing too many archive entries.
test("rejects an EPUB containing too many archive entries", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([await createEpubWithTooManyEntriesFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "EPUB contains too many archive entries.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB that expands beyond the allowed size
test("rejects an EPUB that expands beyond the allowed size", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([
        await createEpubWithExcessiveExpandedSizeFixture(),
      ]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "EPUB entry expands beyond the allowed size.",
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects a corrupted EPUB ZIP archive"
test("rejects a corrupted EPUB ZIP archive", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createCorruptedEpubFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "Invalid EPUB archive.",
      statusCode: 415,
    });
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB with oversized container.xml metadata
test("rejects an EPUB with oversized container.xml metadata", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithOversizedContainerFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"));
  } finally {
    await storage.delete(key);
  }
});

//Rejects an EPUB with an oversized mimetype entry.
test("rejects an EPUB with an oversized mimetype entry", async () => {
  const key = `quarantine/${randomUUID()}`;

  try {
    await storage.save(
      Readable.from([createEpubWithOversizedMimetypeFixture()]),
      key,
      { contentType: "application/epub+zip" },
    );

    await assert.rejects(validateFileType(key, "book"), {
      message: "EPUB metadata entry is too large.",
      statusCode: 415,
    });
  } finally {
    await storage.delete(key);
  }
});