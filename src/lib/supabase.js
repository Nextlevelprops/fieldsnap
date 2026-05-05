import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aheyxqzdvyctghcuqjlp.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXl4cXpkdnljdGdoY3VxamxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTY4NDgsImV4cCI6MjA5MzE5Mjg0OH0.n2a6TcsMVB6xeFOFhCg_Mnz1VuKAwQChC6mvffjTLJwM"

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars. Copy .env.example to .env.local and fill in your values.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
