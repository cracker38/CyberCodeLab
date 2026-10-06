import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { CardLink, Notice } from "../components/ui";
import { api } from "../services/api";

type Lab = {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
};

export function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  useEffect(() => {
    api<{ labs: Lab[] }>("/api/labs").then((d) => setLabs(d.labs));
  }, []);
  const cats = [...new Set(labs.map((l) => l.category))];
  return (
    <>
      <Seo
        title="CyberCode Labs"
        description="Practical cybersecurity labs for Python, networking, web security, and blue team skills."
        path="/labs"
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold">CyberCode Labs</h1>
        <p className="mt-2 text-slate-400">Hands-on practice. Every exercise is scoped to systems you control.</p>
        <div className="mt-6 max-w-2xl">
          <Notice>Educational / Authorized Environment Only</Notice>
        </div>
        {cats.map((cat) => (
          <section key={cat} className="mt-10">
            <h2 className="text-xl font-semibold">{cat}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {labs
                .filter((l) => l.category === cat)
                .map((l) => (
                  <CardLink key={l.slug} to={`/labs/${l.slug}`} title={l.title} meta={l.difficulty}>
                    {l.description}
                  </CardLink>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
