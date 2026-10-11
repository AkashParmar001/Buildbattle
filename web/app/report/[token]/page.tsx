import { RoutePlaceholder } from "@/components/route-placeholder";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Shared report
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A print-friendly snapshot of KPIs and top recommendations.
        </p>
      </div>
      <Card>
        <CardContent className="px-6 py-4">
          <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
            Share token
          </p>
          <p className="mt-1 font-mono text-sm break-all">{token}</p>
        </CardContent>
      </Card>
      <RoutePlaceholder
        title="Report content lands here next"
        description="The snapshotted KPIs, top recommendations, and charts for this share link — with PDF export and a methodology note."
        icon={FileText}
      />
    </div>
  );
}
