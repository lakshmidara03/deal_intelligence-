export function mapDeal(row: Record<string, any>) {
  const aiScores = (row.ai_scores ?? []).map((score: Record<string, any>) => ({
    id: score.id,
    riskScore: Number(score.risk_score ?? 0),
    healthScore: Number(score.health_score ?? 0),
    score: Number(score.health_score ?? 0),
    suggestedNextStep: score.suggested_next_step,
    explanation: score.explanation,
    positiveSignals: score.positive_signals ?? [],
    negativeSignals: score.negative_signals ?? [],
    scoreDrivers: [...(score.positive_signals ?? []), ...(score.negative_signals ?? [])],
    summary: score.brief_summary,
    buyerSentiment: score.buyer_sentiment,
    whatChanged: score.what_changed,
    modelVersion: score.model_version
  }));
  const warnings = (row.warnings ?? []).map((warning: Record<string, any>) => ({
    id: warning.id,
    code: warning.warning_type,
    title: warning.title,
    severity: String(warning.severity ?? "medium").toUpperCase(),
    explanation: warning.description,
    suggestedMitigation: warning.mitigation,
    ctaAction: warning.cta_action
  }));
  const activities = (row.activities ?? []).map((activity: Record<string, any>) => ({
    id: activity.id,
    type: String(activity.activity_type ?? "note").toUpperCase(),
    subject: activity.subject,
    occurredAt: activity.occurred_at,
    durationMinutes: activity.duration_minutes,
    sentiment: activity.sentiment
  }));
  const playbookItems = (row.playbook_items ?? []).map((item: Record<string, any>) => ({
    id: item.id,
    section: item.category,
    label: item.category,
    completed: item.status === "complete",
    status: item.status,
    aiSuggestion: item.ai_suggestion,
    notes: item.notes ?? ""
  }));
  const crmSyncLogs = (row.crm_sync_logs ?? []).map((log: Record<string, any>) => ({
    id: log.id,
    status: log.sync_status,
    message: log.message,
    createdAt: log.created_at
  }));
  return {
    id: row.id,
    externalId: row.crm_deal_id,
    crmDealId: row.crm_deal_id,
    name: row.deal_name,
    dealName: row.deal_name,
    accountName: row.account_name,
    owner: row.owner_display_name,
    ownerDisplayName: row.owner_display_name,
    stage: row.stage,
    amount: Number(row.value ?? 0),
    value: Number(row.value ?? 0),
    probability: Number(row.probability ?? 0),
    closeDate: row.estimated_close_date,
    estimatedCloseDate: row.estimated_close_date,
    nextStep: row.next_step,
    forecastCategory: row.forecast_category ?? "PIPELINE",
    contactCount: Number(row.contact_count ?? 0),
    activityCount: Number(row.activity_count ?? 0),
    totalCalls: Number(row.total_calls ?? 0),
    totalEmails: Number(row.total_emails ?? 0),
    lastActivityAt: row.last_activity_at,
    daysSinceLastContact: Number(row.days_since_last_contact ?? 0),
    playbookCompletion: Number(row.playbook_completion ?? 0),
    healthScore: Number(row.health_score ?? 0),
    riskScore: Number(row.risk_score ?? 0),
    healthCategory: row.health_category,
    engagementScore: Number(row.engagement_score ?? 0),
    warningState: row.warning_state,
    riskFlagCount: Number(row.risk_flag_count ?? 0),
    aiExplanation: row.ai_explanation,
    aiScores,
    warnings,
    activities,
    contacts: row.contacts ?? [],
    playbookItems,
    crmSyncLogs
  };
}
