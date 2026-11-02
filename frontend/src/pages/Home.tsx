import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { CardLink } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { CHANNEL_VIDEOS_URL, OFFICIAL_VIDEO } from "../lib/youtube";
import { api } from "../services/api";

type HomeData = {
  courses: { slug: string; title: string; subtitle?: string; level: string; category: string }[];
  labs: { slug: string; title: string; category: string; difficulty: string; description: string }[];
  projects: { slug: string; title: string; description: string; difficulty: string }[];
  videos: { youtubeId: string; title: string; description: string }[];
  counts?: { courses: number; labs: number; projects: number; resources: number; videos: number };
};

type Continue = {
  courseSlug: string;
  courseTitle: string;
  lessonSlug: string;
  lessonTitle: string;
} | null;

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
  const [resume, setResume] = useState<Continue>(null);

  useEffect(() => {
    api<HomeData>("/api/catalog").then(setData).catch(() => setData(null));
  }, []);

  useEffect(() => {
    if (!user) {
      setResume(null);
      return;
    }
    api<{ continueLearning: Continue }>("/api/progress/dashboard")
      .then((d) => setResume(d.continueLearning))
      .catch(() => setResume(null));
  }, [user]);

  const counts = data?.counts;

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
        <div className="page-wrap relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Learn. Code. Practice. Secure.</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Master cybersecurity through code.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              Structured courses, authorized labs, projects, and a recommended order — so you always know what to do
              next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? "/dashboard" : "/register"} className="btn-primary">
                {user ? "Open dashboard" : "Start learning"}
              </Link>
              <Link to="/learn" className="btn-ghost">
                View the roadmap
              </Link>
            </div>
            {resume && (
              <div className="surface mt-8 flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-accent">Continue</p>
                  <p className="mt-1 font-medium text-white">{resume.courseTitle}</p>
                  <p className="text-sm text-slate-400">{resume.lessonTitle}</p>
                </div>
                <Link
                  className="btn-primary"
                  to={`/courses/${resume.courseSlug}/lessons/${resume.lessonSlug}`}
                >
                  Resume
                </Link>
              </div>
            )}
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

      {counts && (
        <section className="border-b border-line">
          <div className="page-wrap grid grid-cols-2 gap-4 py-8 sm:grid-cols-4">
            <Stat label="Courses" value={counts.courses} />
            <Stat label="Labs" value={counts.labs} />
            <Stat label="Projects" value={counts.projects} />
            <Stat label="Resources" value={counts.resources} />
          </div>
        </section>
      )}

      <section className="page-wrap py-16">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <p className="mt-2 max-w-2xl text-slate-400">One loop. You do not jump to “hacking” before you can explain the system.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { n: "01", t: "Study", d: "Follow the course order. Read, then write a small program." },
            { n: "02", t: "Practice", d: "Run labs only on machines and files you control." },
            { n: "03", t: "Build", d: "Ship a project you can explain in an interview." },
            { n: "04", t: "Prove", d: "Pass the quiz. Progress and certificates stay on your dashboard." },
          ].map((item) => (
            <div key={item.n} className="surface p-5">
              <p className="font-mono text-xs text-accent">{item.n}</p>
              <h3 className="mt-2 font-semibold">{item.t}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-wrap pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Learning paths</h2>
            <p className="mt-2 max-w-2xl text-slate-400">
              Beginners start with fundamentals. Each path answers what to learn next.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link to="/courses" className="text-accent hover:text-teal-200">Browse all courses</Link>
            <Link to="/learn" className="hidden text-accent hover:text-teal-200 sm:inline">Full roadmap →</Link>
          </div>
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
              Hands-on practice in environments you own. Educational use only.
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
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Watch a short preview, then continue on the channel.</p>
            <div className="mt-4 space-y-2">
              {(data?.videos?.length ? data.videos : [OFFICIAL_VIDEO]).slice(0, 1).map((v) => (
                <Link key={v.youtubeId} to="/youtube" className="block text-sm text-slate-300 hover:text-accent">
                  {v.title}
                </Link>
              ))}
            </div>
            <a
              href={CHANNEL_VIDEOS_URL}
              className="mt-4 mr-4 inline-block text-sm text-slate-400 hover:text-accent"
              target="_blank"
              rel="noreferrer"
            >
              Channel
            </a>
            <Link to="/youtube" className="mt-4 inline-block text-sm text-accent">
              Preview on site →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
