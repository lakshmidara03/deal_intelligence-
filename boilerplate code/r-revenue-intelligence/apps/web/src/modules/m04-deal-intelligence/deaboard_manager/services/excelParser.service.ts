/**
 * Excel Parser Service for Knowledge Base
 * 
 * Parses Excel files containing deal data and extracts patterns
 * to generate knowledge base rules for AI evaluation.
 */

import * as XLSX from 'xlsx';
import type { KnowledgeBaseRule } from '../types/ai-evaluation.types';

interface DealData {
  'Deal Id': string;
  'Deal Name': string;
  'Crm Stage': string;
  'Deal Value Inr': number;
  'Probability Pct': number;
  'Days In Current Stage': number;
  'Days Since Last Activity': number;
  'Health Status': string;
  'No Of Contacts': number;
  'Decision Maker Engaged': string;
  'Budget Confirmed': string;
  'Ai Risk Score': number;
  'Last Call Sentiment': string;
}

/**
 * Parse Excel file and extract knowledge base rules from deal patterns
 */
export async function parseExcelKnowledgeBase(
  filePath: string
): Promise<KnowledgeBaseRule[]> {
  try {
    console.log('Attempting to load Excel file from:', filePath);
    // For browser environment, we need to fetch the file
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<DealData>(sheet);

    console.log(`Loaded ${data.length} deals from Excel file`);

    // Extract patterns from deal data to generate knowledge base rules
    const rules = generateKnowledgeBaseFromDeals(data);
    
    console.log(`Generated ${rules.length} knowledge base rules from ${data.length} deals`);
    return rules;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return [];
  }
}

/**
 * Generate knowledge base rules from deal data patterns
 */
function generateKnowledgeBaseFromDeals(deals: DealData[]): KnowledgeBaseRule[] {
  const rules: KnowledgeBaseRule[] = [];
  let ruleIndex = 1;

  // Group deals by stage
  const dealsByStage = deals.reduce((acc, deal) => {
    const stage = deal['Crm Stage'] || 'Unknown';
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(deal);
    return acc;
  }, {} as Record<string, DealData[]>);

  // Generate rules for each stage
  for (const [stage, stageDeals] of Object.entries(dealsByStage)) {
    if (stageDeals.length === 0) continue;

    // Calculate benchmarks for this stage
    const avgDaysInStage = stageDeals.reduce((sum, d) => sum + d['Days In Current Stage'], 0) / stageDeals.length;
    const avgContacts = stageDeals.reduce((sum, d) => sum + d['No Of Contacts'], 0) / stageDeals.length;
    const avgRiskScore = stageDeals.reduce((sum, d) => sum + d['Ai Risk Score'], 0) / stageDeals.length;
    
    const highRiskDeals = stageDeals.filter(d => d['Ai Risk Score'] > 50);
    const lowRiskDeals = stageDeals.filter(d => d['Ai Risk Score'] < 30);

    // Rule: Days in stage threshold
    const maxDaysInStage = Math.max(...stageDeals.map(d => d['Days In Current Stage']));
    if (maxDaysInStage > 0) {
      rules.push({
        id: `KB-${String(ruleIndex++).padStart(3, '0')}`,
        stage,
        rule: `Deal should not stay in ${stage} > ${Math.round(avgDaysInStage * 1.5)} days`,
        threshold: Math.round(avgDaysInStage * 1.5),
        weight: 8,
        category: 'manager_warning',
      });
    }

    // Rule: Minimum contacts
    const minContacts = Math.min(...stageDeals.map(d => d['No Of Contacts']));
    if (minContacts < 3) {
      rules.push({
        id: `KB-${String(ruleIndex++).padStart(3, '0')}`,
        stage,
        rule: `Minimum 3 contacts should be identified in ${stage}`,
        threshold: 3,
        weight: 6,
        category: 'rep_warning',
      });
    }

    // Rule: Decision maker engagement
    const noDecisionMaker = stageDeals.filter(d => d['Decision Maker Engaged'] === 'No').length;
    if (noDecisionMaker > stageDeals.length * 0.3) {
      rules.push({
        id: `KB-${String(ruleIndex++).padStart(3, '0')}`,
        stage,
        rule: 'Decision maker must be engaged',
        threshold: 1,
        weight: 9,
        category: 'manager_warning',
      });
    }

    // Rule: Budget confirmation
    const noBudget = stageDeals.filter(d => d['Budget Confirmed'] === 'No').length;
    if (noBudget > stageDeals.length * 0.5 && stage !== 'Prospecting') {
      rules.push({
        id: `KB-${String(ruleIndex++).padStart(3, '0')}`,
        stage,
        rule: 'Budget should be confirmed',
        threshold: 1,
        weight: 7,
        category: 'rep_warning',
      });
    }

    // Rule: AI risk score threshold
    if (highRiskDeals.length > 0) {
      const avgHighRisk = highRiskDeals.reduce((sum, d) => sum + d['Ai Risk Score'], 0) / highRiskDeals.length;
      rules.push({
        id: `KB-${String(ruleIndex++).padStart(3, '0')}`,
        stage,
        rule: `AI risk score should be below ${Math.round(avgHighRisk)}`,
        threshold: Math.round(avgHighRisk),
        weight: 8,
        category: 'manager_warning',
      });
    }

    // Rule: Activity threshold
    const avgDaysSinceActivity = stageDeals.reduce((sum, d) => sum + d['Days Since Last Activity'], 0) / stageDeals.length;
    if (avgDaysSinceActivity > 14) {
      rules.push({
        id: `KB-${String(ruleIndex++).padStart(3, '0')}`,
        stage,
        rule: `Activity should not be older than ${Math.round(avgDaysSinceActivity)} days`,
        threshold: Math.round(avgDaysSinceActivity),
        weight: 5,
        category: 'rep_warning',
      });
    }

    // Rule: Last call sentiment
    const negativeSentiment = stageDeals.filter(d => d['Last Call Sentiment'] === 'Negative').length;
    if (negativeSentiment > stageDeals.length * 0.2) {
      rules.push({
        id: `KB-${String(ruleIndex++).padStart(3, '0')}`,
        stage,
        rule: 'Negative sentiment detected - follow up required',
        threshold: 1,
        weight: 7,
        category: 'rep_warning',
      });
    }
  }

  return rules;
}

/**
 * Format knowledge base rules as text context for Gemini API
 */
export function formatKnowledgeBaseForGemini(rules: KnowledgeBaseRule[]): string {
  if (rules.length === 0) {
    return 'No knowledge base rules provided.';
  }

  const groupedByStage = rules.reduce((acc, rule) => {
    if (!acc[rule.stage]) {
      acc[rule.stage] = [];
    }
    acc[rule.stage].push(rule);
    return acc;
  }, {} as Record<string, KnowledgeBaseRule[]>);

  let context = 'KNOWLEDGE BASE RULES (extracted from historical deal data):\n\n';
  
  for (const [stage, stageRules] of Object.entries(groupedByStage)) {
    context += `### ${stage} Stage\n`;
    for (const rule of stageRules) {
      context += `- ${rule.rule} (Weight: ${rule.weight}, Threshold: ${rule.threshold || 'N/A'}, Category: ${rule.category})\n`;
    }
    context += '\n';
  }

  return context;
}
