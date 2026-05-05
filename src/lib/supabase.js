import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aheyxqzdvyctghcuqjlp.supabase.co"
const SUPABASE_ANON_KEY = "PASTE_KEY_HERE"

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars. Copy .env.example to .env.local and fill in your values.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
