import { Inbox } from "lucide-react";

import { RoutePlaceholder } from "@/components/route-placeholder";

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feedback</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Search, filter, and manage every piece of customer feedback.
        </p>
      </div>
      <RoutePlaceholder
        title="Feedback table lands here next"
        description="A paginated, searchable table with sentiment and topic classification, plus CSV import and manual submission."
        icon={Inbox}
      />
    </div>
  );
}
