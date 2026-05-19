"use client";

import { Mail, MessageSquareWarning } from "lucide-react";
import { Fragment } from "react";
import type { ApiDeal } from "@/types/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function contactLabel(count: number) {
  return `${count} ${count === 1 ? "contact" : "contacts"}`;
}

function stagePill(stage: string) {
  return (
    <span className="inline-flex h-7 items-center rounded bg-blue-50 px-2.5 text-sm font-normal text-blue-700">
      {stage}
    </span>
  );
}

function warningIndicator(deal: ApiDeal) {
  const count = deal.warnings?.length ?? deal.riskFlagCount ?? 0;
  if (!count) return <span className="text-slate-500">-</span>;

  const hasCritical = deal.warnings?.some((warning) => warning.severity === "CRITICAL" || warning.severity === "HIGH");
  const color = hasCritical || deal.warningState === "critical" || deal.warningState === "risk" ? "text-red-500" : "text-amber-500";
  const warnings = deal.warnings ?? [];

  return (
    <span className="group relative inline-flex">
      <span className={`inline-flex items-center gap-1.5 text-sm ${color}`}>
        <MessageSquareWarning size={16} strokeWidth={1.8} />
        <span className="text-slate-900">{count}</span>
      </span>
      <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg group-hover:block">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">AI Warnings</span>
        {warnings.length ? (
          <span className="mt-2 block space-y-2">
            {warnings.slice(0, 3).map((warning) => (
              <span key={warning.id} className="block">
                <span className="block text-sm font-semibold text-slate-900">{warning.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-600">{warning.explanation}</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="mt-2 block text-sm text-slate-600">{count} active warning{count === 1 ? "" : "s"} on this deal.</span>
        )}
      </span>
    </span>
  );
}

function activityBars(deal: ApiDeal) {
  const bars = [
    { show: (deal.totalCalls ?? 0) > 0 || deal.activities?.some((activity) => activity.type === "CALL"), color: "bg-blue-500", height: "h-7" },
    { show: (deal.totalEmails ?? 0) > 0 || deal.activities?.some((activity) => activity.type === "EMAIL"), color: "bg-emerald-500", height: "h-7" },
    { show: deal.activities?.some((activity) => activity.type === "MEETING") || (deal.activityCount ?? 0) > 2, color: "bg-violet-500", height: "h-7" }
  ].filter((bar) => bar.show);

  return (
    <div className="flex h-8 items-center gap-1">
      {(bars.length ? bars : [{ color: "bg-slate-300", height: "h-5", show: true }]).slice(0, 3).map((bar, index) => (
        <span key={index} className={`w-1.5 rounded-full ${bar.height} ${bar.color}`} />
      ))}
    </div>
  );
}

function playbookProgress(deal: ApiDeal) {
  const percent = Math.round((deal.playbookCompletion ?? 0) * 100);
  const color = percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="relative h-7 w-[90px] overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-950">{percent}%</span>
    </div>
  );
}

function groupedDeals(data: ApiDeal[], grouping = "No grouping") {
  if (grouping === "No grouping") return [["", data]] as const;
  const groups = new Map<string, ApiDeal[]>();
  for (const deal of data) {
    const normalizedGrouping = grouping.toLowerCase();
    const key =
      normalizedGrouping === "group by stage" || normalizedGrouping === "stage"
        ? deal.stage || "Unstaged"
        : normalizedGrouping === "group by rep" || normalizedGrouping === "rep" || normalizedGrouping === "sales rep"
          ? deal.ownerDisplayName || deal.owner || "Unassigned"
          : "Deals";
    groups.set(key, [...(groups.get(key) ?? []), deal]);
  }
  return Array.from(groups.entries());
}

export function DataTable({ data, onOpen, grouping = "No grouping" }: { data: ApiDeal[]; onOpen: (dealId: string) => void; grouping?: string }) {
  const groups = groupedDeals(data, grouping);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-600">
              <th className="w-[22%] px-3.5 py-4 font-medium">Deal Name</th>
              <th className="w-[11%] px-3.5 py-4 font-medium">Stage</th>
              <th className="w-[9%] px-3.5 py-4 font-medium">Amount</th>
              <th className="w-[8%] px-3.5 py-4 font-medium">Contacts</th>
              <th className="w-[9%] px-3.5 py-4 font-medium">AI Warnings</th>
              <th className="w-[7%] px-3.5 py-4 font-medium">Activity</th>
              <th className="w-[10%] px-3.5 py-4 font-medium">Playbook</th>
              <th className="px-3.5 py-4 font-medium">AI Suggested Next Step</th>
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              groups.map(([groupName, deals]) => (
                <Fragment key={groupName || "all"}>
                  {groupName ? (
                    <tr className="border-b border-slate-200 bg-slate-100/80">
                      <td colSpan={8} className="px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-slate-600">
                        {groupName} <span className="font-normal normal-case tracking-normal text-slate-500">({deals.length})</span>
                      </td>
                    </tr>
                  ) : null}
                  {deals.map((deal) => (
                    <tr key={deal.id} onClick={() => onOpen(deal.id)} className="h-[86px] cursor-pointer border-b border-slate-200 bg-white transition hover:bg-blue-50/40">
                      <td className="px-3.5 py-4 align-middle">
                        <div className="max-w-[330px]">
                          <div className="truncate text-base font-normal text-blue-600">{deal.name}</div>
                          <div className="mt-1 truncate text-sm text-slate-600">{deal.accountName ?? "Account"}</div>
                        </div>
                      </td>
                      <td className="px-3.5 py-4 align-middle">{stagePill(deal.stage)}</td>
                      <td className="px-3.5 py-4 align-middle text-base font-semibold text-slate-950">{currency.format(Number(deal.amount ?? deal.value ?? 0))}</td>
                      <td className="px-3.5 py-4 align-middle text-sm text-slate-600">{contactLabel(deal.contactCount ?? deal.contacts?.length ?? 0)}</td>
                      <td className="px-3.5 py-4 align-middle">{warningIndicator(deal)}</td>
                      <td className="px-3.5 py-4 align-middle">{activityBars(deal)}</td>
                      <td className="px-3.5 py-4 align-middle">{playbookProgress(deal)}</td>
                      <td className="px-3.5 py-4 align-middle text-sm text-slate-800">
                        <div className="max-w-[460px] truncate">{deal.aiScores?.[0]?.suggestedNextStep ?? deal.nextStep ?? "Confirm next customer action"}</div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-sm text-slate-500">
                  <Mail className="mx-auto mb-3 text-slate-400" />
                  No deals found for this board view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
