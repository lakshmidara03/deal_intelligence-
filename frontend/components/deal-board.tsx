'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, BarChart3, LogOut, RefreshCcw, Search } from 'lucide-react';
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
  const [showStatistics, setShowStatistics] = useState(false);
  const [selectedStatsDealId, setSelectedStatsDealId] = useState<string>('');
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

  const healthSummary = useMemo(() => {
    const sourceDeals = data ?? [];
    const healthy = sourceDeals.filter((deal) => deal.health === 'HEALTHY').length;
    const atRisk = sourceDeals.filter((deal) => deal.health === 'AT_RISK').length;
    const needsReview = sourceDeals.filter((deal) => deal.health === 'NEEDS_REVIEW').length;
    const total = sourceDeals.length;

    return {
      total,
      items: [
        {
          label: 'Healthy',
          value: healthy,
          color: 'bg-emerald-500',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
          background: 'bg-emerald-50'
        },
        {
          label: 'At Risk',
          value: atRisk,
          color: 'bg-coral',
          text: 'text-red-800',
          border: 'border-red-200',
          background: 'bg-red-50'
        },
        {
          label: 'Needs Review',
          value: needsReview,
          color: 'bg-gold',
          text: 'text-amber-900',
          border: 'border-amber-200',
          background: 'bg-amber-50'
        }
      ]
    };
  }, [data]);

  const selectedStatsDeal = useMemo(() => {
    const sourceDeals = data ?? [];
    return sourceDeals.find((deal) => deal.id === selectedStatsDealId) ?? sourceDeals[0];
  }, [data, selectedStatsDealId]);

  const selectedDealBreakdown = useMemo(() => {
    if (!selectedStatsDeal) {
      return [
        { label: 'Healthy', value: 0, color: '#10b981' },
        { label: 'At Risk', value: 0, color: '#ef6f5e' },
        { label: 'Needs Review', value: 0, color: '#d9a72f' }
      ];
    }

    const drivers = selectedStatsDeal.drivers ?? [];
    const positive = drivers.filter((driver) => driver.impact === 'POSITIVE').length;
    const negative = drivers.filter((driver) => driver.impact === 'NEGATIVE').length;
    const neutral = drivers.filter((driver) => driver.impact === 'NEUTRAL').length;
    const totalSignals = Math.max(positive + negative + neutral, 1);

    let healthy = Math.round((positive / totalSignals) * 100);
    let atRisk = Math.round((negative / totalSignals) * 100);
    let needsReview = Math.max(0, 100 - healthy - atRisk);

    if (drivers.length === 0) {
      healthy = selectedStatsDeal.health === 'HEALTHY' ? 100 : 0;
      atRisk = selectedStatsDeal.health === 'AT_RISK' ? 100 : 0;
      needsReview = selectedStatsDeal.health === 'NEEDS_REVIEW' ? 100 : 0;
    }

    return [
      { label: 'Healthy', value: healthy, color: '#10b981' },
      { label: 'At Risk', value: atRisk, color: '#ef6f5e' },
      { label: 'Needs Review', value: needsReview, color: '#d9a72f' }
    ];
  }, [selectedStatsDeal]);

  const donutSegments = useMemo(() => {
    let offset = 25;
    const circumference = 75;

    return selectedDealBreakdown.map((item) => {
      const segment = {
        ...item,
        dashArray: `${(item.value / 100) * circumference} ${circumference}`,
        dashOffset: offset
      };
      offset -= (item.value / 100) * circumference;
      return segment;
    });
  }, [selectedDealBreakdown]);

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
              <h1 className="text-3xl font-semibold tracking-normal text-ink">
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
                    !showStatistics && healthFilter === filter
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-white text-zinc-700 hover:bg-paper'
                  }`}
                  key={filter}
                  onClick={() => {
                    setShowStatistics(false);
                    setHealthFilter(filter);
                  }}
                  type="button"
                >
                  {filter === 'ALL' ? 'All Deals' : label(filter)}
                </button>
              ))}
              <button
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                  showStatistics ? 'border-ink bg-ink text-white' : 'border-line bg-white text-zinc-700 hover:bg-paper'
                }`}
                onClick={() => setShowStatistics(true)}
                type="button"
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Statistics
              </button>
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

        {showStatistics ? (
          <div className="mb-6 rounded-md border border-line bg-white p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h2 className="text-base font-semibold text-ink">Deal Statistics</h2>
                <p className="mt-1 text-sm text-zinc-600">Select one deal to view its health breakdown.</p>
              </div>
              <label className="block min-w-80 text-sm font-medium text-ink">
                Deal
                <select
                  className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-ink"
                  onChange={(event) => setSelectedStatsDealId(event.target.value)}
                  value={selectedStatsDeal?.id ?? ''}
                >
                  {(data ?? []).map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.name} - {deal.company}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedStatsDeal && (
              <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] lg:items-center">
                <div className="flex justify-center">
                  <svg className="h-56 w-56 -rotate-90" viewBox="0 0 42 42" role="img" aria-label="Selected deal health doughnut chart">
                    <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="#f1eee6" strokeWidth="7" />
                    {donutSegments.map((segment) => (
                      <circle
                        cx="21"
                        cy="21"
                        fill="transparent"
                        key={segment.label}
                        r="15.915"
                        stroke={segment.color}
                        strokeDasharray={segment.dashArray}
                        strokeDashoffset={segment.dashOffset}
                        strokeLinecap="round"
                        strokeWidth="7"
                      >
                        <title>
                          {segment.label}: {segment.value}%
                        </title>
                      </circle>
                    ))}
                    <text
                      className="rotate-90 fill-ink text-[0.22rem] font-semibold"
                      textAnchor="middle"
                      x="21"
                      y="-19.5"
                    >
                      {selectedStatsDeal.health.replace('_', ' ')}
                    </text>
                  </svg>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-ink">{selectedStatsDeal.name}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{selectedStatsDeal.company}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {selectedDealBreakdown.map((item) => (
                      <div className="rounded-md border border-line bg-paper p-3" key={item.label} title={`${item.label}: ${item.value}%`}>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-semibold text-ink">{item.label}</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-ink">{item.value}%</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-zinc-600">
                    This chart uses only the selected deal's current health and AI driver impacts.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>

        {healthFilter === 'ALL' && (
        <div className="mb-6 rounded-md border border-line bg-white p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-base font-semibold text-ink">Deal Health Overview</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {healthSummary.total} total deals in this {adminView ? 'admin' : 'employee'} view
              </p>
            </div>
            <div className="text-sm font-semibold text-zinc-600">
              Healthy vs Risk vs Review
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {healthSummary.items.map((item) => {
              const percent = healthSummary.total > 0 ? Math.round((item.value / healthSummary.total) * 100) : 0;

              return (
                <div className={`rounded-md border ${item.border} ${item.background} p-4`} key={item.label}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-semibold ${item.text}`}>{item.label}</span>
                    <span className={`text-2xl font-semibold ${item.text}`}>{item.value}</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-medium text-zinc-600">{percent}% of deals</p>
                </div>
              );
            })}
          </div>
        </div>
        )}

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
          </>
        )}
      </section>
    </main>
  );
}
