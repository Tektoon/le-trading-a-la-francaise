import { createClient } from '@supabase/supabase-js'

// 👇 Remplace par tes clés (Supabase → Settings → API)
const SUPABASE_URL  = 'https://vgclzawygodpjupirsyn.supabase.co'
const SUPABASE_ANON = 'sb_publishable_E_YFwcRR9mwJXQTFtN1A2A_ooK_-97E'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
