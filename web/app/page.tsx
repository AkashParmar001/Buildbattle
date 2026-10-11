import { LayoutDashboard } from "lucide-react";

import { RoutePlaceholder } from "@/components/route-placeholder";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          KPIs, sentiment, top issues, and the 12-week trend — all filterable.
        </p>
      </div>
      <RoutePlaceholder
        title="Dashboard charts land here next"
        description="KPI cards, a sentiment donut, top-issues chart, and the simulated 12-week trend line will plug into the shared analytics layer."
        icon={LayoutDashboard}
      />
    </div>
  );
}
