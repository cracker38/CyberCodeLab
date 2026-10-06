import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
    lessons: { id: string; slug: string; title: string; durationMinutes: number; completed: boolean }[];
  }[];
  enrolled: boolean;
  progress: { completed: number; total: number; percent: number };
  continueLesson: { slug: string; title: string } | null;
  quiz?: { id: string; title: string } | null;
};

export function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
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
  const first = continueLesson ?? modules.flatMap((m) => m.lessons)[0];

  const goLearn = async () => {
    if (!user) {
      navigate("/signin");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/courses/${course.slug}/enroll`, { method: "POST" });
      if (first) navigate(`/courses/${course.slug}/lessons/${first.slug}`);
      else load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title={course.title} description={course.description} path={`/courses/${course.slug}`} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">{course.category}</p>
        <h1 className="mt-2 text-3xl font-semibold">{course.title}</h1>
        <p className="mt-3 text-slate-400">{course.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{course.level}</Badge>
          <Badge>{course.estimatedHours} hours</Badge>
        </div>

        <div className="surface mt-8 p-5">
          <ProgressBar percent={progress.percent} label={`Progress: ${progress.percent}%`} />
          <p className="mt-2 font-mono text-xs text-slate-500">
            {"█".repeat(Math.round(progress.percent / 5))}
            {"░".repeat(20 - Math.round(progress.percent / 5))}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {progress.completed} / {progress.total} lessons completed
          </p>
          <button className="btn-primary mt-4" disabled={busy} onClick={() => void goLearn()}>
            {data.enrolled ? (progress.percent >= 100 ? "Review course" : "Continue learning") : "Enroll & start"}
          </button>
        </div>

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

        <div className="mt-8">
          <h2 className="font-semibold">Learning objectives</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-400">
            {course.learningObjectives.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="mt-10 space-y-6">
          {modules.map((m) => (
            <section key={m.id}>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="text-sm text-slate-500">{m.description}</p>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      to={`/courses/${course.slug}/lessons/${l.slug}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-ink-800"
                    >
                      <span className={l.completed ? "text-accent" : ""}>
                        {l.completed ? "✓ " : ""}
                        {l.title}
                      </span>
                      <span className="font-mono text-xs text-slate-500">{l.durationMinutes}m</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {quiz && user && (
          <Link to={`/quizzes/${quiz.id}`} className="mt-8 inline-block text-accent">
            Course quiz: {quiz.title} →
          </Link>
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
