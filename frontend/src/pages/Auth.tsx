import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { Field, inputClass } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { ApiError, api } from "../services/api";

export function SignInPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("learner@cybercodelab.local");
  const [password, setPassword] = useState("LearnLab!2026");
  const [error, setError] = useState("");

  return (
    <>
      <Seo title="Sign in" description="Sign in to CyberCode Lab." path="/signin" />
      <form
        className="mx-auto max-w-md px-4 py-16"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
            await refresh();
            navigate("/dashboard");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not sign in.");
          }
        }}
      >
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <div className="mt-8 space-y-4">
          <Field label="Email">
            <input className={inputClass} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="btn-primary w-full">Sign in</button>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Demo learner: learner@cybercodelab.local / LearnLab!2026
        </p>
        <p className="mt-4 text-sm text-slate-400">
          <Link to="/forgot-password" className="text-accent">
            Forgot password
          </Link>
          {" · "}
          <Link to="/register" className="text-accent">
            Create an account
          </Link>
        </p>
      </form>
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

  return (
    <>
      <Seo title="Get started" description="Create a CyberCode Lab account." path="/register" />
      <form
        className="mx-auto max-w-md px-4 py-16"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            const data = await api<{ verifyToken?: string }>("/api/auth/register", {
              method: "POST",
              body: JSON.stringify({ fullName, email, password }),
            });
            await refresh();
            if (data.verifyToken) setVerify(data.verifyToken);
            else navigate("/dashboard");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not register.");
          }
        }}
      >
        <h1 className="text-3xl font-semibold">Get started</h1>
        <p className="mt-2 text-sm text-slate-400">Password: 10+ chars, upper, lower, number, symbol.</p>
        <div className="mt-8 space-y-4">
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
          <button className="btn-primary w-full">Create account</button>
        </div>
        {verify && (
          <p className="mt-4 text-sm text-slate-300">
            Dev email verification:{" "}
            <Link className="text-accent" to={`/verify-email?token=${verify}`}>
              verify email
            </Link>
          </p>
        )}
      </form>
    </>
  );
}

export function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");
  return (
    <>
      <Seo title="Reset password" description="Request a CyberCode Lab password reset." path="/forgot-password" />
      <form
        className="mx-auto max-w-md px-4 py-16"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = await api<{ message: string; resetToken?: string }>("/api/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
          });
          setMsg(data.message);
          setToken(data.resetToken ?? "");
        }}
      >
        <h1 className="text-3xl font-semibold">Reset password</h1>
        <div className="mt-8 space-y-4">
          <Field label="Email">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <button className="w-full rounded-md bg-accent py-2.5 text-sm font-semibold text-ink-950">Send reset</button>
          {msg && <p className="text-sm text-slate-400">{msg}</p>}
          {token && (
            <Link className="block text-sm text-accent" to={`/reset-password?token=${token}`}>
              Dev reset link
            </Link>
          )}
        </div>
      </form>
    </>
  );
}

export function ResetPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  return (
    <>
      <Seo title="Choose a new password" description="Set a new CyberCode Lab password." path="/reset-password" />
      <form
        className="mx-auto max-w-md px-4 py-16"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
            setMsg("Password updated. You can sign in.");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Reset failed.");
          }
        }}
      >
        <h1 className="text-3xl font-semibold">New password</h1>
        <div className="mt-8 space-y-4">
          <Field label="Password">
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {msg && <p className="text-sm text-accent">{msg}</p>}
          <button className="w-full rounded-md bg-accent py-2.5 text-sm font-semibold text-ink-950">Update password</button>
        </div>
      </form>
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
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-semibold">Email verification</h1>
      <p className="mt-4 text-slate-400">{msg}</p>
    </div>
  );
}
