import { useEffect, useState, type FormEvent } from "react";
import { Field, inputClass } from "./ui";
import { ApiError, api } from "../services/api";

type CourseOption = { id: string; title: string; slug: string; hasAssessment?: boolean };
type AnswerDraft = { label: string; correct: boolean };
type QuestionDraft = {
  prompt: string;
  type: "single" | "multiple";
  explanation: string;
  answers: AnswerDraft[];
};

function newQuestion(): QuestionDraft {
  return {
    prompt: "",
    type: "single",
    explanation: "",
    answers: [
      { label: "", correct: true },
      { label: "", correct: false },
    ],
  };
}

export function QuizStudio({ catalogVersion }: { catalogVersion: number }) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    setCourseLoading(true);
    api<{ courses: CourseOption[] }>("/api/courses")
      .then((result) => {
        if (active) {
          setCourses(result.courses);
          setCourseError("");
        }
      })
      .catch((err: Error) => {
        if (active) setCourseError(err.message || "Could not load courses.");
      })
      .finally(() => {
        if (active) setCourseLoading(false);
      });
    return () => {
      active = false;
    };
  }, [catalogVersion]);

  const updateQuestion = (questionIndex: number, patch: Partial<QuestionDraft>) => {
    setQuestions((current) => current.map((question, index) => index === questionIndex ? { ...question, ...patch } : question));
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, patch: Partial<AnswerDraft>) => {
    setQuestions((current) => current.map((question, index) => index === questionIndex
      ? { ...question, answers: question.answers.map((answer, optionIndex) => optionIndex === answerIndex ? { ...answer, ...patch } : answer) }
      : question));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const result = await api<{ questionsCreated: number }>("/api/admin/quizzes", {
        method: "POST",
        body: JSON.stringify({
          courseId: formData.get("courseId"),
          title: formData.get("quizTitle"),
          passingScore: Number(formData.get("passingScore")),
          questions,
        }),
      });
      setSuccess(`Assessment created with ${result.questionsCreated} question${result.questionsCreated === 1 ? "" : "s"}.`);
      setQuestions([newQuestion()]);
      form.reset();
      try {
        const updated = await api<{ courses: CourseOption[] }>("/api/courses");
        setCourses(updated.courses);
      } catch {
        setCourseError("Assessment created, but the course list could not refresh. Reload this page before creating another.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the assessment.");
    } finally {
      setBusy(false);
    }
  };

  const availableCourses = courses.filter((course) => !course.hasAssessment);

  return (
    <form className="surface space-y-5 p-5 sm:p-6" onSubmit={(event) => void submit(event)}>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Assessment builder</p>
        <h3 className="mt-1 text-lg font-semibold text-white">Create a course quiz</h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">Add one final assessment to a course. Correct answers stay on the server and are only revealed after submission.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course">
          <select className={inputClass} name="courseId" required disabled={courseLoading || availableCourses.length === 0}>
            <option value="">{courseLoading ? "Loading courses..." : "Choose a course"}</option>
            {courses.map((course) => <option key={course.id} value={course.id} disabled={course.hasAssessment}>{course.title}{course.hasAssessment ? " (assessment exists)" : ""}</option>)}
          </select>
          {courseError && <span className="mt-1 block text-xs text-red-300" role="alert">{courseError}</span>}
          {!courseLoading && !courseError && availableCourses.length === 0 && <span className="mt-1 block text-xs text-slate-500">Every course already has an assessment. Create another course first.</span>}
        </Field>
        <Field label="Assessment title">
          <input className={inputClass} name="quizTitle" required minLength={3} maxLength={160} placeholder="Course checkpoint" />
        </Field>
        <Field label="Passing score (%)">
          <input className={inputClass} name="passingScore" type="number" min={1} max={100} defaultValue={70} required />
        </Field>
      </div>

      <div className="space-y-4 border-t border-line pt-5">
        {questions.map((question, questionIndex) => (
          <section key={questionIndex} className="space-y-4 rounded-xl border border-line bg-ink-950/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-medium text-white">Question {questionIndex + 1}</h4>
              {questions.length > 1 && <button type="button" className="text-xs text-slate-500 hover:text-red-300" onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))}>Remove question</button>}
            </div>
            <Field label="Question prompt">
              <textarea className={inputClass} value={question.prompt} onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })} rows={2} required minLength={5} maxLength={1200} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Answer format">
                <select className={inputClass} value={question.type} onChange={(event) => {
                  const type = event.target.value as QuestionDraft["type"];
                  const answers = type === "single"
                    ? question.answers.map((answer, index) => ({ ...answer, correct: question.answers.some((item) => item.correct) ? index === question.answers.findIndex((item) => item.correct) : false }))
                    : question.answers;
                  updateQuestion(questionIndex, { type, answers });
                }}>
                  <option value="single">Choose one</option>
                  <option value="multiple">Choose all that apply</option>
                </select>
              </Field>
              <Field label="Explanation after submission">
                <input className={inputClass} value={question.explanation} onChange={(event) => updateQuestion(questionIndex, { explanation: event.target.value })} maxLength={2000} placeholder="Explain why the answer is correct." />
              </Field>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm text-slate-300">Answer choices <span className="text-xs text-slate-500">Select the correct {question.type === "multiple" ? "answers" : "answer"}.</span></legend>
              {question.answers.map((answer, answerIndex) => (
                <div key={answerIndex} className="flex items-center gap-3">
                  <input
                    type={question.type === "multiple" ? "checkbox" : "radio"}
                    name={`correct-answer-${questionIndex}`}
                    aria-label={`Mark answer ${answerIndex + 1} correct`}
                    checked={answer.correct}
                    onChange={() => {
                      if (question.type === "single") {
                        updateQuestion(questionIndex, { answers: question.answers.map((item, index) => ({ ...item, correct: index === answerIndex })) });
                      } else {
                        updateAnswer(questionIndex, answerIndex, { correct: !answer.correct });
                      }
                    }}
                  />
                  <input className={inputClass} value={answer.label} onChange={(event) => updateAnswer(questionIndex, answerIndex, { label: event.target.value })} required minLength={1} maxLength={500} aria-label={`Answer choice ${answerIndex + 1}`} />
                  {question.answers.length > 2 && <button type="button" className="shrink-0 text-xs text-slate-500 hover:text-red-300" aria-label={`Remove answer ${answerIndex + 1}`} onClick={() => updateQuestion(questionIndex, { answers: question.answers.filter((_, index) => index !== answerIndex) })}>Remove</button>}
                </div>
              ))}
              {question.answers.length < 8 && <button type="button" className="text-sm text-accent hover:text-teal-200" onClick={() => updateQuestion(questionIndex, { answers: [...question.answers, { label: "", correct: false }] })}>+ Add answer choice</button>}
            </fieldset>
          </section>
        ))}
        {questions.length < 50 && <button type="button" className="btn-ghost !px-3 !py-2 text-xs" onClick={() => setQuestions((current) => [...current, newQuestion()])}>Add question</button>}
      </div>

      {(error || success) && <p className={error ? "text-sm text-red-300" : "text-sm text-accent"} role={error ? "alert" : "status"}>{error || success}</p>}
      <button className="btn-primary" disabled={busy || courseLoading || availableCourses.length === 0}>{busy ? "Creating assessment..." : "Create assessment"}</button>
    </form>
  );
}
