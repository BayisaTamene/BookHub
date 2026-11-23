import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { booksQuerySchema, bookIdSchema } from "./books.query.schema.js";
import { getBooks, getBookById } from "./books.controller.js";

const router = Router();

// Retrieve the paginated public book catalog.
router.get("/", validate(booksQuerySchema, "query"), getBooks);

// Retrieve one publicly available book by its UUID.
router.get("/:id", validate(bookIdSchema, "params"), getBookById);

export { router as booksRouter };