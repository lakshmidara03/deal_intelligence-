'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, LogOut, RefreshCcw, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { dateLabel, label, money } from '@/lib/format';
import { dealMatchesRiskCategory, riskCategories } from '@/lib/signals';
import { useDealViewStore } from '@/lib/store';
import type { DealHealth } from '@/lib/types';
import { HealthBadge } from './health-badge';

const filters: Array<DealHealth | 'ALL'> = ['ALL', 'HEALTHY', 'AT_RISK', 'NEEDS_REVIEW'];

export function DealBoard({ adminView = false }: { adminView?: boolean }) {
  const router = useRouter();
  const { account, hasHydrated, hydrate, logout } = useAuthStore();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['deals', account?.id, adminView],
    queryFn: () => api.deals(adminView ? undefined : account?.id),
    enabled: hasHydrated && Boolean(account)
  });
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const { healthFilter, searchTerm, riskCategory, setHealthFilter, setSearchTerm, setRiskCategory } = useDealViewStore();

  const deals = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (data ?? []).filter((deal) => {
      const matchesHealth = healthFilter === 'ALL' || deal.health === healthFilter;
      const matchesRiskCategory = dealMatchesRiskCategory(deal.drivers, deal.health, riskCategory);
      const matchesSearch =
        !normalizedSearch ||
        [deal.name, deal.company, deal.owner, deal.stage, deal.health, ...(deal.drivers ?? []).map((driver) => driver.label)]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesHealth && matchesRiskCategory && matchesSearch;
    });
  }, [data, healthFilter, riskCategory, searchTerm]);

  async function handleRefresh() {
    await refetch();
    setLastRefreshedAt(new Date());
  }

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hasHydrated && !account) {
      router.replace('/login');
    }

    if (hasHydrated && account && adminView && account.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [account, adminView, hasHydrated, router]);

  if (hasHydrated && !account) {
    return <main className="px-6 py-8 text-sm text-zinc-600">Redirecting to login...</main>;
  }

  if (hasHydrated && account && adminView && account.role !== 'ADMIN') {
    return <main className="px-6 py-8 text-sm text-zinc-600">Redirecting to your assigned deals...</main>;
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-coral">Project 4 POC</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
                {adminView ? 'Admin Deal Dashboard' : 'Deal Intelligence Workspace'}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                {account?.role === 'ADMIN'
                  ? 'Admin can view every deal and every employee owner in the pipeline.'
                  : 'Employees see only the deals assigned to their account.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {account && (
                <span className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-zinc-700">
                  {account.name} · {account.role === 'ADMIN' ? 'Admin' : 'Employee'}
                </span>
              )}
              {account?.role === 'ADMIN' && !adminView && (
                <Link
                  className="inline-flex h-10 items-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-paper"
                  href="/admin"
                >
                  Admin Page
                </Link>
              )}
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-3 text-sm font-semibold text-ink hover:bg-mint"
                onClick={handleRefresh}
                type="button"
              >
                <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isFetching ? 'Refreshing' : 'Refresh'}
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-paper"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-10 min-w-72 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-zinc-500">
                <Search className="h-4 w-4" aria-hidden="true" />
                <input
                  className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-zinc-400"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search deal, company, owner, risk"
                  type="search"
                  value={searchTerm}
                />
              </label>
              <select
                className="h-10 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink outline-none"
                onChange={(event) => setRiskCategory(event.target.value as typeof riskCategory)}
                value={riskCategory}
              >
                {riskCategories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'ALL' ? 'All Health & Risk Factors' : label(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Showing {deals.length} of {data?.length ?? 0} deals
            {lastRefreshedAt ? ` - refreshed ${lastRefreshedAt.toLocaleTimeString()}` : ''}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        {isLoading && <p className="text-sm text-zinc-600">Loading deals...</p>}
        {isError && <p className="text-sm text-red-700">Could not load deals. Check that the NestJS API is running.</p>}

        <div className="overflow-hidden rounded-md border border-line bg-white">
          <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr_0.8fr_0.7fr_44px] border-b border-line bg-paper px-4 py-3 text-xs font-semibold uppercase text-zinc-500">
            <span>Deal</span>
            <span>Owner</span>
            <span>Employee</span>
            <span>Stage</span>
            <span>Value</span>
            <span>Risk</span>
            <span />
          </div>
          {deals.map((deal) => (
            <Link
              className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr_0.8fr_0.7fr_44px] items-center border-b border-line px-4 py-4 text-sm last:border-b-0 hover:bg-paper"
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
              <span className="text-zinc-700">{deal.employee?.name ?? 'Unassigned'}</span>
              <span className="text-zinc-700">{label(deal.stage)}</span>
              <span className="font-semibold text-ink">{money(deal.value)}</span>
              <span className="flex flex-col items-start gap-1">
                <HealthBadge health={deal.health} />
                <span className="max-w-36 truncate text-xs text-zinc-500">{deal.drivers?.[0]?.label ?? 'No risk factor'}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            </Link>
          ))}
          {!isLoading && deals.length === 0 && (
            <div className="px-4 py-8 text-sm text-zinc-600">No deals match the current search and health filter.</div>
          )}
        </div>
      </section>
    </main>
  );
}
