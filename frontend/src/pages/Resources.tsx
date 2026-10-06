import { useEffect, useMemo, useState } from "react";
import { Seo } from "../components/Seo";
import { CardLink, Field, inputClass } from "../components/ui";
import { api } from "../services/api";

type Resource = { slug: string; title: string; type: string; category: string; summary: string };

export function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    const qs = params.toString();
    api<{ resources: Resource[] }>(`/api/resources${qs ? `?${qs}` : ""}`).then((d) => setItems(d.resources));
  }, [q, type]);

  const types = useMemo(() => [...new Set(items.map((i) => i.type))], [items]);

  return (
    <>
      <Seo
        title="Resources"
        description="Cybersecurity notes, cheat sheets, roadmaps, Linux commands, and a glossary."
        path="/resources"
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Resources</h1>
        <p className="mt-2 text-slate-400">Notes, cheat sheets, roadmaps, and references.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Search">
            <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and notes" />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {["roadmap", "cheatsheet", "glossary", "notes", "tools", ...types].filter((v, i, a) => a.indexOf(v) === i).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((r) => (
            <CardLink key={r.slug} to={`/resources/${r.slug}`} title={r.title} meta={`${r.type} · ${r.category}`}>
              {r.summary}
            </CardLink>
          ))}
        </div>
      </div>
    </>
  );
}
