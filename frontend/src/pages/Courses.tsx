import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { AsyncState, CardLink, Field, PageHeader, ProgressBar, inputClass } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { queryString } from "../lib/query";
import { api } from "../services/api";
import type { Course, Facets } from "../types";

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
        description="Structured cybersecurity courses: fundamentals, networking, Linux, Python, web security, and AI."
        path="/courses"
      />
      <div className="page-wrap py-12">
        <PageHeader kicker="Learn · Courses" title="Structured courses">
          <p>
            Each course is a sequence of lessons, exercises, and a quiz. Enroll to save progress. Finish the
            recommended order unless you already have that skill.
          </p>
        </PageHeader>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Field label="Search">
            <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or topic" />
          </Field>
          <Field label="Level">
            <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">All levels</option>
              {(facets.levels ?? []).map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
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
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {courses.map((c) => (
              <CardLink
                key={c.id}
                to={`/courses/${c.slug}`}
                title={c.title}
                meta={`${c.category} · ${c.level} · ${c.estimatedHours}h`}
                footer={
                  <div className="mt-4">
                    {c.enrolled ? (
                      <ProgressBar
                        percent={c.progressPercent ?? 0}
                        label={c.completed ? "Completed" : `${c.progressPercent ?? 0}% complete`}
                      />
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
        </AsyncState>
      </div>
    </>
  );
}
