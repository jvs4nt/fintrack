import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️  SUPABASE_URL e chave (SERVICE_ROLE, ANON ou PUBLISHABLE) são necessários para auth.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
