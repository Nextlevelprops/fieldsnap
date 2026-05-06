import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aheyxqzdvyctghcuqjlp.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_yEV9axXvyvLEwzhcalh0vg_BcSo5MUx"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
