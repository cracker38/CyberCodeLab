import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const links = [
  { to: "/learn", label: "Learn" },
  { to: "/courses", label: "Courses" },
  { to: "/labs", label: "Labs" },
  { to: "/projects", label: "Projects" },
  { to: "/resources", label: "Resources" },
  { to: "/youtube", label: "YouTube" },
  { to: "/about", label: "About" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const studio = user?.role === "ADMIN" ? "/admin" : user?.role === "INSTRUCTOR" ? "/instructor" : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="CyberCode Lab home">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-accent/40 bg-ink-800 font-mono text-xs text-accent">
            CC
          </span>
          <span className="font-semibold tracking-tight">CyberCode Lab</span>
        </Link>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-1.5 text-sm transition ${
                  isActive ? "bg-ink-800 text-white" : "text-slate-400 hover:bg-ink-800/60 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:text-white"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full border border-accent/40 bg-ink-800 font-mono text-[10px] text-accent">
                  {initials(user.fullName) || "U"}
                </span>
                <span className="max-w-[9rem] truncate">{user.fullName.split(" ")[0]}</span>
              </Link>
              {studio && (
                <Link to={studio} className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:text-white">
                  {user.role === "ADMIN" ? "Admin" : "Instructor"}
                </Link>
              )}
              <button className="rounded-md px-3 py-1.5 text-sm text-slate-400 hover:text-white" onClick={() => void logout()}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:text-white">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary !px-3 !py-1.5">
                Get started
              </Link>
            </>
          )}
        </div>
        <button
          className="rounded-md border border-line px-3 py-1.5 text-sm lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div id="mobile-nav" className="relative z-50 border-t border-line bg-ink-950 px-4 py-3">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `rounded-md px-2 py-2.5 ${isActive ? "bg-ink-800 text-white" : "text-slate-300"}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="my-2 h-px bg-line" />
              {user ? (
                <>
                  <Link to="/dashboard" className="rounded-md px-2 py-2.5">
                    Dashboard
                  </Link>
                  {studio && (
                    <Link to={studio} className="rounded-md px-2 py-2.5">
                      {user.role === "ADMIN" ? "Admin" : "Instructor"}
                    </Link>
                  )}
                  <button
                    className="rounded-md px-2 py-2.5 text-left"
                    onClick={async () => {
                      await logout();
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/signin" className="rounded-md px-2 py-2.5">
                    Sign in
                  </Link>
                  <Link to="/register" className="rounded-md px-2 py-2.5 text-accent">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
