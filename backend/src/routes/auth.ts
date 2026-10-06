import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as auth from "../controllers/authController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { forgotSchema, loginSchema, profileSchema, registerSchema, resetSchema } from "../validators/schemas.js";

export const authRouter = Router();

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." },
});

authRouter.post("/register", authLimit, validate(registerSchema), auth.register);
authRouter.post("/login", authLimit, validate(loginSchema), auth.login);
authRouter.post("/logout", optionalAuth, auth.logout);
authRouter.get("/me", optionalAuth, auth.me);
authRouter.patch("/profile", requireAuth, validate(profileSchema), auth.updateProfile);
authRouter.get("/verify-email", auth.verifyEmail);
authRouter.post("/forgot-password", authLimit, validate(forgotSchema), auth.forgotPassword);
authRouter.post("/reset-password", authLimit, validate(resetSchema), auth.resetPassword);
