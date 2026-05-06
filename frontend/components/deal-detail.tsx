'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Brain, CalendarClock, MailPlus, RefreshCcw, Sparkles, UserRound } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { dateLabel, label, money } from '@/lib/format';
import { driverSuggestion } from '@/lib/signals';
import { HealthBadge } from './health-badge';
import { ImpactBadge } from './impact-badge';

export function DealDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [emailTitle, setEmailTitle] = useState('');
  const [emailSummary, setEmailSummary] = useState('');
  const [emailRawText, setEmailRawText] = useState('');
  const [emailDate, setEmailDate] = useState(() => new Date().toISOString().slice(0, 10));
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

  const addEmail = useMutation({
    mutationFn: () =>
      api.createEmailActivity(id, {
        title: emailTitle,
        summary: emailSummary,
        rawText: emailRawText,
        occurredAt: new Date(`${emailDate}T09:00:00`).toISOString()
      }),
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(['deal', id], updatedDeal);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setEmailTitle('');
      setEmailSummary('');
      setEmailRawText('');
      setEmailDate(new Date().toISOString().slice(0, 10));
    }
  });

  function handleAddEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addEmail.mutate();
  }

  if (isLoading) {
    return <main className="mx-auto max-w-7xl px-6 py-8 text-sm text-zinc-600">Loading deal...</main>;
  }

  if (isError || !deal) {
    return <main className="mx-auto max-w-7xl px-6 py-8 text-sm text-red-700">Could not load this deal.</main>;
  }

  const latestInsight = deal.insights?.[0];
  const activityCount = deal.activities?.length ?? 0;
  const primaryRisk = deal.drivers?.find((driver) => driver.impact === 'NEGATIVE') ?? deal.drivers?.[0];

  return (
    <main className="min-h-screen">
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-ink" href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Deals
          </Link>
          <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
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

      <section className="mx-auto max-w-7xl space-y-5 px-6 py-5">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Value</p>
            <p className="mt-2 text-xl font-semibold text-ink">{money(deal.value)}</p>
          </div>
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Stage</p>
            <p className="mt-2 text-lg font-semibold text-ink">{label(deal.stage)}</p>
          </div>
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Close Date</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <CalendarClock className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              {dateLabel(deal.closeDate)}
            </p>
          </div>
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Owner</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <UserRound className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              {deal.owner}
            </p>
          </div>
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Activities</p>
            <p className="mt-2 text-xl font-semibold text-ink">{activityCount}</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="rounded-md border border-line bg-white p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-coral" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-ink">Deal Health Insight</h2>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">{deal.healthExplanation}</p>
                  {latestInsight && (
                    <p className="mt-2 text-xs font-medium text-zinc-500">Last analyzed {dateLabel(latestInsight.generatedAt)}</p>
                  )}
                </div>
                {primaryRisk && (
                  <div className="min-w-52 rounded-md border border-line bg-paper p-3">
                    <p className="text-xs font-semibold uppercase text-zinc-500">Main Driver</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{primaryRisk.label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">{primaryRisk.description}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-md border border-line bg-paper p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Sparkles className="h-4 w-4 text-gold" aria-hidden="true" />
                  Recommended Next Action
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{deal.recommendedAction}</p>
              </div>
            </div>

            <div className="rounded-md border border-line bg-white p-5">
              <h2 className="text-base font-semibold text-ink">AI Deal Drivers</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {deal.drivers?.map((driver) => (
                  <div className="rounded-md border border-line p-3" key={driver.id}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-ink">{driver.label}</h3>
                      <ImpactBadge impact={driver.impact} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{driver.description}</p>
                    <p className="mt-3 border-t border-line pt-3 text-sm leading-6 text-zinc-700">{driverSuggestion(driver.label)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <details className="rounded-md border border-line bg-white p-5">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-base font-semibold text-ink">
                <MailPlus className="h-5 w-5 text-coral" aria-hidden="true" />
                Add Email Activity
              </summary>
              <form className="mt-4 rounded-md border border-line bg-paper p-4" onSubmit={handleAddEmail}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-ink">
                    Email Subject
                    <input
                      className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-ink"
                      onChange={(event) => setEmailTitle(event.target.value)}
                      placeholder="Pricing follow-up"
                      required
                      value={emailTitle}
                    />
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Date
                    <input
                      className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-ink"
                      onChange={(event) => setEmailDate(event.target.value)}
                      required
                      type="date"
                      value={emailDate}
                    />
                  </label>
                </div>
                <label className="mt-3 block text-sm font-medium text-ink">
                  Short Summary
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-ink"
                    onChange={(event) => setEmailSummary(event.target.value)}
                    placeholder="Customer mentioned pricing concern and asked for options."
                    required
                    value={emailSummary}
                  />
                </label>
                <label className="mt-3 block text-sm font-medium text-ink">
                  Full Email Text
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
                    onChange={(event) => setEmailRawText(event.target.value)}
                    placeholder="Paste the customer email here..."
                    required
                    value={emailRawText}
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    className="inline-flex h-10 items-center rounded-md border border-ink bg-ink px-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={addEmail.isPending}
                    type="submit"
                  >
                    {addEmail.isPending ? 'Adding Email...' : 'Add Email'}
                  </button>
                  {addEmail.isSuccess && (
                    <span className="text-sm font-medium text-emerald-700">Email added. Analyze to refresh insights.</span>
                  )}
                  {addEmail.isError && <span className="text-sm font-medium text-red-700">Could not add email.</span>}
                </div>
              </form>
            </details>

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
              <div className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-1">
                {deal.activities?.map((activity) => (
                  <div className="rounded-md border border-line p-3" key={activity.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-line bg-paper px-2 py-1 text-xs font-semibold text-zinc-700">
                        {label(activity.type)}
                      </span>
                      <span className="text-xs text-zinc-500">{dateLabel(activity.occurredAt)}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-ink">{activity.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{activity.summary}</p>
                    <details className="mt-2 rounded-md bg-paper px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold uppercase text-zinc-500">Raw Activity</summary>
                      <p className="mt-2 text-sm leading-6 text-zinc-700">{activity.rawText}</p>
                    </details>
                  </div>
                ))}
                {(!deal.activities || deal.activities.length === 0) && (
                  <div className="rounded-md border border-dashed border-line bg-paper p-4 text-sm leading-6 text-zinc-600">
                    No activities are linked to this deal yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {latestInsight && (
          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="text-base font-semibold text-ink">Deal-Level AI Interpretation</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <p className="text-sm leading-6 text-zinc-700">{latestInsight.summary}</p>
              <p className="text-sm leading-6 text-zinc-600">{latestInsight.interpretation}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
