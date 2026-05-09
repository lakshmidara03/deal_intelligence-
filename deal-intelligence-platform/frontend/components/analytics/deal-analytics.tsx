"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrainCircuit, CalendarClock, Mail, MessageSquare, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "@/components/deals/health-badge";
import { formatCurrency } from "@/lib/utils";
import type { Deal, Interaction } from "@/types/deal";

const sentimentScore = {
  negative: 25,
  neutral: 55,
  positive: 85
};

const pieColors = ["#10b981", "#f59e0b", "#f43f5e"];

export function DealAnalytics({ deals, interactions }: { deals: Deal[]; interactions: Interaction[] }) {
  const [dealId, setDealId] = useState(deals[0]?.id ?? "");
  const deal = useMemo(() => deals.find((item) => item.id === dealId) ?? deals[0], [dealId]);

  if (!deal) {
    return <div className="text-sm text-muted-foreground">No deal data available.</div>;
  }

  const signalData = [
    { name: "Engagement", value: deal.engagement_score },
    { name: "Probability", value: deal.probability },
    { name: "Email", value: Math.min(100, deal.email_count * 2) },
    { name: "Meetings", value: Math.min(100, deal.meetings_count * 10) }
  ];
  const dealInteractions = interactions.filter((interaction) => interaction.deal_id === deal.id);
  const sentimentTrend = dealInteractions.map((interaction, index) => ({
    step: `${index + 1}`,
    sentiment: sentimentScore[interaction.sentiment],
    channel: interaction.channel,
    summary: interaction.summary
  }));
  const risk = deal.health_status === "At Risk" ? deal.ai_confidence : Math.max(10, 100 - deal.ai_confidence);
  const review = deal.health_status === "Needs Review" ? deal.ai_confidence : deal.human_review_required ? 35 : 15;
  const healthy = Math.max(5, 100 - risk - review);
  const healthPie = [
    { name: "Healthy", value: healthy },
    { name: "Needs Review", value: review },
    { name: "Risk", value: risk }
  ];

  return (
    <div className="space-y-5">
      <Card className="glass-panel shadow-panel">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Deal-Specific Analytics</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Select one deal to inspect momentum, activity, risk, and forecast quality.</p>
          </div>
          <select
            value={deal.id}
            onChange={(event) => setDealId(event.target.value)}
            className="h-10 max-w-sm rounded-md border bg-background px-3 text-sm"
          >
            {deals.slice(0, 250).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Deal Value", value: formatCurrency(deal.deal_value), icon: Target },
          { label: "Stage Age", value: `${deal.stage_age_days} days`, icon: CalendarClock },
          { label: "Email Activity", value: String(deal.email_count), icon: Mail },
          { label: "Meetings", value: String(deal.meetings_count), icon: MessageSquare }
        ].map((item) => (
          <Card key={item.label} className="glass-panel shadow-panel">
            <CardContent className="p-5">
              <item.icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card className="glass-panel shadow-panel">
          <CardHeader><CardTitle>Deal Signal Strength</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer>
              <BarChart data={signalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="value" fill="#14b8a6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-panel shadow-panel">
          <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> AI Readout</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Health</span>
              <HealthBadge status={deal.health_status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Confidence</span>
              <span className="font-semibold">{deal.ai_confidence}%</span>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Drivers</p>
              <div className="flex flex-wrap gap-2">
                {deal.drivers.map((driver) => (
                  <span key={driver} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{driver}</span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-background/70 p-4 text-sm text-muted-foreground">
              {deal.next_best_action}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card className="glass-panel shadow-panel">
          <CardHeader><CardTitle>Sentiment Trend Across Deal Interactions</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer>
              <LineChart data={sentimentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                <XAxis dataKey="step" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Line type="monotone" dataKey="sentiment" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-panel shadow-panel">
          <CardHeader><CardTitle>Deal Health Mix</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={healthPie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={4}>
                  {healthPie.map((entry, index) => <Cell key={entry.name} fill={pieColors[index]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
