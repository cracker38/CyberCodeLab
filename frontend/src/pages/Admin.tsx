import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Field, inputClass } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

export function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"overview" | "users" | "content">("overview");
  const [stats, setStats] = useState<{ users: number; courses: number; labs: number; certificates: number } | null>(
    null,
  );
  const [users, setUsers] = useState<
    { id: string; email: string; full_name: string; role: string; enrollments: number }[]
  >([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) return;
    api<NonNullable<typeof stats>>("/api/admin/stats").then(setStats);
    if (user.role === "ADMIN") api<{ users: typeof users }>("/api/admin/users").then((d) => setUsers(d.users));
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
    return <p className="px-4 py-16 text-center text-slate-400">You do not have access to administration.</p>;
  }

  return (
    <>
      <Seo title="Admin" description="CyberCode Lab administration." path="/admin" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Administration</h1>
        <div className="mt-6 flex gap-2">
          {(["overview", "users", "content"] as const).map((t) => (
            <button
              key={t}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === t ? "bg-ink-800 text-white" : "text-slate-400"}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "overview" && stats && (
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <Tile label="Users" value={stats.users} />
            <Tile label="Courses" value={stats.courses} />
            <Tile label="Labs" value={stats.labs} />
            <Tile label="Certificates" value={stats.certificates} />
          </div>
        )}
        {tab === "users" && user.role === "ADMIN" && (
          <table className="mt-8 w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Enrollments</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-2">{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="bg-ink-950 text-slate-200"
                      value={u.role}
                      onChange={async (e) => {
                        await api(`/api/admin/users/${u.id}/role`, {
                          method: "PATCH",
                          body: JSON.stringify({ role: e.target.value }),
                        });
                        setUsers(users.map((x) => (x.id === u.id ? { ...x, role: e.target.value } : x)));
                      }}
                    >
                      <option>USER</option>
                      <option>INSTRUCTOR</option>
                      <option>ADMIN</option>
                    </select>
                  </td>
                  <td>{u.enrollments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "content" && (
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                await api("/api/admin/announcements", {
                  method: "POST",
                  body: JSON.stringify({
                    title: fd.get("title"),
                    body: fd.get("body"),
                  }),
                });
                setMsg("Announcement published.");
                form.reset();
              }}
            >
              <h2 className="font-semibold">Announcement</h2>
              <Field label="Title">
                <input name="title" className={inputClass} required />
              </Field>
              <Field label="Body">
                <textarea name="body" className={inputClass} rows={4} required />
              </Field>
              <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950">Publish</button>
            </form>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await api("/api/admin/courses", {
                  method: "POST",
                  body: JSON.stringify({
                    slug: fd.get("slug"),
                    title: fd.get("title"),
                    description: fd.get("description"),
                    level: fd.get("level"),
                    category: fd.get("category"),
                    learningObjectives: String(fd.get("objectives") ?? "")
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }),
                });
                setMsg("Course created. Add modules via seed or a follow-up admin screen.");
                e.currentTarget.reset();
              }}
            >
              <h2 className="font-semibold">New course</h2>
              <Field label="Slug">
                <input name="slug" className={inputClass} required placeholder="example-course" />
              </Field>
              <Field label="Title">
                <input name="title" className={inputClass} required />
              </Field>
              <Field label="Category">
                <input name="category" className={inputClass} required />
              </Field>
              <Field label="Level">
                <select name="level" className={inputClass}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </Field>
              <Field label="Description">
                <textarea name="description" className={inputClass} rows={3} required />
              </Field>
              <Field label="Objectives (one per line)">
                <textarea name="objectives" className={inputClass} rows={3} />
              </Field>
              <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950">Create course</button>
            </form>
            {msg && <p className="text-sm text-accent md:col-span-2">{msg}</p>}
          </div>
        )}
      </div>
    </>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-ink-900 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
