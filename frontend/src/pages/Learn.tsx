import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { ProgressBar } from "../components/ui";
import { api } from "../services/api";

type Step = { slug: string; title: string; level: string; percent: number; status: string };

export function LearnPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  useEffect(() => {
    api<{ steps: Step[] }>("/api/learn/path")
      .then((d) => setSteps(d.steps))
      .catch(() => setSteps([]));
  }, []);

  return (
    <>
      <Seo
        title="What should I learn next?"
        description="A clear cybersecurity roadmap for beginners and developers: systems, networking, Linux, Python, web security."
        path="/learn"
      />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Roadmap</p>
        <h1 className="mt-2 text-3xl font-semibold">What you should learn next</h1>
        <p className="mt-4 text-slate-400">
          Cybersecurity can feel huge. Follow this order unless you already have a skill. Skip only what you can
          already demonstrate.
        </p>
        <ol className="mt-10 space-y-4">
          {(steps.length
            ? steps
            : [
                { slug: "cybersecurity-fundamentals", title: "Cybersecurity Fundamentals", level: "Beginner", percent: 0, status: "next" },
                { slug: "networking-essentials", title: "Networking Essentials", level: "Beginner", percent: 0, status: "upcoming" },
                { slug: "linux-for-security", title: "Linux for Security", level: "Beginner", percent: 0, status: "upcoming" },
                { slug: "python-for-cybersecurity", title: "Python for Cybersecurity", level: "Intermediate", percent: 0, status: "upcoming" },
                { slug: "web-security", title: "Web Security", level: "Intermediate", percent: 0, status: "upcoming" },
                { slug: "ai-for-cybersecurity", title: "AI for Cybersecurity", level: "Intermediate", percent: 0, status: "upcoming" },
              ]
          ).map((s, i) => (
            <li key={s.slug} className="surface flex gap-4 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line font-mono text-sm text-accent">
                {s.status === "completed" ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/courses/${s.slug}`} className="font-medium text-white hover:text-accent">
                    {s.title}
                  </Link>
                  <span className="font-mono text-[11px] uppercase text-slate-500">{s.status.replace("_", " ")}</span>
                </div>
                {s.percent > 0 && <div className="mt-2"><ProgressBar percent={s.percent} /></div>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
