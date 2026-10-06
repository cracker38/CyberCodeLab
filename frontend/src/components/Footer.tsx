import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-ink-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-semibold">CyberCode Lab</p>
          <p className="mt-1 font-mono text-xs text-accent">Learn. Code. Practice. Secure.</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Cybersecurity is not just something you read about. You learn it by understanding systems, writing code,
            practicing safely, and building.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-white">Learn</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <Link to="/learn">Roadmap</Link>
            </li>
            <li>
              <Link to="/courses">Courses</Link>
            </li>
            <li>
              <Link to="/labs">Labs</Link>
            </li>
            <li>
              <Link to="/projects">Projects</Link>
            </li>
            <li>
              <Link to="/resources">Resources</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-white">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/youtube">YouTube</Link>
            </li>
            <li>
              <Link to="/register">Get started</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-slate-500">
        Educational use in authorized environments only. © {new Date().getFullYear()} CyberCode Lab.
      </div>
    </footer>
  );
}
