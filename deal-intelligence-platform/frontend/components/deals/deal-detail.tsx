import { CalendarClock, Mail, MessageSquare, PhoneCall } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "@/components/deals/health-badge";
import { InsightsPanel } from "@/components/ai/insights-panel";
import { AddInteractionForm } from "@/components/deals/add-interaction-form";
import { ManualNextStep } from "@/components/deals/manual-next-step";
import { RiskChart } from "@/components/charts/risk-chart";
import { formatCurrency } from "@/lib/utils";
import type { Deal, Interaction } from "@/types/deal";

const channelIcon = {
  email: Mail,
  call: PhoneCall,
  meeting: MessageSquare
};

const detailSections = [
  {
    title: "CRM Details",
    keys: ["Deal Id", "Deal Name", "Account Name", "Industry", "Region", "Deal Owner", "Crm Stage", "Deal Source", "Primary Product"]
  },
  {
    title: "Commercial Details",
    keys: ["Deal Value Inr", "Probability Pct", "Weighted Value Inr", "Budget Confirmed", "Decision Maker Engaged", "No Of Contacts"]
  },
  {
    title: "Timeline Details",
    keys: ["Created Date", "Estimated Close Date", "Last Activity Date", "Days In Current Stage", "Days Since Last Activity", "Next Step"]
  },
  {
    title: "Engagement & Competition",
    keys: ["Total Calls", "Total Emails", "Total Meetings", "Last Call Sentiment", "Competitor 1", "Competitor 2"]
  },
  {
    title: "Dataset AI Fields",
    keys: ["Health Status", "Ai Risk Score"]
  }
];

function formatRawValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

export function DealDetail({ deal, interactions }: { deal: Deal; interactions: Interaction[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <Card className="glass-panel shadow-panel">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{deal.name}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">{deal.account} · {deal.owner}</p>
            </div>
            <HealthBadge status={deal.health_status} />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["Value", formatCurrency(deal.deal_value)],
                ["Probability", `${deal.probability}%`],
                ["Stage Age", `${deal.stage_age_days} days`],
                ["Engagement", `${deal.engagement_score}/100`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-background/70 p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel shadow-panel">
          <CardHeader>
            <CardTitle>Human Review & Next Step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-background/70 p-4">
                <p className="text-xs text-muted-foreground">Human Review</p>
                <p className="mt-2 text-sm font-semibold">{deal.human_review_required ? "Required" : "Not required"}</p>
              </div>
              <div className="rounded-lg border bg-background/70 p-4">
                <p className="text-xs text-muted-foreground">AI Confidence</p>
                <p className="mt-2 text-sm font-semibold">{deal.ai_confidence}%</p>
              </div>
              <div className="rounded-lg border bg-background/70 p-4">
                <p className="text-xs text-muted-foreground">Current Next Step</p>
                <p className="mt-2 text-sm font-semibold">{formatRawValue(deal.raw_details?.["Next Step"])}</p>
              </div>
            </div>
            <ManualNextStep initialStep={deal.manual_next_step} />
          </CardContent>
        </Card>
        <Card className="glass-panel shadow-panel">
          <CardHeader>
            <CardTitle>Complete Dataset Deal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {detailSections.map((section) => (
              <div key={section.title}>
                <p className="mb-3 text-sm font-semibold">{section.title}</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {section.keys.map((key) => (
                    <div key={key} className="rounded-lg border bg-background/70 p-3">
                      <p className="text-xs text-muted-foreground">{key}</p>
                      <p className="mt-1 break-words text-sm font-medium">{formatRawValue(deal.raw_details?.[key])}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-panel shadow-panel">
          <CardHeader>
            <CardTitle>Dynamic Risk Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskChart />
          </CardContent>
        </Card>
        <Card className="glass-panel shadow-panel">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Interaction History</CardTitle>
            <AddInteractionForm dealId={deal.id} />
          </CardHeader>
          <CardContent className="space-y-4">
            {interactions.map((item) => {
              const Icon = channelIcon[item.channel];
              return (
                <div key={item.id} className="flex gap-3 rounded-lg border bg-background/70 p-4">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.actor}</p>
                      <span className="text-xs capitalize text-muted-foreground">{item.sentiment}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                  </div>
                </div>
              );
            })}
            {interactions.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                No synced interactions yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <InsightsPanel deal={deal} />
    </div>
  );
}
