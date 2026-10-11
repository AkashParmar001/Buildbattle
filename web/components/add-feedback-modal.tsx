"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type AddFeedbackModalProps = {
  categories: string[];
};

export function AddFeedbackModal({ categories }: AddFeedbackModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setSaving(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, category }),
      });
      const json = (await res.json()) as {
        error?: string;
        merged?: boolean;
        llmFallback?: boolean;
      };
      if (!res.ok) {
        setError(json.error ?? "Could not save feedback.");
        return;
      }
      if (json.merged) {
        setStatus("Duplicate merged into the existing review (+1 volume).");
      } else if (json.llmFallback) {
        setStatus("Saved — LLM was unavailable, classified as neutral/unclustered.");
      } else {
        setStatus("Saved.");
      }
      setText("");
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-9 shrink-0 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Add feedback
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="add-feedback-title"
        className="w-full max-w-md rounded-xl border border-border bg-card p-0 text-foreground backdrop:bg-black/40 open:flex open:flex-col"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        onClose={() => {
          setError(null);
          setStatus(null);
          setSaving(false);
        }}
      >
        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
          <h2 id="add-feedback-title" className="text-base font-semibold tracking-tight">
            Add feedback
          </h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Review text
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              placeholder="What did the customer say?"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
          {!error && status && (
            <p role="status" className="text-sm text-muted-foreground">
              {status}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-9 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || text.trim().length < 10}
              className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
