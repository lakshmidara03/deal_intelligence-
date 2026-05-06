'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Brain, CalendarClock, RefreshCcw, Sparkles, UserRound } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { dateLabel, label, money } from '@/lib/format';
import { driverSuggestion } from '@/lib/signals';
import { HealthBadge } from './health-badge';
import { ImpactBadge } from './impact-badge';

export function DealDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data: deal, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.deal(id)
  });

  const analyze = useMutation({
    mutationFn: () => api.analyze(id),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(['deal', id], updatedDeal);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  });

  if (isLoading) {
    return <main className="mx-auto max-w-7xl px-6 py-8 text-sm text-zinc-600">Loading deal...</main>;
  }

  if (isError || !deal) {
    return <main className="mx-auto max-w-7xl px-6 py-8 text-sm text-red-700">Could not load this deal.</main>;
  }

  const latestInsight = deal.insights?.[0];

  return (
    <main className="min-h-screen">
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-ink" href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Deals
          </Link>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <HealthBadge health={deal.health} />
                <span className="rounded-md border border-line bg-paper px-2 py-1 text-xs font-semibold text-zinc-700">
                  {deal.confidence} confidence
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">{deal.name}</h1>
              <p className="mt-2 text-sm text-zinc-600">{deal.company}</p>
            </div>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-ink bg-ink px-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={analyze.isPending}
              onClick={() => analyze.mutate()}
              type="button"
            >
              <RefreshCcw className={`h-4 w-4 ${analyze.isPending ? 'animate-spin' : ''}`} aria-hidden="true" />
              Analyze Deal
            </button>
          </div>
          {analyze.isSuccess && (
            <p className="mt-3 text-sm font-medium text-emerald-700">Deal analysis refreshed and saved to the database.</p>
          )}
          {analyze.isError && (
            <p className="mt-3 text-sm font-medium text-red-700">Analysis failed. Check that the backend is running.</p>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="text-base font-semibold text-ink">Deal Details</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-zinc-500">Owner</dt>
                <dd className="mt-1 flex items-center gap-2 font-semibold text-ink">
                  <UserRound className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  {deal.owner}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Assigned Employee</dt>
                <dd className="mt-1 font-semibold text-ink">{deal.employee?.name ?? 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Value</dt>
                <dd className="mt-1 font-semibold text-ink">{money(deal.value)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Stage</dt>
                <dd className="mt-1 font-semibold text-ink">{label(deal.stage)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Close Date</dt>
                <dd className="mt-1 flex items-center gap-2 font-semibold text-ink">
                  <CalendarClock className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  {dateLabel(deal.closeDate)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="text-base font-semibold text-ink">AI Deal Drivers</h2>
            <div className="mt-4 space-y-3">
              {deal.drivers?.map((driver) => (
                <div className="rounded-md border border-line p-3" key={driver.id}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-ink">{driver.label}</h3>
                    <ImpactBadge impact={driver.impact} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{driver.description}</p>
                  <div className="mt-3 rounded-md border border-line bg-paper p-3">
                    <p className="text-xs font-semibold uppercase text-zinc-500">Suggested Action</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">{driverSuggestion(driver.label)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-md border border-line bg-white p-5">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-coral" aria-hidden="true" />
              <h2 className="text-base font-semibold text-ink">AI Insight Panel</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-700">{deal.healthExplanation}</p>
            {latestInsight && (
              <p className="mt-2 text-xs font-medium text-zinc-500">Last analyzed {dateLabel(latestInsight.generatedAt)}</p>
            )}
            <div className="mt-4 rounded-md border border-line bg-paper p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Sparkles className="h-4 w-4 text-gold" aria-hidden="true" />
                Recommended Next Action
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{deal.recommendedAction}</p>
            </div>
          </div>

          <div className="rounded-md border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">Activity Timeline</h2>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-paper px-3 text-xs font-semibold text-ink hover:bg-mint"
                onClick={() => refetch()}
                type="button"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
                Refresh
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {deal.activities?.map((activity) => (
                <div className="border-l-2 border-line pl-4" key={activity.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-line bg-paper px-2 py-1 text-xs font-semibold text-zinc-700">
                      {label(activity.type)}
                    </span>
                    <span className="text-xs text-zinc-500">{dateLabel(activity.occurredAt)}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-ink">{activity.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{activity.summary}</p>
                  <div className="mt-3 rounded-md border border-line bg-paper p-3">
                    <p className="text-xs font-semibold uppercase text-zinc-500">Raw Activity</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">{activity.rawText}</p>
                  </div>
                </div>
              ))}
              {(!deal.activities || deal.activities.length === 0) && (
                <div className="rounded-md border border-dashed border-line bg-paper p-4 text-sm leading-6 text-zinc-600">
                  No activities are linked to this deal yet. Rerun the seed command to load timeline data for all sample deals.
                </div>
              )}
            </div>
          </div>

          {latestInsight && (
            <div className="rounded-md border border-line bg-white p-5">
              <h2 className="text-base font-semibold text-ink">Deal-Level AI Interpretation</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-700">{latestInsight.summary}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{latestInsight.interpretation}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
