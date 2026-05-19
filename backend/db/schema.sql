CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE health_category_enum AS ENUM ('healthy', 'watch', 'risk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE warning_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE warning_state_enum AS ENUM ('none', 'warning', 'risk', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_type_enum AS ENUM ('call', 'email', 'meeting', 'note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_sync_status_enum AS ENUM ('syncing', 'synced', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE playbook_status_enum AS ENUM ('complete', 'missing', 'in_progress');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE source_freshness_enum AS ENUM ('fresh', 'stale', 'partial', 'unavailable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) NOT NULL DEFAULT 'sales_rep',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS uploaded_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  row_count INT NOT NULL DEFAULT 0,
  upload_status VARCHAR(100) NOT NULL DEFAULT 'uploaded',
  validation JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  training_completed BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  dataset_id UUID REFERENCES uploaded_datasets(id) ON DELETE SET NULL,
  crm_deal_id VARCHAR(255) UNIQUE,
  hubspot_deal_id VARCHAR(255),
  account_id VARCHAR(255),
  account_name VARCHAR(255) NOT NULL,
  deal_name VARCHAR(255) NOT NULL,
  owner_user_id UUID REFERENCES users(id),
  owner_display_name VARCHAR(255),
  stage VARCHAR(100),
  stage_order INT DEFAULT 0,
  forecast_category VARCHAR(50) DEFAULT 'PIPELINE',
  value NUMERIC(14,2),
  probability NUMERIC(5,2),
  created_date TIMESTAMP,
  estimated_close_date TIMESTAMP,
  days_in_pipeline INT,
  health_score NUMERIC(5,2),
  risk_score NUMERIC(5,2),
  health_category health_category_enum DEFAULT 'watch',
  engagement_score NUMERIC(5,2),
  risk_flag_count INT DEFAULT 0,
  risk_flag_summary TEXT,
  last_activity_at TIMESTAMP,
  days_since_last_contact INT,
  latest_insight_at TIMESTAMP,
  last_signal_at TIMESTAMP,
  warning_state warning_state_enum DEFAULT 'none',
  source_freshness_state source_freshness_enum DEFAULT 'fresh',
  board_updated_at TIMESTAMP,
  next_step TEXT,
  deal_summary TEXT,
  budget_confirmed BOOLEAN DEFAULT FALSE,
  decision_maker_engaged BOOLEAN DEFAULT FALSE,
  competitor_name VARCHAR(255),
  total_calls INT DEFAULT 0,
  total_emails INT DEFAULT 0,
  last_call_sentiment VARCHAR(100),
  ai_explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_health_score ON deals(health_score);
CREATE INDEX IF NOT EXISTS idx_deals_risk_score ON deals(risk_score);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(estimated_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_warning_state ON deals(warning_state);
CREATE INDEX IF NOT EXISTS idx_deals_dataset ON deals(dataset_id);
CREATE INDEX IF NOT EXISTS idx_deals_board_refresh ON deals(board_updated_at DESC, latest_insight_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_hubspot_deal_id ON deals(hubspot_deal_id);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(255),
  is_decision_maker BOOLEAN DEFAULT FALSE,
  engagement_score NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_deal_id ON contacts(deal_id);

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  activity_type activity_type_enum NOT NULL,
  subject VARCHAR(255),
  description TEXT,
  duration_minutes INT,
  sentiment VARCHAR(100),
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_occurred_at ON activities(occurred_at DESC);

CREATE TABLE IF NOT EXISTS warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  warning_type VARCHAR(255) NOT NULL,
  severity warning_severity_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mitigation TEXT,
  cta_action VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  generated_by VARCHAR(100) DEFAULT 'rule_engine',
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warnings_deal_id ON warnings(deal_id);
CREATE INDEX IF NOT EXISTS idx_warnings_severity ON warnings(severity);
CREATE INDEX IF NOT EXISTS idx_warnings_active ON warnings(deal_id, is_active);

CREATE TABLE IF NOT EXISTS ai_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  risk_score NUMERIC(5,2),
  health_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),
  positive_signals JSONB DEFAULT '[]'::jsonb,
  negative_signals JSONB DEFAULT '[]'::jsonb,
  explanation TEXT,
  suggested_next_step TEXT,
  brief_summary TEXT,
  buyer_sentiment VARCHAR(100),
  what_changed TEXT,
  model_version VARCHAR(100),
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_scores_deal_id ON ai_scores(deal_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_generated_at ON ai_scores(generated_at DESC);

CREATE TABLE IF NOT EXISTS playbook_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  category VARCHAR(255),
  status playbook_status_enum DEFAULT 'missing',
  ai_suggestion TEXT,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playbook_items_deal_id ON playbook_items(deal_id);

CREATE TABLE IF NOT EXISTS crm_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  sync_status crm_sync_status_enum NOT NULL,
  message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_deal_id ON crm_sync_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_created_at ON crm_sync_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS board_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  board_name VARCHAR(255) NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  grouping JSONB DEFAULT '{}'::jsonb,
  sorting JSONB DEFAULT '{}'::jsonb,
  visible_columns JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_board_views_user_id ON board_views(user_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_board_views_updated_at ON board_views;
CREATE TRIGGER trg_board_views_updated_at BEFORE UPDATE ON board_views FOR EACH ROW EXECUTE FUNCTION set_updated_at();
