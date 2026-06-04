import type { KnowledgeBaseRule } from '../types/ai-evaluation.types';

/**
 * Mock Knowledge Base Rules
 * 
 * In production, this would be loaded from Excel or JSON file
 * compiled by the sales team.
 */
export const MOCK_KNOWLEDGE_BASE: KnowledgeBaseRule[] = [
  // General Rules (apply to all stages)
  {
    id: 'KB-001',
    stage: 'All',
    rule: 'MEDDPICC completion should be at least 50%',
    threshold: 50,
    weight: 7,
    category: 'rep_warning',
  },
  {
    id: 'KB-002',
    stage: 'All',
    rule: 'Minimum 3 contacts identified',
    threshold: 3,
    weight: 6,
    category: 'rep_warning',
  },
  {
    id: 'KB-003',
    stage: 'All',
    rule: 'Minimum 5 touchpoints in last 30 days',
    threshold: 5,
    weight: 5,
    category: 'rep_warning',
  },
  {
    id: 'KB-004',
    stage: 'All',
    rule: 'Deal should not stay in stage > 30 days',
    threshold: 30,
    weight: 8,
    category: 'manager_warning',
  },

  // Discovery Stage Rules
  {
    id: 'KB-005',
    stage: 'Discovery',
    rule: 'MEDDPICC completion should be at least 20%',
    threshold: 20,
    weight: 7,
    category: 'rep_warning',
  },
  {
    id: 'KB-006',
    stage: 'Discovery',
    rule: 'Economic buyer must be identified',
    threshold: 1,
    weight: 9,
    category: 'manager_warning',
  },
  {
    id: 'KB-015',
    stage: 'Discovery',
    rule: 'Deal amount should be at least 10000',
    threshold: 10000,
    weight: 5,
    category: 'rep_warning',
  },

  // Demo Stage Rules
  {
    id: 'KB-007',
    stage: 'Demo',
    rule: 'MEDDPICC completion should be at least 40%',
    threshold: 40,
    weight: 7,
    category: 'rep_warning',
  },
  {
    id: 'KB-008',
    stage: 'Demo',
    rule: 'Technical champion must be identified',
    threshold: 1,
    weight: 8,
    category: 'rep_warning',
  },
  {
    id: 'KB-016',
    stage: 'Demo',
    rule: 'Deal amount should be at least 25000',
    threshold: 25000,
    weight: 5,
    category: 'rep_warning',
  },

  // Proposal Stage Rules
  {
    id: 'KB-009',
    stage: 'Proposal',
    rule: 'MEDDPICC completion should be at least 60%',
    threshold: 60,
    weight: 7,
    category: 'rep_warning',
  },
  {
    id: 'KB-010',
    stage: 'Proposal',
    rule: 'Decision criteria must be documented',
    threshold: 1,
    weight: 8,
    category: 'rep_warning',
  },
  {
    id: 'KB-017',
    stage: 'Proposal',
    rule: 'Deal amount should be at least 50000',
    threshold: 50000,
    weight: 5,
    category: 'rep_warning',
  },

  // Negotiation Stage Rules
  {
    id: 'KB-011',
    stage: 'Negotiation',
    rule: 'MEDDPICC completion should be at least 80%',
    threshold: 80,
    weight: 7,
    category: 'rep_warning',
  },
  {
    id: 'KB-012',
    stage: 'Negotiation',
    rule: 'Legal review must be initiated',
    threshold: 1,
    weight: 8,
    category: 'rep_warning',
  },
  {
    id: 'KB-018',
    stage: 'Negotiation',
    rule: 'Deal amount should be at least 75000',
    threshold: 75000,
    weight: 5,
    category: 'rep_warning',
  },

  // Closed Lost Stage Rules
  {
    id: 'KB-013',
    stage: 'Closed Lost',
    rule: 'Loss reason must be documented',
    threshold: 1,
    weight: 5,
    category: 'rep_warning',
  },
  {
    id: 'KB-014',
    stage: 'Closed Lost',
    rule: 'Competitor analysis should be completed',
    threshold: 1,
    weight: 6,
    category: 'manager_warning',
  },
  {
    id: 'KB-019',
    stage: 'Closed Lost',
    rule: 'Closed Lost deals should have score penalty',
    threshold: 1,
    weight: 10,
    category: 'manager_warning',
  },
  {
    id: 'KB-020',
    stage: 'Closed Lost',
    rule: 'Higher value lost deals should have lower score',
    threshold: 200,
    weight: 8,
    category: 'manager_warning',
  },
  {
    id: 'KB-021',
    stage: 'Closed Lost',
    rule: 'Lost deals below 100 should have higher penalty',
    threshold: 100,
    weight: 5,
    category: 'rep_warning',
  },
];
