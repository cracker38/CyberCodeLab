import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Badge, Notice } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

type LabDetail = {
  lab: {
    slug: string;
    title: string;
    category: string;
    difficulty: string;
    description: string;
    objectives: string[];
    instructions: string;
    environmentNote: string;
    relatedCourse: { slug: string; title: string } | null;
    completed: boolean;
  };
};

export function LabDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<LabDetail | null>(null);

  const load = () => {
    api<LabDetail>(`/api/labs/${slug}`).then(setData);
  };
  useEffect(() => {
    load();
  }, [slug]);

  if (!data) return <p className="px-4 py-16 text-center text-slate-400">Loading lab…</p>;
  const { lab } = data;
  return (
    <>
      <Seo title={lab.title} description={lab.description} path={`/labs/${lab.slug}`} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="font-mono text-xs text-accent">{lab.category}</p>
        <h1 className="mt-2 text-3xl font-semibold">{lab.title}</h1>
        <div className="mt-3">
          <Badge>{lab.difficulty}</Badge>
        </div>
        <p className="mt-4 text-slate-400">{lab.description}</p>
        <div className="mt-6">
          <Notice>{lab.environmentNote}</Notice>
        </div>
        <h2 className="mt-8 font-semibold">Objectives</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-400">
          {lab.objectives.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <pre className="prose-lesson mt-8 whitespace-pre-wrap rounded-xl border border-line bg-ink-900 p-5 text-sm text-slate-300">
          {lab.instructions}
        </pre>
        {lab.relatedCourse && (
          <p className="mt-6 text-sm text-slate-400">
            Related course:{" "}
            <Link className="text-accent" to={`/courses/${lab.relatedCourse.slug}`}>
              {lab.relatedCourse.title}
            </Link>
          </p>
        )}
        {user && !lab.completed && (
          <button
            className="mt-8 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950"
            onClick={async () => {
              await api(`/api/labs/${lab.slug}/complete`, { method: "POST" });
              load();
            }}
          >
            Mark lab complete
          </button>
        )}
        {lab.completed && <p className="mt-8 text-sm text-accent">Lab completed.</p>}
      </div>
    </>
  );
}
