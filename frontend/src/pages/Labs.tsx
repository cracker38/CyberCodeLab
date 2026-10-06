import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { AsyncState, CardLink, Field, Notice, PageHeader, inputClass } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { queryString } from "../lib/query";
import { api } from "../services/api";
import type { Facets, LabCard } from "../types";

export function LabsPage() {
  const { user } = useAuth();
  const [labs, setLabs] = useState<LabCard[]>([]);
  const [facets, setFacets] = useState<Facets>({ categories: [], difficulties: [] });
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const search = useDebouncedValue(q);

  useEffect(() => {
    setLoading(true);
    api<{ labs: LabCard[]; facets: Facets }>(`/api/labs${queryString({ q: search, category, difficulty })}`)
      .then((d) => {
        setLabs(d.labs);
        setFacets(d.facets ?? { categories: [], difficulties: [] });
        setError("");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, category, difficulty, user]);

  const cats = [...new Set(labs.map((l) => l.category))];

  return (
    <>
      <Seo
        title="CyberCode Labs"
        description="Practical cybersecurity labs for Python, networking, web security, and blue team skills."
        path="/labs"
      />
      <div className="page-wrap py-12">
        <PageHeader kicker="Learn · Labs" title="CyberCode Labs">
          <p>
            Practice on machines and files you own. A lab is complete when you can explain what you observed — not when
            you copied a command.
          </p>
        </PageHeader>
        <div className="mt-6 max-w-2xl">
          <Notice>Educational / Authorized Environment Only</Notice>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Field label="Search">
            <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lab title or skill" />
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
          hasItems={labs.length > 0}
          empty="No labs match those filters"
          emptyHint="Try another category, or open the related course first."
        >
          {cats.map((cat) => (
            <section key={cat} className="mt-10">
              <h2 className="text-xl font-semibold">{cat}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {labs
                  .filter((l) => l.category === cat)
                  .map((l) => (
                    <CardLink
                      key={l.slug}
                      to={`/labs/${l.slug}`}
                      title={l.title}
                      meta={`${l.difficulty}${l.completed ? " · completed" : ""}`}
                    >
                      {l.description}
                    </CardLink>
                  ))}
              </div>
            </section>
          ))}
        </AsyncState>
      </div>
    </>
  );
}
