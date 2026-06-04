import { Fragment, useState } from 'react';
import { AlertTriangle, Eye, Flag, MessageSquare, MoreVertical } from 'lucide-react';
import type { Deal, DealDetail } from '../types/deal.types';
import ActivityChart, { ActivityOverTimeChart } from './ActivityChart';

interface DealTableProps {
  deals: Deal[];
  groupBy?: 'none' | 'rep' | 'stage';
  dealDetails: DealDetail[];
  escalatedDealIds: string[];
  onSelectDeal: (deal: Deal) => void;
  onCommentDeal: (deal: Deal) => void;
  onToggleEscalation: (deal: Deal) => void;
}

function DealRow({
  deal,
  detail,
  isEscalated,
  onSelectDeal,
  onCommentDeal,
  onToggleEscalation,
}: {
  deal: Deal;
  detail?: DealDetail;
  isEscalated: boolean;
  onSelectDeal: (deal: Deal) => void;
  onCommentDeal: (deal: Deal) => void;
  onToggleEscalation: (deal: Deal) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <tr
      className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
      onClick={() => onSelectDeal(deal)}
    >
      {/* Deal Name */}
      <td className="px-5 py-5" style={{ width: 240 }}>
        <button
          type="button"
          className="text-sm font-medium text-[#2563EB] hover:underline text-left truncate block w-full"
          onClick={(event) => {
            event.stopPropagation();
            onSelectDeal(deal);
          }}
        >
          {deal.name}
        </button>
      </td>
      {/* Owner */}
      <td className="px-5 py-5" style={{ width: 180 }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ backgroundColor: deal.owner.color }}
          >
            {deal.owner.initials}
          </div>
          <span className="text-sm text-gray-700 truncate block max-w-[140px]" title={deal.owner.name}>
            {deal.owner.name}
          </span>
        </div>
      </td>
      {/* Stage */}
      <td className="px-5 py-5" style={{ width: 130 }}>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ background: '#eef2ff', color: '#4f46e5' }}>
          {deal.stage}
        </span>
      </td>
      {/* Amount */}
      <td className="px-5 py-5" style={{ width: 110 }}>
        <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
          {deal.amount}
        </span>
      </td>
      {/* AI Score */}
      <td className="px-5 py-5" style={{ width: 90 }}>
        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${deal.aiScore >= 80 ? 'bg-[#DCFCE7] text-[#15803D]' : deal.aiScore >= 60 ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>
          {deal.aiScore}%
        </span>
      </td>
      {/* Warnings + Escalation Flag */}
      <td className="px-5 py-5" style={{ width: 90 }}>
        <div className="inline-flex items-center gap-2">
          {deal.warnings > 0 ? (
            <div className="inline-flex items-center gap-1">
              <AlertTriangle size={14} className="text-[#F59E0B] shrink-0" />
              <span className="text-sm text-gray-700">{deal.warnings}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
          {isEscalated && (
            <div className="inline-flex items-center gap-0.5">
              <Flag size={14} className="text-red-500 fill-red-500 shrink-0" />
              <span className="text-xs font-semibold text-red-600">1</span>
            </div>
          )}
        </div>
      </td>
      {/* MEDDPICC % */}
      <td className="px-5 py-5" style={{ width: 140 }}>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${deal.meddpiccPercent}%`,
                background: deal.meddpiccPercent >= 80 ? '#22C55E' : deal.meddpiccPercent >= 50 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            {deal.meddpiccPercent}%
          </span>
        </div>
      </td>
      {/* Contacts */}
      <td className="px-5 py-5" style={{ width: 110 }}>
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {deal.contacts} contact{deal.contacts !== 1 ? 's' : ''}
        </span>
      </td>
      {/* Activity */}
      <td className="px-5 py-5 relative group" style={{ width: 80 }} onClick={(event) => event.stopPropagation()}>
        <ActivityChart data={deal.activityData} />
        {detail && (
          <div className="pointer-events-none absolute right-4 bottom-10 z-50 hidden w-[420px] rounded-xl border border-gray-200 bg-white p-5 shadow-2xl group-hover:block transition-all duration-200">
            <ActivityOverTimeChart detail={detail} />
          </div>
        )}
      </td>
      {/* Action Menu (Vertical ellipsis like Figma) */}
      <td className="px-5 py-5 text-center relative" style={{ width: 50 }} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded hover:bg-gray-100"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <MoreVertical size={16} />
        </button>
        {isMenuOpen && (
          <div className="absolute right-4 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1 text-left">
            <button
              onClick={() => {
                onSelectDeal(deal);
                setIsMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye size={14} className="text-gray-400" />
              <span>View Details</span>
            </button>
            <button
              onClick={() => {
                onToggleEscalation(deal);
                setIsMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Flag size={14} className={isEscalated ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
              <span>{isEscalated ? 'Remove Escalation' : 'Escalate'}</span>
            </button>
            <button
              onClick={() => {
                onCommentDeal(deal);
                setIsMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <MessageSquare size={14} className="text-gray-400" />
              <span>Comment</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function DealTable({
  deals,
  groupBy = 'none',
  dealDetails,
  escalatedDealIds,
  onSelectDeal,
  onCommentDeal,
  onToggleEscalation,
}: DealTableProps) {
  const getDealDetail = (dealId: string) =>
    dealDetails.find((detail) => detail.dealId === dealId);

  // Table Headers reusable structure to guarantee matching column dimensions
  const renderHeaders = () => (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 240 }}>Deal Name</th>
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 180 }}>Owner</th>
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 130 }}>Stage</th>
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 110 }}>Amount</th>
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 90 }}>AI Score</th>
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 90 }}>Warnings</th>
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 140 }}>MEDDPICC %</th>
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 110 }}>Contacts</th>
        <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider" style={{ width: 80 }}>Activity</th>
        <th className="px-5 py-3 text-center" style={{ width: 50 }}></th>
      </tr>
    </thead>
  );

  if (groupBy !== 'none') {
    const grouped = deals.reduce<Record<string, Deal[]>>((acc, deal) => {
      const key = groupBy === 'rep' ? deal.owner.name : deal.stage;
      if (!acc[key]) acc[key] = [];
      acc[key].push(deal);
      return acc;
    }, {});

    const sortedGroups = Object.keys(grouped).sort();

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full" style={{ minWidth: 1220, tableLayout: 'fixed' }}>
          {renderHeaders()}
          <tbody>
            {sortedGroups.map((groupName) => (
              <Fragment key={groupName}>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <td colSpan={10} className="px-5 py-2.5 text-xs font-semibold text-[#153E91] uppercase tracking-wider bg-gray-50/70">
                    {groupName} ({grouped[groupName].length} deals)
                  </td>
                </tr>
                {grouped[groupName].map((deal) => (
                  <DealRow
                    key={deal.id}
                    deal={deal}
                    detail={getDealDetail(deal.id)}
                    isEscalated={escalatedDealIds.includes(deal.id)}
                    onSelectDeal={onSelectDeal}
                    onCommentDeal={onCommentDeal}
                    onToggleEscalation={onToggleEscalation}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full" style={{ minWidth: 1220, tableLayout: 'fixed' }}>
        {renderHeaders()}
        <tbody className="divide-y divide-gray-50">
          {deals.map((deal) => (
            <DealRow
              key={deal.id}
              deal={deal}
              detail={getDealDetail(deal.id)}
              isEscalated={escalatedDealIds.includes(deal.id)}
              onSelectDeal={onSelectDeal}
              onCommentDeal={onCommentDeal}
              onToggleEscalation={onToggleEscalation}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
