-- Create app_settings table to store Dhan credentials and other settings
CREATE TABLE IF NOT EXISTS app_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (credentials will be masked in API)
CREATE POLICY "Allow public read access on settings" ON app_settings
  FOR SELECT
  USING (true);

-- Allow public update access (protected by admin secret in API)
CREATE POLICY "Allow public update on settings" ON app_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Insert default empty credentials if not exists
INSERT INTO app_settings (key, value)
VALUES ('dhan_credentials', '{"access_token": "", "client_id": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Success message
SELECT 'Settings table created successfully!' as status;
