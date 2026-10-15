import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Field, inputClass } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { ApiError, api } from "../services/api";

const DEMO = { email: "learner@cybercodelab.local", password: "LearnLab!2026" };

function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-wrap flex justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
        <div className="surface mt-8 p-6">{children}</div>
      </div>
    </div>
  );
}

export function SignInPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const next = params.get("next") || "/dashboard";

  return (
    <>
      <Seo title="Sign in" description="Sign in to CyberCode Lab." path="/signin" />
      <AuthShell title="Sign in" description="Your progress, labs, and certificates stay on this account.">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
              await refresh();
              navigate(next.startsWith("/") ? next : "/dashboard", { replace: true });
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Could not sign in.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {user && (
            <p className="text-sm text-teal-100">
              Already signed in as {user.fullName}.{" "}
              <Link className="text-accent" to="/dashboard">
                Open dashboard
              </Link>
            </p>
          )}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => {
              setEmail(DEMO.email);
              setPassword(DEMO.password);
            }}
          >
            Use demo learner account
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          <Link to="/forgot-password" className="text-accent">
            Forgot password
          </Link>
          {" · "}
          <Link to="/register" className="text-accent">
            Create an account
          </Link>
        </p>
      </AuthShell>
    </>
  );
}

export function RegisterPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verify, setVerify] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Seo title="Get started" description="Create a CyberCode Lab account." path="/register" />
      <AuthShell title="Get started" description="Password: 10+ characters, upper, lower, number, and a symbol.">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              const data = await api<{ verifyToken?: string }>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ fullName, email, password }),
              });
              await refresh();
              if (data.verifyToken) setVerify(data.verifyToken);
              else navigate("/dashboard", { replace: true });
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Could not register.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Full name">
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
        {verify && (
          <p className="mt-4 text-sm text-slate-300">
            Dev email verification:{" "}
            <Link className="text-accent" to={`/verify-email?token=${verify}`}>
              verify email
            </Link>
            {" · "}
            <Link className="text-accent" to="/dashboard">
              continue to dashboard
            </Link>
          </p>
        )}
        <p className="mt-4 text-sm text-slate-400">
          Already have an account?{" "}
          <Link className="text-accent" to="/signin">
            Sign in
          </Link>
        </p>
      </AuthShell>
    </>
  );
}

export function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Seo title="Reset password" description="Request a CyberCode Lab password reset." path="/forgot-password" />
      <AuthShell title="Reset password" description="We’ll send a reset link if that email exists.">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const data = await api<{ message: string; resetToken?: string }>("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
              });
              setMsg(data.message);
              setToken(data.resetToken ?? "");
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Could not send reset.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            Send reset
          </button>
          {msg && <p className="text-sm text-slate-400">{msg}</p>}
          {token && (
            <Link className="block text-sm text-accent" to={`/reset-password?token=${token}`}>
              Dev reset link
            </Link>
          )}
        </form>
      </AuthShell>
    </>
  );
}

export function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  return (
    <>
      <Seo title="Choose a new password" description="Set a new CyberCode Lab password." path="/reset-password" />
      <AuthShell title="New password">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
              setMsg("Password updated. You can sign in.");
              window.setTimeout(() => navigate("/signin"), 800);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Reset failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Password">
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {msg && <p className="text-sm text-accent">{msg}</p>}
          <button className="btn-primary w-full" disabled={busy || !token}>
            Update password
          </button>
        </form>
      </AuthShell>
    </>
  );
}

export function VerifyEmailPage() {
  const [msg, setMsg] = useState("Verifying…");
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  useEffect(() => {
    api(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setMsg("Email verified. You can continue learning."))
      .catch((e: Error) => setMsg(e.message));
  }, [token]);
  return (
    <>
      <Seo title="Verify email" description="Confirm your CyberCode Lab email." path="/verify-email" />
      <AuthShell title="Email verification">
        <p className="text-slate-400">{msg}</p>
        <Link to="/dashboard" className="btn-primary mt-6">
          Continue
        </Link>
      </AuthShell>
    </>
  );
}
