import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell, AlertTriangle, Flag, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react'
import type { Deal } from '../services/dealBoardsService'
import type { DealActivity } from '../types/deal-boards.types'

interface Props {
  deals: Deal[]
  groupBy: 'none' | 'stage' | 'rep'
  onDealClick: (deal: Deal) => void
}

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

const playbookColors: Record<string, { bg: string; text: string; bar: string }> = {
  green: { bg: '#d1fae5', text: '#065f46', bar: '#10b981' },
  orange: { bg: '#fef3c7', text: '#92400e', bar: '#f59e0b' },
  red: { bg: '#fee2e2', text: '#991b1b', bar: '#ef4444' },
}

const stageColors: Record<string, string> = {
  Qualification: '#f3f4f6',
  Discovery: '#f3f4f6',
  Proposal: '#f3f4f6',
  Negotiation: '#f3f4f6',
  'Closed Won': '#dcfce7',
  'Closed Lost': '#fee2e2',
}
const stageTextColors: Record<string, string> = {
  Qualification: '#6b7280',
  Discovery: '#6b7280',
  Proposal: '#6b7280',
  Negotiation: '#6b7280',
  'Closed Won': '#16a34a',
  'Closed Lost': '#dc2626',
}

// Generate deterministic avatar color from name
function getRepColor(name: string | undefined): string {
  const safeName = name || 'Unknown';
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getRepInitials(name: string | undefined): string {
  const safeName = name || 'Unknown';
  return safeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

type SortKey = 'dealName' | 'amount' | 'closeDate' | 'playbookScore' | 'stage'
type SortDir = 'asc' | 'desc'

function ActivityCell({ activities }: { activities?: DealActivity[] }) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({ top: rect.top, left: rect.left + rect.width / 2 })
    }
    setShow(true)
  }

  // Generate dynamic bars from activity data (7 bars like Figma)
  const barCount = 7;
  const barColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
  const bars = Array.from({ length: barCount }, (_, i) => {
    const seed = (activities?.length || 0) + i * 13;
    const heightPercent = 30 + ((seed * 7) % 71); // 30-100%
    const color = barColors[i % barColors.length];
    return { heightPercent, color };
  });

  return (
    <>
      <div 
        ref={ref}
        style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 20, cursor: 'pointer', width: 'fit-content' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
      >
        {bars.map((bar, i) => (
          <div key={i} style={{ width: 4, height: `${bar.heightPercent}%`, background: bar.color, borderRadius: 2, opacity: 0.85 }} />
        ))}
      </div>

      {mounted && show && activities && activities.length > 0 && createPortal(
        <div style={{
          position: 'fixed', 
          bottom: window.innerHeight - coords.top + 10, 
          left: coords.left, 
          transform: 'translateX(-80%)',
          width: 420, background: '#fff', border: '1px solid #e8eaed',
          borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 999999,
          padding: '20px',
          pointerEvents: 'none'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#1a1d23', fontWeight: 600 }}>Activity Over Time</h4>
          <p style={{ margin: '0 0 24px 0', fontSize: 12, color: '#6b7280' }}>
            Larger dots represent longer interactions. Hover to see details.
          </p>

          <div style={{ position: 'relative', paddingBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, padding: '0 10px' }}>
              {activities.map((act, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>{act.dateLabel}</div>
                  <div style={{ background: '#f3f4f6', borderRadius: 4, fontSize: 11, padding: '2px 8px', color: '#4b5563', display: 'inline-block' }}>{act.count}</div>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, height: 4, background: '#cbd5e1', borderRadius: 2 }} />
            
            <div style={{ position: 'absolute', bottom: 12, left: 10, right: 10, height: 0 }}>
              {activities.map(act => act.interactions.map(int => (
                <div
                  key={int.id}
                  style={{
                    position: 'absolute',
                    left: `${int.positionPercent}%`,
                    bottom: int.type === 'customer' ? 0 : (int.size > 14 ? 8 : -8), 
                    width: int.size,
                    height: int.size,
                    background: int.type === 'customer' ? '#ec4899' : '#8b5cf6',
                    borderRadius: '50%',
                    transform: 'translate(-50%, 50%)',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              )))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function FlagCell({ flagCount, flagReason }: { flagCount: number, flagReason?: string }) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({ top: rect.top, left: rect.left + rect.width / 2 })
    }
    setShow(true)
  }

  return (
    <>
      <div 
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444', cursor: 'pointer', width: 'fit-content' }}
      >
        <Flag size={12} fill="#ef4444" color="#ef4444" />
      </div>

      {mounted && show && createPortal(
        <div style={{
          position: 'fixed', 
          top: coords.top - 10,
          left: coords.left, 
          transform: 'translate(-50%, -100%)',
          width: 260, background: '#fff', border: '1px solid #fca5a5',
          borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 999999,
          padding: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          <div style={{ background: '#fef2f2', padding: '10px 14px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flag size={13} fill="#ef4444" color="#ef4444" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>Flagged for Attention</span>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#1e293b', lineHeight: 1.5, fontWeight: 500 }}>
              {flagReason || "This deal has been manually flagged for review."}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function DealRow({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const pc = playbookColors[deal.playbookColor] || playbookColors.orange
  const repColor = getRepColor(deal.assignedRep)
  const repInitials = getRepInitials(deal.assignedRep)

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50"
    >
      {/* Deal Name */}
      <td className="px-5 py-5" style={{ width: 200 }}>
        <button
          type="button"
          className="text-sm font-medium text-[#2563EB] hover:underline text-left truncate block"
          style={{ maxWidth: 180 }}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
        >
          {deal.dealName}
        </button>
      </td>
      {/* Owner / Assigned Rep */}
      <td className="px-5 py-5" style={{ width: 140 }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ backgroundColor: repColor }}
          >
            {repInitials}
          </div>
          <span className="text-sm text-gray-700 whitespace-nowrap">{deal.assignedRep}</span>
        </div>
      </td>
      {/* Stage */}
      <td className="px-5 py-5" style={{ width: 100 }}>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ background: '#eef2ff', color: '#4f46e5' }}>
          {deal.stage}
        </span>
      </td>
      {/* Amount */}
      <td className="px-5 py-5" style={{ width: 100 }}>
        <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
          {fmt(deal.amount)}
        </span>
      </td>
      {/* AI Score */}
      <td className="px-5 py-5" style={{ width: 80 }}>
        <span className={`text-sm font-medium whitespace-nowrap ${deal.playbookScore >= 80 ? 'text-[#16A34A]' : deal.playbookScore >= 60 ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`}>
          {deal.playbookScore}%
        </span>
      </td>
      {/* Warnings */}
      <td className="px-5 py-5" style={{ width: 80 }}>
        {deal.aiWarningCount > 0 ? (
          <div className="inline-flex items-center gap-1">
            <AlertTriangle size={14} className="text-[#F59E0B] shrink-0" />
            <span className="text-sm text-gray-700">{deal.aiWarningCount}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      {/* MEDDPICC % / Playbook */}
      <td className="px-5 py-5" style={{ width: 130 }}>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap text-white" style={{ background: deal.playbookScore >= 80 ? '#10b981' : deal.playbookScore >= 50 ? '#f59e0b' : '#ef4444', minWidth: 48 }}>
          {deal.playbookScore}%
        </span>
      </td>
      {/* Contacts */}
      <td className="px-5 py-5" style={{ width: 100 }}>
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {deal.contacts} contact{deal.contacts !== 1 ? 's' : ''}
        </span>
      </td>
      {/* Activity */}
      <td className="px-5 py-5 relative" style={{ width: 70 }}>
        <ActivityCell activities={deal.activityOverTime} />
      </td>
      {/* AI Next Step */}
      <td className="px-5 py-5" style={{ width: 180 }}>
        <p className="text-sm text-gray-600 truncate whitespace-nowrap">
          {deal.aiSuggestedNextStep}
        </p>
      </td>
    </tr>
  )
}

function GroupSection({ label, deals, onDealClick }: { label: string; deals: Deal[]; onDealClick: (d: Deal) => void }) {
  const [collapsed, setCollapsed] = useState(false)
  const total = deals.reduce((s, d) => s + d.amount, 0)

  return (
    <>
      <tr
        onClick={() => setCollapsed(!collapsed)}
        style={{ background: '#f8f9fa', cursor: 'pointer', borderBottom: '1px solid #e8eaed' }}
      >
        <td colSpan={10} style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {collapsed ? <ChevronRight size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1d23' }}>{label}</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>({deals.length} deals · {fmt(total)})</span>
          </div>
        </td>
      </tr>
      {!collapsed && deals.map(d => <DealRow key={d.dealId} deal={d} onClick={() => onDealClick(d)} />)}
    </>
  )
}

export default function DealTable({ deals, groupBy, onDealClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('dealName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...deals].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'dealName') cmp = a.dealName.localeCompare(b.dealName)
    else if (sortKey === 'amount') cmp = a.amount - b.amount
    else if (sortKey === 'closeDate') cmp = a.closeDate.localeCompare(b.closeDate)
    else if (sortKey === 'playbookScore') cmp = a.playbookScore - b.playbookScore
    else if (sortKey === 'stage') cmp = a.stage.localeCompare(b.stage)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, opacity: sortKey === k ? 1 : 0.3 }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginBottom: -2, color: sortKey === k && sortDir === 'asc' ? '#4f46e5' : '#9ca3af' }}><polyline points="18 15 12 9 6 15"></polyline></svg>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginTop: -2, color: sortKey === k && sortDir === 'desc' ? '#4f46e5' : '#9ca3af' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
    </span>
  )

  const thStyle = (k?: SortKey): React.CSSProperties => ({
    padding: '10px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5,
    cursor: k ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    borderBottom: '2px solid #e8eaed',
    background: '#fafbfc',
  })

  const grouped: Record<string, Deal[]> = {}
  if (groupBy !== 'none') {
    sorted.forEach(d => {
      const key = groupBy === 'stage' ? d.stage : d.assignedRep
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(d)
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full" style={{ minWidth: 1200, tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 200 }}>Deal Name</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 140 }}>Owner</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 100 }}>Stage</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 100 }}>Amount</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 80 }}>AI Score</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 80 }}>Warnings</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 130 }}>MEDDPICC %</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 100 }}>Contacts</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 70 }}>Activity</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 180 }}>Next Step</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {groupBy === 'none' ? (
            sorted.map(d => <DealRow key={d.dealId} deal={d} onClick={() => onDealClick(d)} />)
          ) : (
            Object.entries(grouped).map(([label, grpDeals]) => (
              <GroupSection key={label} label={label} deals={grpDeals} onDealClick={onDealClick} />
            ))
          )}
          {deals.length === 0 && (
            <tr>
              <td colSpan={10} className="text-center py-10 text-gray-400 text-sm">
                No deals match the current filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}




