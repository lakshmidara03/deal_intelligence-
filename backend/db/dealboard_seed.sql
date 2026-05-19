CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (id, full_name, email, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'Sales Rep', 'sales.rep@example.com', 'sales_rep')
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();

INSERT INTO uploaded_datasets (id, file_name, row_count, upload_status, validation, metrics, training_completed)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'dealboard_demo_seed.xlsx',
  8,
  'processed',
  '{"source":"manual_seed","validRows":8,"errors":[]}'::jsonb,
  '{"averageRiskScore":47.5,"averageHealthScore":62.5,"commitValue":1340000,"pipelineValue":2875000}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE
SET row_count = EXCLUDED.row_count,
    upload_status = EXCLUDED.upload_status,
    validation = EXCLUDED.validation,
    metrics = EXCLUDED.metrics,
    training_completed = EXCLUDED.training_completed,
    uploaded_at = now();

INSERT INTO board_views (user_id, board_name, filters, grouping, sorting, visible_columns, is_default)
SELECT
  u.id,
  'My Deals Board',
  '{"owner":"me","stage_not":"Closed Lost"}'::jsonb,
  '{"field":"stage"}'::jsonb,
  '{"field":"risk_score","direction":"desc"}'::jsonb,
  '["deal_name","account_name","stage","value","health_score","risk_score","warnings","activity","playbook","next_step"]'::jsonb,
  true
FROM users u
WHERE u.email = 'sales.rep@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM board_views bv
    WHERE bv.user_id = u.id AND bv.board_name = 'My Deals Board'
  );

WITH seed_deals AS (
  SELECT *
  FROM (VALUES
    (
      '33333333-3333-3333-3333-333333333301'::uuid,
      'CRM-DB-1001',
      'Northstar Health',
      'Northstar Health Expansion',
      'Sales Rep',
      'Negotiation',
      2,
      'COMMIT',
      720000.00::numeric,
      78.00::numeric,
      now() - interval '88 days',
      now() + interval '18 days',
      88,
      82.00::numeric,
      23.00::numeric,
      'healthy',
      86.00::numeric,
      1,
      'Legal redlines open but executive sponsor is engaged.',
      now() - interval '1 day',
      1,
      now() - interval '2 hours',
      now() - interval '2 hours',
      'warning',
      'fresh',
      'Send revised MSA and schedule procurement close call.',
      'Expansion opportunity for care coordination analytics across three regions.',
      true,
      true,
      'MediSight',
      12,
      34,
      'positive',
      'Strong champion activity and recent executive engagement offset mild legal risk.'
    ),
    (
      '33333333-3333-3333-3333-333333333302'::uuid,
      'CRM-DB-1002',
      'Apex Manufacturing',
      'Apex Connected Factory Platform',
      'Sales Rep',
      'Proposal',
      1,
      'BEST_CASE',
      940000.00::numeric,
      58.00::numeric,
      now() - interval '61 days',
      now() + interval '31 days',
      61,
      61.00::numeric,
      49.00::numeric,
      'watch',
      62.00::numeric,
      2,
      'Business case is strong, but the economic buyer has not approved budget.',
      now() - interval '5 days',
      5,
      now() - interval '1 day',
      now() - interval '1 day',
      'risk',
      'fresh',
      'Confirm CFO approval path and resend ROI model.',
      'Industrial IoT modernization deal tied to Q2 plant efficiency targets.',
      false,
      false,
      'FactoryOS',
      7,
      18,
      'neutral',
      'Deal can move up with budget confirmation and stronger CFO alignment.'
    ),
    (
      '33333333-3333-3333-3333-333333333303'::uuid,
      'CRM-DB-1003',
      'Summit Bank',
      'Summit Bank Fraud AI Rollout',
      'Sales Rep',
      'Security Review',
      3,
      'PIPELINE',
      1250000.00::numeric,
      42.00::numeric,
      now() - interval '104 days',
      now() + interval '45 days',
      104,
      38.00::numeric,
      76.00::numeric,
      'risk',
      44.00::numeric,
      3,
      'Security review is stalled and competitor is active in the account.',
      now() - interval '14 days',
      14,
      now() - interval '3 days',
      now() - interval '3 days',
      'critical',
      'stale',
      'Book technical unblock session with security architect.',
      'Enterprise fraud detection rollout across cards and digital banking.',
      true,
      false,
      'SentinelEdge',
      5,
      12,
      'negative',
      'Long inactivity, missing security owner, and competitor pressure make this high risk.'
    ),
    (
      '33333333-3333-3333-3333-333333333304'::uuid,
      'CRM-DB-1004',
      'BrightCart Retail',
      'BrightCart Personalization Suite',
      'Sales Rep',
      'Discovery',
      0,
      'PIPELINE',
      480000.00::numeric,
      32.00::numeric,
      now() - interval '24 days',
      now() + interval '67 days',
      24,
      68.00::numeric,
      35.00::numeric,
      'watch',
      70.00::numeric,
      0,
      null,
      now() - interval '2 days',
      2,
      now() - interval '4 hours',
      now() - interval '4 hours',
      'none',
      'fresh',
      'Complete stakeholder map and run value discovery workshop.',
      'Digital merchandising team evaluating personalization and experimentation.',
      false,
      true,
      null,
      4,
      9,
      'positive',
      'Early-stage opportunity with healthy engagement and clear next workshop.'
    ),
    (
      '33333333-3333-3333-3333-333333333305'::uuid,
      'CRM-DB-1005',
      'Cobalt Energy',
      'Cobalt Energy Data Lake Renewal',
      'Sales Rep',
      'Procurement',
      4,
      'COMMIT',
      620000.00::numeric,
      83.00::numeric,
      now() - interval '132 days',
      now() + interval '10 days',
      132,
      74.00::numeric,
      29.00::numeric,
      'healthy',
      79.00::numeric,
      1,
      'Procurement has requested final discount approval.',
      now() - interval '1 day',
      1,
      now() - interval '6 hours',
      now() - interval '6 hours',
      'warning',
      'fresh',
      'Approve discount guardrail and send final order form.',
      'Renewal and expansion for data lake observability across upstream teams.',
      true,
      true,
      null,
      10,
      27,
      'positive',
      'Late-stage renewal with active procurement and strong usage signals.'
    ),
    (
      '33333333-3333-3333-3333-333333333306'::uuid,
      'CRM-DB-1006',
      'NovaEd Labs',
      'NovaEd Learning Cloud',
      'Sales Rep',
      'Solution Fit',
      1,
      'BEST_CASE',
      400000.00::numeric,
      52.00::numeric,
      now() - interval '47 days',
      now() + interval '38 days',
      47,
      57.00::numeric,
      53.00::numeric,
      'watch',
      51.00::numeric,
      2,
      'Champion changed roles; new admin needs onboarding.',
      now() - interval '8 days',
      8,
      now() - interval '2 days',
      now() - interval '2 days',
      'risk',
      'partial',
      'Rebuild champion plan and confirm technical success criteria.',
      'Learning platform consolidation for professional certification programs.',
      true,
      false,
      'EduStack',
      6,
      14,
      'neutral',
      'Medium risk because champion coverage and decision criteria need repair.'
    ),
    (
      '33333333-3333-3333-3333-333333333307'::uuid,
      'CRM-DB-1007',
      'Harbor Logistics',
      'Harbor Logistics Routing Optimization',
      'Sales Rep',
      'Demo Completed',
      1,
      'PIPELINE',
      690000.00::numeric,
      46.00::numeric,
      now() - interval '35 days',
      now() + interval '52 days',
      35,
      71.00::numeric,
      31.00::numeric,
      'healthy',
      76.00::numeric,
      0,
      null,
      now() - interval '3 days',
      3,
      now() - interval '12 hours',
      now() - interval '12 hours',
      'none',
      'fresh',
      'Send pilot plan and confirm success metrics.',
      'Route optimization pilot for regional fleet dispatch and fuel savings.',
      false,
      true,
      null,
      5,
      11,
      'positive',
      'Strong demo response and clear pilot path keep this deal healthy.'
    ),
    (
      '33333333-3333-3333-3333-333333333308'::uuid,
      'CRM-DB-1008',
      'Vertex Media',
      'Vertex Media Revenue Intelligence',
      'Sales Rep',
      'Qualification',
      0,
      'PIPELINE',
      455000.00::numeric,
      25.00::numeric,
      now() - interval '19 days',
      now() + interval '74 days',
      19,
      46.00::numeric,
      67.00::numeric,
      'risk',
      38.00::numeric,
      2,
      'Low engagement and no confirmed business pain.',
      now() - interval '11 days',
      11,
      now() - interval '5 days',
      now() - interval '5 days',
      'risk',
      'stale',
      'Run requalification call or move out of active pipeline.',
      'Revenue intelligence evaluation for ad sales forecasting.',
      false,
      false,
      'ForecastIQ',
      2,
      5,
      'negative',
      'Weak engagement and vague pain suggest requalification is needed.'
    )
  ) AS v (
    id, crm_deal_id, account_name, deal_name, owner_display_name, stage, stage_order,
    forecast_category, value, probability, created_date, estimated_close_date, days_in_pipeline,
    health_score, risk_score, health_category, engagement_score, risk_flag_count, risk_flag_summary,
    last_activity_at, days_since_last_contact, latest_insight_at, last_signal_at, warning_state,
    source_freshness_state, next_step, deal_summary, budget_confirmed, decision_maker_engaged,
    competitor_name, total_calls, total_emails, last_call_sentiment, ai_explanation
  )
)
INSERT INTO deals (
  id, dataset_id, crm_deal_id, account_name, deal_name, owner_user_id, owner_display_name,
  stage, stage_order, forecast_category, value, probability, created_date, estimated_close_date,
  days_in_pipeline, health_score, risk_score, health_category, engagement_score, risk_flag_count,
  risk_flag_summary, last_activity_at, days_since_last_contact, latest_insight_at, last_signal_at,
  warning_state, source_freshness_state, board_updated_at, next_step, deal_summary,
  budget_confirmed, decision_maker_engaged, competitor_name, total_calls, total_emails,
  last_call_sentiment, ai_explanation
)
SELECT
  sd.id,
  '22222222-2222-2222-2222-222222222222',
  sd.crm_deal_id,
  sd.account_name,
  sd.deal_name,
  u.id,
  sd.owner_display_name,
  sd.stage,
  sd.stage_order,
  sd.forecast_category,
  sd.value,
  sd.probability,
  sd.created_date,
  sd.estimated_close_date,
  sd.days_in_pipeline,
  sd.health_score,
  sd.risk_score,
  sd.health_category::health_category_enum,
  sd.engagement_score,
  sd.risk_flag_count,
  sd.risk_flag_summary,
  sd.last_activity_at,
  sd.days_since_last_contact,
  sd.latest_insight_at,
  sd.last_signal_at,
  sd.warning_state::warning_state_enum,
  sd.source_freshness_state::source_freshness_enum,
  now(),
  sd.next_step,
  sd.deal_summary,
  sd.budget_confirmed,
  sd.decision_maker_engaged,
  sd.competitor_name,
  sd.total_calls,
  sd.total_emails,
  sd.last_call_sentiment,
  sd.ai_explanation
FROM seed_deals sd
CROSS JOIN users u
WHERE u.email = 'sales.rep@example.com'
ON CONFLICT (crm_deal_id) DO UPDATE
SET account_name = EXCLUDED.account_name,
    deal_name = EXCLUDED.deal_name,
    owner_user_id = EXCLUDED.owner_user_id,
    owner_display_name = EXCLUDED.owner_display_name,
    stage = EXCLUDED.stage,
    stage_order = EXCLUDED.stage_order,
    forecast_category = EXCLUDED.forecast_category,
    value = EXCLUDED.value,
    probability = EXCLUDED.probability,
    estimated_close_date = EXCLUDED.estimated_close_date,
    health_score = EXCLUDED.health_score,
    risk_score = EXCLUDED.risk_score,
    health_category = EXCLUDED.health_category,
    engagement_score = EXCLUDED.engagement_score,
    risk_flag_count = EXCLUDED.risk_flag_count,
    risk_flag_summary = EXCLUDED.risk_flag_summary,
    last_activity_at = EXCLUDED.last_activity_at,
    days_since_last_contact = EXCLUDED.days_since_last_contact,
    latest_insight_at = EXCLUDED.latest_insight_at,
    last_signal_at = EXCLUDED.last_signal_at,
    warning_state = EXCLUDED.warning_state,
    source_freshness_state = EXCLUDED.source_freshness_state,
    board_updated_at = now(),
    next_step = EXCLUDED.next_step,
    deal_summary = EXCLUDED.deal_summary,
    budget_confirmed = EXCLUDED.budget_confirmed,
    decision_maker_engaged = EXCLUDED.decision_maker_engaged,
    competitor_name = EXCLUDED.competitor_name,
    total_calls = EXCLUDED.total_calls,
    total_emails = EXCLUDED.total_emails,
    last_call_sentiment = EXCLUDED.last_call_sentiment,
    ai_explanation = EXCLUDED.ai_explanation;

WITH seeded AS (
  SELECT id FROM deals WHERE crm_deal_id LIKE 'CRM-DB-100%'
)
DELETE FROM contacts WHERE deal_id IN (SELECT id FROM seeded);

WITH seeded AS (
  SELECT id FROM deals WHERE crm_deal_id LIKE 'CRM-DB-100%'
)
DELETE FROM activities WHERE deal_id IN (SELECT id FROM seeded);

WITH seeded AS (
  SELECT id FROM deals WHERE crm_deal_id LIKE 'CRM-DB-100%'
)
DELETE FROM warnings WHERE deal_id IN (SELECT id FROM seeded);

WITH seeded AS (
  SELECT id FROM deals WHERE crm_deal_id LIKE 'CRM-DB-100%'
)
DELETE FROM ai_scores WHERE deal_id IN (SELECT id FROM seeded);

WITH seeded AS (
  SELECT id FROM deals WHERE crm_deal_id LIKE 'CRM-DB-100%'
)
DELETE FROM playbook_items WHERE deal_id IN (SELECT id FROM seeded);

WITH seeded AS (
  SELECT id FROM deals WHERE crm_deal_id LIKE 'CRM-DB-100%'
)
DELETE FROM crm_sync_logs WHERE deal_id IN (SELECT id FROM seeded);

INSERT INTO contacts (deal_id, name, email, role, is_decision_maker, engagement_score)
SELECT d.id, c.name, c.email, c.role, c.is_decision_maker, c.engagement_score
FROM deals d
JOIN (VALUES
  ('CRM-DB-1001', 'Priya Shah', 'priya.shah@northstar.example', 'VP Operations', true, 92.00::numeric),
  ('CRM-DB-1001', 'Arun Mehta', 'arun.mehta@northstar.example', 'Procurement Lead', false, 71.00::numeric),
  ('CRM-DB-1002', 'Maya Rao', 'maya.rao@apex.example', 'Plant Director', true, 68.00::numeric),
  ('CRM-DB-1002', 'Chris Patel', 'chris.patel@apex.example', 'Finance Manager', false, 44.00::numeric),
  ('CRM-DB-1003', 'Elena Morris', 'elena.morris@summit.example', 'Fraud Program Lead', false, 52.00::numeric),
  ('CRM-DB-1003', 'Jon Becker', 'jon.becker@summit.example', 'Security Architect', false, 29.00::numeric),
  ('CRM-DB-1004', 'Rita Nair', 'rita.nair@brightcart.example', 'Director of Ecommerce', true, 78.00::numeric),
  ('CRM-DB-1005', 'Dev Khanna', 'dev.khanna@cobalt.example', 'Data Platform VP', true, 84.00::numeric),
  ('CRM-DB-1006', 'Sophia Lim', 'sophia.lim@novaed.example', 'Learning Ops Lead', false, 55.00::numeric),
  ('CRM-DB-1007', 'Mateo Cruz', 'mateo.cruz@harbor.example', 'Fleet Operations Head', true, 80.00::numeric),
  ('CRM-DB-1008', 'Nina Kapoor', 'nina.kapoor@vertex.example', 'RevOps Manager', false, 35.00::numeric)
) AS c(crm_deal_id, name, email, role, is_decision_maker, engagement_score)
  ON c.crm_deal_id = d.crm_deal_id;

INSERT INTO activities (deal_id, activity_type, subject, description, duration_minutes, sentiment, occurred_at)
SELECT d.id, a.activity_type::activity_type_enum, a.subject, a.description, a.duration_minutes, a.sentiment, a.occurred_at
FROM deals d
JOIN (VALUES
  ('CRM-DB-1001', 'meeting', 'Executive sponsor close plan', 'Confirmed close criteria and procurement timeline.', 45, 'positive', now() - interval '1 day'),
  ('CRM-DB-1001', 'email', 'MSA redlines follow-up', 'Sent consolidated legal response.', null, 'neutral', now() - interval '2 days'),
  ('CRM-DB-1002', 'call', 'ROI model review', 'Reviewed payback model with plant director.', 30, 'positive', now() - interval '5 days'),
  ('CRM-DB-1003', 'email', 'Security review reminder', 'Requested security unblock session.', null, 'negative', now() - interval '14 days'),
  ('CRM-DB-1004', 'meeting', 'Personalization discovery', 'Mapped ecommerce conversion goals.', 50, 'positive', now() - interval '2 days'),
  ('CRM-DB-1005', 'call', 'Procurement discount review', 'Discussed final commercial guardrails.', 25, 'positive', now() - interval '1 day'),
  ('CRM-DB-1006', 'meeting', 'Admin handoff', 'New admin asked for implementation requirements.', 40, 'neutral', now() - interval '8 days'),
  ('CRM-DB-1007', 'meeting', 'Routing optimization demo', 'Demo landed well; pilot metrics drafted.', 55, 'positive', now() - interval '3 days'),
  ('CRM-DB-1008', 'call', 'Qualification check-in', 'Prospect could not confirm priority or timeline.', 20, 'negative', now() - interval '11 days')
) AS a(crm_deal_id, activity_type, subject, description, duration_minutes, sentiment, occurred_at)
  ON a.crm_deal_id = d.crm_deal_id;

INSERT INTO warnings (deal_id, warning_type, severity, title, description, mitigation, cta_action, generated_by)
SELECT d.id, w.warning_type, w.severity::warning_severity_enum, w.title, w.description, w.mitigation, w.cta_action, 'seed_engine'
FROM deals d
JOIN (VALUES
  ('CRM-DB-1001', 'legal_redlines', 'medium', 'Legal Redlines Open', 'MSA changes remain unresolved with close date approaching.', 'Send revised language and request same-day legal review.', 'Send revised MSA'),
  ('CRM-DB-1002', 'budget_unconfirmed', 'high', 'Budget Not Confirmed', 'Economic buyer approval is not documented.', 'Confirm CFO approval path and attach ROI model.', 'Confirm budget path'),
  ('CRM-DB-1003', 'stalled_security_review', 'critical', 'Security Review Stalled', 'No security owner response in 14 days.', 'Schedule technical unblock with security architect and champion.', 'Book unblock session'),
  ('CRM-DB-1003', 'competitor_active', 'high', 'Competitor Active', 'SentinelEdge is active and influencing technical criteria.', 'Re-anchor differentiation and document decision criteria.', 'Update competitive plan'),
  ('CRM-DB-1005', 'discount_approval', 'medium', 'Discount Approval Pending', 'Procurement needs final discount approval before order form.', 'Approve guardrail or offer phased close option.', 'Approve discount'),
  ('CRM-DB-1006', 'champion_gap', 'high', 'Champion Gap', 'Original champion changed roles and new admin is not enabled.', 'Rebuild champion plan with new admin and executive sponsor.', 'Rebuild champion plan'),
  ('CRM-DB-1008', 'weak_engagement', 'high', 'Weak Engagement', 'Low activity and unclear business pain put the deal at risk.', 'Run a requalification call and confirm measurable pain.', 'Requalify deal')
) AS w(crm_deal_id, warning_type, severity, title, description, mitigation, cta_action)
  ON w.crm_deal_id = d.crm_deal_id;

INSERT INTO ai_scores (
  deal_id, risk_score, health_score, confidence_score, positive_signals, negative_signals,
  explanation, suggested_next_step, brief_summary, buyer_sentiment, what_changed, model_version
)
SELECT
  d.id,
  d.risk_score,
  d.health_score,
  88.00,
  CASE
    WHEN d.health_category = 'healthy' THEN '["recent engagement","clear next step","active stakeholder"]'::jsonb
    ELSE '["defined opportunity","seller-owned next step"]'::jsonb
  END,
  CASE
    WHEN d.warning_state IN ('risk','critical') THEN '["risk warning active","missing buyer evidence"]'::jsonb
    ELSE '["minor execution risk"]'::jsonb
  END,
  d.ai_explanation,
  d.next_step,
  d.deal_summary,
  d.last_call_sentiment,
  'Seeded board projection updated risk, health, and warning state.',
  'seed-v1'
FROM deals d
WHERE d.crm_deal_id LIKE 'CRM-DB-100%';

INSERT INTO playbook_items (deal_id, category, status, ai_suggestion, notes)
SELECT d.id, p.category, p.status::playbook_status_enum, p.ai_suggestion, p.notes
FROM deals d
CROSS JOIN (VALUES
  ('Metrics', 'complete', 'Confirm measurable business outcome and quantify value.', 'Primary metric captured.'),
  ('Economic Buyer', 'missing', 'Identify or re-confirm the economic buyer.', ''),
  ('Decision Criteria', 'in_progress', 'Document must-have decision criteria and competitors.', 'Draft criteria in progress.'),
  ('Decision Process', 'in_progress', 'Map approval sequence and legal/procurement dependencies.', ''),
  ('Champion', 'complete', 'Validate champion power and mutual action plan ownership.', 'Champion engaged.'),
  ('Competition', 'missing', 'Capture named competitor and differentiation plan.', '')
) AS p(category, status, ai_suggestion, notes)
WHERE d.crm_deal_id LIKE 'CRM-DB-100%';

INSERT INTO crm_sync_logs (deal_id, sync_status, message, payload, synced_at)
SELECT
  d.id,
  'synced'::crm_sync_status_enum,
  'Seeded demo deal synced to local deal board.',
  jsonb_build_object('crmDealId', d.crm_deal_id, 'source', 'dealboard_seed'),
  now()
FROM deals d
WHERE d.crm_deal_id LIKE 'CRM-DB-100%';
