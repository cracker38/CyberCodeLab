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
  quiz?: { id: string; title: string } | null;
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
  const { course, modules, progress, quiz, continueLesson } = data;
  const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
  const relatedLabs = data.relatedLabs ?? [];
  const relatedProjects = data.relatedProjects ?? [];
  const first = continueLesson ?? modules.flatMap((m) => m.lessons)[0];

  const goLearn = async () => {
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
          <button className="btn-primary mt-5" disabled={busy} onClick={() => void goLearn()}>
            {busy ? "Opening course..." : data.enrolled ? (progress.percent >= 100 ? "Review course" : "Continue learning") : "Enroll & start"}
          </button>
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
          <div className="space-y-5">
          {modules.map((m, moduleIndex) => (
            <section key={m.id} className="surface overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Module {String(moduleIndex + 1).padStart(2, "0")}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{m.title}</h3>
                    {m.description && <p className="mt-1 max-w-2xl text-sm text-slate-400">{m.description}</p>}
                  </div>
                  <p className="text-sm tabular-nums text-slate-400">{m.progress.completed}/{m.progress.total} complete</p>
                </div>
                <div className="mt-4"><ProgressBar percent={m.progress.percent} label={`${m.progress.percent}% module progress`} /></div>
              </div>
              <ul className="divide-y divide-line border-t border-line">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      to={`/courses/${course.slug}/lessons/${l.slug}`}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025] sm:px-6"
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums ${l.completed ? "border-accent/30 bg-accent/10 text-accent" : l.started ? "border-amber-300/30 bg-amber-300/10 text-amber-200" : "border-line bg-ink-900 text-slate-500"}`} aria-hidden="true">
                        {l.completed ? "✓" : String(l.position).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block font-medium transition-colors group-hover:text-accent ${l.completed ? "text-slate-300" : "text-white"}`}>{l.title}</span>
                        <span className="mt-1 block text-xs text-slate-500">{l.durationMinutes} min read</span>
                      </span>
                      <span className={`shrink-0 text-xs ${l.completed ? "text-accent" : l.started ? "text-amber-200" : "text-slate-500"}`}>
                        {l.completed ? "Completed" : l.started ? "In progress" : "Not started"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          </div>
        </section>

        {quiz && user && (
          <Link to={`/quizzes/${quiz.id}`} className="mt-8 inline-block text-accent">
            Course quiz: {quiz.title} →
          </Link>
        )}
        {quiz && !user && (
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

        {progress.percent >= 100 && course.nextCourseSlug && (
          <div className="mt-10">
            <Notice>You finished this course. Recommended next is waiting below.</Notice>
            <Link to={`/courses/${course.nextCourseSlug}`} className="mt-3 inline-block text-sm text-accent">
              Next course →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
