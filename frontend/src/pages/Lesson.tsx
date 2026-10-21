import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Markdown } from "../components/Markdown";
import { Seo } from "../components/Seo";
import { ProgressBar } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { ApiError, api } from "../services/api";

type LessonPayload = {
  course: { slug: string; title: string };
  lesson: {
    id: string;
    slug: string;
    title: string;
    content: string;
    codeExample?: string | null;
    exercise?: string | null;
    videoUrl?: string | null;
    moduleTitle: string;
    durationMinutes: number;
    completed: boolean;
    started: boolean;
  };
  courseProgress: { completed: number; started: number; total: number; percent: number; position: number };
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  quiz?: { id: string; title: string } | null;
};

export function LessonPage() {
  const { slug, lessonSlug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<LessonPayload | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [cert, setCert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await api<LessonPayload>(`/api/courses/${slug}/lessons/${lessonSlug}`);
      setData(payload);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This lesson could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [slug, lessonSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user || !data || data.lesson.started || data.lesson.completed) return;
    const lessonId = data.lesson.id;
    let active = true;
    api<{ ok: boolean; started: boolean }>(`/api/lessons/${lessonId}/start`, { method: "POST" })
      .then(() => {
        if (!active) return;
        setData((current) => {
          if (!current || current.lesson.id !== lessonId) return current;
          const alreadyTracked = current.lesson.started || current.lesson.completed;
          return {
            ...current,
            lesson: { ...current.lesson, started: true },
            courseProgress: {
              ...current.courseProgress,
              started: current.courseProgress.started + (alreadyTracked ? 0 : 1),
            },
          };
        });
      })
      .catch((err) => {
        if (active) setActionError(err instanceof ApiError ? err.message : "Could not save lesson progress.");
      });
    return () => { active = false; };
  }, [user?.id, data?.lesson.id, data?.lesson.started, data?.lesson.completed]);

  if (!data && loading) return <p className="mx-auto max-w-3xl px-4 py-16 text-slate-400" role="status">Loading lesson...</p>;
  if (!data) return <div className="mx-auto max-w-3xl px-4 py-16"><p className="text-red-300" role="alert">{error || "Lesson not found."}</p><Link className="mt-4 inline-block text-sm text-accent" to="/courses">Back to courses</Link></div>;

  const { lesson, course, prev, next } = data;
  const completeLesson = async () => {
    setBusy(true);
    setActionError("");
    try {
      const result = await api<{ certificateId?: string | null }>(`/api/lessons/${lesson.id}/complete`, { method: "POST" });
      if (result.certificateId) setCert(result.certificateId);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not save lesson progress.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title={lesson.title} description={course.title} path={`/courses/${course.slug}/lessons/${lesson.slug}`} />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        <Breadcrumbs items={[{ to: "/courses", label: "Courses" }, { to: `/courses/${course.slug}`, label: course.title }, { label: lesson.title }]} />
        <section className="surface mt-6 p-5 sm:p-6" aria-label="Course progress">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Lesson {data.courseProgress.position} of {data.courseProgress.total}</p>
              <p className="mt-1 text-sm text-slate-400">{data.courseProgress.completed} of {data.courseProgress.total} lessons completed</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-white">{data.courseProgress.percent}%</p>
          </div>
          <div className="mt-3"><ProgressBar percent={data.courseProgress.percent} label={`${course.title} progress`} /></div>
          {user && <p className="mt-3 text-xs text-slate-500">
            {lesson.completed ? "This lesson is complete." : lesson.started ? "This lesson is in progress. Your course progress is saved." : "Open lesson. Progress will be saved as soon as you begin."}
          </p>}
        </section>
        <header className="mt-8 border-b border-line pb-6">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">{lesson.moduleTitle}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{lesson.title}</h1>
          <p className="mt-3 text-sm text-slate-400">Estimated reading time: {lesson.durationMinutes} minutes</p>
        </header>
        {error && <p className="mt-4 text-sm text-amber-200" role="status">Showing saved lesson content. Refresh failed: {error}</p>}
        <section className="mt-8" aria-label="Lesson content">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-slate-500">Lesson notes</p>
          <div className="prose-lesson space-y-3"><Markdown text={lesson.content} /></div>
        </section>
        {lesson.codeExample && <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-white">Worked example</h2>
          <pre className="overflow-x-auto rounded-xl border border-line bg-ink-900 p-4 font-mono text-sm leading-relaxed text-teal-100"><code>{lesson.codeExample}</code></pre>
        </section>}
        {lesson.exercise && <section className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-5" aria-label="Lesson practice">
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Practice task</p>
          <h2 className="mt-1 font-semibold text-white">Put the idea to work</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{lesson.exercise}</p>
        </section>}

        {data.quiz && user && <section className="mt-8 rounded-xl border border-line bg-white/[0.02] p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">Knowledge check</p>
          <h2 className="mt-1 font-semibold text-white">{data.quiz.title}</h2>
          <Link to={`/quizzes/${data.quiz.id}`} className="mt-3 inline-flex text-sm text-accent hover:text-teal-200">Take the quiz <span aria-hidden="true" className="ml-2">→</span></Link>
        </section>}
        {user && <section className="mt-8 border-t border-line pt-6">
          {lesson.completed ? <p className="text-sm font-medium text-accent" role="status">Lesson completed. Your progress is saved.</p> : <button className="btn-primary" disabled={busy} onClick={() => void completeLesson()}>{busy ? "Saving progress..." : "Mark lesson complete"}</button>}
          {actionError && <p className="mt-3 text-sm text-red-300" role="alert">{actionError}</p>}
          {cert && <p className="mt-4 text-sm text-slate-300" role="status">You completed the course. <Link className="text-accent" to={`/certificates/${cert}`}>View your certificate</Link></p>}
        </section>}
        {!user && <p className="mt-8 rounded-xl border border-line bg-white/[0.02] p-4 text-sm text-slate-400"><Link className="text-accent" to={`/signin?next=${encodeURIComponent(`/courses/${course.slug}/lessons/${lesson.slug}`)}`}>Sign in</Link> to save lesson and course progress.</p>}

        <nav className="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2" aria-label="Lesson navigation">
          {prev ? <Link to={`/courses/${course.slug}/lessons/${prev.slug}`} className="surface p-4 text-sm transition hover:border-accent/35"><span className="block text-xs text-slate-500">Previous lesson</span><span className="mt-1 block font-medium text-slate-200">← {prev.title}</span></Link> : <span />}
          {next ? <Link to={`/courses/${course.slug}/lessons/${next.slug}`} className="surface p-4 text-right text-sm transition hover:border-accent/35"><span className="block text-xs text-slate-500">Next lesson</span><span className="mt-1 block font-medium text-slate-200">{next.title} →</span></Link> : <Link to={`/courses/${course.slug}`} className="surface p-4 text-right text-sm transition hover:border-accent/35"><span className="block text-xs text-slate-500">Course overview</span><span className="mt-1 block font-medium text-slate-200">View course outline →</span></Link>}
        </nav>
      </article>
    </>
  );
}
