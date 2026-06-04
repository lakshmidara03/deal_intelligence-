import type {
  DealEvaluationResult,
  EvaluationInput,
  DealParameters,
  KnowledgeBaseRule,
  AIWarning,
  RuleBasedWarning,
} from '../types/ai-evaluation.types';
import { evaluateDealWithGemini } from './gemini.service';

/**
 * AI Evaluation Engine for B2B Sales Intelligence
 * 
 * Single source of truth for AI evaluation.
 * Combines Gemini API responses with knowledge base rules to generate
 * AI scores and warnings based on all deal parameters.
 */
export class AIEvaluationEngine {
  /**
   * Main evaluation function - single source of truth
   * 
   * This method:
   * 1. Sends deal data + knowledge base to Gemini API
   * 2. Applies knowledge base rules locally
   * 3. Combines Gemini insights with rule-based evaluation
   * 4. Returns unified AI score and warnings
   */
  async evaluate(input: EvaluationInput): Promise<DealEvaluationResult> {
    const { dealData, knowledgeBase, apiResponses } = input;

    // Step 1: Get AI insights from Gemini API (disabled due to 404 errors)
    let geminiResult: DealEvaluationResult | null = null;
    // try {
    //   const knowledgeBaseContext = this.formatKnowledgeBaseForGemini(knowledgeBase);
    //   geminiResult = await evaluateDealWithGemini({
    //     dealData: this.formatDealDataForGemini(dealData),
    //     knowledgeBaseContext,
    //   });
    // } catch (error) {
    //   console.error('Gemini API error, using rule-based evaluation only:', error);
    // }

    // Step 2: Apply knowledge base rules locally
    const kbResult = this.evaluateKnowledgeBase(dealData, knowledgeBase);
    const ruleBasedWarnings = kbResult.ruleBased;

    // Step 3: Evaluate API responses for additional signals
    const apiResult = this.evaluateAPIResponses(dealData, apiResponses || []);

    // Step 4: Combine all evaluations (Gemini + Knowledge Base + API + Deal Parameters)
    const finalResult = this.combineEvaluations(
      geminiResult,
      ruleBasedWarnings,
      kbResult,
      apiResult,
      dealData
    );

    return finalResult;
  }

  /**
   * Combine Gemini AI evaluation with rule-based evaluation
   */
  private combineEvaluations(
    geminiResult: DealEvaluationResult | null,
    ruleBasedWarnings: RuleBasedWarning[],
    kbResult: { ruleBased: RuleBasedWarning[]; repWarnings: AIWarning[]; managerWarnings: AIWarning[] },
    apiResult: { repWarnings: AIWarning[]; managerWarnings: AIWarning[] },
    dealData: DealParameters
  ): DealEvaluationResult {
    // Combine all warnings from all sources
    const allRepWarnings = [
      ...(geminiResult?.ai_warnings_rep || []),
      ...kbResult.repWarnings,
      ...apiResult.repWarnings,
    ];
    const allManagerWarnings = [
      ...(geminiResult?.ai_warnings_manager || []),
      ...kbResult.managerWarnings,
      ...apiResult.managerWarnings,
    ];
    const allRuleBasedWarnings = [
      ...(geminiResult?.rule_based_warnings || []),
      ...ruleBasedWarnings,
    ];

    if (geminiResult) {
      // Use Gemini as primary source, but add all warnings
      const recalculatedScore = this.calculateScore(
        {
          ai_score: 100,
          ai_score_rationale: '',
          ai_warnings_rep: allRepWarnings,
          ai_warnings_manager: allManagerWarnings,
          rule_based_warnings: allRuleBasedWarnings,
        },
        dealData
      );

      const rationale = this.generateRationale(recalculatedScore, {
        ai_score: recalculatedScore,
        ai_score_rationale: '',
        ai_warnings_rep: allRepWarnings,
        ai_warnings_manager: allManagerWarnings,
        rule_based_warnings: allRuleBasedWarnings,
      });
      const limitedRepWarnings = this.limitRepWarnings(allRepWarnings);

      return {
        ai_score: recalculatedScore,
        ai_score_rationale: rationale,
        ai_warnings_rep: limitedRepWarnings,
        ai_warnings_manager: allManagerWarnings,
        rule_based_warnings: allRuleBasedWarnings,
      };
    } else {
      // Fallback to rule-based + API evaluation only
      const aiScore = this.calculateScore(
        {
          ai_score: 100,
          ai_score_rationale: '',
          ai_warnings_rep: allRepWarnings,
          ai_warnings_manager: allManagerWarnings,
          rule_based_warnings: allRuleBasedWarnings,
        },
        dealData
      );

      const rationale = this.generateRationale(aiScore, {
        ai_score: aiScore,
        ai_score_rationale: '',
        ai_warnings_rep: allRepWarnings,
        ai_warnings_manager: allManagerWarnings,
        rule_based_warnings: allRuleBasedWarnings,
      });
      const limitedRepWarnings = this.limitRepWarnings(allRepWarnings);

      return {
        ai_score: aiScore,
        ai_score_rationale: rationale,
        ai_warnings_rep: limitedRepWarnings,
        ai_warnings_manager: allManagerWarnings,
        rule_based_warnings: allRuleBasedWarnings,
      };
    }
  }

  /**
   * Evaluate against knowledge base rules
   */
  private evaluateKnowledgeBase(
    dealData: DealParameters,
    knowledgeBase: KnowledgeBaseRule[]
  ): {
    ruleBased: RuleBasedWarning[];
    repWarnings: AIWarning[];
    managerWarnings: AIWarning[];
  } {
    const ruleBased: RuleBasedWarning[] = [];
    const repWarnings: AIWarning[] = [];
    const managerWarnings: AIWarning[] = [];

    // Filter rules that match the deal stage OR apply to all stages
    const stageRules = knowledgeBase.filter((rule) => 
      rule.stage.toLowerCase() === dealData.stage.toLowerCase() || 
      rule.stage.toLowerCase() === 'all'
    );

    for (const rule of stageRules) {
      const violation = this.checkRuleViolation(dealData, rule);
      if (violation) {
        ruleBased.push({
          warning: rule.rule,
          triggered_by: `KB Rule ${rule.id}`,
        });

        if (rule.category === 'rep_warning') {
          repWarnings.push({
            severity: this.getSeverityFromWeight(rule.weight),
            warning: this.formatRepWarning(rule, dealData),
            source: `KB Rule ${rule.id}`,
          });
        } else if (rule.category === 'manager_warning') {
          managerWarnings.push({
            severity: this.getSeverityFromWeight(rule.weight),
            warning: this.formatManagerWarning(rule, dealData),
            source: `KB Rule ${rule.id}`,
          });
        }
      }
    }

    return { ruleBased, repWarnings, managerWarnings };
  }

  /**
   * Check if a rule is violated
   */
  private checkRuleViolation(
    dealData: DealParameters,
    rule: KnowledgeBaseRule
  ): boolean {
    const meddpicc = dealData.meddpiccPercent || 0;
    const contacts = dealData.contacts || 0;
    const totalActivity = dealData.activityData?.reduce((a, b) => a + b, 0) || 0;
    const daysInStage = dealData.daysInStage || 0;
    const amount = dealData.amount || 0;

    console.log(`Checking rule: ${rule.rule}, MEDDPICC: ${meddpicc}, Contacts: ${contacts}, Activity: ${totalActivity}, Days: ${daysInStage}, Amount: ${amount}, Threshold: ${rule.threshold}`);

    // Check MEDDPICC threshold
    if (rule.rule.toLowerCase().includes('meddpicc')) {
      const violated = meddpicc < (rule.threshold || 50);
      console.log(`MEDDPICC check: ${meddpicc} < ${rule.threshold} = ${violated}`);
      return violated;
    }
    
    // Check contacts threshold
    if (rule.rule.toLowerCase().includes('contact')) {
      const violated = contacts < (rule.threshold || 3);
      console.log(`Contacts check: ${contacts} < ${rule.threshold} = ${violated}`);
      return violated;
    }
    
    // Check activity/touchpoints threshold
    if (rule.rule.toLowerCase().includes('touchpoint') || rule.rule.toLowerCase().includes('activity')) {
      const violated = totalActivity < (rule.threshold || 5);
      console.log(`Activity check: ${totalActivity} < ${rule.threshold} = ${violated}`);
      return violated;
    }
    
    // Check days in stage threshold
    if (rule.rule.toLowerCase().includes('days in stage') || rule.rule.toLowerCase().includes('stay in stage')) {
      const violated = daysInStage > (rule.threshold || 30);
      console.log(`Days in stage check: ${daysInStage} > ${rule.threshold} = ${violated}`);
      return violated;
    }

    // Check amount threshold (for deal size rules)
    const ruleLower = rule.rule.toLowerCase();
    if (ruleLower.includes('amount') || ruleLower.includes('value') || 
        (ruleLower.includes('below') && rule.threshold !== undefined)) {
      // For "higher value should have lower score" rules, invert the logic
      if (ruleLower.includes('higher') && ruleLower.includes('score')) {
        const violated = amount > (rule.threshold || 200);
        console.log(`Amount check (higher value penalty): ${amount} > ${rule.threshold || 200} = ${violated}`);
        return violated;
      }
      // For "below threshold should have penalty" rules
      if (ruleLower.includes('below') || ruleLower.includes('penalty')) {
        const violated = amount < (rule.threshold || 100);
        console.log(`Amount check (below threshold penalty): ${amount} < ${rule.threshold || 100} = ${violated}`);
        return violated;
      }
      // Standard amount threshold check
      const violated = amount < (rule.threshold || 10000);
      console.log(`Amount check: ${amount} < ${rule.threshold || 10000} = ${violated}`);
      return violated;
    }
    
    // For rules without specific keywords, use MEDDPICC as default metric
    if (rule.threshold && rule.threshold > 0) {
      const violated = meddpicc < rule.threshold;
      console.log(`Default MEDDPICC check: ${meddpicc} < ${rule.threshold} = ${violated}`);
      return violated;
    }
    
    return false;
  }

  /**
   * Evaluate API responses for anomalies
   */
  private evaluateAPIResponses(
    dealData: DealParameters,
    apiResponses: any[]
  ): { repWarnings: AIWarning[]; managerWarnings: AIWarning[] } {
    const repWarnings: AIWarning[] = [];
    const managerWarnings: AIWarning[] = [];

    // Example API anomaly detection
    for (const response of apiResponses) {
      // Check for low engagement scores
      if (response.engagementScore !== undefined && response.engagementScore < 50) {
        repWarnings.push({
          severity: 'medium',
          warning: 'Low engagement score detected — increase outreach frequency',
          source: 'API: engagementScore',
        });
        managerWarnings.push({
          severity: 'medium',
          warning: `Deal ${dealData.stage} has low engagement (${response.engagementScore}/100) — at risk of stalling`,
          source: 'API: engagementScore',
        });
      }

      // Check for missing stakeholder data
      if (response.stakeholderCount !== undefined && response.stakeholderCount < 2) {
        repWarnings.push({
          severity: 'high',
          warning: 'Insufficient stakeholders identified — map decision makers this week',
          source: 'API: stakeholderCount',
        });
        managerWarnings.push({
          severity: 'high',
          warning: `Deal lacks stakeholder coverage (${response.stakeholderCount} identified) — forecast risk elevated`,
          source: 'API: stakeholderCount',
        });
      }

      // Check for intent score anomalies
      if (response.intentScore !== undefined && response.intentScore < 30) {
        repWarnings.push({
          severity: 'low',
          warning: 'Low buying intent detected — qualify urgency with champion',
          source: 'API: intentScore',
        });
      }
    }

    return { repWarnings, managerWarnings };
  }

  /**
   * Evaluate deal parameters against stage benchmarks
   */
  private evaluateDealParameters(
    dealData: DealParameters
  ): { repWarnings: AIWarning[]; managerWarnings: AIWarning[] } {
    const repWarnings: AIWarning[] = [];
    const managerWarnings: AIWarning[] = [];

    // Stage-specific benchmarks
    const benchmarks = this.getStageBenchmarks(dealData.stage);

    // Check days in stage
    if (dealData.daysInStage && dealData.daysInStage > benchmarks.maxDaysInStage) {
      repWarnings.push({
        severity: 'high',
        warning: `Deal stalled for ${dealData.daysInStage} days — schedule review with champion`,
        source: 'Deal Parameter: daysInStage',
      });
      managerWarnings.push({
        severity: 'high',
        warning: `Deal ${dealData.stage} for ${dealData.daysInStage} days (benchmark: ${benchmarks.maxDaysInStage}) — $${dealData.amount.toLocaleString()} at risk`,
        source: 'Deal Parameter: daysInStage',
      });
    }

    // Check MEDDPICC completion
    if (dealData.meddpiccPercent !== undefined && dealData.meddpiccPercent < benchmarks.minMeddpicc) {
      repWarnings.push({
        severity: 'medium',
        warning: `MEDDPICC at ${dealData.meddpiccPercent}% — complete missing criteria`,
        source: 'Deal Parameter: meddpiccPercent',
      });
      managerWarnings.push({
        severity: 'medium',
        warning: `MEDDPICC ${dealData.meddpiccPercent}% below ${benchmarks.minMeddpicc}% benchmark for ${dealData.stage}`,
        source: 'Deal Parameter: meddpiccPercent',
      });
    }

    // Check contact activity
    const totalActivity = dealData.activityData?.reduce((a, b) => a + b, 0) || 0;
    if (totalActivity < benchmarks.minActivity) {
      repWarnings.push({
        severity: 'medium',
        warning: 'Low contact activity — engage with key stakeholders this week',
        source: 'Deal Parameter: activityData',
      });
    }

    // Check if close date is approaching
    if (dealData.closeDate) {
      const daysToClose = this.getDaysToClose(dealData.closeDate);
      if (daysToClose > 0 && daysToClose < 14 && dealData.stage !== 'Closed Won') {
        repWarnings.push({
          severity: 'high',
          warning: `Close date in ${daysToClose} days — confirm decision timeline`,
          source: 'Deal Parameter: closeDate',
        });
        managerWarnings.push({
          severity: 'high',
          warning: `Deal closes in ${daysToClose} days but not won — $${dealData.amount.toLocaleString()} at risk`,
          source: 'Deal Parameter: closeDate',
        });
      }
    }

    return { repWarnings, managerWarnings };
  }

  /**
   * Calculate AI score based on warnings
   */
  private calculateScore(
    result: DealEvaluationResult,
    dealData: DealParameters
  ): number {
    let score = 100;

    // Deduct points for warnings
    const allWarnings = [
      ...result.ai_warnings_rep,
      ...result.ai_warnings_manager,
      ...result.rule_based_warnings,
    ];

    for (const warning of allWarnings) {
      const severity = (warning as AIWarning).severity || 'medium';
      switch (severity) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
        default:
          // Rule-based warnings
          score -= 5;
      }
    }

    // Additional penalty if too many warnings
    if (allWarnings.length > 5) {
      score -= 10;
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate rationale for the AI score
   */
  private generateRationale(
    score: number,
    result: DealEvaluationResult
  ): string {
    const warningCount = result.ai_warnings_rep.length + result.ai_warnings_manager.length;
    
    if (score >= 80) {
      return 'Deal is healthy with strong signals across all parameters.';
    } else if (score >= 60) {
      return `Minor risks detected (${warningCount} warnings) - address key gaps to improve trajectory.`;
    } else if (score >= 40) {
      return `Moderate risk - multiple signals misaligned with stage benchmarks (${warningCount} warnings).`;
    } else {
      return `High risk - deal likely to stall or be lost (${warningCount} critical warnings).`;
    }
  }

  /**
   * Sort rep warnings by severity (most severe first)
   */
  private limitRepWarnings(warnings: AIWarning[]): AIWarning[] {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return warnings
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Get severity from weight
   */
  private getSeverityFromWeight(weight: number): 'high' | 'medium' | 'low' {
    if (weight >= 8) return 'high';
    if (weight >= 5) return 'medium';
    return 'low';
  }

  /**
   * Format warning for sales rep
   */
  private formatRepWarning(rule: KnowledgeBaseRule, dealData: DealParameters): string {
    // Make warnings tactical and actionable
    if (rule.rule.toLowerCase().includes('meddpicc')) {
      return `MEDDPICC incomplete — complete missing criteria this week`;
    }
    if (rule.rule.toLowerCase().includes('contact')) {
      return `Insufficient contacts — engage with economic buyer`;
    }
    if (rule.rule.toLowerCase().includes('activity')) {
      return `Low activity — schedule call with champion`;
    }
    return rule.rule;
  }

  /**
   * Format warning for sales manager
   */
  private formatManagerWarning(rule: KnowledgeBaseRule, dealData: DealParameters): string {
    // Include full deal context
    return `${rule.rule} for $${dealData.amount.toLocaleString()} deal in ${dealData.stage} stage`;
  }

  /**
   * Get stage benchmarks
   */
  private getStageBenchmarks(stage: string): {
    maxDaysInStage: number;
    minMeddpicc: number;
    minActivity: number;
  } {
    const benchmarks: Record<string, any> = {
      'Discovery': { maxDaysInStage: 30, minMeddpicc: 20, minActivity: 5 },
      'Demo': { maxDaysInStage: 45, minMeddpicc: 40, minActivity: 8 },
      'Proposal': { maxDaysInStage: 30, minMeddpicc: 60, minActivity: 10 },
      'Negotiation': { maxDaysInStage: 21, minMeddpicc: 80, minActivity: 12 },
      'Closed Won': { maxDaysInStage: 999, minMeddpicc: 100, minActivity: 0 },
      'Closed Lost': { maxDaysInStage: 999, minMeddpicc: 0, minActivity: 0 },
    };

    return benchmarks[stage] || benchmarks['Discovery'];
  }

  /**
   * Get days to close date
   */
  private getDaysToClose(closeDate: string): number {
    const close = new Date(closeDate);
    const now = new Date();
    const diffTime = close.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format deal data for Gemini API
   */
  private formatDealDataForGemini(dealData: DealParameters): any {
    return {
      stage: dealData.stage,
      amount: dealData.amount,
      companySize: dealData.companySize,
      daysInStage: dealData.daysInStage,
      contactActivity: dealData.contactActivity,
      repNotes: dealData.repNotes,
      closeDate: dealData.closeDate,
      nextSteps: dealData.nextSteps,
      stakeholders: dealData.stakeholders,
      aiScore: dealData.aiScore,
      warnings: dealData.warnings,
      meddpiccPercent: dealData.meddpiccPercent,
      contacts: dealData.contacts,
      activityData: dealData.activityData,
    };
  }

  /**
   * Format knowledge base for Gemini API
   */
  private formatKnowledgeBaseForGemini(knowledgeBase: KnowledgeBaseRule[]): string {
    if (knowledgeBase.length === 0) {
      return 'No knowledge base rules provided.';
    }

    const groupedByStage = knowledgeBase.reduce((acc, rule) => {
      if (!acc[rule.stage]) {
        acc[rule.stage] = [];
      }
      acc[rule.stage].push(rule);
      return acc;
    }, {} as Record<string, KnowledgeBaseRule[]>);

    let context = 'KNOWLEDGE BASE RULES:\n\n';
    
    for (const [stage, stageRules] of Object.entries(groupedByStage)) {
      context += `### ${stage} Stage\n`;
      for (const rule of stageRules) {
        context += `- ${rule.rule} (Weight: ${rule.weight}, Threshold: ${rule.threshold || 'N/A'}, Category: ${rule.category})\n`;
      }
      context += '\n';
    }

    return context;
  }
}

// Export singleton instance
export const aiEvaluationEngine = new AIEvaluationEngine();
