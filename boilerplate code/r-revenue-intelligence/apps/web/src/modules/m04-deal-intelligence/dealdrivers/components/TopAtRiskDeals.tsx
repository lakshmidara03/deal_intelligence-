'use client';
import { useState } from 'react';
import type { AtRiskDeal } from '../types';

const STAGE_MAP: Record<string, string> = {
  'Proposal/Quote': 'stage-blue',
  'Value Proposition': 'stage-yellow',
  'Negotiation': 'stage-yellow',
  'Proposal': 'stage-gray',
  'Discovery': 'stage-gray',
};

export default function TopAtRiskDeals({ deals }: { deals: AtRiskDeal[] }) {
  const [search, setSearch] = useState('');
  const filtered = deals.filter(d => d.accountName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="top-risk-panel">
      <div className="top-risk-hdr">
        <div>
          <div className="panel-title">Top At-Risk Deals</div>
          <div className="panel-sub">Deals ranked by number of active warnings</div>
        </div>
        <input
          className="search-input"
          placeholder="Search accounts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <table className="top-risk-table">
        <thead>
          <tr>
            <th>ACCOUNT</th>
            <th>AMOUNT</th>
            <th>STAGE</th>
            <th>REP</th>
            <th>RISKS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(deal => (
            <tr key={deal.dealId}>
              <td className="acct-name">{deal.accountName}</td>
              <td>${deal.dealAmount.toLocaleString()}</td>
              <td>
                <span className={`stage-pill ${STAGE_MAP[deal.crmStage] ?? 'stage-gray'}`}>
                  {deal.crmStage}
                </span>
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{deal.repName}</td>
              <td className={
                deal.warningTypes.length === 0 ? 'risks-zero' :
                  deal.warningTypes.length >= 2 ? 'risks-high' : 'risks-mid'
              }>
                {deal.warningTypes.length} {deal.warningTypes.length === 1 ? 'Risk' : 'Risks'}
              </td>
              <td><button className="view-deal-link">View deal ↗</button></td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No results</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
