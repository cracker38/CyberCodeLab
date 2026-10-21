import { useEffect, useState, type FormEvent } from "react";
import { ApiError, api } from "../services/api";
import { Field, inputClass } from "./ui";
import { newQuestion, QuestionEditor, type QuestionDraft } from "./QuizStudio";

type ExamSummary = {
  id: string;
  title: string;
  passing_score: number;
  course_title: string;
  course_slug: string;
  question_count: number;
};

type ExamDetails = ExamSummary & { questions: QuestionDraft[] };

export function ProfessionalExamManager() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState(80);
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [loading, setLoading] = useState(true);
  const [loadingExam, setLoadingExam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    api<{ exams: ExamSummary[] }>("/api/admin/professional-exams")
      .then(({ exams: rows }) => {
        if (!active) return;
        setExams(rows);
        setSelectedId(rows[0]?.id ?? "");
      })
      .catch((err: Error) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load professional exams.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setLoadingExam(true);
    setError("");
    setSuccess("");
    api<{ exam: ExamDetails }>(`/api/admin/professional-exams/${selectedId}`)
      .then(({ exam }) => {
        if (!active) return;
        setTitle(exam.title);
        setPassingScore(exam.passing_score);
        setQuestions(exam.questions.length ? exam.questions : [newQuestion()]);
      })
      .catch((err: Error) => {
        if (active) setError(err instanceof ApiError ? err.message : "Could not load this exam.");
      })
      .finally(() => {
        if (active) setLoadingExam(false);
      });
    return () => { active = false; };
  }, [selectedId]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await api<{ questionsUpdated: number }>(`/api/admin/professional-exams/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({ title, passingScore: Number(passingScore), questions }),
      });
      setExams((current) => current.map((exam) => exam.id === selectedId
        ? { ...exam, title, passing_score: Number(passingScore), question_count: result.questionsUpdated }
        : exam));
      setSuccess(`Exam saved with ${result.questionsUpdated} questions. Existing learner attempt scores remain in their history.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this exam.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="surface mb-6 p-5 sm:p-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Progression checkpoints</p>
        <h3 className="mt-1 text-lg font-semibold text-white">Edit professional exams</h3>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Update readiness and level exams for Ethical Pen Testing. Keep the existing title prefix so the correct learning level stays connected. Learner attempt scores are retained.
        </p>
      </div>

      {loading ? <p className="mt-5 text-sm text-slate-400">Loading exams…</p> : exams.length === 0 ? (
        <p className="mt-5 rounded-lg border border-line bg-ink-950/50 p-4 text-sm text-slate-400">
          No professional exams are available yet. Run the course seed once, then reopen this page.
        </p>
      ) : (
        <form className="mt-5 space-y-5" onSubmit={(event) => void save(event)}>
          <Field label="Exam to edit">
            <select className={inputClass} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.course_title} · {exam.title} ({exam.question_count} questions)
                </option>
              ))}
            </select>
          </Field>

          {loadingExam ? <p className="text-sm text-slate-400">Loading exam content…</p> : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Exam title">
                  <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={160} />
                  <span className="mt-1 block text-xs text-slate-500">The Entry Exam: or Level Exam: prefix is required for progression logic.</span>
                </Field>
                <Field label="Passing score (%)">
                  <input className={inputClass} type="number" value={passingScore} onChange={(event) => setPassingScore(Number(event.target.value))} min={1} max={100} required />
                </Field>
              </div>
              <QuestionEditor questions={questions} setQuestions={setQuestions} />
            </>
          )}

          {(error || success) && <p className={error ? "text-sm text-red-300" : "text-sm text-accent"} role={error ? "alert" : "status"}>{error || success}</p>}
          <button className="btn-primary" disabled={busy || loadingExam}>{busy ? "Saving exam…" : "Save exam changes"}</button>
        </form>
      )}
      {!loading && exams.length === 0 && error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
    </section>
  );
}
