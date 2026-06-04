'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import RoleBadge from './components/RoleBadge';
import { Download, ArrowUpDown } from 'lucide-react';
import { useDeals } from './hooks/useDeals';
import type { Deal, DealDetail, DealFilterState, DealTaskPayload, DealCategory, DealStage } from './types/deal.types';
import { MOCK_DEAL_DETAILS } from './mocks/deals.mock';
import {
  createDealTask,
  createRepNotification,
  exportDealsCsv,
  fetchDealDetail,
  postDealComment,
  updateDeal,
  updateDealEscalation,
} from './services/deal.service';
import PipelineSummaryCard from './components/PipelineSummaryCard';
import DealFilters from './components/DealFilters';
import DealTable from './components/DealTable';
import DealDetailsDrawer from './components/DealDetailsDrawer';
import CommentDealModal from './components/CommentDealModal';
// Import the DealDetailPanel from the rep view components
import DealDetailPanel from '../dealboards_rep/components/deal-detail/DealDetailPanel';
// AI Evaluation imports
import { aiEvaluationEngine } from './services/aiEvaluation.service';
import { parseExcelKnowledgeBase } from './services/excelParser.service';
import { MOCK_KNOWLEDGE_BASE } from './mocks/knowledge-base.mock';
import type { DealEvaluationResult } from './types/ai-evaluation.types';
import type { KnowledgeBaseRule } from './types/ai-evaluation.types';

type DealDetailTab = 'brief' | 'warnings' | 'playbook' | 'activity' | 'crm';
type DealGroupBy = 'none' | 'rep' | 'stage';
type SortDirection = 'none' | 'asc' | 'desc';

function getAmountValue(amount: any): number {
  if (typeof amount === 'number') return amount;
  if (!amount) return 0;
  const str = String(amount).replace(/[$,]/g, '').trim();
  if (str.endsWith('K')) return parseFloat(str.slice(0, -1)) * 1000;
  if (str.endsWith('M')) return parseFloat(str.slice(0, -1)) * 1000000;
  return parseFloat(str) || Number(str.replace(/[^\d]/g, '')) || 0;
}

// Convert Manager Deal to Rep Deal format for DealDetailPanel
function convertManagerDealToRepDeal(deal: Deal) {
  return {
    dealId: deal.id,
    dealName: deal.name,
    company: deal.name?.split(' - ')[0] || 'Unknown Company',
    amount: getAmountValue(deal.amount),
    stage: deal.stage,
    owner: deal.owner?.name || 'Unknown',
    closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    aiScore: deal.meddpiccPercent,
    warnings: deal.warnings,
    meddpiccPercent: deal.meddpiccPercent,
    contacts: deal.contacts,
    activityData: deal.activityData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    forecastCategory: deal.forecastCategory || 'Open',
    assignedRep: deal.owner?.name || 'Unknown',
    notificationCount: 0,
    aiWarningCount: deal.warnings || 0,
    lastActivity: '2 days ago',
    nextStep: 'Schedule follow-up call',
    probability: deal.aiScore || 50,
    createdDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    flagCount: 0,
    playbookScore: deal.meddpiccPercent || 50,
    playbookColor: ((deal.meddpiccPercent || 50) > 70 ? 'green' : (deal.meddpiccPercent || 50) > 40 ? 'orange' : 'red') as 'green' | 'orange' | 'red',
    aiSuggestedNextStep: 'Schedule follow-up call with economic buyer',
  };
}

export default function DealBoardsManagerView() {
  const { deals, setDeals, pipelineSummary, loading } = useDeals();
  const [dealDetails, setDealDetails] = useState<DealDetail[]>(MOCK_DEAL_DETAILS);

  const [filters, setFilters] = useState<DealFilterState>({
    rep: 'all',
    stage: 'all',
    startDate: null,
    endDate: null,
    search: '',
    category: null,
  });

  const [groupBy, setGroupBy] = useState<DealGroupBy>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedDealDetail, setSelectedDealDetail] = useState<DealDetail | null>(null);
  const [commentDeal, setCommentDeal] = useState<Deal | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DealDetailTab>('brief');
  const [escalatedDealIds, setEscalatedDealIds] = useState<string[]>([]);
  const [aiEvaluation, setAiEvaluation] = useState<DealEvaluationResult | null>(null);
  const [dealEvaluations, setDealEvaluations] = useState<Record<string, DealEvaluationResult>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseRule[]>(MOCK_KNOWLEDGE_BASE);
  const evaluatedDealIdsRef = useRef<Set<string>>(new Set());

  // Load Excel knowledge base on component mount
  useEffect(() => {
    const loadKnowledgeBase = async () => {
      try {
        const rules = await parseExcelKnowledgeBase('/deal_intelligence_dataset_cleaned.xlsx');
        if (rules.length > 0) {
          // Use mock knowledge base instead of Excel-generated rules
          // Excel rules are too strict for current HubSpot data structure
          console.log(`Loaded ${rules.length} knowledge base rules from Excel, but using mock rules for better compatibility`);
          setKnowledgeBase(MOCK_KNOWLEDGE_BASE);
        }
      } catch (error) {
        console.error('Failed to load Excel knowledge base, using mock data:', error);
        setKnowledgeBase(MOCK_KNOWLEDGE_BASE);
      }
    };
    loadKnowledgeBase();
  }, []);

  // Run AI evaluation for all deals when deals load and knowledge base is ready
  useEffect(() => {
    const evaluateAllDeals = async () => {
      console.log('Evaluating deals:', deals.length, 'Knowledge base:', knowledgeBase.length);
      
      if (deals.length === 0 || knowledgeBase.length === 0) return;

      const evaluations: Record<string, DealEvaluationResult> = {};
      
      for (const deal of deals) {
        // Skip if already evaluated
        if (evaluatedDealIdsRef.current.has(deal.id)) {
          continue;
        }

        try {
          console.log('Evaluating deal:', deal.id, 'Current AI score:', deal.aiScore, 'MEDDPICC:', deal.meddpiccPercent, 'Contacts:', deal.contacts);
          const evaluation = await aiEvaluationEngine.evaluate({
            dealData: {
              stage: deal.stage,
              amount: getAmountValue(deal.amount),
              companySize: 'Medium',
              daysInStage: 15,
              contactActivity: deal.contacts || 0,
              repNotes: '',
              closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              nextSteps: '',
              stakeholders: [],
              aiScore: deal.meddpiccPercent,
              warnings: deal.warnings,
              meddpiccPercent: deal.meddpiccPercent,
              contacts: deal.contacts,
              activityData: deal.activityData,
            },
            apiResponses: [],
            knowledgeBase: knowledgeBase,
          });
          console.log('Evaluation result for deal', deal.id, ':', evaluation.ai_score, 'Warnings:', evaluation.ai_warnings_rep.length, evaluation.ai_warnings_manager.length, evaluation.rule_based_warnings.length);
          evaluations[deal.id] = evaluation;
          evaluatedDealIdsRef.current.add(deal.id);
        } catch (error) {
          console.error(`Error evaluating deal ${deal.id}:`, error);
        }
      }

      if (Object.keys(evaluations).length > 0) {
        setDealEvaluations(evaluations);
        
        // Update deals with dynamic AI scores and warnings
        const updatedDeals = deals.map(deal => {
          const evalResult = evaluations[deal.id];
          if (evalResult) {
            console.log('Updating deal', deal.id, 'from', deal.aiScore, 'to', evalResult.ai_score);
            return {
              ...deal,
              aiScore: evalResult.ai_score,
              warnings: evalResult.ai_warnings_rep.length + evalResult.ai_warnings_manager.length + evalResult.rule_based_warnings.length,
            };
          }
          return deal;
        });
        
        console.log('Setting updated deals:', updatedDeals.length);
        setDeals(updatedDeals);
      }
    };

    evaluateAllDeals();
  }, [deals, knowledgeBase]);

  const computedPipelineSummary = useMemo(() => {
    const categoriesList: DealCategory[] = ['Open', 'Commit', 'Most Likely', 'Best Case', 'Closed Won', 'Closed Lost'];
    
    return categoriesList.map((category) => {
      const categoryDeals = deals.filter((d) => d.category === category);
      const count = categoryDeals.length;
      
      let total = 0;
      categoryDeals.forEach((d) => {
        const clean = d.amount.replace(/,/g, '');
        let val = parseFloat(clean.replace(/[^\d.]/g, '')) || 0;
        if (clean.toLowerCase().includes('k')) {
          val *= 1000;
        } else if (clean.toLowerCase().includes('m')) {
          val *= 1000000;
        }
        total += val;
      });
      
      let amountStr = '$0';
      if (total >= 1000000) {
        amountStr = `$${(total / 1000000).toFixed(1)}M`;
      } else if (total >= 1000) {
        amountStr = `$${(total / 1000).toFixed(0)}K`;
      } else {
        amountStr = `$${total}`;
      }
      
      const mockSummary = pipelineSummary.find((s) => s.label === category);
      const change = mockSummary?.change ?? '$0 [0]';
      
      return {
        label: category,
        amount: amountStr,
        count,
        change,
      };
    });
  }, [deals, pipelineSummary]);

  const reps = useMemo(() => {
    const names = [...new Set(deals.map((d) => d.owner.name))];
    return names.sort();
  }, [deals]);

  const stages = useMemo(() => {
    const names = [...new Set(deals.map((d) => d.stage))];
    return names.sort();
  }, [deals]);

  const categories = useMemo(() => {
    const names = [...new Set(computedPipelineSummary.map((summary) => summary.label))];
    return names;
  }, [computedPipelineSummary]);

  const filteredDeals = useMemo(() => {
    console.log('[Filter Debug] START ====================');
    console.log('[Filter Debug] filters:', JSON.stringify(filters));
    console.log('[Filter Debug] deals count:', deals?.length || 0);
    
    if (!deals || deals.length === 0) {
      console.log('[Filter Debug] No deals to filter');
      return [];
    }
    
    // Show first 3 deals
    deals.slice(0, 3).forEach((deal, i) => {
      console.log(`[Filter Debug] Deal ${i}:`, {
        id: deal.id,
        name: deal.name,
        stage: deal.stage,
        forecastCategory: deal.forecastCategory,
        owner: deal.owner?.name
      });
    });
    
    const result = deals.filter((deal) => {
      // Category/Stage filter (the category dropdown contains stage values)
      if (filters.category && filters.category !== 'all') {
        // Check both stage and forecastCategory since HubSpot data varies
        const matchesStage = deal.stage === filters.category;
        const matchesForecast = deal.forecastCategory === filters.category;
        if (!matchesStage && !matchesForecast) {
          console.log(`[Filter] Excluded ${deal.name}: stage=${deal.stage}, forecast=${deal.forecastCategory} !== filter=${filters.category}`);
          return false;
        }
      }
      
      // Rep filter
      if (filters.rep && filters.rep !== 'all') {
        if (deal.owner?.name !== filters.rep) {
          return false;
        }
      }
      
      // Stage filter (from stage dropdown)
      if (filters.stage && filters.stage !== 'all') {
        if (deal.stage !== filters.stage) {
          return false;
        }
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!deal.name?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log('[Filter Debug] Filtered count:', result.length);
    console.log('[Filter Debug] END ====================');
    return result;
  }, [deals, filters]);

  const visibleDeals = useMemo(() => {
    if (sortDirection === 'none') return filteredDeals;

    return [...filteredDeals].sort((a, b) => {
      const amountA = getAmountValue(a.amount);
      const amountB = getAmountValue(b.amount);
      return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
    });
  }, [filteredDeals, sortDirection]);

  const handleCategoryClick = (label: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === label ? null : label,
    }));
  };

  const handleSelectDeal = async (deal: Deal) => {
    setSelectedDeal(deal);
    setSelectedDealDetail(null);
    setActiveDetailTab('brief');

    // Run AI evaluation using the evaluation engine (single source of truth)
    try {
      const evaluation = await aiEvaluationEngine.evaluate({
        dealData: {
          stage: deal.stage,
          amount: getAmountValue(deal.amount),
          companySize: 'Medium',
          daysInStage: 15,
          contactActivity: deal.contacts || 0,
          repNotes: '',
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextSteps: '',
          stakeholders: [],
          aiScore: deal.meddpiccPercent,
          warnings: deal.warnings,
          meddpiccPercent: deal.meddpiccPercent,
          contacts: deal.contacts,
          activityData: deal.activityData,
        },
        apiResponses: [],
        knowledgeBase: knowledgeBase,
      });
      setAiEvaluation(evaluation);
    } catch (error) {
      console.error('AI evaluation error:', error);
    }

    const localDetail = dealDetails.find((d) => d.dealId === deal.id);
    if (localDetail) {
      setSelectedDealDetail(localDetail);
    } else {
      const detail = await fetchDealDetail(deal.id);
      setDealDetails((prev) => [...prev, detail]);
      setSelectedDealDetail(detail);
    }
  };

  const handleUpdatePlaybook = async (dealId: string, meddic: DealDetail['meddic']) => {
    const completedCount = meddic.filter((item) => item.status === 'Completed').length;
    const meddpiccPercent = Math.round((completedCount / meddic.length) * 100);

    // Update local state
    setDealDetails((prev) =>
      prev.map((detail) =>
        detail.dealId === dealId
          ? { ...detail, playbookCompletion: meddpiccPercent, meddic }
          : detail
      )
    );

    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === dealId ? { ...deal, meddpiccPercent } : deal
      )
    );

    setSelectedDeal((prev) => (prev && prev.id === dealId ? { ...prev, meddpiccPercent } : prev));
    setSelectedDealDetail((prev) =>
      prev && prev.dealId === dealId
        ? { ...prev, playbookCompletion: meddpiccPercent, meddic }
        : prev
    );

    // Sync to CRM
    try {
      await updateDeal(dealId, { meddpiccPercent });

      // Notify the rep
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        try {
          await createRepNotification({
            repName: deal.owner.name,
            message: `MEDDPICC score updated to ${meddpiccPercent}% for deal "${deal.name}"`,
            type: 'info',
          });
        } catch (notifErr) {
          console.warn('Failed to send MEDDPICC update notification:', notifErr);
        }
      }

      console.log(`Synced MEDDPICC ${meddpiccPercent}% to CRM for deal ${dealId}`);
    } catch (error) {
      console.error(`Failed to sync MEDDPICC to CRM for deal ${dealId}:`, error);
    }
  };

  const handleUpdateCrm = async (
    dealId: string,
    updates: { stage: DealStage; category: DealCategory; amount: string; nextStep: string }
  ) => {
    setDealDetails((prev) =>
      prev.map((detail) =>
        detail.dealId === dealId
          ? {
              ...detail,
              crm: {
                ...detail.crm,
                forecastCategory: updates.category,
                nextStep: updates.nextStep,
              },
            }
          : detail
      )
    );

    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              stage: updates.stage,
              category: updates.category,
              amount: updates.amount,
            }
          : deal
      )
    );

    setSelectedDeal((prev) =>
      prev && prev.id === dealId
        ? {
            ...prev,
            stage: updates.stage,
            category: updates.category,
            amount: updates.amount,
          }
        : prev
    );
    setSelectedDealDetail((prev) =>
      prev && prev.dealId === dealId
        ? {
            ...prev,
            crm: {
              ...prev.crm,
              forecastCategory: updates.category,
              nextStep: updates.nextStep,
            },
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
      });

      // Notify the rep
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        try {
          await createRepNotification({
            repName: deal.owner.name,
            message: `CRM updated for deal "${deal.name}" — stage: ${updates.stage}, category: ${updates.category}`,
            type: 'activity',
          });
        } catch (notifErr) {
          console.warn('Failed to send CRM update notification:', notifErr);
        }
      }

      console.log(`Synced CRM updates to CRM for deal ${dealId}:`, updates);
      showToast(`CRM updated for ${selectedDeal?.name || 'deal'}.`);
    } catch (error) {
      console.error(`Failed to sync CRM updates to CRM for deal ${dealId}:`, error);
      showToast(`Failed to sync CRM updates for ${selectedDeal?.name || 'deal'}.`);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleEscalation = async (deal: Deal) => {
    const isEscalated = escalatedDealIds.includes(deal.id);
    const nextEscalated = !isEscalated;

    try {
      await updateDealEscalation(deal.id, nextEscalated);
      setEscalatedDealIds((prev) =>
        nextEscalated ? [...prev, deal.id] : prev.filter((dealId) => dealId !== deal.id)
      );

      // Notify the rep
      try {
        await createRepNotification({
          repName: deal.owner.name,
          message: isEscalated
            ? `Escalation removed for deal "${deal.name}"`
            : `Deal "${deal.name}" has been escalated by your manager`,
          type: isEscalated ? 'info' : 'warning',
        });
      } catch (notifErr) {
        console.warn('Failed to send escalation notification:', notifErr);
      }

      showToast(
        isEscalated
          ? `Escalation removed for ${deal.name}.`
          : `Deal escalated to high risk. ${deal.owner.name} will be notified.`
      );
    } catch (error) {
      console.error('Failed to update deal escalation:', error);
      showToast('Could not update escalation because the backend request failed.');
    }
  };

  const handleExportCsv = async () => {
    const csv = await exportDealsCsv(visibleDeals);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deal-board.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateTask = async (payload: DealTaskPayload) => {
    try {
      await createDealTask(payload);
      showToast('Task created successfully.');
    } catch (error) {
      console.error('Failed to create task:', error);
      showToast('Could not create task because the backend request failed.');
    }
  };

  const handleAddManagerTask = async (task: { name: string; description: string }) => {
    try {
      // Create task payload for the API
      const payload: DealTaskPayload = {
        dealId: selectedDeal?.id || '',
        title: task.name,
        description: task.description,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
        assignee: selectedDeal?.owner.name || 'Manager',
      };
      await createDealTask(payload);

      // Notify the rep
      if (selectedDeal) {
        try {
          await createRepNotification({
            repName: selectedDeal.owner.name,
            message: `New task "${task.name}" assigned to you on deal "${selectedDeal.name}"`,
            type: 'activity',
          });
        } catch (notifErr) {
          console.warn('Failed to send task notification:', notifErr);
        }
      }

      showToast(`Task "${task.name}" added successfully`);
    } catch (error) {
      console.error('Failed to add manager task:', error);
      showToast('Failed to add task');
    }
  };

  const handlePostComment = async (comment: string) => {
    if (!commentDeal) return;

    try {
      await postDealComment(commentDeal.id, { comment });

      // Notify the rep
      try {
        await createRepNotification({
          repName: commentDeal.owner.name,
          message: `New comment on deal "${commentDeal.name}" from your manager`,
          type: 'info',
        });
      } catch (notifErr) {
        console.warn('Failed to send comment notification:', notifErr);
      }

      setCommentDeal(null);
      showToast('Comment posted successfully.');
    } catch (error) {
      console.error('Failed to post comment:', error);
      showToast('Could not post comment because the backend request failed.');
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#FAFBFC]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">Deal Boards</h1>
              <span className="text-sm text-gray-400">Team Board — ENT</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RoleBadge role="sales_manager" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-4 space-y-4">
        {/* Board Title Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Team Board — Enterprise</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupBy((prev) => (prev === 'rep' ? 'none' : 'rep'))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                groupBy === 'rep'
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Group by Rep
            </button>
            <button
              type="button"
              onClick={() => setGroupBy((prev) => (prev === 'stage' ? 'none' : 'stage'))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                groupBy === 'stage'
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Group by Stage
            </button>
            <button
              type="button"
              onClick={() =>
                setSortDirection((prev) =>
                  prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none'
                )
              }
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                sortDirection !== 'none'
                  ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ArrowUpDown size={14} />
              {sortDirection === 'asc' ? 'Sort Low' : sortDirection === 'desc' ? 'Sort High' : 'Sort'}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1E3A5F] text-white rounded-md text-xs font-medium hover:bg-[#152a45] transition-colors"
              onClick={handleExportCsv}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Pipeline Summary Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {pipelineSummary.map((summary) => (
            <PipelineSummaryCard
              key={summary.label}
              label={summary.label}
              amount={summary.amount}
              count={summary.count}
              change={summary.change}
              isActive={filters.category === summary.label}
              onClick={() => handleCategoryClick(summary.label)}
            />
          ))}
        </div>

        {/* Filters */}
        <DealFilters
          filters={filters}
          onChange={setFilters}
          reps={reps}
          stages={stages}
          categories={categories}
        />

        {/* Deal Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <DealTable
            deals={visibleDeals}
            groupBy={groupBy}
            dealDetails={dealDetails}
            escalatedDealIds={escalatedDealIds}
            onSelectDeal={handleSelectDeal}
            onCommentDeal={setCommentDeal}
            onToggleEscalation={handleToggleEscalation}
          />
        )}
      </div>

      {toastMessage && (
        <div className="fixed right-6 top-24 z-50 rounded-lg bg-[#153E91] px-6 py-4 text-sm font-semibold text-white shadow-xl">
          {toastMessage}
        </div>
      )}

      {selectedDeal && (
        <DealDetailPanel
          deal={convertManagerDealToRepDeal(selectedDeal)}
          onClose={() => setSelectedDeal(null)}
          aiEvaluation={aiEvaluation}
          isManager={true}
          onAddTask={handleAddManagerTask}
          onUpdatePlaybook={handleUpdatePlaybook}
          onUpdateCrm={handleUpdateCrm}
        />
      )}

      {commentDeal && (
        <CommentDealModal
          deal={commentDeal}
          onClose={() => setCommentDeal(null)}
          onPost={handlePostComment}
        />
      )}
    </div>
  );
}
