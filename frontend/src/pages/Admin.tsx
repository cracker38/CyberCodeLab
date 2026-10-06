import { useEffect, useState } from "react";
import { AuthGate } from "../components/AuthGate";
import { Seo } from "../components/Seo";
import { StaffContentStudio, StatTile } from "../components/StaffStudio";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

type Stats = { users: number; courses: number; labs: number; certificates: number };
type Row = { id: string; email: string; full_name: string; role: string; enrollments: number; email_verified: number };
type Cert = { id: string; full_name: string; email: string; course_title: string; issued_at: string };

export function AdminPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <AdminWorkspace />
    </AuthGate>
  );
}

function AdminWorkspace() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"overview" | "people" | "content" | "certificates">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Row[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);

  useEffect(() => {
    api<Stats>("/api/admin/stats").then(setStats);
    api<{ users: Row[] }>("/api/admin/users").then((d) => setUsers(d.users));
    api<{ certificates: Cert[] }>("/api/admin/certificates").then((d) => setCerts(d.certificates));
  }, []);

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "people" as const, label: "People" },
    { id: "content" as const, label: "Catalog" },
    { id: "certificates" as const, label: "Certificates" },
  ];

  return (
    <>
      <Seo title="Admin workspace" description="CyberCode Lab administration." path="/admin" />
      <div className="px-4 py-8 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Administrator</p>
        <h1 className="mt-1 text-3xl font-semibold">Platform control</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Manage accounts, publish learning content, and review issued certificates. This workspace stays on{" "}
          <span className="font-mono text-slate-300">/admin</span>.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === t.id ? "bg-ink-800 text-white" : "text-slate-400 hover:text-white"}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && stats && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Members" value={stats.users} hint="Registered accounts" />
            <StatTile label="Courses" value={stats.courses} />
            <StatTile label="Labs" value={stats.labs} />
            <StatTile label="Certificates" value={stats.certificates} />
          </div>
        )}

        {tab === "overview" && (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="surface p-5">
              <h2 className="font-semibold">Recent members</h2>
              <ul className="mt-3 divide-y divide-line text-sm">
                {users.slice(0, 8).map((u) => (
                  <li key={u.id} className="flex items-center justify-between py-2">
                    <span>
                      {u.full_name}
                      <span className="ml-2 text-slate-500">{u.email}</span>
                    </span>
                    <span className="font-mono text-[11px] text-accent">{u.role}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface p-5">
              <h2 className="font-semibold">Operating notes</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
                <li>Signed in as {user?.fullName}. Role changes take effect on the member’s next request.</li>
                <li>Publish courses and labs from Catalog. Learners see published items in the public site.</li>
                <li>Do not use this console to test attacks against systems you do not own.</li>
              </ul>
            </div>
          </div>
        )}

        {tab === "people" && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="pr-3">Email</th>
                  <th className="pr-3">Role</th>
                  <th>Enrollments</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="py-3 pr-3">{u.full_name}</td>
                    <td className="pr-3 text-slate-400">{u.email}</td>
                    <td className="pr-3">
                      <select
                        className="rounded-md border border-line bg-ink-950 px-2 py-1 text-slate-200"
                        value={u.role}
                        onChange={async (e) => {
                          const role = e.target.value;
                          await api(`/api/admin/users/${u.id}/role`, {
                            method: "PATCH",
                            body: JSON.stringify({ role }),
                          });
                          setUsers(users.map((x) => (x.id === u.id ? { ...x, role } : x)));
                        }}
                      >
                        <option>USER</option>
                        <option>INSTRUCTOR</option>
                        <option>ADMIN</option>
                      </select>
                    </td>
                    <td className="tabular-nums">{u.enrollments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                      No certificates issued yet.
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
