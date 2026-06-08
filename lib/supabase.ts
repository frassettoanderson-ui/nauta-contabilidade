import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Lead = {
  id?:        string
  nome:       string
  whatsapp:   string
  email:      string
  interesse:  string
  criado_em?: string
}

export async function saveLead(lead: Omit<Lead, 'id' | 'criado_em'>) {
  const { data, error } = await supabase
    .from('leads')
    .insert([{ ...lead, criado_em: new Date().toISOString() }])
    .select()

  if (error) throw error
  return data
}
