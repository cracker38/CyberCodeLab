import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthGate } from "../components/AuthGate";
import { Seo } from "../components/Seo";
import { Empty, Field, ProgressBar, inputClass } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

type Dash = {
  stats: {
    coursesActive: number;
    lessonsCompleted: number;
    labsCompleted: number;
    quizzesCompleted: number;
    overallProgress: number;
  };
  continueLearning: {
    courseSlug: string;
    courseTitle: string;
    lessonSlug: string;
    lessonTitle: string;
  } | null;
  recentCourses: { slug: string; title: string; level: string; total: number; done: number }[];
  completedLabs: { slug: string; title: string; category: string }[];
  completedPath: string[];
  recommended: { slug: string; title: string; level: string; category: string }[];
  certificates: { id: string; course_title: string; issued_at: string }[];
  announcements: { title: string; body: string }[];
  achievements: string[];
};

export function DashboardPage() {
  const { user, loading, refresh } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setBio(user.bio ?? "");
    setName(user.fullName);
    api<Dash>("/api/progress/dashboard").then(setData);
  }, [user]);

  if (loading) return <p className="px-4 py-16 text-center text-slate-400">Loading…</p>;
  if (!user) {
    return (
      <AuthGate>
        <p className="px-4 py-16 text-center text-slate-400">Loading dashboard…</p>
      </AuthGate>
    );
  }
  if (!data) return <p className="px-4 py-16 text-center text-slate-400">Loading dashboard…</p>;

  return (
    <>
      <Seo title="Dashboard" description="Your CyberCode Lab learning progress." path="/dashboard" />
      <div className="page-wrap py-12">
        <h1 className="text-3xl font-semibold">Welcome back, {user.fullName.split(" ")[0]}.</h1>
        <p className="mt-1 font-mono text-xs text-accent">Learn. Code. Practice. Secure.</p>

        {data.continueLearning && (
          <div className="surface mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Continue learning</p>
              <p className="mt-1 font-semibold">{data.continueLearning.courseTitle}</p>
              <p className="text-sm text-slate-400">{data.continueLearning.lessonTitle}</p>
            </div>
            <Link
              className="btn-primary"
              to={`/courses/${data.continueLearning.courseSlug}/lessons/${data.continueLearning.lessonSlug}`}
            >
              Resume
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Courses" value={`${data.stats.coursesActive} active`} />
          <Stat label="Lessons" value={`${data.stats.lessonsCompleted} completed`} />
          <Stat label="Labs" value={`${data.stats.labsCompleted} completed`} />
          <Stat label="Quizzes" value={`${data.stats.quizzesCompleted} completed`} />
        </div>
        <div className="mt-6 max-w-xl">
          <ProgressBar percent={data.stats.overallProgress} label={`Overall progress: ${data.stats.overallProgress}%`} />
        </div>

        {data.completedPath.length > 0 && (
          <div className="surface mt-8 p-5 text-sm">
            <p className="font-medium">You completed</p>
            <ul className="mt-2 space-y-1 text-slate-400">
              {data.completedPath.map((t) => (
                <li key={t}>✓ {t}</li>
              ))}
            </ul>
            {data.recommended[0] && (
              <p className="mt-3">
                Recommended next:{" "}
                <Link className="text-accent" to={`/courses/${data.recommended[0].slug}`}>
                  {data.recommended[0].title}
                </Link>
              </p>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="font-semibold">Recent courses</h2>
            <ul className="mt-4 space-y-3">
              {data.recentCourses.length === 0 && (
                <Empty title="No enrollments yet" hint="Start with Cybersecurity Fundamentals." />
              )}
              {data.recentCourses.map((c) => (
                <li key={c.slug} className="surface p-4">
                  <Link to={`/courses/${c.slug}`} className="font-medium hover:text-accent">
                    {c.title}
                  </Link>
                  <div className="mt-2">
                    <ProgressBar percent={c.total ? Math.round((c.done / c.total) * 100) : 0} />
                  </div>
                </li>
              ))}
            </ul>
            <h2 className="mt-10 font-semibold">Recommended next</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {data.recommended.map((c) => (
                <li key={c.slug}>
                  →{" "}
                  <Link className="text-accent" to={`/courses/${c.slug}`}>
                    {c.title}
                  </Link>{" "}
                  <span className="text-slate-500">({c.level})</span>
                </li>
              ))}
            </ul>
          </section>
          <aside className="space-y-6">
            <div className="surface p-4">
              <h2 className="font-semibold">Achievements</h2>
              <ul className="mt-3 list-disc pl-5 text-sm text-slate-400">
                {data.achievements.length === 0 && <li>Complete a lesson to earn your first mark.</li>}
                {data.achievements.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="surface p-4">
              <h2 className="font-semibold">Completed labs</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.completedLabs.length === 0 && <li className="text-slate-500">No labs completed yet.</li>}
                {data.completedLabs.map((l) => (
                  <li key={l.slug}>
                    <Link className="text-slate-300 hover:text-accent" to={`/labs/${l.slug}`}>
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface p-4">
              <h2 className="font-semibold">Certificates</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.certificates.map((c) => (
                  <li key={c.id}>
                    <Link className="text-accent" to={`/certificates/${c.id}`}>
                      {c.course_title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <section className="mt-12 max-w-lg">
          <h2 className="font-semibold">Profile</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await api("/api/auth/profile", { method: "PATCH", body: JSON.stringify({ fullName: name, bio }) });
              await refresh();
              setSaved(true);
            }}
          >
            <Field label="Name">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Bio">
              <textarea className={inputClass} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
            <button className="btn-ghost">Save profile</button>
            {saved && <p className="text-sm text-accent">Profile saved.</p>}
          </form>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
