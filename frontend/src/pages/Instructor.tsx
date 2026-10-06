import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthGate } from "../components/AuthGate";
import { Seo } from "../components/Seo";
import { StaffContentStudio, StatTile } from "../components/StaffStudio";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

type Stats = { users: number; courses: number; labs: number; certificates: number };
type Course = { slug: string; title: string; level: string; category: string };
type Cert = { id: string; full_name: string; email: string; course_title: string; issued_at: string };

export function InstructorPage() {
  return (
    <AuthGate roles={["ADMIN", "INSTRUCTOR"]}>
      <InstructorWorkspace />
    </AuthGate>
  );
}

function InstructorWorkspace() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"overview" | "content" | "certificates">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);

  useEffect(() => {
    api<Stats>("/api/admin/stats").then(setStats);
    api<{ courses: Course[] }>("/api/courses").then((d) => setCourses(d.courses));
    api<{ certificates: Cert[] }>("/api/admin/certificates").then((d) => setCerts(d.certificates));
  }, []);

  return (
    <>
      <Seo title="Instructor workspace" description="Teach and publish on CyberCode Lab." path="/instructor" />
      <div className="px-4 py-8 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Instructor</p>
        <h1 className="mt-1 text-3xl font-semibold">Teaching console</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Publish courses, labs, and announcements. You remain on{" "}
          <span className="font-mono text-slate-300">/instructor</span> — the public catalog is unchanged until you
          create content.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["overview", "Overview"],
              ["content", "Publish"],
              ["certificates", "Certificates"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === id ? "bg-ink-800 text-white" : "text-slate-400 hover:text-white"}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && stats && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatTile label="Courses live" value={stats.courses} />
              <StatTile label="Labs live" value={stats.labs} />
              <StatTile label="Certificates" value={stats.certificates} hint="Issued to learners" />
            </div>
            <div className="mt-8 surface p-5">
              <h2 className="font-semibold">Hello, {user?.fullName.split(" ")[0]}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Use Publish to add catalog items. Open a course below to review it as a learner would — that uses
                in-app links, not a full-page redirect.
              </p>
              <ul className="mt-4 divide-y divide-line">
                {courses.map((c) => (
                  <li key={c.slug} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>
                      {c.title}
                      <span className="ml-2 text-slate-500">
                        {c.category} · {c.level}
                      </span>
                    </span>
                    <Link className="text-accent" to={`/courses/${c.slug}`}>
                      Open course
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {tab === "content" && (
          <div className="mt-8">
            <StaffContentStudio />
          </div>
        )}

        {tab === "certificates" && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Learner</th>
                  <th className="pr-3">Course</th>
                  <th>Issued</th>
                </tr>
              </thead>
              <tbody>
                {certs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No certificates yet.
                    </td>
                  </tr>
                )}
                {certs.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="py-3 pr-3">
                      {c.full_name}
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </td>
                    <td className="pr-3">{c.course_title}</td>
                    <td className="text-slate-400">{new Date(c.issued_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
