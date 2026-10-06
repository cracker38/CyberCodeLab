import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

const steps = [
  { done: false, title: "Cybersecurity Fundamentals", to: "/courses/cybersecurity-fundamentals" },
  { done: false, title: "Networking Essentials", to: "/courses/networking-essentials" },
  { done: false, title: "Linux for Security", to: "/courses/linux-for-security" },
  { done: false, title: "Python for Cybersecurity", to: "/courses/python-for-cybersecurity" },
  { done: false, title: "Web Security", to: "/courses/web-security" },
  { done: false, title: "AI for Cybersecurity", to: "/courses/ai-for-cybersecurity" },
];

export function LearnPage() {
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
          {steps.map((s, i) => (
            <li key={s.to} className="flex gap-4 rounded-xl border border-line bg-ink-900 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line font-mono text-sm text-accent">
                {i + 1}
              </span>
              <div>
                <Link to={s.to} className="font-medium text-white hover:text-accent">
                  {s.title}
                </Link>
                {i < steps.length - 1 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Then: {steps[i + 1].title}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
