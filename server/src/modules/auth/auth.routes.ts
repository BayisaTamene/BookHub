import { Router } from "express";
import { register } from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { registerSchema } from "../validation/register.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
export { router as authRouter };