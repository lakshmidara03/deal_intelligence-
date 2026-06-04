'use client';
import { useEffect, useState, Suspense } from 'react';
import PageHeader from '../../components/PageHeader';
import RoleBadge from '../../components/RoleBadge';
import { Users } from 'lucide-react';

// Mock Next.js router for Vite
const useSearchParams = () => ({
  get: (key: string) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },
});

const useRouter = () => ({
  push: (url: string) => {
    window.location.href = url;
  },
});
import {
  getSummary, getRiskMatrix, getComparePeriods,
  getAtRiskDeals, getAiInsights, getDrilldown, exportDrilldown, exportRiskMatrix,
} from '../../services/dealDriversService';
import { teamAverageMock } from '../../mocks';
import RiskMatrix from '../RiskMatrix';
import TopAtRiskDeals from '../TopAtRiskDeals';
import AiInsights from '../AiInsights';
import ComparePeriods from '../ComparePeriods';
import DrilldownPanel from '../DrilldownPanel';
import type {
  SummaryResponse, RiskMatrixResponse, AtRiskDealsResponse,
  AiInsightsResponse, ComparePeriodsResponse, DrilldownResponse
} from '../../types';

type Tab = 'risk-matrix' | 'compare-periods' | 'top-at-risk' | 'ai-insights';

const TABS: { key: Tab; label: string }[] = [
  { key: 'risk-matrix', label: 'Risk Matrix' },
  { key: 'compare-periods', label: 'Compare Periods' },
  { key: 'top-at-risk', label: 'Top At-Risk Deals' },
  { key: 'ai-insights', label: 'AI Insights' },
];

function DealDriversInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const tabParam = (sp.get('tab') as Tab) ?? 'risk-matrix';

  const [tab, setTab] = useState<Tab>(tabParam);
  const [rep, setRep] = useState('Robert Lee');
  const [pipeline, setPipeline] = useState('My Deals');
  const [period, setPeriod] = useState('Now');

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [matrix, setMatrix] = useState<RiskMatrixResponse | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskDealsResponse | null>(null);
  const [insights, setInsights] = useState<AiInsightsResponse | null>(null);
  const [compare, setCompare] = useState<ComparePeriodsResponse | null>(null);
  const [drilldown, setDrilldown] = useState<DrilldownResponse | null>(null);
  const [drilldownMeta, setDrilldownMeta] = useState<{ repId: string; repName: string; warningType: string; warningLabel: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTab(tabParam); }, [tabParam]);

  useEffect(() => {
    setLoading(true);
    const p = { period, repIds: [], teamId: 'team_west_001' };
    Promise.all([
      getSummary(p),
      getRiskMatrix(p),
      getAtRiskDeals({ ...p, sortBy: 'riskScore', page: 1, size: 20 }),
      getAiInsights(p),
      getComparePeriods({ periodA: 'LAST_30_DAYS', periodB: 'LAST_90_DAYS' }),
    ]).then(([s, m, a, i, c]) => {
      setSummary(s); setMatrix(m); setAtRisk(a); setInsights(i); setCompare(c);
      setLoading(false);
    });
  }, [rep, pipeline, period]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    router.push(`/deal-drivers?tab=${t}`);
  };

  const handleCellClick = async (repId: string, repName: string, warning: string, warningLabel: string) => {
    const data = await getDrilldown({ repId, warningType: warning, period });
    setDrilldown(data);
    setDrilldownMeta({ repId, repName, warningType: warning, warningLabel });
  };

  const handleExportDrilldown = async () => {
    if (!drilldownMeta) return;

    const result = await exportDrilldown({
      repId: drilldownMeta.repId,
      warningType: drilldownMeta.warningType,
      period,
    });

    if (result.downloadUrl && !result.downloadUrl.startsWith('#')) {
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExportRiskMatrix = async () => {
    await exportRiskMatrix({
      period,
      repIds: [],
      teamId: 'team_west_001',
    });
  };

  const periodLabel = period === 'Now' ? 'Now' : period === 'LAST_7_DAYS' ? 'Last 7 days' : period === 'LAST_90_DAYS' ? 'Last 90 days' : 'Last 30 days';

  return (
    <div className="flex flex-col flex-1 deal-drivers-scope">
      <PageHeader
        title="Deal Drivers"
        subtitle="Track recurring deal risks, identify warning patterns, and focus on deals that need attention most."
        badge={<RoleBadge role="sales_manager" />}
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {/* Context Banner */}
            <div className="context-banner">
              <div className="context-avatar" style={{ background: 'var(--blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={14} style={{ color: '#fff' }} />
              </div>
              <div>
                <div className="context-line" style={{ fontWeight: 600, color: '#1e3a8a' }}>
                  My Deals — {pipeline} • {periodLabel}
                </div>
                <div className="context-sub" style={{ color: '#1e40af' }}>
                  Showing risk data across your 24 active deals on this board.
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`tab-btn${tab === t.key ? ' active' : ''}`}
                  onClick={() => handleTabChange(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* KPI Cards — shown on all tabs */}
            {summary && (
              <div className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-label">Total Active Deals</div>
                  <div className="kpi-value">{summary.totalActiveDeals.value}</div>
                  <div className="kpi-delta red">↑ {summary.totalActiveDeals.deltaVsLast30Days} vs last 30 days</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Deals with Warnings</div>
                  <div className="kpi-value">{summary.dealsWithWarnings.count}</div>
                  <div className="kpi-badge-red">{summary.dealsWithWarnings.pctOfTotal}% of your deals</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Highest Risk Warning</div>
                  <div className="kpi-value large-text">{summary.highestRiskWarning.label}</div>
                  <div className="kpi-delta red">⚠ {summary.highestRiskWarning.priority.charAt(0).toUpperCase() + summary.highestRiskWarning.priority.slice(1)} priority</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Most Impacted Stage</div>
                  <div className="kpi-value large-text">{summary.mostImpactedStage.stage}</div>
                  <div className="kpi-delta muted">{summary.mostImpactedStage.pctImpacted}% of impacted deals</div>
                </div>
                 <div className="kpi-card">
                  <div className="kpi-label">Warning Trend</div>
                  <div className="kpi-value" style={{ color: 'var(--red)' }}>↑ {summary.warningTrend.value}%</div>
                  <div className="kpi-delta muted" style={{ marginTop: 4 }}>Increase in risks</div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {tab === 'risk-matrix' && matrix && atRisk && (
              <div className="space-y-3">
                <div className="flex justify-start">
                  <select className="filter-select" value={pipeline} onChange={e => setPipeline(e.target.value)}>
                    <option value="My Deals">My Deals</option>
                    <option value="Enterprise Deal Q2">Enterprise Deal Q2</option>
                    <option value="Team Pipeline-West">Team Pipeline-West</option>
                    <option value="Strategic Accounts">Strategic Accounts</option>
                  </select>
                </div>
                <RiskMatrix
                  reps={matrix.reps}
                  teamAvg={teamAverageMock}
                  insight='"No next step", "Single-threaded", "No close plan" all show ⚠ — systemic issue. 3 of 5 columns affected team-wide. Escalate enablement.'
                  topDeals={atRisk.deals}
                  onCellClick={handleCellClick}
                  onExportCSV={handleExportRiskMatrix}
                />
              </div>
            )}
            {tab === 'compare-periods' && (
              <ComparePeriods />
            )}
            {tab === 'top-at-risk' && atRisk && (
              <TopAtRiskDeals deals={atRisk.deals} />
            )}
            {tab === 'ai-insights' && insights && (
              <AiInsights insights={insights.insights} />
            )}

            {/* Drilldown */}
            {drilldown && drilldownMeta && (
              <DrilldownPanel
                data={drilldown}
                repName={drilldownMeta.repName}
                warningLabel={drilldownMeta.warningLabel}
                warningType={drilldownMeta.warningType}
                period={period}
                onClose={() => { setDrilldown(null); setDrilldownMeta(null); }}
                onExport={handleExportDrilldown}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DealDriversManagerView() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <DealDriversInner />
    </Suspense>
  );
}
