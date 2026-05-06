'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, RefreshCcw, Search } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { dateLabel, label, money } from '@/lib/format';
import { useDealViewStore } from '@/lib/store';
import type { DealHealth } from '@/lib/types';
import { HealthBadge } from './health-badge';

const filters: Array<DealHealth | 'ALL'> = ['ALL', 'HEALTHY', 'AT_RISK', 'NEEDS_REVIEW'];

export function DealBoard() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['deals'],
    queryFn: api.deals
  });
  const { healthFilter, setHealthFilter } = useDealViewStore();

  const deals = healthFilter === 'ALL' ? data ?? [] : (data ?? []).filter((deal) => deal.health === healthFilter);

  return (
    <main className="min-h-screen">
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-coral">Project 4 POC</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">Deal Intelligence Workspace</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                A focused workspace for deal health, recent activity, AI drivers, and next actions.
              </p>
            </div>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-3 text-sm font-semibold text-ink hover:bg-mint"
              onClick={() => refetch()}
              type="button"
            >
              <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    healthFilter === filter ? 'border-ink bg-ink text-white' : 'border-line bg-white text-zinc-700 hover:bg-paper'
                  }`}
                  key={filter}
                  onClick={() => setHealthFilter(filter)}
                  type="button"
                >
                  {filter === 'ALL' ? 'All Deals' : label(filter)}
                </button>
              ))}
            </div>
            <div className="flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-zinc-500">
              <Search className="h-4 w-4" aria-hidden="true" />
              {deals.length} visible deals
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        {isLoading && <p className="text-sm text-zinc-600">Loading deals...</p>}
        {isError && <p className="text-sm text-red-700">Could not load deals. Check that the NestJS API is running.</p>}

        <div className="overflow-hidden rounded-md border border-line bg-white">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_0.7fr_44px] border-b border-line bg-paper px-4 py-3 text-xs font-semibold uppercase text-zinc-500">
            <span>Deal</span>
            <span>Owner</span>
            <span>Stage</span>
            <span>Value</span>
            <span>Health</span>
            <span />
          </div>
          {deals.map((deal) => (
            <Link
              className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_0.7fr_44px] items-center border-b border-line px-4 py-4 text-sm last:border-b-0 hover:bg-paper"
              href={`/deals/${deal.id}`}
              key={deal.id}
            >
              <span>
                <strong className="block font-semibold text-ink">{deal.name}</strong>
                <span className="mt-1 block text-xs text-zinc-500">
                  {deal.company} · closes {dateLabel(deal.closeDate)}
                </span>
              </span>
              <span className="text-zinc-700">{deal.owner}</span>
              <span className="text-zinc-700">{label(deal.stage)}</span>
              <span className="font-semibold text-ink">{money(deal.value)}</span>
              <span>
                <HealthBadge health={deal.health} />
              </span>
              <ArrowUpRight className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
