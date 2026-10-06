import { useState } from "react";
import { Field, inputClass } from "./ui";
import { ApiError, api } from "../services/api";

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

  async function submit(path: string, body: unknown, success: string, form: HTMLFormElement) {
    setError("");
    setMsg("");
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setMsg(success);
      form.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    }
  }

  return (
    <div className="space-y-6">
      {(msg || error) && (error ? <p className="text-sm text-red-300">{error}</p> : <StaffNotice>{msg}</StaffNotice>)}
      <div className="grid gap-6 xl:grid-cols-2">
        <form
          className="surface space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void submit(
              "/api/admin/courses",
              {
                slug: fd.get("slug"),
                title: fd.get("title"),
                description: fd.get("description"),
                level: fd.get("level"),
                category: fd.get("category"),
                learningObjectives: lines(fd.get("objectives")),
              },
              "Course created.",
              e.currentTarget,
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
          <button className="btn-primary">Create course</button>
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
