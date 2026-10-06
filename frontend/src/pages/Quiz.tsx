import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

type Q = {
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    questions: { id: string; prompt: string; type: string; answers: { id: string; label: string }[] }[];
  };
  attempts: { id: string; score: number; passed: number; created_at: string }[];
};

export function QuizPage() {
  const { quizId } = useParams();
  const { user, loading } = useAuth();
  const [data, setData] = useState<Q | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    review: { questionId: string; correct: boolean; explanation: string | null }[];
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    api<Q>(`/api/quizzes/${quizId}`).then(setData);
  }, [quizId, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/signin" replace />;
  if (!data) return <p className="px-4 py-16 text-center text-slate-400">Loading quiz…</p>;

  const q = data.quiz.questions[index];
  const total = data.quiz.questions.length;

  const toggleMulti = (qid: string, aid: string) => {
    const cur = Array.isArray(selected[qid]) ? [...(selected[qid] as string[])] : [];
    const next = cur.includes(aid) ? cur.filter((x) => x !== aid) : [...cur, aid];
    setSelected({ ...selected, [qid]: next });
  };

  return (
    <>
      <Seo title={data.quiz.title} description="Assessment" path={`/quizzes/${quizId}`} />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold">{data.quiz.title}</h1>
        <p className="mt-1 text-sm text-slate-500">Passing score {data.quiz.passingScore}%</p>
        {!result && q && (
          <div className="mt-8 rounded-xl border border-line bg-ink-900 p-6">
            <p className="font-mono text-xs text-accent">
              Question {index + 1} / {total}
            </p>
            <p className="mt-3 text-lg">{q.prompt}</p>
            <div className="mt-6 space-y-2">
              {q.answers.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2 hover:bg-ink-800">
                  <input
                    type={q.type === "multiple" ? "checkbox" : "radio"}
                    name={q.id}
                    checked={
                      q.type === "multiple"
                        ? Array.isArray(selected[q.id]) && (selected[q.id] as string[]).includes(a.id)
                        : selected[q.id] === a.id
                    }
                    onChange={() =>
                      q.type === "multiple" ? toggleMulti(q.id, a.id) : setSelected({ ...selected, [q.id]: a.id })
                    }
                  />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                className="text-sm text-slate-400"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
              >
                Previous
              </button>
              {index < total - 1 ? (
                <button type="button" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950" onClick={() => setIndex((i) => i + 1)}>
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950"
                  onClick={async () => {
                    const r = await api<{
                      score: number;
                      passed: boolean;
                      review: { questionId: string; correct: boolean; explanation: string | null }[];
                    }>(`/api/quizzes/${data.quiz.id}/attempts`, {
                      method: "POST",
                      body: JSON.stringify({ answers: selected }),
                    });
                    setResult(r);
                  }}
                >
                  Submit answers
                </button>
              )}
            </div>
          </div>
        )}
        {result && (
          <div className="mt-8 rounded-xl border border-line bg-ink-900 p-6">
            <p className="text-2xl font-semibold">{result.score}%</p>
            <p className="mt-1 text-slate-400">{result.passed ? "Passed" : "Not yet — review and try again."}</p>
            <ul className="mt-6 space-y-4 text-sm">
              {result.review.map((r, i) => (
                <li key={r.questionId}>
                  <p className={r.correct ? "text-accent" : "text-amber-200"}>
                    Q{i + 1}: {r.correct ? "Correct" : "Incorrect"}
                  </p>
                  {r.explanation && <p className="text-slate-400">{r.explanation}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.attempts.length > 0 && (
          <div className="mt-10">
            <h2 className="font-semibold">Attempt history</h2>
            <ul className="mt-3 space-y-1 text-sm text-slate-400">
              {data.attempts.map((a) => (
                <li key={a.id}>
                  {a.score}% · {a.passed ? "pass" : "retry"} · {new Date(a.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
