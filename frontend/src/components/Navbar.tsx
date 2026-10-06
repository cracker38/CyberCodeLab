import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/learn", label: "Learn" },
  { to: "/courses", label: "Courses" },
  { to: "/labs", label: "Labs" },
  { to: "/projects", label: "Projects" },
  { to: "/resources", label: "Resources" },
  { to: "/youtube", label: "YouTube" },
  { to: "/about", label: "About" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-accent/40 bg-ink-800 font-mono text-xs text-accent">
            CC
          </span>
          <span className="font-semibold tracking-tight">CyberCode Lab</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-1.5 text-sm ${isActive ? "bg-ink-800 text-white" : "text-slate-400 hover:text-white"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:text-white">
                Dashboard
              </Link>
              {(user.role === "ADMIN" || user.role === "INSTRUCTOR") && (
                <Link to="/admin" className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:text-white">
                  Admin
                </Link>
              )}
              <button
                className="rounded-md px-3 py-1.5 text-sm text-slate-400 hover:text-white"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:text-white">
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-teal-300"
              >
                Get Started
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
          Menu
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t border-line px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-slate-300"
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="px-2 py-2">
                  Dashboard
                </Link>
                <button
                  className="px-2 py-2 text-left"
                  onClick={async () => {
                    await logout();
                    setOpen(false);
                    navigate("/");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" onClick={() => setOpen(false)} className="px-2 py-2">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="px-2 py-2 text-accent">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
