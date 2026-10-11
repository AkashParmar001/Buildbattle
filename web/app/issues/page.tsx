import { Tags } from "lucide-react";

import { RoutePlaceholder } from "@/components/route-placeholder";

export default function IssuesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Track clusters as issues from open to resolved.
        </p>
      </div>
      <RoutePlaceholder
        title="Issue board lands here next"
        description="Open, in-progress, and resolved columns with notes — persisted so tracking survives a refresh."
        icon={Tags}
      />
    </div>
  );
}
