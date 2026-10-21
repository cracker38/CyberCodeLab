import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { AsyncState, CardLink, Field, PageHeader, ProgressBar, inputClass } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { queryString } from "../lib/query";
import { api } from "../services/api";
import type { Course, Facets } from "../types";

const COURSE_LEVELS = [
  {
    value: "Beginner",
    title: "Basic · Beginner",
    description: "Start with cybersecurity, networking, and Linux foundations. No prior security experience is expected.",
  },
  {
    value: "Intermediate",
    title: "Intermediate",
    description: "Build on the fundamentals with coding, web security, cloud, defensive operations, and secure development.",
  },
  {
    value: "Advanced",
    title: "Advanced",
    description: "Apply deeper investigation and engineering skills to forensics, incident response, and secure delivery.",
  },
] as const;

export function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [facets, setFacets] = useState<Facets>({ levels: [], categories: [] });
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const search = useDebouncedValue(q);

  const courseGroups = COURSE_LEVELS.map((group) => ({
    ...group,
    courses: courses.filter((course) => course.level === group.value),
  })).filter((group) => group.courses.length > 0);

  useEffect(() => {
    setLoading(true);
    api<{ courses: Course[]; facets: Facets }>(`/api/courses${queryString({ q: search, level, category })}`)
      .then((d) => {
        setCourses(d.courses);
        setFacets(d.facets ?? { levels: [], categories: [] });
        setError("");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, level, category, user]);

  return (
    <>
      <Seo
        title="Courses"
        description="Explore structured cybersecurity courses in ethical penetration testing, secure development, blue-team operations, cloud security, forensics, DevSecOps, privacy, and more."
        path="/courses"
      />
      <div className="page-wrap py-12">
        <PageHeader kicker="Learn · Courses" title="Structured courses">
          <p>
            Build skills across defensive operations, cloud, secure software, forensics, and governance. Courses include
            organized modules, focused lessons, practical exercises, and knowledge checks. Follow the levels from basic
            beginner foundations through intermediate practice to advanced specializations. Sign in to save progress.
          </p>
        </PageHeader>
        <div className="mt-8 overflow-x-auto pb-1" role="group" aria-label="Filter courses by level">
          <div className="flex w-max min-w-full gap-2">
            <button
              type="button"
              aria-pressed={!level}
              onClick={() => setLevel("")}
              className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${!level ? "border-accent bg-accent text-ink-950" : "border-line bg-ink-900/70 text-slate-300 hover:border-accent/50 hover:text-white"}`}
            >
              All
            </button>
            {COURSE_LEVELS.map((courseLevel) => (
              <button
                key={courseLevel.value}
                type="button"
                aria-label={courseLevel.value === "Beginner" ? "Basic (Beginner)" : courseLevel.value}
                aria-pressed={level === courseLevel.value}
                onClick={() => setLevel(courseLevel.value)}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${level === courseLevel.value ? "border-accent bg-accent text-ink-950" : "border-line bg-ink-900/70 text-slate-300 hover:border-accent/50 hover:text-white"}`}
              >
                {courseLevel.value === "Beginner" ? "Basic" : courseLevel.value}
              </button>
            ))}
          </div>
        </div>
        <div className="surface mt-4 grid gap-4 p-4 md:grid-cols-2">
          <Field label="Search">
            <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or topic" />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {(facets.categories ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <AsyncState
          loading={loading}
          error={error}
          hasItems={courses.length > 0}
          empty="No courses match those filters"
          emptyHint="Clear the search or pick another category."
        >
          <div className="mt-8 space-y-10">
            {courseGroups.map((group) => (
              <section key={group.value} aria-labelledby={`level-${group.value.toLowerCase()}`}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 id={`level-${group.value.toLowerCase()}`} className="text-xl font-semibold text-white">
                      {group.title}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-400">{group.description}</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    {group.courses.length} {group.courses.length === 1 ? "course" : "courses"}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.courses.map((c) => (
                    <CardLink
                      key={c.id}
                      to={`/courses/${c.slug}`}
                      title={c.title}
                      meta={`${c.category} · ${group.title} · ${c.estimatedHours}h`}
                      footer={
                        <div className="mt-4">
                          {c.enrolled ? (
                            <>
                              <ProgressBar
                                percent={c.progressPercent ?? 0}
                                label={c.completed
                                  ? `Completed · ${c.lessonCount ?? 0} lessons`
                                  : `${c.lessonsCompleted ?? 0} of ${c.lessonCount ?? 0} lessons · ${c.progressPercent ?? 0}% complete`}
                              />
                              {(c.lessonsStarted ?? 0) > 0 && !c.completed && (
                                <p className="mt-2 text-xs text-amber-200">{c.lessonsStarted} lesson{c.lessonsStarted === 1 ? "" : "s"} in progress</p>
                              )}
                            </>
                          ) : (
                            <p className="font-mono text-[11px] text-slate-500">
                              {c.lessonCount ? `${c.lessonCount} lessons` : "Open to view the syllabus"}
                            </p>
                          )}
                        </div>
                      }
                    >
                      {c.subtitle ?? c.description}
                    </CardLink>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </AsyncState>
      </div>
    </>
  );
}
