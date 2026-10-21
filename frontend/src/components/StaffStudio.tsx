import { useState } from "react";
import { Field, inputClass } from "./ui";
import { ApiError, api } from "../services/api";
import { QuizStudio } from "./QuizStudio";

type LessonDraft = {
  slug: string;
  title: string;
  content: string;
  codeExample: string;
  exercise: string;
  durationMinutes: number;
};

type ModuleDraft = { title: string; description: string; lessons: LessonDraft[] };

function newLesson(): LessonDraft {
  return { slug: "", title: "", content: "", codeExample: "", exercise: "", durationMinutes: 15 };
}

function newModule(): ModuleDraft {
  return { title: "", description: "", lessons: [newLesson()] };
}

export function StaffNotice({ children }: { children: string }) {
  return <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-teal-100">{children}</p>;
}

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function StaffContentStudio() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [modules, setModules] = useState<ModuleDraft[]>([newModule()]);
  const [catalogVersion, setCatalogVersion] = useState(0);

  async function submit(path: string, body: unknown, success: string, form: HTMLFormElement, afterSuccess?: () => void) {
    setError("");
    setMsg("");
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setMsg(success);
      form.reset();
      afterSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    }
  }

  return (
    <div className="space-y-6">
      <StaffNotice>
        YouTube on the public site is locked to the official @CyberCodeLab channel. Placeholder or third-party videos
        are removed automatically.
      </StaffNotice>
      {(msg || error) && (error ? <p className="text-sm text-red-300">{error}</p> : <StaffNotice>{msg}</StaffNotice>)}
      <div className="grid gap-6 xl:grid-cols-2">
        <form
          className="surface space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            void submit(
              "/api/admin/courses",
              {
                slug: fd.get("slug"),
                title: fd.get("title"),
                description: fd.get("description"),
                level: fd.get("level"),
                category: fd.get("category"),
                learningObjectives: lines(fd.get("objectives")),
                modules,
              },
              "Course and lesson outline created.",
              form,
              () => {
                setModules([newModule()]);
                setCatalogVersion((version) => version + 1);
              },
            );
          }}
        >
          <h3 className="font-semibold">New course</h3>
          <Field label="Slug">
            <input name="slug" className={inputClass} required placeholder="network-foundations" />
          </Field>
          <Field label="Title">
            <input name="title" className={inputClass} required />
          </Field>
          <Field label="Category">
            <input name="category" className={inputClass} required />
          </Field>
          <Field label="Level">
            <select name="level" className={inputClass}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </Field>
          <Field label="Description">
            <textarea name="description" className={inputClass} rows={3} required minLength={20} />
          </Field>
          <Field label="Objectives (one per line)">
            <textarea name="objectives" className={inputClass} rows={3} />
          </Field>
          <div className="space-y-4 border-t border-line pt-4">
            <div>
              <h4 className="font-medium text-white">Course outline</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Add at least one module and lesson. Lesson content supports Markdown; slugs use lowercase letters, numbers, and hyphens.</p>
            </div>
            {modules.map((module, moduleIndex) => (
              <section key={moduleIndex} className="space-y-3 rounded-lg border border-line bg-ink-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold text-accent">Module {moduleIndex + 1}</h5>
                  {modules.length > 1 && <button type="button" className="text-xs text-slate-500 hover:text-red-300" onClick={() => setModules((current) => current.filter((_, index) => index !== moduleIndex))}>Remove module</button>}
                </div>
                <Field label="Module title"><input className={inputClass} value={module.title} onChange={(e) => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, title: e.target.value } : item))} required minLength={2} maxLength={160} /></Field>
                <Field label="Module description"><input className={inputClass} value={module.description} onChange={(e) => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, description: e.target.value } : item))} maxLength={500} /></Field>
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={`${moduleIndex}-${lessonIndex}`} className="space-y-3 rounded-lg border border-line/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Lesson {lessonIndex + 1}</p>
                      {module.lessons.length > 1 && <button type="button" className="text-xs text-slate-500 hover:text-red-300" onClick={() => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, lessons: item.lessons.filter((_, lessonPosition) => lessonPosition !== lessonIndex) } : item))}>Remove lesson</button>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                      <Field label="Lesson slug"><input className={inputClass} value={lesson.slug} onChange={(e) => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, lessons: item.lessons.map((entry, position) => position === lessonIndex ? { ...entry, slug: e.target.value } : entry) } : item))} required pattern="[a-z0-9-]+" minLength={3} maxLength={80} placeholder="intro-to-security" /></Field>
                      <Field label="Lesson title"><input className={inputClass} value={lesson.title} onChange={(e) => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, lessons: item.lessons.map((entry, position) => position === lessonIndex ? { ...entry, title: e.target.value } : entry) } : item))} required minLength={3} maxLength={160} /></Field>
                    </div>
                    <Field label="Lesson content (Markdown)"><textarea className={`${inputClass} font-mono text-xs leading-relaxed`} value={lesson.content} onChange={(e) => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, lessons: item.lessons.map((entry, position) => position === lessonIndex ? { ...entry, content: e.target.value } : entry) } : item))} rows={6} required minLength={20} maxLength={30000} placeholder="## Concept\nExplain the idea, show a safe example, and describe when it is useful." /></Field>
                    <Field label="Code example"><textarea className={`${inputClass} font-mono text-xs`} value={lesson.codeExample} onChange={(e) => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, lessons: item.lessons.map((entry, position) => position === lessonIndex ? { ...entry, codeExample: e.target.value } : entry) } : item))} rows={3} maxLength={12000} /></Field>
                    <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                      <Field label="Exercise"><textarea className={inputClass} value={lesson.exercise} onChange={(e) => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, lessons: item.lessons.map((entry, position) => position === lessonIndex ? { ...entry, exercise: e.target.value } : entry) } : item))} rows={2} maxLength={4000} /></Field>
                      <Field label="Minutes"><input className={inputClass} type="number" min={1} max={180} value={lesson.durationMinutes} onChange={(e) => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, lessons: item.lessons.map((entry, position) => position === lessonIndex ? { ...entry, durationMinutes: Number(e.target.value) } : entry) } : item))} required /></Field>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-ghost !px-3 !py-2 text-xs" onClick={() => setModules((current) => current.map((item, index) => index === moduleIndex ? { ...item, lessons: [...item.lessons, newLesson()] } : item))}>Add lesson</button>
              </section>
            ))}
            <button type="button" className="btn-ghost !px-3 !py-2 text-xs" onClick={() => setModules((current) => [...current, newModule()])}>Add module</button>
          </div>
          <button className="btn-primary">Create course with outline</button>
        </form>

        <form
          className="surface space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void submit(
              "/api/admin/labs",
              {
                slug: fd.get("slug"),
                title: fd.get("title"),
                category: fd.get("category"),
                difficulty: fd.get("difficulty"),
                description: fd.get("description"),
                instructions: fd.get("instructions"),
                objectives: lines(fd.get("objectives")),
              },
              "Lab created.",
              e.currentTarget,
            );
          }}
        >
          <h3 className="font-semibold">New lab</h3>
          <Field label="Slug">
            <input name="slug" className={inputClass} required />
          </Field>
          <Field label="Title">
            <input name="title" className={inputClass} required />
          </Field>
          <Field label="Category">
            <input name="category" className={inputClass} required />
          </Field>
          <Field label="Difficulty">
            <select name="difficulty" className={inputClass}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </Field>
          <Field label="Description">
            <textarea name="description" className={inputClass} rows={2} required minLength={20} />
          </Field>
          <Field label="Instructions">
            <textarea name="instructions" className={inputClass} rows={3} required minLength={20} />
          </Field>
          <Field label="Objectives (one per line)">
            <textarea name="objectives" className={inputClass} rows={2} />
          </Field>
          <button className="btn-primary">Create lab</button>
        </form>

        <form
          className="surface space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void submit(
              "/api/admin/projects",
              {
                slug: fd.get("slug"),
                title: fd.get("title"),
                description: fd.get("description"),
                difficulty: fd.get("difficulty"),
                technologies: lines(fd.get("tech")),
                skills: lines(fd.get("skills")),
              },
              "Project created.",
              e.currentTarget,
            );
          }}
        >
          <h3 className="font-semibold">New project</h3>
          <Field label="Slug">
            <input name="slug" className={inputClass} required />
          </Field>
          <Field label="Title">
            <input name="title" className={inputClass} required />
          </Field>
          <Field label="Difficulty">
            <select name="difficulty" className={inputClass}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </Field>
          <Field label="Description">
            <textarea name="description" className={inputClass} rows={3} required minLength={20} />
          </Field>
          <Field label="Technologies (one per line)">
            <textarea name="tech" className={inputClass} rows={2} />
          </Field>
          <Field label="Skills (one per line)">
            <textarea name="skills" className={inputClass} rows={2} />
          </Field>
          <button className="btn-primary">Create project</button>
        </form>

        <form
          className="surface space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void submit(
              "/api/admin/resources",
              {
                slug: fd.get("slug"),
                title: fd.get("title"),
                type: fd.get("type"),
                category: fd.get("category"),
                summary: fd.get("summary"),
                body: fd.get("body"),
              },
              "Resource created.",
              e.currentTarget,
            );
          }}
        >
          <h3 className="font-semibold">New resource</h3>
          <Field label="Slug">
            <input name="slug" className={inputClass} required />
          </Field>
          <Field label="Title">
            <input name="title" className={inputClass} required />
          </Field>
          <Field label="Type">
            <input name="type" className={inputClass} required placeholder="Guide" />
          </Field>
          <Field label="Category">
            <input name="category" className={inputClass} required />
          </Field>
          <Field label="Summary">
            <textarea name="summary" className={inputClass} rows={2} required minLength={8} />
          </Field>
          <Field label="Body">
            <textarea name="body" className={inputClass} rows={4} required minLength={20} />
          </Field>
          <button className="btn-primary">Create resource</button>
        </form>

        <form
          className="surface space-y-3 p-5 xl:col-span-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void submit(
              "/api/admin/announcements",
              { title: fd.get("title"), body: fd.get("body") },
              "Announcement published.",
              e.currentTarget,
            );
          }}
        >
          <h3 className="font-semibold">Announcement</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title">
              <input name="title" className={inputClass} required />
            </Field>
            <Field label="Body">
              <textarea name="body" className={inputClass} rows={3} required minLength={8} />
            </Field>
          </div>
          <button className="btn-primary">Publish</button>
        </form>

        <div className="xl:col-span-2">
          <QuizStudio catalogVersion={catalogVersion} />
        </div>
      </div>
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="surface p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
