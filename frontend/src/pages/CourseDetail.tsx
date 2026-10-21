import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Seo } from "../components/Seo";
import { Badge, Notice, ProgressBar } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { Course } from "../types";

type Payload = {
  course: Course;
  modules: {
    id: string;
    title: string;
    description: string;
    progress: { completed: number; started: number; total: number; percent: number };
    lessons: { id: string; slug: string; title: string; durationMinutes: number; completed: boolean; started: boolean; position: number }[];
  }[];
  enrolled: boolean;
  progress: { completed: number; started: number; total: number; percent: number };
  continueLesson: { slug: string; title: string } | null;
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
  nextCourseAccess: { available: boolean; reason: string | null } | null;
  quiz?: { id: string; title: string; passingScore: number } | null;
  levelExam?: { id: string; title: string; passingScore: number; attempts: number; passed: boolean; latestScore: number | null } | null;
  entryExam?: { id: string; title: string; passingScore: number; attempts: number; passed: boolean; latestScore: number | null } | null;
  relatedLabs: { slug: string; title: string; difficulty: string }[];
  relatedProjects: { slug: string; title: string; difficulty: string }[];
};

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

export function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<Payload>(`/api/courses/${slug}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-16 text-red-300">{error}</p>;
  if (!data) return <p className="mx-auto max-w-3xl px-4 py-16 text-slate-400">Loading course…</p>;
  const { course, modules, progress, quiz, entryExam, levelExam, continueLesson, access } = data;
  const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
  const relatedLabs = data.relatedLabs ?? [];
  const relatedProjects = data.relatedProjects ?? [];
  const first = continueLesson ?? modules.flatMap((m) => m.lessons)[0];

  const goLearn = async () => {
    if (!access.available) return;
    if (!user) {
      navigate(`/signin?next=${encodeURIComponent(`/courses/${course.slug}`)}`);
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      await api(`/api/courses/${course.slug}/enroll`, { method: "POST" });
      if (first) navigate(`/courses/${course.slug}/lessons/${first.slug}`);
      else load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not enroll in this course.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title={course.title} description={course.description} path={`/courses/${course.slug}`} />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Breadcrumbs items={[{ to: "/courses", label: "Courses" }, { label: course.title }]} />
        <p className="font-mono text-xs uppercase tracking-widest text-accent">{course.category}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{course.title}</h1>
        {course.subtitle && <p className="mt-3 text-lg text-slate-300">{course.subtitle}</p>}
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">{course.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{course.level}</Badge>
          <Badge>{`${course.estimatedHours} hours`}</Badge>
          <Badge>{`${modules.length} modules`}</Badge>
          <Badge>{`${lessonCount} lessons`}</Badge>
        </div>

        {entryExam && (
          <section className="surface mt-8 border border-accent/20 p-5 sm:p-6" aria-labelledby="entry-exam-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Required before the Basic introduction</p>
                <h2 id="entry-exam-title" className="mt-1 text-xl font-semibold text-white">{entryExam.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Complete this short readiness check before opening the first lesson. Passing confirms readiness; if you do not pass, Basic lessons still open so you can study and retake it.
                </p>
                <p className="mt-3 text-xs text-slate-400">10 questions · {entryExam.passingScore}% target · Retakes allowed · Passing does not skip Basic lessons</p>
                {entryExam.attempts > 0 && (
                  <p className="mt-3 text-sm" role="status">
                    {entryExam.passed ? <span className="text-accent">Readiness pass on record · </span> : <span className="text-amber-200">Basic study recommended · </span>}
                    <span className="text-slate-300">Latest score: {entryExam.latestScore ?? 0}%</span>
                  </p>
                )}
              </div>
              <Link
                to={user ? "/quizzes/" + entryExam.id : "/signin?next=" + encodeURIComponent("/quizzes/" + entryExam.id)}
                className="btn-primary shrink-0"
              >
                {user ? (entryExam.attempts > 0 ? "Retake readiness check" : "Start readiness check") : "Sign in to begin"}
              </Link>
            </div>
          </section>
        )}

        {levelExam && access.available && (
          <section className="surface mt-8 border border-accent/20 p-5 sm:p-6" aria-labelledby="level-exam-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
                  {course.level === "Beginner" ? "Basic progression exam" : course.level === "Advanced" ? "Final professional exam" : "Intermediate progression exam"}
                </p>
                <h2 id="level-exam-title" className="mt-1 text-xl font-semibold text-white">{levelExam.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  {course.level === "Advanced"
                    ? "This 10-question final assessment validates advanced professional practice. Review the explanations after each attempt and retake it whenever you are ready."
                    : "Complete every lesson in this category, then pass this assessment with the required score to unlock the next level. If you need another attempt, this course stays available for review."}
                </p>
                <p className="mt-3 text-xs text-slate-400">10 questions · {levelExam.passingScore}% required · Retakes are allowed</p>
                {levelExam.attempts > 0 && (
                  <p className="mt-3 text-sm" role="status">
                    {levelExam.passed ? <span className="text-accent">Passing attempt on record · </span> : <span className="text-amber-200">Not passed yet · </span>}
                    <span className="text-slate-300">Latest score: {levelExam.latestScore ?? 0}%</span>
                    {levelExam.passed && <span className="text-slate-400"> · Your pass is recorded</span>}
                  </p>
                )}
              </div>
              {progress.percent >= 100 ? (
                user ? (
                  <Link to={"/quizzes/" + levelExam.id} className="btn-primary shrink-0">
                    {levelExam.attempts > 0 ? "Retake level exam" : "Start level exam"}
                  </Link>
                ) : (
                  <Link to={"/signin?next=" + encodeURIComponent("/quizzes/" + levelExam.id)} className="btn-primary shrink-0">Sign in to take exam</Link>
                )
              ) : (
                <button type="button" className="btn-ghost shrink-0" disabled>
                  Complete all lessons first
                </button>
              )}
            </div>
          </section>
        )}

        {!access.available && (
          <section className="surface mt-5 border border-amber-300/20 p-5" aria-label="Level access requirements">
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber-200">Level locked</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{access.reason}</p>
            {access.requirement?.examQuizId && user && (!access.requirement.examPassed || course.level === "Beginner") && (
              <Link to={"/quizzes/" + access.requirement.examQuizId} className="mt-4 inline-flex text-sm font-medium text-accent hover:text-teal-200">
                {access.requirement.examAttempts > 0 ? "Retake " : "Take "}{access.requirement.courseTitle} exam <span className="ml-1" aria-hidden="true">→</span>
              </Link>
            )}
            {access.requirement && access.requirement.courseSlug !== course.slug && (
              <Link to={"/courses/" + access.requirement.courseSlug} className="mt-4 ml-4 inline-flex text-sm font-medium text-accent hover:text-teal-200">
                Review prerequisite lessons <span className="ml-1" aria-hidden="true">→</span>
              </Link>
            )}
          </section>
        )}

        <section className="surface mt-8 p-5 sm:p-6" aria-label="Course progress">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400">Course progress</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{progress.percent}%</p>
            </div>
            <p className="text-right text-sm text-slate-400">
              <span className="block font-medium text-white">{progress.completed} of {progress.total} lessons complete</span>
              {progress.started > 0 && <span className="mt-1 block">{progress.started} in progress</span>}
            </p>
          </div>
          <div className="mt-4"><ProgressBar percent={progress.percent} label="Completed lessons" /></div>
          {access.available ? (
            <button className="btn-primary mt-5" disabled={busy} onClick={() => void goLearn()}>
              {busy ? "Opening course..." : data.enrolled ? (progress.percent >= 100 ? "Review course" : "Continue learning") : "Enroll & start"}
            </button>
          ) : (
            <p className="mt-5 text-sm text-amber-200">Complete the level requirement above to open lessons.</p>
          )}
          {actionError && <p className="mt-3 text-sm text-red-300" role="alert">{actionError}</p>}
        </section>

        {course.prerequisites.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold">Prerequisites</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-400">
              {course.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {course.learningObjectives.length > 0 && <section className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Course outcomes</p>
          <h2 className="mt-1 text-xl font-semibold text-white">What you will learn</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {course.learningObjectives.map((p) => (
              <li key={p} className="surface flex items-start gap-3 p-4 text-sm leading-relaxed text-slate-300">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/10 text-xs text-accent" aria-hidden="true">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </section>}

        <section className="mt-12" aria-label="Course curriculum">
          <div className="mb-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Course curriculum</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Lessons and modules</h2>
            <p className="mt-2 text-sm text-slate-400">Work through the lessons in order. Your progress is saved as you start and complete each lesson.</p>
          </div>
          <div className="space-y-3">
            {modules.map((m, moduleIndex) => {
              const duration = m.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
              return (
            <details key={m.id} className="surface group overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent [&::-webkit-details-marker]:hidden sm:gap-4 sm:p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/15 bg-accent/10 text-accent" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 4.75h11.25A2.25 2.25 0 0 1 19 7v12.25H7.75A2.25 2.25 0 0 1 5.5 17V4.75Zm0 0A2.25 2.25 0 0 0 3.25 7v10A2.25 2.25 0 0 0 5.5 19.25H19M8.5 8h7m-7 3h7" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Module {String(moduleIndex + 1).padStart(2, "0")}</span>
                      <span className="mt-0.5 block text-base font-semibold text-white sm:text-lg">{m.title}</span>
                      {m.description && <span className="mt-1 block text-sm leading-snug text-slate-400">{m.description}</span>}
                    </span>
                <span className="shrink-0 text-right">
                      <span className="block text-sm font-medium tabular-nums text-slate-300">{formatDuration(duration)}</span>
                  <span className="mt-1 hidden text-xs text-slate-500 sm:block">{m.lessons.length} lessons</span>
                    </span>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="border-t border-line px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span>{m.progress.completed} of {m.progress.total} lessons complete</span>
                  <span className="tabular-nums sm:hidden">{m.lessons.length} lessons</span>
                    </div>
                    <div className="mt-3"><ProgressBar percent={m.progress.percent} label={`${m.progress.percent}% module progress`} /></div>
                    <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                      {m.lessons.map((l) => (
                        <li key={l.id}>
                          <Link
                            to={`/courses/${course.slug}/lessons/${l.slug}`}
                            className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/[0.025] sm:gap-4 sm:px-4"
                            aria-disabled={!access.available}
                            tabIndex={access.available ? 0 : -1}
                            title={!access.available ? (access.reason ?? "Level locked") : undefined}
                            style={{ opacity: access.available ? 1 : 0.55 }}
                            onClick={(event) => { if (!access.available) event.preventDefault(); }}
                          >
                            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums ${l.completed ? "border-accent/30 bg-accent/10 text-accent" : l.started ? "border-amber-300/30 bg-amber-300/10 text-amber-200" : "border-line bg-ink-900 text-slate-500"}`} aria-hidden="true">
                              {l.completed ? "✓" : String(l.position).padStart(2, "0")}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block font-medium transition-colors group-hover:text-accent ${l.completed ? "text-slate-300" : "text-white"}`}>{l.title}</span>
                              <span className="mt-1 block text-xs text-slate-500">{l.durationMinutes} min read</span>
                            </span>
                            <span className={`shrink-0 text-right text-xs ${l.completed ? "text-accent" : l.started ? "text-amber-200" : "text-slate-500"}`}>
                              {l.completed ? "Completed" : l.started ? "In progress" : "Not started"}
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
        </section>

        {quiz && user && access.available && (
          <Link to={`/quizzes/${quiz.id}`} className="mt-8 inline-block text-accent">
            Course quiz: {quiz.title} →
          </Link>
        )}
        {quiz && !user && access.available && (
          <p className="mt-8 text-sm text-slate-400">
            <Link to="/signin" className="text-accent">
              Sign in
            </Link>{" "}
            to take the course quiz and save your score.
          </p>
        )}

        {(relatedLabs.length > 0 || relatedProjects.length > 0) && (
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {relatedLabs.length > 0 && (
              <div>
                <h2 className="font-semibold">Practice next</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {relatedLabs.map((l) => (
                    <li key={l.slug}>
                      <Link className="text-accent" to={`/labs/${l.slug}`}>
                        {l.title}
                      </Link>{" "}
                      <span className="text-slate-500">({l.difficulty})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatedProjects.length > 0 && (
              <div>
                <h2 className="font-semibold">Build next</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {relatedProjects.map((p) => (
                    <li key={p.slug}>
                      <Link className="text-accent" to={`/projects/${p.slug}`}>
                        {p.title}
                      </Link>{" "}
                      <span className="text-slate-500">({p.difficulty})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {progress.percent >= 100 && course.nextCourseSlug && data.nextCourseAccess?.available && (
          <div className="mt-10">
            <Notice>
              {course.category === "Ethical Penetration Testing"
                ? "You finished this course and passed its level exam. The next category is now available."
                : "You finished this course. Your recommended next course is available below."}
            </Notice>
            <Link to={`/courses/${course.nextCourseSlug}`} className="mt-3 inline-block text-sm text-accent">
              Next course →
            </Link>
          </div>
        )}
        {progress.percent >= 100 && course.nextCourseSlug && !data.nextCourseAccess?.available && (
          <div className="mt-10">
            <Notice>{data.nextCourseAccess?.reason ?? "Pass the level exam to unlock the next category."}</Notice>
            {levelExam && user && !levelExam.passed && (
              <Link to={"/quizzes/" + levelExam.id} className="mt-3 inline-block text-sm text-accent">
                {levelExam.attempts > 0 ? "Retake level exam" : "Take level exam"} →
              </Link>
            )}
            <Link to={`/courses/${course.nextCourseSlug}`} className="mt-3 ml-4 inline-block text-sm text-slate-400 hover:text-white">
              View next category overview →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
