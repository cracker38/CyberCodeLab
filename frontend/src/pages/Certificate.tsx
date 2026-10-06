import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { api } from "../services/api";

type Cert = {
  id: string;
  studentName: string;
  courseName: string;
  issuedAt: string;
  verificationUrl: string;
};

export function CertificatePage() {
  const { id } = useParams();
  const [cert, setCert] = useState<Cert | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ certificate: Cert }>(`/api/certificates/${id}`)
      .then((d) => setCert(d.certificate))
      .catch((e: Error) => setError(e.message));
  }, [id]);
  if (error) return <p className="px-4 py-16 text-center text-red-300">{error}</p>;
  if (!cert) return <p className="px-4 py-16 text-center text-slate-400">Loading certificate…</p>;
  return (
    <>
      <Seo title="Certificate" description="CyberCode Lab course certificate verification." path={`/verify/${cert.id}`} />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-accent/30 bg-ink-900 p-10 text-center shadow-card">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">CyberCode Lab</p>
          <p className="mt-2 text-sm text-slate-500">Learn. Code. Practice. Secure.</p>
          <h1 className="mt-8 text-3xl font-semibold">Certificate of completion</h1>
          <p className="mt-8 text-slate-400">This certifies that</p>
          <p className="mt-2 text-2xl font-semibold">{cert.studentName}</p>
          <p className="mt-6 text-slate-400">has completed</p>
          <p className="mt-2 text-xl">{cert.courseName}</p>
          <p className="mt-8 font-mono text-xs text-slate-500">
            {new Date(cert.issuedAt).toLocaleDateString()} · ID {cert.id}
          </p>
          <p className="mt-2 text-xs text-slate-500">Verify at {cert.verificationUrl}</p>
        </div>
      </div>
    </>
  );
}
