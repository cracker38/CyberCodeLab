import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

function renderContent(text: string) {
  const blocks = text.split("\n\n");
  return blocks.map((block, i) => {
    if (block.startsWith("## ")) return <h2 key={i}>{block.slice(3)}</h2>;
    if (block.startsWith("- ")) {
      return (
        <ul key={i}>
          {block.split("\n").map((line) => (
            <li key={line}>{line.replace(/^- /, "")}</li>
          ))}
        </ul>
      );
    }
    if (/^\d+\. /.test(block)) {
      return (
        <ol key={i}>
          {block.split("\n").map((line) => (
            <li key={line}>{line.replace(/^\d+\. /, "")}</li>
          ))}
        </ol>
      );
    }
    const html = block.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
    return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

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
    completed: boolean;
  };
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  quiz?: { id: string; title: string };
};

export function LessonPage() {
  const { slug, lessonSlug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<LessonPayload | null>(null);
  const [error, setError] = useState("");
  const [cert, setCert] = useState<string | null>(null);

  const load = () => {
    api<LessonPayload>(`/api/courses/${slug}/lessons/${lessonSlug}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [slug, lessonSlug]);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-16 text-red-300">{error}</p>;
  if (!data) return <p className="mx-auto max-w-3xl px-4 py-16 text-slate-400">Loading lesson…</p>;
  const { lesson, course, prev, next } = data;

  return (
    <>
      <Seo title={lesson.title} description={course.title} path={`/courses/${course.slug}/lessons/${lesson.slug}`} />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-slate-500">
          <Link to={`/courses/${course.slug}`} className="hover:text-accent">
            {course.title}
          </Link>{" "}
          · {lesson.moduleTitle}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{lesson.title}</h1>
        <div className="prose-lesson mt-8 space-y-3">{renderContent(lesson.content)}</div>
        {lesson.codeExample && (
          <pre className="mt-8 overflow-x-auto rounded-xl border border-line bg-ink-900 p-4 font-mono text-sm text-teal-100">
            <code>{lesson.codeExample}</code>
          </pre>
        )}
        {lesson.exercise && (
          <div className="mt-8 rounded-xl border border-line bg-ink-800 p-4">
            <p className="text-sm font-medium text-white">Exercise</p>
            <p className="mt-2 text-sm text-slate-300">{lesson.exercise}</p>
          </div>
        )}
        {data.quiz && user && (
          <Link to={`/quizzes/${data.quiz.id}`} className="mt-6 inline-block text-sm text-accent">
            Lesson quiz →
          </Link>
        )}
        {user && !lesson.completed && (
          <div className="mt-8">
            <button
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950"
              onClick={async () => {
                const r = await api<{ certificateId?: string | null }>(`/api/lessons/${lesson.id}/complete`, {
                  method: "POST",
                });
                if (r.certificateId) setCert(r.certificateId);
                load();
              }}
            >
              Mark complete
            </button>
          </div>
        )}
        {lesson.completed && <p className="mt-6 text-sm text-accent">Lesson completed.</p>}
        {cert && (
          <p className="mt-4 text-sm">
            Course complete.{" "}
            <Link className="text-accent" to={`/certificates/${cert}`}>
              View certificate
            </Link>
          </p>
        )}
        <nav className="mt-12 flex justify-between gap-4 border-t border-line pt-6 text-sm">
          {prev ? (
            <Link to={`/courses/${course.slug}/lessons/${prev.slug}`} className="text-slate-400 hover:text-white">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/courses/${course.slug}/lessons/${next.slug}`} className="text-slate-400 hover:text-white">
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </>
  );
}
