'use client';
import { useState } from 'react';
import { scheduleOneOnOne } from '../../services/dealDriversService';
import type { DrilldownResponse } from '../../types';

type Props = {
  data: DrilldownResponse;
  repName: string;
  warningLabel: string;
  warningType: string;
  period: string;
  onClose: () => void;
  onExport?: () => void;
};

function getDefaultDateValue() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function DrilldownPanel({ data, repName, warningLabel, warningType, period, onClose, onExport }: Props) {
  const [suggestedDate, setSuggestedDate] = useState(getDefaultDateValue);
  const [note, setNote] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSchedule = async () => {
    setSaving(true);
    setScheduleStatus('');

    try {
      const result = await scheduleOneOnOne({
        repId: data.rep.id,
        suggestedDate,
        note: note.trim() || undefined,
      });
      setScheduleStatus(result.confirmationMessage);
      setNote('');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSchedule();
    }
  };



  return (
    <div className="drilldown-backdrop" onClick={onClose}>
      <div className="drilldown-panel" onClick={e => e.stopPropagation()}>
        <div className="drilldown-hdr">
          <div>
            <div className="drilldown-title">{repName} — {warningLabel}</div>
            <div className="drilldown-sub">{data.summary.dealsFlagged} of {data.repSidebar.dealsInPipeline} deals impacted</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="drilldown-close" onClick={onClose}>✕</button>
          </div>
        </div>



        <div className="flagged-section">
          <div className="flagged-label">FLAGGED DEALS</div>
          <table className="flagged-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>AMOUNT</th>
                <th>STAGE</th>
                <th>CLOSE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.flaggedDeals.map((deal, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{deal.accountName}</td>
                  <td>${deal.dealAmount.toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{deal.crmStage}</td>
                  <td style={{ fontSize: 12 }}>
                    <span style={{
                      color: deal.closeDateStatus === 'overdue' ? 'var(--red)' :
                        deal.closeDateStatus === 'soon' ? 'var(--orange-dark)' : 'var(--text-muted)'
                    }}>
                      {deal.closeDate}
                    </span>
                  </td>
                  <td><button className="view-deal-btn">View Deal →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Schedule 1:1</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{repName} | {warningLabel} | {period}</div>
            </div>
            <button className="view-deal-btn" onClick={handleSchedule} disabled={saving}>
              {saving ? 'Scheduling...' : 'Schedule 1:1'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              Suggested date
              <input
                type="date"
                value={suggestedDate}
                onChange={e => setSuggestedDate(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              Note
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Optional context for the 1:1"
                style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical' }}
              />
            </label>
          </div>

          {scheduleStatus && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green)' }}>{scheduleStatus}</div>
          )}
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            Uses the drilldown rep context and the selected period to capture follow-up coaching.
          </div>
        </div>
      </div>
    </div>
  );
}
