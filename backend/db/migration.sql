ALTER TABLE deals ADD COLUMN IF NOT EXISTS hubspot_deal_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_hubspot_deal_id ON deals(hubspot_deal_id);
