// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: any) => {
  // ... rest of code
  const apiKey = req.headers.get('x-api-key')
  
  // Validate API key against organizations table
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('api_key', apiKey)
    .single()
  
  if (!org || !org.api_access) {
    return new Response(JSON.stringify({error: 'Invalid API key'}), {status: 401})
  }
  
  // Create notice
  const body = await req.json()
  const { error } = await supabase.from('notices').insert({
    org_id: org.id,
    org_name: org.name,
    ...body
  })
  
  return new Response(JSON.stringify({success: true}), {status: 200})
})