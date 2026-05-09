import { AppShell } from "@/components/shared/app-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PriorityAlerts } from "@/components/dashboard/priority-alerts";
import { SolutionOverview } from "@/components/dashboard/solution-overview";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <SolutionOverview />
        <KpiCards />
        <PriorityAlerts />
      </div>
    </AppShell>
  );
}
