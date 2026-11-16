
import { Router } from "express";
import { getCategories } from "./categories.controller.js";

const router = Router();

router.get("/", getCategories);

export { router as categoriesRouter };
