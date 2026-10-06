import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" description="The page you're looking for doesn't exist." path="/404" />
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-mono text-accent">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page Not Found</h1>
        <p className="mt-3 text-slate-400">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-8 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950">
          Return Home
        </Link>
      </div>
    </>
  );
}
