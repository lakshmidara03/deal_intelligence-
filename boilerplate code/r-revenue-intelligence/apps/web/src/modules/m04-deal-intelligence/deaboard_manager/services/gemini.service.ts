/**
 * Google Gemini API Service for AI Evaluation
 * 
 * Uses Google Gemini to analyze deals and generate AI scores and warnings
 * based on the knowledge base and deal parameters.
 */

const GEMINI_API_KEY = 'AIzaSyAmneQW5P187G6leL71W-0BYd864TaGWOo';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface GeminiEvaluationRequest {
  dealData: {
    stage: string;
    amount: number;
    companySize?: string;
    daysInStage?: number;
    contactActivity?: number;
    repNotes?: string;
    closeDate?: string;
    nextSteps?: string;
    stakeholders?: string[];
    aiScore?: number;
    warnings?: number;
    meddpiccPercent?: number;
    contacts?: number;
    activityData?: number[];
  };
  knowledgeBaseContext: string; // Knowledge base rules from Excel
}

export interface GeminiEvaluationResponse {
  ai_score: number;
  ai_score_rationale: string;
  ai_warnings_rep: Array<{
    severity: 'high' | 'medium' | 'low';
    warning: string;
    source: string;
  }>;
  ai_warnings_manager: Array<{
    severity: 'high' | 'medium' | 'low';
    warning: string;
    source: string;
  }>;
  rule_based_warnings: Array<{
    warning: string;
    triggered_by: string;
  }>;
}

/**
 * Call Google Gemini API to evaluate a deal
 */
export async function evaluateDealWithGemini(
  request: GeminiEvaluationRequest
): Promise<GeminiEvaluationResponse> {
  const { dealData, knowledgeBaseContext } = request;

  const prompt = `You are an AI evaluation engine for a B2B sales intelligence platform.

Analyze the following sales deal and return structured predictions: an AI score, AI warnings for the sales rep, and warnings for the sales manager.

## KNOWLEDGE BASE
${knowledgeBaseContext}

## DEAL DATA
- Stage: ${dealData.stage}
- Amount: $${dealData.amount.toLocaleString()}
- Company Size: ${dealData.companySize || 'Unknown'}
- Days in Stage: ${dealData.daysInStage || 'Unknown'}
- Contact Activity: ${dealData.contactActivity || 0}
- Close Date: ${dealData.closeDate || 'Not set'}
- Next Steps: ${dealData.nextSteps || 'Not set'}
- Stakeholders: ${dealData.stakeholders?.join(', ') || 'None'}
- AI Score: ${dealData.aiScore || 0}
- Warnings: ${dealData.warnings || 0}
- MEDDPICC %: ${dealData.meddpiccPercent || 0}
- Contacts: ${dealData.contacts || 0}
- Activity Data: ${dealData.activityData?.join(', ') || 'None'}

## YOUR TASK
Cross-reference the deal data with the knowledge base to produce the following outputs in a single JSON object:
{
  "ai_score": <integer 0–100>,
  "ai_score_rationale": "<2-sentence explanation>",
  "ai_warnings_rep": [
    {
      "severity": "high | medium | low",
      "warning": "<concise, actionable warning for the sales rep>",
      "source": "<which signal triggered this>"
    }
  ],
  "ai_warnings_manager": [
    {
      "severity": "high | medium | low",
      "warning": "<warning with full deal context for the manager>",
      "source": "<signal source>"
    }
  ],
  "rule_based_warnings": [
    {
      "warning": "<deterministic flag based on KB thresholds>",
      "triggered_by": "<specific KB rule or threshold>"
    }
  ]
}

## SCORING RULES
IMPORTANT: The AI score MUST be directly correlated with warnings. If there are warnings, the score MUST be reduced accordingly.

- Score 80–100: Deal is healthy. NO warnings. All signals positive.
- Score 60–79: Minor risks. 1-2 low/medium severity warnings. Most signals positive.
- Score 40–59: Moderate risk. 3+ warnings OR at least 1 high severity warning. Multiple signals misaligned with KB.
- Score 0–39: High risk. Multiple high severity warnings. Deal likely to stall or be lost.

SCORING CALCULATION:
- Start with 100 points
- Deduct 15 points for each HIGH severity warning
- Deduct 8 points for each MEDIUM severity warning
- Deduct 3 points for each LOW severity warning
- Deduct 5 points for each rule-based warning
- If total warnings > 5, additional 10 point penalty
- Ensure final score reflects the actual risk level based on ALL deal parameters

## AUDIENCE RULES
SALES REP WARNINGS:
- Focus only on what the rep can act on RIGHT NOW.
- Be specific and tactical (e.g., "No activity with economic buyer in 14 days — schedule a call this week").
- Max 3 warnings. No score shown.

SALES MANAGER WARNINGS:
- Include the full picture: deal value at risk, stage mismatch, forecast impact.
- Reference KB rules explicitly when flagging.
- Show AI score + all warnings (rep + manager + rule-based).

## OUTPUT FORMAT
Return only valid JSON. No markdown, no preamble, no explanation outside the JSON block.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Parse the JSON response
    const evaluation = JSON.parse(content);
    
    return evaluation;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Fallback to rule-based evaluation
    throw error;
  }
}
