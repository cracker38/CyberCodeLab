import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { AsyncState, Badge, CardLink, Field, PageHeader, inputClass } from "../components/ui";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { queryString } from "../lib/query";
import { api } from "../services/api";
import type { Facets, ProjectCard } from "../types";

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [facets, setFacets] = useState<Facets>({ difficulties: [] });
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const search = useDebouncedValue(q);

  useEffect(() => {
    setLoading(true);
    api<{ projects: ProjectCard[]; facets: Facets }>(`/api/projects${queryString({ q: search, difficulty })}`)
      .then((d) => {
        setProjects(d.projects);
        setFacets(d.facets ?? { difficulties: [] });
        setError("");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, difficulty]);

  return (
    <>
      <Seo title="Projects" description="Security projects with GitHub source, skills, and related courses." path="/projects" />
      <div className="page-wrap py-12">
        <PageHeader kicker="Learn · Projects" title="Build something you can explain">
          <p>
            Projects sit after labs. Use them to connect a course to a repository, a README, and a set of skills you
            can talk through in an interview.
          </p>
        </PageHeader>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Field label="Search">
            <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Skill or technology" />
          </Field>
          <Field label="Difficulty">
            <select className={inputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">All difficulties</option>
              {(facets.difficulties ?? []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <AsyncState
          loading={loading}
          error={error}
          hasItems={projects.length > 0}
          empty="No projects match those filters"
        >
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <CardLink
                key={p.slug}
                to={`/projects/${p.slug}`}
                title={p.title}
                meta={p.difficulty}
                footer={
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.technologies.slice(0, 4).map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                }
              >
                {p.description}
              </CardLink>
            ))}
          </div>
        </AsyncState>
      </div>
    </>
  );
}
