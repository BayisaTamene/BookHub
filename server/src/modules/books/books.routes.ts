import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { booksQuerySchema } from "./books.query.schema.js";
import { getBooks } from "./books.controller.js";

const router = Router();

// Validate query parameters before retrieving books.
router.get("/", validate(booksQuerySchema, "query"), getBooks);

export { router as booksRouter };