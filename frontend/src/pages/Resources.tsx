import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { AsyncState, CardLink, Field, PageHeader, inputClass } from "../components/ui";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { queryString } from "../lib/query";
import { api } from "../services/api";
import type { Facets, ResourceCard } from "../types";

export function ResourcesPage() {
  const [items, setItems] = useState<ResourceCard[]>([]);
  const [facets, setFacets] = useState<Facets>({ types: [], categories: [] });
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const search = useDebouncedValue(q);

  useEffect(() => {
    setLoading(true);
    api<{ resources: ResourceCard[]; facets: Facets }>(`/api/resources${queryString({ q: search, type, category })}`)
      .then((d) => {
        setItems(d.resources);
        setFacets(d.facets ?? { types: [], categories: [] });
        setError("");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, type, category]);

  return (
    <>
      <Seo
        title="Resources"
        description="Cybersecurity notes, cheat sheets, roadmaps, Linux commands, and a glossary."
        path="/resources"
      />
      <div className="page-wrap py-12">
        <PageHeader kicker="Learn · Resources" title="Notes you can keep open while you study">
          <p>Roadmaps, cheat sheets, glossaries, and tool lists — the reference layer around courses and labs.</p>
        </PageHeader>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Field label="Search">
            <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and notes" />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {(facets.types ?? []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {(facets.categories ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <AsyncState
          loading={loading}
          error={error}
          hasItems={items.length > 0}
          empty="No resources match those filters"
          emptyHint="Clear search, or browse courses if you need a full lesson."
        >
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {items.map((r) => (
              <CardLink key={r.slug} to={`/resources/${r.slug}`} title={r.title} meta={`${r.type} · ${r.category}`}>
                {r.summary}
              </CardLink>
            ))}
          </div>
        </AsyncState>
      </div>
    </>
  );
}
