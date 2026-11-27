
import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { booksQuerySchema, bookIdSchema } from "./books.query.schema.js";
import { createBook, getBooks, getBookById } from "./books.controller.js";
import { authenticate, authorizeAdmin } from "../../middleware/auth.middleware.js";
import { uploadBookAndCover } from "../../middleware/upload.middleware.js";

const router = Router();

// Retrieve the paginated public book catalog.
router.get("/", validate(booksQuerySchema, "query"), getBooks);

// Retrieve one publicly available book by its UUID.
router.get("/:id", validate(bookIdSchema, "params"), getBookById);

// Allow administrators to upload a book with an optional cover image.
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  uploadBookAndCover.fields([
    { name: "bookFile", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  createBook,
);

export { router as booksRouter };
