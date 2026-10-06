import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { PageHeader, ProgressBar } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

type Step = { slug: string; title: string; level: string; percent: number; status: string };
type Track = { to: string; label: string; blurb: string; count: number };
type NextAction = {
  courseSlug: string;
  courseTitle: string;
  status: string;
  percent: number;
  lab: { slug: string; title: string } | null;
  project: { slug: string; title: string } | null;
};

const LOOP = [
  { step: "Learn", detail: "Courses and YouTube explain the concept." },
  { step: "Understand", detail: "Resources and quizzes check the model in your head." },
  { step: "Code", detail: "Write small defensive programs in the lessons." },
  { step: "Practice", detail: "Labs run only on systems you control." },
  { step: "Build", detail: "Projects turn skills into something you can show." },
  { step: "Secure", detail: "Apply least privilege, validation, and professional ethics." },
];

export function LearnPage() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [signedIn, setSignedIn] = useState(Boolean(user));
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ steps: Step[]; tracks: Track[]; nextAction: NextAction | null; signedIn: boolean }>("/api/learn/path")
      .then((d) => {
        setSteps(d.steps);
        setTracks(d.tracks ?? []);
        setNextAction(d.nextAction ?? null);
        setSignedIn(d.signedIn);
      })
      .catch((e: Error) => setError(e.message));
  }, [user]);

  const cta =
    nextAction?.status === "completed"
      ? "Review course"
      : nextAction?.status === "in_progress"
        ? "Continue course"
        : "Start this course";

  return (
    <>
      <Seo
        title="Learn cybersecurity in order"
        description="A professional path: courses, labs, projects, resources, and YouTube — in a sequence that actually builds skill."
        path="/learn"
      />
      <div className="page-wrap py-12">
        <PageHeader kicker="Learn hub" title="What to study, in what order, and why">
          <p>
            Cybersecurity is a stack. You learn how systems work, then you write code, then you practice in an
            authorized lab, then you build. Skip a layer only if you can already demonstrate it.
          </p>
        </PageHeader>

        {error && <p className="mt-6 text-red-300">{error}</p>}

        {tracks.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {tracks.map((t) => (
              <Link key={t.to} to={t.to} className="surface p-4 transition hover:border-accent/40">
                <p className="font-mono text-[11px] uppercase tracking-wider text-accent">{t.count} items</p>
                <h2 className="mt-2 font-semibold text-white">{t.label}</h2>
                <p className="mt-1 text-sm text-slate-400">{t.blurb}</p>
              </Link>
            ))}
          </div>
        )}

        {nextAction && (
          <div className="surface mt-10 flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-accent">
                {signedIn ? "Your next step" : "Recommended first step"}
              </p>
              <p className="mt-1 text-lg font-semibold">{nextAction.courseTitle}</p>
              <p className="text-sm text-slate-400">
                {signedIn
                  ? nextAction.status.replace("_", " ")
                  : "Start here even before you create an account. Sign in when you want progress saved."}
              </p>
              {nextAction.percent > 0 && (
                <div className="mt-3 max-w-xs">
                  <ProgressBar percent={nextAction.percent} />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/courses/${nextAction.courseSlug}`} className="btn-primary">
                {cta}
              </Link>
              {nextAction.lab && (
                <Link to={`/labs/${nextAction.lab.slug}`} className="btn-ghost">
                  Practice lab
                </Link>
              )}
              {nextAction.project && (
                <Link to={`/projects/${nextAction.project.slug}`} className="btn-ghost">
                  Related project
                </Link>
              )}
            </div>
          </div>
        )}

        <section className="mt-14">
          <h2 className="text-xl font-semibold">The learning loop</h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {LOOP.map((item, i) => (
              <li key={item.step} className="surface p-4">
                <p className="font-mono text-xs text-accent">
                  {i + 1}. {item.step}
                </p>
                <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-semibold">Recommended course order</h2>
          <p className="mt-2 text-sm text-slate-400">
            Finish a course (or prove the skill) before treating the next one as current.
          </p>
          <ol className="mt-8 space-y-4">
            {steps.map((s, i) => (
              <li key={s.slug} className="surface flex gap-4 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line font-mono text-sm text-accent">
                  {s.status === "completed" ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/courses/${s.slug}`} className="font-medium text-white hover:text-accent">
                      {s.title}
                    </Link>
                    <span className="font-mono text-[11px] uppercase text-slate-500">
                      {s.level} · {s.status.replace("_", " ")}
                    </span>
                  </div>
                  {s.percent > 0 && (
                    <div className="mt-2">
                      <ProgressBar percent={s.percent} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
