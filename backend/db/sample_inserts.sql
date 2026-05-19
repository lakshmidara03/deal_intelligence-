-- No deal seed data is generated. Uploaded Excel rows remain the single source of truth.
-- This script only creates the mock sales rep user and saved board view shells needed by the UI.

INSERT INTO users (full_name, email, role)
VALUES ('Sales Rep', 'sales.rep@example.com', 'sales_rep')
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

INSERT INTO board_views (user_id, board_name, filters, grouping, sorting, visible_columns, is_default)
SELECT
  id,
  'My Deals Board',
  '{"owner":"me","stage_not":"Closed Lost"}',
  '{"field":"stage"}',
  '{"field":"risk_score","direction":"desc"}',
  '["deal_name","account_name","stage","value","health_score","risk_score","warnings","activity","playbook","next_step"]',
  true
FROM users
WHERE email = 'sales.rep@example.com'
ON CONFLICT DO NOTHING;
