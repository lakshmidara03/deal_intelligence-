import { AppShell } from "@/components/shared/app-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PriorityAlerts } from "@/components/dashboard/priority-alerts";
import { SolutionOverview } from "@/components/dashboard/solution-overview";
import { CompactHealthGauge } from "@/components/dashboard/compact-health-gauge";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <SolutionOverview />
        <KpiCards />
        
        {/* Compact Health Score with Deal Selector */}
        <CompactHealthGauge />

        <PriorityAlerts />
      </div>
    </AppShell>
  );
}
