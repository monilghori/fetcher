import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.DHAN_ACCESS_TOKEN = 'test-access-token'
process.env.DHAN_CLIENT_ID = 'test-client-id'
process.env.CRON_SECRET = 'test-cron-secret'