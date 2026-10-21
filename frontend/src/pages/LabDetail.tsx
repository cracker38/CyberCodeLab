import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Markdown } from "../components/Markdown";
import { Seo } from "../components/Seo";
import { Badge, Notice } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { ApiError, api } from "../services/api";

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
    relatedProject: { slug: string; title: string } | null;
    completed: boolean;
  };
};

export function LabDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<LabDetail | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<LabDetail>(`/api/labs/${slug}`));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This lab could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data && loading) return <p className="px-4 py-16 text-center text-slate-400" role="status">Loading lab...</p>;
  if (!data) return <div className="mx-auto max-w-3xl px-4 py-16"><p className="text-red-300" role="alert">{error || "Lab not found."}</p><Link className="mt-4 inline-block text-sm text-accent" to="/labs">Back to labs</Link></div>;

  const { lab } = data;
  const markComplete = async () => {
    setBusy(true);
    setActionError("");
    try {
      await api(`/api/labs/${lab.slug}/complete`, { method: "POST" });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not save lab progress.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title={lab.title} description={lab.description} path={`/labs/${lab.slug}`} />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <Breadcrumbs items={[{ to: "/labs", label: "Labs" }, { label: lab.title }]} />
        <header className="mt-6 border-b border-line pb-6">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">{lab.category}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{lab.title}</h1>
          <div className="mt-3"><Badge>{lab.difficulty}</Badge></div>
          <p className="mt-4 leading-relaxed text-slate-400">{lab.description}</p>
        </header>
        {error && <p className="mt-4 text-sm text-amber-200" role="status">Showing lab details. Refresh failed: {error}</p>}
        <div className="mt-6"><Notice>{lab.environmentNote}</Notice></div>
        {lab.objectives.length > 0 && <section className="mt-8"><h2 className="font-semibold text-white">What you’ll practice</h2><ul className="mt-3 space-y-2 text-sm text-slate-400">{lab.objectives.map((objective) => <li key={objective} className="flex gap-3"><span className="text-accent" aria-hidden="true">✓</span><span>{objective}</span></li>)}</ul></section>}
        <div className="prose-lesson mt-8 rounded-xl border border-line bg-ink-900 p-5"><Markdown text={lab.instructions} /></div>

        {(lab.relatedCourse || lab.relatedProject) && <div className="mt-6 grid gap-3 sm:grid-cols-2">{lab.relatedCourse && <Link className="surface p-4 text-sm" to={`/courses/${lab.relatedCourse.slug}`}><span className="block text-xs text-slate-500">Related course</span><span className="mt-1 block font-medium text-accent">{lab.relatedCourse.title} →</span></Link>}{lab.relatedProject && <Link className="surface p-4 text-sm" to={`/projects/${lab.relatedProject.slug}`}><span className="block text-xs text-slate-500">Related project</span><span className="mt-1 block font-medium text-accent">{lab.relatedProject.title} →</span></Link>}</div>}

        {user && !lab.completed && <div className="mt-8"><button className="btn-primary" disabled={busy} onClick={() => void markComplete()}>{busy ? "Saving progress..." : "Mark lab complete"}</button>{actionError && <p className="mt-3 text-sm text-red-300" role="alert">{actionError}</p>}</div>}
        {!user && <p className="mt-8 text-sm text-slate-400"><Link className="text-accent" to={`/signin?next=${encodeURIComponent(`/labs/${lab.slug}`)}`}>Sign in</Link> to save this lab to your dashboard.</p>}
        {lab.completed && <p className="mt-8 text-sm text-accent" role="status">Lab completed.</p>}
      </article>
    </>
  );
}
