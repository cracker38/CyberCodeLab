import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { Badge, CardLink } from "../components/ui";
import { api } from "../services/api";
import type { Course } from "../types";

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ courses: Course[] }>("/api/courses")
      .then((d) => setCourses(d.courses))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <Seo
        title="Courses"
        description="Structured cybersecurity courses for beginners and intermediate learners."
        path="/courses"
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Courses</h1>
        <p className="mt-2 text-slate-400">Content is managed in the database — not hardcoded into the UI.</p>
        {error && <p className="mt-6 text-red-300">{error}</p>}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <div key={c.id} className="relative">
              <CardLink to={`/courses/${c.slug}`} title={c.title} meta={c.category}>
                {c.subtitle ?? c.description}
              </CardLink>
              <div className="pointer-events-none absolute right-4 top-4">
                <Badge>{c.level}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
