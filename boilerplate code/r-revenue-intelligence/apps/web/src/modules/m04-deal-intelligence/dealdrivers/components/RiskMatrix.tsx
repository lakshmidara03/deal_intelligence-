'use client';
import { useState } from 'react';
import type { Rep, AtRiskDeal } from '../types';

// Mock router for Vite
const useRouter = () => ({
  push: (url: string) => console.log('Navigate to:', url),
});

const WARNINGS = [
  { key: 'noNextStep' as const, label: 'NO NEXT STEP', training: true },
  { key: 'singleThreaded' as const, label: 'SINGLE-THREADED', training: true },
  { key: 'noClosePlan' as const, label: 'NO CLOSE PLAN', training: true },
  { key: 'staleGt14d' as const, label: 'STALE >14D', training: false },
  { key: 'championLeft' as const, label: 'CHAMPION LEFT', training: false },
] as const;

function getBadgeClass(pct: number, rank: number): string {
  if (pct === 0) return 'badge zero';
  if (rank === 1) return 'badge h1';
  if (rank === 2) return 'badge h2';
  if (rank === 3) return 'badge h3';
  return 'badge normal';
}

function getRank(reps: Rep[], key: typeof WARNINGS[number]['key'], pct: number): number {
  const vals = [...new Set(reps.map(r => r.warnings[key].pct))].sort((a, b) => b - a);
  const idx = vals.indexOf(pct);
  return idx + 1;
}

type Props = {
  reps: Rep[];
  teamAvg: Record<string, number>;
  insight: string;
  topDeals: AtRiskDeal[];
  onCellClick: (repId: string, repName: string, warning: string, warningLabel: string) => void;
  onExportCSV?: () => void;
};

export default function RiskMatrix({ reps, teamAvg, insight, topDeals, onCellClick, onExportCSV }: Props) {
  const router = useRouter();
  const [exportStatus, setExportStatus] = useState('');

  const handleExportClick = async () => {
    if (!onExportCSV) return;
    setExportStatus('Exporting...');
    try {
      await onExportCSV();
      setExportStatus('Export prepared.');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (err) {
      setExportStatus('Export failed.');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  return (
    <div className="content-layout">
      {/* Left: Risk Matrix */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Deal Risk Matrix</div>
            <div className="panel-sub">Percentage of your active deals with each warning (active for &gt; 1 day)</div>
          </div>
          <div className="flex items-center gap-2">
            {exportStatus && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exportStatus}</span>}
            <button className="btn-export-sm" onClick={handleExportClick}>Export CSV</button>
          </div>
        </div>


        <div className="matrix-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="col-rep">REP NAME</th>
                <th className="col-center" style={{ minWidth: 60 }}>DEALS</th>
                {WARNINGS.map(w => (
                  <th key={w.key} className="col-warning">
                    <div className="th-warning-wrap">
                      <span>{w.label}</span>
                      {w.training && <span className="th-training">⚠ Team training<br />needed</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reps.map(rep => (
                <tr key={rep.repId}>
                  <td>
                    <div className="rep-name">{rep.repName}</div>
                    <div className="rep-role">{rep.role}</div>
                  </td>
                  <td className="col-center">{rep.totalDeals}</td>
                  {WARNINGS.map(w => {
                    const pct = rep.warnings[w.key].pct;
                    const rank = getRank(reps, w.key, pct);
                    return (
                      <td key={w.key} className="col-center">
                        <span
                          className={getBadgeClass(pct, rank)}
                          onClick={() => pct > 0 && onCellClick(rep.repId, rep.repName, w.key, w.label)}
                        >
                          {pct === 0 ? '0%' : `${pct}%`}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="heat-legend">
          <span>Heat rank:</span>
          <div className="heat-legend-item">
            <span className="heat-color-box h1"></span>
            <span>#1 Highest</span>
          </div>
          <div className="heat-legend-item">
            <span className="heat-color-box h2"></span>
            <span>#2</span>
          </div>
          <div className="heat-legend-item">
            <span className="heat-color-box h3"></span>
            <span>#3</span>
          </div>
          <span>·</span>
          <span>Plain text = lower rank</span>
          <span className="heat-legend-right">Click any cell to drill down →</span>
        </div>

        <div className="insight-bar">
          <span><strong>Insight:</strong> {insight}</span>
        </div>
      </div>

      {/* Right: Top At-Risk sidebar */}
      <div className="right-panel">
        <div className="right-panel-header">
          <div className="right-panel-title">
            Top At-Risk Deals
          </div>
          <span
            className="view-all"
            onClick={() => router.push('/deal-drivers?tab=top-at-risk')}
          >
            View All →
          </span>
        </div>
        {topDeals.map(deal => (
          <div key={deal.dealId} className="risk-card">
            <div className="risk-avatar">{deal.accountName[0]}</div>
            <div className="risk-info">
              <div className="risk-acct">{deal.accountName}</div>
              <div className="risk-stage">{deal.crmStage}</div>
            </div>
            <div className="risk-right">
              <div className="risk-amount">${deal.dealAmount.toLocaleString()}</div>
              <div className={`risk-count ${deal.warningTypes.length >= 2 ? 'high' : deal.warningTypes.length === 0 ? 'none' : ''}`}>
                {deal.warningTypes.length} Risk{deal.warningTypes.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
