'use client';
import { useState } from 'react';
import {
  Sparkles,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  User,
  Building2,
  Tag,
  AlertCircle,
  ArrowRight,
  Circle,
} from 'lucide-react';
import type { AiInsight, Priority } from '../types';

type Filter = 'All' | 'High' | 'Medium' | 'Low';

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === 'high')
    return <AlertTriangle size={13} style={{ color: '#e53e3e', flexShrink: 0 }} />;
  if (priority === 'medium')
    return <BarChart2 size={13} style={{ color: '#d69e2e', flexShrink: 0 }} />;
  return <CheckCircle2 size={13} style={{ color: '#38a169', flexShrink: 0 }} />;
}

export default function AiInsights({ insights }: { insights: AiInsight[] }) {
  const [filter, setFilter] = useState<Filter>('All');

  const counts = {
    All: insights.length,
    High: insights.filter(i => i.priority === 'high').length,
    Medium: insights.filter(i => i.priority === 'medium').length,
    Low: insights.filter(i => i.priority === 'low').length,
  };

  const filtered =
    filter === 'All'
      ? insights
      : insights.filter(i => i.priority === (filter.toLowerCase() as Priority));

  return (
    <div>
      {/* Header row */}
      <div className="insights-top">
        <div className="insights-title-row">
          <span className="insights-icon">
            <Sparkles size={16} style={{ color: '#805ad5' }} />
          </span>
          <div>
            <div className="panel-title" style={{ fontSize: 15 }}>AI Insights</div>
            <div className="panel-sub">
              Rule-based analysis: revenue risk · urgency · co-occurrence · win rate · benchmarks · slip prediction
            </div>
          </div>
        </div>
        <div className="filter-pills">
          {(['All', 'High', 'Medium', 'Low'] as Filter[]).map(f => (
            <button
              key={f}
              className={`filter-pill${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="insights-banner">
        <BarChart2 size={14} style={{ marginRight: 6, flexShrink: 0, verticalAlign: 'middle' }} />
        3 of 5 columns affected team-wide. $514K revenue at risk. Escalate enablement.
      </div>

      {/* Cards */}
      {filtered.map(ins => (
        <div key={ins.id} className={`insight-card ${ins.priority}`}>
          <div className="insight-card-hdr">
            <div className="insight-type-row">
              <PriorityIcon priority={ins.priority} />
              <span className="insight-type">{ins.type}</span>
              {ins.rep && (
                <span className="insight-rep-tag">
                  <User size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  {ins.rep}
                </span>
              )}
              {ins.account && (
                <span className="insight-acct-tag">
                  <Building2 size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  {ins.account}
                </span>
              )}
              {ins.score && (
                <span className="insight-score-tag">Score {ins.score}/100</span>
              )}
            </div>
            <span className={`sev-badge sev-${ins.priority}`}>
              {ins.priority.charAt(0).toUpperCase() + ins.priority.slice(1)}
            </span>
          </div>
          <div className="insight-title">
            {ins.insight.split(' — ')[0] || ins.insight.substring(0, 60)}
          </div>
          <div className="insight-desc">{ins.insight}</div>
          <div className="insight-tags">
            {ins.tags.map((tag, i) => (
              <span key={i} className="insight-tag">
                <AlertCircle size={10} style={{ marginRight: 3, color: '#e53e3e', verticalAlign: 'middle', flexShrink: 0 }} />
                {tag}
              </span>
            ))}
          </div>
          <div className="insight-action">
            Recommended action:{' '}
            <a className="action-link" href="#">
              <ArrowRight size={12} style={{ marginRight: 2, verticalAlign: 'middle' }} />
              {ins.recommendation}
            </a>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="empty-state">No {filter.toLowerCase()} severity insights.</div>
      )}
    </div>
  );
}
