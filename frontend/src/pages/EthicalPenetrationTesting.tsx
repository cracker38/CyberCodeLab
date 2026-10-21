import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Seo } from "../components/Seo";
import { AsyncState, PageHeader, ProgressBar } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

type Level = "Beginner" | "Intermediate" | "Advanced";
type CoursePath = {
  course: {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    level: Level;
    category: string;
    estimatedHours: number;
  };
  modules: {
    id: string;
    title: string;
    description: string;
    progress: { completed: number; started: number; total: number; percent: number };
    lessons: { id: string; slug: string; title: string; durationMinutes: number; completed: boolean; started: boolean; position: number }[];
  }[];
  progress: { completed: number; started: number; total: number; percent: number };
  access: {
    available: boolean;
    reason: string | null;
    requirement: {
      courseSlug: string;
      courseTitle: string;
      lessonsCompleted: number;
      lessonsTotal: number;
      examQuizId: string | null;
      examTitle: string | null;
      passingScore: number | null;
      examAttempts: number;
      examPassed: boolean;
      latestExamScore: number | null;
    } | null;
  };
  levelExam?: { id: string; title: string; passingScore: number; attempts: number; passed: boolean; latestScore: number | null } | null;
  entryExam?: { id: string; title: string; passingScore: number; attempts: number; passed: boolean; latestScore: number | null } | null;
};

const PATHS: { level: Level; label: string; slug: string }[] = [
  { level: "Beginner", label: "Basic", slug: "ethical-penetration-testing-basic" },
  { level: "Intermediate", label: "Intermediate", slug: "ethical-penetration-testing-intermediate" },
  { level: "Advanced", label: "Advanced", slug: "ethical-penetration-testing-advanced" },
];

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

export function EthicalPenetrationTestingPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<CoursePath[]>([]);
  const [level, setLevel] = useState<Level | "All">("Beginner");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all(PATHS.map((path) => api<CoursePath>(`/api/courses/${path.slug}`)))
      .then((results) => {
        if (active) {
          setPaths(results);
          setError("");
        }
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visiblePaths = useMemo(
    () => level === "All" ? paths : paths.filter((path) => path.course.level === level),
    [level, paths],
  );

  return (
    <>
      <Seo
        title="Ethical Penetration Testing Path"
        description="Progress from basic foundations to advanced security assessment through authorized, contained labs and professional practice."
        path="/paths/ethical-penetration-testing"
      />
      <div className="page-wrap py-10 sm:py-12">
        <Breadcrumbs items={[{ to: "/courses", label: "Courses" }, { label: "Ethical Penetration Testing" }]} />
        <PageHeader kicker="Authorized security testing · Learning path" title="Ethical Penetration Testing">
          <p>
            Move from the basics through intermediate assessment skills to advanced professional practice. Every exercise
            uses synthetic evidence, a local training environment, or a system covered by explicit written authorization.
          </p>
        </PageHeader>

        <div className="mt-7 overflow-x-auto pb-1" role="group" aria-label="Filter penetration testing modules by level">
          <div className="flex w-max min-w-full gap-2">
            {[{ value: "All", label: "All" }, ...PATHS.map((path) => ({ value: path.level, label: path.label }))].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={level === option.value}
                onClick={() => setLevel(option.value as Level | "All")}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${level === option.value ? "border-accent bg-accent text-ink-950" : "border-line bg-ink-900/70 text-slate-300 hover:border-accent/50 hover:text-white"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <AsyncState loading={loading} error={error} hasItems={visiblePaths.length > 0} empty="No learning paths are available yet">
          <div className="mt-7 space-y-10">
            {visiblePaths.map((path) => (
              <section key={path.course.slug} aria-labelledby={`path-${path.course.level.toLowerCase()}`}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                      {path.course.level === "Beginner" ? "Basic · Beginner" : path.course.level} · {path.course.estimatedHours} hours
                    </p>
                    <h2 id={`path-${path.course.level.toLowerCase()}`} className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                      {path.course.title}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-400">{path.course.subtitle}</p>
                    <p className={`mt-2 text-xs font-medium ${path.access.available ? "text-accent" : "text-amber-200"}`}>
                      {path.access.available ? "Available to study" : "Locked until the level requirement is met"}
                      {path.progress.total > 0 && ` · ${path.progress.completed} of ${path.progress.total} lessons complete`}
                    </p>
                  </div>
                  <Link to={`/courses/${path.course.slug}`} className="shrink-0 text-sm font-medium text-accent hover:text-teal-200">
                    Course overview <span aria-hidden="true">→</span>
                  </Link>
                </div>

                {path.entryExam && (
                  <div className="surface mb-4 flex flex-wrap items-center justify-between gap-4 border border-accent/15 p-4 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Required before the Basic introduction</p>
                      <h3 className="mt-1 font-semibold text-white">{path.entryExam.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">10 questions · {path.entryExam.passingScore}% target · Retakes allowed</p>
                      <p className="mt-1 text-xs text-slate-500">A failed readiness check still opens Basic lessons for study.</p>
                      {path.entryExam.attempts > 0 && (
                        <p className="mt-2 text-xs text-slate-300">
                          {path.entryExam.passed ? "Readiness passed" : "Basic study recommended"} · latest score {path.entryExam.latestScore ?? 0}%
                        </p>
                      )}
                    </div>
                    <Link
                      to={user ? "/quizzes/" + path.entryExam.id : "/signin?next=" + encodeURIComponent("/quizzes/" + path.entryExam.id)}
                      className="btn-primary shrink-0"
                    >
                      {user ? (path.entryExam.attempts > 0 ? "Retake readiness check" : "Start readiness check") : "Sign in to begin"}
                    </Link>
                  </div>
                )}

                {path.levelExam && path.course.level !== "Beginner" && (
                  <div className="surface mb-4 flex flex-wrap items-center justify-between gap-4 border border-accent/15 p-4 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                        {path.course.level === "Advanced" ? "Final professional exam" : "Level progression exam"}
                      </p>
                      <h3 className="mt-1 font-semibold text-white">{path.levelExam.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">10 questions · {path.levelExam.passingScore}% required · Retakes allowed</p>
                      {path.levelExam.attempts > 0 && (
                        <p className="mt-2 text-xs text-slate-300">
                          {path.levelExam.passed ? "Passed" : "Retake available"} · latest score {path.levelExam.latestScore ?? 0}%
                        </p>
                      )}
                    </div>
                    {path.access.available ? (
                      path.progress.percent >= 100 ? (
                      <Link
                        to={user ? "/quizzes/" + path.levelExam.id : "/signin?next=" + encodeURIComponent("/quizzes/" + path.levelExam.id)}
                        className="btn-primary shrink-0"
                      >
                        {user ? (path.levelExam.attempts > 0 ? "Retake exam" : "Take exam") : "Sign in to take exam"}
                      </Link>
                      ) : (
                        <button type="button" className="btn-ghost shrink-0" disabled>Complete all lessons first</button>
                      )
                    ) : (
                      <Link
                        to={path.access.requirement?.examQuizId && !path.access.requirement.examPassed
                          ? user
                            ? "/quizzes/" + path.access.requirement.examQuizId
                            : "/signin?next=" + encodeURIComponent("/quizzes/" + path.access.requirement.examQuizId)
                          : "/courses/" + (path.access.requirement?.courseSlug ?? path.course.slug)}
                        className="btn-ghost shrink-0"
                      >
                        {path.access.requirement?.examQuizId && !path.access.requirement.examPassed
                          ? user ? "Take prerequisite exam" : "Sign in for prerequisite exam"
                          : "Review prerequisite"}
                      </Link>
                    )}
                  </div>
                )}

                {!path.access.available && path.access.reason && (
                  <div className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-slate-300" role="status">
                    <p className="font-medium text-amber-200">Level access requirement</p>
                    <p className="mt-1 leading-relaxed">{path.access.reason}</p>
                    {path.course.level !== "Beginner" && path.access.requirement && (
                      <Link to={"/courses/" + path.access.requirement.courseSlug} className="mt-3 inline-block text-sm font-medium text-accent">
                        Open {path.access.requirement.courseTitle} <span aria-hidden="true">→</span>
                      </Link>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {path.modules.map((module, moduleIndex) => {
                    const duration = module.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
                    return (
                      <details
                        key={module.id}
                        className="surface group overflow-hidden"
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent [&::-webkit-details-marker]:hidden sm:gap-4 sm:p-5">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/15 bg-accent/10 text-accent" aria-hidden="true">
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 4.75h11.25A2.25 2.25 0 0 1 19 7v12.25H7.75A2.25 2.25 0 0 1 5.5 17V4.75Zm0 0A2.25 2.25 0 0 0 3.25 7v10A2.25 2.25 0 0 0 5.5 19.25H19M8.5 8h7m-7 3h7" />
                            </svg>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Module {String(moduleIndex + 1).padStart(2, "0")}</span>
                            <span className="mt-0.5 block text-base font-semibold text-white sm:text-lg">{module.title}</span>
                            <span className="mt-1 block text-sm leading-snug text-slate-400">{module.description}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-medium tabular-nums text-slate-300">{formatDuration(duration)}</span>
                            <span className="mt-1 hidden text-xs text-slate-500 sm:block">{module.lessons.length} lessons</span>
                          </span>
                          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                          </svg>
                        </summary>

                        <div className="border-t border-line px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                            <span>{module.progress.completed} of {module.progress.total} lessons complete</span>
                            <span className="tabular-nums sm:hidden">{module.lessons.length} lessons</span>
                          </div>
                          <div className="mt-3"><ProgressBar percent={module.progress.percent} label={`${module.progress.percent}% module progress`} /></div>
                          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                            {module.lessons.map((lesson) => (
                              <li key={lesson.id}>
                                <Link
                                  to={`/courses/${path.course.slug}/lessons/${lesson.slug}`}
                                  className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/[0.025] sm:gap-4 sm:px-4"
                                  aria-disabled={!path.access.available}
                                  tabIndex={path.access.available ? 0 : -1}
                                  title={!path.access.available ? (path.access.reason ?? "Level locked") : undefined}
                                  style={{ opacity: path.access.available ? 1 : 0.55 }}
                                  onClick={(event) => { if (!path.access.available) event.preventDefault(); }}
                                >
                                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums ${lesson.completed ? "border-accent/30 bg-accent/10 text-accent" : lesson.started ? "border-amber-300/30 bg-amber-300/10 text-amber-200" : "border-line bg-ink-900 text-slate-500"}`} aria-hidden="true">
                                    {lesson.completed ? "✓" : String(lesson.position).padStart(2, "0")}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block font-medium text-white transition-colors group-hover:text-accent">{lesson.title}</span>
                                    <span className="mt-1 block text-xs text-slate-500">{lesson.durationMinutes} min read</span>
                                  </span>
                                  <span className={`shrink-0 text-right text-xs ${lesson.completed ? "text-accent" : lesson.started ? "text-amber-200" : "text-slate-500"}`}>
                                    {lesson.completed ? "Completed" : lesson.started ? "In progress" : "Not started"}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    );
                  })}
                </div>

                {path.course.level === "Beginner" && path.levelExam && path.access.available && (
                  <div className="surface mt-4 flex flex-wrap items-center justify-between gap-4 border border-accent/15 p-4 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Basic progression exam</p>
                      <h3 className="mt-1 font-semibold text-white">{path.levelExam.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">Complete all Basic lessons, then score {path.levelExam.passingScore}% to unlock Intermediate.</p>
                      {path.levelExam.attempts > 0 && (
                        <p className="mt-2 text-xs text-slate-300">
                          {path.levelExam.passed ? "Passed" : "Retake available"} · latest score {path.levelExam.latestScore ?? 0}%
                        </p>
                      )}
                    </div>
                    {path.progress.percent >= 100 ? (
                      <Link
                        to={user ? "/quizzes/" + path.levelExam.id : "/signin?next=" + encodeURIComponent("/quizzes/" + path.levelExam.id)}
                        className="btn-primary shrink-0"
                      >
                        {user ? (path.levelExam.attempts > 0 ? "Retake level exam" : "Start level exam") : "Sign in to take exam"}
                      </Link>
                    ) : (
                      <button type="button" className="btn-ghost shrink-0" disabled>Complete all lessons first</button>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        </AsyncState>
      </div>
    </>
  );
}
