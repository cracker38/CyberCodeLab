import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Markdown } from "../components/Markdown";
import { Seo } from "../components/Seo";
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
  };
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
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <Breadcrumbs items={[{ to: "/courses", label: "Courses" }, { to: `/courses/${course.slug}`, label: course.title }, { label: lesson.title }]} />
        <header className="mt-6 border-b border-line pb-6">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">{lesson.moduleTitle}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{lesson.title}</h1>
          <p className="mt-2 text-sm text-slate-500">About {lesson.durationMinutes} minutes</p>
        </header>
        {error && <p className="mt-4 text-sm text-amber-200" role="status">Showing saved lesson content. Refresh failed: {error}</p>}
        <div className="prose-lesson mt-8 space-y-3"><Markdown text={lesson.content} /></div>
        {lesson.codeExample && <pre className="mt-8 overflow-x-auto rounded-xl border border-line bg-ink-900 p-4 font-mono text-sm text-teal-100"><code>{lesson.codeExample}</code></pre>}
        {lesson.exercise && <section className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-5"><p className="font-mono text-[11px] uppercase tracking-widest text-accent">Try it yourself</p><p className="mt-2 text-sm leading-relaxed text-slate-300">{lesson.exercise}</p></section>}

        {data.quiz && user && <Link to={`/quizzes/${data.quiz.id}`} className="mt-6 inline-block text-sm text-accent">Lesson quiz: {data.quiz.title} →</Link>}
        {user && !lesson.completed && <div className="mt-8"><button className="btn-primary" disabled={busy} onClick={() => void completeLesson()}>{busy ? "Saving progress..." : "Mark lesson complete"}</button>{actionError && <p className="mt-3 text-sm text-red-300" role="alert">{actionError}</p>}</div>}
        {!user && <p className="mt-8 text-sm text-slate-400"><Link className="text-accent" to={`/signin?next=${encodeURIComponent(`/courses/${course.slug}/lessons/${lesson.slug}`)}`}>Sign in</Link> to save lesson progress.</p>}
        {lesson.completed && <p className="mt-6 text-sm text-accent" role="status">Lesson completed.</p>}
        {cert && <p className="mt-4 text-sm">Course complete. <Link className="text-accent" to={`/certificates/${cert}`}>View your certificate</Link></p>}

        <nav className="mt-12 flex justify-between gap-4 border-t border-line pt-6 text-sm" aria-label="Lesson navigation">
          {prev ? <Link to={`/courses/${course.slug}/lessons/${prev.slug}`} className="text-slate-400 hover:text-white">← {prev.title}</Link> : <span />}
          {next ? <Link to={`/courses/${course.slug}/lessons/${next.slug}`} className="text-slate-400 hover:text-white">{next.title} →</Link> : <span />}
        </nav>
      </article>
    </>
  );
}
