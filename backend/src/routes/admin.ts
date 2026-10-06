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
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/stats", admin.adminStats);
adminRouter.get("/users", requireRole("ADMIN"), admin.listUsers);
adminRouter.patch("/users/:id/role", requireRole("ADMIN"), admin.updateUserRole);
adminRouter.get("/certificates", admin.listCertificates);
adminRouter.post("/courses", validate(courseCreateSchema), admin.createCourse);
adminRouter.post("/labs", validate(labCreateSchema), admin.createLab);
adminRouter.post("/projects", validate(projectCreateSchema), admin.createProject);
adminRouter.post("/resources", validate(resourceCreateSchema), admin.createResource);
adminRouter.post("/announcements", validate(announcementSchema), admin.createAnnouncement);
