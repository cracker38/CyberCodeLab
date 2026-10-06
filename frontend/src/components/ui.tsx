import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div>
      {label && <p className="mb-1 text-xs text-slate-400">{label}</p>}
      <div
        className="h-2 overflow-hidden rounded-full bg-ink-700"
        role="progressbar"
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-accent" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-line bg-ink-800 px-2 py-0.5 text-xs text-slate-300">{children}</span>
  );
}

export function CardLink({
  to,
  title,
  children,
  meta,
  footer,
}: {
  to: string;
  title: string;
  children: string;
  meta?: string;
  footer?: ReactNode;
}) {
  return (
    <Link to={to} className="surface block p-5 transition hover:border-accent/40">
      {meta && <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-accent">{meta}</p>}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{children}</p>
      {footer}
    </Link>
  );
}

export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-3xl">
      {kicker && <p className="font-mono text-xs uppercase tracking-widest text-accent">{kicker}</p>}
      <h1 className={`${kicker ? "mt-2" : ""} text-3xl font-semibold`}>{title}</h1>
      {children && <div className="mt-3 text-slate-400">{children}</div>}
    </header>
  );
}

export function AsyncState({
  loading,
  error,
  empty,
  emptyHint,
  children,
  hasItems,
}: {
  loading: boolean;
  error: string;
  empty: string;
  emptyHint?: string;
  hasItems: boolean;
  children: ReactNode;
}) {
  if (loading) return <p className="mt-8 text-slate-400">Loading…</p>;
  if (error) return <p className="mt-8 text-red-300">{error}</p>;
  if (!hasItems) return <div className="mt-8"><Empty title={empty} hint={emptyHint} /></div>;
  return <>{children}</>;
}

export function Notice({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{children}</p>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-ink-950 px-3 py-2 text-sm text-white placeholder:text-slate-600";

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="surface px-5 py-8 text-center">
      <p className="font-medium text-white">{title}</p>
      {hint && <p className="mt-2 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}
