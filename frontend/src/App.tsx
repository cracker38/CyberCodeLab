import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./layouts/SiteLayout";
import { AboutPage } from "./pages/About";
import { AdminPage } from "./pages/Admin";
import { ForgotPage, RegisterPage, ResetPage, SignInPage, VerifyEmailPage } from "./pages/Auth";
import { CertificatePage } from "./pages/Certificate";
import { CourseDetailPage } from "./pages/CourseDetail";
import { CoursesPage } from "./pages/Courses";
import { DashboardPage } from "./pages/Dashboard";
import { HomePage } from "./pages/Home";
import { LabDetailPage } from "./pages/LabDetail";
import { LabsPage } from "./pages/Labs";
import { LearnPage } from "./pages/Learn";
import { LessonPage } from "./pages/Lesson";
import { NotFoundPage } from "./pages/NotFound";
import { ProjectDetailPage } from "./pages/ProjectDetail";
import { ProjectsPage } from "./pages/Projects";
import { QuizPage } from "./pages/Quiz";
import { ResourceDetailPage } from "./pages/ResourceDetail";
import { ResourcesPage } from "./pages/Resources";
import { YouTubePage } from "./pages/YouTube";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/courses/:slug/lessons/:lessonSlug" element={<LessonPage />} />
        <Route path="/labs" element={<LabsPage />} />
        <Route path="/labs/:slug" element={<LabDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/resources/:slug" element={<ResourceDetailPage />} />
        <Route path="/youtube" element={<YouTubePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPage />} />
        <Route path="/reset-password" element={<ResetPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/quizzes/:quizId" element={<QuizPage />} />
        <Route path="/certificates/:id" element={<CertificatePage />} />
        <Route path="/verify/:id" element={<CertificatePage />} />
        <Route path="/get-started" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
