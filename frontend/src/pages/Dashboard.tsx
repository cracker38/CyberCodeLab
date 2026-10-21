import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AuthGate } from "../components/AuthGate";
import { Seo } from "../components/Seo";
import { Empty, Field, ProgressBar, inputClass } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { ApiError, api } from "../services/api";

type Dash = {
  stats: {
    coursesActive: number;
    lessonsCompleted: number;
    labsCompleted: number;
    quizzesCompleted: number;
    overallProgress: number;
    overallLessons: number;
    overallLessonsDone: number;
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
  const { user, loading: authLoading, refresh } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api<Dash>("/api/progress/dashboard");
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your dashboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setBio(user.bio ?? "");
    setName(user.fullName);
    void loadDashboard();
  }, [user?.id, loadDashboard]);

  if (authLoading) return <PageLoading text="Loading your session…" />;
  if (!user) {
    return (
      <AuthGate>
        <PageLoading text="Loading your dashboard…" />
      </AuthGate>
    );
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError("");
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await api("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ fullName: name, bio }),
      });
      await refresh();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Your profile could not be saved.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <PageLoading text="Loading your dashboard…" />;
  if (error || !data) {
    return (
      <>
        <Seo title="Dashboard" description="Your CyberCode Lab learning progress." path="/dashboard" />
        <div className="page-wrap py-16">
          <div className="surface mx-auto max-w-xl p-8 text-center" role="alert">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">Dashboard unavailable</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">We couldn’t load your learning data.</h1>
            <p className="mt-2 text-sm text-slate-400">{error || "Try again in a moment."}</p>
            <button className="btn-primary mt-6" onClick={() => void loadDashboard()}>
              Try again
            </button>
          </div>
        </div>
      </>
    );
  }

  const firstName = user.fullName.trim().split(/\s+/)[0] || "Learner";

  return (
    <>
      <Seo title="Dashboard" description="Your CyberCode Lab learning progress." path="/dashboard" />
      <div className="page-wrap py-10 sm:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Learner workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-2 text-sm text-slate-400">A clear view of what you’ve learned and what comes next.</p>
          </div>
          <Link className="btn-ghost" to="/learn">Open learning roadmap</Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Learning statistics">
          <Stat label="Active courses" value={data.stats.coursesActive} detail="Courses you’ve started" mark="01" />
          <Stat label="Lessons completed" value={data.stats.lessonsCompleted} detail="Across your learning path" mark="02" />
          <Stat label="Labs completed" value={data.stats.labsCompleted} detail="Hands-on practice" mark="03" />
          <Stat label="Quizzes passed" value={data.stats.quizzesCompleted} detail="Successful assessments" mark="04" />
        </section>

        <section className="surface relative mt-6 overflow-hidden p-5 sm:p-7" aria-label="Overall course progress">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400">Your learning progress</p>
              <p className="mt-2 text-3xl font-semibold text-white">{data.stats.overallProgress}%</p>
              <div className="mt-4 max-w-2xl">
                <ProgressBar percent={data.stats.overallProgress} label="Progress through courses you’ve enrolled in" />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {data.stats.overallLessonsDone} of {data.stats.overallLessons} enrolled course lessons completed
              </p>
            </div>
            <Link className="btn-primary" to={data.continueLearning ? `/courses/${data.continueLearning.courseSlug}/lessons/${data.continueLearning.lessonSlug}` : "/courses"}>
              {data.continueLearning ? "Continue learning" : "Explore courses"}
            </Link>
          </div>
        </section>

        {data.continueLearning && (
          <section className="mt-6 rounded-xl border border-accent/25 bg-gradient-to-r from-accent/10 via-ink-900 to-ink-900 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6" aria-label="Continue learning">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Pick up where you left off</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{data.continueLearning.courseTitle}</h2>
              <p className="mt-1 text-sm text-slate-400">{data.continueLearning.lessonTitle}</p>
            </div>
            <Link className="btn-primary mt-4 sm:mt-0" to={`/courses/${data.continueLearning.courseSlug}/lessons/${data.continueLearning.lessonSlug}`}>
              Resume lesson <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </section>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
          <div className="space-y-10">
            <section>
              <SectionHeading title="Your courses" action={<Link className="text-sm text-accent hover:text-teal-200" to="/courses">Browse catalog →</Link>} />
              {data.recentCourses.length === 0 ? (
                <div className="mt-4"><Empty title="Your learning path starts here" hint="Enroll in a course to save progress and get a personalized next step." /><div className="mt-4 text-center"><Link className="btn-primary" to="/courses">Explore courses</Link></div></div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {data.recentCourses.map((course) => {
                    const percent = course.total ? Math.round((course.done / course.total) * 100) : 0;
                    return (
                      <Link key={course.slug} to={`/courses/${course.slug}`} className="surface group p-5 transition hover:-translate-y-0.5 hover:border-accent/40">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">{course.level}</p>
                            <h3 className="mt-2 font-semibold text-white group-hover:text-accent">{course.title}</h3>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-slate-300">{percent}%</span>
                        </div>
                        <div className="mt-4"><ProgressBar percent={percent} /></div>
                        <p className="mt-2 text-xs text-slate-500">{course.done} of {course.total} lessons</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <SectionHeading title="Recommended next" />
              {data.recommended.length === 0 ? (
                <div className="mt-4"><Empty title="You’re up to date" hint="Check the catalog for a new course or revisit a completed course." /></div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {data.recommended.slice(0, 4).map((course, index) => (
                    <Link key={course.slug} to={`/courses/${course.slug}`} className="surface flex gap-4 p-4 transition hover:border-accent/40">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-ink-800 font-mono text-xs text-accent">0{index + 1}</span>
                      <span className="min-w-0"><span className="block font-medium text-white">{course.title}</span><span className="mt-1 block text-xs text-slate-500">{course.category} · {course.level}</span></span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {data.announcements.length > 0 && (
              <section>
                <SectionHeading title="Updates from the lab" />
                <div className="mt-4 space-y-3">
                  {data.announcements.map((item, index) => <article key={`${item.title}-${index}`} className="surface p-4"><h3 className="font-medium text-white">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p></article>)}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <section className="surface p-5">
              <SectionHeading title="Achievements" />
              {data.achievements.length === 0 ? <p className="mt-3 text-sm text-slate-500">Complete a lesson, lab, or quiz to earn your first achievement.</p> : (
                <ul className="mt-4 space-y-3">
                  {data.achievements.map((achievement) => <li key={achievement} className="flex items-center gap-3 text-sm text-slate-300"><span className="grid h-7 w-7 place-items-center rounded-full bg-accent/10 text-accent" aria-hidden="true">✓</span>{achievement}</li>)}
                </ul>
              )}
            </section>

            <section className="surface p-5">
              <SectionHeading title="Completed labs" />
              {data.completedLabs.length === 0 ? <p className="mt-3 text-sm text-slate-500">Your completed labs will show up here.</p> : (
                <ul className="mt-3 space-y-3">{data.completedLabs.map((lab) => <li key={lab.slug}><Link className="font-medium text-slate-200 hover:text-accent" to={`/labs/${lab.slug}`}>{lab.title}</Link><span className="mt-1 block text-xs text-slate-500">{lab.category}</span></li>)}</ul>
              )}
              <Link to="/labs" className="mt-4 inline-block text-sm text-accent">Explore labs →</Link>
            </section>

            <section className="surface p-5">
              <SectionHeading title="Certificates" />
              {data.certificates.length === 0 ? <p className="mt-3 text-sm text-slate-500">Finish every lesson in a course to earn a certificate.</p> : (
                <ul className="mt-3 space-y-3">{data.certificates.map((certificate) => <li key={certificate.id}><Link className="font-medium text-slate-200 hover:text-accent" to={`/certificates/${certificate.id}`}>{certificate.course_title}</Link><span className="mt-1 block text-xs text-slate-500">Issued {new Date(certificate.issued_at).toLocaleDateString()}</span></li>)}</ul>
              )}
            </section>
          </aside>
        </div>

        <section className="surface mt-10 max-w-3xl p-5 sm:p-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Account</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Your profile</h2>
            <p className="mt-1 text-sm text-slate-400">Keep your learner details up to date.</p>
          </div>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void saveProfile(event)}>
            <Field label="Full name">
              <input className={inputClass} value={name} onChange={(event) => { setName(event.target.value); setProfileSaved(false); }} maxLength={80} minLength={2} required autoComplete="name" />
            </Field>
            <Field label="Email">
              <input className={`${inputClass} opacity-70`} value={user.email} readOnly aria-describedby="profile-email-note" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="About you">
                <textarea className={inputClass} rows={3} value={bio} onChange={(event) => { setBio(event.target.value); setProfileSaved(false); }} maxLength={500} placeholder="Share what you’re learning or working toward." />
              </Field>
              <p id="profile-email-note" className="mt-1 text-xs text-slate-500">Your email address is used for sign in and can’t be changed here.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button className="btn-primary" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save profile"}</button>
              {profileSaved && <p className="text-sm text-accent" role="status">Profile saved.</p>}
              {profileError && <p className="text-sm text-red-300" role="alert">{profileError}</p>}
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

function PageLoading({ text }: { text: string }) {
  return <p className="px-4 py-16 text-center text-sm text-slate-400" role="status">{text}</p>;
}

function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-white">{title}</h2>{action}</div>;
}

function Stat({ label, value, detail, mark }: { label: string; value: number; detail: string; mark: string }) {
  return (
    <div className="surface relative overflow-hidden p-4 sm:p-5">
      <span aria-hidden="true" className="absolute right-4 top-4 font-mono text-[10px] text-slate-600">{mark}</span>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
