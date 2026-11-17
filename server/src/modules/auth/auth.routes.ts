import { Router } from "express";
import { login, logout, register } from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { registerSchema } from "../validation/register.schema.js";
import { loginSchema } from "../validation/login.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/logout", logout);

export { router as authRouter };
