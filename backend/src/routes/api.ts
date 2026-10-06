import { Router } from "express";
import * as courses from "../controllers/courseController.js";
import * as catalog from "../controllers/catalogController.js";
import * as learning from "../controllers/learningController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { quizSubmitSchema } from "../validators/schemas.js";

export const apiRouter = Router();

apiRouter.get("/courses", optionalAuth, courses.listCourses);
apiRouter.get("/courses/:slug", optionalAuth, courses.getCourse);
apiRouter.post("/courses/:slug/enroll", requireAuth, courses.enroll);
apiRouter.get("/courses/:slug/lessons/:lessonSlug", optionalAuth, courses.getLesson);
apiRouter.post("/lessons/:lessonId/complete", requireAuth, courses.completeLesson);

apiRouter.get("/labs", catalog.listLabs);
apiRouter.get("/labs/:slug", optionalAuth, catalog.getLab);
apiRouter.post("/labs/:slug/complete", requireAuth, catalog.completeLab);

apiRouter.get("/projects", catalog.listProjects);
apiRouter.get("/projects/:slug", catalog.getProject);

apiRouter.get("/resources", catalog.listResources);
apiRouter.get("/resources/:slug", catalog.getResource);

apiRouter.get("/catalog", catalog.catalogHome);
apiRouter.get("/learn/path", optionalAuth, learning.learnPath);

apiRouter.get("/quizzes/:quizId", requireAuth, learning.getQuiz);
apiRouter.post("/quizzes/:quizId/attempts", requireAuth, validate(quizSubmitSchema), learning.submitQuiz);

apiRouter.get("/progress/dashboard", requireAuth, learning.dashboard);
apiRouter.get("/certificates/:id", learning.getCertificate);
