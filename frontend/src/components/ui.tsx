import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div>
      {label && <p className="mb-1 text-xs text-slate-400">{label}</p>}
      <div className="h-2 overflow-hidden rounded-full bg-ink-700" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${p}%` }} />
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
}: {
  to: string;
  title: string;
  children: string;
  meta?: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-line bg-ink-900 p-5 shadow-card transition hover:border-accent/40"
    >
      {meta && <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-accent">{meta}</p>}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{children}</p>
    </Link>
  );
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
