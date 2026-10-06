import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Markdown } from "../components/Markdown";
import { Seo } from "../components/Seo";
import { api } from "../services/api";

export function ResourceDetailPage() {
  const { slug } = useParams();
  const [item, setItem] = useState<{
    title: string;
    type: string;
    category: string;
    summary: string;
    body: string;
    downloadUrl?: string | null;
    slug: string;
    related?: { slug: string; title: string; type: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ resource: NonNullable<typeof item> }>(`/api/resources/${slug}`)
      .then((d) => setItem(d.resource))
      .catch((e: Error) => setError(e.message));
  }, [slug]);
  if (error) return <p className="mx-auto max-w-3xl px-4 py-16 text-red-300">{error}</p>;
  if (!item) return <p className="px-4 py-16 text-center text-slate-400">Loading…</p>;
  return (
    <>
      <Seo title={item.title} description={item.summary} path={`/resources/${item.slug}`} />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <p className="font-mono text-xs uppercase text-accent">
          {item.type} · {item.category}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{item.title}</h1>
        <p className="mt-3 text-slate-400">{item.summary}</p>
        <div className="prose-lesson mt-8 rounded-xl border border-line bg-ink-900 p-5">
          <Markdown text={item.body} />
        </div>
        {item.downloadUrl && (
          <a className="mt-6 inline-block text-accent" href={item.downloadUrl}>
            Download
          </a>
        )}
        {item.related && item.related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-semibold">Related resources</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {item.related.map((r) => (
                <li key={r.slug}>
                  <Link className="text-accent" to={`/resources/${r.slug}`}>
                    {r.title}
                  </Link>{" "}
                  <span className="text-slate-500">({r.type})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </>
  );
}
