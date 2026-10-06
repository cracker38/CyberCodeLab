import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { CardLink } from "../components/ui";
import { api } from "../services/api";

type Project = {
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  difficulty: string;
  skills: string[];
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    api<{ projects: Project[] }>("/api/projects").then((d) => setProjects(d.projects));
  }, []);
  return (
    <>
      <Seo title="Projects" description="Security projects with GitHub source, skills, and related courses." path="/projects" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <p className="mt-2 text-slate-400">Build defensive tools you can explain in an interview.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <CardLink key={p.slug} to={`/projects/${p.slug}`} title={p.title} meta={p.difficulty}>
              {p.description}
            </CardLink>
          ))}
        </div>
      </div>
    </>
  );
}
