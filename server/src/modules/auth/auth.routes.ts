import { Router } from "express";
import { login, logout, me, register } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { registerSchema } from "../validation/register.schema.js";
import { loginSchema } from "../validation/login.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/logout", logout);

router.get("/me", authenticate, me);

export { router as authRouter };
