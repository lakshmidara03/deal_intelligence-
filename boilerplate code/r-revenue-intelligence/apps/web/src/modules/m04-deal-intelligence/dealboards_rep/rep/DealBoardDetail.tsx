'use client'
import { useState, useEffect, useMemo } from 'react'
// Mock Next.js router for Vite
const useParams = () => ({ boardId: '1' });
const useRouter = () => ({
  push: (url: string) => {
    window.location.href = url;
  },
});
import { ArrowLeft, Filter, ChevronDown } from 'lucide-react'
import NotificationsPanel from '../components/NotificationsPanel'
import StageSummaryCards from '../components/StageSummaryCards'
import FilterBar, { FilterState } from '../components/FilterBar'
import DealTable from '../components/DealTable'
import DealDetailPanel from '../components/deal-detail/DealDetailPanel'
import {
  getBoardDetail, getDeals, getNotifications,
  markAllNotificationsRead, updateDeal,
} from '../services/dealBoardsService'
import type { BoardDetail, Deal, NotificationsResponse } from '../types/deal-boards.types'
// AI Evaluation imports from manager module
import { aiEvaluationEngine } from '../../deaboard_manager/services/aiEvaluation.service';
import { MOCK_KNOWLEDGE_BASE } from '../../deaboard_manager/mocks/knowledge-base.mock';
import type { DealEvaluationResult } from '../../deaboard_manager/types/ai-evaluation.types';

interface DealBoardDetailProps {
  onBack?: () => void;
  repName?: string | null;
}

// Helper to parse deal amounts (handles numbers, strings with $/K/M, commas)
function parseAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace(/[$,]/g, '').trim();
  if (str.endsWith('K')) return parseFloat(str.slice(0, -1)) * 1000;
  if (str.endsWith('M')) return parseFloat(str.slice(0, -1)) * 1000000;
  return parseFloat(str) || 0;
}

export default function DealBoardDetail({ onBack, repName }: DealBoardDetailProps) {
  const params = useParams()
  const router = useRouter()
  const boardId = params.boardId as string

  const [board, setBoard] = useState<BoardDetail | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [notifs, setNotifs] = useState<NotificationsResponse>({ notifications: [], unreadCount: 0 })
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [aiEvaluation, setAiEvaluation] = useState<DealEvaluationResult | null>(null)
  const [dealEvaluations, setDealEvaluations] = useState<Record<string, DealEvaluationResult>>({})
  const [selectedCard, setSelectedCard] = useState<string | null>('Open')
  const [showFilters, setShowFilters] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showGroupMenu, setShowGroupMenu] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    stages: [],
    forecastCategories: [],
    groupBy: 'none',
    amountMin: '',
    amountMax: '',
    closeDate: '',
  })

  // Helper to evaluate deals with AI engine
  const evaluateDeals = async (dealsToEvaluate: Deal[]): Promise<Deal[]> => {
    if (dealsToEvaluate.length === 0) return dealsToEvaluate;

    const evaluations: Record<string, DealEvaluationResult> = {};

    for (const deal of dealsToEvaluate) {
      try {
        const evaluation = await aiEvaluationEngine.evaluate({
          dealData: {
            stage: deal.stage,
            amount: parseAmount(deal.amount),
            companySize: 'Medium',
            daysInStage: 15,
            contactActivity: deal.contacts || 0,
            closeDate: deal.closeDate,
            nextSteps: deal.aiSuggestedNextStep || '',
            stakeholders: [],
            aiScore: deal.playbookScore || 50,
            warnings: deal.aiWarningCount || 0,
            meddpiccPercent: deal.playbookScore || 0,
            contacts: deal.contacts || 0,
            activityData: deal.activityOverTime ? [deal.activityOverTime.length] : [0],
          },
          apiResponses: [],
          knowledgeBase: MOCK_KNOWLEDGE_BASE,
        });
        evaluations[deal.dealId] = evaluation;
      } catch (error) {
        console.error('AI evaluation error for deal', deal.dealId, error);
      }
    }

    if (Object.keys(evaluations).length > 0) {
      setDealEvaluations(evaluations);
      return dealsToEvaluate.map(deal => {
        const evalResult = evaluations[deal.dealId];
        if (evalResult) {
          return {
            ...deal,
            aiWarningCount: evalResult.ai_warnings_rep.length,
          };
        }
        return deal;
      });
    }
    return dealsToEvaluate;
  };

  useEffect(() => {
    const loadData = async () => {
      const [b, d] = await Promise.all([
        getBoardDetail(boardId),
        getDeals(boardId, repName || undefined),
      ]);

      // Evaluate deals with AI engine before setting state
      const evaluatedDeals = await evaluateDeals(d.data);

      const n = await getNotifications(repName || undefined);

      setBoard(b.data);
      setDeals(evaluatedDeals);
      setNotifs(n.data);
      setLoading(false);
    };

    loadData();
  }, [boardId, repName]);

  // Evaluate deal with AI engine when selected
  useEffect(() => {
    if (!selectedDeal) {
      setAiEvaluation(null);
      return;
    }

    const evaluateDeal = async () => {
      try {
        const evaluation = await aiEvaluationEngine.evaluate({
          dealData: {
            stage: selectedDeal.stage,
            amount: parseAmount(selectedDeal.amount),
            companySize: 'Medium',
            daysInStage: 15,
            contactActivity: selectedDeal.contacts || 0,
            closeDate: selectedDeal.closeDate,
            nextSteps: selectedDeal.aiSuggestedNextStep || '',
            stakeholders: [],
            aiScore: selectedDeal.playbookScore || 50,
            warnings: selectedDeal.aiWarningCount || 0,
            meddpiccPercent: selectedDeal.playbookScore || 0,
            contacts: selectedDeal.contacts || 0,
            activityData: selectedDeal.activityOverTime ? [selectedDeal.activityOverTime.length] : [0],
          },
          apiResponses: [],
          knowledgeBase: MOCK_KNOWLEDGE_BASE,
        });
        setAiEvaluation(evaluation);
      } catch (error) {
        console.error('AI evaluation error:', error);
      }
    };

    evaluateDeal();
  }, [selectedDeal]);

  const computedSummaryCards = useMemo(() => {
    const buckets = {
      'Open': deals.filter(d => !d.stage.startsWith('Closed')),
      'Commit': deals.filter(d => d.forecastCategory === 'Commit'),
      'Most Likely': deals.filter(d => d.forecastCategory === 'Most Likely'),
      'Best Case': deals.filter(d => d.forecastCategory === 'Best Case'),
      'Closed Won': deals.filter(d => d.stage === 'Closed Won'),
      'Closed Lost': deals.filter(d => d.stage === 'Closed Lost'),
    }

    return Object.entries(buckets).map(([label, bucketDeals]) => ({
      label,
      amount: bucketDeals.reduce((sum, d) => sum + parseAmount(d.amount), 0),
      count: bucketDeals.length,
      changePercent: 12
    }))
  }, [deals])

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      // 1. Summary Card Filter
      if (selectedCard) {
        if (selectedCard === 'Open' && d.stage.startsWith('Closed')) return false
        if (selectedCard === 'Commit' && d.forecastCategory !== 'Commit') return false
        if (selectedCard === 'Most Likely' && d.forecastCategory !== 'Most Likely') return false
        if (selectedCard === 'Best Case' && d.forecastCategory !== 'Best Case') return false
        if (selectedCard === 'Closed Won' && d.stage !== 'Closed Won') return false
        if (selectedCard === 'Closed Lost' && d.stage !== 'Closed Lost') return false
      }

      // 2. Panel Filters
      if (filters.stages.length && !filters.stages.includes(d.stage)) return false
      if (filters.forecastCategories.length && !filters.forecastCategories.includes(d.forecastCategory)) return false
      if (filters.amountMin && parseAmount(d.amount) < Number(filters.amountMin)) return false
      if (filters.amountMax && parseAmount(d.amount) > Number(filters.amountMax)) return false
      if (filters.closeDate && d.closeDate !== filters.closeDate) return false
      return true
    })
  }, [deals, filters, selectedCard])

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(repName || undefined)
    setNotifs(prev => ({
      ...prev, unreadCount: 0,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }))
  }

  const handleUpdatePlaybook = async (dealId: string, meddic: any[]) => {
    const completedCount = meddic.filter((item) => item.status === 'Completed').length;
    const meddpiccPercent = meddic.length > 0 ? Math.round((completedCount / meddic.length) * 100) : 0;

    // Update local state
    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.dealId === dealId ? { ...deal, meddpiccPercent } : deal
      )
    );

    setSelectedDeal((prev) =>
      prev && prev.dealId === dealId ? { ...prev, meddpiccPercent } : prev
    );

    // Sync to CRM
    try {
      await updateDeal(dealId, { meddpiccPercent } as any);
      console.log(`Synced MEDDPICC ${meddpiccPercent}% to CRM for deal ${dealId}`);
    } catch (error) {
      console.error(`Failed to sync MEDDPICC to CRM for deal ${dealId}:`, error);
    }
  };

  const handleUpdateCrm = async (
    dealId: string,
    updates: { stage: string; category: string; amount: string; nextStep: string }
  ) => {
    // Update local state
    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.dealId === dealId
          ? {
              ...deal,
              stage: updates.stage,
              forecastCategory: updates.category,
              amount: parseAmount(updates.amount),
            }
          : deal
      )
    );

    setSelectedDeal((prev) =>
      prev && prev.dealId === dealId
        ? {
            ...prev,
            stage: updates.stage,
            forecastCategory: updates.category,
            amount: parseAmount(updates.amount),
          }
        : prev
    );

    // Sync to CRM
    try {
      await updateDeal(dealId, {
        stage: updates.stage,
        forecastCategory: updates.category,
        amount: updates.amount,
        nextStep: updates.nextStep,
      } as any);
      console.log(`Synced CRM updates to backend for deal ${dealId}`);
    } catch (error) {
      console.error(`Failed to sync CRM updates for deal ${dealId}:`, error);
    }
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Page Title Row */}
      <div style={{ padding: '24px 28px 0 28px' }}>
        <button
          onClick={onBack || (() => router.push('/deal-boards'))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}
        >
          <ArrowLeft size={16} /> Deal Boards
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1d23', margin: 0 }}>
              {board?.name || 'Loading...'}
            </h1>
            {board?.ownerTag && (
              <span style={{ fontSize: 12, color: '#10b981', background: '#d1fae5', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
                {board.ownerTag}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationsPanel
              notifications={notifs.notifications}
              unreadCount={notifs.unreadCount}
              onMarkAllRead={handleMarkAllRead}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                border: '1px solid #e8eaed', background: '#fff',
                color: '#1a1d23', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              <Filter size={14} />
              Filters
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowGroupMenu(!showGroupMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid #e8eaed', background: '#fff',
                  color: '#1a1d23', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  width: 150, justifyContent: 'space-between'
                }}
              >
                {filters.groupBy === 'none' ? 'No grouping' : filters.groupBy === 'stage' ? 'Group by stage' : 'Group by Rep'}
                <ChevronDown size={14} color="#6b7280" />
              </button>
              
              {showGroupMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                  width: 150, background: '#fff', border: '1px solid #e8eaed',
                  borderRadius: 4, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 50, overflow: 'hidden'
                }}>
                  {[
                    { label: 'No grouping', value: 'none' },
                    { label: 'Group by stage', value: 'stage' },
                    { label: 'Group by Rep', value: 'rep' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilters({ ...filters, groupBy: opt.value as any })
                        setShowGroupMenu(false)
                      }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', fontSize: 13, border: 'none',
                        cursor: 'pointer',
                        background: filters.groupBy === opt.value ? '#737373' : '#fff',
                        color: filters.groupBy === opt.value ? '#fff' : '#1a1d23',
                      }}
                      onMouseEnter={e => {
                        if (filters.groupBy !== opt.value) e.currentTarget.style.background = '#f9fafb'
                      }}
                      onMouseLeave={e => {
                        if (filters.groupBy !== opt.value) e.currentTarget.style.background = '#fff'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px' }}>
        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          showFilters={showFilters}
        />

        {/* Summary Cards */}
        <StageSummaryCards
          cards={computedSummaryCards}
          selectedCard={selectedCard}
          onSelectCard={label => setSelectedCard(prev => prev === label ? null : label)}
        />

        {/* Table */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            Loading deals...
          </div>
        ) : (
          <DealTable
            deals={filteredDeals}
            groupBy={filters.groupBy}
            onDealClick={setSelectedDeal}
          />
        )}
      </div>

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <DealDetailPanel
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          aiEvaluation={aiEvaluation}
          isManager={false}
          onUpdatePlaybook={handleUpdatePlaybook}
          onUpdateCrm={handleUpdateCrm}
        />
      )}
    </div>
  )
}


