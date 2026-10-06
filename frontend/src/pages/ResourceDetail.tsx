import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  } | null>(null);
  useEffect(() => {
    api<{ resource: NonNullable<typeof item> }>(`/api/resources/${slug}`).then((d) => setItem(d.resource));
  }, [slug]);
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
        <pre className="mt-8 whitespace-pre-wrap rounded-xl border border-line bg-ink-900 p-5 text-sm leading-relaxed text-slate-300">
          {item.body}
        </pre>
        {item.downloadUrl && (
          <a className="mt-6 inline-block text-accent" href={item.downloadUrl}>
            Download
          </a>
        )}
      </article>
    </>
  );
}
