import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  quiz?: { id: string; title: string };
};

export function CourseDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    api<Payload>(`/api/courses/${slug}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [slug]);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-16 text-red-300">{error}</p>;
  if (!data) return <p className="mx-auto max-w-3xl px-4 py-16 text-slate-400">Loading course…</p>;
  const { course, modules, progress, quiz } = data;

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

        <div className="mt-8 rounded-xl border border-line bg-ink-900 p-5">
          <ProgressBar percent={progress.percent} label={`Progress: ${progress.percent}%`} />
          <p className="mt-2 text-sm text-slate-400">
            {progress.completed} / {progress.total} lessons completed
          </p>
          {user ? (
            <button
              className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950"
              onClick={async () => {
                await api(`/api/courses/${course.slug}/enroll`, { method: "POST" });
                load();
              }}
            >
              {data.enrolled ? "Continue learning" : "Enroll"}
            </button>
          ) : (
            <Link to="/signin" className="mt-4 inline-block text-sm text-accent">
              Sign in to enroll
            </Link>
          )}
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
              <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      to={`/courses/${course.slug}/lessons/${l.slug}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-ink-800"
                    >
                      <span>
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

        {course.nextCourseSlug && (
          <div className="mt-10">
            <Notice>Recommended next: continue to the next course when this one is complete.</Notice>
            <Link to={`/courses/${course.nextCourseSlug}`} className="mt-3 inline-block text-sm text-accent">
              Next course →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
