import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { CardLink } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

type HomeData = {
  courses: { slug: string; title: string; subtitle: string; level: string; category: string }[];
  labs: { slug: string; title: string; category: string; difficulty: string; description: string }[];
  projects: { slug: string; title: string; description: string; difficulty: string }[];
  videos: { youtubeId: string; title: string; description: string }[];
};

const fallbackPaths = [
  { to: "/courses/cybersecurity-fundamentals", title: "Cybersecurity Fundamentals", text: "Learn the foundations of cybersecurity.", meta: "Beginner" },
  { to: "/courses/python-for-cybersecurity", title: "Python for Cybersecurity", text: "Use Python to automate security tasks and build security tools.", meta: "Python" },
  { to: "/courses/networking-essentials", title: "Networking", text: "Understand TCP/IP, DNS, HTTP, ports, protocols, routing, and network security.", meta: "Networking" },
  { to: "/courses/linux-for-security", title: "Linux for Security", text: "Learn Linux fundamentals, command-line usage, permissions, processes, and security concepts.", meta: "Linux" },
  { to: "/courses/web-security", title: "Web Security", text: "Understand authentication, authorization, HTTP, common web vulnerabilities, and secure development.", meta: "Web" },
  { to: "/courses/ai-for-cybersecurity", title: "AI for Cybersecurity", text: "Explore machine learning, anomaly detection, log analysis, and intelligent threat detection.", meta: "AI" },
];

export function HomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    api<HomeData>("/api/catalog").then(setData).catch(() => setData(null));
  }, []);

  return (
    <>
      <Seo
        title="Master cybersecurity through code"
        description="Learn cybersecurity through structured courses, practical labs, programming, and real-world projects."
        path="/"
      />
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(45,212,191,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.07) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="page-wrap relative grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Learn. Code. Practice. Secure.</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Master Cybersecurity Through Code.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              Learn cybersecurity through structured courses, practical labs, programming, and real-world projects.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? "/dashboard" : "/register"} className="btn-primary">
                Start Learning
              </Link>
              <Link to="/labs" className="btn-ghost">
                Explore Labs
              </Link>
            </div>
          </div>
          <div className="surface p-6 font-mono text-sm">
            <p className="text-slate-500">// learning loop</p>
            <p className="mt-3 text-slate-300">
              <span className="text-accent">path</span> = [
            </p>
            {["Learn", "Understand", "Code", "Practice", "Build", "Secure"].map((step, i) => (
              <p key={step} className="pl-4 text-slate-200">
                <span className="text-slate-500">{i + 1}.</span> {step}
                {i < 5 ? "," : ""}
              </p>
            ))}
            <p className="text-slate-300">]</p>
            <p className="mt-4 text-xs text-slate-500">Authorized environments only.</p>
          </div>
        </div>
      </section>

      <section className="page-wrap py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Learning paths</h2>
            <p className="mt-2 max-w-2xl text-slate-400">
              Beginners should start with fundamentals. Each path answers what to learn next.
            </p>
          </div>
          <Link to="/learn" className="hidden text-sm text-accent sm:inline">
            Full roadmap →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data?.courses.length
            ? data.courses.map((c) => ({
                to: `/courses/${c.slug}`,
                title: c.title,
                text: c.subtitle || c.category,
                meta: c.level,
              }))
            : fallbackPaths
          ).map((p) => (
            <CardLink key={p.to} to={p.to} title={p.title} meta={p.meta}>
              {p.text}
            </CardLink>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink-900/40">
        <div className="page-wrap grid gap-8 py-16 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold">CyberCode Labs</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Password scoring, integrity hashing, log analysis, DNS, HTTP — educational environments only.
            </p>
            <div className="mt-4 space-y-2">
              {(data?.labs ?? []).slice(0, 3).map((l) => (
                <Link key={l.slug} to={`/labs/${l.slug}`} className="block text-sm text-slate-300 hover:text-accent">
                  {l.title}
                </Link>
              ))}
            </div>
            <Link to="/labs" className="mt-4 inline-block text-sm text-accent">
              Open labs →
            </Link>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Projects</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Build tools you can explain: Python toolkit, secure notes API, Linux baseline.
            </p>
            <div className="mt-4 space-y-2">
              {(data?.projects ?? []).map((p) => (
                <Link key={p.slug} to={`/projects/${p.slug}`} className="block text-sm text-slate-300 hover:text-accent">
                  {p.title}
                </Link>
              ))}
            </div>
            <Link to="/projects" className="mt-4 inline-block text-sm text-accent">
              See projects →
            </Link>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Latest from CyberCode Lab</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Watch, then practice in a lab you control.</p>
            <div className="mt-4 space-y-2">
              {(data?.videos ?? []).map((v) => (
                <p key={v.youtubeId} className="text-sm text-slate-300">
                  {v.title}
                </p>
              ))}
            </div>
            <Link to="/youtube" className="mt-4 inline-block text-sm text-accent">
              YouTube →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
