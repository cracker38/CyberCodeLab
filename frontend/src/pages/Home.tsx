import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { CardLink } from "../components/ui";

const paths = [
  { to: "/courses/cybersecurity-fundamentals", title: "Cybersecurity Fundamentals", text: "Learn the foundations of cybersecurity." },
  { to: "/courses/python-for-cybersecurity", title: "Python for Cybersecurity", text: "Use Python to automate security tasks and build security tools." },
  { to: "/courses/networking-essentials", title: "Networking", text: "Understand TCP/IP, DNS, HTTP, ports, protocols, routing, and network security." },
  { to: "/courses/linux-for-security", title: "Linux for Security", text: "Learn Linux fundamentals, command-line usage, permissions, processes, and security concepts." },
  { to: "/courses/web-security", title: "Web Security", text: "Understand authentication, authorization, HTTP, common web vulnerabilities, and secure development." },
  { to: "/courses/ai-for-cybersecurity", title: "AI for Cybersecurity", text: "Explore machine learning, anomaly detection, log analysis, and intelligent threat detection." },
];

export function HomePage() {
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
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(45,212,191,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Learn. Code. Practice. Secure.</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Master Cybersecurity Through Code.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              Learn cybersecurity through structured courses, practical labs, programming, and real-world projects.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-teal-300"
              >
                Start Learning
              </Link>
              <Link
                to="/labs"
                className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-accent/50"
              >
                Explore Labs
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-ink-900 p-6 font-mono text-sm shadow-card">
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

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold">Learning paths</h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          Beginners should start with fundamentals. Each path answers what to learn next.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => (
            <CardLink key={p.to} to={p.to} title={p.title} meta="Path">
              {p.text}
            </CardLink>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink-900/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          <Preview title="Featured courses" to="/courses" cta="Browse courses">
            Six starter courses from CIA triad through Python, Linux, web security, and AI for defense.
          </Preview>
          <Preview title="CyberCode Labs" to="/labs" cta="Open labs">
            Password scoring, integrity hashing, log analysis, DNS, HTTP — all marked educational only.
          </Preview>
          <Preview title="Projects" to="/projects" cta="See projects">
            Build a Python toolkit, a secure notes API, and a Linux home-lab baseline with GitHub links.
          </Preview>
        </div>
      </section>
    </>
  );
}

function Preview({
  title,
  to,
  cta,
  children,
}: {
  title: string;
  to: string;
  cta: string;
  children: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{children}</p>
      <Link to={to} className="mt-4 inline-block text-sm text-accent hover:underline">
        {cta} →
      </Link>
    </div>
  );
}
