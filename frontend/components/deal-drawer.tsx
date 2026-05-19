"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckSquare, Edit3, Loader2, Save, Sparkles, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DrawerTab, DrawerTabs } from "@/components/drawer-tabs";
import { api } from "@/services/api";
import { useDealBoardStore } from "@/store/use-deal-board-store";
import type { ApiDeal } from "@/types/api";

const playbookMeta: Record<
  string,
  { prompt: string; action: string; tone: "green" | "blue" | "violet" | "amber"; supportText: string; nextTab: DrawerTab }
> = {
  Metrics: {
    prompt: "What are the quantifiable business metrics driving this purchase?",
    action: "Mark as done",
    tone: "green",
    supportText: "Capture the measurable business outcome and value case.",
    nextTab: "Update CRM"
  },
  "Economic Buyer": {
    prompt: "Who has budget authority and final approval?",
    action: "Find CFO contact",
    tone: "violet",
    supportText: "Confirm the economic buyer and budget owner.",
    nextTab: "Update CRM"
  },
  "Decision Criteria": {
    prompt: "What criteria will decide the final vendor?",
    action: "Review criteria",
    tone: "blue",
    supportText: "Document must-haves, evaluation criteria, and competitors.",
    nextTab: "Update CRM"
  },
  "Decision Process": {
    prompt: "What is the approval path and buying process?",
    action: "Map process",
    tone: "amber",
    supportText: "Make the path to signature visible and current.",
    nextTab: "Update CRM"
  },
  Champion: {
    prompt: "Who will advocate for the deal internally?",
    action: "Confirm champion",
    tone: "green",
    supportText: "Keep the champion active and aligned to the close plan.",
    nextTab: "Activity"
  },
  Competition: {
    prompt: "Which competitors are in play?",
    action: "Review competition",
    tone: "violet",
    supportText: "Sharpen differentiation and secure the edge.",
    nextTab: "Update CRM"
  }
};

export function DealDrawer() {
  const queryClient = useQueryClient();
  const { selectedDealId, drawerOpen, setSelectedDeal, setSyncState } = useDealBoardStore();
  const [tab, setTab] = useState<DrawerTab>("Brief");

  const { data, isLoading } = useQuery({
    queryKey: ["deal", selectedDealId],
    queryFn: () => api<ApiDeal>(`/deals/${selectedDealId}`),
    enabled: Boolean(selectedDealId)
  });

  const predict = useMutation({
    mutationFn: () => api(`/ai/predict/${selectedDealId}`, { method: "POST" }),
    onSuccess: () => {
      toast.success("AI prediction refreshed");
      queryClient.invalidateQueries({ queryKey: ["deal", selectedDealId] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: () => toast.error("AI refresh failed")
  });

  const update = useMutation({
    mutationFn: (body: Record<string, string>) => api(`/deals/${selectedDealId}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("CRM fields saved");
      queryClient.invalidateQueries({ queryKey: ["deal", selectedDealId] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    }
  });

  const sync = useMutation({
    mutationFn: () => api<{ status: "syncing" | "synced" | "failed" }>(`/crm/sync/${selectedDealId}`, { method: "POST" }),
    onMutate: () => selectedDealId && setSyncState(selectedDealId, "syncing"),
    onSuccess: (result) => {
      if (selectedDealId) setSyncState(selectedDealId, result.status);
      toast[result.status === "synced" ? "success" : "error"](result.status === "synced" ? "HubSpot synced" : "HubSpot sync failed");
      queryClient.invalidateQueries({ queryKey: ["deal", selectedDealId] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (error) => {
      if (selectedDealId) setSyncState(selectedDealId, "failed");
      toast.error(error instanceof Error ? error.message : "HubSpot sync failed");
    }
  });

  const resolveWarning = useMutation({
    mutationFn: (warningId: string) => api(`/deals/${selectedDealId}/warnings/${warningId}`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Warning marked as done");
      queryClient.invalidateQueries({ queryKey: ["deal", selectedDealId] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not mark warning as done")
  });

  const playbookUpdate = useMutation({
    mutationFn: ({ itemId, completed, notes }: { itemId: string; completed?: boolean; notes?: string }) =>
      api(`/deals/${selectedDealId}/playbook/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed, notes })
      }),
    onSuccess: () => {
      toast.success("Playbook updated");
      queryClient.invalidateQueries({ queryKey: ["deal", selectedDealId] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    }
  });

  const handleQuickAction = (action: string, targetTab: DrawerTab) => {
    setTab(targetTab);
    toast.success(action);
  };

  const handleWarningAction = (action: string, code: string) => {
    const normalized = action.toLowerCase();
    if (normalized.includes("budget") || normalized.includes("buyer") || normalized.includes("contact") || normalized.includes("close")) {
      setTab("Update CRM");
    } else if (normalized.includes("follow") || normalized.includes("unblock") || normalized.includes("requalify")) {
      setTab("Activity");
    } else if (code === "high_ai_risk") {
      setTab("Brief");
      predict.mutate();
    }
    toast.success(`${action} opened`);
  };

  if (!drawerOpen) return null;

  const ai = data?.aiScores?.[0];
  const warningCount = data?.warnings?.length ?? data?.riskFlagCount ?? 0;

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/20" onClick={() => setSelectedDeal(null)}>
      <motion.aside
        initial={{ x: 820 }}
        animate={{ x: 0 }}
        exit={{ x: 820 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-[720px] flex-col bg-white shadow-panel"
      >
        <header className="bg-white px-1 pb-0 pt-4">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h2 className="truncate font-serif text-[22px] font-semibold leading-tight text-slate-950">{data?.name ?? "Loading deal"}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{data?.accountName ?? "Account"}</span>
                <span className="text-slate-300">-</span>
                <span className="font-semibold text-slate-950">{formatCurrency(Number(data?.amount ?? data?.value ?? 0))}</span>
                <span className="text-slate-300">-</span>
                <span className="rounded-md bg-blue-100 px-3 py-1.5 text-sm text-blue-700">{data?.stage ?? "Stage"}</span>
              </div>
            </div>
            <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => setSelectedDeal(null)}>
              <X size={24} />
            </button>
          </div>
        </header>

        <DrawerTabs active={tab} onChange={setTab} warningCount={warningCount} />

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-200 bg-white p-1">
          {isLoading ? (
            <div className="space-y-4 p-6">
              <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : (
            <>
              {tab === "Brief" && (
                <div className="space-y-4 px-0 py-6">
                  <button type="button" onClick={() => predict.mutate()} className="ml-1 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                    {predict.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Refresh AI
                  </button>
                  <InfoBlock title="AI Summary" tone="blue" value={ai?.explanation || ai?.summary || data?.aiExplanation || "No AI summary is available for this deal yet."} />
                  <InfoBlock title="What Changed This Week" tone="amber" value={ai?.whatChanged || "Latest Excel and CRM-derived signals were recalculated for this board view."} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <StatCard label="Buyer sentiment" value={ai?.buyerSentiment || "Neutral"} tone={sentimentClass(ai?.buyerSentiment)} />
                    <StatCard label="Last interaction" value={lastInteractionText(data)} tone="text-slate-800" />
                    <StatCard label="Key risks" value={signalText(ai?.negativeSignals, "No major risks detected.")} tone="text-slate-800" />
                  </div>
                </div>
              )}

              {tab === "Warnings" && (
                <div className="space-y-4 p-6">
                  {data?.warnings?.length ? (
                    data.warnings.map((warning) => (
                      <WarningCard
                        key={warning.id}
                        warning={warning}
                        onAction={() => handleWarningAction(warning.ctaAction, warning.code)}
                        onDone={() => resolveWarning.mutate(warning.id)}
                        markingDone={resolveWarning.isPending}
                      />
                    ))
                  ) : (
                    <p className="rounded-md bg-white p-4 text-sm text-slate-500">No active warnings.</p>
                  )}
                </div>
              )}

              {tab === "Playbook" && (
                <div className="space-y-3 p-6">
                  <PlaybookProgress items={data?.playbookItems ?? []} />
                  <div className="space-y-3">
                    {(data?.playbookItems ?? []).map((item) => (
                      <PlaybookCard
                        key={item.id}
                        item={item}
                        onPrimaryAction={() => handleQuickAction(playbookMeta[item.section]?.action ?? "Open", playbookMeta[item.section]?.nextTab ?? "Update CRM")}
                        onMarkDone={() => playbookUpdate.mutate({ itemId: item.id, completed: !item.completed })}
                        saving={playbookUpdate.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}

              {tab === "Activity" && (
                <div className="space-y-5 p-6">
                  <ActivityTimeline activities={data?.activities ?? []} />
                </div>
              )}

              {tab === "Update CRM" && data && (
                <div className="p-6">
                  <CrmForm deal={data} onSave={(body) => update.mutate(body)} onSync={() => sync.mutate()} saving={update.isPending} syncing={sync.isPending} />
                </div>
              )}
            </>
          )}
        </div>
      </motion.aside>
    </div>
  );
}

function PlaybookProgress({ items }: { items: NonNullable<ApiDeal["playbookItems"]> }) {
  const total = 6;
  const completed = items.filter((item) => item.completed).length;
  const score = Math.round((completed / total) * 100);

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">MEDDICC Framework</h3>
          <p className="mt-1 text-sm text-slate-500">
            {completed} of {total} complete
          </p>
        </div>
        <p className="text-sm text-slate-500">
          <span className="text-lg font-semibold text-slate-900">{score}%</span> Score
        </p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${score}%` }} />
      </div>
    </section>
  );
}

function PlaybookCard({
  item,
  onPrimaryAction,
  onMarkDone,
  saving
}: {
  item: NonNullable<ApiDeal["playbookItems"]>[number];
  onPrimaryAction: () => void;
  onMarkDone: () => void;
  saving: boolean;
}) {
  const meta = playbookMeta[item.section] ?? playbookMeta.Metrics;
  const accent =
    meta.tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : meta.tone === "violet"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : meta.tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <article className={`rounded-xl border p-4 ${item.completed ? "border-emerald-200 bg-white" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accent}`}>
          <CheckSquare size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.section}</p>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {item.completed ? "Done" : "Open"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{meta.prompt}</p>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{item.notes || meta.supportText}</div>
          <div className={`mt-3 rounded-lg border p-3 text-sm ${item.completed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-violet-200 bg-violet-50 text-violet-700"}`}>
            <div className="flex items-center gap-2 font-medium">
              <Sparkles size={14} />
              AI Suggested Note
            </div>
            <p className="mt-1">{item.aiSuggestion}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={onPrimaryAction} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              {meta.action}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={onMarkDone}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
              Mark as done
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function WarningCard({
  warning,
  onAction,
  onDone,
  markingDone
}: {
  warning: NonNullable<ApiDeal["warnings"]>[number];
  onAction: () => void;
  onDone: () => void;
  markingDone: boolean;
}) {
  const severityClass =
    warning.severity === "CRITICAL"
      ? "bg-red-100 text-red-700"
      : warning.severity === "HIGH"
        ? "bg-rose-100 text-rose-700"
        : warning.severity === "MEDIUM"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{warning.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{warning.explanation}</p>
          <p className="mt-2 text-sm text-slate-700">{warning.suggestedMitigation}</p>
        </div>
        <span className={`rounded-md px-3 py-2 text-sm font-semibold ${severityClass}`}>{warning.severity}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onAction} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          {warning.ctaAction}
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={markingDone}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {markingDone ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
          Mark as done
        </button>
      </div>
    </article>
  );
}

function InfoBlock({
  title,
  value,
  tone
}: {
  title: string;
  value: string;
  tone: "blue" | "amber" | "plain";
}) {
  const boxClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : tone === "amber"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-white text-slate-700";

  return (
    <article className={`rounded-lg border p-4 ${boxClass}`}>
      <h3 className={`text-sm font-semibold uppercase ${tone === "amber" ? "text-amber-900" : tone === "blue" ? "text-blue-600" : "text-slate-600"}`}>{title}</h3>
      <div className="mt-2 text-sm leading-6">{value}</div>
    </article>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 rounded-md px-3 py-2 text-sm font-semibold ${tone}`}>{value}</p>
    </article>
  );
}

function sentimentClass(sentiment?: string) {
  const normalized = String(sentiment ?? "").toLowerCase();
  if (normalized.includes("negative")) return "bg-red-100 text-red-700";
  if (normalized.includes("positive")) return "bg-emerald-100 text-emerald-700";
  if (normalized.includes("mixed")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function signalText(value: unknown, fallback: string) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? fallback);
}

function lastInteractionText(deal?: ApiDeal | null) {
  const activity = deal?.activities?.[0];
  if (!activity) return "No recent activity found.";
  const date = new Date(activity.occurredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${date} - ${activity.subject}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function CrmForm({
  deal,
  onSave,
  onSync,
  saving,
  syncing
}: {
  deal: ApiDeal;
  onSave: (body: Record<string, string>) => void;
  onSync: () => void;
  saving: boolean;
  syncing: boolean;
}) {
  const [stage, setStage] = useState(deal.stage);
  const [nextStep, setNextStep] = useState(deal.nextStep ?? "");
  const [forecastCategory, setForecastCategory] = useState(deal.forecastCategory);
  const [closeDate, setCloseDate] = useState(deal.closeDate?.slice(0, 10) ?? "");
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const nextStepRef = useRef<HTMLTextAreaElement>(null);
  const suggestedNextStep = deal.aiScores?.[0]?.suggestedNextStep ?? deal.nextStep ?? "Schedule follow-up call";

  const acceptSuggestion = () => {
    setNextStep(suggestedNextStep);
    setDismissedSuggestion(false);
    toast.success("AI suggestion accepted");
  };

  const dismissSuggestion = () => {
    setDismissedSuggestion(true);
    toast("AI suggestion dismissed");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span className="mr-2">Note:</span>
        Update key deal fields to keep your CRM current. Changes sync automatically.
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Stage</span>
        <select
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none focus:border-blue-400"
        >
          <option>Prospecting</option>
          <option>Qualification</option>
          <option>Discovery</option>
          <option>Proposal</option>
          <option>Negotiation</option>
          <option>Closed Won</option>
          <option>Closed Lost</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Next Step</span>
        {!dismissedSuggestion ? (
          <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">AI Suggested Next Step</p>
            <p className="mt-2 text-sm leading-6 text-blue-900">{suggestedNextStep}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={acceptSuggestion} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Accept
              </button>
              <button type="button" onClick={dismissSuggestion} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        <textarea
          ref={nextStepRef}
          value={nextStep}
          onChange={(event) => setNextStep(event.target.value)}
          className="min-h-[108px] w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Forecast Category</span>
        <select
          value={forecastCategory}
          onChange={(event) => setForecastCategory(event.target.value as ApiDeal["forecastCategory"])}
          className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none focus:border-blue-400"
        >
          <option value="PIPELINE">Pipeline</option>
          <option value="BEST_CASE">Best Case</option>
          <option value="COMMIT">Commit</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Close Date</span>
        <input
          type="date"
          value={closeDate}
          onChange={(event) => setCloseDate(event.target.value)}
          className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none focus:border-blue-400"
        />
      </label>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => onSave({ stage, nextStep, forecastCategory, closeDate })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600"
        >
          <Save size={16} />
          {saving ? "Saving" : "Save to CRM"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setStage(deal.stage);
            setNextStep(deal.nextStep ?? "");
            setForecastCategory(deal.forecastCategory);
            setCloseDate(deal.closeDate?.slice(0, 10) ?? "");
            setDismissedSuggestion(false);
            toast("Draft reset");
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSync}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <Edit3 size={16} />}
          Sync now
        </button>
      </div>

      <p className="text-xs text-slate-500">Syncs to HubSpot and writes a local sync log.</p>
    </div>
  );
}
