import { Router } from "express";
import * as admin from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  announcementSchema,
  courseCreateSchema,
  labCreateSchema,
  projectCreateSchema,
  resourceCreateSchema,
} from "../validators/schemas.js";

export const adminRouter = Router();
adminRouter.use(requireAuth);

const staff = requireRole("ADMIN", "INSTRUCTOR");
const adminOnly = requireRole("ADMIN");

adminRouter.get("/stats", staff, admin.adminStats);
adminRouter.get("/users", adminOnly, admin.listUsers);
adminRouter.patch("/users/:id/role", adminOnly, admin.updateUserRole);
adminRouter.get("/certificates", adminOnly, admin.listCertificates);
adminRouter.post("/courses", staff, validate(courseCreateSchema), admin.createCourse);
adminRouter.post("/labs", staff, validate(labCreateSchema), admin.createLab);
adminRouter.post("/projects", staff, validate(projectCreateSchema), admin.createProject);
adminRouter.post("/resources", staff, validate(resourceCreateSchema), admin.createResource);
adminRouter.post("/announcements", staff, validate(announcementSchema), admin.createAnnouncement);
