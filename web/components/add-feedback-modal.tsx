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
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, category }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not save feedback.");
        return;
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
        className="inline-flex h-9 shrink-0 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
      >
        Add feedback
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="add-feedback-title"
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 backdrop:bg-black/40 open:flex open:flex-col dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        onClose={() => {
          setError(null);
          setSaving(false);
        }}
      >
        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
          <h2 id="add-feedback-title" className="text-base font-semibold tracking-tight">
            Add feedback
          </h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Review text
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              minLength={3}
              maxLength={2000}
              rows={4}
              placeholder="What did the customer say?"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
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
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-9 rounded-lg px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || text.trim().length < 3}
              className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
