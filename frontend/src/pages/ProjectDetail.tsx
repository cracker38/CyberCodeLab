import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Badge, Notice } from "../components/ui";
import { api } from "../services/api";

type Project = {
  project: {
    title: string;
    description: string;
    technologies: string[];
    difficulty: string;
    skills: string[];
    githubUrl?: string | null;
    demoUrl?: string | null;
    readme?: string;
    relatedCourse: { slug: string; title: string } | null;
    slug: string;
  };
};

export function ProjectDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState<Project | null>(null);
  useEffect(() => {
    api<Project>(`/api/projects/${slug}`).then(setData);
  }, [slug]);
  if (!data) return <p className="px-4 py-16 text-center text-slate-400">Loading…</p>;
  const p = data.project;
  return (
    <>
      <Seo title={p.title} description={p.description} path={`/projects/${p.slug}`} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">{p.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{p.difficulty}</Badge>
          {p.technologies.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <p className="mt-4 text-slate-400">{p.description}</p>
        <h2 className="mt-8 font-semibold">Skills</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-400">
          {p.skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          {p.githubUrl && (
            <a className="text-accent" href={p.githubUrl} target="_blank" rel="noreferrer">
              GitHub repository
            </a>
          )}
          {p.demoUrl && (
            <a className="text-accent" href={p.demoUrl} target="_blank" rel="noreferrer">
              Demo
            </a>
          )}
        </div>
        {p.relatedCourse && (
          <p className="mt-4 text-sm">
            Related course:{" "}
            <Link className="text-accent" to={`/courses/${p.relatedCourse.slug}`}>
              {p.relatedCourse.title}
            </Link>
          </p>
        )}
        <div className="mt-6">
          <Notice>Educational / Authorized Environment Only. Follow the README ethical-use disclaimer.</Notice>
        </div>
        {p.readme && (
          <pre className="mt-8 overflow-x-auto whitespace-pre-wrap rounded-xl border border-line bg-ink-900 p-5 text-sm text-slate-300">
            {p.readme}
          </pre>
        )}
      </div>
    </>
  );
}
