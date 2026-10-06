import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";
import { ApiError, api } from "../services/api";
import { Field, inputClass } from "./ui";

export function AuthGate({
  roles,
  children,
}: {
  roles?: Role[];
  children: ReactNode;
}) {
  const { user, loading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <p className="px-6 py-16 text-center text-sm text-slate-400">Loading session…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Sign in required</p>
        <h1 className="mt-2 text-2xl font-semibold">Stay on this page</h1>
        <p className="mt-2 text-sm text-slate-400">
          This URL does not change. Sign in here to continue — you will not be sent to another route.
        </p>
        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
              await refresh();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Could not sign in.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            Sign in
          </button>
        </form>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Access limited</h1>
        <p className="mt-2 text-sm text-slate-400">
          Signed in as {user.fullName} ({user.role}). This workspace is for {roles.join(" or ")} accounts.
        </p>
        <Link to="/dashboard" className="btn-ghost mt-6 inline-flex">
          Open learner dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
