import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function StaffLayout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isStaff = isAdmin || user?.role === "INSTRUCTOR";

  const items = [
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
    ...(isStaff ? [{ to: "/instructor", label: "Instructor" }] : []),
    { to: "/dashboard", label: "Learner view" },
    { to: "/courses", label: "Catalog" },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-ink-900 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-accent/40 bg-ink-800 font-mono text-xs text-accent">
            CC
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">CyberCode Lab</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
              {user?.role === "ADMIN" ? "Administration" : "Instruction"}
            </p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible" aria-label="Workspace">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin" || item.to === "/instructor"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-ink-800 text-white" : "text-slate-400 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-line px-5 py-4 lg:block">
          <p className="truncate text-sm text-slate-200">{user?.fullName ?? "Signed out"}</p>
          <p className="truncate font-mono text-[11px] text-slate-500">{user?.email}</p>
          {user && (
            <button
              className="mt-3 text-xs text-slate-400 hover:text-white"
              onClick={() => void logout()}
            >
              Sign out
            </button>
          )}
        </div>
      </aside>
      <div className="min-w-0 bg-ink-950">
        <Outlet />
      </div>
    </div>
  );
}
